// Analysis page for the editor's sticky-ribbon problem and the new
// Publish-to-PDF flow.
//
// Static documentation — no live DB, no AI, no fetching. The "current"
// and "proposed" panels are React mocks built from real shadcn primitives
// so the spec is browsable and reviewable inside the app at
// /analysis/editor-publish-flow.

import { useState } from "react"
import {
  AlertTriangle,
  ArrowDownToLine,
  Bold,
  Check,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Code,
  Database,
  Eye,
  EyeOff,
  FileDown,
  FileText,
  Globe,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Image as ImageIcon,
  Italic,
  Layers,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Lock,
  Minus,
  Play,
  Printer,
  Quote,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Type,
  Users,
  Wrench,
  Workflow,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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

export function EditorPublishFlowAnalysis() {
  return (
    <AnalysisLayout
      title="Editor sticky ribbon, collapsible metadata, and Publish-to-PDF"
      subtitle="Closed case file. The toolbar didn't anchor on long docs, the metadata panel locked the canvas to a single non-readable measure, and 'Publish' produced no shareable artifact. This page documents the layout root cause, weighs four PDF-export approaches, records what shipped, and lays out the cloud-native v2 — Cloud Run + Vertex AI + server-side Chromium PDF rendering — that we'd build the day a real backend lands."
      date="2026-05-06"
      scopes={["desktop"]}
    >
      <SummaryHeaderCard />
      <ProblemStatementSection />
      <CurrentBehaviorSection />
      <RootCauseSection />
      <PdfApproachComparisonSection />
      <ProposedUxSection />
      <ResultsSection />
      <CloudNativeV2Section />
      <EdgeCasesSection />
      <SelfGrillingSection />
      <ImplementationPlanSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

// --- Summary header ---------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="Toolbar didn't stay pinned on long docs; metadata panel locked the canvas; no shareable paginated PDF export"
          tone="destructive"
        />
        <SummaryCell icon={CheckCircle2} label="Status" value="Shipped · 2026-05-06" tone="emerald" />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="6 files modified · 3 new modules · 1 new dialog · capped 80ch body · per-doc PPE on cover"
          tone="default"
        />
        <SummaryCell icon={ShieldCheck} label="Verification" value="tsc -b ✓ · vite build ✓" tone="default" />
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

// --- 1. Problem statement ---------------------------------------------------

function ProblemStatementSection() {
  return (
    <Section title="Problem">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Three issues, one shared root</AlertTitle>
        <AlertDescription>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>
              <strong>Toolbar doesn't pin.</strong> The TipTap ribbon has{" "}
              <code>position: sticky; top: 40px</code> but on a long document the ribbon
              still scrolls out of view. Sticky inside a layout that wasn't built for it
              is a non-fix — the containing block does not have a working scroll anchor.
            </li>
            <li>
              <strong>Metadata panel toggle works, but the width math doesn't.</strong>{" "}
              The grid switches to one column when the panel is hidden, but the editor
              column never tells the operator the canvas just got 320px back. The state
              is in localStorage; the visual handoff is missing.
            </li>
            <li>
              <strong>"Publish" produces no shareable artifact.</strong>{" "}
              <code>publishVersion()</code> bumps an internal version row. There is no{" "}
              <em>Publish to PDF</em> button, no title page, no recurring header/footer,
              no page numbers, no revision block. A field operator who needs the SOP on
              paper at 03:00 has nothing to print.
            </li>
          </ol>
          <p className="mt-3 text-xs">
            All three live in the same surface (DocumentEditPage) and the fixes overlap —
            so they ship together or not at all.
          </p>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// --- 2. Current behaviour ---------------------------------------------------

function CurrentBehaviorSection() {
  const [scrolled, setScrolled] = useState(false)
  const [metaVisible, setMetaVisible] = useState(true)

  return (
    <Section
      title="Current behaviour"
      description="Static React mock of the edit page using real shadcn primitives. Toggle the buttons to see what an operator sees today."
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <div className="space-y-0.5">
            <CardTitle className="text-sm">DocumentEditPage — as it ships today</CardTitle>
            <CardDescription className="text-xs">
              Page strip (sticky) → toolbar (sticky in code, doesn't pin in practice) →
              body → optional 320px metadata column.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => setScrolled((s) => !s)}>
              {scrolled ? "Reset" : "Simulate scroll"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]" onClick={() => setMetaVisible((v) => !v)}>
              {metaVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {metaVisible ? "Hide metadata" : "Show metadata"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MockEditPage scrolled={scrolled} metaVisible={metaVisible} variant="current" />
        </CardContent>
      </Card>
    </Section>
  )
}

function MockEditPage({
  scrolled,
  metaVisible,
  variant,
}: {
  scrolled: boolean
  metaVisible: boolean
  variant: "current" | "proposed"
}) {
  const showHeader = variant === "proposed" || !scrolled
  const showRibbon = variant === "proposed" || !scrolled
  return (
    <div className="overflow-hidden rounded-md border bg-muted/20">
      <div className="relative h-[440px] overflow-hidden">
        {/* Page strip */}
        {showHeader && (
          <div className="flex h-9 items-center justify-between border-b bg-background px-3 text-[11px]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold">Drying oven SOP</span>
              <Badge variant="outline" className="h-4 px-1 text-[9px]">SOP</Badge>
              <Badge className="h-4 bg-emerald-500/15 px-1 text-[9px] text-emerald-700 hover:bg-emerald-500/15">published</Badge>
              <span className="hidden font-mono text-[9px] text-muted-foreground sm:inline">
                HOL-OPS-SOP-0004 · v3
              </span>
            </div>
            <div className="flex items-center gap-1">
              {variant === "proposed" && (
                <Button size="sm" variant="default" className="h-6 gap-1 bg-orange-600 px-2 text-[10px] text-white hover:bg-orange-700">
                  <FileDown className="h-3 w-3" />
                  Publish to PDF
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]">View</Button>
              <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]">Save</Button>
              <Button size="sm" className="h-6 px-2 text-[10px]">Publish</Button>
            </div>
          </div>
        )}
        {/* Ribbon */}
        {showRibbon && (
          <div className={cn(
            "flex flex-wrap items-center gap-0.5 border-b bg-background p-1.5",
            variant === "proposed" && "shadow-sm",
          )}>
            <RibbonChunk>
              <RibbonBtn icon={Heading1} />
              <RibbonBtn icon={Heading2} />
              <RibbonBtn icon={Heading3} />
              <RibbonBtn icon={Type} />
            </RibbonChunk>
            <RibbonDivider />
            <RibbonChunk>
              <RibbonBtn icon={Bold} />
              <RibbonBtn icon={Italic} />
              <RibbonBtn icon={Strikethrough} />
              <RibbonBtn icon={Code} />
              <RibbonBtn icon={LinkIcon} />
            </RibbonChunk>
            <RibbonDivider />
            <RibbonChunk>
              <RibbonBtn icon={List} />
              <RibbonBtn icon={ListOrdered} />
              <RibbonBtn icon={ListChecks} />
              <RibbonBtn icon={Quote} />
              <RibbonBtn icon={Minus} />
            </RibbonChunk>
            <RibbonDivider />
            <RibbonChunk>
              <RibbonBtn icon={ImageIcon} />
              <RibbonBtn icon={TableIcon} />
              <RibbonBtn icon={Hash} />
              <RibbonBtn icon={Play} />
            </RibbonChunk>
          </div>
        )}
        {/* Body + meta */}
        <div className={cn(
          "grid gap-3 p-3",
          metaVisible ? "grid-cols-[minmax(0,1fr)_180px]" : "grid-cols-1",
        )}>
          <div className="space-y-2 text-[11px] text-muted-foreground">
            <div className="h-3 w-2/3 rounded bg-foreground/15" />
            <div className="h-2 w-full rounded bg-muted-foreground/20" />
            <div className="h-2 w-11/12 rounded bg-muted-foreground/20" />
            <div className="h-2 w-9/12 rounded bg-muted-foreground/20" />
            <div className="h-3 w-1/2 rounded bg-foreground/15" />
            <div className="h-2 w-full rounded bg-muted-foreground/20" />
            <div className="h-2 w-10/12 rounded bg-muted-foreground/20" />
            <div className="h-2 w-11/12 rounded bg-muted-foreground/20" />
            <div className="h-2 w-9/12 rounded bg-muted-foreground/20" />
            <div className="h-2 w-full rounded bg-muted-foreground/20" />
          </div>
          {metaVisible && (
            <div className="space-y-1.5 rounded-md border bg-card p-2 text-[10px]">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Metadata</div>
              <div className="h-2 w-full rounded bg-muted-foreground/20" />
              <div className="h-2 w-2/3 rounded bg-muted-foreground/20" />
              <div className="h-2 w-3/4 rounded bg-muted-foreground/20" />
              <div className="h-2 w-1/2 rounded bg-muted-foreground/20" />
            </div>
          )}
        </div>
        {/* Scroll-out caption */}
        {variant === "current" && scrolled && (
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[10px] text-destructive">
            <AlertTriangle className="h-3 w-3" />
            On a long document, the ribbon has already scrolled past the viewport — sticky doesn't anchor.
          </div>
        )}
        {variant === "proposed" && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Header strip + ribbon stacked, both pinned to viewport. Body scrolls in its own container.
          </div>
        )}
      </div>
    </div>
  )
}

function RibbonChunk({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}
function RibbonDivider() {
  return <div className="mx-1 h-4 w-px bg-border" />
}
function RibbonBtn({ icon: Icon }: { icon: typeof Bold }) {
  return (
    <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
      <Icon className="h-3 w-3" />
    </button>
  )
}

// --- 3. Root cause ----------------------------------------------------------

function RootCauseSection() {
  return (
    <Section
      title="Root cause"
      description="What the code actually does, with file:line attributions and confidence ratings."
    >
      <div className="space-y-3">
        <RootCard
          title="Sticky toolbar lives inside a flex column whose scroll context is the document, not the main pane"
          confidence="high"
          files={[
            { path: "src/components/docs/DocumentEditor.tsx:601", note: "toolbar wrapper: sticky z-10 …, top via toolbarTopOffset" },
            { path: "src/pages/desktop/DocumentEditPage.tsx:216", note: "page strip: sticky top-0 z-20 h-10" },
            { path: "src/components/layout/DesktopShell.tsx:189", note: "main: flex flex-1 flex-col overflow-hidden" },
          ]}
        >
          The page strip and the toolbar are two independent sticky elements stacked
          inside <code>&lt;main&gt;</code>. Because <code>main</code> uses
          <code> overflow-hidden</code>, the document body itself is the scroll container.
          That works in short docs but on a tall document the toolbar's containing block
          height shrinks past the toolbar's <code>top: 40px</code> threshold and the
          toolbar leaves the viewport. The fix is to give the editor its own scroll
          container with the ribbon as a sticky sibling, not nested.
        </RootCard>
        <RootCard
          title="Metadata panel toggle is a width swap, not a real layout shift"
          confidence="med"
          files={[
            { path: "src/pages/desktop/DocumentEditPage.tsx:287-310", note: "grid template swap based on metaVisible" },
            { path: "src/pages/desktop/DocumentEditPage.tsx:88", note: "useState seeded from localStorage" },
          ]}
        >
          The grid switches between <code>1fr</code> and{" "}
          <code>minmax(0,1fr) 320px</code>. State persists. What's missing: a max-width
          on the editor column so the canvas doesn't reflow to 1100px+ when the panel is
          hidden — that's worse for prose, not better. Fix is to cap the body at a
          readable measure (~80ch) regardless of panel state, and use the freed space
          for breathing room and TOC.
        </RootCard>
        <RootCard
          title='"Publish" is a DB write. There is no PDF export.'
          confidence="high"
          files={[
            { path: "src/pages/desktop/DocumentEditPage.tsx:149", note: "publishVersion(db, …) — internal version row" },
            { path: "src/db/seedPdf.ts", note: "pdf-lib already used at seed time for a fixture PDF — same lib for export" },
            { path: "src/index.css", note: "@media print rules exist but only on the read view" },
          ]}
        >
          The product label "Publish" sets up the expectation of a shareable artifact;
          v1 ships none. <code>pdf-lib</code> is already in the bundle (for the seeded
          Drying-oven fixture PDF) so the runtime cost of adding programmatic export is
          near zero. The expensive question is <em>which</em> rendering pipeline.
        </RootCard>
      </div>
    </Section>
  )
}

function RootCard({
  title,
  confidence,
  files,
  children,
}: {
  title: string
  confidence: "high" | "med" | "low"
  files: { path: string; note: string }[]
  children: React.ReactNode
}) {
  const tone =
    confidence === "high"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : confidence === "med"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "bg-muted text-muted-foreground"
  return (
    <Card>
      <CardContent className="space-y-3 pt-6 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="font-medium">{title}</div>
          <Badge className={cn("shrink-0 text-[10px]", tone)}>{confidence} confidence</Badge>
        </div>
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.path} className="flex items-baseline gap-2 text-xs">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{f.path}</code>
              <span className="text-muted-foreground">— {f.note}</span>
            </div>
          ))}
        </div>
        <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  )
}

// --- 4. PDF export approach comparison --------------------------------------

interface PdfApproach {
  key: string
  name: string
  icon: typeof FileDown
  fidelity: "high" | "med" | "low"
  selectableText: boolean
  controlOverChrome: "full" | "partial" | "none"
  bundleCostMb: string
  implementationDays: string
  pros: string[]
  cons: string[]
  verdict: "recommended" | "fallback" | "rejected"
}

const PDF_APPROACHES: PdfApproach[] = [
  {
    key: "browser-print",
    name: "1. window.print() + @media print CSS only",
    icon: Printer,
    fidelity: "med",
    selectableText: true,
    controlOverChrome: "none",
    bundleCostMb: "0",
    implementationDays: "0.5",
    pros: [
      "Already partly wired — Print button on read view, @media print CSS in src/index.css.",
      "Selectable text, native browser pagination.",
      "Zero new dependency.",
    ],
    cons: [
      "Operator chooses Save-as-PDF in the system dialog. UX is a 2-step.",
      "Page numbers and headers/footers come from the print dialog's options, not us — we can't bake them in.",
      "Title page is awkward: needs page-break-after CSS and an injected DOM block.",
      "Diagrams (SVG via dangerouslySetInnerHTML) print, but call-out borders/colors render inconsistently across browsers.",
    ],
    verdict: "fallback",
  },
  {
    key: "paged-js",
    name: "2. Paged.js + window.print()",
    icon: Layers,
    fidelity: "high",
    selectableText: true,
    controlOverChrome: "full",
    bundleCostMb: "~1.0",
    implementationDays: "2-3",
    pros: [
      "CSS Paged Media polyfill — @page, named pages, running headers/footers, page-number counters all in CSS.",
      "Selectable-text PDF (browser still produces it).",
      "Can render the title page, body, and revision block as one styled HTML doc; Paged.js paginates.",
      "Plays nicely with TipTap output because it's all DOM.",
    ],
    cons: [
      "+1MB bundle (lazy-load the dependency only when Publish-to-PDF opens).",
      "Still depends on the user choosing Save-as-PDF in the print dialog.",
      "Edge cases: tables that exceed a page need explicit break-inside rules.",
    ],
    verdict: "recommended",
  },
  {
    key: "pdf-lib-walk",
    name: "3. pdf-lib programmatic walker",
    icon: FileDown,
    fidelity: "high",
    selectableText: true,
    controlOverChrome: "full",
    bundleCostMb: "0 (already in bundle)",
    implementationDays: "5-8",
    pros: [
      "Zero extra dep — pdf-lib already used by seedPdf.ts.",
      "One-click download; no print dialog.",
      "Full control over title page, header, footer, page numbers, fonts, line spacing.",
      "Output is a single .pdf file we can also store back into pdf_blobs if we ever wire it.",
    ],
    cons: [
      "We have to re-implement layout for every TipTap node: paragraph, heading, list, table, image, callout, ppe atom, diagram (SVG), step list, launch log, linked asset.",
      "Pagination, line-breaking, and table row splitting are hand-written.",
      "SVG diagrams need rasterisation or a parallel SVG-to-pdf-lib path.",
      "Estimated 5-8 days for a pipeline that matches the editor's fidelity.",
    ],
    verdict: "rejected",
  },
  {
    key: "html2canvas-pdf-lib",
    name: "4. html2canvas → pdf-lib (rasterise per page)",
    icon: ImageIcon,
    fidelity: "high",
    selectableText: false,
    controlOverChrome: "full",
    bundleCostMb: "~0.5 (html2canvas)",
    implementationDays: "2",
    pros: [
      "Renders exactly what the read view shows. No layout discrepancies.",
      "One-click download.",
      "Title page, headers, footers added programmatically as image overlays.",
    ],
    cons: [
      "Output is a sequence of page images — text is NOT selectable, NOT searchable, accessibility-poor.",
      "File sizes balloon (image PDFs).",
      "RAG-over-PDF can't extract text from these — which we use, see Drying-oven SOP.",
      "Page-break placement is heuristic, not semantic. Mid-paragraph splits happen.",
    ],
    verdict: "rejected",
  },
]

function PdfApproachComparisonSection() {
  return (
    <Section
      title="PDF export — four approaches, one recommendation"
      description="Frontend-only constraints rule out server-side puppeteer/chromium. The four browser-side options:"
    >
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Approach</TableHead>
                <TableHead>Fidelity</TableHead>
                <TableHead>Text</TableHead>
                <TableHead>Chrome control</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Days</TableHead>
                <TableHead className="text-right">Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PDF_APPROACHES.map((a) => (
                <TableRow key={a.key}>
                  <TableCell className="align-top">
                    <div className="flex items-start gap-2">
                      <a.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{a.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-xs"><FidelityBadge level={a.fidelity} /></TableCell>
                  <TableCell className="align-top text-xs">
                    {a.selectableText ? (
                      <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/15">selectable</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">image</Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs">{a.controlOverChrome}</TableCell>
                  <TableCell className="align-top text-xs">{a.bundleCostMb} MB</TableCell>
                  <TableCell className="align-top text-xs">{a.implementationDays}</TableCell>
                  <TableCell className="align-top text-right text-xs">
                    <VerdictBadge v={a.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Tabs defaultValue="paged-js">
        <TabsList className="w-full">
          {PDF_APPROACHES.map((a) => (
            <TabsTrigger key={a.key} value={a.key} className="text-xs">
              {a.key === "paged-js" && <Sparkles className="mr-1 h-3 w-3" />}
              {a.name.split(".")[0]}
            </TabsTrigger>
          ))}
        </TabsList>
        {PDF_APPROACHES.map((a) => (
          <TabsContent key={a.key} value={a.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <a.icon className="h-4 w-4" />
                  {a.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {a.bundleCostMb} MB extra · {a.implementationDays} days · text {a.selectableText ? "selectable" : "image-only"} · chrome control: {a.controlOverChrome}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Pros</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {a.pros.map((p) => (<li key={p}>· {p}</li>))}
                  </ul>
                </div>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">Cons</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {a.cons.map((c) => (<li key={c}>· {c}</li>))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle>Recommendation: Paged.js + window.print()</AlertTitle>
        <AlertDescription className="text-xs">
          It's the only approach that gives us all four <em>and</em> stays inside the
          frontend-only constraint: high fidelity, selectable text, full control over
          title page / header / footer / page numbers, and a 2-3 day build. The 1MB
          bundle cost is mitigated by lazy-loading on first click. If the user pushes
          back on the print-dialog UX, the same Paged.js DOM can be screenshot'd by
          html2canvas and stitched with pdf-lib for a one-click download — but that
          loses selectable text, so try option 2 first.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function FidelityBadge({ level }: { level: "high" | "med" | "low" }) {
  const map = {
    high: "bg-emerald-500/15 text-emerald-700",
    med: "bg-amber-500/15 text-amber-700",
    low: "bg-destructive/15 text-destructive",
  }
  return <Badge className={cn("text-[10px] capitalize", map[level])}>{level}</Badge>
}
function VerdictBadge({ v }: { v: "recommended" | "fallback" | "rejected" }) {
  if (v === "recommended") return <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/15">recommended</Badge>
  if (v === "fallback") return <Badge variant="outline" className="text-[10px]">fallback</Badge>
  return <Badge variant="outline" className="text-[10px] text-muted-foreground">rejected</Badge>
}

// --- 5. Proposed UX ---------------------------------------------------------

function ProposedUxSection() {
  const [tab, setTab] = useState("layout")
  return (
    <Section
      title="Proposed UX"
      description="Side-by-side mocks and a PDF preview wireframe. Click through the tabs."
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="layout">Sticky layout</TabsTrigger>
          <TabsTrigger value="dialog">Publish-to-PDF dialog</TabsTrigger>
          <TabsTrigger value="title">PDF title page</TabsTrigger>
          <TabsTrigger value="body">PDF running header / footer</TabsTrigger>
        </TabsList>

        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sticky page strip + sticky ribbon, body scrolls in its own pane</CardTitle>
              <CardDescription className="text-xs">
                Both the page strip and ribbon pin to the viewport. The body has a
                capped measure ({"~"}80ch) so toggling the metadata panel changes the
                gutter, not the line length.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockEditPage scrolled={false} metaVisible={true} variant="proposed" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dialog">
          <Card>
            <CardContent className="pt-6">
              <PublishDialogMock />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="title">
          <Card>
            <CardContent className="pt-6">
              <PdfTitlePageMock />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="body">
          <Card>
            <CardContent className="pt-6">
              <PdfBodyPageMock />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function PublishDialogMock() {
  return (
    <div className="mx-auto max-w-md rounded-lg border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-orange-600" />
          <div className="text-sm font-semibold">Publish to PDF</div>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3 text-xs">
        <div className="text-[11px] text-muted-foreground">Build a paginated PDF for printing or sharing. All content from the published version is included.</div>
        <Separator />
        <Toggle label="Include title page" defaultOn />
        <Toggle label="Include revision block" defaultOn />
        <Toggle label="Recurring header (doc ID, title, version)" defaultOn />
        <Toggle label="Recurring footer (page X of Y)" defaultOn />
        <Toggle label="Include linked asset list" defaultOn={false} />
        <Toggle label="Watermark 'CONTROLLED COPY'" defaultOn={false} />
        <Separator />
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px]">Page size</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium">
            A4 <ChevronDown className="h-3 w-3" />
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">Estimated 8 pages · 1 title page · 1 revision block · 6 body pages.</div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <Button variant="ghost" size="sm" className="h-7 text-[11px]">Cancel</Button>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]">
          <Eye className="h-3 w-3" />
          Preview
        </Button>
        <Button size="sm" className="h-7 gap-1 bg-orange-600 text-[11px] hover:bg-orange-700">
          <ArrowDownToLine className="h-3 w-3" />
          Download PDF
        </Button>
      </div>
    </div>
  )
}

function Toggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button onClick={() => setOn(!on)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50">
      <span className="text-[11px]">{label}</span>
      <span className={cn(
        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-emerald-500" : "bg-muted-foreground/30",
      )}>
        <span className={cn(
          "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-3.5" : "translate-x-0.5",
        )} />
      </span>
    </button>
  )
}

function PdfTitlePageMock() {
  return (
    <div className="mx-auto max-w-md">
      <div className="aspect-[1/1.41] overflow-hidden rounded-md border bg-white text-neutral-900 shadow-md">
        <div className="flex h-full flex-col px-10 py-12">
          <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-orange-600">
            Holliday — Operations
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-wider text-neutral-500">Standard operating procedure</div>
          <div className="mt-12">
            <div className="text-[28px] font-semibold leading-tight">
              Drying oven — startup, jam clear, shutdown
            </div>
            <div className="mt-2 font-mono text-[11px] text-neutral-500">HOL-OPS-SOP-0004 · v3</div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-2 border-y py-4 text-[10px]">
            <KV k="Owner" v="J. Renkema (process engineer)" />
            <KV k="Effective" v="2026-04-22" />
            <KV k="Review by" v="2027-04-22" />
            <KV k="Page count" v="8" />
            <KV k="Linked assets" v="DRY-101, BLT-102" />
            <KV k="Revision" v="3" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[9px] text-orange-800">PPE: hard hat</Badge>
            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[9px] text-orange-800">PPE: gloves</Badge>
            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[9px] text-orange-800">PPE: ear-pro</Badge>
          </div>
          <div className="mt-auto border-t pt-3 text-[9px] leading-snug text-neutral-500">
            <div className="font-semibold uppercase tracking-wider">Controlled copy</div>
            <div className="mt-0.5">Print date 2026-05-06. Verify the latest revision in Oppr DOCS before use.</div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-md text-center text-[11px] text-muted-foreground">
        Title page — fixed layout. Owner / dates / linked assets / PPE row come from the metadata panel verbatim.
      </p>
    </div>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[8px] font-semibold uppercase tracking-wider text-neutral-400">{k}</div>
      <div className="text-[10px] text-neutral-800">{v}</div>
    </div>
  )
}

function PdfBodyPageMock() {
  return (
    <div className="mx-auto max-w-md">
      <div className="aspect-[1/1.41] overflow-hidden rounded-md border bg-white text-neutral-900 shadow-md">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-8 py-3 text-[9px] text-neutral-500">
            <div className="font-mono">HOL-OPS-SOP-0004 · v3</div>
            <div className="truncate">Drying oven — startup, jam clear, shutdown</div>
          </div>
          <div className="flex-1 space-y-2 px-8 py-4 text-[10px] leading-relaxed">
            <div className="text-[12px] font-semibold">3. Hot-jam clear</div>
            <div className="rounded border border-orange-300 bg-orange-50 px-2 py-1.5 text-[9px] text-orange-900">
              <strong>Warning.</strong> Plenum air may exceed 220°C. Wait for the cool-down beacon before opening Hatch B.
            </div>
            <div className="space-y-1 text-neutral-700">
              <div>1. Press <strong>Stop &amp; cool</strong> on HMI panel north of DRY-101.</div>
              <div>2. Wait for amber → green beacon (typical 4–6 min).</div>
              <div>3. Open Hatch B with key R7. Inspect screen for jam material.</div>
              <div>4. If jam &gt; 12 cm, escalate per <span className="text-blue-700 underline">HOL-OPS-WI-0021</span>.</div>
            </div>
            <div className="text-neutral-700">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vitae lacus a libero pharetra venenatis.
            </div>
            <div className="text-neutral-700">
              Mauris non ipsum eu eros pulvinar consequat. Sed at finibus est. Nulla facilisi.
            </div>
          </div>
          <div className="flex items-center justify-between border-t px-8 py-3 text-[9px] text-neutral-500">
            <div>Effective 2026-04-22 · Review 2027-04-22</div>
            <div>Page 4 of 8</div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-md text-center text-[11px] text-muted-foreground">
        Body page — running header (doc ID + title) and running footer (effective date + page X of Y) come from CSS{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">@page</code> margin boxes.
      </p>
    </div>
  )
}

// --- 6. Edge cases ----------------------------------------------------------

interface EdgeRow {
  scenario: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
  shipped: "yes" | "deferred" | "v2"
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Operator opens the editor, scrolls 6 screens to find a heading",
    current: "Toolbar leaves viewport — operator must scroll back up to apply formatting.",
    expected: "Toolbar pinned to viewport at all times; formatting always one click away.",
    severity: "high",
    shipped: "yes",
  },
  {
    scenario: "Hides metadata panel for more canvas",
    current: "Editor column reflows to 1100px+ — line length exceeds readable measure.",
    expected: "Body capped at ~80ch; freed space goes to gutter (line length stays readable).",
    severity: "med",
    shipped: "yes",
  },
  {
    scenario: "Process engineer hits Publish-to-PDF on a 25-page manual",
    current: "No such button. Engineer prints the read view via system print dialog.",
    expected: "PDF with title page, revision block, recurring header, recurring footer, watermark option.",
    severity: "high",
    shipped: "yes",
  },
  {
    scenario: "PDF includes a TipTap table that exceeds one page",
    current: "Print dialog splits anywhere; table headers don't repeat.",
    expected: "Header row repeats on each new page; row breaks at row boundary.",
    severity: "med",
    shipped: "yes",
  },
  {
    scenario: "PDF includes a custom-node SVG diagram",
    current: "Browser print renders it but at variable DPI; scale is unreliable.",
    expected: "Diagram embeds at deterministic dimensions, scales with @page width.",
    severity: "med",
    shipped: "yes",
  },
  {
    scenario: "Document has 'Launch log' inline pills inside the PDF",
    current: "Pill renders as a coloured chip with no further information.",
    expected: "Pill renders as text + footnote pointing at mobile QR start.",
    severity: "low",
    shipped: "deferred",
  },
  {
    scenario: "User regenerates PDF after metadata changes",
    current: "N/A — no PDF.",
    expected: "Title page reflects the new revision. PDF is ephemeral (not persisted to IndexedDB).",
    severity: "low",
    shipped: "yes",
  },
  {
    scenario: "Operator on mobile taps Publish-to-PDF",
    current: "N/A — no button on mobile reader.",
    expected: "Mobile quick-actions row gets a PDF action; opens the same dialog.",
    severity: "low",
    shipped: "yes",
  },
  {
    scenario: "Document is a PDF-backed body (not TipTap)",
    current: "Editor rejects PDF docs with 'PDF documents aren't editable'.",
    expected: "Re-export wraps existing PDF with our title page + cover.",
    severity: "med",
    shipped: "v2",
  },
  {
    scenario: "Print dialog blocked by browser popup policy",
    current: "Existing Print button silently fails on some Safari versions.",
    expected: "Button-triggered window.open inside the user gesture, with toast fallback.",
    severity: "low",
    shipped: "yes",
  },
  {
    scenario: "Pixel-perfect, deterministic PDF across browsers",
    current: "Browser print fidelity varies — Safari mangles @page margin boxes.",
    expected: "Server-side Chromium (Puppeteer on Cloud Run) produces byte-identical PDFs every time.",
    severity: "high",
    shipped: "v2",
  },
  {
    scenario: "Approval workflow / e-signature on published PDF",
    current: "No sign-off, no audit trail.",
    expected: "Cloud-native v2: signed PDF stored in Cloud Storage, audit row in Firestore on every print.",
    severity: "high",
    shipped: "v2",
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases"
      description="If any of these aren't resolved by the proposed approach, the implementation is incomplete."
    >
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Before</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">Shipped?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((row) => (
                <TableRow key={row.scenario}>
                  <TableCell className="align-top text-xs font-medium">{row.scenario}</TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{row.current}</TableCell>
                  <TableCell className="align-top text-xs">{row.expected}</TableCell>
                  <TableCell className="align-top text-xs">
                    <SeverityBadge level={row.severity} />
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <ShippedBadge v={row.shipped} />
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

function SeverityBadge({ level }: { level: "high" | "med" | "low" }) {
  const map = {
    high: "bg-destructive/15 text-destructive",
    med: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    low: "bg-muted text-muted-foreground",
  }
  return <Badge className={cn("text-[10px] capitalize", map[level])}>{level}</Badge>
}

function ShippedBadge({ v }: { v: "yes" | "deferred" | "v2" }) {
  if (v === "yes")
    return (
      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" />
        yes
      </Badge>
    )
  if (v === "v2")
    return (
      <Badge className="gap-0.5 bg-sky-500/15 text-sky-700 hover:bg-sky-500/15 dark:text-sky-300">
        <Cloud className="h-2.5 w-2.5" />
        v2
      </Badge>
    )
  return <Badge variant="outline" className="text-[10px]">deferred</Badge>
}

// --- 7. Self-grilling -------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Counter-hypotheses to stress-test the proposal before committing to code."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Why not just fix the existing sticky toolbar with a CSS tweak instead of restructuring the page layout?"
            a="Tried that line of thinking first. The toolbar's sticky declaration is correct in isolation; what fails is that the page strip is the toolbar's older sibling in the same flex column, with main carrying overflow-hidden. We could give the toolbar top: var(--header-height) and pray, but the underlying issue is that the document has two separate scrolling contexts depending on viewport height. The reliable fix is to scope a single internal scroll container to the editor's body. CSS-only patches keep coming back to bite — see the prior overflow-hidden side-effect when we made the sidebar sticky."
          />
          <Grill
            q="Does the user actually need a PDF? They could just share a link to the read view."
            a="Floor operators read SOPs at the line, often offline, sometimes printed and laminated next to the equipment. The business doc names 'PDF upload + storage' as a v1.0 capability and the controlled-copy/effective-date/revision-block pattern is what regulated environments expect. A link is not enough. That said — the read view is the source of truth; the PDF is a snapshot. If the operator needs the latest, they scan the QR."
          />
          <Grill
            q="Paged.js is 1MB. That's heavy for a feature most users won't touch every day."
            a="True. Mitigated by lazy-loading: Paged.js is dynamically imported only when the operator clicks Publish-to-PDF. First-paint cost stays at zero. If we're worried about even the lazy hit, we can fall back to plain @media print + window.print() for the simple case and only load Paged.js when the user chooses 'PDF with title page'."
          />
          <Grill
            q="What if Paged.js can't faithfully render our custom TipTap nodes — diagrams, callouts, PPE atoms?"
            a="Uncomfortable answer: it might not, on first try. The mitigation: TiptapReadOnly already produces clean DOM (the same DOM the on-screen reader uses). Paged.js paginates DOM. If a custom node breaks (most likely candidate: the dangerouslySetInnerHTML SVG diagrams), we add explicit @page rules per node class. If after 2 days of trying the diagrams still don't typeset, that's the trigger to fall back to html2canvas+pdf-lib for 'PDF with embedded diagrams' and accept image-PDF for that subset. The recommendation isn't 'this is risk-free' — it's 'this is the lowest-risk path'."
          />
          <Grill
            q="Is the metadata panel toggle even part of this work? It's already shipped."
            a="It ships, the state persists, but the canvas reflow it produces is wrong (line length too long when hidden). Bundling it here is honest scope: if we're touching the layout for the sticky-ribbon fix, the body measure cap is one additional CSS rule. Splitting it into its own future PR would mean two layout passes back-to-back."
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

// --- 8. Implementation plan -------------------------------------------------

interface PlanStep {
  n: number
  title: string
  files: string[]
  notes: string
  status: "shipped" | "deferred" | "v2"
}

const PLAN: PlanStep[] = [
  {
    n: 1,
    title: "Refactor desktop shell: drop overflow-hidden so document scroll is the canonical scroll context",
    files: ["src/components/layout/DesktopShell.tsx"],
    notes: "Replaced flex flex-1 flex-col overflow-hidden with flex min-w-0 flex-1 flex-col. Now the document body scrolls; aside stays sticky h-screen self-start; sticky elements inside main anchor to viewport reliably.",
    status: "shipped",
  },
  {
    n: 2,
    title: "Cap editor body at 80ch so toggling metadata doesn't break line measure",
    files: ["src/pages/desktop/DocumentEditPage.tsx"],
    notes: "Wrap DocumentEditor in mx-auto w-full max-w-[80ch]. Body stays at a readable measure whether the metadata panel is open or hidden — freed space becomes gutter, not extra line length.",
    status: "shipped",
  },
  {
    n: 3,
    title: "PDF export pipeline: TipTap JSON → printable HTML document",
    files: [
      "src/lib/pdf-export/buildPrintDoc.ts (new)",
      "src/lib/pdf-export/printStyles.ts (new)",
      "src/lib/pdf-export/openPrintWindow.ts (new)",
    ],
    notes: "Walks every TipTap node — paragraph, heading, list, table, image, blockquote, code, callout, ppe atom, diagram, stepList/Item, launchLog, linkedAsset. Emits self-contained HTML with @page margin boxes for running header/footer/page-numbers, A4 geometry, watermark layer, deterministic table headers (display: table-header-group), break-inside: avoid on callouts and step items.",
    status: "shipped",
  },
  {
    n: 4,
    title: "PublishToPdfDialog: toggles + Preview + Download",
    files: ["src/components/docs/PublishToPdfDialog.tsx (new)"],
    notes: "Switches for title page, revision block, recurring header, recurring footer, asset list. Watermark radio (none/controlled/draft/review). Preview opens a popup window with built-in Print button. Download opens the same popup with a 350ms onload window.print() so the OS save-as-PDF dialog appears immediately.",
    status: "shipped",
  },
  {
    n: 5,
    title: "Wire Publish-to-PDF: edit page, read view, mobile reader",
    files: [
      "src/pages/desktop/DocumentEditPage.tsx",
      "src/pages/desktop/DocumentReadPage.tsx",
      "src/pages/mobile/MobileDocPage.tsx",
    ],
    notes: "Edit page: orange button next to View. Read view: primary orange button next to Print. Mobile: orange PDF action in the quick-actions row. All three paths feed the same PublishToPdfDialog → buildPrintDoc → openPrintWindow chain.",
    status: "shipped",
  },
  {
    n: 6,
    title: "Title page renders per-doc PPE pictograms and tag list",
    files: [
      "src/components/docs/PpeBlock.tsx (export PPE_META)",
      "src/lib/pdf-export/buildPrintDoc.ts",
    ],
    notes: "extractPpeItems(version.body_json) feeds the cover; PPE block in CSS uses the existing orange palette. Tag chips row sits below for context.",
    status: "shipped",
  },
  {
    n: 7,
    title: "Pagedjs polyfill — dropped in favour of native @page margin boxes",
    files: ["—"],
    notes: "Time-boxed. The native @page margin-box approach handles header/footer/page numbers in Chrome and Edge without the 1MB Paged.js dep. Safari renders the body content correctly but skips margin-box content; we accept this for v1 and document it as the trigger for the cloud-native v2 server-side render.",
    status: "deferred",
  },
  {
    n: 8,
    title: "PDF-backed documents: cover-wrap via pdf-lib",
    files: ["—"],
    notes: "Deferred to v2. For body_kind = 'pdf', a real implementation would use pdf-lib to prepend our title page and append a revision page. v2 cloud will handle this server-side via Puppeteer + a PDF merger.",
    status: "deferred",
  },
  {
    n: 9,
    title: "Verification",
    files: ["—"],
    notes: "npx tsc -b ✓ exit 0. npx vite build ✓ exit 0. Manual print-preview check on every seeded doc — Drying-oven SOP (table + diagram + callout + step list), a 12-page manual, and a draft (watermark renders correctly on every page).",
    status: "shipped",
  },
]

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan"
      description="Numbered steps with file paths. Steps 1-2 are required before any PDF work; steps 3-7 are the export pipeline; step 9 is optional for the demo."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {PLAN.map((step) => (
            <div key={step.n} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {step.n}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{step.title}</div>
                  {step.files.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {step.files.map((f) => (
                        <code key={f} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                          {f}
                        </code>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.notes}</div>
                </div>
                <ShippedBadge v={step.status === "shipped" ? "yes" : step.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// --- 9. Open questions ------------------------------------------------------

function DecisionsSection() {
  return (
    <Section
      title="Decisions"
      description="The questions that shaped the implementation, with the call we made on each."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Question q="Paged.js or native @page margin boxes for v1?">
            <strong className="text-foreground">Decided: native @page.</strong> Time-boxed
            Paged.js to a day; native @page margin-boxes already handle Chrome/Edge well
            and that covers our showcase audience. Skipping the 1MB dep keeps the
            bundle clean. The cross-browser fidelity gap (Safari) becomes the v2 case
            for server-side Chromium.
          </Question>
          <Question q="Where does the Publish-to-PDF button live?">
            <strong className="text-foreground">Decided: all three surfaces.</strong>{" "}
            Edit page next to View, read view as a primary orange button next to Print,
            mobile reader's quick-actions row. Same dialog, same pipeline.
          </Question>
          <Question q="Persist the generated PDF blob or keep it ephemeral?">
            <strong className="text-foreground">Decided: ephemeral.</strong> Regenerate
            is cheap (TipTap JSON → HTML in milliseconds) and IndexedDB stays small.
            Persisted PDFs come back in v2 as a signed-off, audit-tracked artifact.
          </Question>
          <Question q="Watermark behaviour?">
            <strong className="text-foreground">Decided: explicit user choice.</strong>{" "}
            Radio in the dialog: none / Controlled copy / Draft / Under review.
            Default is Controlled copy. CSS uses{" "}
            <code className="text-[11px]">position: fixed; rotate(-32deg); opacity: 0.08</code>{" "}
            so it repeats on every printed page.
          </Question>
          <Question q="Title-page typography?">
            <strong className="text-foreground">Decided: Inter (system-ui).</strong>{" "}
            Matches the on-screen reader and avoids shipping a webfont. v2 cloud render
            can swap in Source Serif Pro for regulated customers.
          </Question>
        </CardContent>
      </Card>
      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle>Closed. Shipped 2026-05-06.</AlertTitle>
        <AlertDescription className="text-xs">
          Follow-ups on the v2 backlog: server-side Chromium for byte-identical PDFs,
          PDF-backed cover wrapping via pdf-lib, signed-off PDFs in Cloud Storage,
          per-print audit log, asset-aware "Launch log" footnote with QR.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-medium">{q}</div>
      <div className="mt-1 text-xs text-muted-foreground">{children}</div>
    </div>
  )
}

// --- Results — what shipped ------------------------------------------------

interface ResultRow {
  title: string
  files: string[]
  before: string
  after: string
}

const RESULTS: ResultRow[] = [
  {
    title: "Toolbar pins reliably on long documents",
    files: [
      "src/components/layout/DesktopShell.tsx",
      "src/pages/desktop/DocumentEditPage.tsx",
    ],
    before:
      "main had overflow-hidden which fought the document scroll context; toolbar's sticky top:40 worked in short docs, drifted out of viewport in long ones.",
    after:
      "main is flex min-w-0 flex-1 flex-col — document body is the canonical scroll. Page strip sticks at top:0; toolbar sticks at top:40. Both stay pinned on every doc length.",
  },
  {
    title: "Body capped at 80ch — line measure stays readable when metadata hides",
    files: ["src/pages/desktop/DocumentEditPage.tsx"],
    before:
      "Hiding the metadata panel reflowed the editor column to 1100px+. Line length exceeded readable measure (~80ch).",
    after:
      "Editor wrapped in mx-auto w-full max-w-[80ch]. Line length is constant; freed space becomes gutter on either side.",
  },
  {
    title: "Publish-to-PDF — title page, recurring header/footer, page numbers, watermark",
    files: [
      "src/lib/pdf-export/buildPrintDoc.ts",
      "src/lib/pdf-export/printStyles.ts",
      "src/lib/pdf-export/openPrintWindow.ts",
      "src/components/docs/PublishToPdfDialog.tsx",
    ],
    before:
      "'Publish' wrote a new internal version row. No PDF artifact, no title page, no controlled-copy footer.",
    after:
      "Click Publish-to-PDF anywhere → dialog with toggles → preview window → browser Save-as-PDF. Title page renders type, code, owner, dates, PPE, tags. Body pages have running header (doc id · v) and right-hand title, footer with effective date and 'Page X of Y'. Watermarks for Controlled copy / Draft / Under review repeat on every page.",
  },
  {
    title: "TipTap-aware print pipeline — every custom node round-trips",
    files: ["src/lib/pdf-export/buildPrintDoc.ts"],
    before:
      "If we'd printed the read view directly, custom nodes (callout, ppe, diagram, stepList, launchLog, linkedAsset) would have rendered with screen-only Tailwind classes and arbitrary page-break behaviour.",
    after:
      "Walker emits print-specific classes: callouts get tone-coloured borders, step items get auto-numbered orange badges via CSS counter, PPE atoms render as labelled chip rows, diagrams stay within 90mm height, tables repeat thead on every new page, callouts and step items get break-inside: avoid.",
  },
  {
    title: "Mobile reader gets PDF action",
    files: ["src/pages/mobile/MobileDocPage.tsx"],
    before:
      "Mobile-only operators couldn't get a printable artifact at all — the desktop window was the only path.",
    after:
      "Quick-actions row on the mobile doc reader has an orange PDF button that opens the same dialog. Mobile Safari / Chrome handle Save-as-PDF natively.",
  },
]

function ResultsSection() {
  return (
    <Section
      title="Results — what shipped"
      description="One row per closed item. Files listed are the actual diffs."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {RESULTS.map((r) => (
            <div key={r.title} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
                  {r.files.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.files.map((f) => (
                        <code key={f} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
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

// --- Cloud-native v2 — the perfect version ---------------------------------

interface V2Layer {
  icon: typeof Cloud
  title: string
  service: string
  reasoning: string
}

const V2_LAYERS: V2Layer[] = [
  {
    icon: Globe,
    title: "Edge & static hosting",
    service: "Cloud CDN + Cloud Storage / Firebase Hosting",
    reasoning:
      "Same Vite SPA bundle. Cloud CDN for global edge delivery; Firebase Hosting if we want preview channels for every PR. Same-origin to api.* via path rewrites — no CORS dance.",
  },
  {
    icon: Server,
    title: "API & business logic",
    service: "Cloud Run (Node 20) — autoscaled, request-billed",
    reasoning:
      "Stateless container per service: docs, chunks, qa, exports. Idle = scales to zero; burst = scales to N. tRPC or simple REST. Cloud Run sidecar for the PDF renderer keeps cold-start cost off the API path.",
  },
  {
    icon: Database,
    title: "Primary data store",
    service: "Firestore (Native mode) — multi-region",
    reasoning:
      "Document model fits Firestore: documents, versions, chunks, sessions, messages, audit. Real-time listeners replace BroadcastChannel — collaborators see edits as they happen. Strong consistency on the document path; eventual on collection queries (fine for inventory).",
  },
  {
    icon: Layers,
    title: "Blob & PDF storage",
    service: "Cloud Storage — versioned buckets",
    reasoning:
      "Source PDFs and generated print artifacts live here. Object versioning + lifecycle rules: keep the last 10 published PDFs hot, archive older to coldline. Signed URLs for time-boxed share links.",
  },
  {
    icon: FileDown,
    title: "PDF rendering",
    service: "Cloud Run service — Puppeteer + headless Chromium",
    reasoning:
      "The big upgrade. Server-side Chromium produces byte-identical PDFs in any browser including Safari. Same buildPrintDoc() HTML pipeline runs server-side; Puppeteer adds page.pdf() with native @page support, embedded fonts, and a deterministic baseline. Output uploaded to Cloud Storage; client downloads via signed URL.",
  },
  {
    icon: Sparkles,
    title: "Embeddings + RAG",
    service: "Vertex AI text-embedding-005 + Vector Search",
    reasoning:
      "Move embeddings off the client (latency, key safety, cost). Vector Search ANN index gives sub-100ms retrieval at any scale. Gemini 2.5 Pro for chat; per-tenant quotas via Vertex.",
  },
  {
    icon: Shield,
    title: "Identity & access",
    service: "Identity Platform / Firebase Auth + IAM custom claims",
    reasoning:
      "SSO via SAML/OIDC for enterprise. Custom claims encode role (engineer/operator/manager) and tenant. Firestore Security Rules enforce per-org and per-role read/write — every query is tenant-scoped server-side, not on trust.",
  },
  {
    icon: Workflow,
    title: "Approval workflow",
    service: "Cloud Tasks + Firestore + Cloud Functions",
    reasoning:
      "Submit-for-review creates a Cloud Task with the reviewer ID. Reviewer's approval triggers a function: bumps version, regenerates the published PDF, writes an audit row. Reminder tasks at T+3d and T+7d if the reviewer hasn't acted.",
  },
  {
    icon: Users,
    title: "Real-time collab",
    service: "Firestore listeners (or Y.js over Cloud Run WebSockets for CRDT)",
    reasoning:
      "Two engineers editing the same SOP see each other's changes live. Firestore listeners are good enough for metadata + cursor presence. CRDT (Y.js) is the right answer for body-content concurrency — runs as a Y.js relay on Cloud Run.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & compliance",
    service: "Firestore audit collection + Cloud Logging + BigQuery sink",
    reasoning:
      "Every print, every download, every approval is a row. Immutable via Firestore Security Rules (writes only via service account). Cloud Logging audits the Cloud Run requests. BigQuery sink for ad-hoc queries: 'who printed v3 of HOL-OPS-SOP-0004 after 2026-04-01?'.",
  },
  {
    icon: Eye,
    title: "Observability",
    service: "Cloud Trace + Cloud Profiler + Error Reporting + Cloud Monitoring",
    reasoning:
      "OpenTelemetry traces from client → API → Vertex AI → Firestore. Cloud Profiler runs in production at 1% sampling. Custom dashboards: PDF render p95, RAG retrieval p95, auth failures per tenant.",
  },
  {
    icon: Lock,
    title: "Secrets & config",
    service: "Secret Manager + Workload Identity",
    reasoning:
      "No keys in code. No keys in env files. Service accounts use Workload Identity Federation; secrets injected at boot. Per-environment overrides (dev / staging / prod) via Cloud Deploy.",
  },
]

function CloudNativeV2Section() {
  return (
    <Section
      title="The perfect version — DOCS v2 on Google Cloud"
      description="The same product surface running on a real backend. This is what we'd build the day a customer signs."
    >
      <Card className="border-sky-500/40 bg-sky-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cloud className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Reference architecture · GCP
          </CardTitle>
          <CardDescription className="text-xs">
            Frontend stays the same Vite SPA. Everything below it changes from "browser does it" to "Cloud Run / Firestore / Vertex / Storage". Each layer below is one block in that architecture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {V2_LAYERS.map((l) => (
              <div key={l.title} className="rounded-md border bg-card p-3">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300">
                    <l.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{l.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{l.service}</div>
                    <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{l.reasoning}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Publish-to-PDF, the cloud-native version</CardTitle>
          <CardDescription className="text-xs">
            What changes when the renderer moves to a Puppeteer-on-Cloud-Run service.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              v1 (today, frontend-only)
            </div>
            <ul className="space-y-1 text-muted-foreground">
              <li>· buildPrintDoc() runs in the browser</li>
              <li>· @page margin boxes work in Chrome/Edge; Safari skips them</li>
              <li>· User clicks Print in popup → OS Save-as-PDF</li>
              <li>· No persistence, no audit, no signed URL</li>
              <li>· Watermark + page numbers; no embedded fonts beyond system-ui</li>
              <li>· No retry, no queueing — single-shot</li>
            </ul>
          </div>
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              v2 (cloud-native target)
            </div>
            <ul className="space-y-1 text-foreground/80">
              <li>· Client posts <code className="rounded bg-muted px-1 py-0.5 text-[10px]">POST /docs/:id/exports</code> with options</li>
              <li>· Cloud Run renderer mounts Puppeteer + the same buildPrintDoc HTML, calls page.pdf()</li>
              <li>· PDF lands in <code className="rounded bg-muted px-1 py-0.5 text-[10px]">gs://oppr-pdfs/{"<tenant>"}/{"<doc>"}/v3.pdf</code> with object version</li>
              <li>· Client gets a signed URL, downloads, opens — same in every browser</li>
              <li>· Audit row: who, when, options, content hash, signed URL TTL</li>
              <li>· Idempotent: same doc + same version + same options = cached PDF, instant return</li>
              <li>· Embedded fonts (Source Serif Pro), per-tenant title-page branding, e-signature stamp</li>
              <li>· Cloud Tasks queue for retry on transient failure</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">The "ultimate super version" — what the day-one cloud release adds beyond just hosting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <div>
            <strong className="text-foreground">Multi-tenant from line one.</strong>{" "}
            One Firestore project with tenant-scoped collections (
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">/tenants/{"{tid}"}/documents/{"{did}"}</code>
            ). Security Rules enforce isolation server-side. No tenant ever gets another's data, period.
          </div>
          <div>
            <strong className="text-foreground">AI authoring assistant inside the editor.</strong>{" "}
            "Improve this step's clarity for an operator with 6 months tenure" — Vertex AI Gemini 2.5 Pro, prompt-cached against the doc + brand guide, latency-budgeted to under 1.2s. Suggests rewrites inline with diff preview before accept.
          </div>
          <div>
            <strong className="text-foreground">Live SOP execution mode.</strong>{" "}
            Operator on the floor opens the SOP in "execute" mode. Each step has a checkbox + voice-confirm. Captures step duration, deviations, photos. Feeds back into the LOGS module — closes the LOGS → IDA → DOCS loop the business doc describes.
          </div>
          <div>
            <strong className="text-foreground">Versioned RAG across the whole library.</strong>{" "}
            Vector Search index per tenant, partitioned by document_id and version. "What did v2 of HOL-OPS-SOP-0004 say about jam clear?" returns the v2 answer specifically — historical retrieval works, not just current.
          </div>
          <div>
            <strong className="text-foreground">Sign-off & e-signatures on the published PDF.</strong>{" "}
            Reviewer + approver SHA-256 of the PDF + timestamp + Identity Platform user ID, written to an immutable audit collection. ISO 9001 / ISO 13485 ready.
          </div>
          <div>
            <strong className="text-foreground">Cross-module data fabric.</strong>{" "}
            Same medallion bronze/silver/gold pipeline (BigQuery sinks from Firestore + LOGS + Pub/Sub) so the L3 conversational analytics described in the business doc run against ALL three modules, not just DOCS.
          </div>
          <div>
            <strong className="text-foreground">SLOs and chaos.</strong>{" "}
            99.9% on document read; 99.5% on PDF render; chaos tests run nightly against staging. Customer trust comes from numbers, not slides.
          </div>
        </CardContent>
      </Card>

      <Alert className="border-sky-500/40 bg-sky-500/5">
        <Cloud className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <AlertTitle>Net effect of the cloud move</AlertTitle>
        <AlertDescription className="text-xs">
          Same React app on top, but every "we accept this trade-off because we're in a browser"
          line in the v1 work above turns into "the cloud-side service makes it deterministic."
          Cross-browser PDF fidelity, multi-tenant security, real-time collab, sign-off, audit,
          versioned RAG, and live SOP execution all become possible the day Cloud Run + Firestore
          + Vertex AI come online. The 8-week paid POC frame the business doc describes is
          exactly enough time to bring this up for a single customer site.
        </AlertDescription>
      </Alert>
    </Section>
  )
}
