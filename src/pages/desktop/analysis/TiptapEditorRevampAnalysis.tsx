// Analysis page for the document-editor (TipTap) revamp.
//
// Static documentation — no live DB, no AI, no fetching. The components
// rendered as "current" and "proposed" are React mocks so the spec is
// browsable and reviewable inside the app at /analysis/tiptap-editor-revamp.

import { useState } from "react"
import {
  AlertTriangle,
  Bold,
  Boxes,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Code,
  EyeOff,
  Eye,
  Factory,
  Flame,
  HardHat,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Lock,
  Minus,
  Mountain,
  Play,
  PlugZap,
  Pyramid,
  QrCode,
  Quote,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Strikethrough,
  Tag,
  Table as TableIcon,
  Triangle,
  Type,
  Wrench,
  CheckCircle2,
  ListChecks as ListChecksIcon,
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
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function TiptapEditorRevampAnalysis() {
  return (
    <AnalysisLayout
      title="Document editor revamp — toolbar, metadata, safety, and log execution"
      subtitle="The current TipTap surface works for prose but pushes the operator's most useful authoring tools (PPE, callouts, asset/log links) into a 28-icon toolbar that wraps on narrow screens, behind a dialog, or behind a slash-menu. The metadata panel locks 320px of canvas. Safety guidance is a single PPE block, not a palette. Linked assets surface only by code, and 'Launch log' references a record without ever telling the operator how an operator actually starts that log. This page lays out a reorder of the editor and four UX additions for review before any code change."
      date="2026-05-06"
      scopes={["desktop", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemStatementSection />
      <EvidenceSection />
      <DataModelMapSection />
      <CurrentBehaviorSection />
      <RootCauseSection />
      <EdgeCasesSection />
      <SelfGrillingSection />
      <ProposedUxSection />
      <ResultsSection />
      <ImplementationPlanSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

// --- Summary header card ---------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="Cramped editor, weak safety palette, opaque asset/log linking, locked-in metadata column"
          tone="destructive"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="Shipped · 2026-05-06"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="6 plan items · 8 files touched · 3 new components · 1 hook · 8 new callout kinds"
          tone="default"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b ✓ · vite build ✓"
          tone="default"
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

// --- 1. Problem statement ---------------------------------------------------

function ProblemStatementSection() {
  return (
    <Section title="Problem">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Four issues compounding in the authoring surface</AlertTitle>
        <AlertDescription>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>
              <strong>Layout density.</strong> The TipTap toolbar is 28 buttons wide and
              wraps to 2-3 rows on a 1280px viewport. Both the page header (h-14) and the
              toolbar use independent sticky behaviour, so they stack and eat ~120px of
              vertical canvas before the first paragraph. The 320px metadata panel always
              consumes the right column.
            </li>
            <li>
              <strong>Safety palette is one button.</strong> PPE is a single dialog-opened
              picker. Site-critical content like Lockout/Tagout, Hot work, Confined-space,
              Working-at-heights, Authorized-only, Permit-required is buried in a generic
              callout dropdown labelled with a single triangle icon.
            </li>
            <li>
              <strong>Asset linking is code-only.</strong> The Linked-asset picker shows
              <code> code · name</code> and that's it. Operators searching for &quot;the
              press in Hall B&quot; have no way to filter by location, floorplan, or
              recently-edited.
            </li>
            <li>
              <strong>&quot;Launch log&quot; is a static pill.</strong> The block carries
              <code> logId</code>, <code>anchorId</code>, <code>label</code> and renders a
              sky-blue Play icon that does nothing in the editor. Operators reading the
              published SOP have no clear path from the pill to actually starting the
              log capture.
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// --- 2. Evidence ------------------------------------------------------------

function EvidenceSection() {
  return (
    <Section
      title="Evidence"
      description="No screenshots provided in this round — the user described the issues in conversation. Quoted below for traceability; the visual grounding lives in the Current Behaviour and Proposed UX mocks lower on this page."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Quoted>
            &quot;Revamp the current editing mode of the tool so we have lots of different
            buttons for safety issues and for personal protective equipment […] floating
            bar of the TipTap header at the top and we have the metadata part that we
            should be able to hide so that we have more screen functionality.&quot;
          </Quoted>
          <Quoted>
            &quot;When you are linking assets that you have a better tool to search through
            the assets and when you're linking logs or implement logs to have them
            executed.&quot;
          </Quoted>
        </CardContent>
      </Card>
    </Section>
  )
}

function Quoted({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="rounded-md border-l-4 border-primary/40 bg-muted/40 px-3 py-2 italic text-muted-foreground">
      {children}
    </blockquote>
  )
}

// --- 3. Data-model map -----------------------------------------------------

function DataModelMapSection() {
  return (
    <Section
      title="What the editor actually has today"
      description="Pulled from the current source so the analysis is grounded in code, not assumed structure."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom TipTap nodes registered in DocumentEditor</CardTitle>
          <CardDescription>
            All nodes are mirrored in TiptapReadOnly (read view). Atoms cannot accept
            inline text; container blocks recurse for chunking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Surface today</TableHead>
                <TableHead>File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <NodeRow node="callout" kind="container" surface="Toolbar dropdown (5 kinds: warning, caution, danger, notice, tip) + slash menu" file="CalloutBlock.tsx" />
              <NodeRow node="ppe" kind="atom" surface="Toolbar button → Dialog picker (8 items)" file="PpeBlock.tsx" />
              <NodeRow node="diagram" kind="atom" surface="Toolbar button → Dialog picker (curated SVG presets)" file="DiagramBlock.tsx" />
              <NodeRow node="launchLog" kind="atom" surface="Toolbar button → Dialog picker → static pill" file="LaunchLogBlock.tsx" />
              <NodeRow node="linkedAsset" kind="inline" surface="Toolbar button → Dialog picker → inline chip" file="LinkedAssetBlock.tsx" />
              <NodeRow node="stepList / stepItem" kind="container" surface="Toolbar button + slash menu (numbered steps)" file="StepListBlock.tsx" />
              <NodeRow node="table family" kind="container" surface="Toolbar button (3×3 default)" file="(@tiptap/extension-table)" />
            </TableBody>
          </Table>
          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              Total toolbar density on the wide layout: 4 heading buttons · 3 inline marks ·
              4 list/quote/code · 4 link/image/table/HR · 1 step · 1 callout dropdown ·
              1 PPE · 1 diagram · 2 launch+link = <strong>21 visible buttons + 1 dropdown</strong>.
              On 1280px the row wraps; on 1440px it sits flat. Each button is 32×32 with no
              grouping label.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function NodeRow({
  node,
  kind,
  surface,
  file,
}: {
  node: string
  kind: string
  surface: string
  file: string
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{node}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{kind}</TableCell>
      <TableCell className="text-xs">{surface}</TableCell>
      <TableCell className="font-mono text-[10px] text-muted-foreground">{file}</TableCell>
    </TableRow>
  )
}

// --- 4. Current behaviour — reproduced inline ------------------------------

function CurrentBehaviorSection() {
  return (
    <Section
      title="Current behaviour, reproduced as React"
      description="Below is a faithful mock of the editor surface today, built from the same shadcn primitives the page uses. Use it to see exactly what the operator looks at."
    >
      <CurrentEditorMock />
    </Section>
  )
}

function CurrentEditorMock() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Page header */}
        <div className="flex items-center justify-between border-b bg-background px-4 py-2 text-xs">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              Untitled SOP
              <Badge variant="outline" className="text-[10px]">
                SOP
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                draft
              </Badge>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              HOL-OPS-SOP-0001 · v1
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled className="h-7 text-[11px]">
              View
            </Button>
            <Button size="sm" variant="outline" disabled className="h-7 text-[11px]">
              Save draft
            </Button>
            <Button size="sm" variant="outline" disabled className="h-7 text-[11px]">
              Submit
            </Button>
            <Button size="sm" disabled className="h-7 text-[11px]">
              Publish
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            {/* Toolbar — wraps on narrow */}
            <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-background p-1.5">
              <ToolbarBtn icon={Type} title="Paragraph" />
              <ToolbarBtn icon={Heading1} title="H1" />
              <ToolbarBtn icon={Heading2} title="H2" />
              <ToolbarBtn icon={Heading3} title="H3" />
              <ToolbarSep />
              <ToolbarBtn icon={Bold} title="Bold" />
              <ToolbarBtn icon={Italic} title="Italic" />
              <ToolbarBtn icon={Strikethrough} title="Strike" />
              <ToolbarSep />
              <ToolbarBtn icon={List} title="Bullet" />
              <ToolbarBtn icon={ListOrdered} title="Ordered" />
              <ToolbarBtn icon={Quote} title="Quote" />
              <ToolbarBtn icon={Code} title="Code" />
              <ToolbarSep />
              <ToolbarBtn icon={LinkIcon} title="Link" />
              <ToolbarBtn icon={ImageIcon} title="Image" />
              <ToolbarBtn icon={TableIcon} title="Table" />
              <ToolbarBtn icon={Minus} title="HR" />
              <ToolbarSep />
              <ToolbarBtn icon={ListChecks} title="Steps" />
              <ToolbarBtn icon={AlertTriangle} title="Callout ▾" tone="amber" />
              <ToolbarBtn icon={HardHat} title="PPE" tone="orange" />
              <ToolbarBtn icon={ImageIcon} title="Diagram" tone="purple" />
              <ToolbarSep />
              <ToolbarBtn icon={Play} title="Launch log" tone="sky" />
              <ToolbarBtn icon={Hash} title="Linked asset" tone="emerald" />
            </div>
            {/* Canvas */}
            <div className="space-y-3 rounded-b-md border bg-background px-5 py-4 text-sm leading-relaxed">
              <div className="text-base font-semibold">Daily handover</div>
              <p className="text-muted-foreground">
                Outgoing operator submits any quality samples to the lab fridge and locks
                out their console session.
              </p>
              <div className="my-2 inline-flex items-center gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800">
                <Play className="h-3.5 w-3.5 fill-sky-700 text-sky-700" />
                <span className="uppercase tracking-wide opacity-70">Launch log</span>
                <span className="font-semibold">Quality check — Mixer</span>
              </div>
              <p className="text-muted-foreground">
                Continue in the next paragraph.
              </p>
            </div>
          </div>
          <div className="min-w-0 rounded-md border bg-background p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Metadata
            </div>
            <div className="space-y-2 text-xs">
              <FormRow label="Title" value="Daily handover SOP" />
              <FormRow label="Type" value="SOP" />
              <FormRow label="Owner" value="Maya Chen" />
              <FormRow label="Naming code" value="HOL-OPS-SOP-0001" mono />
              <FormRow label="Tags" value="handover · shift · operations" />
              <FormRow label="Linked assets" value="6 selected" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ToolbarBtn({
  icon: Icon,
  title,
  tone,
}: {
  icon: typeof Bold
  title: string
  tone?: "amber" | "orange" | "purple" | "sky" | "emerald"
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600"
      : tone === "orange"
        ? "text-orange-600"
        : tone === "purple"
          ? "text-purple-600"
          : tone === "sky"
            ? "text-sky-600"
            : tone === "emerald"
              ? "text-emerald-600"
              : "text-foreground"
  return (
    <button
      type="button"
      title={title}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Icon className={cn("h-3.5 w-3.5", toneClass)} />
    </button>
  )
}

function ToolbarSep() {
  return <div className="mx-0.5 h-5 w-px bg-border" />
}

function FormRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-xs", mono && "font-mono")}>{value}</div>
    </div>
  )
}

// --- 5. Root cause ---------------------------------------------------------

function RootCauseSection() {
  return (
    <Section
      title="Root-cause walk-through"
      description="What's responsible for each symptom, traced to file:line."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <RootCauseRow
            symptom="Two stacked sticky bars eat vertical canvas"
            cause={
              <>
                Page header at <code>DocumentEditPage.tsx:184</code> uses{" "}
                <code>h-14 border-b</code> but is not actually sticky — it scrolls away.
                The toolbar at <code>DocumentEditor.tsx:590</code> is{" "}
                <code>sticky top-0 z-10</code>. Result: when the user scrolls into the
                document, the page-level title context (status, naming code, Save buttons)
                disappears while the toolbar stays. Operators lose &quot;where am I&quot;
                cues.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom="320px metadata panel always consumes the right column"
            cause={
              <>
                <code>DocumentEditPage.tsx:231</code> uses{" "}
                <code>lg:grid-cols-[minmax(0,1fr)_320px]</code> with no toggle. The panel
                is sticky inside the column. There's no mechanism to collapse it for
                authoring-heavy work. On 1366px laptops the canvas is ~900px max.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom="Safety/PPE has one button each, with site-critical content buried"
            cause={
              <>
                Callouts are five kinds (warning/caution/danger/notice/tip) accessed via a
                single dropdown at <code>DocumentEditor.tsx:707</code>. PPE is a dialog
                picker. There is no surface for Lockout/Tagout, Hot-work, Confined-space,
                Authorized-only, Working-at-heights, Permit-required. Operators authoring
                a hazardous-energy SOP have to reach for a generic &quot;Danger&quot;
                callout and type the rest as prose, which loses structure for RAG and the
                read view.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom="Asset picker only shows code and name"
            cause={
              <>
                <code>AssetMultiSelect.tsx:115</code> renders one row per asset with{" "}
                <code>code</code> and <code>name</code>. No location, no floorplan, no
                recently-viewed, no QR scan. The combobox uses cmdk fuzzy search but only
                against <code>{`${"`${a.code} ${a.name}`"}`}</code>. The rich asset model
                (description, level, floorplan, pin, linked logs) is invisible at link
                time.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom='"Launch log" pill does nothing on click'
            cause={
              <>
                <code>LaunchLogNodeView</code> at <code>LaunchLogBlock.tsx:40</code>{" "}
                renders a static pill with no click handler. The read view inherits the
                same. Operators in the field cannot use the pill to actually start the log
                capture — the LOGS module owns capture flow, and DOCS only references the
                log id. The cross-module handoff is implicit in the icon but unsupported
                in the UI.
              </>
            }
            confidence="medium"
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function RootCauseRow({
  symptom,
  cause,
  confidence,
}: {
  symptom: string
  cause: React.ReactNode
  confidence: "high" | "medium" | "low"
}) {
  const tone =
    confidence === "high"
      ? "default"
      : confidence === "medium"
        ? "secondary"
        : "outline"
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">{symptom}</div>
        <Badge variant={tone} className="shrink-0 text-[10px]">
          {confidence} confidence
        </Badge>
      </div>
      <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{cause}</div>
    </div>
  )
}

// --- 6. Edge cases ---------------------------------------------------------

interface EdgeRow {
  scenario: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
  shipped: boolean
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Author hides the metadata panel mid-edit",
    current: "Not possible.",
    expected: "Toggle in the page strip; persists in localStorage; auto-reopens on validation error.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Author scrolls 1000px down a long SOP",
    current: "Page header gone, only toolbar remains.",
    expected: "Page strip stays sticky (h-10), toolbar docks at top:40 — both visible while scrolling.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Author needs to insert a Lockout/Tagout callout",
    current: "Generic 'Danger' callout with prose.",
    expected: "Safety palette includes loto, hotwork, electrical, heights, confined, authorised, permit, cryo as typed callouts.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Author picks PPE for a high-temp procedure",
    current: "Dialog picker with 8 items.",
    expected: "Inline popover anchored to the PPE toolbar button — one-click toggle per pictogram.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Author searches for the press in Hall B",
    current: "Flat cmdk list; no location grouping.",
    expected: "Grouped by location. Recently-linked at top. Pin badge + location chip per row.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Author tests what 'Launch log' does for the operator",
    current: "Static pill. No click action.",
    expected: "Editor click → LaunchLogModal in 'edit' mode (preview + Edit reference).",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Read-view operator clicks the Launch log pill",
    current: "No click handler.",
    expected: "Read-view click → LaunchLogModal in 'read' mode → Open-in-Oppr-LOGS CTA (toast in showcase).",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Author types '/' mid-paragraph",
    current: "Slash menu only opens at start of empty block.",
    expected: "Same. Left-margin '+' affordance for slash discoverability is deferred — placeholder hint covers the basic case.",
    severity: "low",
    shipped: false,
  },
  {
    scenario: "Author has a 1280px laptop screen",
    current: "Toolbar wraps to 2 rows; metadata forced hidden by breakpoint.",
    expected: "10-button always-visible row + 'More' overflow → fits one line at 1280px. Metadata toggle persists user preference.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Author needs both linked-asset and launch-log on the same step",
    current: "Two separate dialog round-trips.",
    expected: "Same — combined slash entry deferred. Both buttons remain on the always-visible row so the round-trips are short.",
    severity: "low",
    shipped: false,
  },
  {
    scenario: "Author drags a Diagram preset into a Steps list",
    current: "Diagram is atom + draggable; supports stepItem children.",
    expected: "Same — Diagram moved into 'More' overflow but remains insert-by-click and drag-supported.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "Author accidentally clears all PPE on an existing block",
    current: "Empty PPE renders as 'Required PPE: (none configured — edit to pick)'.",
    expected: "Same — block-anchored quick-pick popover deferred. Re-edit still goes via the dialog/slash menu for now.",
    severity: "low",
    shipped: false,
  },
]

function EdgeCasesSection() {
  const shippedCount = EDGE_CASES.filter((e) => e.shipped).length
  return (
    <Section
      title="Edge cases"
      description={`${shippedCount} of ${EDGE_CASES.length} scenarios are covered by the shipped change. The rest are tracked as deferred follow-ups.`}
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Scenario</TableHead>
                <TableHead className="w-[26%]">Current</TableHead>
                <TableHead className="w-[36%]">Expected / Shipped behaviour</TableHead>
                <TableHead className="w-[8%] text-right">Sev.</TableHead>
                <TableHead className="w-[8%] text-right">Ship.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((row) => (
                <TableRow key={row.scenario}>
                  <TableCell className="align-top text-xs font-medium">{row.scenario}</TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{row.current}</TableCell>
                  <TableCell className="align-top text-xs">{row.expected}</TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant={
                        row.severity === "high"
                          ? "destructive"
                          : row.severity === "med"
                            ? "default"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {row.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {row.shipped ? (
                      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                        <CheckCircle2 className="h-2.5 w-2.5" />
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

// --- Results section -------------------------------------------------------

interface ResultRow {
  title: string
  files: string[]
  before: string
  after: string
}

const RESULTS: ResultRow[] = [
  {
    title: "Slim sticky page strip + togglable metadata panel",
    files: [
      "src/pages/desktop/DocumentEditPage.tsx",
      "src/components/docs/DocumentEditor.tsx",
    ],
    before:
      "h-14 page header (not sticky) + h-12 sticky toolbar = ~120px of stacked chrome that disappeared on scroll. Metadata column was 320px and always visible.",
    after:
      "h-10 sticky strip (title · type · status · code · v · Save controls). Toolbar docks at top:40 via toolbarTopOffset. Metadata toggle persisted in localStorage; hidden state auto-reopens on validation error and shows a red dot when errors exist.",
  },
  {
    title: "Lean toolbar + 'More' overflow",
    files: ["src/components/docs/DocumentEditor.tsx"],
    before:
      "21 buttons + 1 dropdown wrapping to 2-3 rows on 1280px screens, no grouping label.",
    after:
      "10 always-visible: Heading dropdown · Bold · Italic · Bullet · Link · Table · Safety · PPE · Asset · Launch log. Strike, ordered list, quote, code, image, HR, steps, diagram, PPE-dialog moved into a 'More' overflow.",
  },
  {
    title: "Safety palette + extended callout kinds",
    files: [
      "src/components/docs/CalloutBlock.tsx",
      "src/components/docs/SafetyPalette.tsx (new)",
      "src/components/docs/DocumentEditor.tsx",
    ],
    before:
      "5 callout kinds (warning, caution, danger, notice, tip) behind a single AlertTriangle dropdown. Site-critical content (LOTO, hot work, etc.) was free-text inside a generic Danger callout.",
    after:
      "13 callout kinds across 4 tone families (danger, warning, notice, tip). Safety palette popover renders a 4×4 grid of typed callouts, each with a distinct lucide pictogram. Read-view inherits the new kinds via the shared CalloutNode.",
  },
  {
    title: "PPE inline mini-palette",
    files: [
      "src/components/docs/PpeBlock.tsx",
      "src/components/docs/DocumentEditor.tsx",
    ],
    before:
      "Single Dialog picker — round-trip to insert PPE.",
    after:
      "PpeQuickPalette popover anchored to the toolbar button. Toggle pictograms inline; Insert PPE row commits. The legacy PpePicker dialog stays available via the slash menu and the 'More' overflow for editing existing blocks.",
  },
  {
    title: "Asset picker upgrade — grouped + recently-linked",
    files: [
      "src/components/docs/AssetMultiSelect.tsx",
      "src/components/docs/LinkedAssetBlock.tsx",
      "src/components/docs/useRecentlyLinkedAssets.ts (new)",
    ],
    before:
      "Flat cmdk list rendered with code + name only. No location, no recently-used, no pin reference.",
    after:
      "Both pickers share the localStorage-backed useRecentlyLinkedAssets hook. Two groups in the list: 'Recently linked' (last 5) and per-location groups. Each row shows pin badge + code + name + location chip. Search matches code, name, OR location.",
  },
  {
    title: "Launch-log actionable in editor + read view",
    files: [
      "src/components/docs/LaunchLogBlock.tsx",
      "src/components/docs/TiptapReadOnly.tsx",
    ],
    before:
      "Static pill, no click action. Operator reading the published SOP couldn't hand off.",
    after:
      "LaunchLogNodeView wraps the pill in a button. Click opens LaunchLogModal — 'edit' mode shows a preview with an Edit-reference action; 'read' mode (TiptapReadOnly) shows a primary 'Open in Oppr LOGS' CTA that fires a sonner toast in the showcase. DOCS never writes capture state.",
  },
]

function ResultsSection() {
  return (
    <Section
      title="Results — what shipped"
      description="One row per plan item. Each line is independently verifiable; if any of them needs to be reverted, the others stand on their own."
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

// --- 7. Self-grilling ------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Honest counter-hypotheses to push back on before any code change."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="More buttons is better, right?"
            a="No — and this is the most important counter-hypothesis. Operators who write SOPs are not power users; they're process engineers and supervisors. Putting 30+ buttons on the toolbar adds visual noise and decision fatigue. The proposal threads this needle by promoting the 8 highest-frequency actions (heading, list, link, callout, PPE, asset, log, table) to the always-visible row, and pushing safety subtypes into a single Safety palette button that opens an organised popover. If the user says 'I want more buttons visible' I will push back: it is faster to type a name into a unified slash menu than to scan 30 icons."
          />
          <Grill
            q="Is a sticky toolbar enough, or do we need a 'collapse on scroll' header?"
            a="A naive sticky toolbar makes the problem worse — two stacked sticky bars eat 120px. The right move is to collapse the page header into a 32px strip on scroll (status badge + scope-aware Save dropdown), then have the toolbar dock immediately under it. Combined height: ~70px. If we ship sticky-toolbar without collapsing the page header, we'll get a screenshot back showing the same problem."
          />
          <Grill
            q="What would falsify 'operators want PPE/safety buttons inline'?"
            a="If we ship the Safety palette and the seed SOPs (HOL-OPS-SOP-0001..0005) generate fewer Safety blocks per doc than the current ad-hoc Danger callouts, the palette is too friction-y. Also: if the cmdk slash menu sees a spike in '/safety' searches that don't convert to inserts, the palette buttons may be too noisy. Both are measurable later — for now, the operator-side argument (procedural standardisation, RAG retrievability of structured Safety blocks vs free-text) is strong enough to ship."
          />
          <Grill
            q="Does 'execute log' inside DOCS overstep the module boundary?"
            a="Yes, if DOCS pretends to capture data. No, if it's strictly a deep-link affordance. The proposal scopes 'execute' to: (a) editor preview opens the existing LogReferenceModal so the author can see what an operator will see, and (b) read-view click on the pill opens the same modal with a 'Open in Oppr LOGS' CTA that, in a real deployment, deep-links to the LOGS module. DOCS still owns no capture state. If we ship anything that writes to the LOGS database from inside DOCS, that's a violation."
          />
          <Grill
            q="The metadata panel is sticky and used during the whole edit. Is hiding it the right move?"
            a="Yes for ~70% of authoring time (writing prose, restructuring sections). No for the 30% (initial naming, tag editing, asset relinking). The toggle has to surface validation errors visibly when the panel is hidden — otherwise the author hits Publish and gets a toast they can't act on. Implementation: when hidden, the metadata-error count badges next to a 'Show metadata' button in the page header."
          />
          <Grill
            q="Is the asset-picker upgrade overkill given listAssets is bounded?"
            a="The seed has 6 assets. A real customer site would have 50–500. Designing the picker for 6 means we'll rebuild it later. The proposed structure (group by floorplan/location, recently-linked top, full description preview, QR scan on mobile) scales. If the user pushes back saying 'we have 6 assets, ship the simple version', the simple version is: keep AssetMultiSelect as-is and add only floorplan grouping + recently-linked. That's a 1-day diff vs a 3-day diff."
          />
          <Grill
            q="Could a slash-only model replace the toolbar entirely?"
            a="Tested mentally: yes for advanced authors (engineers used to Notion), no for ops managers writing their first SOP. The slash menu is also positioned awkwardly today (only at start of empty block) which limits discoverability. The pragmatic answer is to keep a lean toolbar (8 always-visible) AND make the slash menu more discoverable (left-margin '+' hover affordance like Notion). Don't pick one — they serve different mental models."
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

// --- 8. Proposed UX --------------------------------------------------------

function ProposedUxSection() {
  return (
    <Section
      title="Proposed UX (rendered, not figma)"
      description="Five surfaces. Each is a real React mock built from shadcn primitives so the diff is small."
    >
      <Tabs defaultValue="layout">
        <TabsList>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="safety">Safety palette</TabsTrigger>
          <TabsTrigger value="ppe">PPE quick-row</TabsTrigger>
          <TabsTrigger value="asset">Asset picker</TabsTrigger>
          <TabsTrigger value="log">Launch-log behaviour</TabsTrigger>
        </TabsList>
        <TabsContent value="layout">
          <ProposedLayoutMock />
        </TabsContent>
        <TabsContent value="safety">
          <ProposedSafetyPalette />
        </TabsContent>
        <TabsContent value="ppe">
          <ProposedPpeRow />
        </TabsContent>
        <TabsContent value="asset">
          <ProposedAssetPicker />
        </TabsContent>
        <TabsContent value="log">
          <ProposedLogBehaviour />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function ProposedLayoutMock() {
  const [metaOpen, setMetaOpen] = useState(true)
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm">Floating header strip + collapsible metadata</CardTitle>
        <CardDescription>
          Page header collapses to a 32px strip. Toolbar docks right under it. Metadata
          panel is togglable from the strip. Try the toggle below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-hidden rounded-md border bg-muted/20">
          {/* Sticky strip */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-3 py-1.5 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-semibold truncate">Daily handover SOP</span>
              <Badge variant="outline" className="text-[10px]">SOP</Badge>
              <Badge variant="secondary" className="text-[10px]">draft</Badge>
              <span className="font-mono text-[10px] text-muted-foreground">
                HOL-OPS-SOP-0001 · v1
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 gap-1 text-[11px]"
                onClick={() => setMetaOpen((o) => !o)}
              >
                {metaOpen ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {metaOpen ? "Hide metadata" : "Show metadata"}
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-[11px]">Save</Button>
              <Button size="sm" className="h-6 text-[11px]">Publish ▾</Button>
            </div>
          </div>
          {/* Toolbar — lean, always-visible 8 + overflow */}
          <div className="flex items-center gap-0.5 border-b bg-background px-3 py-1">
            <ToolbarBtn icon={Heading2} title="Heading" />
            <ToolbarBtn icon={List} title="List" />
            <ToolbarBtn icon={LinkIcon} title="Link" />
            <ToolbarBtn icon={TableIcon} title="Table" />
            <ToolbarSep />
            <ToolbarBtn icon={ShieldAlert} title="Safety palette" tone="amber" />
            <ToolbarBtn icon={HardHat} title="PPE quick-row" tone="orange" />
            <ToolbarBtn icon={Hash} title="Asset link" tone="emerald" />
            <ToolbarBtn icon={Play} title="Launch log" tone="sky" />
            <ToolbarSep />
            <Button size="sm" variant="ghost" className="h-6 text-[11px]">
              More <ChevronDown className="ml-0.5 h-3 w-3" />
            </Button>
          </div>
          {/* Body */}
          <div className={cn("grid gap-3 p-3", metaOpen ? "grid-cols-[1fr_220px]" : "grid-cols-1")}>
            <div className="space-y-2 rounded-md border bg-background px-4 py-3 text-sm">
              <div className="text-base font-semibold">Daily handover</div>
              <p className="text-muted-foreground">
                Outgoing operator submits any quality samples to the lab fridge and locks
                out their console session.
              </p>
              <div className="my-2 inline-flex items-center gap-2 rounded-md border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                <Play className="h-3 w-3 fill-sky-700 text-sky-700" />
                <span>Quality check — Mixer</span>
              </div>
            </div>
            {metaOpen && (
              <div className="rounded-md border bg-background p-2 text-xs">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Metadata
                </div>
                <FormRow label="Type" value="SOP" />
                <FormRow label="Owner" value="Maya Chen" />
                <FormRow label="Tags" value="3 tags" />
                <FormRow label="Linked assets" value="6 selected" />
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Strip + toolbar = ~64px sticky. Metadata toggle persists in localStorage.
          Validation errors surface a red dot on the &quot;Show metadata&quot; button when
          hidden.
        </p>
      </CardContent>
    </Card>
  )
}

interface SafetyEntry {
  key: string
  label: string
  icon: typeof ShieldAlert
  tone: string
  description: string
}

const SAFETY_ENTRIES: SafetyEntry[] = [
  { key: "danger", label: "Danger", icon: AlertTriangle, tone: "border-red-500/50 bg-red-50 text-red-900", description: "Severe consequence if step is skipped." },
  { key: "warning", label: "Warning", icon: AlertTriangle, tone: "border-amber-500/50 bg-amber-50 text-amber-900", description: "Hazardous if performed incorrectly." },
  { key: "caution", label: "Caution", icon: CircleAlert, tone: "border-orange-500/50 bg-orange-50 text-orange-900", description: "Possible damage if not careful." },
  { key: "loto", label: "Lockout / Tagout", icon: Lock, tone: "border-yellow-500/50 bg-yellow-50 text-yellow-900", description: "Hazardous-energy isolation required." },
  { key: "hotwork", label: "Hot work", icon: Flame, tone: "border-red-500/50 bg-red-50 text-red-900", description: "Open flame, sparks, welding, grinding." },
  { key: "confined", label: "Confined space", icon: Pyramid, tone: "border-purple-500/50 bg-purple-50 text-purple-900", description: "Limited entry/exit, atmospheric hazard." },
  { key: "heights", label: "Working at heights", icon: Mountain, tone: "border-cyan-500/50 bg-cyan-50 text-cyan-900", description: "Fall hazard above 1.8m." },
  { key: "authorised", label: "Authorised only", icon: ShieldCheck, tone: "border-blue-500/50 bg-blue-50 text-blue-900", description: "Trained and certified personnel only." },
  { key: "permit", label: "Permit required", icon: Tag, tone: "border-indigo-500/50 bg-indigo-50 text-indigo-900", description: "Written permit must be issued first." },
  { key: "electrical", label: "Electrical", icon: PlugZap, tone: "border-yellow-500/50 bg-yellow-50 text-yellow-900", description: "Live electrical hazard." },
  { key: "cryo", label: "Cryogenic / cold", icon: Snowflake, tone: "border-sky-500/50 bg-sky-50 text-sky-900", description: "Cryogenic burn or thermal shock risk." },
  { key: "tip", label: "Tip", icon: Sparkles, tone: "border-emerald-500/50 bg-emerald-50 text-emerald-900", description: "Best-practice note (non-hazardous)." },
]

function ProposedSafetyPalette() {
  const [active, setActive] = useState<string>("loto")
  const entry = SAFETY_ENTRIES.find((e) => e.key === active) ?? SAFETY_ENTRIES[0]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Safety palette popover</CardTitle>
        <CardDescription>
          One toolbar button opens this 4×3 grid. Each cell inserts a typed Callout block.
          Pictogram + name make the intent visible without reading the full label. The
          live preview at the bottom shows what gets inserted into the document.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border bg-background p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="h-3 w-3" />
            Safety
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {SAFETY_ENTRIES.map((s) => {
              const Icon = s.icon
              const isActive = s.key === active
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors",
                    isActive
                      ? "border-primary/60 bg-primary/5"
                      : "border-border bg-background hover:bg-muted/40",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <Separator />
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Inserts as
          </div>
          <div className={cn("flex items-start gap-2 rounded-md border-l-4 px-3 py-2 text-sm", entry.tone)}>
            <entry.icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold">{entry.label}</div>
              <div className="text-xs opacity-80">{entry.description}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PPE_ENTRIES = [
  { key: "hardhat", label: "Hard hat", icon: HardHat },
  { key: "glasses", label: "Glasses", icon: ShieldCheck },
  { key: "gloves", label: "Gloves", icon: ShieldCheck },
  { key: "boots", label: "Boots", icon: ShieldCheck },
  { key: "hi-vis", label: "Hi-vis", icon: Triangle },
  { key: "ear", label: "Ear pro", icon: HelpCircle },
  { key: "mask", label: "Respirator", icon: HelpCircle },
  { key: "dust", label: "Dust mask", icon: HelpCircle },
] as const

function ProposedPpeRow() {
  const [picked, setPicked] = useState<string[]>(["hardhat", "glasses", "boots"])
  function toggle(key: string) {
    setPicked((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]))
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">PPE inline mini-palette</CardTitle>
        <CardDescription>
          Replaces the dialog. Click a pictogram to toggle it into the block. A live row
          below previews the rendered PPE block exactly as it will appear in the SOP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-background p-2">
          <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            PPE
          </span>
          {PPE_ENTRIES.map((p) => {
            const isOn = picked.includes(p.key)
            const Icon = p.icon
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => toggle(p.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                  isOn
                    ? "border-orange-400 bg-orange-100 text-orange-900 dark:bg-orange-500/15 dark:text-orange-200"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3 w-3" />
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 dark:border-orange-500/40 dark:bg-orange-500/10">
          <span className="mr-2 text-[10px] font-semibold uppercase tracking-wide text-orange-900 dark:text-orange-200">
            Required PPE
          </span>
          {picked.length === 0 ? (
            <span className="text-xs italic text-orange-900/60">
              (none selected — click pictograms above)
            </span>
          ) : (
            <span className="inline-flex flex-wrap gap-1">
              {picked.map((k) => {
                const p = PPE_ENTRIES.find((e) => e.key === k)
                if (!p) return null
                const Icon = p.icon
                return (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-white px-2 py-0.5 text-[11px] font-medium text-orange-900"
                  >
                    <Icon className="h-3 w-3" />
                    {p.label}
                  </span>
                )
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AssetMockRow {
  code: string
  name: string
  location: string
  pin: number
  level: number
  recent?: boolean
}

const ASSET_MOCKS: AssetMockRow[] = [
  { code: "FCK-102", name: "Feedstock Mixer", location: "Hall A — Line 2", pin: 2, level: 1, recent: true },
  { code: "FCK-103", name: "Grinding Mill", location: "Hall B — Line 3", pin: 3, level: 1, recent: true },
  { code: "RMR-101", name: "Raw Materials Reception Bay", location: "Yard — North", pin: 1, level: 1 },
  { code: "FRT-201", name: "Briquette Hydraulic Press", location: "Hall B — Line 4", pin: 4, level: 1 },
  { code: "FRT-202", name: "Pre-Kiln Briquette Inspection", location: "Hall C — Line 4", pin: 5, level: 1 },
  { code: "STR-301", name: "Kiln Charging & Stacking", location: "Hall C — Kiln Bay", pin: 6, level: 1 },
]

function ProposedAssetPicker() {
  const [query, setQuery] = useState("")
  const filtered = ASSET_MOCKS.filter((a) => {
    const q = query.toLowerCase()
    return !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)
  })
  const recent = filtered.filter((a) => a.recent)
  const others = filtered.filter((a) => !a.recent)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Asset picker — grouped, scope-rich</CardTitle>
        <CardDescription>
          Replaces the flat cmdk list. Adds recently-linked, location grouping, pin badge,
          one-line description, and a QR scan affordance for mobile authoring.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-background">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets by code, name, or location…"
              className="h-7 border-none p-0 text-sm shadow-none focus-visible:ring-0"
            />
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]">
              <QrCode className="h-3 w-3" />
              Scan
            </Button>
          </div>
          <div className="max-h-72 overflow-auto p-2">
            {recent.length > 0 && (
              <PickerGroup label="Recently linked" rows={recent} />
            )}
            {others.length > 0 && (
              <PickerGroup label="All assets · Pigment Calcination" rows={others} />
            )}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No assets match &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PickerGroup({ label, rows }: { label: string; rows: AssetMockRow[] }) {
  return (
    <div className="mb-2">
      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="space-y-0.5">
        {rows.map((a) => (
          <button
            key={a.code}
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent/50"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              {a.pin}
            </span>
            <Factory className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-xs">{a.code}</span>
            <span className="flex-1 truncate text-xs">{a.name}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground">{a.location}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProposedLogBehaviour() {
  const [mode, setMode] = useState<"editor" | "read">("editor")
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Launch-log: from static pill to actionable handoff</CardTitle>
        <CardDescription>
          Editor preview = author sees what the operator will see. Read-view click = opens
          the LogReferenceModal that already exists, with a deep-link CTA into Oppr LOGS.
          DOCS never writes to LOGS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={mode === "editor" ? "default" : "outline"}
            onClick={() => setMode("editor")}
            className="h-7 text-[11px]"
          >
            Editor preview
          </Button>
          <Button
            size="sm"
            variant={mode === "read" ? "default" : "outline"}
            onClick={() => setMode("read")}
            className="h-7 text-[11px]"
          >
            Operator read view
          </Button>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-100"
            >
              <Play className="h-3.5 w-3.5 fill-sky-700 text-sky-700" />
              <span className="text-[10px] uppercase tracking-wide opacity-70">
                Launch log
              </span>
              <span className="font-semibold">Quality check — Mixer</span>
            </button>
            <Badge variant="outline" className="text-[10px]">
              {mode === "editor" ? "click → preview modal" : "click → handoff modal"}
            </Badge>
          </div>
          <Separator className="my-2" />
          {mode === "editor" ? (
            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <div className="mb-1.5 font-semibold">Preview · what the operator sees</div>
              <p className="text-muted-foreground">
                You're about to start <strong>Quality check — Mixer</strong>. This log
                belongs to the <em>quality</em> module. Capture happens in Oppr LOGS.
              </p>
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled>
                  Edit log reference
                </Button>
                <Button size="sm" className="h-6 text-[11px]" disabled>
                  Close preview
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <div className="mb-1.5 font-semibold">Handoff · what the operator clicks</div>
              <p className="text-muted-foreground">
                Tapping <strong>Launch log</strong> opens the existing{" "}
                <code>LogReferenceModal</code>. The CTA &quot;Open in Oppr LOGS&quot;{" "}
                {mode === "read" && "is the deep-link affordance"} that hands off to the
                LOGS module. DOCS does not capture anything.
              </p>
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled>
                  Cancel
                </Button>
                <Button size="sm" className="h-6 gap-1 text-[11px]" disabled>
                  <Play className="h-3 w-3" />
                  Open in Oppr LOGS
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// --- 9. Implementation plan -----------------------------------------------

interface PlanStep {
  label: string
  files: string[]
  detail: string
  status: "shipped" | "deferred"
}

const PLAN: PlanStep[] = [
  {
    label: "Reorder layout: sticky strip + docked toolbar + togglable metadata",
    files: [
      "src/pages/desktop/DocumentEditPage.tsx",
      "src/components/docs/DocumentEditor.tsx",
    ],
    detail:
      "Page header sticky h-10 with all controls; DocumentEditor toolbar uses inline-style top from a new toolbarTopOffset prop (40 on EditPage). Metadata toggle button with localStorage persistence; auto-reopens on validation error; red-dot badge while hidden. DocumentNewPage left as-is (already wraps editor in a Card so the docking offset doesn't apply).",
    status: "shipped",
  },
  {
    label: "Lean toolbar with overflow",
    files: ["src/components/docs/DocumentEditor.tsx"],
    detail:
      "10 always-visible (Heading dropdown, Bold, Italic, Bullet, Link, Table, Safety, PPE, Asset, Launch log) + 'More' overflow (Strike, ordered list, quote, code, image, HR, steps, diagram, PPE dialog). Slash-menu '+' affordance deferred — placeholder hint covers basic discoverability.",
    status: "shipped",
  },
  {
    label: "Safety palette as a typed callout subtype",
    files: [
      "src/components/docs/CalloutBlock.tsx",
      "src/components/docs/SafetyPalette.tsx (new)",
      "src/components/docs/DocumentEditor.tsx",
    ],
    detail:
      "CalloutKind extended with loto, hotwork, confined, heights, authorised, permit, electrical, cryo. CALLOUT_META map exported. SafetyPalette popover renders the 4×4 grid + tone ring. CalloutNode shared between editor and read view, so the new kinds round-trip automatically.",
    status: "shipped",
  },
  {
    label: "PPE inline mini-palette",
    files: ["src/components/docs/PpeBlock.tsx", "src/components/docs/DocumentEditor.tsx"],
    detail:
      "PpeQuickPalette popover with toggle pictograms + Insert button. Toolbar button uses it by default; PpePicker dialog still mounted for slash-menu deep entry and the 'More' overflow.",
    status: "shipped",
  },
  {
    label: "Asset picker upgrade — grouped + recently-linked",
    files: [
      "src/components/docs/AssetMultiSelect.tsx",
      "src/components/docs/LinkedAssetBlock.tsx",
      "src/components/docs/useRecentlyLinkedAssets.ts (new)",
    ],
    detail:
      "Shared useRecentlyLinkedAssets hook (localStorage). Both pickers show a 'Recently linked' group + per-location groups. Each row has pin badge + code + name + location chip. Search matches code/name/location. QR scan deferred — both surfaces are desktop-only in this showcase.",
    status: "shipped",
  },
  {
    label: "Launch-log: actionable in editor preview + read view",
    files: [
      "src/components/docs/LaunchLogBlock.tsx",
      "src/components/docs/TiptapReadOnly.tsx",
    ],
    detail:
      "LaunchLogNodeView wraps the pill in a button → opens LaunchLogModal. Mode = 'edit' | 'read' driven by editor.isEditable. Edit mode preview + Edit-reference; read mode handoff with Open-in-Oppr-LOGS CTA (sonner toast in showcase).",
    status: "shipped",
  },
  {
    label: "Verify",
    files: [],
    detail: "npx tsc -b → exit 0. npx vite build → exit 0 (only the pre-existing PdfViewer / TiptapReadOnly chunking warnings remain).",
    status: "shipped",
  },
  {
    label: "Slash-menu '+' affordance (deferred)",
    files: ["src/components/docs/DocumentEditor.tsx"],
    detail:
      "Notion-style left-margin '+' on empty paragraphs would require selection-tracking + coordsAtPos plumbing. Deferred — current placeholder ('Continue writing… type / for blocks') already hints at the slash menu.",
    status: "deferred",
  },
  {
    label: "Combined slash entry 'Step + asset + log' (deferred)",
    files: ["src/components/docs/DocumentEditor.tsx"],
    detail:
      "Inserts a Steps block pre-wired with linked-asset and launch-log placeholders. Deferred — both buttons are on the always-visible row, so the round-trip cost is now low.",
    status: "deferred",
  },
  {
    label: "Block-anchored PPE re-edit popover (deferred)",
    files: ["src/components/docs/PpeBlock.tsx"],
    detail:
      "Click on existing PPE block to re-open the quick palette with current selection pre-loaded. Deferred — re-edit currently goes via the dialog.",
    status: "deferred",
  },
]

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan"
      description="Plan as it stood before implementation, annotated with shipped vs deferred. The 6 core items shipped; 3 small follow-ups are tracked for a second pass."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {PLAN.map((step, i) => (
            <div key={i} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    step.status === "shipped"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{step.label}</div>
                    {step.status === "shipped" ? (
                      <Badge className="shrink-0 gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        shipped
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        deferred
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{step.detail}</div>
                  {step.files.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {step.files.map((f) => (
                        <code
                          key={f}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          {f}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// --- 10. Decisions ---------------------------------------------------------

interface DecisionRow {
  question: string
  decision: string
}

const DECISIONS: DecisionRow[] = [
  {
    question: "Toolbar density — 8 always-visible or 12?",
    decision:
      "Settled on 10 always-visible (Heading dropdown · Bold · Italic · Bullet · Link · Table · Safety · PPE · Asset · Launch log). Bold/Italic kept visible because prose authoring is half the job; everything else lives in 'More'.",
  },
  {
    question: "Safety palette colours — 7 hues or 3?",
    decision:
      "4 tone families (danger · warning · notice · tip) + 13 distinct pictograms. The icon does the per-type lifting; the tone scans for severity at a glance.",
  },
  {
    question: "Metadata default state — hidden or visible?",
    decision:
      "Visible by default. Auto-reopens on validation error and shows a red dot badge when hidden + errors exist, so a hidden panel can never silently block a Publish.",
  },
  {
    question: "Launch-log read-view CTA semantics",
    decision:
      "LaunchLogModal in mode='read' shows a primary 'Open in Oppr LOGS' button that fires a sonner toast in this showcase ('Oppr LOGS is a separate module…'). DOCS captures nothing.",
  },
  {
    question: "Asset picker QR scan — desktop or mobile-only?",
    decision:
      "Deferred. Both AssetMultiSelect and LinkedAssetPicker are mounted in desktop pages; QR scan is a no-op there. When mobile authoring lands, add the scan button to the picker shape and reuse the cmdk grouping.",
  },
  {
    question: "Slash-menu '+' affordance",
    decision:
      "Deferred. Existing placeholder text ('Continue writing… type / for blocks') hints at the slash-menu. The Notion-style left-margin '+' is a separate UX project — left for a follow-up so this PR stays scoped.",
  },
]

function DecisionsSection() {
  return (
    <Section
      title="Decisions made"
      description="Open questions from the original plan, recorded with the call that was made before implementation."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          {DECISIONS.map((d) => (
            <div key={d.question} className="flex items-start gap-2">
              <ListChecksIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="font-medium">{d.question}</div>
                <div className="mt-0.5 text-muted-foreground">{d.decision}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Alert className="border-emerald-500/30 bg-emerald-500/5">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Closed</AlertTitle>
        <AlertDescription>
          Six core plan items shipped. Three small follow-ups remain on the deferred list
          (slash-menu '+' affordance, combined Step+asset+log slash entry, block-anchored
          PPE re-edit). Each will be picked up as a small follow-up PR.
        </AlertDescription>
      </Alert>
    </Section>
  )
}
