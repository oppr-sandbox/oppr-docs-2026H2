// Publish-to-PDF dialog — toggles + Preview/Download.
//
// Loads the document + version + assets via the repos, renders a print HTML
// document, opens it in a new window. The user prints to PDF from there
// (the popup has its own toolbar with Print + Close buttons).

import { useMemo, useState } from "react"
import { FileDown, Eye, Loader2, Sparkles } from "lucide-react"
import * as pdfjs from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { toLegacyAsset, toLegacyDoc } from "@/lib/convex-adapters"
import { walkBodyImages } from "../../../convex/lib/imageWalker"
import { walkBodyRefs } from "@/lib/bodyRefs"
import { extractPpeItems } from "@/components/docs/DocumentHero"
import {
  buildPrintDoc,
  DEFAULT_PDF_OPTIONS,
  type PdfExportOptions,
} from "@/lib/pdf-export/buildPrintDoc"
import { openPrintWindow } from "@/lib/pdf-export/openPrintWindow"
import { toast } from "sonner"

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

// Max PDF pages we rasterise into an export. Beyond this we cap to keep memory
// and print time sane.
const MAX_PDF_PAGES = 20

interface PublishToPdfDialogProps {
  documentId: string
  /** Optional trigger; omit when driving `open` from the parent. */
  trigger?: React.ReactNode
  /** Controlled open state (e.g. so the edit page can save first). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PublishToPdfDialog({
  documentId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: PublishToPdfDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_PDF_OPTIONS)
  const [preparing, setPreparing] = useState(false)

  const docResult = useQuery(
    api.documents.getWithAssets,
    open ? { id: documentId as Id<"documents"> } : "skip",
  )
  const versionResult = useQuery(
    api.documents.getServingVersion,
    open ? { documentId: documentId as Id<"documents"> } : "skip",
  )
  const versionsList = useQuery(
    api.documents.listVersions,
    open ? { documentId: documentId as Id<"documents"> } : "skip",
  )
  const allDocs = useQuery(api.documents.list, open ? {} : "skip")

  const resolved = useMemo(() => {
    if (!docResult || !versionResult) return null
    const doc = {
      ...toLegacyDoc(docResult.doc),
      assets: docResult.assets.map(toLegacyAsset),
    }
    const version = {
      id: versionResult._id,
      document_id: versionResult.documentId,
      version: versionResult.version,
      body_kind: versionResult.bodyKind,
      body_json: versionResult.bodyJson,
      pdf_blob_id: versionResult.pdfStorageId,
      published_at: new Date(versionResult.publishedAt).toISOString(),
    }
    const ppeOnDoc =
      version.body_kind === "tiptap" ? extractPpeItems(version.body_json) : []
    return { doc, version, owner: null, ppeOnDoc }
  }, [docResult, versionResult])

  const imageIds = useMemo<Id<"images">[]>(() => {
    if (!resolved || resolved.version.body_kind !== "tiptap") return []
    const refs = walkBodyImages(resolved.version.body_json)
    const ids = new Set<string>()
    for (const r of refs) if (r.imageId) ids.add(r.imageId)
    return Array.from(ids) as Id<"images">[]
  }, [resolved])

  const imageUrlMap = useQuery(
    api.images.urlsFor,
    open && imageIds.length > 0 ? { ids: imageIds } : "skip",
  )

  // referenceDoc id → title, resolved from the document list (chip labels may
  // be code-only and are never trusted for the title column).
  const refTitleById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const d of allDocs ?? []) map[d._id] = d.title
    return map
  }, [allDocs])

  // pdfAttachment storage ids present in the body.
  const pdfStorageIds = useMemo<Id<"_storage">[]>(() => {
    if (!resolved || resolved.version.body_kind !== "tiptap") return []
    const ids = new Set<string>()
    const visit = (n: unknown) => {
      if (!n || typeof n !== "object") return
      const node = n as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }
      if (node.type === "pdfAttachment" && node.attrs?.storageId) {
        ids.add(String(node.attrs.storageId))
      }
      if (Array.isArray(node.content)) node.content.forEach(visit)
    }
    visit(resolved.version.body_json)
    return Array.from(ids) as Id<"_storage">[]
  }, [resolved])

  const pdfUrlMap = useQuery(
    api.files.getUrls,
    open && pdfStorageIds.length > 0 ? { ids: pdfStorageIds } : "skip",
  )

  // Rasterise every embedded PDF's pages into data URLs so they render in the
  // export. Page-capped; failures fall back to the attachment note.
  async function rasterisePdfs(): Promise<Record<string, string[]>> {
    if (pdfStorageIds.length === 0 || !pdfUrlMap) return {}
    const out: Record<string, string[]> = {}
    for (const sid of pdfStorageIds) {
      const url = pdfUrlMap[sid]
      if (!url) continue
      try {
        const pdf = await pdfjs.getDocument({ url }).promise
        const count = Math.min(pdf.numPages, MAX_PDF_PAGES)
        const pages: string[] = []
        for (let i = 1; i <= count; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext("2d")
          if (!ctx) continue
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          pages.push(canvas.toDataURL("image/jpeg", 0.72))
        }
        out[sid] = pages
      } catch (err) {
        console.error("PDF rasterise failed", err)
      }
    }
    return out
  }

  function buildHtml(pdfPagesByStorageId: Record<string, string[]>): string | null {
    if (!resolved) return null
    if (resolved.version.body_kind === "pdf") {
      toast.error(
        "Legacy PDF-backed documents can't be re-exported. Open the PDF and use the browser's Save-as.",
      )
      return null
    }
    return buildPrintDoc({
      doc: resolved.doc,
      version: resolved.version,
      assets: resolved.doc.assets,
      owner: resolved.owner,
      options,
      ppeOnDoc: resolved.ppeOnDoc,
      imageUrlMap: imageUrlMap ?? undefined,
      versions: versionsList
        ? versionsList.map((v) => ({ version: v.version, publishedAt: v.publishedAt }))
        : undefined,
      refTitleById,
      pdfPagesByStorageId,
    })
  }

  async function openExport(autoPrint: boolean) {
    setPreparing(true)
    try {
      const pages = await rasterisePdfs()
      const html = buildHtml(pages)
      if (!html) return
      const finalHtml = autoPrint
        ? html.replace(
            "</body>",
            `<script>window.addEventListener('load', function () { setTimeout(function () { window.print() }, 350) })</script></body>`,
          )
        : html
      const win = openPrintWindow(finalHtml)
      if (!win) {
        toast.error("Couldn't open the window. Check your popup blocker.")
        return
      }
      setOpen(false)
    } finally {
      setPreparing(false)
    }
  }

  const estimatedPages = estimatePageCount(resolved?.version.body_json, options)
  const busy = preparing || (pdfStorageIds.length > 0 && pdfUrlMap === undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-orange-600" />
            Publish to PDF
          </DialogTitle>
          <DialogDescription>
            Builds a controlled PDF from the saved version. Recurring header,
            footer, and the controlled-copy stamp are always included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <OptionGroup title="Cover & structure">
            <ToggleRow
              id="title-page"
              label="Title page"
              sublabel="Cover with type, code, owner, dates, PPE."
              value={options.titlePage}
              onChange={(v) => setOptions((o) => ({ ...o, titlePage: v }))}
            />
            <ToggleRow
              id="rev-block"
              label="Revision history"
              sublabel="Version table, generated from publish history."
              value={options.revisionBlock}
              onChange={(v) => setOptions((o) => ({ ...o, revisionBlock: v }))}
            />
          </OptionGroup>

          <OptionGroup title="Appendices">
            <ToggleRow
              id="asset-list"
              label="Linked-machine list"
              sublabel="Every machine referenced in the body."
              value={options.assetList}
              onChange={(v) => setOptions((o) => ({ ...o, assetList: v }))}
            />
            <ToggleRow
              id="references-block"
              label="References table"
              sublabel="Built from the reference-document chips in the body."
              value={options.referencesBlock}
              onChange={(v) => setOptions((o) => ({ ...o, referencesBlock: v }))}
            />
            {pdfStorageIds.length > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
                <FileDown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {pdfStorageIds.length} embedded PDF
                  {pdfStorageIds.length === 1 ? "" : "s"} will be rendered into
                  the export (up to {MAX_PDF_PAGES} pages each).
                </span>
              </div>
            )}
          </OptionGroup>

          <div>
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Watermark
            </Label>
            <RadioGroup
              className="mt-1.5 grid grid-cols-2 gap-1.5"
              value={options.watermark}
              onValueChange={(v) =>
                setOptions((o) => ({ ...o, watermark: v as PdfExportOptions["watermark"] }))
              }
            >
              <WmOption value="none" label="None" />
              <WmOption value="controlled" label="Controlled copy" />
              <WmOption value="draft" label="Draft" />
              <WmOption value="review" label="Under review" />
            </RadioGroup>
          </div>

          <Separator />

          <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Estimated <strong>{estimatedPages}</strong> page
            {estimatedPages === 1 ? "" : "s"}
            {options.titlePage ? " · title page" : ""}
            {pdfStorageIds.length > 0 ? " · + embedded PDF pages" : ""}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={preparing}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void openExport(false)}
            disabled={busy}
          >
            {preparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Preview
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => void openExport(true)}
            disabled={busy}
          >
            {preparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OptionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="rounded-md border bg-card p-1">{children}</div>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  sublabel,
  value,
  onChange,
}: {
  id: string
  label: string
  sublabel: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-md px-1 py-1">
      <Switch id={id} checked={value} onCheckedChange={onChange} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        <div className="text-[11px] text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  )
}

function WmOption({ value, label }: { value: string; label: string }) {
  return (
    <Label
      htmlFor={`wm-${value}`}
      className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs hover:bg-muted/40"
    >
      <RadioGroupItem id={`wm-${value}`} value={value} />
      {label}
    </Label>
  )
}

function estimatePageCount(body: unknown, opts: PdfExportOptions): number {
  let pages = 0
  if (opts.titlePage) pages += 1
  // Naive: count headings / paragraphs and divide. The browser's actual
  // pagination is what matters; this is a rough estimate for the dialog hint.
  const blocks = countBlocks(body)
  pages += Math.max(1, Math.ceil(blocks / 18))
  return pages
}

function countBlocks(body: unknown): number {
  if (!body || typeof body !== "object") return 0
  const node = body as { type?: string; content?: unknown[] }
  let n = 0
  const walk = (x: unknown) => {
    if (!x || typeof x !== "object") return
    const v = x as { type?: string; content?: unknown[] }
    if (
      v.type === "paragraph" ||
      v.type === "heading" ||
      v.type === "stepItem" ||
      v.type === "blockquote" ||
      v.type === "callout" ||
      v.type === "diagram" ||
      v.type === "table"
    ) {
      n += 1
    }
    if (Array.isArray(v.content)) v.content.forEach(walk)
  }
  walk(node)
  return n
}
