// Analysis page: implementation plan for four workstreams from a screenshot
// review — senior-status counting, the document-type vocabulary with icon +
// color, the PDF document-overview rework, and the PPE configurator with
// ISO-7010-style pictograms. PLAN ONLY: research is complete, nothing is
// implemented; the build starts on explicit go.

import {
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HardHat,
  Landmark,
  ListChecks,
  Megaphone,
  Presentation,
  Scale,
  ShieldAlert,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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

export function StatusTypesPpePlanAnalysis() {
  return (
    <AnalysisLayout
      title="Plan — senior status counts, type vocabulary, PDF overview, PPE configurator"
      subtitle="Four workstreams from the 2026-06-11 screenshot review. The dashboard counts a published document with a draft fork as 'draft'; document types are a fixed four-value union with no icon/color control; the PDF overview tables are pill-heavy with unhelpful 'Code' headers; and PPE renders as generic icons instead of recognisable safety pictograms. This page is the full implementation plan — research done, decisions flagged, nothing built yet."
      date="2026-06-11"
      scopes={["desktop", "data-model", "mobile"]}
    >
      <StatusCard />
      <Ws1Section />
      <Ws2Section />
      <Ws3Section />
      <Ws4Section />
      <PhasesSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

function StatusCard() {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
        <Badge className="border-0 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
          Shipped · 2026-06-11
        </Badge>
        <span>
          All four workstreams shipped with every recommended decision adopted.
          Senior-status counting, the DB-backed type vocabulary with icon/color
          pickers, the de-pilled PDF overview with revision history on the title
          page, and the Safety-tab PPE configurator with 20 self-drawn
          pictograms are live. The plan below is kept as the record.
        </span>
      </CardContent>
    </Card>
  )
}

// --- WS1 -----------------------------------------------------------------------

function Ws1Section() {
  return (
    <Section
      title="WS1 — Count by the most senior status"
      description="Evidence: dashboard shows 3 DRAFT / 0 PUBLISHED while the library correctly shows AMS-OPS-MAN-0001 as Published with a v3 draft chip."
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm leading-relaxed">
          <p>
            <strong>Root cause.</strong> When a published document is forked
            for editing, <code>doc.status</code> flips to the working edition's
            status (draft) while <code>liveVersion</code> stays pinned. The
            dashboard counts (<code>DashboardPage.tsx:66-77</code>) read{" "}
            <code>doc.status</code> only, so one published-with-fork document
            and two pure drafts count as three drafts.
          </p>
          <p>
            <strong>Rule.</strong> One document counts once, under its most
            senior state:{" "}
            <code>
              effectiveStatus = archived ? archived : (liveVersion != null ?
              published : status)
            </code>
            . Seniority: published &gt; approved &gt; in_review &gt; draft &gt;
            pre_draft; archived stays archived.
          </p>
          <p>
            <strong>Implementation.</strong> One shared helper{" "}
            <code>effectiveStatus(doc)</code> in <code>src/lib</code> (and
            mirrored where the server query shapes status), consumed by:
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Surface</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Row a="Dashboard Library card counts" b="Count by effectiveStatus — the screenshot case becomes 1 PUBLISHED / 2 DRAFT." />
              <Row a="Dashboard 'Recently published'" b="Include docs with a liveVersion (currently misses published docs being re-drafted)." />
              <Row a="Dashboard 'Needs attention'" b="Keep keyed on the working status — a published doc with an active draft fork still genuinely needs attention (decision D2)." />
              <Row a="Library status filter + grouped view" b="Filter/group by effectiveStatus so the filter matches the badge the row displays (decision D1)." />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <TableRow>
      <TableCell className="align-top text-xs font-medium">{a}</TableCell>
      <TableCell className="align-top text-xs">{b}</TableCell>
    </TableRow>
  )
}

// --- WS2 -----------------------------------------------------------------------

const FACTORY_TYPES = [
  { token: "SOP", label: "SOP", icon: FileText, cls: "border-sky-300 bg-sky-50 text-sky-700" },
  { token: "MAN", label: "Manual", icon: BookOpen, cls: "border-violet-300 bg-violet-50 text-violet-700" },
  { token: "WI", label: "Work instruction", icon: ListChecks, cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { token: "LMRA", label: "LMRA", icon: ShieldAlert, cls: "border-rose-300 bg-rose-50 text-rose-700" },
  { token: "TBOX", label: "Toolbox talk", icon: Presentation, cls: "border-amber-300 bg-amber-50 text-amber-700" },
  { token: "POL", label: "Policy", icon: Landmark, cls: "border-indigo-300 bg-indigo-50 text-indigo-700" },
]

const ICON_SET = [
  { name: "FileText", icon: FileText },
  { name: "BookOpen", icon: BookOpen },
  { name: "ListChecks", icon: ListChecks },
  { name: "ShieldAlert", icon: ShieldAlert },
  { name: "Presentation", icon: Presentation },
  { name: "Landmark", icon: Landmark },
  { name: "Wrench", icon: Wrench },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "ClipboardCheck", icon: ClipboardCheck },
  { name: "Megaphone", icon: Megaphone },
]

function Ws2Section() {
  return (
    <Section
      title="WS2 — Document types become a vocabulary with icon + color"
      description="Today the type is a hardcoded four-value union and the Naming acronyms page explicitly says 'Type tokens (SOP, MAN, WI, LMRA) are fixed'. It becomes the third editable vocabulary."
    >
      <div className="space-y-3">
        <Card>
          <CardContent className="space-y-3 p-4 text-sm leading-relaxed">
            <p>
              <strong>New table <code>namingTypes</code></strong>:{" "}
              <code>
                {"{ slug, token, label, icon, color, active, builtIn, sortOrder }"}
              </code>
              . The slug keeps today's stored values (<code>sop</code>,{" "}
              <code>manual</code>, …) valid; the token is the naming-code
              segment (<code>SOP</code>, <code>MAN</code>, …). Built-in rows
              can be deactivated, never deleted (naming codes are immutable —
              deleting a type would orphan existing codes); custom rows are
              deletable only while no document uses them.
            </p>
            <p>
              <strong>Factory set (6):</strong> the four that exist in data
              today plus the two you named.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FACTORY_TYPES.map((t) => (
                <span
                  key={t.token}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                    t.cls,
                  )}
                >
                  <t.icon className="h-3 w-3" />
                  {t.label}
                  <span className="font-mono opacity-70">{t.token}</span>
                </span>
              ))}
            </div>
            <p>
              <strong>The choosing system.</strong> On{" "}
              <code>/settings/naming</code> a third card "Document types" joins
              Locations and Disciplines: each row shows a live preview chip,
              token, label, an active toggle, and (custom rows only) delete.
              The add/edit form has the token + label fields plus an{" "}
              <strong>icon picker</strong> (the 10 below) and a{" "}
              <strong>color picker</strong> (10 fixed tones: sky, violet,
              emerald, rose, amber, indigo, teal, orange, slate, fuchsia —
              statically mapped classes so Tailwind keeps them).
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ICON_SET.map((i) => (
                <span
                  key={i.name}
                  className="inline-flex items-center gap-1 rounded border bg-muted/40 px-1.5 py-0.5 text-[11px]"
                >
                  <i.icon className="h-3.5 w-3.5" />
                  {i.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Section title="" description="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">Touchpoint (researched)</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Row a="convex/schema.ts:60-65 + templates validator (123-128)" b="documents.type and templates.type widen from the 4-literal union to v.string(); values stay slugs so existing rows are untouched." />
              <Row a="convex/naming.ts TYPE_TOKEN/TOKEN_TO_TYPE (17-33) + src/lib/namingCode.ts (8-20)" b="Static maps become lookups against namingTypes, with the legacy 4-token map kept as a parse fallback. Server allocation + client preview both resolve tokens from the table." />
              <Row a="src/components/docs/TypeBadge.tsx (12-35)" b="Hardcoded META map becomes data-driven: icon-id → lucide component registry + color-id → class map; falls back to the legacy styling for unknown slugs." />
              <Row a="MetadataPanel TYPE_OPTIONS (64-78), LibraryPage filter (42-48) + grouping (261-267), DocumentNewPage default" b="All read useQuery(api.namingTypes.list) — active types for creation, all types for filters/grouping so legacy docs of a deactivated type stay findable." />
              <Row a="convex/importer/templates.ts (4 instruction prompts)" b="Type classification maps custom types to the closest built-in instruction (default: SOP) until a per-type instruction editor exists (decision D4)." />
              <Row a="NamingSettingsPage.tsx + convex/naming.ts vocabulary functions" b="Third VocabCard variant with icon/color pickers; api.naming gains type CRUD (seedIfEmpty pattern like locations/disciplines); page subtitle drops the 'fixed tokens' line." />
              <Row a="PDF export type kicker + library 'All types' dropdown + mobile" b="Label resolved from namingTypes everywhere a type renders." />
            </TableBody>
          </Table>
        </Section>
      </div>
    </Section>
  )
}

// --- WS3 -----------------------------------------------------------------------

function Ws3Section() {
  return (
    <Section
      title="WS3 — PDF document overview: drop the pills, real headers, revision history on the title page"
      description="Evidence: the export's front matter uses rounded section pills ('REVISION HISTORY') and a generic 'Code' column with code-pill chips — too much chrome."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[34%]">Element (current)</TableHead>
            <TableHead>Planned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Row
            a="Revision history — fm-slate block with 'REVISION HISTORY' pill, on the Document overview page (buildPrintDoc.ts:273-313)"
            b="Moves onto the title page as a compact 3-row-max table with a plain bold heading, no pill. The title page keeps its ≤1-page guarantee: the table replaces vertical slack under the metadata grid; if logo + PPE + 3 revisions overflow A4 we cap at 2 rows (decision D6)."
          />
          <Row
            a="Linked machines — columns 'Code' / 'Machine', code rendered as emerald code-pill (389-407)"
            b="Left column header becomes 'Linked machine' (the code, plain monospace text — no pill), right column header 'Name' (asset name, location in muted text). Section heading is plain text, no fm-head pill."
          />
          <Row
            a="Linked logs — 'Code' / 'Log' with sky pills (445-468)"
            b="Same pattern: 'Linked log' / 'Name', plain monospace codes, no pills."
          />
          <Row
            a="References — 'Code' / 'Title' with indigo pills (353-374)"
            b="'Reference' as the left header (code as row header, plain), 'Title' kept on the right. No pills."
          />
          <Row
            a="printStyles.ts .fm-head pill + .code-pill + fm color themes (306-398)"
            b=".fm-head pill styling and per-section tints removed from the overview tables; .code-pill stays only where the cover/title page still uses it (code badge under the title)."
          />
          <Row
            a="Required PPE band — orange text-only spans (233-235, 650-663)"
            b="Re-rendered with the WS4 pictograms: each item shows the blue mandatory-sign image + label, on the title page band and in the body block."
          />
        </TableBody>
      </Table>
    </Section>
  )
}

// --- WS4 -----------------------------------------------------------------------

const PPE_CATALOG: { code: string; label: string; legacy?: string }[] = [
  { code: "M003", label: "Hearing protection", legacy: "ear-pro" },
  { code: "M004", label: "Eye protection", legacy: "glasses" },
  { code: "M008", label: "Safety footwear", legacy: "boots" },
  { code: "M009", label: "Safety gloves", legacy: "gloves" },
  { code: "M010", label: "Protective clothing" },
  { code: "M011", label: "Wash your hands" },
  { code: "M013", label: "Face shield" },
  { code: "M014", label: "Hard hat", legacy: "hardhat" },
  { code: "M015", label: "Hi-vis vest", legacy: "hi-vis" },
  { code: "M016", label: "Face mask", legacy: "dust-mask" },
  { code: "M017", label: "Respirator", legacy: "mask" },
  { code: "M018", label: "Safety harness / fall protection" },
  { code: "M002", label: "Read the instructions first" },
  { code: "M012", label: "Use the handrail" },
  { code: "M026", label: "Hair net" },
  { code: "M048", label: "Use gas detector" },
  { code: "M053", label: "Life jacket" },
  { code: "M059", label: "Lab coat" },
  { code: "M001", label: "General mandatory action" },
  { code: "M004+M003", label: "Eye + hearing combined" },
]

function Ws4Section() {
  return (
    <Section
      title="WS4 — PPE configurator (Safety tab) with ISO-7010-style pictograms"
      description="A configurable PPE catalog with recognisable blue mandatory-sign images, managed on a new Safety tab of the Templates page, consumed by the editor, read views, and the PDF."
    >
      <div className="space-y-3">
        <Card>
          <CardContent className="space-y-3 p-4 text-sm leading-relaxed">
            <p>
              <strong>Pictograms.</strong> The reference page (esvshop
              gebodsstickers) sells ISO 7010 M-series mandatory signs — blue
              circle, white pictogram. We can't lift a shop's product images
              and the official ISO artwork is ISO-copyrighted, so we{" "}
              <strong>draw our own simplified SVG set</strong> in that visual
              language (same approach as the curated diagram presets: bundled,
              sanitised, no external fetch — which also makes PDF inlining
              free). One <code>ppePictograms.ts</code> catalog maps pictogram
              id → inline SVG.
            </p>
            <p>
              <strong>Factory catalog (20 items, locked).</strong> Curated from
              the 35 signs on the reference page; the 8 current hardcoded PPE
              ids all map onto it so existing documents keep rendering:
            </p>
            <div className="flex flex-wrap gap-1">
              {PPE_CATALOG.map((p) => (
                <span
                  key={p.code}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800"
                >
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-blue-600" />
                  {p.label}
                  <span className="font-mono text-[9px] opacity-60">{p.code}</span>
                  {p.legacy && (
                    <span className="rounded bg-blue-100 px-1 font-mono text-[9px]">
                      ← {p.legacy}
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p>
              <strong>New table <code>ppeItems</code></strong>:{" "}
              <code>
                {"{ slug, label, description, pictogramId, active, builtIn, sortOrder }"}
              </code>
              , seeded with the 20 factory items via the established{" "}
              <code>seedIfEmpty</code> pattern. Factory rows can be{" "}
              <strong>deactivated but never deleted</strong>; users can add
              their own (pick any bundled pictogram + own label/description —
              custom image upload is deferred, decision D5).
            </p>
            <p>
              <strong>Safety tab.</strong> The Templates page Tabs grow a
              third entry — <em>Templates · PDF cover · Safety</em>. The PPE
              configurator lists every item with pictogram preview, label,
              description, an Active toggle, and Add. Only{" "}
              <strong>active</strong> items appear in the editor's PPE picker.
            </p>
            <p>
              <strong>Editor / read / PDF.</strong> <code>PpeBlock</code>'s
              hardcoded 8-item list becomes <code>useQuery(api.ppe.list)</code>{" "}
              (active items); node attrs keep storing slugs (legacy ids
              resolved through the mapping above, so no document migration).
              Chips in the picker, the read-view band, the mobile PPE popover,
              the title-page band, and the body block all render{" "}
              <strong>pictogram + text</strong> instead of the lucide icon.
              PDF inlines the SVGs directly — self-contained, no fetch.
            </p>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

// --- Phases ---------------------------------------------------------------------

const PHASES: { phase: string; scope: string }[] = [
  {
    phase: "1 · Senior status",
    scope:
      "effectiveStatus helper + dashboard counts/recently-published + library filter/grouping. Small, independent, ships first.",
  },
  {
    phase: "2 · Type vocabulary",
    scope:
      "namingTypes table + seed, schema widening, token lookups with legacy fallback, data-driven TypeBadge, pickers/filters on the table, Naming-acronyms third card with icon+color pickers, importer fallback mapping.",
  },
  {
    phase: "3 · PPE foundation",
    scope:
      "Draw the 20 SVG pictograms, ppeItems table + seed + api.ppe, legacy id mapping, Safety tab configurator.",
  },
  {
    phase: "4 · PPE rendering",
    scope:
      "PpeBlock picker on live data, read-view + mobile chips with pictograms, PDF title-band + body block with inlined SVGs.",
  },
  {
    phase: "5 · PDF overview rework",
    scope:
      "Revision history onto the title page (pill removed), table headers Linked machine/Name, Linked log/Name, Reference/Title, pills stripped, print styles cleaned. Last because it renders WS4's pictograms.",
  },
  {
    phase: "Each phase",
    scope:
      "npx tsc -b && npx vite build green; convex dev --once for schema phases; visual check of dashboard, naming settings, Safety tab, one PDF export (draft + published).",
  },
]

function PhasesSection() {
  return (
    <Section
      title="Build order"
      description="Five phases, each independently verifiable; 2–4 touch schema and seed in the established optional-field / seedIfEmpty patterns so existing data never migrates destructively."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[22%]">Phase</TableHead>
            <TableHead>Scope</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PHASES.map((p) => (
            <Row key={p.phase} a={p.phase} b={p.scope} />
          ))}
        </TableBody>
      </Table>
    </Section>
  )
}

// --- Decisions ------------------------------------------------------------------

const DECISIONS: { id: string; q: string; rec: string }[] = [
  {
    id: "D1",
    q: "Should the library status filter and grouped view also use the senior status?",
    rec: "Yes — the row badge already shows Published + fork chip, so filtering 'Published' should match it. Recommended.",
  },
  {
    id: "D2",
    q: "Does a published doc with an active draft fork still appear in 'Needs attention'?",
    rec: "Yes — the fork is unfinished work. Counts use senior status; attention uses working status. Recommended.",
  },
  {
    id: "D3",
    q: "Factory type set: your 4 (SOP, Manual, TBOX, POL) or those plus the existing WI + LMRA?",
    rec: "All 6 — WI and LMRA documents and importer templates already exist; you can deactivate them on day one if unwanted. Recommended.",
  },
  {
    id: "D4",
    q: "Importer behaviour for custom types?",
    rec: "Map to the closest built-in instruction (default SOP) for now; a per-type instruction editor is a later iteration. Recommended.",
  },
  {
    id: "D5",
    q: "Custom PPE items: bundled-pictogram-only, or allow image upload?",
    rec: "v1: pick from the 20 bundled pictograms with a custom label/description. Upload adds storage + PDF-inlining + sanitisation work — defer. Recommended.",
  },
  {
    id: "D6",
    q: "Revision history rows on the title page?",
    rec: "Cap at 3 (current behaviour) and drop to 2 if the page would overflow A4 — the ≤1-page title rule wins. Recommended.",
  },
]

function DecisionsSection() {
  return (
    <Section
      title="Open decisions — confirm at go"
      description="Defaults are pre-picked; a plain 'go' adopts all recommendations."
    >
      <div className="space-y-2">
        {DECISIONS.map((d) => (
          <div key={d.id} className="rounded-md border bg-card p-3">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {d.id}
              </Badge>
              <div className="min-w-0 space-y-1">
                <div className="text-sm font-medium">{d.q}</div>
                <p className="text-xs text-muted-foreground">{d.rec}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-md border border-sky-500/40 bg-sky-500/5 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-sky-600" />
        Icons shown on this page (type chips, pictogram placeholders) are
        previews of the planned system, not the final artwork — the 20 PPE
        SVGs get drawn in phase 3.
      </div>
    </Section>
  )
}
