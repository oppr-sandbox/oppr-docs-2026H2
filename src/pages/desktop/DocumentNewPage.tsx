// DocumentNewPage
//
// Entry point for "New document". Two modes (selected by `?kind=`):
//
//   • TipTap (default)    — metadata form + a small inline editor for the
//                           initial body. Submit creates the document, publishes
//                           v1, extracts chunks, and navigates to /docs/:id/edit.
//
//   • PDF (?kind=pdf)     — drop-zone + same metadata form. Submit parses the
//                           PDF locally with pdfjs-dist (page count + per-page
//                           text), inserts a `pdf_blobs` row, creates the
//                           document, publishes v1 referencing the blob, and
//                           extracts page-level chunks.
//
// Both flows reuse `MetadataPanel` + `validateMetadata`.

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "wouter"
import { toast } from "sonner"
import { Upload, FileText, X } from "lucide-react"
import * as pdfjs from "pdfjs-dist"
// Vite-native worker import: bundler emits the worker file and gives us a URL.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import {
  useDb,
  createDocument,
  publishVersion,
  insertPdf,
  updatePageCount,
  getCurrentUser,
  insertMany as insertChunks,
} from "@/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DocumentEditor } from "@/components/docs/DocumentEditor"
import {
  MetadataPanel,
  validateMetadata,
  type MetadataValue,
} from "@/components/docs/MetadataPanel"
import {
  buildChunkRows,
  chunksFromPdfPages,
  chunksFromTipTap,
} from "@/components/docs/chunking"
import { templateForType } from "@/components/docs/DocumentTemplates"
import type { DocumentType } from "@/types"

// Configure pdfjs worker once.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] }

function defaultMetadata(ownerId: string): MetadataValue {
  return {
    title: "",
    type: "sop" as DocumentType,
    ownerId,
    tags: [],
    assetIds: [],
    namingCode: "",
  }
}

/**
 * Treat the body as "still the starter template" if it matches one of the
 * built-in skeletons or is the empty doc. We use this to swap templates on
 * type-change without clobbering real edits — once the user has typed
 * anything substantive, we leave the body alone.
 */
function isUntouchedTemplateBody(body: unknown): boolean {
  if (body === EMPTY_DOC) return true
  try {
    const json = JSON.stringify(body)
    if (json === JSON.stringify(EMPTY_DOC)) return true
    for (const t of ["sop", "manual", "work_instruction", "lmra"] as DocumentType[]) {
      if (json === JSON.stringify(templateForType(t))) return true
    }
  } catch {
    // Non-serialisable bodies are treated as "touched" for safety.
  }
  return false
}

function useQueryParam(key: string): string | null {
  const [value, setValue] = useState<string | null>(() =>
    new URL(window.location.href).searchParams.get(key),
  )
  useEffect(() => {
    function update() {
      setValue(new URL(window.location.href).searchParams.get(key))
    }
    window.addEventListener("popstate", update)
    return () => window.removeEventListener("popstate", update)
  }, [key])
  return value
}

export function DocumentNewPage() {
  const { db, ready } = useDb()
  const [, setLocation] = useLocation()
  const kind = useQueryParam("kind") === "pdf" ? "pdf" : "tiptap"

  const ownerId = useMemo(() => {
    if (!db) return ""
    return getCurrentUser(db)?.id ?? "user-engineer"
  }, [db])

  const [meta, setMeta] = useState<MetadataValue>(() => defaultMetadata(""))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [body, setBody] = useState<unknown>(() =>
    kind === "tiptap" ? templateForType("sop") : EMPTY_DOC,
  )
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPreview, setPdfPreview] = useState<{ pages: number; bytes: Uint8Array } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialise ownerId once db ready.
  useEffect(() => {
    if (ownerId && !meta.ownerId) {
      setMeta((m) => ({ ...m, ownerId }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId])

  // Type → template: replace the body skeleton when the user picks a
  // different doc type, but only while the body is still the starter
  // template (don't clobber real edits).
  useEffect(() => {
    if (kind !== "tiptap") return
    if (!isUntouchedTemplateBody(body)) return
    const next = templateForType(meta.type)
    if (next) setBody(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.type, kind])

  // --- PDF parsing ----------------------------------------------------------

  async function handlePdfFile(file: File) {
    setPdfFile(file)
    try {
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise
      setPdfPreview({ pages: pdf.numPages, bytes })
      // Default the doc title to the filename (sans extension) if blank.
      if (!meta.title) {
        const base = file.name.replace(/\.pdf$/i, "")
        setMeta((m) => ({ ...m, title: base }))
      }
    } catch (err) {
      console.error("PDF parse failed", err)
      toast.error("Could not read that PDF")
      setPdfFile(null)
      setPdfPreview(null)
    }
  }

  async function extractPdfText(bytes: Uint8Array): Promise<string[]> {
    const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      // Each item has `str`. Concatenate with spaces; rely on \n at line ends
      // when sourced from the PDF; otherwise spaces are fine for chunking.
      const text = content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" ")
      pages.push(text)
    }
    return pages
  }

  // --- Submit ---------------------------------------------------------------

  async function submit() {
    if (!db) return
    const validation = validateMetadata(meta)
    if (kind === "pdf" && !pdfPreview) {
      toast.error("Drop a PDF file first")
      return
    }
    if (!validation.ok) {
      setErrors(validation.errors)
      toast.error("Please fix the metadata errors")
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      // 1. Create the document row (current_version = 0).
      const created = createDocument(db, {
        naming_code: meta.namingCode,
        title: meta.title.trim(),
        type: meta.type,
        status: "draft",
        owner_id: meta.ownerId,
        tags: meta.tags,
        assetIds: meta.assetIds,
      })

      if (kind === "pdf") {
        if (!pdfPreview || !pdfFile) throw new Error("PDF missing")
        // 2. Insert the blob.
        const blob = insertPdf(db, {
          filename: pdfFile.name,
          bytes: pdfPreview.bytes,
          page_count: pdfPreview.pages,
        })
        // 3. Publish v1 referencing the blob.
        const version = publishVersion(db, created.id, {
          kind: "pdf",
          blobId: blob.id,
        })
        // 4. Extract per-page text and chunks.
        const pages = await extractPdfText(pdfPreview.bytes)
        updatePageCount(db, blob.id, pages.length)
        const raw = chunksFromPdfPages(pages)
        const rows = buildChunkRows(created.id, version.version, raw)
        if (rows.length) insertChunks(db, rows)
        toast.success(`Imported ${pdfFile.name}`)
        setLocation(`/docs/${created.id}`)
      } else {
        // TipTap: publish v1 with the JSON body.
        const version = publishVersion(db, created.id, {
          kind: "tiptap",
          json: body,
        })
        const raw = chunksFromTipTap(body)
        const rows = buildChunkRows(created.id, version.version, raw)
        if (rows.length) insertChunks(db, rows)
        toast.success("Document created")
        setLocation(`/docs/${created.id}/edit`)
      }
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Render ---------------------------------------------------------------

  if (!ready || !db) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading database…</div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div>
          <h1 className="text-base font-semibold">
            New {kind === "pdf" ? "PDF import" : "document"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {kind === "pdf"
              ? "Drop a PDF, set metadata, and publish v1"
              : "Compose the body, set metadata, and publish v1"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(kind === "pdf" ? "/docs/new" : "/docs/new?kind=pdf")}
          >
            Switch to {kind === "pdf" ? "blank doc" : "PDF import"}
          </Button>
          <Button onClick={submit} disabled={submitting} size="sm">
            {submitting ? "Saving…" : kind === "pdf" ? "Import PDF" : "Create document"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {kind === "pdf" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Source PDF
                </CardTitle>
                <CardDescription>
                  Parsed locally — bytes are stored in the in-browser SQLite blob.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdfPreview && pdfFile ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{pdfFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pdfPreview.pages} page{pdfPreview.pages === 1 ? "" : "s"} •{" "}
                          {(pdfPreview.bytes.byteLength / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPdfFile(null)
                        setPdfPreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="pdf-file"
                    className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20 transition-colors hover:bg-muted/40"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">Drop a PDF or click to choose</span>
                    <span className="text-xs text-muted-foreground">application/pdf only</span>
                  </label>
                )}
                <input
                  id="pdf-file"
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handlePdfFile(f)
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Body</CardTitle>
                <CardDescription>
                  Get started here — you can keep editing after creation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentEditor
                  content={body}
                  onChange={(json) => setBody(json)}
                  placeholder="Write the first paragraph…"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <MetadataPanel value={meta} onChange={setMeta} errors={errors} />
        </div>
      </div>
    </div>
  )
}
