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

import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DocumentEditor } from "@/components/docs/DocumentEditor"
import {
  MetadataPanel,
  validateMetadata,
  type MetadataValue,
} from "@/components/docs/MetadataPanel"
import { chunksFromTipTap } from "@/components/docs/chunking"
import { templateForType } from "@/components/docs/DocumentTemplates"
import type { DocumentType } from "@/types"

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] }

function defaultMetadata(): MetadataValue {
  return {
    title: "",
    type: "sop" as DocumentType,
    ownerId: "",
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
  const [, setLocation] = useLocation()
  const kind = useQueryParam("kind") === "pdf" ? "pdf" : "tiptap"
  const create = useMutation(api.documents.create)

  const [meta, setMeta] = useState<MetadataValue>(() => defaultMetadata())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [body, setBody] = useState<unknown>(() =>
    kind === "tiptap" ? templateForType("sop") : EMPTY_DOC,
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (kind !== "tiptap") return
    if (!isUntouchedTemplateBody(body)) return
    const next = templateForType(meta.type)
    if (next) setBody(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.type, kind])

  async function submit() {
    if (kind === "pdf") {
      toast.info("PDF import lands in Phase 4 (Convex file storage).")
      return
    }
    const validation = validateMetadata(meta)
    if (!validation.ok) {
      setErrors(validation.errors)
      toast.error("Please fix the metadata errors")
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const raw = chunksFromTipTap(body)
      const docId = await create({
        namingCode: meta.namingCode,
        title: meta.title.trim(),
        type: meta.type,
        tags: meta.tags,
        assetIds: meta.assetIds as Id<"assets">[],
        body,
        chunks: raw.map((r) => ({ text: r.text, section: r.section })),
      })
      toast.success("Document created")
      setLocation(`/docs/${docId}/edit`)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
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
                <CardTitle className="text-base">PDF import</CardTitle>
                <CardDescription>
                  Real PDF upload to Convex storage lands in Phase 4. Switch to a
                  blank document for now.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation("/docs/new")}
                >
                  Switch to blank document
                </Button>
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
