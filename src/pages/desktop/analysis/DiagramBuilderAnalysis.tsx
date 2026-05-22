// Diagram builder — design analysis (2026-05-22).
//
// We shipped a "coming soon" placeholder inside the DiagramPicker. This page
// is the spec for the real tool: a simple, model-first diagram builder that
// emits clean themed SVG and round-trips through the existing DiagramNode.
// Proposal — awaiting decisions before any code lands.

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  Diamond,
  GitBranch,
  Layers,
  MousePointer2,
  PenTool,
  Shapes,
  ShieldCheck,
  Sparkles,
  Square,
  Workflow,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function DiagramBuilderAnalysis() {
  return (
    <AnalysisLayout
      title="Diagram builder — simple, model-first, SVG-native"
      subtitle="We shipped a placeholder in the diagram picker. This is the spec for the real tool: a constrained flowchart builder whose source of truth is a structured model, which renders to clean themed SVG and round-trips through the existing DiagramNode. Leads with the one decision everything else falls out of — store the model or store the SVG — and recommends AI-drafts-the-model, human-refines as the v1 shape."
      date="2026-05-22"
      scopes={["desktop", "AI"]}
    >
      <SummaryHeaderCard />
      <ShippedSection />
      <V3Section />
      <V2Section />
      <ProblemStatement />
      <CurrentState />
      <Decision1 />
      <ApproachSection />
      <ElementSetSection />
      <ProposedUx />
      <RoundTripSection />
      <SafetySection />
      <SelfGrillingSection />
      <EdgeCasesSection />
      <ImplementationPlanSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={PenTool}
          label="Issue"
          value="Diagram picker is a placeholder; presets only, no authoring."
        />
        <SummaryCell
          icon={Check}
          label="Status"
          value="v1–v3 built · 2026-05-22 (AI-draft + RAG deferred to v1.1)"
        />
        <SummaryCell
          icon={Workflow}
          label="Approach taken"
          value="Model-first hand-rolled SVG builder; AI-draft is the v1.1 add."
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b 0 · vite build 0"
        />
      </CardContent>
    </Card>
  )
}

function SummaryCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PenTool
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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

function ShippedSection() {
  return (
    <Section
      title="Shipped — v1"
      description="The recommendations below were accepted and built in one pass. Files landed; both decisions that gated the work (model-first, hand-rolled) went the recommended way."
    >
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="space-y-3 pt-6 text-xs">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["diagramModel.ts", "Typed DiagramModel + fixed tint set + node/edge factories"],
              ["renderDiagramSvg.ts", "Pure model → SVG, XML-escaped, closed element set"],
              ["DiagramBuilder.tsx", "Hand-rolled SVG canvas: add / drag-snap / connect / tint / delete"],
              ["DiagramBlock.tsx", "data-model round-trip + Builder/Presets tabs + hover-Edit on model diagrams"],
            ].map(([f, what]) => (
              <div key={f} className="rounded-md border bg-card p-2.5">
                <code className="font-mono text-[10px]">{f}</code>
                <div className="mt-0.5 text-muted-foreground">{what}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Pro>Read view + PDF export untouched — same DiagramNode renders the cached data-svg.</Pro>
          </div>
          <p className="text-muted-foreground">
            Connectors are straight, node-edge to node-edge (the v1 scope cut).
            Six presets stay on the Presets tab. AI-draft (step 6) and RAG
            indexing of labels (step 7) are deferred to v1.1, additive on the
            model contract.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

function V3Section() {
  const shipped: [string, string][] = [
    ["Background image overlay", "Upload a floor plan (or any image) as the diagram background; place boxes/text/arrows on top. Stored via Convex storage (generateUploadUrl → createFromUpload), rendered as <image>. Everything lives in one SVG viewBox, so background + overlays scale together when the figure renders at document width — reactive without a second coordinate system."],
    ["Free-standing arrows", "An Arrow tool drops a standalone arrow with draggable square endpoints. Color (6-swatch) + thickness (thin/med/thick). One shared marker with fill='context-stroke' colors the head to match the line."],
    ["Viewport zoom fix", "World bumped to 2400×1600; the frame is fixed and min-zoom clamps so it's always filled (no shrinking working area). Wheel zooms toward the cursor (non-passive listener); drag/scroll pans. Handles are sized in screen px (÷ zoom) so they stay grabbable at any zoom."],
    ["Easier connecting", "Side connect dots are larger on hover; during an edge-drag every other node shows an enlarged drop-target ring."],
    ["Presets folded into builder", "The static Presets tab is gone. Curated starting points are now editable templates ('5-step line', 'Decision branch') loaded into the builder. Legacy svg-only diagrams still render; they're just not re-editable."],
    ["Generic placeholder copy", "Templates use 'Equipment 1…5' / 'CODE-001' / 'Step A/B' instead of domain-specific names, so operators rename rather than delete."],
  ]
  return (
    <Section
      title="v3 — backgrounds, arrows, real viewport"
      description="Third round. Turns the builder into a simple PowerPoint-style overlay tool for SOP diagrams. Built and verified (tsc -b 0 · vite build 0)."
    >
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="space-y-2 pt-6 text-xs">
          <div className="grid gap-2 sm:grid-cols-2">
            {shipped.map(([title, what]) => (
              <div key={title} className="rounded-md border bg-card p-2.5">
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  {title}
                </div>
                <div className="mt-0.5 text-muted-foreground">{what}</div>
              </div>
            ))}
          </div>

          <Alert className="border-amber-500/40 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-xs">Grilling — what to watch</AlertTitle>
            <AlertDescription className="text-[11px] leading-relaxed">
              <strong>Background image isn't tracked in imageUsages.</strong>{" "}
              The orphan-cleanup in the image library only scans editor image
              nodes, so deleting a background from the library would break the
              diagram (broken href). Flagged in code; wiring usage is a separate
              task. <strong>External &lt;image&gt; in print/PDF</strong> loads
              async — the print pipeline may race it on slow connections.{" "}
              <strong>Replacing a background</strong> with a different-sized
              image doesn't reposition existing boxes (coords are absolute).
              Acceptable for v3.
            </AlertDescription>
          </Alert>

          <Alert className="bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-xs">Two interpretation calls — reversible</AlertTitle>
            <AlertDescription className="text-[11px] leading-relaxed">
              <strong>Background stored by URL</strong> (Convex storage), not an
              embedded data-URI — keeps the document HTML small.{" "}
              <strong>Arrow thickness is a 3-step enum</strong> (thin/med/thick),
              not a free slider — consistent output across operators. Both easy
              to change.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function V2Section() {
  const shipped: [string, string][] = [
    ["4-sided connectors", "Hover a node → 4 side dots; drag from a dot to another node, which snaps to its nearest side. Edges store fromSide/toSide; legacy edges fall back to center-clip. Replaced the connect-mode toggle."],
    ["Asset glyph + picker", "Asset boxes draw a small QR-ish glyph. Inspector offers a <select> of existing registry assets (api.assets.list) plus a free-text 'hypothetical code' field."],
    ["Large canvas + zoom", "1200×760 working area, fit-to-width on open, zoom −/+/Fit. Zoom sets the SVG's rendered px size with a fixed viewBox; native scroll pans. Pointer math divides by zoom."],
    ["Caption preview", "The caption renders live, centered, beneath the canvas so it's clear it'll be added."],
    ["Auto-crop output", "The inserted SVG's viewBox is the bounding box of the nodes + padding — scales to document width, nothing chopped. No fixed container size."],
    ["Per-node resize", "Inspector −/+ buttons scale a node by 20% steps, clamped + snapped."],
    ["Text node", "A free-placed text-only node (no fill/stroke) for annotations."],
    ["Starter templates", "Builder-tab buttons load editable models: '5-step line' and 'Decision branch'."],
  ]
  return (
    <Section
      title="v2 — usability pass"
      description="Second round of requests folded in. Built and verified (tsc -b 0 · vite build 0)."
    >
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="space-y-2 pt-6 text-xs">
          <div className="grid gap-2 sm:grid-cols-2">
            {shipped.map(([title, what]) => (
              <div key={title} className="rounded-md border bg-card p-2.5">
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  {title}
                </div>
                <div className="mt-0.5 text-muted-foreground">{what}</div>
              </div>
            ))}
          </div>
          <Alert className="bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-xs">
              Two interpretation calls — flagged, reversible
            </AlertTitle>
            <AlertDescription className="text-[11px] leading-relaxed">
              <strong>Container aspect (portrait / landscape / square) dropped.</strong>{" "}
              The request proposed it, then reasoned that since the import takes
              the full document width the fixed size doesn't matter — so output
              auto-crops to content instead. <strong>Caption-drag deferred:</strong>{" "}
              the caption previews at bottom-center (not free-positioned). Both
              are cheap to add back if the read was wrong.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function ProblemStatement() {
  return (
    <Section title="The problem">
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-sm">
          The diagram node can show diagrams but can't make them
        </AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          <code>DiagramNode</code> stores a raw SVG string and renders it via{" "}
          <code>dangerouslySetInnerHTML</code>. The only way to get a diagram in
          is to pick one of six hand-authored presets. The picker shows a
          "Diagram builder — coming soon" card. A process engineer who wants to
          draw the actual flow for <em>their</em> line — Reception → Mixer →
          decision → recover — has no path. We need a simple tool that lets them
          assemble boxes, decisions, and arrows, and have it land in the
          document as a clean diagram that survives publish + PDF export.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function CurrentState() {
  return (
    <Section
      title="What's there now"
      description="Reproduced from src/components/docs/DiagramBlock.tsx — the picker as it ships today."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PenTool className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">
                Diagram builder — coming soon
              </div>
              <div className="text-xs text-muted-foreground">
                Compose simplified flowcharts, maps, and decision trees right
                here. Until then, the presets below cover the common shapes.
              </div>
            </div>
            <span className="ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Soon
            </span>
          </div>
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <Fact label="Storage" value="Raw SVG string in data-svg + caption" />
            <Fact label="Authoring" value="6 curated presets, hand-written SVG" />
            <Fact label="Render" value="dangerouslySetInnerHTML (atom node)" />
            <Fact label="Editable after insert" value="No — pick a different preset to change it" />
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5">{value}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Decision 1 — model vs SVG. Everything else falls out of this.
// ---------------------------------------------------------------------------

function Decision1() {
  return (
    <Section
      title="Decision 1 — store the model, or store the SVG?"
      description="This is the load-bearing choice. Library, shape set, and canvas UX all fall out of it. Resolve it first."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-destructive/30">
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                Option A
              </Badge>
              <span className="text-sm font-semibold">Store SVG only</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The builder emits an SVG string; we keep storing it in{" "}
              <code>data-svg</code> exactly like presets do.
            </p>
            <ul className="space-y-1 text-xs">
              <Con>Not re-editable — reopening means redrawing from scratch.</Con>
              <Con>
                We'd have to parse our own SVG back into shapes to edit, or
                accept "draw once, never touch".
              </Con>
              <Con>
                Forecloses AI-drafts-then-refine: nothing structured to refine.
              </Con>
              <Pro>Zero migration; matches today exactly.</Pro>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                Option B · recommended
              </Badge>
              <span className="text-sm font-semibold">
                Model is source of truth, SVG is derived
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Store a structured <code>DiagramModel</code> (nodes + edges +
              positions). A pure <code>renderDiagramSvg(model)</code> produces
              the SVG; we cache that string in <code>data-svg</code> so the read
              view + PDF export keep working with no code change.
            </p>
            <ul className="space-y-1 text-xs">
              <Pro>Re-editable: reopen the builder from the model.</Pro>
              <Pro>
                Renderer is one controlled function — clean, themed, safe SVG
                (resolves the dangerouslySetInnerHTML pitfall, see Safety).
              </Pro>
              <Pro>AI can emit the model; the builder refines it.</Pro>
              <Con>
                One new attr + a renderer to write; presets without a model open
                read-only (handled — see Edge cases).
              </Con>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

function Pro({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-1.5">
      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span>{children}</span>
    </li>
  )
}

function Con({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-1.5">
      <span className="mt-0.5 shrink-0 text-destructive">×</span>
      <span className="text-muted-foreground">{children}</span>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Approach — once model-first is chosen, how do we build the canvas?
// ---------------------------------------------------------------------------

interface ApproachRow {
  approach: string
  effort: string
  fit: string
  verdict: "recommended" | "fallback" | "rejected"
  note: string
}

const APPROACHES: ApproachRow[] = [
  {
    approach: "Hand-rolled SVG canvas",
    effort: "High (the canvas itself)",
    fit: "Exact",
    verdict: "recommended",
    note: "We own the output: small, themed with our tokens, no script, no foreignObject. Renders natively to the SVG string the node + print pipeline already consume. The cost is the canvas interactions (drag, connect) — pinned small by the v1 scope cut on connectors.",
  },
  {
    approach: "Mermaid (text → SVG)",
    effort: "Low",
    fit: "Good for flow/decision",
    verdict: "fallback",
    note: "Author a tiny text source; mermaid renders SVG. Re-editable (store the text). But: heavy dep, limited styling control, large/uncontrolled output SVG (extra sanitisation), and not WYSIWYG. Good escape hatch if the hand-rolled canvas overruns.",
  },
  {
    approach: "React Flow (@xyflow)",
    effort: "Medium",
    fit: "Fights the export",
    verdict: "rejected",
    note: "Best drag UX, but it renders DOM/HTML, not SVG. Export to a clean static SVG for our print/PDF path is non-trivial (the usual route is html-to-image → PNG). It fights the one hard constraint we have. Heavy dep for a 'simple' tool.",
  },
  {
    approach: "AI generates raw SVG",
    effort: "Near-zero",
    fit: "Unsafe + inconsistent",
    verdict: "rejected",
    note: "Gemini is already wired. But raw AI SVG is non-deterministic, unsafe (must sanitise arbitrary markup), inconsistently styled, and not editable. We DON'T reject AI — we reject AI emitting SVG. AI should emit the MODEL (see recommendation).",
  },
]

function ApproachSection() {
  return (
    <Section
      title="Decision 2 — how to build the canvas (assuming model-first)"
      description="With the model as source of truth, the build approach is a separate call. Recommendation: hand-rolled SVG, with mermaid as the overrun escape hatch."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Approach</TableHead>
                <TableHead className="w-[14%]">Effort</TableHead>
                <TableHead className="w-[14%]">Fit</TableHead>
                <TableHead>Why</TableHead>
                <TableHead className="w-[12%] text-right">Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {APPROACHES.map((a) => (
                <TableRow key={a.approach}>
                  <TableCell className="align-top text-xs font-medium">
                    {a.approach}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {a.effort}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {a.fit}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {a.note}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <VerdictBadge verdict={a.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert className="bg-primary/5">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertTitle className="text-sm">
          The recommendation is a synthesis: AI drafts the model, the human refines it
        </AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          The interesting answer isn't "builder vs AI". It's both, in order. Ask
          IDA / a prompt produces a <code>DiagramModel</code> (structured JSON —
          nodes, edges, labels) from a description or from the document body.
          That model renders immediately through our safe renderer, and the
          hand-rolled canvas lets the engineer nudge it. This kills the
          cold-start blank-canvas problem, keeps output deterministic and safe,
          and stays editable. AI does the boring 80%; the builder does the last
          mile. v1 can ship the builder first and add the AI draft button in
          v1.1 — the model contract makes that purely additive.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function VerdictBadge({ verdict }: { verdict: ApproachRow["verdict"] }) {
  if (verdict === "recommended") {
    return (
      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" />
        pick
      </Badge>
    )
  }
  if (verdict === "fallback") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300">
        fallback
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground">
      no
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Element set + v1 scope
// ---------------------------------------------------------------------------

function ElementSetSection() {
  return (
    <Section
      title="Element set + the scope cut that keeps it 'simple'"
      description="A deliberately small palette. The connector-routing cut is what keeps a hand-roll measured in weeks, not a month."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              v1 nodes
            </div>
            <Element icon={Square} name="Process" desc="Rounded rectangle. The default step box." />
            <Element icon={Diamond} name="Decision" desc="Diamond. Branches out with labelled edges (Yes / No)." />
            <Element icon={GitBranch} name="Terminator" desc="Stadium / pill. Start and end markers." />
            <Element icon={Boxes} name="Asset box" desc="Process box bound to an asset code from the registry — domain hook, optional." />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              v1 interactions
            </div>
            <Element icon={MousePointer2} name="Add" desc="Click a palette shape → it drops on the canvas." />
            <Element icon={ArrowRight} name="Connect" desc="Drag from a node handle to another node. Straight or simple L-elbow only." />
            <Element icon={PenTool} name="Edit label" desc="Double-click a node to type; double-click an edge for Yes/No." />
            <Element icon={Layers} name="Style" desc="Pick a tint from a fixed on-brand swatch set. No free color input." />
          </CardContent>
        </Card>
      </div>

      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-sm">
          Scope cut: connectors are straight or simple elbow — no obstacle avoidance
        </AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          Auto-routing edges that bend around other nodes is the single biggest
          time sink in a hand-rolled diagram editor — it can eat the whole
          build. v1 draws a connector from the source node's edge to the
          target node's edge as a straight line or a one-bend L. If lines cross
          a box, the user moves the box. Snap-to-grid placement makes that
          painless. Auto-layout (dagre) and routed edges are explicit v2.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function Element({
  icon: Icon,
  name,
  desc,
}: {
  icon: typeof Square
  name: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold">{name}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proposed UX — static mock of the builder dialog
// ---------------------------------------------------------------------------

function ProposedUx() {
  return (
    <Section
      title="Proposed UX — the builder dialog"
      description="Replaces the placeholder card. Palette on the left, canvas in the middle, inspector on the right, caption + insert below. Rendered here as a static mock."
    >
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-lg border bg-background">
            {/* dialog title bar */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shapes className="h-4 w-4 text-primary" />
                Diagram builder
              </div>
              <div className="flex gap-1.5">
                <span className="rounded border px-2 py-0.5 text-[10px] text-muted-foreground">
                  Builder
                </span>
                <span className="rounded border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  Presets
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr_150px] gap-0">
              {/* palette */}
              <div className="space-y-2 border-r p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Shapes
                </div>
                {[
                  { Icon: Square, label: "Process" },
                  { Icon: Diamond, label: "Decision" },
                  { Icon: GitBranch, label: "Terminator" },
                  { Icon: Boxes, label: "Asset" },
                ].map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1.5 text-[11px]"
                  >
                    <Icon className="h-3 w-3 text-primary" />
                    {label}
                  </div>
                ))}
              </div>

              {/* canvas */}
              <div className="relative bg-[radial-gradient(circle,theme(colors.muted.DEFAULT)_1px,transparent_1px)] [background-size:16px_16px] p-4">
                <MockFlowSvg />
              </div>

              {/* inspector */}
              <div className="space-y-3 border-l p-3 text-[11px]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Selected: Mixer
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Label</div>
                  <div className="rounded border bg-card px-2 py-1">Mixer</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Tint</div>
                  <div className="flex gap-1">
                    {["#dbeafe", "#fef3c7", "#dcfce7", "#ede9fe", "#fee2e2"].map(
                      (c) => (
                        <span
                          key={c}
                          className="h-4 w-4 rounded-full border"
                          style={{ background: c }}
                        />
                      ),
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Asset link</div>
                  <div className="rounded border bg-card px-2 py-1 font-mono text-[10px]">
                    FCK-102
                  </div>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center gap-3 border-t bg-muted/20 px-4 py-2.5">
              <div className="flex-1">
                <input
                  readOnly
                  value="Pigment line flow: Reception to Press."
                  className="w-full rounded border bg-card px-2 py-1 text-[11px] text-muted-foreground"
                />
              </div>
              <span className="rounded-md border px-3 py-1 text-[11px] text-muted-foreground">
                Cancel
              </span>
              <span className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
                Insert diagram
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The "Presets" tab keeps the existing six curated SVGs. The "Builder"
            tab is the new model-backed canvas. Two paths, one dialog.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

// A tiny static SVG that demonstrates the renderer output shape.
function MockFlowSvg() {
  return (
    <svg viewBox="0 0 460 150" className="h-auto w-full">
      <defs>
        <marker
          id="db-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#475569" />
        </marker>
      </defs>
      <g
        fontFamily="ui-sans-serif, system-ui"
        fontSize="12"
        textAnchor="middle"
      >
        <rect x="10" y="55" width="90" height="44" rx="6" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="1.5" />
        <text x="55" y="81" fill="#1e3a8a" fontWeight="600">Reception</text>

        <rect x="150" y="55" width="90" height="44" rx="6" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" className="ring-2" />
        <text x="195" y="81" fill="#78350f" fontWeight="600">Mixer</text>

        <polygon points="330,40 400,77 330,114 260,77" fill="#fee2e2" stroke="#b91c1c" strokeWidth="1.5" />
        <text x="330" y="81" fill="#7f1d1d" fontWeight="600">Jam?</text>

        <line x1="100" y1="77" x2="150" y2="77" stroke="#475569" strokeWidth="2" markerEnd="url(#db-arrow)" />
        <line x1="240" y1="77" x2="260" y2="77" stroke="#475569" strokeWidth="2" markerEnd="url(#db-arrow)" />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

function RoundTripSection() {
  return (
    <Section
      title="Round-trip into TipTap"
      description="The node gains one attribute. The read view and the same DiagramNode keep rendering the cached SVG — no mirror to maintain."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 font-mono text-[10px] leading-relaxed">
{`// diagramModel.ts — the source of truth
type NodeKind = "process" | "decision" | "terminator" | "asset"
interface DiagramNodeShape {
  id: string
  kind: NodeKind
  x: number; y: number; w: number; h: number
  label: string
  tint?: string          // from a fixed swatch set
  assetCode?: string     // optional registry link
}
interface DiagramEdge {
  id: string; from: string; to: string
  label?: string         // "Yes" / "No"
}
interface DiagramModel {
  v: 1
  width: number; height: number
  nodes: DiagramNodeShape[]
  edges: DiagramEdge[]
}

// renderDiagramSvg(model): string  — pure, XML-escapes every label,
// emits only rect/polygon/line/text. No script, no foreignObject.`}
          </pre>
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <Fact
              label="DiagramNode attrs"
              value="add data-model (JSON.stringified); keep data-svg as the derived cache + data-caption"
            />
            <Fact
              label="On save"
              value="renderDiagramSvg(model) → cache into data-svg so read view + PDF need no change"
            />
            <Fact
              label="On reopen"
              value="parse data-model → rehydrate the canvas. No model (legacy preset) → read-only."
            />
          </div>
          <Alert className="bg-muted/30">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs">
              No "extensions must mirror" trap here
            </AlertTitle>
            <AlertDescription className="text-[11px]">
              <code>DocumentEditor.tsx</code> and <code>TiptapReadOnly.tsx</code>{" "}
              import the <em>same</em> <code>DiagramNode</code>. Adding{" "}
              <code>data-model</code> while the node view keeps rendering{" "}
              <code>data-svg</code> means the read view is untouched and stored
              content can't be silently stripped. This codebase has been bitten
              by mismatched extension lists before (tables) — this design sidesteps it.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Safety
// ---------------------------------------------------------------------------

function SafetySection() {
  return (
    <Section
      title="Safety — model-first closes the dangerouslySetInnerHTML hole"
      description="CLAUDE.md flags the diagram node as a curated-presets-only surface because of the raw-SVG injection risk. Model-first turns that constraint into a non-issue."
    >
      <Card>
        <CardContent className="space-y-2 pt-6 text-xs">
          <Pro>
            The SVG is produced by <code>renderDiagramSvg</code> from a typed
            model — we never accept pasted SVG, so there's no arbitrary markup
            to sanitise.
          </Pro>
          <Pro>
            The renderer emits a closed set of elements (rect, polygon, line,
            text, marker). No <code>&lt;script&gt;</code>, no{" "}
            <code>&lt;foreignObject&gt;</code>, no event attributes.
          </Pro>
          <Pro>
            Every label is XML-escaped on the way in (the one real injection
            vector — a label containing <code>&lt;</code> or <code>&amp;</code>{" "}
            — is handled in the renderer, not by trusting input).
          </Pro>
          <Con>
            The "Asset box" pulls a code from the registry; that string is
            data, still XML-escaped. No new trust boundary.
          </Con>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Self-grilling
// ---------------------------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="The uncomfortable questions. If none of these stings, I haven't grilled enough."
    >
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="space-y-4 pt-6">
          <Grill
            q="Is a diagram builder worth building at all? Engineers already paste images and we have six presets."
            a="This is the real risk. If users mostly paste a screenshot of a Visio diagram, a builder is dead weight. The bet is that an EDITABLE, on-brand, searchable diagram beats a flat image — it survives a process change, renders crisp in PDF, and (model-first) its labels can feed RAG. If that bet is wrong, the cheaper play is: keep presets, add AI-image insert, drop the builder. Worth a gut-check with a real engineer before committing the canvas weeks."
          />
          <Grill
            q="React Flow would give a better canvas in days. Hand-rolling is stubborn."
            a="It would — for the on-screen UX. But it renders DOM, and our diagram has to become a static SVG string for the print/PDF pipeline and the read view. Exporting React Flow to clean SVG is the hard part it doesn't do well (PNG via html-to-image is the usual answer, which is worse for print). The hand-roll exists to serve the export constraint, not because canvases are fun to write."
          />
          <Grill
            q="If AI can draft the model, why build the canvas first instead of shipping AI-only?"
            a="Because AI drafts are wrong often enough that an un-editable draft is useless — the engineer needs the last-mile nudge. But it's a fair sequencing question: we could ship the canvas in v1 and the AI-draft button in v1.1, OR prototype AI-draft-then-render (no editing) first to test whether the model abstraction even produces good diagrams before investing in drag UX. The model contract makes either order cheap."
          />
          <Grill
            q="Snap-grid manual placement is clunky. Won't users expect auto-layout?"
            a="Maybe. Auto-layout (dagre) removes placement fiddliness but adds a dep and a layout engine to tune, and it fights manual intent ('I want the recovery branch on the right'). v1 ships manual + snap; if users complain, dagre is an additive v2 that seeds initial positions. Shipping auto-layout first risks tuning a layout engine instead of shipping a tool."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Grill({ q, a }: { q: string; a: string }) {
  return (
    <div className="text-xs">
      <div className="font-medium">Q. {q}</div>
      <div className="mt-1 text-muted-foreground">A. {a}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  handling: string
  severity: "high" | "med" | "low"
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Open a legacy preset (svg-only, no model) in the builder",
    handling:
      "No data-model → builder opens read-only with a 'Replace to edit' note, or offers to start fresh. Presets 3–6 (cross-section, site map, hazard, kiln) are illustrations, not graphs — they stay preset-only by design.",
    severity: "high",
  },
  {
    scenario: "Label contains < or & (XML special chars)",
    handling:
      "renderDiagramSvg XML-escapes every label and edge text. The renderer is the trust boundary, not the input.",
    severity: "high",
  },
  {
    scenario: "Dark mode — fixed hex tints",
    handling:
      "Swatch set chosen to read on both themes (light tints + darker strokes/text), same palette the current presets use. Borders use stroke, not currentColor, so contrast is predictable.",
    severity: "med",
  },
  {
    scenario: "Connector crosses a node (no obstacle avoidance in v1)",
    handling:
      "Accepted limitation. Snap-grid + move-the-box is the workaround. Documented in the builder's empty-state hint. Routed edges are v2.",
    severity: "med",
  },
  {
    scenario: "PDF / print export of a model-backed diagram",
    handling:
      "Export reads the cached data-svg exactly like today — no special-casing. This is the whole point of caching the derived SVG.",
    severity: "med",
  },
  {
    scenario: "RAG over decision logic in a diagram",
    handling:
      "seed.ts paragraphChunks() currently skips the diagram atom. Model-first lets us extract node + edge labels into the chunk stream so 'what happens if the mill jams' can cite the diagram. Additive; flagged as a v1.1 opt-in.",
    severity: "low",
  },
  {
    scenario: "Empty diagram inserted",
    handling:
      "Insert button disabled until at least one node exists. Caption optional.",
    severity: "low",
  },
  {
    scenario: "Very large diagram (many nodes)",
    handling:
      "viewBox scales the SVG to container width regardless of node count; canvas is bounded with scroll. No virtualization in v1 — simple diagrams are the explicit scope.",
    severity: "low",
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases"
      description="What has to be handled, and the call for each. No 'Shipped?' column yet — nothing is built."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Handling</TableHead>
                <TableHead className="w-[10%] text-right">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((row) => (
                <TableRow key={row.scenario}>
                  <TableCell className="align-top text-xs font-medium">
                    {row.scenario}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {row.handling}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <SeverityBadge severity={row.severity} />
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

function SeverityBadge({ severity }: { severity: EdgeRow["severity"] }) {
  if (severity === "high") {
    return (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/25">
        high
      </Badge>
    )
  }
  if (severity === "med") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300">
        med
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[10px]">
      low
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Implementation plan
// ---------------------------------------------------------------------------

interface PlanStep {
  n: number
  title: string
  detail: string
  files: string[]
}

const PLAN: PlanStep[] = [
  {
    n: 1,
    title: "Define the model + renderer",
    detail:
      "DiagramModel types + renderDiagramSvg(model) pure function with XML-escaping. Unit-testable in isolation, no React. This is the spine — build it first, alone.",
    files: ["src/components/docs/diagramModel.ts", "src/components/docs/renderDiagramSvg.ts"],
  },
  {
    n: 2,
    title: "Extend DiagramNode for round-trip",
    detail:
      "Add data-model attr (parseHTML/renderHTML). On insert/update, cache renderDiagramSvg(model) into data-svg. Legacy svg-only nodes keep working untouched.",
    files: ["src/components/docs/DiagramBlock.tsx"],
  },
  {
    n: 3,
    title: "Build the canvas component",
    detail:
      "Palette + SVG canvas with add / drag (snap-grid) / connect (straight or L-elbow) / inline label edit / fixed-swatch tint / delete. The bulk of the effort; connector scope cut keeps it bounded.",
    files: ["src/components/docs/DiagramBuilder.tsx"],
  },
  {
    n: 4,
    title: "Replace the placeholder with Builder / Presets tabs",
    detail:
      "DiagramPicker gets two tabs: Builder (new) + Presets (existing six). Insert path emits {model, svg, caption} for builder diagrams, {svg, caption} for presets.",
    files: ["src/components/docs/DiagramBlock.tsx", "src/components/docs/diagramPresets.ts"],
  },
  {
    n: 5,
    title: "Verify read view + export are untouched",
    detail:
      "Confirm TiptapReadOnly (same DiagramNode) and the print/PDF pipeline render the cached svg with no change. No mirror to maintain.",
    files: ["src/components/docs/TiptapReadOnly.tsx (read-only check)"],
  },
  {
    n: 6,
    title: "v1.1 — AI drafts the model",
    detail:
      "Deferred. A 'Draft with AI' button calls Gemini to emit a DiagramModel from a prompt or the doc body; the model renders + becomes editable. Purely additive on the model contract.",
    files: ["src/ai/* (v1.1)"],
  },
  {
    n: 7,
    title: "v1.1 — index diagram labels for RAG",
    detail:
      "Deferred. paragraphChunks() extracts node + edge labels from the model so decision logic is retrievable.",
    files: ["src/db/seed.ts (v1.1)"],
  },
]

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan"
      description="Build the model + renderer first, in isolation. The canvas is the only big rock. Steps 6–7 are explicitly v1.1."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {PLAN.map((step) => (
            <div key={step.n} className="flex items-start gap-3 rounded-md border bg-card p-3">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  step.n >= 6
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {step.n}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{step.title}</div>
                  {step.n >= 6 ? (
                    <Badge variant="outline" className="text-[10px]">
                      v1.1
                    </Badge>
                  ) : (
                    <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                      <Check className="h-2.5 w-2.5" />
                      shipped
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {step.detail}
                </div>
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
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Decisions — open questions for the user
// ---------------------------------------------------------------------------

function DecisionsSection() {
  return (
    <Section
      title="Open decisions"
      description="What I need a call on before any code lands."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Decision
            q="1. Model-first, or SVG-only?"
            note="Recommend model-first (Option B). It's the choice everything else depends on. SVG-only is cheaper now but forecloses re-editability, AI-draft, and the safety win."
          />
          <Decision
            q="2. Hand-rolled canvas, or mermaid?"
            note="Recommend hand-rolled for exact SVG control + WYSIWYG, with mermaid as the escape hatch if the canvas overruns. React Flow and AI-raw-SVG are out for the reasons in the table."
          />
          <Decision
            q="3. Does the builder ship before AI-draft, or do we prototype AI-draft-then-render first?"
            note="Recommend builder first (v1), AI-draft additive (v1.1). But a cheap AI-draft-then-render spike could de-risk whether the model abstraction produces good diagrams at all — your call on appetite."
          />
          <Decision
            q="4. Is the Asset-link node worth it in v1?"
            note="It's the domain hook that makes our diagrams more than generic flowcharts (box bound to FCK-102). Small add on top of the process node. Recommend yes, but it's cuttable if v1 needs to be leaner."
          />
          <Decision
            q="5. Do we want diagram labels in RAG?"
            note="Recommend yes, as v1.1. Makes decision trees answerable by IDA. Needs the model (another reason for Option B)."
          />
          <Separator className="my-2" />
          <Alert className="bg-emerald-500/5">
            <Check className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-xs">
              Closed · 2026-05-22. All five went the recommended way.
            </AlertTitle>
            <AlertDescription className="text-[11px]">
              1 model-first · 2 hand-rolled SVG · 3 builder shipped first,
              AI-draft is v1.1 · 4 asset-link node included in v1 · 5 RAG over
              diagram labels deferred to v1.1. Follow-ups: AI-drafts-the-model
              button, paragraphChunks() label extraction, and (if users ask)
              dagre auto-layout + routed connectors.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function Decision({ q, note }: { q: string; note: string }) {
  return (
    <div className="flex items-start gap-3">
      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-xs font-medium">{q}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{note}</div>
      </div>
    </div>
  )
}
