// Diagram builder — ground-up rebuild analysis (2026-05-22).
//
// v1–v3 (see /analysis/diagram-builder) bolted capability onto a canvas whose
// pan/zoom foundation was wrong, so the same class of bug (working area drifting
// outside the frame, can't zoom out, added shapes off-screen) keeps returning.
// This page is the rebuild spec: fix the foundation, consolidate the surface,
// add only what's missing (drag-and-drop, background-as-element). Proposal —
// awaiting sign-off on Decisions 1 & 2 before any diagram code changes.

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleHelp,
  Crosshair,
  Image as ImageIcon,
  Lock,
  Move,
  MousePointerClick,
  Layers,
  ShieldCheck,
  ZoomIn,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { Link } from "wouter"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function DiagramBuilderRebuildAnalysis() {
  return (
    <AnalysisLayout
      title="Diagram builder — ground-up rebuild"
      subtitle="v1–v3 stacked features on a broken pan/zoom foundation, so the same bug keeps coming back (working area drifts outside the frame, can't zoom out, added shapes land off-screen). This is the rebuild spec: replace the css-size+scroll canvas with a fixed SVG viewport + a single transform, make the background a normal placeable/lockable element instead of the thing that sizes the canvas, consolidate the toolbar, and add drag-and-drop. No new capabilities beyond drag-and-drop and background-as-element — this is a foundation fix, not a feature round."
      date="2026-05-22"
      scopes={["desktop", "Editor"] as never}
    >
      <SummaryHeaderCard />
      <WhyRebuild />
      <WhatsBeenTried />
      <Decision1 />
      <CoordinateModel />
      <Decision2 />
      <Consolidation />
      <ScopeGuard />
      <InterdependencyMap />
      <SelfGrilling />
      <EdgeCases />
      <ImplementationPlan />
      <Decisions />
    </AnalysisLayout>
  )
}

// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <Cell icon={AlertTriangle} label="Issue" value="Pan/zoom foundation is wrong; the same canvas bug keeps returning across v1–v3." />
        <Cell icon={CircleHelp} label="Status" value="Built · awaiting user verification (all 4 decisions taken: yes)" />
        <Cell icon={ZoomIn} label="Approach" value="Fixed SVG viewport + one <g> transform; background-as-element; consolidate; drag-and-drop — all shipped." />
        <Cell icon={ShieldCheck} label="Verification" value="tsc -b + vite build exit 0. Pointer-interaction edge cases pending real use." />
      </CardContent>
    </Card>
  )
}

function Cell({ icon: Icon, label, value }: { icon: typeof ZoomIn; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm leading-snug">{value}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function WhyRebuild() {
  return (
    <Section title="Why rebuild instead of patch again">
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-sm">Zoom has broken three times because the model is wrong</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          The canvas renders the SVG at <code>width = world × zoom</code> inside an
          <code> overflow:auto</code> box. That makes the frame and the content fight:
          zoom out and the SVG shrinks <em>inside</em> a fixed-size frame, leaving dead
          gray space; zoom in and the content grows past the frame and drifts; you can't
          zoom below "fit"; and a newly-added shape lands at the world's geometric centre,
          which is off-screen when you're zoomed in. Each patch (bigger world, min-zoom
          clamp, wheel handler) treated a symptom. The cause is the layout model. Rather
          than patch a fourth time, replace the foundation — then every interaction that's
          been flaky becomes trivial.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function WhatsBeenTried() {
  const problems: [string, string][] = [
    ["Working area drifts outside the frame", "css-size canvas + overflow scroll; frame and content scale independently."],
    ["Can't zoom out below fit", "min-zoom was clamped to 'fill the frame' to hide dead space — a workaround that removed zoom-out."],
    ["Added shape is off-screen when zoomed", "click-to-add places at the world's geometric centre, not the viewport centre."],
    ["Background blows up the workspace", "background defines the world size, so a big JPEG makes the whole canvas huge with no way to scale or crop it."],
    ["No way to lock the background", "nothing distinguishes 'still placing it' from 'locked in'; it stays draggable/selectable forever."],
    ["Scroll-wheel zoom only zoomed in", "wheel handler sign / clamp interaction; zoom-out via wheel never reached."],
  ]
  return (
    <Section
      title="What's been tried — and what kept breaking"
      description="v1–v3 are the case file at /analysis/diagram-builder. This is the recurring-problem ledger the rebuild has to actually close."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Link href="/analysis/diagram-builder" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ArrowRight className="h-3 w-3" />
            v1–v3 history (model-first, builder, backgrounds/arrows)
          </Link>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">Recurring problem</TableHead>
                <TableHead>Why it kept happening</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map(([p, why]) => (
                <TableRow key={p}>
                  <TableCell className="align-top text-xs font-medium">{p}</TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{why}</TableCell>
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

function Decision1() {
  return (
    <Section
      title="Decision 1 — fixed SVG viewport + one transform (load-bearing)"
      description="This is the choice everything else falls out of. Get it right and pan/zoom/add-shape stop being special cases."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-destructive/30">
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Today</Badge>
              <span className="text-sm font-semibold">css-size canvas + overflow scroll</span>
            </div>
            <p className="text-xs text-muted-foreground">
              SVG sized to <code>world × zoom</code>, panned by native scrollbars.
            </p>
            <ul className="space-y-1 text-xs">
              <Con>Frame and content scale independently → dead space + drift.</Con>
              <Con>Zoom-out clamped to fit to hide the dead space.</Con>
              <Con>Pointer math depends on the rendered rect width (fragile).</Con>
              <Con>Add-shape can't know the viewport centre cleanly.</Con>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">Rebuild</Badge>
              <span className="text-sm font-semibold">Fixed viewport + &lt;g&gt; transform</span>
            </div>
            <p className="text-xs text-muted-foreground">
              SVG has a fixed pixel size (the frame never moves). All world content
              lives inside <code>&lt;g transform="translate(panX,panY) scale(zoom)"&gt;</code>.
            </p>
            <ul className="space-y-1 text-xs">
              <Pro>Pan = mutate panX/panY (drag the canvas). No scrollbars.</Pro>
              <Pro>Zoom in AND out freely — fit is a button, not a floor. Zooming out to see margins is now expected, not a bug.</Pro>
              <Pro><code>clientToWorld = (clientX − svgLeft − panX) / zoom</code> — two ops, no rect-width race.</Pro>
              <Pro>Add-shape lands at the viewport centre in world coords, so it's always visible.</Pro>
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

function CoordinateModel() {
  const items: [typeof Move, string, string][] = [
    [Move, "Pan", "Drag empty canvas → panX/panY change. The frame stays put; the world slides under it."],
    [ZoomIn, "Zoom (in & out)", "Wheel zooms toward the cursor; −/+/Fit buttons too. No min-zoom floor — zoom out past fit to see the whole world plus margin."],
    [Crosshair, "Add at viewport centre", "Click-to-add (and the drop fallback) places the shape at the centre of what you're currently looking at, in world coords — never off-screen."],
    [MousePointerClick, "Drag-and-drop palette", "Press a palette shape, drag onto the canvas, release where you want it. clientToWorld maps the drop point. The explicit ask; same coordinate model makes it cheap."],
  ]
  return (
    <Section
      title="The coordinate model (what falls out of Decision 1)"
      description="One world space, one transform. Every interaction is expressed against it."
    >
      <Card>
        <CardContent className="grid gap-2 pt-6 sm:grid-cols-2">
          {items.map(([Icon, t, d]) => (
            <div key={t} className="flex items-start gap-3 rounded-md border bg-card p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{d}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Decision2() {
  return (
    <Section
      title="Decision 2 — background is an element, not the canvas size"
      description="The other root cause. A floor plan should be something you place, scale, and lock — not the thing that decides how big your workspace is."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 rounded-md border border-destructive/30 p-3">
              <div className="text-xs font-semibold">Today</div>
              <p className="text-xs text-muted-foreground">
                Background sets <code>world = image natural size</code>. A 4000px JPEG makes the
                canvas 4000px; no scale, no crop, no reposition. It dwarfs the shapes.
              </p>
            </div>
            <div className="space-y-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3">
              <div className="text-xs font-semibold">Rebuild</div>
              <p className="text-xs text-muted-foreground">
                Background becomes a normal element in world space:
                <code> {`{ url, x, y, w, h, locked }`}</code>. The world is a fixed large
                working area; the image is placed and resized within it (corner-drag), and
                <strong> Lock</strong> freezes it so clicks/drags pass through to the shapes on top.
                Crop is implicit — position + size the image, the output viewBox crops to content.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-xs text-muted-foreground">
              <strong>Lock button (left rail).</strong> Toggles <code>background.locked</code>. When
              locked, the background renders behind everything and ignores pointer events, so you can
              draw on top without nudging it. Unlock to reposition.
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Consolidation() {
  return (
    <Section
      title="Consolidate the toolbar"
      description="Same capabilities, fewer top-level controls. The user asked to combine, not expand."
    >
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <div className="flex items-start gap-3 rounded-md border bg-card p-3">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-semibold">"Start from" → "Import template" dropdown</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                One dropdown instead of two buttons: <em>Process line</em>, <em>Decision branch</em>,
                and <em>Background image…</em> (opens the upload flow). Background becomes just another
                way to seed the canvas. Adding more templates later is a list entry, not another button.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border bg-card p-3">
            <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-semibold">Left rail: shapes (drag-and-drop) + Lock background</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Palette buttons stay (they aren't broken) but become drag sources. The Lock toggle for
                the background sits here too, since it's a canvas-level mode, not a per-shape property.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function ScopeGuard() {
  return (
    <Section title="Scope guard — this is a foundation fix, not a feature round">
      <Alert className="bg-muted/30">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="text-xs">The v3 surface is the surface</AlertTitle>
        <AlertDescription className="text-[11px] leading-relaxed">
          Shapes (process / decision / terminator / asset / text), 4-sided connectors, free arrows,
          per-node resize, tints, caption, asset picker, templates — all stay. We are <strong>not</strong>{" "}
          adding grouping, layers, multi-select, alignment guides, or freehand. The only genuinely new
          things are <strong>drag-and-drop placement</strong> and <strong>background-as-element (with lock)</strong>.
          Everything else is the same capability re-expressed on a correct foundation.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function InterdependencyMap() {
  const rows: [string, "changes" | "stays" | "risk", string][] = [
    ["DiagramModel shape", "changes", "Extend background to { url, x, y, w, h, locked }. parseDiagramModel backfills legacy models (x:0,y:0,w:natural,h:natural,locked:false). Additive — old models still parse."],
    ["renderDiagramSvg(model) → string", "stays", "Still the single trust boundary; still XML-escapes. Background <image> gets x/y/w/h instead of 0,0,natural. viewBox crop logic unchanged."],
    ["TipTap DiagramNode (data-svg + data-model)", "stays", "Schema untouched. Round-trip, parseHTML/renderHTML, the on-hover Edit gate — all unchanged."],
    ["DocumentEditor / TiptapReadOnly", "stays", "Same DiagramNode; read view renders cached data-svg. No mirror to maintain."],
    ["PDF / print export", "stays", "Reads cached data-svg. Unchanged. (External <image> async-load caveat already noted in v3.)"],
    ["DiagramBuilder.tsx internals", "changes", "Pan/zoom rewritten to transform model; add-shape to viewport centre; drag-and-drop; background element with lock. Self-contained."],
    ["Convex images.list / assets.list", "stays", "Used as-is for the asset picker + background upload."],
    ["imageUsages for backgrounds", "risk", "Still not tracked (carried over from v3). Deleting a background from the library breaks the diagram. Out of scope here; flagged."],
  ]
  return (
    <Section
      title="Interdependency map"
      description="What changes, what stays, what could break. The contract that keeps the document integration stable while the canvas is rebuilt."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[26%]">Surface</TableHead>
                <TableHead className="w-[12%]">Verdict</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([s, v, d]) => (
                <TableRow key={s}>
                  <TableCell className="align-top text-xs font-medium">{s}</TableCell>
                  <TableCell className="align-top">
                    {v === "stays" ? (
                      <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">stays</Badge>
                    ) : v === "changes" ? (
                      <Badge className="bg-blue-500/15 text-[10px] text-blue-700 hover:bg-blue-500/25 dark:text-blue-300">changes</Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-[10px] text-amber-700 hover:bg-amber-500/25 dark:text-amber-300">risk</Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{d}</TableCell>
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

function SelfGrilling() {
  return (
    <Section title="Self-grilling" description="The uncomfortable questions, including the one about my own prior calls.">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="space-y-4 pt-6">
          <Grill
            q="Why was the transform-based viewport rejected twice already? This rebuild is the cost of that."
            a="Honestly: short-term pragmatism. The first advisor note pointed at viewBox/transform on turn one; I went css-size+overflow because it reused working pointer code and felt lower-risk per chunk. It was lower-risk per chunk and higher-risk overall — three patches and now a rebuild. Same pattern with accepting 'background sizes the canvas' once. The lesson encoded here: foundation decisions don't get the pragmatic shortcut."
          />
          <Grill
            q="Is a full rebuild going to break existing diagrams in documents?"
            a="It shouldn't, and the interdependency map is the argument. The DiagramModel is extended additively (background gains x/y/w/h/locked with legacy defaults), and the data-svg/data-model contract with TipTap is untouched. Existing builder diagrams reopen; legacy svg-only diagrams still render. The blast radius is DiagramBuilder.tsx internals + a few lines of renderer. If that holds, the document side never notices."
          />
          <Grill
            q="Drag-and-drop in SVG is fiddly. Is it worth it over click-to-add-at-viewport-centre?"
            a="Click-to-add-at-viewport-centre alone fixes the 'I can't see what I added' complaint — that's the 90% fix and it's free from Decision 1. Drag-and-drop is the explicit ask and the nicer interaction, but it's the part most likely to eat time (pointer capture, ghost preview, drop hit-testing). Plan: ship click-to-add-at-centre as the floor, layer drag-and-drop on top; if DnD overruns, the tool is still fixed without it."
          />
          <Grill
            q="No min-zoom floor means users can zoom out until the diagram is a dot. Is that a problem?"
            a="Mild. A sane clamp (e.g. 0.1×–4×) keeps it from getting absurd without reintroducing the 'fit is the floor' bug. Fit-to-content stays a button so there's always a one-click way back to a sensible view. The floor that caused trouble was 'fill the frame'; a wide absolute clamp is fine."
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

function EdgeCases() {
  const rows: [string, string, "high" | "med" | "low"][] = [
    ["Zoom out far past the world", "Absolute clamp (~0.1×). Fit button returns to a sensible view. No 'fill-frame' floor.", "med"],
    ["Add shape while zoomed/panned", "Lands at viewport centre in world coords — always visible.", "high"],
    ["Drop a shape outside the world bounds", "Allowed; the world is just a guide, not a hard wall. Output crops to content anyway.", "low"],
    ["Locked background, click on top", "Background ignores pointer events when locked; clicks select the shapes above it.", "high"],
    ["Resize a huge background down", "Corner-drag scales the element; world size is independent, so the workspace stays usable.", "high"],
    ["Legacy diagram (no x/y/w/h on background)", "parseDiagramModel backfills 0,0,natural,false. Renders identically to before.", "high"],
    ["Pan with a pointer that leaves the frame", "Pointer capture on the svg keeps pan/drag tracking until release.", "med"],
    ["Touch / trackpad pinch", "Out of scope v1; wheel + buttons only. Flagged as a follow-up.", "low"],
  ]
  return (
    <Section title="Edge cases" description="What the rebuilt canvas has to handle. No 'shipped?' column — nothing is built.">
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
              {rows.map(([s, h, sev]) => (
                <TableRow key={s}>
                  <TableCell className="align-top text-xs font-medium">{s}</TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{h}</TableCell>
                  <TableCell className="align-top text-right">
                    {sev === "high" ? (
                      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/25">high</Badge>
                    ) : sev === "med" ? (
                      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300">med</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">low</Badge>
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

// ---------------------------------------------------------------------------

function ImplementationPlan() {
  const steps: [number, string, string][] = [
    [1, "Pan/zoom foundation", "Fixed-size SVG viewport + <g transform>. panX/panY/zoom state. clientToWorld. Wheel zoom (in+out, cursor-anchored), −/+/Fit. Existing shapes render + select + drag on the new model."],
    [2, "Add-at-viewport-centre", "Click-to-add places at the current view centre in world coords. The floor fix for off-screen shapes."],
    [3, "Background-as-element", "Model: background { url, x, y, w, h, locked }; parseDiagramModel backfills legacy. Render <image> with x/y/w/h. Corner-drag resize (aspect-locked). Lock toggle (left rail) → pointer-events off when locked. Renderer uses the element rect."],
    [4, "Toolbar consolidation", "'Start from' → 'Import template' dropdown (templates + Background image…). Left rail keeps shape buttons + Lock + Remove."],
    [5, "Drag-and-drop palette", "Palette buttons are HTML5 drag sources; drop maps via clientToWorld. Click-to-add at centre kept as the fallback."],
    [6, "Verify integration", "tsc -b + vite build exit 0. Read view / PDF / round-trip consume cached data-svg unchanged; legacy backgrounds backfilled."],
  ]
  return (
    <Section title="Implementation plan" description="Foundation first. All six steps shipped — drag-and-drop landed too (it didn't overrun).">
      <Card>
        <CardContent className="space-y-3 pt-6">
          {steps.map(([n, t, d]) => (
            <div key={n} className="flex items-start gap-3 rounded-md border bg-card p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{n}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{t}</div>
                  <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">shipped</Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{d}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Decisions() {
  return (
    <Section title="Open decisions" description="Sign-off needed before any diagram code changes.">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Decision q="1. Replace css-size+overflow with the fixed viewport + <g> transform?" note="Recommend yes — this is the load-bearing fix. Everything else (zoom-out, add-at-centre, drag-and-drop, no drift) falls out of it." />
          <Decision q="2. Make the background a placeable/lockable element instead of the canvas-size driver?" note="Recommend yes — the second root cause. World stays a fixed working area; the image is placed, scaled, and locked within it." />
          <Decision q="3. 'Import template' dropdown with Background image… as an entry?" note="Recommend yes — the user's reframe. Consolidates two buttons + the background button into one menu." />
          <Decision q="4. Drag-and-drop now, or click-to-add-at-centre first and DnD as a fast-follow?" note="Recommend ship click-to-add-at-centre as the floor (fixes visibility), add DnD on top; cut DnD only if it overruns." />
          <Separator className="my-2" />
          <Alert className="border-emerald-500/40 bg-emerald-500/5">
            <Check className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-xs">Closed · 2026-05-22. All four taken: yes. Built, awaiting use.</AlertTitle>
            <AlertDescription className="text-[11px]">
              The rebuild shipped on this foundation: fixed SVG viewport + one &lt;g&gt; transform,
              background-as-element with a left-rail Lock, the Import template dropdown, and
              drag-and-drop palette (with click-to-add-at-centre as the fallback). tsc -b + vite
              build exit 0. Carried-over follow-up: background images still aren't tracked in
              imageUsages. The v1–v3 page stays as history.
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
