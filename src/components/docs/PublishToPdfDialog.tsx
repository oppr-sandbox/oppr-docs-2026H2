// Publish-to-PDF dialog — toggles + Preview/Download.
//
// Loads the document + version + assets via the repos, renders a print HTML
// document, opens it in a new window. The user prints to PDF from there
// (the popup has its own toolbar with Print + Close buttons).

import { useMemo, useState } from "react"
import { FileDown, Eye, Sparkles } from "lucide-react"
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
import { extractPpeItems } from "@/components/docs/DocumentHero"
import {
  buildPrintDoc,
  DEFAULT_PDF_OPTIONS,
  type PdfExportOptions,
} from "@/lib/pdf-export/buildPrintDoc"
import { openPrintWindow } from "@/lib/pdf-export/openPrintWindow"
import { toast } from "sonner"

interface PublishToPdfDialogProps {
  documentId: string
  trigger: React.ReactNode
}

export function PublishToPdfDialog({ documentId, trigger }: PublishToPdfDialogProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_PDF_OPTIONS)

  const docResult = useQuery(
    api.documents.getWithAssets,
    open ? { id: documentId as Id<"documents"> } : "skip",
  )
  const versionResult = useQuery(
    api.documents.getCurrentVersion,
    open ? { documentId: documentId as Id<"documents"> } : "skip",
  )

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

  function buildHtml(): string | null {
    if (!resolved) return null
    if (resolved.version.body_kind === "pdf") {
      toast.error("PDF-backed documents can't be re-exported in v1. Open the PDF and use the browser's Save-as.")
      return null
    }
    return buildPrintDoc({
      doc: resolved.doc,
      version: resolved.version,
      assets: resolved.doc.assets,
      owner: resolved.owner,
      options,
      ppeOnDoc: resolved.ppeOnDoc,
    })
  }

  function handlePreview() {
    const html = buildHtml()
    if (!html) return
    const win = openPrintWindow(html)
    if (!win) {
      toast.error("Couldn't open the preview window. Check your popup blocker.")
      return
    }
    setOpen(false)
  }

  function handleDownload() {
    // For v1 we route Download through the same preview window so the user
    // gets the browser's Save-as-PDF dialog with all options visible. The
    // popup auto-prompts print on load when ?print=1 is set.
    const html = buildHtml()
    if (!html) return
    const withAutoPrint = html.replace(
      "</body>",
      `<script>window.addEventListener('load', function () { setTimeout(function () { window.print() }, 350) })</script></body>`,
    )
    const win = openPrintWindow(withAutoPrint)
    if (!win) {
      toast.error("Couldn't open the print window. Check your popup blocker.")
      return
    }
    setOpen(false)
  }

  const estimatedPages = estimatePageCount(resolved?.version.body_json, options)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-orange-600" />
            Publish to PDF
          </DialogTitle>
          <DialogDescription>
            Build a paginated PDF for printing or sharing. Includes everything from the
            current published version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <ToggleRow
            id="title-page"
            label="Include title page"
            sublabel="Cover page with type, code, owner, dates, PPE."
            value={options.titlePage}
            onChange={(v) => setOptions((o) => ({ ...o, titlePage: v }))}
          />
          <ToggleRow
            id="rev-block"
            label="Include revision block"
            sublabel="Revision history table on the first content page."
            value={options.revisionBlock}
            onChange={(v) => setOptions((o) => ({ ...o, revisionBlock: v }))}
          />
          <ToggleRow
            id="rec-header"
            label="Recurring header"
            sublabel="Doc ID, version, and title at the top of every body page."
            value={options.recurringHeader}
            onChange={(v) => setOptions((o) => ({ ...o, recurringHeader: v }))}
          />
          <ToggleRow
            id="rec-footer"
            label="Recurring footer"
            sublabel='Effective date and "Page X of Y".'
            value={options.recurringFooter}
            onChange={(v) => setOptions((o) => ({ ...o, recurringFooter: v }))}
          />
          <ToggleRow
            id="asset-list"
            label="Include linked-asset list"
            sublabel="Lists every asset attached to this document."
            value={options.assetList}
            onChange={(v) => setOptions((o) => ({ ...o, assetList: v }))}
          />

          <Separator />

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Watermark
            </Label>
            <RadioGroup
              className="mt-2 grid grid-cols-2 gap-1.5"
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

          <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Estimated <strong>{estimatedPages}</strong> page{estimatedPages === 1 ? "" : "s"}
            {options.titlePage ? " · 1 title page" : ""}
            {options.revisionBlock ? " · 1 revision block" : ""}
            {" · "}body content
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePreview}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleDownload}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
