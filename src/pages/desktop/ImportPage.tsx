// External-document importer wizard. Two routes:
//   /import           — start a new import (Upload stage)
//   /import/:jobId    — resume an import; UI dispatches on job.stage
//
// The pipeline:
//   uploaded → extracted → mapped → linksResolved → finalized
//
// Browser-side stages: extract (pdf.js text + image walk), promote images
// through the existing image library, persist to a Convex importJobs row.
// Server-side stages: AI structural mapping (Gemini action), link resolution
// (deterministic mutation), finalize (document insert + chunks + asset
// links). Each stage is independently reviewable.

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useRoute } from "wouter"
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  FileSpreadsheet,
  FileText,
  Hash,
  ImageOff,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  MessageSquare,
  PenLine,
  Sparkles,
  Type as TypeIcon,
  Upload,
  Wand2,
  Workflow,
  X,
  XCircle,
} from "lucide-react"
import { useAction, useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { extractPdf } from "@/lib/import/extractPdf"
import { promoteImages } from "@/lib/import/promoteImages"
import {
  buildFallbackBody,
  extractBodyContent,
  sanitizeNodes,
} from "@/lib/import/sanitizeTiptap"

const TARGET_OPTIONS = [
  {
    value: "auto",
    label: "Auto-detect",
    description: "Classifier picks SOP vs Work-Instruction-Log on stage 2.",
  },
  {
    value: "sop",
    label: "Standard Operating Procedure",
    description: "Procedural narrative → database-built TipTap document.",
  },
  {
    value: "workInstructionLog",
    label: "Work Instruction → Log",
    description:
      "Operator-action-and-capture flow → LOG spec for the LOGS configurator.",
  },
  {
    value: "manual",
    label: "Equipment Manual",
    description: "Reference content. Long manuals: section-pick after extract.",
  },
  {
    value: "lmra",
    label: "LMRA / Risk Assessment",
    description: "Short hazard checklist + sign-off.",
  },
] as const

type Target = (typeof TARGET_OPTIONS)[number]["value"]
type Mode = "verbatim" | "improve"

type Stage =
  | "uploaded"
  | "extracted"
  | "mapped"
  | "linksResolved"
  | "finalized"
  | "failed"

const STAGE_ORDER: Stage[] = [
  "uploaded",
  "extracted",
  "mapped",
  "linksResolved",
  "finalized",
]

const STAGE_LABELS: Record<Stage, string> = {
  uploaded: "Upload",
  extracted: "Extract",
  mapped: "AI map",
  linksResolved: "Cross-links",
  finalized: "Review",
  failed: "Failed",
}

export function ImportPage() {
  const [, params] = useRoute<{ jobId: string }>("/import/:jobId")
  const jobId = params?.jobId as Id<"importJobs"> | undefined

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        breadcrumb={[
          { label: "Library", href: "/library" },
          { label: "Import external" },
        ]}
      />
      {jobId ? <ResumeJob jobId={jobId} /> : <NewImport />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage 1 — new import (no job yet)
// ---------------------------------------------------------------------------

function NewImport() {
  const [, navigate] = useLocation()
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<Target>("auto")
  const [mode, setMode] = useState<Mode>("verbatim")
  const [busy, setBusy] = useState(false)
  const [busyMsg, setBusyMsg] = useState<string>("")

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createFromUpload = useMutation(api.images.createFromUpload)
  const createJob = useMutation(api.importer.jobs.create)
  const recordExtraction = useMutation(api.importer.jobs.recordExtraction)

  function pickFile(f: File | null) {
    if (!f) return
    const isPdf =
      f.type.includes("pdf") || f.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      toast.error("v1 only supports PDF. Word/Excel/PowerPoint land in P1.")
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("File too large. Limit is 50 MB.")
      return
    }
    setFile(f)
  }

  async function handleStart() {
    if (!file) return
    setBusy(true)
    try {
      setBusyMsg("Reading PDF · extracting text + images")
      const result = await extractPdf(file)

      if (result.classification.kind === "unsupported") {
        toast.error("File type not supported by browser-side extractor.")
        setBusy(false)
        return
      }

      setBusyMsg(
        `Promoting ${result.images.length} image${
          result.images.length === 1 ? "" : "s"
        } to the image library`,
      )
      const imageIds = await promoteImages(result.images, {
        generateUploadUrl,
        createFromUpload,
      })

      setBusyMsg("Uploading source file (audit copy)")
      const sourceUploadUrl = await generateUploadUrl()
      const put = await fetch(sourceUploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      })
      if (!put.ok) throw new Error(`Source upload failed (${put.status})`)
      const { storageId } = (await put.json()) as { storageId: Id<"_storage"> }

      const sourceBuf = await file.arrayBuffer()
      const sourceSha = await sha256Hex(sourceBuf)

      setBusyMsg("Creating import job")
      const jobId = await createJob({
        sourceStorageId: storageId,
        sourceFilename: file.name,
        sourceContentType: file.type || "application/pdf",
        sourceByteSize: file.size,
        sourceSha256: sourceSha,
        targetTemplate: target,
        defaultMode: mode,
      })

      await recordExtraction({
        jobId,
        classification: result.classification,
        extractedMarkdown: result.markdown,
        extractedPages: result.pages,
        extractedImageIds: imageIds,
        extractStats: result.stats,
      })

      const skippedNote =
        result.stats.imagesSkipped > 0
          ? ` (${result.stats.imagesSkipped} skipped as too small)`
          : ""
      const fallbackNote =
        result.stats.pageFallbackImages > 0
          ? ` · ${result.stats.pageFallbackImages} page-fallback`
          : ""
      toast.success(
        `Extracted ${result.pages.length} page${
          result.pages.length === 1 ? "" : "s"
        } · ${imageIds.length} image${imageIds.length === 1 ? "" : "s"}${fallbackNote}${skippedNote}.`,
      )
      navigate(`/import/${jobId}`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setBusy(false)
      setBusyMsg("")
    }
  }

  return (
    <>
      <PageHeader
        icon={Upload}
        title="Import external document"
        subtitle="Convert an existing PDF SOP into a database-built Oppr document, or extract a Work Instruction into a log spec."
      />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Stepper currentStage="uploaded" />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Upload</CardTitle>
              <CardDescription className="text-xs">
                Browser-side extraction. Source PDF is stored in Convex for
                audit; extracted images flow into the image library; AI
                mapping happens server-side after extraction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("import-file-input")?.click()
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (!busy)
                    pickFile(e.dataTransfer.files?.[0] ?? null)
                }}
                disabled={busy}
                className="flex w-full flex-col items-center gap-1.5 rounded-md border-2 border-dashed bg-muted/20 p-8 text-center transition-colors hover:bg-muted/40 disabled:opacity-60"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">
                  {file ? file.name : "Drop a PDF, or click to browse"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  PDF up to 50 MB · Word/Excel/PowerPoint coming in P1
                </div>
              </button>
              <input
                id="import-file-input"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Target template
                  </Label>
                  <div className="space-y-1.5">
                    {TARGET_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs transition-colors hover:bg-muted/40",
                          target === opt.value &&
                            "border-primary bg-primary/5",
                        )}
                      >
                        <input
                          type="radio"
                          name="target"
                          checked={target === opt.value}
                          onChange={() => setTarget(opt.value)}
                          className="mt-0.5"
                          disabled={busy}
                        />
                        <div className="space-y-0.5">
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {opt.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Default mode</Label>
                  <div className="space-y-1.5">
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs transition-colors hover:bg-muted/40",
                        mode === "verbatim" && "border-primary bg-primary/5",
                      )}
                    >
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === "verbatim"}
                        onChange={() => setMode("verbatim")}
                        className="mt-0.5"
                        disabled={busy}
                      />
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          Verbatim (recommended)
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Copy the source text character-for-character. AI
                          only finds boundaries. Safer for compliance.
                        </div>
                      </div>
                    </label>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs transition-colors hover:bg-muted/40",
                        mode === "improve" && "border-primary bg-primary/5",
                      )}
                    >
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === "improve"}
                        onChange={() => setMode("improve")}
                        className="mt-0.5"
                        disabled={busy}
                      />
                      <div className="space-y-0.5">
                        <div className="font-medium">Improve (AI rewrite)</div>
                        <div className="text-[11px] text-muted-foreground">
                          Rewrite in clear, imperative Oppr tone. Per-section
                          opt-in still available after review.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <Link href="/library" className="text-xs text-muted-foreground hover:underline">
                  Cancel
                </Link>
                <Button
                  size="sm"
                  onClick={handleStart}
                  disabled={!file || busy}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      {busyMsg || "Working…"}
                    </>
                  ) : (
                    <>
                      Start import
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Resume — dispatch on job.stage
// ---------------------------------------------------------------------------

function ResumeJob({ jobId }: { jobId: Id<"importJobs"> }) {
  const data = useQuery(api.importer.jobs.getWithSourceUrl, { id: jobId })

  if (data === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading job…
      </main>
    )
  }
  if (data === null) {
    return (
      <main className="px-6 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import job not found.</AlertTitle>
          <AlertDescription className="text-xs">
            The job may have been deleted, or you don't have access.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  const { job } = data
  const stage = job.stage as Stage

  return (
    <>
      <PageHeader
        icon={Upload}
        title={`Importing — ${job.sourceFilename}`}
        subtitle={`Stage: ${STAGE_LABELS[stage]} · ${
          job.classification?.pageCount ?? 0
        } pages · ${job.extractedImageIds.length} images`}
      />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <Stepper currentStage={stage} />

          {stage === "failed" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import failed.</AlertTitle>
              <AlertDescription className="text-xs">
                {job.error ?? "Unknown error."}
              </AlertDescription>
            </Alert>
          )}

          {stage === "uploaded" && <UploadingHint />}
          {stage === "extracted" && (
            <ExtractedStage job={job} />
          )}
          {stage === "mapped" && <MappedStage job={job} />}
          {stage === "linksResolved" && (
            <ReviewStage job={job} />
          )}
          {stage === "finalized" && <FinalizedStage job={job} />}
        </div>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper({ currentStage }: { currentStage: Stage }) {
  const isFailed = currentStage === "failed"
  const currentIdx = isFailed ? 0 : STAGE_ORDER.indexOf(currentStage)
  return (
    <div className="rounded-md border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        {STAGE_ORDER.map((s, i) => {
          const done = !isFailed && i < currentIdx
          const active = !isFailed && i === currentIdx
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  done && "bg-emerald-500 text-white",
                  active && "bg-primary text-primary-foreground",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <div
                className={cn(
                  "text-[11px]",
                  active && "font-semibold",
                  !active && "text-muted-foreground",
                )}
              >
                {STAGE_LABELS[s]}
              </div>
              {i < STAGE_ORDER.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    done ? "bg-emerald-500" : "bg-border",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UploadingHint() {
  return (
    <Alert>
      <Loader2 className="h-4 w-4 animate-spin" />
      <AlertTitle>Job created — extraction in progress.</AlertTitle>
      <AlertDescription className="text-xs">
        Hold on. The browser is finishing the text + image extract.
      </AlertDescription>
    </Alert>
  )
}

// ---------------------------------------------------------------------------
// Stage 2 — extracted (preview + run AI mapping)
// ---------------------------------------------------------------------------

function ExtractedStage({ job }: { job: Doc<"importJobs"> }) {
  const runMapping = useAction(api.importer.map.runMapping)
  const [busy, setBusy] = useState(false)

  async function handleMap() {
    setBusy(true)
    try {
      const result = (await runMapping({ jobId: job._id })) as {
        ok: boolean
        error?: string
      }
      if (result.ok === false) {
        toast.error(`Mapping failed: ${result.error ?? "Unknown error"}`)
      } else {
        toast.success("AI mapping complete.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mapping failed")
    } finally {
      setBusy(false)
    }
  }

  const targetLabel = useMemo(() => {
    const opt = TARGET_OPTIONS.find((o) => o.value === job.targetTemplate)
    return opt?.label ?? job.targetTemplate
  }, [job.targetTemplate])

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Extracted
          </CardTitle>
          <CardDescription className="text-xs">
            Browser-side extraction succeeded. Review the text + images, then
            run AI mapping to produce the structured output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4 text-xs">
            <Stat label="File type" value={job.classification?.kind ?? "—"} />
            <Stat label="Pages" value={String(job.classification?.pageCount ?? 0)} />
            <Stat label="Language" value={job.classification?.detectedLanguage ?? "—"} />
            <Stat label="Target" value={targetLabel} />
          </div>
          {job.extractStats && (
            <div className="rounded-md border bg-muted/20 p-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Image extraction:</span>{" "}
              {job.extractStats.imagesDetected} detected ·{" "}
              {job.extractStats.imagesExtracted} extracted (
              {job.extractStats.jpegImages} JPEG / {job.extractStats.pngImages} PNG)
              {job.extractStats.imagesSkipped > 0 && (
                <> · {job.extractStats.imagesSkipped} skipped (too small)</>
              )}
              {job.extractStats.pageFallbackImages > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-amber-700 dark:text-amber-300">
                    {job.extractStats.pageFallbackImages} page-fallback
                  </span>{" "}
                  (op-list extraction returned nothing for those pages — full-page render used)
                </>
              )}
            </div>
          )}
          <Separator />
          <Tabs defaultValue="text">
            <TabsList>
              <TabsTrigger value="text" className="text-xs">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Text
              </TabsTrigger>
              <TabsTrigger value="images" className="text-xs">
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Images ({job.extractedImageIds.length})
              </TabsTrigger>
              <TabsTrigger value="raw" className="text-xs">
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Raw markdown
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="pt-3 space-y-2">
              {(job.extractedPages ?? []).map((p) => (
                <div key={p.pageNumber} className="rounded-md border bg-muted/20 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      page {p.pageNumber}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {p.text.length} chars
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted-foreground">
                    {p.text.slice(0, 1200)}
                    {p.text.length > 1200 ? "…" : ""}
                  </pre>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="images" className="pt-3">
              <ImagesGrid imageIds={job.extractedImageIds} />
            </TabsContent>
            <TabsContent value="raw" className="pt-3">
              <pre className="max-h-[480px] overflow-auto rounded-md border bg-muted/20 p-3 text-[11px] leading-relaxed">
                {job.extractedMarkdown ?? ""}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-md border bg-card p-3">
        <div className="text-xs text-muted-foreground">
          Next: AI maps the extracted text into{" "}
          {job.targetTemplate === "workInstructionLog"
            ? "a LOG spec (primitives)"
            : "a structured TipTap document"}{" "}
          using the {job.defaultMode} default.
        </div>
        <Button size="sm" onClick={handleMap} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Running mapping…
            </>
          ) : (
            <>
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              Run AI mapping
            </>
          )}
        </Button>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function ImagesGrid({ imageIds }: { imageIds: Id<"images">[] }) {
  const urls = useQuery(
    api.images.urlsFor,
    imageIds.length > 0 ? { ids: imageIds } : "skip",
  )
  if (imageIds.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
        <ImageOff className="h-4 w-4" />
        No images extracted from this PDF.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {imageIds.map((id) => {
        const url = urls?.[id]
        return (
          <Link key={id} href={`/images?selected=${id}`}>
            <div className="aspect-square overflow-hidden rounded-md border bg-muted/30 transition-colors hover:border-primary">
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage 3 — mapped (preview + resolve links)
// ---------------------------------------------------------------------------

function MappedStage({ job }: { job: Doc<"importJobs"> }) {
  const resolveLinks = useMutation(api.importer.jobs.resolveLinks)
  const updateMetadata = useMutation(api.importer.jobs.updateMetadata)
  const runMapping = useAction(api.importer.map.runMapping)
  const [title, setTitle] = useState(job.suggestedTitle ?? "")
  const [namingCode, setNamingCode] = useState(job.suggestedNamingCode ?? "")
  const [busy, setBusy] = useState(false)
  const [remapping, setRemapping] = useState(false)

  useEffect(() => {
    setTitle(job.suggestedTitle ?? "")
    setNamingCode(job.suggestedNamingCode ?? "")
  }, [job._id, job.suggestedTitle, job.suggestedNamingCode])

  async function handleContinue() {
    setBusy(true)
    try {
      await updateMetadata({
        jobId: job._id,
        suggestedTitle: title,
        suggestedNamingCode: namingCode,
      })
      await resolveLinks({ jobId: job._id })
      toast.success("Cross-link suggestions ready.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleRemap() {
    setRemapping(true)
    try {
      const result = (await runMapping({ jobId: job._id })) as {
        ok: boolean
        error?: string
      }
      if (result.ok === false) {
        toast.error(`Re-mapping failed: ${result.error ?? "Unknown error"}`)
      } else {
        toast.success("AI mapping re-run.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-mapping failed")
    } finally {
      setRemapping(false)
    }
  }

  const isLogSpec = job.targetTemplate === "workInstructionLog"

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-primary" />
            AI mapping output
          </CardTitle>
          <CardDescription className="text-xs">
            {isLogSpec
              ? "Operator-action-and-capture flow extracted as LOGS primitives."
              : "Section-by-section TipTap structure for the editor."}{" "}
            {job.mappingNotes && (
              <span className="italic">— {job.mappingNotes}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Suggested title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Suggested naming code{" "}
                {isLogSpec && (
                  <span className="text-[10px] text-muted-foreground">
                    (not used for log spec)
                  </span>
                )}
              </Label>
              <Input
                value={namingCode}
                onChange={(e) => setNamingCode(e.target.value)}
                disabled={busy || isLogSpec}
                placeholder="e.g. HOL-OPS-SOP-0042"
              />
            </div>
          </div>

          <Separator />

          {isLogSpec ? (
            <LogSpecPreview spec={job.mappedLogSpec} />
          ) : (
            <BodyPreview body={job.mappedBody} />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3">
        <div className="text-xs text-muted-foreground">
          Next: walk the output for naming codes + asset names, fuzzy-match
          against existing rows, surface candidates. Re-run mapping if the
          output above looks wrong (Gemini is non-deterministic).
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemap}
            disabled={busy || remapping}
          >
            {remapping ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Re-run AI mapping
          </Button>
          <Button size="sm" onClick={handleContinue} disabled={busy || remapping}>
            {busy ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            )}
            Resolve cross-links
          </Button>
        </div>
      </div>
    </>
  )
}

function BodyPreview({ body }: { body: unknown }) {
  if (!body || typeof body !== "object") {
    return (
      <div className="text-xs text-muted-foreground">
        No mapping output. Re-run AI mapping?
      </div>
    )
  }
  const obj = body as {
    summary?: string
    body?: unknown[]
    detectedAssets?: string[]
    detectedDocs?: string[]
    sectionConfidence?: { label: string; confidence: number }[]
  }
  return (
    <div className="space-y-2">
      {obj.summary && (
        <div className="rounded-md border bg-muted/20 p-3 text-xs leading-relaxed">
          <span className="font-semibold">Summary:</span> {obj.summary}
        </div>
      )}
      <div className="grid gap-2 md:grid-cols-2">
        <DetectedList
          label="Detected assets"
          items={obj.detectedAssets ?? []}
        />
        <DetectedList
          label="Detected document refs"
          items={obj.detectedDocs ?? []}
        />
      </div>
      {(obj.sectionConfidence?.length ?? 0) > 0 && (
        <div className="space-y-1">
          {(obj.sectionConfidence ?? []).map((s) => (
            <ConfidenceRow key={s.label} label={s.label} confidence={s.confidence} />
          ))}
        </div>
      )}
      <details className="rounded-md border bg-muted/20 p-2" open>
        <summary className="cursor-pointer text-xs font-medium">
          Raw mapping output (full Gemini response)
        </summary>
        <pre className="mt-2 max-h-[420px] overflow-auto rounded bg-background p-2 text-[10px] leading-relaxed">
          {JSON.stringify(body, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function ConfidenceRow({ label, confidence }: { label: string; confidence: number }) {
  const pct = Math.round(confidence * 100)
  const tone =
    pct >= 90
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : pct >= 70
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "bg-red-500/15 text-red-700 dark:text-red-300"
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-card p-2 text-xs">
      <span>{label}</span>
      <Badge className={cn("text-[10px]", tone)}>{pct}%</Badge>
    </div>
  )
}

function DetectedList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">none</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((s) => (
            <Badge key={s} variant="secondary" className="font-mono text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function LogSpecPreview({ spec }: { spec: unknown }) {
  if (!spec || typeof spec !== "object") {
    return (
      <div className="text-xs text-muted-foreground">
        No log spec output. Re-run AI mapping?
      </div>
    )
  }
  const obj = spec as {
    title?: string
    description?: string
    assetBindingHint?: string | null
    primitives?: Array<Record<string, unknown>>
    detectedAssets?: string[]
    detectedDocs?: string[]
  }
  return (
    <div className="space-y-2">
      {obj.description && (
        <div className="rounded-md border bg-muted/20 p-3 text-xs leading-relaxed">
          <span className="font-semibold">Description:</span> {obj.description}
        </div>
      )}
      <div className="grid gap-2 md:grid-cols-2 text-xs">
        <div className="rounded-md border bg-card p-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Asset binding hint
          </div>
          <div>{obj.assetBindingHint ?? "—"}</div>
        </div>
        <DetectedList
          label="Detected document refs"
          items={obj.detectedDocs ?? []}
        />
      </div>
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Primitives ({obj.primitives?.length ?? 0})
        </div>
        {(obj.primitives ?? []).map((p, i) => (
          <PrimitiveCard key={i} index={i + 1} primitive={p} />
        ))}
      </div>
    </div>
  )
}

function PrimitiveCard({
  index,
  primitive,
}: {
  index: number
  primitive: Record<string, unknown>
}) {
  const kind = String(primitive.kind ?? "unknown")
  const Icon = primitiveIcon(kind)
  const title = String(primitive.title ?? "Untitled")
  return (
    <div className="rounded-md border bg-card p-3 text-xs">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-[10px]">
          step {index}
        </Badge>
        <Icon className="h-3.5 w-3.5 text-primary" />
        <Badge className="text-[10px]">{kind}</Badge>
        <span className="font-semibold">{title}</span>
      </div>
      {"message" in primitive && primitive.message && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {String(primitive.message)}
        </div>
      )}
      {"question" in primitive && primitive.question && (
        <div className="mt-1 text-[11px]">
          <span className="font-medium">Question: </span>
          {String(primitive.question)}
        </div>
      )}
      {"photoInstructions" in primitive && primitive.photoInstructions && (
        <div className="mt-1 text-[11px]">
          <span className="font-medium">Photo instructions: </span>
          {String(primitive.photoInstructions)}
        </div>
      )}
      {kind === "numericInput" && (
        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
          <Badge variant="outline" className="text-[10px]">
            unit: {String(primitive.unitName ?? "—")}
          </Badge>
          {primitive.minValue != null && (
            <Badge variant="outline" className="text-[10px]">
              min: {String(primitive.minValue)}
            </Badge>
          )}
          {primitive.maxValue != null && (
            <Badge variant="outline" className="text-[10px]">
              max: {String(primitive.maxValue)}
            </Badge>
          )}
        </div>
      )}
      {kind === "choiceInput" && Array.isArray(primitive.options) && (
        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
          <Badge variant="outline" className="text-[10px]">
            {String(primitive.inputType ?? "dropdown")}
          </Badge>
          {(primitive.options as unknown[]).map((o, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">
              {String(o)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function primitiveIcon(kind: string) {
  switch (kind) {
    case "textMessage":
      return MessageSquare
    case "textInput":
      return TypeIcon
    case "choiceInput":
      return ListChecks
    case "numericInput":
      return Hash
    case "photoInput":
      return ImageIcon
    case "signOff":
      return PenLine
    default:
      return Sparkles
  }
}

// ---------------------------------------------------------------------------
// Stage 4 — links resolved (review + finalize)
// ---------------------------------------------------------------------------

function ReviewStage({ job }: { job: Doc<"importJobs"> }) {
  const updateLinkResolution = useMutation(api.importer.jobs.updateLinkResolution)
  const finalizeDocument = useMutation(api.importer.jobs.finalizeDocument)
  const updateMetadata = useMutation(api.importer.jobs.updateMetadata)
  const [, navigate] = useLocation()
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(job.suggestedTitle ?? "")
  const [namingCode, setNamingCode] = useState(job.suggestedNamingCode ?? "")

  const isLogSpec = job.targetTemplate === "workInstructionLog"
  const resolutions = job.linkResolutions ?? []

  async function handleAccept(idx: number, accepted: boolean) {
    const r = resolutions[idx]
    await updateLinkResolution({
      jobId: job._id,
      index: idx,
      accepted,
      targetId: r.targetId,
      targetLabel: r.targetLabel,
    })
  }

  async function handleFinalize() {
    if (isLogSpec) {
      // Log-spec doesn't create a document; just mark finalized.
      setBusy(true)
      try {
        await updateMetadata({ jobId: job._id, stage: "finalized" })
        toast.success("Log spec ready — copy into LOGS configurator.")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed")
      } finally {
        setBusy(false)
      }
      return
    }

    if (!title.trim() || !namingCode.trim()) {
      toast.error("Title and naming code are required.")
      return
    }
    if (!/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-\d{4}$/.test(namingCode.trim())) {
      toast.error("Naming code must be like HOL-OPS-SOP-0001.")
      return
    }

    const rawBlocks = extractBodyContent(job.mappedBody)
    const sanitised = sanitizeNodes(rawBlocks)
    const usedFallback = sanitised.nodes.length === 0
    const finalBlocks = usedFallback
      ? buildFallbackBody(job.extractedPages ?? [], job.sourceFilename)
      : sanitised.nodes
    const body = {
      type: "doc",
      content: finalBlocks,
    }
    const chunks = bodyToChunks(body)

    if (usedFallback) {
      toast.warning(
        `AI mapping returned no usable blocks — used a per-page verbatim fallback (${
          job.extractedPages?.length ?? 0
        } pages). You can re-run AI mapping or restructure manually in the editor.`,
      )
    } else if (sanitised.droppedCount > 0 || sanitised.normalisedCount > 0) {
      const parts: string[] = []
      if (sanitised.normalisedCount > 0)
        parts.push(`${sanitised.normalisedCount} normalised`)
      if (sanitised.droppedCount > 0)
        parts.push(`${sanitised.droppedCount} dropped`)
      toast.info(`Sanitised AI body: ${parts.join(", ")}.`)
    }

    setBusy(true)
    try {
      const docType = guessDocType(job.targetTemplate)
      const docId = await finalizeDocument({
        jobId: job._id,
        namingCode: namingCode.trim(),
        title: title.trim(),
        type: docType,
        assetIds: job.suggestedAssetIds,
        body,
        chunks,
      })
      toast.success("Document created — opening editor.")
      navigate(`/docs/${docId}/edit`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Finalize failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className="h-4 w-4 text-primary" />
            Cross-link resolution
          </CardTitle>
          <CardDescription className="text-xs">
            Each row is a candidate match. Accept the ones that look right;
            reject the rest. High-confidence (≥ 90%) candidates are
            auto-accepted; you can still drop them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {resolutions.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              No cross-links detected.
            </div>
          ) : (
            resolutions.map((r, i) => (
              <ResolutionRow
                key={i}
                resolution={r}
                onAccept={() => handleAccept(i, true)}
                onReject={() => handleAccept(i, false)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {!isLogSpec && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Final metadata</CardTitle>
            <CardDescription className="text-xs">
              Confirm before creating the document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Naming code</Label>
                <Input
                  value={namingCode}
                  onChange={(e) => setNamingCode(e.target.value.toUpperCase())}
                  placeholder="HOL-OPS-SOP-0001"
                />
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Linked assets:{" "}
              {job.suggestedAssetIds.length > 0
                ? `${job.suggestedAssetIds.length} accepted`
                : "none"}
              . Asset list will land on the doc record.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between rounded-md border bg-card p-3">
        <Link href="/library" className="text-xs text-muted-foreground hover:underline">
          Cancel and discard
        </Link>
        <Button size="sm" onClick={handleFinalize} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : isLogSpec ? (
            <>
              <Workflow className="mr-1.5 h-3.5 w-3.5" />
              Finalize log spec
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Create document
            </>
          )}
        </Button>
      </div>
    </>
  )
}

function ResolutionRow({
  resolution,
  onAccept,
  onReject,
}: {
  resolution: NonNullable<Doc<"importJobs">["linkResolutions"]>[number]
  onAccept: () => void
  onReject: () => void
}) {
  const Icon =
    resolution.kind === "document"
      ? FileText
      : resolution.kind === "asset"
        ? Activity
        : ListChecks
  const conf = Math.round(resolution.confidence * 100)
  const tone =
    conf >= 90
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : conf >= 70
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "bg-red-500/15 text-red-700 dark:text-red-300"
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border bg-card p-2.5 text-xs",
        resolution.accepted && "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono">"{resolution.match}"</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="font-mono text-muted-foreground">
        {resolution.targetLabel ?? "(no candidate)"}
      </span>
      <Badge className={cn("text-[10px]", tone)}>{conf}%</Badge>
      <div className="ml-auto flex items-center gap-1">
        {resolution.accepted ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onReject}
          >
            <X className="mr-1 h-3 w-3" /> Drop
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!resolution.targetId}
            onClick={onAccept}
          >
            <Check className="mr-1 h-3 w-3" /> Accept
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage 5 — finalized
// ---------------------------------------------------------------------------

function FinalizedStage({ job }: { job: Doc<"importJobs"> }) {
  const isLogSpec = job.targetTemplate === "workInstructionLog"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Finalized
        </CardTitle>
        <CardDescription className="text-xs">
          Import complete.{" "}
          {isLogSpec
            ? "Use the log spec to configure a log in the LOGS module."
            : "Document created in DOCS as a draft."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLogSpec ? (
          <>
            <div className="rounded-md border bg-muted/20 p-3 text-xs leading-relaxed">
              The Work Instruction has been converted to a LOG spec. Today there
              is no automatic LOGS-app push (planned post-v1). Copy the JSON
              below and paste it into the LOGS configurator.
            </div>
            <CopyJsonBlock value={job.mappedLogSpec} />
          </>
        ) : (
          <>
            {job.finalizedDocumentId ? (
              <div className="flex items-center justify-between gap-2 rounded-md border bg-card p-3 text-xs">
                <div>
                  Document landed at{" "}
                  <Link
                    href={`/docs/${job.finalizedDocumentId}`}
                    className="font-mono text-primary underline"
                  >
                    /docs/{job.finalizedDocumentId}
                  </Link>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/docs/${job.finalizedDocumentId}/edit`}>
                    Open editor <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Document not yet created. Run finalize from the review stage.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CopyJsonBlock({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false)
  const text = useMemo(() => JSON.stringify(value, null, 2), [value])
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Clipboard write failed.")
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copy}>
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" /> Copy JSON
            </>
          )}
        </Button>
      </div>
      <pre className="max-h-[480px] overflow-auto rounded-md border bg-muted/20 p-3 text-[11px] leading-relaxed">
        {text}
      </pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function guessDocType(
  target: Doc<"importJobs">["targetTemplate"],
): "sop" | "manual" | "work_instruction" | "lmra" {
  if (target === "manual") return "manual"
  if (target === "lmra") return "lmra"
  return "sop"
}

// Rough chunk extractor for embeddings: each block becomes one chunk.
function bodyToChunks(body: { content: unknown[] }): Array<{
  text: string
  section: string | null
}> {
  const chunks: Array<{ text: string; section: string | null }> = []
  let currentSection: string | null = null
  for (const node of body.content as Array<{
    type: string
    attrs?: { level?: number }
    content?: unknown[]
  }>) {
    const text = nodeText(node).trim()
    if (!text) continue
    if (node.type === "heading") {
      currentSection = text
    }
    chunks.push({ text, section: currentSection })
  }
  return chunks
}

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return ""
  const n = node as { type?: string; text?: string; content?: unknown[] }
  if (n.type === "text" && typeof n.text === "string") return n.text
  if (Array.isArray(n.content)) {
    return n.content.map(nodeText).join(n.type === "paragraph" ? " " : "\n")
  }
  return ""
}

// Stub use of imports to avoid unused-warnings in tooling (tsc strict-off
// won't flag, but keeps the file disciplined when icons rotate).
export const _unused = { Textarea, FileSpreadsheet, XCircle }
