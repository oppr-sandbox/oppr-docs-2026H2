// Analysis: import pipeline redesign (v2 — slimmed after the scan-PDF grilling).
// Static case file at /analysis/import-redesign. No DB/AI — frozen review built
// from the real components. See .claude/skills/analysis-page/SKILL.md.

import {
  AlertTriangle,
  CircleDot,
  FileText,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Paperclip,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

const IMG = (f: string) => `/analysis/import-redesign/${f}`

// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="5-step import wizard fails on real files: a scanned PDF gets rasterized into 'images', AI-mapped on empty text (0%), then blocked by a naming-code gate that shouldn't exist here."
          tone="destructive"
        />
        <SummaryCell icon={CircleDot} label="Status" value="Shipped · 2026-05-22" tone="emerald" />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="Single-screen importer; scan→attach branch; new buildTiptap (font-size headings); raster fallback + garbled-text guard in extractPdf; wizard stages deleted. Bold/italic + body tables deferred."
          tone="emerald"
        />
        <SummaryCell icon={ShieldCheck} label="Verification" value="tsc -b 0 · vite build 0 (no Convex change)" tone="emerald" />
      </CardContent>
    </Card>
  )
}

function SummaryCell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertTriangle
  label: string
  value: string
  tone: "destructive" | "emerald" | "default"
}) {
  const iconClass =
    tone === "destructive" ? "text-destructive" : tone === "emerald" ? "text-emerald-600" : "text-primary"
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm leading-snug">{value}</div>
      </div>
    </div>
  )
}

function ProblemStatement() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>What we're solving</AlertTitle>
      <AlertDescription className="space-y-2 text-sm leading-relaxed">
        <p>
          The importer should do exactly two things: pull the <strong>text</strong> and
          pull the <strong>images</strong> out of a PDF, map a tiny set of formatting
          (headings, bold, italic, tables) onto our TipTap nodes, and drop the result
          into the editor as a pre-draft. Everything else is edited by hand. Today it
          instead runs a 5-step pipeline — Upload → Extract → <em>AI map</em> →
          <em> Cross-links</em> → Review — and on a real file every stage downstream of
          Extract fails because Extract itself produced nothing usable.
        </p>
        <p className="text-xs">
          The grilling settled four things (see Decisions). The headline: the test file
          is a <strong>scan with no text layer</strong>, so "extract the text" was never
          possible browser-side — it should have been routed to the attach-as-PDF mode,
          not faked. This is a review, not a fix.
        </p>
      </AlertDescription>
    </Alert>
  )
}

// ---------------------------------------------------------------------------

function Evidence() {
  return (
    <Section title="Evidence" description="Four screenshots, one cascading failure.">
      <Tabs defaultValue="upload">
        <TabsList className="flex-wrap">
          <TabsTrigger value="upload">1 · Upload</TabsTrigger>
          <TabsTrigger value="extract">2 · Extract</TabsTrigger>
          <TabsTrigger value="aimap">3 · AI map</TabsTrigger>
          <TabsTrigger value="naming">4 · Naming gate</TabsTrigger>
          <TabsTrigger value="result">5 · Result</TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <EvidenceCard
            src={IMG("upload-5-step-wizard.png")}
            caption="The wizard front-loads a 5-step path (Upload · Extract · AI map · Cross-links · Review). The user shouldn't have to think about mapping or links to bring a document in."
          />
        </TabsContent>
        <TabsContent value="extract">
          <EvidenceCard
            src={IMG("scan-extracted-as-images.png")}
            caption="Classified scannedPdf. Text tab is empty; '3 images extracted' are really 3 full-page screenshots from the raster fallback. There was no text layer to extract — but the wizard pressed on regardless."
          />
        </TabsContent>
        <TabsContent value="aimap">
          <EvidenceCard
            src={IMG("ai-map-zero-confidence.png")}
            caption="AI mapping ran on empty text and returned 0% confidence for Purpose / PPE / Procedure. Garbage in. This step should not exist in the import path at all."
          />
        </TabsContent>
        <TabsContent value="naming">
          <EvidenceCard
            src={IMG("naming-code-blocked.png")}
            caption="Finalize is blocked by 'Naming code must be like HOL-OPS-SOP-0001'. The naming code is chosen later in the editor's metadata panel — it must not gate import."
          />
        </TabsContent>
        <TabsContent value="result">
          <EvidenceCard
            src={IMG("final-doc-rasters-only.png")}
            caption="The doc that lands: 'Imported figures' = full-page rasters, no real text, and still demanding a location + discipline before it'll behave."
          />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function EvidenceCard({ caption, src }: { caption: string; src: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="overflow-hidden rounded-md border bg-muted/30">
          <img src={src} alt={caption} className="block h-auto w-full" />
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------

interface RootRow {
  symptom: string
  cause: string
  file: string
  confidence: "high" | "med"
}

const ROOT_CAUSES: RootRow[] = [
  {
    symptom: "Scanned PDF still pushed through the full pipeline",
    cause:
      "Classification computes avgChars<80 → scannedPdf, but the result is only a label — extraction continues and the wizard advances to AI map / cross-links regardless. There is no early branch that says 'no text layer → don't try to extract'.",
    file: "src/lib/import/extractPdf.ts:319",
    confidence: "high",
  },
  {
    symptom: "'3 images extracted' are full-page screenshots",
    cause:
      "Per-page raster fallback: if a page had image-paint ops but no embedded image decoded, the whole page is rendered to a PNG and pushed into the image stream. On a scan, every page trips this — so the 'images' are page rasters, and the real embedded icons are lost.",
    file: "src/lib/import/extractPdf.ts:268",
    confidence: "high",
  },
  {
    symptom: "AI map returns 0% for every section",
    cause:
      "The AI mapping action runs on the extracted markdown. With an empty text layer there is nothing to map, so Gemini returns 0-confidence sections. The step is pure noise on top of an already-failed extract — and shouldn't be in the import path at all.",
    file: "convex/importer/map.ts",
    confidence: "high",
  },
  {
    symptom: "Finalize blocked on HOL-OPS naming code",
    cause:
      "The Review step validates a full naming code before it will create the document, even though finalizeDocument already inserts as pre_draft with namingCode '' — so the gate is both wrong and contradicts the backend.",
    file: "src/pages/desktop/ImportPage.tsx (Review step) · convex/importer/jobs.ts:455",
    confidence: "high",
  },
]

function RootCause() {
  return (
    <Section title="Root cause" description="One bad extract, three failures stacked on top of it.">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symptom</TableHead>
                <TableHead>Cause</TableHead>
                <TableHead className="w-16 text-right">Conf.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROOT_CAUSES.map((r) => (
                <TableRow key={r.symptom}>
                  <TableCell className="align-top text-xs font-medium">
                    {r.symptom}
                    <code className="mt-1 block rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {r.file}
                    </code>
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{r.cause}</TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.confidence === "high" && "border-destructive/40 text-destructive",
                        r.confidence === "med" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {r.confidence}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function ProposedFlow() {
  return (
    <Section
      title="Proposed flow — two outcomes, decided by the file"
      description="Upload, classify, branch. No mapping step, no cross-links step, no naming step."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-emerald-600" />
              Has a text layer → Extract
            </div>
            <ol className="ml-4 list-decimal space-y-1.5 text-xs text-muted-foreground">
              <li>Drop a PDF — a spinner + toast confirm it's being processed.</li>
              <li>Pull text + embedded images. Map a small set of formatting onto our TipTap nodes: font-size → heading levels, bold/italic font flags → marks, row clusters → tables. Everything else becomes plain paragraphs.</li>
              <li>Open straight in the editor as a <strong>pre-draft</strong>. You add machines, callouts, references, the naming code — all by hand, in the editor.</li>
              <li>Extracted images are held client-side and only committed to the image library when you save the document.</li>
            </ol>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ScanLine className="h-4 w-4 text-amber-600" />
              No text layer (scan) → Attach
            </div>
            <ol className="ml-4 list-decimal space-y-1.5 text-xs text-muted-foreground">
              <li>Detected up front: no selectable text. Stop — do not fake an extract, do not rasterize pages into the image stream.</li>
              <li>Show a clear message: "This looks like a scan — there's no text to extract. Attach it as a PDF instead."</li>
              <li>Route to the existing attach-as-PDF mode: the original drops in as a scrollable PDF element inside a pre-draft you can annotate around.</li>
              <li>OCR / Office formats are explicitly out of scope here — deferred to the future server service.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
      <Alert className="border-destructive/30">
        <Trash2 className="h-4 w-4" />
        <AlertTitle>Deleted outright</AlertTitle>
        <AlertDescription className="text-sm">
          The <strong>AI-map step</strong>, the <strong>cross-links step</strong>, the
          <strong> naming-code gate</strong>, the upfront target-template + verbatim/improve
          choices, and the full-page raster fallback feeding the image stream. The wizard
          ends when extraction does.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

interface WS {
  n: number
  icon: typeof FileText
  title: string
  detail: string
  files: string
}

const WORKSTREAMS: WS[] = [
  {
    n: 1,
    icon: ScanLine,
    title: "Branch on text layer up front",
    detail:
      "Classify before extracting. No text layer → stop and route to attach-as-PDF with a clear message. Kill the full-page raster fallback in the extract path entirely.",
    files: "src/lib/import/extractPdf.ts · src/pages/desktop/ImportPage.tsx",
  },
  {
    n: 2,
    icon: Layers,
    title: "Heuristic structure builder",
    detail:
      "Turn extracted layout into TipTap: font-size → heading levels, bold/italic font flags → marks, clusterRows() output → tables. Everything else = paragraphs. Best-effort; the human fixes the rest in the editor.",
    files: "new src/lib/import/buildTiptap.ts (reuses clusterRows + PageLayout)",
  },
  {
    n: 3,
    icon: Wrench,
    title: "Strip the wizard to one path",
    detail:
      "Remove the AI-map, cross-links, and naming-code steps from the UI. After extract, the doc opens in the editor as a pre-draft. No metadata gate.",
    files: "src/pages/desktop/ImportPage.tsx · convex/importer/{map,jobs}.ts (stop calling map/resolveLinks)",
  },
  {
    n: 4,
    icon: ImageIcon,
    title: "Commit images on save, not on extract",
    detail:
      "Hold extracted image blobs client-side through the wizard; upload to the images library only when the document is finalized. Discarded imports leave no library junk.",
    files: "src/pages/desktop/ImportPage.tsx · convex/files.ts · convex/importer/jobs.ts",
  },
  {
    n: 5,
    icon: Paperclip,
    title: "Upload feedback",
    detail:
      "On drop: spinner overlay on the dropzone + a sonner toast ('Processing <file>…' → 'Imported' / 'Looks like a scan'). No model needed.",
    files: "src/pages/desktop/ImportPage.tsx",
  },
]

function Workstreams() {
  return (
    <Section title="Workstreams" description="Five. Down from seven — cross-links, AI-improve, and batch import are gone or deferred.">
      <div className="space-y-4">
        {WORKSTREAMS.map((w) => {
          const Icon = w.icon
          return (
            <Card key={w.n}>
              <CardContent className="space-y-2 pt-5 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">WS{w.n}</Badge>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{w.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{w.detail}</p>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{w.files}</code>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  expected: string
  severity: "high" | "med" | "low"
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "PDF has a text layer on some pages, scans on others",
    expected:
      "Extract the text pages; for image-only pages, insert the page raster as a normal image in the body (clearly the exception, not the rule). Don't abort the whole import.",
    severity: "med",
  },
  {
    scenario: "Text layer exists but is garbled (custom font, no ToUnicode)",
    expected:
      "Detect low-confidence text (high ratio of non-word characters) and treat it like a scan: offer attach-as-PDF rather than importing gibberish.",
    severity: "high",
  },
  {
    scenario: "User refreshes mid-wizard with images held client-side",
    expected:
      "Blobs are lost — acceptable because the wizard is now one screen (upload → editor). Nothing was committed, so nothing is half-saved. The source PDF is still in storage to retry.",
    severity: "low",
  },
  {
    scenario: "Heuristic promotes a bold sentence to a heading wrongly",
    expected:
      "Expected and acceptable. Structure detection is best-effort; the editor is where the human corrects it. Bias toward under-structuring (paragraph) over over-structuring (false heading).",
    severity: "low",
  },
  {
    scenario: "Huge PDF (50+ pages) with hundreds of images",
    expected:
      "MAX_IMAGES cap (60) still applies; extraction stays responsive with the spinner. Images beyond the cap are dropped with a count surfaced in the toast.",
    severity: "med",
  },
]

function EdgeCases() {
  return (
    <Section title="Edge cases" description="Mostly about the boundary between 'has text' and 'is a scan'.">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="w-16 text-right">Sev</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((r) => (
                <TableRow key={r.scenario}>
                  <TableCell className="align-top text-xs font-medium">{r.scenario}</TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{r.expected}</TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.severity === "high" && "border-destructive/40 text-destructive",
                        r.severity === "med" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {r.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Grill({ q, a }: { q: string; a: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <div className="font-medium">Q. {q}</div>
      <div className="mt-1 text-muted-foreground">A. {a}</div>
    </div>
  )
}

function SelfGrilling() {
  return (
    <Section title="Self-grilling" description="The uncomfortable ones, with what the grilling actually settled.">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Grill
            q="'Just extract the text' — but the test file is a scan with no text. Doesn't that kill the whole premise?"
            a="It kills it for that file, and that's the point. Browser-side, you cannot extract text that isn't there. The honest scope: the importer's job is text PDFs. Scans get ATTACHED as a PDF element, not OCR'd. Confirmed in the grilling. The danger to avoid is the current behaviour — pretending to extract by rasterizing pages — which produces a useless document and looks like a bug. A clear 'this is a scan, attach it instead' is more honest and more useful."
          />
          <Grill
            q="Detecting headings/bold/italic/tables from a PDF — is that even reliable?"
            a="No, it's best-effort, and we should say so. PDFs carry font sizes and positions, not semantics. Font-size clustering → heading levels and row-clustering → tables are good heuristics that will still be wrong sometimes (a bold lead-in mistaken for a heading, a two-column layout mistaken for a table). The mitigation is that the output is editable immediately — the human fixes it in TipTap. Bias toward under-structuring: a wrong paragraph is cheaper to fix than a wrong heading."
          />
          <Grill
            q="Holding image blobs in browser memory until save — fragile?"
            a="Only if the wizard were long. It isn't anymore: upload → editor is effectively one screen, so the window where a refresh loses blobs is seconds, and nothing was committed. The source PDF stays in storage, so retry is free. The payoff — zero orphaned images in the library from discarded imports — is worth the small fragility. Upload-then-prune was the alternative and it's messier (you need a reaper for unused images)."
          />
          <Grill
            q="We're deleting the AI-map and cross-links steps we built. Wasted work?"
            a="The map/resolveLinks Convex functions stay in the codebase (cheap to keep, possibly reused by the future server pipeline); only their UI steps are removed. The lesson is real though: those steps were solving problems the user never had at import time. Asset/reference linking belongs in the editor, where the user has context — not in a wizard guessing from raw text."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

interface ResultRow {
  title: string
  files: string
  before: string
  after: string
}

const RESULTS: ResultRow[] = [
  {
    title: "Scan detection + attach branch",
    files: "src/lib/import/extractPdf.ts · src/pages/desktop/ImportPage.tsx",
    before:
      "A scan was classified scannedPdf but pushed through the same pipeline; every page hit the raster fallback and became a 'screenshot image', then AI-map ran on empty text.",
    after:
      "Classification (avgChars + alpha-ratio guard) decides up front. A scan stops with a clear 'no extractable text' card and an Attach-as-PDF action that drops the original into a pre-draft as a scrollable element — through the same finalizeDocument path.",
  },
  {
    title: "Wizard collapsed to one screen",
    files: "src/pages/desktop/ImportPage.tsx (1576 → ~430 lines)",
    before:
      "Upload → Extract → AI map → Cross-links → Review, with a naming-code gate (HOL-OPS) blocking finalize.",
    after:
      "Drop a PDF → spinner + toast → opens straight in the editor as a pre-draft. AI-map, cross-links, and the naming-code gate are gone. ResumeJob + all stage components deleted; /import/:jobId now redirects.",
  },
  {
    title: "Generic structure builder",
    files: "src/lib/import/buildTiptap.ts (new)",
    before:
      "Structure came from the eddycurrent-flavored firstPass (regex PPE / equipment / revision detectors) + AI mapping.",
    after:
      "Font-size clustering → heading levels; everything else → paragraphs (merged by vertical gap); images appended as a trailing 'Imported figures' section. No false-positive sections, no naming code set at import.",
  },
  {
    title: "Images commit on create, not on extract",
    files: "src/pages/desktop/ImportPage.tsx",
    before: "promoteImages ran during extraction — discarded imports left orphaned library images.",
    after: "Image blobs are held client-side; promoteImages runs only on the digital-PDF create path. Scans (and cancels) commit nothing.",
  },
]

function Results() {
  return (
    <Section title="Results" description="What shipped on 2026-05-22.">
      <div className="space-y-3">
        {RESULTS.map((r) => (
          <Card key={r.title}>
            <CardContent className="space-y-2 pt-5">
              <div className="text-sm font-semibold">{r.title}</div>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{r.files}</code>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-muted-foreground">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">Before</div>
                  {r.before}
                </div>
                <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-foreground">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">After</div>
                  {r.after}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

interface PlanStep {
  phase: string
  state: "shipped" | "deferred"
  steps: string[]
}

const PLAN: PlanStep[] = [
  {
    phase: "Phase 1 — Branch + strip",
    state: "shipped",
    steps: [
      "Classify text layer before extracting; no-text → stop and route to attach-as-PDF (avgChars + alpha-ratio guard for garbled text).",
      "Remove the AI-map, cross-links, and naming-code steps; wizard ends at extract → opens the editor as a pre-draft.",
      "Delete the full-page raster fallback from the extract path.",
    ],
  },
  {
    phase: "Phase 2 — Structure + images",
    state: "shipped",
    steps: [
      "buildTiptap.ts: font-size → heading levels, rest → paragraphs, images → trailing 'Imported figures'.",
      "Hold extracted image blobs client-side; commit to the library only on the digital-PDF create path.",
    ],
  },
  {
    phase: "Phase 3 — Feedback + verify",
    state: "shipped",
    steps: [
      "Spinner overlay on the dropzone + sonner toast.loading → success/warning/error by outcome.",
      "Verified: tsc -b 0 · vite build 0 (no Convex backend change).",
    ],
  },
  {
    phase: "Deferred — needs a real digital PDF to tune",
    state: "deferred",
    steps: [
      "Inline bold / italic: pdf.js item.fontName is an internal ref, not a weight — needs page.commonObjs resolution.",
      "Body-table reconstruction: clusterRows gives rows, not columns — needs a column-detection pass.",
      "OCR for scans: today scans attach as a PDF element; OCR is left to the future server service.",
      "Borderline-garbled digital PDFs (just passing the alpha-ratio guard) may produce an empty-looking import; tighten the guard once we have real samples.",
    ],
  },
]

function ImplementationPlan() {
  return (
    <Section title="Implementation plan" description="Phases 1–3 shipped. Two structure refinements + OCR deferred.">
      <Card>
        <CardContent className="space-y-4 pt-6">
          {PLAN.map((p) => (
            <div key={p.phase}>
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4 text-primary" />
                {p.phase}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    p.state === "shipped"
                      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                      : "border-amber-500/40 text-amber-600 dark:text-amber-400",
                  )}
                >
                  {p.state}
                </Badge>
              </div>
              <ol className="ml-6 list-decimal space-y-1 text-xs text-muted-foreground">
                {p.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Decision({ q, a }: { q: string; a: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <div className="flex items-center gap-1.5 font-medium">
        <CircleDot className="h-3.5 w-3.5 text-emerald-500" />
        {q}
      </div>
      <div className="ml-5 mt-0.5 text-muted-foreground">{a}</div>
    </div>
  )
}

function Decisions() {
  return (
    <Section title="Decisions — settled in the grilling" description="All four locked. What remains is execution.">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Decision
            q="1. The test PDF — digital or scan?"
            a="SCAN. No selectable text. So 'extract the text' is impossible for it browser-side; it must route to attach-as-PDF. This is the case that drove the redesign."
          />
          <Decision
            q="2. No-text-layer fallback — what happens?"
            a="STOP + offer attach-as-PDF. Detect no text up front, show a clear message, drop the original in as a scrollable PDF element. No OCR (deferred to the future server service); no silent page rasterizing."
          />
          <Decision
            q="3. Wizard scope after Upload?"
            a="NOTHING between extract and the editor. No AI-map step, no cross-links step, no naming-code step. The doc opens as a pre-draft and the user does the rest in the editor."
          />
          <Decision
            q="4. When do extracted images hit the library?"
            a="ON FINALIZE only. Blobs are held client-side through the wizard and committed when the document is saved, so discarded imports never pollute the library."
          />
        </CardContent>
      </Card>
      <Alert className="border-emerald-500/30">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Shipped · follow-ups</AlertTitle>
        <AlertDescription className="text-sm">
          All four decisions shipped on 2026-05-22 (see Results). Open follow-ups,
          all needing a real digital PDF to tune: inline bold/italic, body-table
          reconstruction, and OCR for scans (today they attach as a PDF element).
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

export function ImportRedesignAnalysis() {
  return (
    <AnalysisLayout
      title="Import pipeline redesign"
      subtitle="The 5-step import wizard fails on real files: a scanned PDF gets misclassified, rasterized into 'images', AI-mapped on empty text (0%), then blocked by a naming-code gate that doesn't belong. Slimmed to two outcomes — text PDFs extract straight into the editor as a pre-draft (headings/bold/italic/tables only, images committed on save); scans route to attach-as-PDF. AI-map, cross-links, and the naming gate are deleted. Reworked after a grilling session that settled four decisions."
      date="2026-05-22"
      scopes={["desktop", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemStatement />
      <Evidence />
      <RootCause />
      <ProposedFlow />
      <Workstreams />
      <EdgeCases />
      <SelfGrilling />
      <Results />
      <ImplementationPlan />
      <Decisions />
    </AnalysisLayout>
  )
}
