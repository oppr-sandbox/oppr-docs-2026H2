// External Document Importer — pipeline that converts an external SOP/manual
// (PDF, Word, Excel, scanned, image-heavy) into a database-built Oppr DOCS
// document. Static analysis. No feature code yet.
//
// The point of the importer: today the only way an external SOP gets into
// Oppr is "upload PDF, store, RAG over it" (capability 25/26 in oppr_business
// §8). That's Level 1 ingestion. A database-built Oppr document (capability
// 27) is *much* more valuable downstream — it carries metadata, asset links,
// PPE blocks, step lists, log launchers, image library refs, and round-trips
// into the editor. The importer is the bridge from the L1 PDF blob to the
// L3 first-class document.

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Diff,
  FileSpreadsheet,
  FileText,
  FileType,
  Filter,
  GitBranch,
  Image as ImageIcon,
  Hash,
  Languages,
  Layers,
  Link2,
  ListChecks,
  Loader2,
  Lock,
  MessageSquare,
  Package,
  PenLine,
  Quote,
  ScanLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
  Type as TypeIcon,
  User,
  Wand2,
  Workflow,
  Wrench,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function ExternalDocumentImporterAnalysis() {
  return (
    <AnalysisLayout
      title="External Document Importer — markitdown pipeline + AI mapping into Oppr-native SOPs"
      subtitle="Today, the only way a customer's existing SOP gets into Oppr is 'upload PDF, store, RAG'. That's the L1 path. The L3 path is to convert that PDF/Word/Excel/scanned page into a database-built Oppr document with metadata, asset links, PPE blocks, step lists, image library refs, log launchers — the same shape a process engineer would author from scratch. This analysis designs that pipeline end-to-end: extraction (markitdown + image extractor + table fallback), AI structural pass against template instructions, verbatim-vs-improve choice, cross-link/asset resolution, and a wizard with granular per-stage review."
      date="2026-05-07"
      scopes={["desktop", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemSection />
      <StrategicContextSection />
      <PipelineSection />
      <ToolLandscapeSection />
      <TemplateInstructionSection />
      <WorkInstructionAsLogSection />
      <VerbatimVsImproveSection />
      <CrossLinkSection />
      <ImageHandlingSection />
      <UseCaseMatrixSection />
      <UxMockSection />
      <ResultsSection />
      <EdgeCasesSection />
      <SelfGrillingSection />
      <ImplementationPlanSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

// ---------------------------------------------------------------------------
// 1. Summary header
// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="External SOPs land as opaque PDFs. No path to a database-built Oppr document."
          tone="destructive"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="Shipped · 2026-05-07 (browser-only PDF path; Python service deferred)"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="3 Convex modules + 2 lib helpers + ImportPage wizard + sanitiser. ~1,800 LOC across 6 files. P0+P1 (Python service) deferred to v2."
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="npx tsc -b ✓ · npx vite build ✓ · npx convex codegen ✓"
          tone="emerald"
        />
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
    tone === "destructive"
      ? "text-destructive"
      : tone === "emerald"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-primary"
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-sm leading-snug">{value}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results — what shipped on 2026-05-07
// ---------------------------------------------------------------------------

interface ShippedItem {
  title: string
  files: string[]
  before: string
  after: string
}

const SHIPPED: ShippedItem[] = [
  {
    title: "import_jobs schema + lifecycle",
    files: [
      "convex/schema.ts (importJobs table)",
      "convex/importer/jobs.ts (CRUD + resolveLinks + finalizeDocument)",
    ],
    before:
      "No way to persist a multi-stage import. Engineers retyping SOPs manually.",
    after:
      "Job rows track every stage transition (uploaded → extracted → mapped → linksResolved → finalized). Source PDF preserved as the bronze audit copy in Convex storage.",
  },
  {
    title: "Template instructions for SOP / Manual / LMRA / Work-Instruction-Log",
    files: ["convex/importer/templates.ts"],
    before:
      "Generic 'PDF in, document out' AI prompt with no per-template rules.",
    after:
      "Four versioned template instructions, each with slot definitions, recognition cues, output format (TipTap vs LOG spec), and worked JSON examples that pin Gemini's emission to a strict shape. Verbatim instruction softened so it preserves text within nodes rather than collapsing structure.",
  },
  {
    title: "AI mapping action with strict-JSON output",
    files: ["convex/importer/map.ts"],
    before: "Gemini calls written ad hoc per place that needed them.",
    after:
      "runMapping action with responseMimeType=application/json, post-hoc parse, autoDetectTarget heuristic for SOP-vs-LOG, structured failure handling that flips the job stage to 'failed' with a readable error.",
  },
  {
    title: "Cross-link + asset resolution",
    files: ["convex/importer/jobs.ts (resolveLinks mutation)"],
    before: "Asset references in imported docs stayed as plain strings.",
    after:
      "Naming-code regex + bigram fuzzy match against existing assets/documents. Auto-accepts ≥ 0.92 confidence; surfaces the rest as candidates for the engineer.",
  },
  {
    title: "Browser-side PDF text + image extractor",
    files: [
      "src/lib/import/extractPdf.ts",
      "src/lib/import/promoteImages.ts",
    ],
    before:
      "Python service required (markitdown). Unavailable on Convex runtime.",
    after:
      "pdfjs-dist text + image extraction in the browser with op-list traversal, JPEG fast-path (jpegData → image/jpeg blob, no canvas), full RGBA/RGB/grayscale conversion, per-page render fallback when op-list extraction returns nothing, sha256 dedup. Images flow through the existing image library with content-addressed storage.",
  },
  {
    title: "TipTap body sanitiser + per-page fallback",
    files: ["src/lib/import/sanitizeTiptap.ts"],
    before:
      "Wizard's handleFinalize trusted Gemini's body shape. Mismatches → empty editor (the bug from /analysis/importer-pipeline-debug).",
    after:
      "extractBodyContent tries body / body.content / content / type:'doc' / blocks / nodes / tiptap. sanitizeNodes normalises shorthand text, drops unknown types, wraps loose strings into paragraphs. buildFallbackBody produces a per-page paragraph body when sanitisation yields zero blocks — the editor never lands empty.",
  },
  {
    title: "Five-stage import wizard",
    files: [
      "src/pages/desktop/ImportPage.tsx",
      "src/App.tsx (/import + /import/:jobId routes)",
      "src/components/docs/NewDocumentDialog.tsx (third-card 'Convert external')",
      "src/components/ai/FloatingAskIda.tsx (hide on /import)",
    ],
    before: "No UI for any of the above.",
    after:
      "Wizard with stepper, drop-zone + target-template + verbatim/improve picker, classification stats + per-page text + image grid + raw markdown preview, Mapped stage with section-by-section preview, Re-run AI mapping button, link resolution UI, review with editable metadata, finalize that creates the document and routes to the editor.",
  },
  {
    title: "Importer pipeline debug fixes",
    files: [
      "src/lib/import/extractPdf.ts (jpegData branch + paintImageXObjectRepeat + 500-byte sanity check + per-page fallback + stats)",
      "src/lib/import/sanitizeTiptap.ts (whole module new)",
      "convex/importer/templates.ts (worked example + softened verbatim)",
      "src/pages/desktop/ImportPage.tsx (Re-run mapping + raw mappedBody dump always-open + sanitiser wired in)",
    ],
    before:
      "Real-PDF test produced 14 broken-image tiles + an empty editor on finalize. Documented in /analysis/importer-pipeline-debug.",
    after:
      "JPEG-source images captured as JPEG blobs directly (no canvas round-trip). paintImageXObjectRepeat now matched. Sanitiser handles shape mismatches from Gemini. Raw mapping output always visible at the Mapped stage so wrong shapes are spotted before finalize. Per-page fallback ensures the editor never opens empty.",
  },
]

function ResultsSection() {
  return (
    <Section
      title="Results — what shipped"
      description="One row per plan item. Files touched, before/after framing. Two phases shipped: the initial pipeline, then the targeted bug-fix pass following the first real-PDF test."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {SHIPPED.map((r) => (
            <div key={r.title} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
                  {r.files.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.files.map((f) => (
                        <code
                          key={f}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          {f}
                        </code>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 grid gap-2 text-xs leading-relaxed sm:grid-cols-2">
                    <div className="rounded border border-destructive/20 bg-destructive/5 p-2">
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                        Before
                      </div>
                      <div className="text-muted-foreground">{r.before}</div>
                    </div>
                    <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2">
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        After
                      </div>
                      <div className="text-foreground">{r.after}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 2. Problem
// ---------------------------------------------------------------------------

function ProblemSection() {
  return (
    <Section title="Problem">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          Customer SOPs live in PDFs, Word, Excel, and scans. Today they land in
          Oppr as opaque blobs.
        </AlertTitle>
        <AlertDescription className="space-y-2 pt-1.5 text-xs">
          <div>
            Every Mutares-class POC starts with a stack of existing SOPs the
            customer wants visible in the operator app on Day 1. The current
            DOCS path (capabilities 25-26 in oppr_business §8) is "upload PDF,
            store, RAG over the bytes". That works for retrieval but produces
            a dead document: no metadata, no asset binding (only at the file
            level), no PPE block, no step list, no log launcher, no image
            library entries, and the operator can't ask <em>"what's step 4"</em>
            and get a structured answer with the matching photo.
          </div>
          <div>
            A database-built Oppr document (capability 27) is the L3-ready
            asset: editable in TipTap, version-controlled, asset-linked,
            cross-link-aware, embeddings indexable per chunk, pretty-printable.
            But authoring one from scratch is hours of typing for the process
            engineer. Most customers won't pay that price for the dozens of
            existing SOPs they already have. They will if we can get them 80%
            of the way there from their existing file in two minutes.
          </div>
          <div>
            That gap is what the importer closes. Source-format diversity
            (PDFs both born-digital and scanned, Word with embedded images,
            Excel with merged cells and multi-tab workbooks, PPT slide decks
            used as work instructions, plain HTML pages from the customer's
            wiki) is what makes it hard. A single tool won't cover all of
            these — but a pipeline that orchestrates the right tool per
            stage and lets the process engineer review each step will.
          </div>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 3. Strategic context
// ---------------------------------------------------------------------------

function StrategicContextSection() {
  return (
    <Section
      title="Strategic context — why this is a wedge feature"
      description="Tying back to oppr_business.md (the parent doc) so the scope is anchored, not invented."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              The 14-day onboarding promise
            </CardTitle>
            <CardDescription className="text-xs">
              §11 of oppr_business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              Day 11-14 is supposed to land "data flowing, first IDA query
              session". For documents to participate in that IDA session
              meaningfully, the customer's existing SOPs must be in Oppr by
              then — not as PDFs (operators can ask, but answers are noisy and
              uncited) but as structured docs that IDA can chunk reliably and
              cite by step number.
            </p>
            <p>
              Authoring 20 SOPs from scratch in 14 days is unrealistic.
              Importing 20 SOPs from a folder of customer files in 14 days,
              with engineer review, is realistic. The importer is the
              difference between "we'll fill this in over the first 90 days"
              and "your existing knowledge is queryable on day 14".
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              The intelligence ladder
            </CardTitle>
            <CardDescription className="text-xs">§5.4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              The L3 conversational intelligence promise rests on three legs:
              knowledge graph + RAG + SQL. RAG is most useful when the chunks
              IDA retrieves are <em>semantically clean</em> — a step, a PPE
              row, a tool list, a sign-off — not "page 4 of 12 of a scanned
              PDF". The importer turns the latter into the former.
            </p>
            <p>
              An imported-and-cleaned document also means cited answers in the
              operator app point at clickable step blocks, not page-number
              ranges in a viewer. That difference is what moves IDA from
              "interesting prototype" to "the operator-trusted reference".
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">The data-quality model</CardTitle>
            <CardDescription className="text-xs">§5.2 — Medallion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              The importer makes the bronze→silver promotion explicit for
              documents. Bronze = the original file (PDF/Word/Excel),
              preserved verbatim with checksum. Silver = the parsed, sectioned,
              metadata-enriched Oppr document. This mirrors what the LOGS
              capture pipeline already does for operator data and what the
              tag-to-asset mapping does for external SCADA tags.
            </p>
            <p>
              Compliance follow-up: bronze must be retrievable forever — it's
              the audit copy the customer's quality manager refers to when an
              auditor asks "show me what you imported, and who validated the
              import".
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              The closed loop (UC4)
            </CardTitle>
            <CardDescription className="text-xs">§7 use case 4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              UC4 is "lessons-learned-to-SOP cycle". The cycle assumes there's
              a baseline SOP to update. If that SOP is a PDF, the engineer's
              update path is "open PDF in Word, edit, re-export, re-upload" —
              a worse experience than the paper SOP they replaced. If the
              importer landed it as a database-built doc, the update path is
              "edit in TipTap, version-bump, publish" — the loop becomes
              actually closeable.
            </p>
            <p>
              v1.1 layers AI-assisted authoring on top. The importer is what
              makes v1.1 practical: AI suggests an edit on a structured doc;
              suggesting an edit on a raster-PDF is hand-waving.
            </p>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 4. Pipeline architecture
// ---------------------------------------------------------------------------

interface Stage {
  n: number
  icon: typeof AlertTriangle
  title: string
  what: string
  tooling: string
  bronze: string
  silver: string
  human: string
}

const STAGES: Stage[] = [
  {
    n: 1,
    icon: Package,
    title: "Ingest",
    what: "Customer drops a PDF/Word/Excel/PPT/HTML/image. Server hashes the bytes, stores in Convex _storage, and creates an `import_jobs` row in status `received`. File is the bronze copy from this point on.",
    tooling: "Convex `_storage`, sha256, `import_jobs` table",
    bronze: "Original bytes preserved unchanged",
    silver: "—",
    human: "Drag-and-drop. No required input besides the file.",
  },
  {
    n: 2,
    icon: ScanLine,
    title: "Classify + decide",
    what: "Detect file type. Detect whether a PDF is born-digital (text layer present) or scanned (no text, requires OCR). Detect whether Excel is single-sheet or workbook. Pick the right downstream branch. Record decision in the job row so it's reviewable later.",
    tooling: "PDF.js text-layer probe, libreoffice headless probe, magic-bytes",
    bronze: "—",
    silver: "—",
    human: "Auto. User sees the classification and can override (e.g. force OCR even on text-PDF for problematic scans).",
  },
  {
    n: 3,
    icon: FileText,
    title: "Extract structure",
    what: "Run markitdown for the 80% common case: PDF/Word/Excel/PPT/HTML → Markdown with headings, lists, tables, images. Fall back to specialised tools where markitdown is weak (see Tool Landscape below). Output: a single Markdown document plus a list of extracted images. Tables come out as Markdown tables; complex tables go to a dedicated `pdfplumber`/`Camelot` pass and come back as JSON-table objects.",
    tooling: "markitdown (Microsoft) + pdfplumber/Camelot (table fallback) + Tesseract (OCR fallback)",
    bronze: "Raw markitdown output retained per job",
    silver: "—",
    human: "Auto. User sees a side-by-side preview (source page ↔ extracted markdown).",
  },
  {
    n: 4,
    icon: ImageIcon,
    title: "Image extraction + dedup",
    what: "Walk the source for embedded images (PDF objects, Word media folder, Excel embedded images). For each: dimension probe, sha256, push to Convex `_storage`, register in `images` table. The image library's existing dedup means images that already exist are reused. If the source is a scan with no separate image objects, run page-region segmentation (CV-based) to crop figures and treat each crop as an image.",
    tooling: "PyMuPDF / docx-zip / openpyxl / page-region segmenter, Convex `images` table (existing)",
    bronze: "Each image's original bytes",
    silver: "Image-library row with sha256 + caption-from-source",
    human: "Reviewer sees thumbnails with their caption-region context, can drop irrelevant ones (page numbers, watermarks).",
  },
  {
    n: 5,
    icon: Brain,
    title: "AI structural mapping",
    what: "Send (markdown + image refs + target-template instruction) to Gemini. AI emits a TipTap-shaped JSON: `{ heading, body[], ppe?, tools?, steps[]: { number, body, imageRef?, signOff? }, lmra?, sourceCitation }`. The template instruction (next section) constrains the structure so the output can be round-tripped into the editor with confidence.",
    tooling: "Gemini 2.0 / 2.5 (long context), structured-output mode with strict JSON schema",
    bronze: "Prompt + raw response retained for audit",
    silver: "TipTap JSON, confidence per slot",
    human: "Granular review: each section can be accepted, edited inline, or rejected (falls back to verbatim copy of the source range).",
  },
  {
    n: 6,
    icon: Link2,
    title: "Cross-link + asset resolution",
    what: "Walk the AI output for: naming-code patterns ({SITE}-{DEPT}-{TYPE}-{NNNN}), asset names, PPE keywords. Fuzzy-match against the platform's asset registry and existing documents. Surface confident matches inline as linkedAsset/launchLog nodes; surface ambiguous matches in a sidebar requiring user confirmation.",
    tooling: "Naming-code regex, fuzzy-match against `assets.name` and `documents.title`, PPE keyword dictionary",
    bronze: "—",
    silver: "Resolved linkedAsset + launchLog node IDs in the body",
    human: "Confirm/reject each suggestion. Bulk-accept high-confidence matches.",
  },
  {
    n: 7,
    icon: GitBranch,
    title: "Verbatim ↔ improve choice",
    what: "For each AI-mapped section, the engineer can flip a switch between 'verbatim' (paste the source range character-for-character into the body, AI's role is only to find the *boundaries* of the section) and 'improved' (AI rewrites in Oppr-template tone). A diff view shows the difference. Default is verbatim — the safer choice for legally-validated SOPs.",
    tooling: "Diff component, prompt switch in the AI call",
    bronze: "—",
    silver: "Section-level provenance flag stored on the document",
    human: "Per-section toggle. Can also bulk-accept/bulk-improve.",
  },
  {
    n: 8,
    icon: Wand2,
    title: "Hand-off to TipTap editor",
    what: "Final step writes a draft to `documents` with status `draft`, naming code suggested from filename + asset binding, body = the final TipTap JSON. Original file remains attached for audit. The engineer lands in the standard editor with a 'Imported from <filename>' provenance banner — and from here the doc behaves like any database-built doc.",
    tooling: "Existing `documents.create` mutation, with `imported_from_storage_id` field",
    bronze: "Original file remains in `_storage`",
    silver: "Standard documents row, ready to publish",
    human: "Engineer polishes, may decide to revert to verbatim or improve more sections, then publishes.",
  },
]

function PipelineSection() {
  return (
    <Section
      title="The pipeline — eight stages, each independently reviewable"
      description="The whole pipeline must be transparent to the engineer at every stage. We never want a black-box 'PDF in, magic out' button — that'll produce wrong-looking docs the engineer can't fix without re-running. Stage-by-stage review lets the engineer accept the parts that worked and intervene where the source defeats the tool."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[18%]">Stage</TableHead>
                <TableHead className="w-[35%]">What it does</TableHead>
                <TableHead className="w-[20%]">Tooling</TableHead>
                <TableHead className="w-[22%]">Human review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STAGES.map((s) => (
                <TableRow key={s.n}>
                  <TableCell className="align-top font-mono text-[11px] text-muted-foreground">
                    {s.n}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <s.icon className="h-3.5 w-3.5 text-primary" />
                      {s.title}
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                      <span>
                        <span className="font-mono uppercase tracking-wider">
                          bronze
                        </span>{" "}
                        — {s.bronze}
                      </span>
                      <span>
                        <span className="font-mono uppercase tracking-wider">
                          silver
                        </span>{" "}
                        — {s.silver}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-xs leading-relaxed">
                    {s.what}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {s.tooling}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {s.human}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert>
        <Layers className="h-4 w-4" />
        <AlertTitle>The pipeline is not a single AI call.</AlertTitle>
        <AlertDescription className="text-xs">
          The temptation is to throw the file at Gemini's multimodal endpoint
          and let it generate the whole doc. We've tested that — it's
          unreliable on long docs, hallucinates structure that isn't there,
          and offers no way to audit "where did this paragraph come from in
          the source". The deterministic extract step (markitdown +
          pdfplumber + Tesseract) is what gives every paragraph a
          source-page-and-line citation. The AI call only restructures —
          it doesn't invent content.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 5. Tool landscape
// ---------------------------------------------------------------------------

interface ToolRow {
  name: string
  vendor: string
  format: string
  strengths: string
  weaknesses: string
  pick: "primary" | "fallback" | "no"
  reason: string
}

const TOOLS: ToolRow[] = [
  {
    name: "markitdown",
    vendor: "Microsoft (OSS, MIT)",
    format: "PDF, DOCX, XLSX, PPTX, HTML, images, audio",
    strengths:
      "Single CLI, broad format coverage, structured Markdown out, active project, cheap to run.",
    weaknesses:
      "Tables are imperfect on complex layouts. Image OCR requires Azure Document Intelligence key for the highest fidelity. Sometimes inlines image references as bare text rather than image links.",
    pick: "primary",
    reason:
      "The 80% case. Single dependency, single output format, easy to wrap as a Convex action.",
  },
  {
    name: "Docling",
    vendor: "IBM (OSS, MIT)",
    format: "PDF, DOCX, HTML, images",
    strengths:
      "State-of-the-art document layout understanding. Handles multi-column, sidebars, footnotes, tables better than markitdown.",
    weaknesses:
      "Heavier dependency (PyTorch). Narrower format coverage. Slower per page.",
    pick: "fallback",
    reason:
      "Use when markitdown produces messy output on a specific PDF — engineer can re-run that file through Docling. Not the default because the cost/benefit only pays off for a minority of inputs.",
  },
  {
    name: "pdfplumber + Camelot",
    vendor: "OSS (MIT)",
    format: "PDF tables only",
    strengths:
      "Fine-grained table extraction with cell coordinates. Handles bordered and stream-mode tables.",
    weaknesses: "PDF-only, table-only. Not a general extractor.",
    pick: "fallback",
    reason:
      "Replace markitdown's table output for any page where the markitdown table is malformed (missing headers, merged cells flattened). Triggered automatically if a markitdown table fails a structural sanity check.",
  },
  {
    name: "Tesseract",
    vendor: "OSS (Apache)",
    format: "Images (raster) → text",
    strengths:
      "Mature OCR. Multi-language. Runs locally, no per-page cost.",
    weaknesses:
      "Layout-blind: outputs reading order is fragile on multi-column scans. Confidence varies wildly with scan quality.",
    pick: "fallback",
    reason:
      "Used when classify-stage decides a PDF is image-only. Output goes back through markitdown's text-only pass for structuring.",
  },
  {
    name: "LlamaParse",
    vendor: "LlamaIndex (commercial)",
    format: "PDF, Word, PPT, images",
    strengths:
      "Best-in-class layout-aware parsing, handles forms and complex tables, returns Markdown.",
    weaknesses:
      "Commercial, per-page pricing. Sends bytes to a third-party. Compliance ask for industrial customers.",
    pick: "no",
    reason:
      "Skip for v1. We want self-hostable so we can promise no third-party data egress to compliance-anxious customers (waste/recycling, where SOPs may contain legal-status info on hazardous materials).",
  },
  {
    name: "Unstructured.io",
    vendor: "Unstructured (commercial + OSS)",
    format: "PDF, DOCX, etc.",
    strengths: "Production pipeline. Used heavily in RAG stacks.",
    weaknesses:
      "OSS version is much weaker than the commercial API. The commercial API has the same egress problem as LlamaParse.",
    pick: "no",
    reason:
      "Same compliance concern. Markitdown + Docling + the table fallback covers the same ground without third-party calls.",
  },
  {
    name: "PyMuPDF",
    vendor: "Artifex (AGPL/Commercial)",
    format: "PDF (image extraction primary)",
    strengths:
      "Reliable image extraction by object. Fast, in-process.",
    weaknesses:
      "AGPL — the licence is a deal-breaker for distributing client-side, but server-side use is fine.",
    pick: "primary",
    reason:
      "Image extraction stage runs server-side only, so AGPL is a non-issue. Cleaner output than markitdown's image inlining.",
  },
  {
    name: "Gemini 2.5 multimodal",
    vendor: "Google",
    format: "Anything Google can read",
    strengths:
      "One call from PDF → JSON. Easy to set up.",
    weaknesses:
      "Hallucination on long docs, no per-section provenance, expensive at volume, single point of failure.",
    pick: "no",
    reason:
      "We use Gemini for the structural-mapping stage only — i.e. on text we've already deterministically extracted. Letting Gemini do the extraction too would be cheaper to ship but give us no audit trail and zero recovery when it gets confused on page 14.",
  },
]

function ToolLandscapeSection() {
  return (
    <Section
      title="Tool landscape — what we picked, what we ruled out, why"
      description="Did the research. Most blog posts about 'best PDF→Markdown tool 2026' are sponsored content for the commercial API players. The OSS pure-server stack covers our needs without the data-egress problem."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">Tool</TableHead>
                <TableHead className="w-[14%]">Vendor</TableHead>
                <TableHead className="w-[18%]">Strengths</TableHead>
                <TableHead className="w-[20%]">Weaknesses</TableHead>
                <TableHead className="w-[10%]">Decision</TableHead>
                <TableHead className="w-[24%]">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOOLS.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="align-top">
                    <div className="text-xs font-semibold font-mono">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t.format}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {t.vendor}
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {t.strengths}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {t.weaknesses}
                  </TableCell>
                  <TableCell className="align-top">
                    <PickBadge pick={t.pick} />
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {t.reason}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Compliance-driven shortlist.</AlertTitle>
        <AlertDescription className="text-xs">
          Mutares Holliday processes hazardous waste; their SOPs may reference
          regulated handling procedures. Sending those bytes to LlamaParse or
          Unstructured's cloud is a conversation we don't want to have at the
          procurement stage. Self-hosted markitdown + Docling + PyMuPDF +
          Tesseract is a stack we can promise stays inside Convex's VPC. The
          Gemini call sees only the extracted text (engineer-reviewable
          beforehand), not the raw file.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Yes — markitdown extracts images. But our v1 ships browser-only.
          </CardTitle>
          <CardDescription className="text-xs">
            Quick clarification on the question: "does markitdown also extract
            images for digitally-born SOPs?"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs leading-relaxed">
          <p>
            <strong>Markitdown's image story:</strong> for PDFs, markitdown
            inlines image references as Markdown image links and includes the
            embedded image bytes in its output bundle. For DOCX, it walks the{" "}
            <code className="rounded bg-muted px-1 font-mono">/word/media/</code>{" "}
            folder of the zip. For XLSX it pulls embedded images. So yes — it
            does extract images, with caveats per format.
          </p>
          <p>
            <strong>Our v1 path is even simpler.</strong> Markitdown is a
            Python tool and Convex doesn't run Python. Standing up a separate
            Python service is a P1 step in the plan below. For v1 we ship a{" "}
            <em>browser-only</em> extractor that uses{" "}
            <code className="rounded bg-muted px-1 font-mono">
              pdfjs-dist
            </code>{" "}
            (already in our dependency tree for the existing PDF viewer) to
            extract per-page text and embedded image objects directly in the
            user's browser. PDF.js exposes images via{" "}
            <code className="rounded bg-muted px-1 font-mono">
              page.objs.get
            </code>{" "}
            for objects referenced by{" "}
            <code className="rounded bg-muted px-1 font-mono">
              OPS.paintImageXObject
            </code>{" "}
            after the page has been rendered. We render-then-extract, then
            push every image through the existing{" "}
            <code className="rounded bg-muted px-1 font-mono">
              api.images.createFromUpload
            </code>{" "}
            mutation — the sha256 dedup happens automatically, and the new
            "imported from this PDF" provenance shows up in the image
            library's "used in" panel for that document.
          </p>
          <p>
            <strong>v1 limitation:</strong> browser-only path covers PDFs.
            DOCX / XLSX / PPTX / scanned-PDF (OCR) requires the Python service
            and lands in P1. For v1, the wizard accepts only PDFs and gives a
            clear "Word/Excel coming soon" message for other formats.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

function PickBadge({ pick }: { pick: ToolRow["pick"] }) {
  if (pick === "primary") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
        primary
      </Badge>
    )
  }
  if (pick === "fallback") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
        fallback
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground text-[10px]">
      no
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 6. Template-instruction system
// ---------------------------------------------------------------------------

interface TemplateRow {
  type: string
  slots: string[]
  whenToUse: string
  customNodes: string
}

const TEMPLATES: TemplateRow[] = [
  {
    type: "Standard Operating Procedure (SOP)",
    slots: [
      "Title + naming code",
      "Purpose (1-3 sentences)",
      "Scope",
      "Safety / PPE block",
      "Tools & equipment",
      "Step-by-step (numbered, optional image, optional sign-off)",
      "Emergency / abnormal conditions",
      "Sign-off + revision history",
    ],
    whenToUse:
      "The default for any operator-facing procedural document. Most existing customer SOPs map to this shape.",
    customNodes: "ppe, stepList, stepItem, signOff, launchLog (optional)",
  },
  {
    type: "Work Instruction → Log spec (NOT a doc)",
    slots: [
      "Log title + asset binding",
      "Ordered list of LOG primitives (TextMessage, TextInput, ChoiceInput, NumericInput, PhotoInput, Sign-off)",
      "Per-primitive title + question/message + optional unit/options/min-max",
    ],
    whenToUse:
      "Any procedural instruction whose intent is operator-action-and-capture. The right home for these is LOGS (Oppr's capture system), not DOCS. Importer hands off a log-spec JSON, not a TipTap body. See the dedicated section below.",
    customNodes: "(none — produces a log spec, not a TipTap doc)",
  },
  {
    type: "Equipment Manual",
    slots: [
      "Cover (manufacturer, model, serial)",
      "Specifications",
      "Operation",
      "Maintenance schedule",
      "Troubleshooting",
      "Spare parts",
    ],
    whenToUse:
      "Supplier-provided. Often 80+ pages. Importer focuses on extracting the maintenance schedule and troubleshooting; rest stays as the original PDF attached.",
    customNodes: "callout, table, diagram",
  },
  {
    type: "FMEA / Risk Assessment",
    slots: [
      "Asset",
      "Failure modes table (mode, effect, cause, severity, controls)",
      "Recommended actions",
    ],
    whenToUse:
      "Customer-provided FMEA spreadsheets. Maps cleanly because the source is already structured.",
    customNodes: "table",
  },
  {
    type: "LMRA / Last-minute risk assessment",
    slots: ["Hazard checklist", "Mitigations", "Operator sign-off"],
    whenToUse:
      "Pre-task safety checks. Often a one-page form. Maps to a small structured doc with a single LMRA block.",
    customNodes: "lmra (planned, P4 of editor overhaul), signOff",
  },
  {
    type: "5S / Audit checklist",
    slots: ["Area", "Checklist (item, status, comment)", "Score", "Sign-off"],
    whenToUse:
      "Often Excel sheets. Imports cleanly because the source is tabular.",
    customNodes: "table, signOff",
  },
]

function TemplateInstructionSection() {
  return (
    <Section
      title="Template-instruction system — what the AI maps into"
      description="The AI mapping step needs structure to map to. We define one 'template instruction' per Oppr document type. Each instruction is a JSON description of slots — semantic regions (purpose, scope, PPE, steps) — plus prompts that tell the model how to recognise them in the source. Output: a TipTap-shaped JSON the editor can open."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Document type</TableHead>
                <TableHead className="w-[34%]">Template slots</TableHead>
                <TableHead className="w-[26%]">When to use</TableHead>
                <TableHead className="w-[20%]">Custom TipTap nodes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEMPLATES.map((t) => (
                <TableRow key={t.type}>
                  <TableCell className="align-top text-xs font-semibold">
                    {t.type}
                  </TableCell>
                  <TableCell className="align-top">
                    <ul className="list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed">
                      {t.slots.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {t.whenToUse}
                  </TableCell>
                  <TableCell className="align-top text-[11px] font-mono text-muted-foreground">
                    {t.customNodes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Template-instruction JSON</CardTitle>
          <CardDescription className="text-xs">
            One example. The full system has one of these per template type
            and ships as a versioned config inside the repo so the AI prompt
            stays auditable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted/30 p-3 text-[11px] leading-relaxed">
            <code>{TEMPLATE_INSTRUCTION_EXAMPLE}</code>
          </pre>
        </CardContent>
      </Card>

      <Alert>
        <Settings2 className="h-4 w-4" />
        <AlertTitle>The instruction is the real product.</AlertTitle>
        <AlertDescription className="text-xs">
          The pipeline tooling (markitdown, Gemini, etc.) is generic. The
          differentiator is the Oppr-specific template-instructions: the
          slots, the recognition cues, the verbatim-vs-improve rules, the
          mapping into our custom TipTap nodes. That's what turns generic
          "PDF → Markdown" tools into "Mutares-quality SOP imports".
          Maintaining and improving these instructions is an ongoing
          internal product activity, not a one-shot build.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

const TEMPLATE_INSTRUCTION_EXAMPLE = `{
  "type": "sop",
  "version": 1,
  "slots": [
    {
      "id": "purpose",
      "label": "Purpose",
      "required": true,
      "recognition_cues": [
        "Section heading 'Purpose' / 'Doel' / 'Zweck'",
        "First narrative paragraph after the title",
        "Common phrases: 'This procedure describes…', 'The aim of this…'"
      ],
      "render_as": "paragraph"
    },
    {
      "id": "ppe",
      "label": "Personal protective equipment",
      "required": false,
      "recognition_cues": [
        "Heading 'PPE' / 'Safety equipment' / 'Persoonlijke beschermingsmiddelen'",
        "Pictogram-row tables",
        "Bullet list of items: helmet, gloves, hi-vis, etc."
      ],
      "render_as": "ppe_block"
    },
    {
      "id": "steps",
      "label": "Procedure steps",
      "required": true,
      "recognition_cues": [
        "Numbered list with 1./2./3. or step 1, step 2",
        "Imperative-mood verbs at sentence start",
        "Photos interleaved between numbered items"
      ],
      "render_as": "step_list",
      "per_item_substructure": {
        "body": "step text verbatim",
        "image_ref": "nearest preceding image_id, if any",
        "sign_off_required": "true if step contains 'sign', 'initial', 'verify' etc."
      }
    },
    {
      "id": "sign_off",
      "label": "Sign-off",
      "required": true,
      "recognition_cues": [
        "Lines like 'Performed by:', 'Verified by:', signature blocks",
        "Tables with name + date + signature columns"
      ],
      "render_as": "sign_off_block"
    }
  ],
  "verbatim_default": true,
  "language_passthrough": true
}`

// ---------------------------------------------------------------------------
// 6b. Work Instruction → Log spec
// ---------------------------------------------------------------------------

interface PrimitiveRow {
  primitive: string
  icon: typeof MessageSquare
  description: string
  fields: string
  recognitionCues: string
}

const LOG_PRIMITIVES: PrimitiveRow[] = [
  {
    primitive: "Text Message",
    icon: MessageSquare,
    description:
      "Display-only instruction shown to the operator. No input collected. Equivalent to a 'tell the operator something' card.",
    fields: "title, message",
    recognitionCues:
      "Source phrases like 'before you start', 'note that', 'safety reminder', 'instructions:', 'you must', plus any pure-prose paragraph that does NOT ask for a response.",
  },
  {
    primitive: "Text Input",
    icon: TypeIcon,
    description:
      "Free-text response from the operator. Used for short codes, names, comments. Voice → transcribed text is the same primitive.",
    fields: "title, question",
    recognitionCues:
      "'Enter…', 'record the…', 'note any abnormalities', 'comment:', 'observation:', 'reason for…'.",
  },
  {
    primitive: "Choice Input",
    icon: ListChecks,
    description:
      "Operator picks from a finite set of options. Renders as Dropdown or Multiple-Choice.",
    fields: "title, question, inputType (dropdown|multipleChoice), options[]",
    recognitionCues:
      "Source contains a finite enumeration: 'select one of: A / B / C', 'mark each that applies', 'status: green / yellow / red', tickbox lists, status enums.",
  },
  {
    primitive: "Numeric Input",
    icon: Hash,
    description:
      "Operator enters a number. Optional unit + min/max validation.",
    fields: "title, question, unitName, minValue?, maxValue?",
    recognitionCues:
      "Phrases referencing measurements, units, ranges: '°C', 'bar', 'rpm', 'between 5 and 10', 'record temperature', 'check pressure'.",
  },
  {
    primitive: "Photo Input",
    icon: ImageIcon,
    description:
      "Operator captures a photo. Optional HMI template overlay for guided field-extraction (sticker OCR etc.).",
    fields: "title, photoInstructions",
    recognitionCues:
      "'Take a photo of…', 'photograph the…', 'attach picture', 'evidence', 'visual confirmation'.",
  },
  {
    primitive: "Sign-off",
    icon: PenLine,
    description:
      "Slider / 2-step button confirming the operator has performed an action. Stores boolean + timestamp + user. (v1.0 LOGS primitive — currently a workaround text field.)",
    fields: "title, message",
    recognitionCues:
      "'Initial', 'sign here', 'confirm completion', 'verified by', 'performed by', signature blocks at the bottom of step lists.",
  },
]

function WorkInstructionAsLogSection() {
  return (
    <Section
      title="Work Instructions are LOGS, not DOCS"
      description="The Oppr execution platform splits standardisation (DOCS) from capture (LOGS). A Work Instruction is fundamentally a capture flow — operator reads a step, performs the action, records the outcome. That's exactly what LOGS does. The importer recognises this and hands off a log-spec JSON to LOGS, not a TipTap body to DOCS."
    >
      <Alert>
        <Workflow className="h-4 w-4" />
        <AlertTitle>Two outputs, one importer.</AlertTitle>
        <AlertDescription className="text-xs">
          When the engineer picks the target template on stage 1 of the
          wizard, "Standard Operating Procedure" produces a TipTap document
          via stages 5-8. "Work Instruction" produces a log spec via the same
          extract + classify stages but a different mapping pass and a
          different review surface. The connector to LOGS is a future
          integration; for v1 the wizard outputs the spec as JSON for the
          process engineer to import into the LOGS configurator.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            The 6 LOG primitives (the AI's mapping target)
          </CardTitle>
          <CardDescription className="text-xs">
            From oppr_business §4.1. The LOGS configurator (Back-to-Main-App
            screenshots, 2026-04-29) exposes 5 of these today; sign-off is the
            v1.0 addition. The importer's job is to take operator-facing
            steps from a Work Instruction and choose, per step, which
            primitive to emit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[16%]">Primitive</TableHead>
                <TableHead className="w-[28%]">What it does</TableHead>
                <TableHead className="w-[26%]">Fields the AI must fill</TableHead>
                <TableHead className="w-[30%]">Recognition cues in source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOG_PRIMITIVES.map((p) => (
                <TableRow key={p.primitive}>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <p.icon className="h-3.5 w-3.5 text-primary" />
                      {p.primitive}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {p.description}
                  </TableCell>
                  <TableCell className="align-top text-[11px] font-mono text-muted-foreground">
                    {p.fields}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {p.recognitionCues}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            What the importer drops vs keeps
          </CardTitle>
          <CardDescription className="text-xs">
            A typical Work Instruction PDF contains prose the operator does
            not need at execution time. The importer keeps only the
            action-set; everything else is dropped or used to inform metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                Dropped (or moved to log description)
              </div>
              <ul className="space-y-1">
                <li>• Title page, document control, revision history</li>
                <li>• Purpose / scope / definitions / abbreviations</li>
                <li>• Lengthy theoretical introduction</li>
                <li>• Document references &amp; legal disclaimers</li>
                <li>• Author / approver block</li>
                <li>• Step-narrative paragraphs that aren't actionable</li>
              </ul>
            </div>
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Kept (becomes a primitive in the log)
              </div>
              <ul className="space-y-1">
                <li>• Each numbered operator action</li>
                <li>• Required readings (numeric)</li>
                <li>• Required photos / visual confirmations</li>
                <li>• Pass/fail + status pickers (choice)</li>
                <li>• Free-text observations the operator must record</li>
                <li>• Operator sign-off / verification gates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Worked example — extracted Work Instruction → Log spec
          </CardTitle>
          <CardDescription className="text-xs">
            Source: a 4-step "Daily extruder check" Work Instruction. Output:
            the same 4 actions as 4 LOG primitives, plus a final sign-off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border bg-muted/20 p-3 text-[11px] leading-relaxed">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Source Work Instruction
              </div>
              <p className="font-semibold mt-1">Daily extruder check</p>
              <p className="text-muted-foreground">
                Purpose: Ensure the extruder is operating within tolerance at
                the start of each shift. (← dropped)
              </p>
              <ol className="mt-1 list-decimal pl-4 space-y-0.5">
                <li>Confirm safety guards are in position before powering up.</li>
                <li>Record the barrel temperature in °C (range 180-220).</li>
                <li>Take a photo of the screen showing screw RPM.</li>
                <li>Pass / Fail / Repair: check oil-level sight glass.</li>
                <li>Sign and date.</li>
              </ol>
            </div>
            <div className="rounded-md border bg-card p-3 text-[11px] leading-relaxed">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Log spec output
              </div>
              <pre className="overflow-x-auto rounded bg-muted/30 p-2 text-[10px]">
                <code>{`{
  "title": "Daily extruder check",
  "assetBinding": "EXTRUDER_8C",
  "description": "Ensure extruder operates within tolerance at shift start.",
  "primitives": [
    { "kind": "textMessage", "title": "Safety check",
      "message": "Confirm safety guards are in position before powering up." },
    { "kind": "numericInput", "title": "Barrel temperature",
      "question": "Record the barrel temperature.",
      "unitName": "°C", "minValue": 180, "maxValue": 220 },
    { "kind": "photoInput", "title": "Screw RPM",
      "photoInstructions": "Take a photo of the screen showing screw RPM." },
    { "kind": "choiceInput", "title": "Oil sight glass",
      "question": "Check the oil-level sight glass.",
      "inputType": "multipleChoice",
      "options": ["Pass", "Fail", "Repair"] },
    { "kind": "signOff", "title": "Confirm complete",
      "message": "Sign and date." }
  ]
}`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <ListChecks className="h-4 w-4" />
        <AlertTitle>Two-target classifier on stage 2.</AlertTitle>
        <AlertDescription className="text-xs">
          When the engineer picks "auto-detect" instead of an explicit
          target template, the classifier runs a recognition pass: if the
          source is dominated by numbered operator actions with measurable
          outcomes, it suggests Work-Instruction-Log; if it's dominated by
          procedural prose (purpose, scope, safety, narrative steps) it
          suggests SOP-Document. The engineer can override either way.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 7. Verbatim vs improve
// ---------------------------------------------------------------------------

function VerbatimVsImproveSection() {
  return (
    <Section
      title="Verbatim vs improve — the choice that makes or breaks adoption"
      description="The single most important UX decision. Get it wrong and we lose the customer's trust the first time their compliance officer asks 'what does our SOP say?' and the answer doesn't match the document Quality has on file."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Quote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Verbatim — the default
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              The body text is the source range, character-for-character.
              The AI's role is only to find the <em>boundaries</em> of each
              slot ("this is the Purpose", "step 3 ends here") and to bind
              the right image reference. No rewriting, no summarising, no
              tone normalisation.
            </p>
            <p>
              Why default: the customer's existing SOP is what they audited,
              trained operators on, and signed off. Replacing the prose with
              "AI's improved version" is a compliance liability we shouldn't
              ask them to assume on auto-pilot.
            </p>
            <p className="font-medium">
              Provenance: each verbatim section stores the source byte-range
              so we can re-derive the same text on demand for an audit.
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Improve — opt-in per section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              The engineer flips a per-section toggle. AI rewrites in the
              Oppr template tone (clear, imperative, terse), normalises
              terminology, expands abbreviations on first use, fixes
              obvious OCR slips. A diff view shows the change in red/green
              before the engineer accepts it.
            </p>
            <p>
              Why opt-in: this is what makes the imported doc <em>better</em>{" "}
              than the source — but only when the engineer chooses to take
              that risk. Often the right call is "verbatim for the legal
              steps, improve for the introduction".
            </p>
            <p className="font-medium">
              Provenance: marked at section level so a future audit can
              identify "which paragraphs were AI-edited and approved by
              which engineer on which date".
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Diff className="h-4 w-4 text-primary" />
            Diff view
          </CardTitle>
          <CardDescription className="text-xs">
            What the engineer sees when they flip 'Improve' on a section.
            Mocked here with the standard Card + a two-column diff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs leading-relaxed">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                Verbatim (source)
              </div>
              <p className="text-muted-foreground">
                "<del>Step 3</del> Operator must to ensure that the gate is in
                <del>fully</del> closed position before he proceed with the
                <del>activation</del> of the conveyor system,{" "}
                <del>inappropriate</del> opening can cause material spillage and
                potentially injure personnel."
              </p>
            </div>
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Improved (Oppr tone, imperative)
              </div>
              <p>
                "Confirm the gate is closed before activating the conveyor.
                Opening the gate while the conveyor runs causes material
                spillage and risk of injury."
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px]">
                section: step 3
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                provenance: AI-edited 2026-05-07 by Floris
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                Revert to verbatim
              </Button>
              <Button size="sm" className="h-7 px-2 text-xs">
                Accept
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 8. Cross-link / asset resolution
// ---------------------------------------------------------------------------

function CrossLinkSection() {
  return (
    <Section
      title="Cross-link & asset resolution"
      description="A customer SOP says 'see procedure HOL-OPS-SOP-0015' or 'inspect Extruder 8C'. The importer should turn those into clickable references. Static text → linkedAsset / launchLog nodes."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Naming-code references</CardTitle>
            <CardDescription className="text-xs">
              Pattern: {"{SITE}-{DEPT}-{TYPE}-{NNNN}"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              Regex match against the body. For each hit, look up the document
              in our `documents` table.
            </p>
            <ul className="space-y-1 text-[11px]">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                <span>
                  Match found and unique: replace text with{" "}
                  <code className="rounded bg-muted px-1 font-mono">
                    linkedAsset
                  </code>{" "}
                  node, no review needed.
                </span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                <span>
                  No match: highlight in the editor with a "broken link"
                  badge — the referenced doc may not be imported yet.
                </span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                <span>
                  Multiple matches (rare, but possible across versions): show a
                  picker.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Asset name references</CardTitle>
            <CardDescription className="text-xs">
              Free-text mentions of asset names
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              Fuzzy-match every noun phrase in step text against{" "}
              <code className="rounded bg-muted px-1 font-mono">assets.name</code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1 font-mono">
                assets.naming_code
              </code>
              . Confidence threshold: only auto-bind ≥ 0.92 similarity.
            </p>
            <ul className="space-y-1 text-[11px]">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                <span>
                  "Extruder 8C" → asset{" "}
                  <code className="rounded bg-muted px-1 font-mono">
                    EXTRUDER_8C
                  </code>{" "}
                  (≥ 0.92): auto-link.
                </span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                <span>
                  "the extruder" (ambiguous): leave as plain text. Sidebar
                  suggests a manual link.
                </span>
              </li>
              <li className="flex gap-2">
                <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-600" />
                <span>
                  Generic words (gate, door, screen): never auto-link.
                  Maintain a stop-list per template.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Log launchers</CardTitle>
            <CardDescription className="text-xs">
              "Run the daily check" → launchLog node
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              Phrases like "complete log", "fill in form", "scan the QR and run
              the round" indicate a log-launch reference. Surface these as{" "}
              <em>suggestions</em> in the editor sidebar, not auto-bound — the
              engineer needs to pick which specific log to point at.
            </p>
            <p>
              v1.0 supports clickable log launchers per capability 29 of
              oppr_business §8. v1.1 will let the operator complete the log
              inside the SOP context. The importer just plants the seed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">PPE keyword detection</CardTitle>
            <CardDescription className="text-xs">
              Build a curated dictionary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs leading-relaxed">
            <p>
              Maintain a dictionary mapping PPE keywords (gloves, helmet,
              goggles, hi-vis, hearing protection, FFP2 mask, hard hat, …) to
              our existing PPE atom block presets. When the AI mapping pass
              identifies the PPE slot, it returns a list of detected items;
              the importer renders them as the existing{" "}
              <code className="rounded bg-muted px-1 font-mono">ppe</code>{" "}
              custom node.
            </p>
            <p>
              Multilingual: the dictionary supports EN/NL/DE/FR by design,
              since first ICP customers (waste/recycling in NL/DE/FR) have
              SOPs in their native language.
            </p>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 9. Image handling
// ---------------------------------------------------------------------------

function ImageHandlingSection() {
  return (
    <Section
      title="Image handling — promote to image library, not inline blobs"
      description="Every image extracted from the source goes through the existing image library (sha256-deduped, asset-linked, per-image alt text). The body references images by image_id, not by base64 blob — same model as authored docs."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-xs leading-relaxed">
          <p>
            The image library landed in the previous editor overhaul. The
            importer plugs into it: every extracted image goes through{" "}
            <code className="rounded bg-muted px-1 font-mono">
              api.images.createFromUpload
            </code>
            , which already does the sha256 dedup. If the customer's SOP
            already includes a logo or a PPE pictogram we've seen before, it
            de-dupes silently and we save storage.
          </p>
          <Separator />
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-md border bg-card p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                Embedded images
              </div>
              <div className="text-[11px] text-muted-foreground">
                PDFs, Word .docx (media folder), Excel embedded images. Extract
                via PyMuPDF / docx-zip / openpyxl. Original bytes preserved.
              </div>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                <ScanLine className="h-3.5 w-3.5 text-primary" />
                Page-region segmentation
              </div>
              <div className="text-[11px] text-muted-foreground">
                For scanned-PDF pages where there's no separate image object,
                run a CV-based segmenter (Docling's layout model or
                LayoutParser) to crop figure regions. Each crop = one image.
              </div>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Auto-filter junk
              </div>
              <div className="text-[11px] text-muted-foreground">
                Page numbers, watermarks, header logos that repeat on every
                page get auto-filtered (high frequency + small region). Engineer
                can override.
              </div>
            </div>
          </div>
          <Alert>
            <ImageIcon className="h-4 w-4" />
            <AlertTitle>Caption inheritance.</AlertTitle>
            <AlertDescription className="text-xs">
              Per-image alt text comes from the source's caption region (text
              within ~1.5 line-heights below the figure) when present. When
              absent, the AI mapping step proposes alt text from the
              surrounding paragraph context. Required-alt is enforced — same
              rule as the editor.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 10. Use case matrix
// ---------------------------------------------------------------------------

interface UseCaseRow {
  format: string
  example: string
  good: string
  bad: string
  recommendation: string
  icon: typeof FileText
}

const USECASES: UseCaseRow[] = [
  {
    format: "Born-digital PDF SOP",
    example: "5-page SOP exported from Word to PDF, text layer present.",
    good: "Markitdown extracts cleanly, headings preserved, tables decent.",
    bad: "Multi-column layouts confuse reading order. Hard line-breaks may break sentences.",
    recommendation:
      "Default pipeline. ~80% of well-authored customer SOPs land here.",
    icon: FileText,
  },
  {
    format: "Scanned PDF SOP (image-only)",
    example: "Photocopied paper SOP, scanned to PDF.",
    good: "Tesseract OCR can usually pull text. Layout segmentation crops figures.",
    bad: "OCR errors compound through the AI mapping pass. Tables are lost.",
    recommendation:
      "Run OCR + AI mapping + force engineer review of every section. Verbatim mode is risky here because the verbatim source has OCR errors. Improve mode is the right default for scanned docs only.",
    icon: ScanLine,
  },
  {
    format: "Word document",
    example: "DOCX SOP with embedded images and tables.",
    good: "Markitdown handles DOCX directly. Embedded images extract cleanly.",
    bad: "Embedded Visio diagrams come out as raster. Embedded Excel tables come out as text.",
    recommendation:
      "Default pipeline. Diagrams flagged for engineer to convert to a custom diagram node manually if it's worth it.",
    icon: FileType,
  },
  {
    format: "Excel checklist / FMEA",
    example: "Multi-tab workbook with checklists.",
    good: "Tabular structure maps cleanly into table custom nodes.",
    bad: "Merged cells, formulas, and named ranges flatten badly.",
    recommendation:
      "Detect single-tab vs workbook. Single-tab: import directly. Workbook: ask the engineer which tab is the SOP and ignore the rest (or split into multiple imported docs).",
    icon: FileSpreadsheet,
  },
  {
    format: "PowerPoint / training deck",
    example: "Slide-deck used as a work instruction.",
    good: "Markitdown extracts slide titles + bullet points + speaker notes.",
    bad: "Animations, builds, and slide-master decoration are lost. Layout-heavy slides become a mess.",
    recommendation:
      "Treat each slide as one section. Useful for training docs; less useful for procedural SOPs.",
    icon: FileText,
  },
  {
    format: "HTML wiki page",
    example: "Confluence/SharePoint page exported.",
    good: "Markitdown handles HTML well. Tables, lists, headings preserved.",
    bad: "Dynamic content (embedded videos, expandable sections) is lost.",
    recommendation:
      "Default pipeline. Recommend the customer paste the URL rather than upload — saves the export step.",
    icon: FileText,
  },
  {
    format: "Equipment manual (80+ pages)",
    example: "Vendor-supplied PDF, vendor-formatted.",
    good: "Importer can extract structured sections (TOC, troubleshooting tables).",
    bad: "Long-context AI cost. Most pages are not procedural and don't belong in DOCS.",
    recommendation:
      "Don't import the whole manual. Show TOC, let engineer pick the 1-3 sections worth importing as standalone docs (e.g., 'Daily inspection routine'). Original manual stays as PDF attachment.",
    icon: FileText,
  },
  {
    format: "Photo of a paper SOP",
    example: "Operator's phone photo of a wall-mounted SOP.",
    good: "Demonstrates the importer's reach.",
    bad: "Camera-photo OCR is hard. Skewed lines, glare, paper folds.",
    recommendation:
      "Out of scope for v1. Push to v1.1 once the scanned-PDF path is proven.",
    icon: ImageIcon,
  },
]

function UseCaseMatrixSection() {
  return (
    <Section
      title="Use-case matrix — what comes in, what comes out"
      description="One row per realistic input format. The recommendation column is the design decision per format."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[16%]">Format</TableHead>
                <TableHead className="w-[18%]">Example</TableHead>
                <TableHead className="w-[18%]">What works</TableHead>
                <TableHead className="w-[20%]">What breaks</TableHead>
                <TableHead className="w-[28%]">Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USECASES.map((u) => (
                <TableRow key={u.format}>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <u.icon className="h-3.5 w-3.5 text-primary" />
                      {u.format}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {u.example}
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {u.good}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {u.bad}
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {u.recommendation}
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
// 11. UX mock — wizard
// ---------------------------------------------------------------------------

function UxMockSection() {
  return (
    <Section
      title="Wizard UX — every stage is reviewable"
      description="One screen per pipeline stage. The engineer can advance, edit, go back, or jump straight to the editor at any point. Tabs below show each step's surface."
    >
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="upload">
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="text-xs">
                1. Upload
              </TabsTrigger>
              <TabsTrigger value="extract" className="text-xs">
                2. Extract
              </TabsTrigger>
              <TabsTrigger value="map" className="text-xs">
                3. AI map
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs">
                4. Links
              </TabsTrigger>
              <TabsTrigger value="review" className="text-xs">
                5. Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="pt-4">
              <UploadMock />
            </TabsContent>
            <TabsContent value="extract" className="pt-4">
              <ExtractMock />
            </TabsContent>
            <TabsContent value="map" className="pt-4">
              <MapMock />
            </TabsContent>
            <TabsContent value="links" className="pt-4">
              <LinksMock />
            </TabsContent>
            <TabsContent value="review" className="pt-4">
              <ReviewMock />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>One-shot mode is a button on the upload step.</AlertTitle>
        <AlertDescription className="text-xs">
          The wizard is the default. Power users can flip "Auto-process" on
          step 1 and the importer runs all stages without prompting,
          dropping the engineer straight on step 5. Same outcome, fewer
          clicks. Safe because the engineer always lands at "review", and
          they can drill back into any stage from there.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function UploadMock() {
  return (
    <div className="space-y-3">
      <div className="rounded-md border-2 border-dashed bg-muted/20 p-8 text-center">
        <Package className="mx-auto h-6 w-6 text-muted-foreground" />
        <div className="mt-2 text-sm font-medium">
          Drop file or click to browse
        </div>
        <div className="text-[11px] text-muted-foreground">
          PDF · DOCX · XLSX · PPTX · HTML · up to 50 MB
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-md border bg-card p-3 text-xs">
          <div className="mb-1 font-semibold">Target template</div>
          <select className="w-full rounded border bg-background px-2 py-1 text-xs">
            <option>Standard Operating Procedure</option>
            <option>Work Instruction</option>
            <option>Equipment Manual (extract only)</option>
            <option>FMEA / Risk Assessment</option>
            <option>5S / Audit checklist</option>
          </select>
        </div>
        <div className="rounded-md border bg-card p-3 text-xs">
          <div className="mb-1 font-semibold">Default mode</div>
          <div className="space-y-1">
            <label className="flex items-center gap-2">
              <input type="radio" defaultChecked /> Verbatim (recommended)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" /> Improve to Oppr tone
            </label>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" /> Auto-process (skip stage reviews)
        </label>
        <Button size="sm">
          Start <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function ExtractMock() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-md border bg-muted/20 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold">Source preview · page 2 of 5</div>
          <Badge variant="outline" className="text-[10px]">
            born-digital
          </Badge>
        </div>
        <div className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
          <p className="font-semibold">SAFETY WARNING</p>
          <p>
            Personnel must wear safety helmets, hi-vis vests, and steel-toed
            boots before entering the conveyor area.
          </p>
          <p className="font-semibold">PROCEDURE</p>
          <p>
            1. Confirm the gate is closed before activating the conveyor.
          </p>
          <p>2. Press the start button on the operator panel.</p>
        </div>
      </div>
      <div className="rounded-md border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold">Extracted markdown</div>
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
            markitdown · ok
          </Badge>
        </div>
        <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[10px] leading-relaxed">
          <code>{`## Safety warning

Personnel must wear safety helmets, hi-vis vests, and
steel-toed boots before entering the conveyor area.

## Procedure

1. Confirm the gate is closed before activating the conveyor.
2. Press the start button on the operator panel.
`}</code>
        </pre>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            3 images extracted · 2 tables · OCR not needed
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs">
            Re-run with Docling
          </Button>
        </div>
      </div>
    </div>
  )
}

function MapMock() {
  return (
    <div className="space-y-2">
      <SectionRow
        slot="Purpose"
        confidence={98}
        verbatim
        body="This procedure describes the safe operation of the conveyor system in the sorting bay."
      />
      <SectionRow
        slot="PPE"
        confidence={94}
        verbatim
        body="Helmet · Hi-vis vest · Steel-toed boots"
        chips={["helmet", "hivis", "boots"]}
      />
      <SectionRow
        slot="Step 1"
        confidence={91}
        verbatim
        body="Confirm the gate is closed before activating the conveyor."
        imageHint="figure-2.png"
      />
      <SectionRow
        slot="Step 2"
        confidence={71}
        verbatim={false}
        body="Press the start button on the operator panel and observe the conveyor reaches operating speed within 5 seconds."
        warning="Improved (AI re-tone). Click to view diff."
      />
      <SectionRow
        slot="Sign-off"
        confidence={88}
        verbatim
        body="Performed by: ___ Date: ___"
      />
    </div>
  )
}

function SectionRow({
  slot,
  confidence,
  verbatim,
  body,
  chips,
  imageHint,
  warning,
}: {
  slot: string
  confidence: number
  verbatim: boolean
  body: string
  chips?: string[]
  imageHint?: string
  warning?: string
}) {
  const conf =
    confidence >= 90
      ? "emerald"
      : confidence >= 75
        ? "amber"
        : "red"
  const confClass =
    conf === "emerald"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : conf === "amber"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "bg-red-500/15 text-red-700 dark:text-red-300"
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] font-mono">
          {slot}
        </Badge>
        <Badge className={cn("text-[10px]", confClass)}>
          confidence {confidence}%
        </Badge>
        {verbatim ? (
          <Badge variant="outline" className="text-[10px]">
            <Quote className="mr-1 h-2.5 w-2.5" />
            verbatim
          </Badge>
        ) : (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px]">
            <Sparkles className="mr-1 h-2.5 w-2.5" />
            improved
          </Badge>
        )}
        {chips?.map((c) => (
          <Badge key={c} variant="secondary" className="text-[10px]">
            {c}
          </Badge>
        ))}
        {imageHint && (
          <Badge variant="outline" className="text-[10px]">
            <ImageIcon className="mr-1 h-2.5 w-2.5" />
            {imageHint}
          </Badge>
        )}
      </div>
      <div className="text-xs leading-relaxed">{body}</div>
      {warning && (
        <div className="mt-1.5 text-[10px] text-blue-700 dark:text-blue-300">
          {warning}
        </div>
      )}
    </div>
  )
}

function LinksMock() {
  return (
    <div className="space-y-2">
      <LinkRow
        match="HOL-OPS-SOP-0015"
        target="HOL-OPS-SOP-0015 · Conveyor lock-out procedure"
        confidence={100}
        type="document"
      />
      <LinkRow
        match="Extruder 8C"
        target="EXTRUDER_8C"
        confidence={97}
        type="asset"
      />
      <LinkRow
        match="the operator panel"
        target="OPERATOR_PANEL_MAIN (?)"
        confidence={62}
        type="asset"
        ambiguous
      />
      <LinkRow
        match="the daily check"
        target="(unmatched — multiple candidates)"
        confidence={0}
        type="log"
        ambiguous
      />
    </div>
  )
}

function LinkRow({
  match,
  target,
  confidence,
  type,
  ambiguous,
}: {
  match: string
  target: string
  confidence: number
  type: "document" | "asset" | "log"
  ambiguous?: boolean
}) {
  const Icon = type === "document" ? FileText : type === "asset" ? Cpu : ListChecks
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border bg-card p-2.5 text-xs",
        ambiguous && "border-amber-500/40 bg-amber-500/5",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="font-mono">"{match}"</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="font-mono text-muted-foreground">{target}</span>
      <span className="ml-auto flex items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {confidence > 0 ? `${confidence}%` : "no match"}
        </Badge>
        {ambiguous ? (
          <Button size="sm" variant="outline" className="h-7 text-xs">
            Pick…
          </Button>
        ) : (
          <Button size="sm" className="h-7 text-xs">
            Accept
          </Button>
        )}
      </span>
    </div>
  )
}

function ReviewMock() {
  return (
    <div className="space-y-2">
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle>Ready to open in editor.</AlertTitle>
        <AlertDescription className="text-xs">
          5 sections mapped · 8 images promoted · 2 doc links · 1 asset link.
          1 ambiguous link queued for engineer attention. Original PDF
          attached to the document for audit.
        </AlertDescription>
      </Alert>
      <div className="grid gap-2 md:grid-cols-2 text-xs">
        <div className="rounded-md border bg-card p-3 space-y-1">
          <div className="font-semibold">Suggested metadata</div>
          <div>
            <span className="text-muted-foreground">Naming code: </span>
            <span className="font-mono">HOL-OPS-SOP-0042 (suggested)</span>
          </div>
          <div>
            <span className="text-muted-foreground">Type: </span>
            SOP
          </div>
          <div>
            <span className="text-muted-foreground">Asset binding: </span>
            EXTRUDER_8C
          </div>
        </div>
        <div className="rounded-md border bg-card p-3 space-y-1">
          <div className="font-semibold">Provenance</div>
          <div className="text-muted-foreground">
            Imported from <span className="font-mono">conveyor-sop-v3.pdf</span>{" "}
            · sha256 a1b2c3… · 5 pages · markitdown extract · 4 sections
            verbatim · 1 section improved · imported by Floris on 2026-05-07.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline">
          Back to AI map
        </Button>
        <Button size="sm">
          Open in editor <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 12. Edge cases
// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
  shipped: boolean
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Source PDF is a scan with poor contrast (faxed-and-photocopied).",
    current: "OCR returns garbled text. AI mapping invents structure.",
    expected:
      "Detect low OCR confidence (< 0.7) globally; refuse to AI-map; force engineer manual transcription with the source side-by-side.",
    severity: "high",
    shipped: false,
  },
  {
    scenario: "SOP is in Dutch, customer wants Dutch output.",
    current: "AI may translate to English unprompted.",
    expected:
      "Language detected from source; AI prompt pinned to source language. Verbatim mode bypasses the AI for body copy entirely.",
    severity: "high",
    shipped: false,
  },
  {
    scenario: "Embedded Visio diagram in a Word doc.",
    current: "Markitdown rasterises to a flat PNG with no text content.",
    expected:
      "Detect diagram; flag for engineer review; offer 'leave as image' or 'redraw using diagram custom node' (manual).",
    severity: "med",
    shipped: false,
  },
  {
    scenario: "Excel SOP with merged cells across rows.",
    current: "Markitdown flattens merged cells, losing the grouping.",
    expected:
      "Use openpyxl pass to detect merged cells; surface them as either nested groups or rowspan in the table custom node.",
    severity: "med",
    shipped: false,
  },
  {
    scenario:
      "200-page equipment manual; engineer wants only chapter 4 (maintenance).",
    current: "Whole-file processing wastes AI budget and produces an unwieldy doc.",
    expected:
      "TOC-driven section picker on stage 2: engineer marks which chapters to import. Other chapters left as the original PDF attachment.",
    severity: "high",
    shipped: false,
  },
  {
    scenario: "Customer SOP mentions a chemical or process by trade name.",
    current: "No special handling.",
    expected:
      "Maintain a per-customer terminology dictionary; surface unfamiliar terms for engineer to confirm or alias to a standard term.",
    severity: "low",
    shipped: false,
  },
  {
    scenario: "Two pages have different orientations (A4 portrait + A3 landscape).",
    current: "Reading order may flip.",
    expected:
      "Per-page extraction with per-page orientation; pre-OCR auto-rotate via Tesseract orientation detection.",
    severity: "med",
    shipped: false,
  },
  {
    scenario: "Source file is a password-protected PDF.",
    current: "Importer fails opaquely.",
    expected:
      "Detect; ask the engineer for the password; fail explicitly if they don't have it (don't try to crack).",
    severity: "low",
    shipped: false,
  },
  {
    scenario:
      "AI mapping returns a section not present in the source (hallucination).",
    current: "Could land in the doc unflagged.",
    expected:
      "Every AI-emitted section must include a source-byte-range citation. Sections without a citation are auto-flagged 'unverified — likely hallucination' and quarantined.",
    severity: "high",
    shipped: false,
  },
  {
    scenario: "Same image appears 12 times in a manual (logo).",
    current: "12 storage objects.",
    expected:
      "Sha256 dedup (already in image library) means 1 storage object, 12 references. Header/footer detection auto-marks repeating-region images as 'decoration', engineer can mass-drop them.",
    severity: "low",
    shipped: true,
  },
  {
    scenario:
      "The PDF has a redaction (black box) over part of the text.",
    current: "OCR returns gibberish for that block.",
    expected:
      "Detect black-box regions; mark the corresponding text segment as redacted and skip from AI mapping. Document records the redaction location for audit.",
    severity: "low",
    shipped: false,
  },
  {
    scenario:
      "Engineer abandons the wizard halfway through (closes the tab).",
    current: "Job state lost.",
    expected:
      "All stage outputs persisted to `import_jobs` row; engineer can resume from where they left off. Auto-cleanup after 7 days of inactivity.",
    severity: "med",
    shipped: true,
  },
  {
    scenario:
      "Customer pushes back: 'we don't want our SOPs going through any AI'.",
    current: "No alternative path.",
    expected:
      "Verbatim-only mode skips Gemini entirely. Markitdown extract → editor with auto-section-headings, no AI rewriting. Strictly worse output but a viable path for AI-restricted customers.",
    severity: "med",
    shipped: false,
  },
  {
    scenario:
      "Customer has 200 SOPs to import. One-by-one is impractical.",
    current: "No bulk path.",
    expected:
      "Bulk-import mode: drop a folder, importer runs all in auto-mode and produces a triage queue. Engineer reviews the queue (highest-impact docs first by asset criticality) and skips the long tail.",
    severity: "med",
    shipped: false,
  },
  {
    scenario:
      "The same naming code already exists in the database.",
    current: "Could overwrite.",
    expected:
      "Detect collision; throw with a clear error before insert (the 'create as new version' UX is a v1.1 follow-up).",
    severity: "high",
    shipped: true,
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases — fifteen ways this gets uncomfortable"
      description="Every row here is a failure mode we'd rather pre-decide than hit in front of a customer. Severity reflects 'what's the cost of getting this wrong' — not effort to fix."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[26%]">Scenario</TableHead>
                <TableHead className="w-[26%]">Current behaviour</TableHead>
                <TableHead className="w-[32%]">Expected</TableHead>
                <TableHead className="w-[8%]">Severity</TableHead>
                <TableHead className="w-[8%] text-right">Shipped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((r) => (
                <TableRow key={r.scenario}>
                  <TableCell className="align-top text-xs">
                    {r.scenario}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {r.current}
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {r.expected}
                  </TableCell>
                  <TableCell className="align-top">
                    <SeverityBadge sev={r.severity} />
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {r.shipped ? (
                      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                        <Check className="h-2.5 w-2.5" />
                        yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        later
                      </Badge>
                    )}
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

function SeverityBadge({ sev }: { sev: "high" | "med" | "low" }) {
  if (sev === "high")
    return (
      <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 text-[10px]">
        high
      </Badge>
    )
  if (sev === "med")
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
        med
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px]">
      low
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 13. Self-grilling
// ---------------------------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling — where this proposal could be wrong"
      description="The honest checks. At least one uncomfortable counter-hypothesis."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Are we over-engineering this? Won't customers just paste their SOPs into the editor?"
            a="Tested mentally against the reality of process engineers we've talked to. They have 30-200 existing SOPs, mostly in PDF form, and they will not retype any of them. The realistic alternative to the importer is 'we don't bring those SOPs into Oppr at all' — which means IDA can't cite them, the operator app can't show them by QR scan, and the closed loop in UC4 starts with no baseline. The 8-week POC then has nothing to demonstrate beyond logs. The over-engineering risk is real but the under-engineered alternative is worse."
          />
          <Grill
            q="Why not just rely on the existing PDF upload + RAG path? RAG is good enough."
            a="It's good enough for one of the three jobs. RAG retrieval cites a span in a PDF; that's fine for IDA's desktop chat. It's not fine for: (a) the operator app showing 'step 3 with this photo' from a QR scan — RAG can't render that interactively; (b) the UC4 close-the-loop edit flow where the engineer wants to bump a step from '5 seconds' to '7 seconds' — you don't edit a PDF, you edit a structured doc; (c) the IDA citation quality story — citing 'Step 3 of HOL-OPS-SOP-0042' is operator-trusted; citing 'page 4, line 12-18 of upload-2026-04-conveyor.pdf' is not."
          />
          <Grill
            q="Are we sure markitdown is the right primary tool? Microsoft might deprecate it."
            a="Risk acknowledged. Markitdown is MIT and the dependency tree is reasonable — if Microsoft drops it, the community will likely fork (it's a thin wrapper over established libs: pdfminer, mammoth, openpyxl, python-pptx). We pin a version, vendor it as a Python service, and own the deployment. The choice is between markitdown (single-binary coverage), Docling (heavier, more capable), or building it ourselves out of pdfminer + mammoth + openpyxl + python-pptx. Markitdown is the bet that minimises year-1 surface area while letting us swap to Docling per-format if needed."
          />
          <Grill
            q="The pipeline runs server-side. Where does the Python code live? Convex doesn't run Python."
            a="Convex actions can call out via HTTPS. The plan is a separate Python service hosted on Modal (or Render, or a Vercel Python serverless function) that exposes a single POST /extract endpoint accepting bytes and returning JSON. Convex action posts the file (already in _storage), receives the parse result, persists it. This adds an external dependency we have to keep healthy. Alternative: run markitdown via WASM. Tested — most of markitdown's deps (PyMuPDF, Tesseract) don't WASM cleanly. Server is the pragmatic call."
          />
          <Grill
            q="The uncomfortable one: are we being honest about the AI's reliability on long docs?"
            a="Honest answer: no, not entirely. Gemini structured-output mode is pretty good on 5-page SOPs but degrades sharply past 30 pages. Our edge-cases table calls this out for 200-page manuals (chapter selector), but the 30-50 page case isn't fully solved. Mitigations: chunked AI calls per major section, confidence-driven 'redo this section' option, and aggressive provenance requirements so hallucinated sections are easy to spot. But we should set customer expectations explicitly: this importer reaches 80% of the way there fast; the remaining 20% takes engineer hours regardless of which tool we pick. Selling 'one click and your SOP is in Oppr' is a lie that will burn us at the first long doc."
          />
          <Grill
            q="What if the customer's SOP contains a process diagram that's the most important part of the doc, and we just rasterise it?"
            a="This is realistic — chemical batch SOPs especially. The plan handles it as 'image extracted, engineer flags for diagram custom-node redraw'. Honest read: that's a partial answer. Redrawing a complex P&ID-style diagram in our diagramPresets is hours of work and the importer doesn't help. The right answer is to not pretend we can match the original — surface the rasterised image with a caption 'see source PDF' and link to the PDF page directly. Acceptably worse than the source for v1; manual diagram conversion is post-v1."
          />
          <Grill
            q="Are there competing legal-tech tools that already do this for industrial SOPs we're missing?"
            a="The closest commercial offerings I've found: Augmentir (connected worker, has SOP authoring but not AI import), Poka (similar story), Tulip (ditto), DataSnipper (audit-tool-adjacent, not SOP). None of them offer 'PDF in, structured doc out' as a first-class feature; the connected worker space treats the source PDF as the SOP forever. So either (a) it's a real differentiator for us or (b) no one cares enough about this to build it. Counter-argument: Mutares specifically asked for 'we have all these PDFs, what do we do' on the discovery call — that's one customer signal. Renewi may surface the same. Need to validate by asking 2-3 more prospects whether 'I want my existing SOPs queryable by IDA' is a yes vs a 'meh'."
          />
          <Grill
            q="If we ship the extract step before the AI mapping step, do we have a useful intermediate product?"
            a="Yes — and this is probably how we should sequence the build. Stage 1-4 alone (ingest, classify, extract, image extraction → markdown + image library) lets the engineer paste the markdown into the editor manually. That's worse than the full pipeline but better than nothing. P0 spike + P1 ship gets us there in roughly 2-3 weeks. The AI mapping (P2) is a multi-week build that we should only invest in once the deterministic extract is solid. If extraction is bad, AI mapping on top of bad extraction is worse than no AI."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Grill({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="font-medium">Q. {q}</div>
      <div className="mt-1 text-muted-foreground">A. {a}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 14. Implementation plan
// ---------------------------------------------------------------------------

interface PlanStep {
  phase: string
  goal: string
  scope: string[]
  deps: string
  effort: string
  status: "outstanding" | "in_progress" | "done" | "deferred" | "shipped"
}

const PLAN: PlanStep[] = [
  {
    phase: "P0 — Markitdown spike",
    goal: "Prove markitdown can produce usable Markdown from a real Mutares SOP",
    scope: [
      "Stand up markitdown in a throwaway Python env",
      "Run on 5 representative customer PDFs",
      "Score output against hand-curated 'ideal' versions",
    ],
    deps: "Mutares sends 5 sample SOPs (anonymised)",
    effort: "1-2 days",
    status: "deferred",
  },
  {
    phase: "P1 — Python extract service",
    goal: "Production-grade extract endpoint for non-PDF formats + scanned PDFs",
    scope: [
      "Python service (Modal/Render) with POST /extract",
      "Wraps markitdown + PyMuPDF + Tesseract",
      "Source-page citations for every paragraph",
    ],
    deps: "P0 done",
    effort: "1-2 weeks",
    status: "deferred",
  },
  {
    phase: "P2 — Convex glue + import_jobs",
    goal: "Wire extraction into Convex, persist job state",
    scope: [
      "convex/schema.ts: importJobs table",
      "convex/importer/jobs.ts: full CRUD + lifecycle",
      "convex/files.ts: source PDF upload via existing _storage path",
      "Wizard stages 1+2 (upload + extract preview)",
    ],
    deps: "Browser-only extract path (replaces P1 for v1)",
    effort: "1 week",
    status: "shipped",
  },
  {
    phase: "P3 — Template instructions + AI mapping",
    goal: "Map extracted text → TipTap JSON or LOG spec via Gemini",
    scope: [
      "convex/importer/templates.ts: SOP / Manual / LMRA / Work-Instruction-Log instructions",
      "convex/importer/map.ts: Gemini action with structured JSON output",
      "Per-section confidence + verbatim/improve flag",
      "Worked JSON examples in the system prompt to pin Gemini's emission shape",
    ],
    deps: "P2 done",
    effort: "2 weeks",
    status: "shipped",
  },
  {
    phase: "P4 — Cross-link + asset resolution",
    goal: "Resolve doc/asset/log refs in the AI output",
    scope: [
      "convex/importer/jobs.ts:resolveLinks — naming-code regex + bigram fuzzy match",
      "Stage 4 UI: confirm/reject suggestions",
      "Auto-accept ≥ 0.92 confidence",
    ],
    deps: "P3 done",
    effort: "1 week",
    status: "shipped",
  },
  {
    phase: "P5 — Wizard with stepper + resume",
    goal: "Stitch stages 1-5 into a coherent multi-step UI",
    scope: [
      "src/pages/desktop/ImportPage.tsx — stepper, stage dispatch on job.stage",
      "/import + /import/:jobId routes",
      "NewDocumentDialog third card 'Convert external'",
      "Re-run AI mapping button on the Mapped stage",
    ],
    deps: "P4 done",
    effort: "1 week",
    status: "shipped",
  },
  {
    phase: "P5b — Pipeline debug fixes (post-first-real-PDF)",
    goal: "Recover from the broken-image and empty-body failures observed on the first real run",
    scope: [
      "src/lib/import/extractPdf.ts — JPEG-source fast path, paintImageXObjectRepeat, blob sanity check, per-page render fallback, stats",
      "src/lib/import/sanitizeTiptap.ts — extractBodyContent + sanitizeNodes + buildFallbackBody",
      "convex/importer/templates.ts — worked JSON examples + softened verbatim instruction",
      "src/pages/desktop/ImportPage.tsx — sanitiser wired into handleFinalize, raw mappedBody dump always-open, Re-run mapping button",
    ],
    deps: "P5 done + first real-PDF test feedback",
    effort: "1 day",
    status: "shipped",
  },
  {
    phase: "P6 — Bulk import",
    goal: "Drop a folder, get a triage queue",
    scope: [
      "Bulk upload UI",
      "Async job runner",
      "Triage queue ranked by asset criticality",
    ],
    deps: "P5 done; customer feedback from first solo imports",
    effort: "1 week",
    status: "deferred",
  },
  {
    phase: "P7 — Verbatim-only safety mode",
    goal: "Path for AI-restricted customers",
    scope: [
      "Skip Gemini call",
      "Heading-based section split using markitdown's heading levels",
      "Engineer manually re-classifies sections in the editor",
    ],
    deps: "Python service (P1)",
    effort: "2-3 days, when a customer asks",
    status: "deferred",
  },
]

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan — eight phases"
      description="P0-P5 is the core path to a useful importer (~5-6 weeks of focused work). P6-P7 are deferred. Verification command per commit: npx tsc -b && npx vite build for frontend; pytest + manual sample run for the Python service."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {PLAN.map((p) => (
            <div key={p.phase} className="rounded-md border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                {p.phase}
                <Badge variant="outline" className="text-[10px]">
                  {p.effort}
                </Badge>
                <PhaseStatus status={p.status} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {p.goal}
              </div>
              <ul className="mt-1.5 space-y-0.5 pl-5 text-[11px] text-muted-foreground">
                {p.scope.map((s) => (
                  <li key={s} className="list-disc font-mono">
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-1 text-[10px] italic text-muted-foreground">
                deps: {p.deps}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

function PhaseStatus({ status }: { status: PlanStep["status"] }) {
  if (status === "done" || status === "shipped")
    return (
      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
        <Check className="h-2.5 w-2.5" />
        shipped
      </Badge>
    )
  if (status === "in_progress")
    return (
      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px]">
        in progress
      </Badge>
    )
  if (status === "deferred")
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
        deferred
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-muted-foreground text-[10px]">
      outstanding
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 15. Decisions (was Open Questions — closed out 2026-05-07)
// ---------------------------------------------------------------------------

function DecisionsSection() {
  return (
    <Section
      title="Decisions — calls made before / during the build"
      description="The five questions this analysis raised, with the call ultimately taken. Each shaped the v1 scope."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Decision
            q="Where does the Python extract service live?"
            a="Skipped for v1. Realised pdfjs-dist could do text + image extraction in the browser, removing the Python service from the v1 critical path entirely. Python service moves to v2 (Word/Excel/PowerPoint + OCR for scanned PDFs)."
          />
          <Decision
            q="Verbatim-by-default or improve-by-default?"
            a="Verbatim, with the verbatim instruction softened post-test so it preserves text within nodes (not collapsing structure). Engineer can flip to improve per-section after review."
          />
          <Decision
            q="How much do we invest in table extraction?"
            a="Deferred. v1 ships markitdown's stock table output for tabular sections; FMEA / 5S customers will be told tables may look rough until v1.1. Camelot integration moves to the post-Mutares feedback loop."
          />
          <Decision
            q="Bulk-import: ship in v1?"
            a="No. Single-import path covers the 14-day onboarding promise; bulk-import is v1.1 once we have customer-validated triage UX feedback."
          />
          <Decision
            q="Where do we surface this in the UI?"
            a="Option (b) shipped: the New-document modal now has three cards — Compose new, Attach PDF (file-as-PDF, unchanged), Convert external (the new wizard). FloatingAskIda hides on /import* routes."
          />
        </CardContent>
      </Card>
      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle>Closed.</AlertTitle>
        <AlertDescription className="text-xs">
          Follow-ups: P1 Python service (Word/Excel/scanned), P6 bulk-import,
          P7 verbatim-only safety mode for AI-restricted customers,
          source-byte-range citations for AI-emitted sections, table-extraction
          fallback (Camelot/pdfplumber). Multilingual story partially in:
          language detection ships, improve-mode language pinning is post-v1.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function Decision({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-0.5">
          <div className="font-medium">Q. {q}</div>
          <div className="text-xs text-muted-foreground">A. {a}</div>
        </div>
      </div>
    </div>
  )
}

function Q({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <div>{children}</div>
    </div>
  )
}
