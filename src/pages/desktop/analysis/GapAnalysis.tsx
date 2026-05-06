// Gap analysis — Oppr DOCS showcase vs business-doc v1.0 vs future-state.
//
// Not an executable plan. A snapshot, a capability matrix, and a net-new
// ideas list grouped by stakeholder. Source of truth: the showcase
// codebase + oppr_business.md + oppr-docs-status.md.
//
// The standard 12-section bug-fix template was reshaped for this page —
// Evidence / RootCause / Results / ImplementationPlan don't fit a roadmap
// doc. Self-grilling stays mandatory.

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDot,
  CircleHelp,
  ClipboardCheck,
  Compass,
  Construction,
  FileText,
  GraduationCap,
  HardHat,
  Image as PhotoIcon,
  Languages,
  ListChecks,
  Map as MapIcon,
  Mic,
  Network,
  PanelsTopLeft,
  PieChart,
  Search,
  ShieldCheck,
  Sparkles,
  Telescope,
  Users,
  Wand2,
  Wrench,
  Wifi,
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function GapAnalysis() {
  return (
    <AnalysisLayout
      title="Gap analysis — DOCS showcase vs full-fat Oppr DOCS"
      subtitle="Where the v1.0 showcase stands relative to the business doc's v1.0 commitments, and what we'd add to make this a fully-fledged DOCS that's actually delightful for operators, process engineers, and operations managers. Not a plan to execute — a thinking surface to argue from."
      date="2026-05-06"
      scopes={["desktop", "mobile", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <BriefSection />
      <ScopeBoundarySection />
      <CapabilityMatrixSection />
      <BeyondSpecSection />
      <StakeholderSnapshotSection />
      <SelfGrillingSection />
      <NetNewIdeasSection />
      <RoadmapProposalSection />
      <OpenQuestionsSection />
    </AnalysisLayout>
  )
}

// --- Summary header --------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={Compass}
          label="Type"
          value="Gap analysis · snapshot"
          tone="default"
        />
        <SummaryCell
          icon={CircleDot}
          label="Coverage"
          value="DOCS module + AI/IDA-in-DOCS surface"
          tone="default"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="v1.0 spec coverage"
          value="DOCS rows 25-29 of §8 → 4 shipped, 1 partial. Cross-cutting #4/#6/#22 → 1 partial, 2 missing."
          tone="emerald"
        />
        <SummaryCell
          icon={Telescope}
          label="Beyond v1.0"
          value="33 net-new ideas grouped by persona, ranked by leverage"
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

// --- Brief -----------------------------------------------------------------

function BriefSection() {
  return (
    <Section title="What this page is, and what it isn't">
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm leading-relaxed">
          <p>
            <strong>What this is.</strong> A side-by-side of three things: (1) what's
            actually built in <code>oppr-docs/</code> right now; (2) what{" "}
            <code>oppr_business.md</code> v0.5 says v1.0 must deliver for DOCS; (3) what a
            fully-fledged DOCS could be once the v1.0 cone is closed and the platform
            keeps evolving. The third bucket is where the most useful argument happens —
            the spec is conservative on purpose; this is where we stretch.
          </p>
          <p>
            <strong>What this isn't.</strong> Not a sprint plan. Not a commitment. The
            roadmap proposal at the bottom is suggestive, not authoritative. Take it as a
            structured opinion to push back on.
          </p>
          <p>
            <strong>Honest framing.</strong> The showcase exists to prove the operator +
            process-engineer experience for a sales/internal demo. It is frontend-only,
            single-tenant, browser-resident. Anything that requires a real backend
            (multi-user auth, audit logs, webhooks, OPC UA, real QR codes, real
            cross-module integration with LOGS or IDA) is outside the showcase's job and
            therefore doesn't appear as a &quot;gap&quot; here unless v1.0 production DOCS
            explicitly needs it.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

// --- Scope boundary --------------------------------------------------------

function ScopeBoundarySection() {
  return (
    <Section title="Scope boundary">
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              In scope for this gap analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              <Bullet>DOCS authoring (TipTap editor, metadata, naming code, versioning)</Bullet>
              <Bullet>DOCS read view (desktop + mobile)</Bullet>
              <Bullet>PDF upload + viewer + chunking</Bullet>
              <Bullet>RAG / IDA over DOCS content</Bullet>
              <Bullet>Asset registry as referenced by DOCS</Bullet>
              <Bullet>SOP-to-log clickable launch (cross-module reference)</Bullet>
              <Bullet>Capabilities §8 rows 25-29, plus the cross-cutting ones #4, #6, #22</Bullet>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              Explicitly out of scope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              <Bullet>LOGS module (capture flow, log builder, scheduled rounds)</Bullet>
              <Bullet>IDA as a standalone product (we cover IDA-in-DOCS only)</Bullet>
              <Bullet>OPC UA / SCADA real-time ingest</Bullet>
              <Bullet>Bronze/silver/gold pipeline (no backend)</Bullet>
              <Bullet>Knowledge graph foundation as a service (DOCS uses joins)</Bullet>
              <Bullet>Multi-tenancy, hard isolation, billing, auth</Bullet>
              <Bullet>Insights (the standalone PLG product)</Bullet>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
      <span>{children}</span>
    </li>
  )
}

// --- Capability matrix -----------------------------------------------------

type CapStatus = "shipped" | "partial" | "missing" | "out-of-scope"

interface Capability {
  id: number
  name: string
  module: "DOCS" | "LOGS" | "IDA" | "Cross-cutting" | "Platform"
  spec: string
  showcaseStatus: CapStatus
  showcaseNote: string
  productionStatus: CapStatus
  productionNote: string
}

const CAPABILITIES: Capability[] = [
  {
    id: 25,
    name: "PDF upload and storage",
    module: "DOCS",
    spec: "Basic PDF upload, storage, retrieval. Mutares POC scope.",
    showcaseStatus: "shipped",
    showcaseNote:
      "DocumentNewPage?kind=pdf parses with pdfjs, stores BLOB in pdf_blobs (sql.js/IndexedDB), extracts per-page text into chunks. Real generated PDF for HOL-OPS-MAN-0002.",
    productionStatus: "missing",
    productionNote:
      "Needs real BLOB store (S3/GCS) + signed URLs + size cap + virus scan + de-dup hashing. Currently caps in browser memory.",
  },
  {
    id: 26,
    name: "RAG over uploaded PDFs (and DB-built docs)",
    module: "DOCS",
    spec: "Ask questions against PDF content. Mutares POC scope.",
    showcaseStatus: "shipped",
    showcaseNote:
      "Per-page chunks + Gemini embedding-2 (768-dim) + cosine top-K + streamed answers with [N] citations, scope-aware (doc/asset/library). Source grouping + cross-link badge + seed-version stale warning.",
    productionStatus: "partial",
    productionNote:
      "Move to a managed vector store, server-side embedding, multi-tenant isolation. Quality tuning (chunk sizes, hybrid retrieval) once real customer data lands.",
  },
  {
    id: 27,
    name: "Desktop authoring (database-built docs)",
    module: "DOCS",
    spec: "Open source document editor with metadata, naming convention. v1.0 build.",
    showcaseStatus: "shipped",
    showcaseNote:
      "TipTap 2.10 + 6 custom nodes (callout, ppe, diagram, launchLog, linkedAsset, stepList). Metadata panel with zod validation, NamingCodeField with auto-increment. Document templates per type. Version history drawer.",
    productionStatus: "partial",
    productionNote:
      "Manager review workflow (in_review → published gate, diff view, named approver) is missing. Audit log + e-sign for regulated environments is missing.",
  },
  {
    id: 28,
    name: "QR scan to asset-linked documents (mobile)",
    module: "DOCS",
    spec: "Operator scans a QR, sees all docs linked to that asset, can ask questions.",
    showcaseStatus: "partial",
    showcaseNote:
      "Mobile shell + simulated QR pick → asset → linked docs list works. Real camera scan is mocked (asset picker stands in). The QR scan menu (run a log / view docs / ask IDA) is absent — the showcase jumps straight to the asset detail view.",
    productionStatus: "missing",
    productionNote:
      "Real camera scan + QR generation/registration flow + the disambiguation menu (capability #6) are LOGS-platform work, not pure DOCS.",
  },
  {
    id: 29,
    name: "SOP-to-log clickable reference",
    module: "DOCS",
    spec: "An SOP can include a button that launches a specific log. Small build. Not embedding (v1.1).",
    showcaseStatus: "shipped",
    showcaseNote:
      "LaunchLogNode (TipTap atom block) + LaunchLogPicker dialog + LaunchLogModal. Clickable in editor (preview mode) and read view (handoff mode with Open-in-Oppr-LOGS CTA → toast in showcase).",
    productionStatus: "partial",
    productionNote:
      "The deep link to LOGS is a sonner toast in the showcase. Production needs a real handoff URL + auth-aware deep link + cross-module bookkeeping (which SOP launched the log for traceability).",
  },
  {
    id: 4,
    name: "Asset/QR registry decoupled from projects",
    module: "Cross-cutting",
    spec: "Assets are first-class platform objects, scoped to tenant + site. QR maps 1:1 to asset.",
    showcaseStatus: "shipped",
    showcaseNote:
      "No project model in the showcase, so trivially platform-scoped. Assets table is canonical; documents reference via document_assets join. Pin coordinates + floorplan + linked-log metadata included in the schema.",
    productionStatus: "partial",
    productionNote:
      "Production needs the LOGS-side refactor to platform-scope; DOCS just consumes the registry.",
  },
  {
    id: 6,
    name: "QR scan menu (run a log / view docs / ask IDA)",
    module: "Cross-cutting",
    spec: "Central operator interaction point after every scan.",
    showcaseStatus: "missing",
    showcaseNote:
      "Mobile flow goes scan → asset detail → docs/Ask. The disambiguation menu where scan offers run-a-log + view-docs + ask-IDA isn't built. DOCS doesn't own this surface; LOGS does.",
    productionStatus: "missing",
    productionNote:
      "LOGS-platform work. DOCS needs to expose 'docs for asset X' + 'ask IDA scoped to asset X' as deep-linkable surfaces.",
  },
  {
    id: 22,
    name: "Operator app IDA chat (voice-first, docs only)",
    module: "IDA",
    spec: "Reached via QR scan menu. Voice-first with text fallback. Scoped to docs linked to the scanned asset.",
    showcaseStatus: "partial",
    showcaseNote:
      "MobileAskPage + AskPanel (compact) cover text-first chat scoped to doc/asset/library. Voice input wired via SpeechRecognition (browser-side). Voice-first as the default mode (large mic button, push-to-talk) is not built.",
    productionStatus: "partial",
    productionNote:
      "Voice-first mode + on-device STT for offline + voice playback of answers are the production gaps.",
  },
  {
    id: 20,
    name: "Knowledge graph (assets, lines, sequences, dependencies)",
    module: "IDA",
    spec: "Basic plant knowledge graph at v1.0 — enables L3 conversational intelligence.",
    showcaseStatus: "missing",
    showcaseNote:
      "DOCS only has flat joins (document_assets, asset_logs). No upstream/downstream asset relationships, no line/sequence model, no dependency graph. RAG works on flat retrieval today.",
    productionStatus: "missing",
    productionNote:
      "Knowledge graph is platform infrastructure, not DOCS-only. DOCS would consume it (e.g., 'show docs for FCK-102 and its upstream RMR-101').",
  },
  {
    id: 23,
    name: "IDA query and feedback instrumentation",
    module: "IDA",
    spec: "Light capture of queries, answer relevance signals, follow-up patterns. Stretch v1.0.",
    showcaseStatus: "missing",
    showcaseNote:
      "qa_sessions + qa_messages persist text turns and citations, but no thumbs-up/down, no answer-was-useful flag, no implicit signals (did the user click a citation, did they regenerate).",
    productionStatus: "missing",
    productionNote:
      "Telemetry pipeline + feedback UI + storage shape for L4 learning.",
  },
  {
    id: 30,
    name: "In-app feedback button",
    module: "Platform",
    spec: "Bottom-right button on operator app. Screenshot + voice command captured for review.",
    showcaseStatus: "missing",
    showcaseNote: "Not built.",
    productionStatus: "missing",
    productionNote: "Small build. Belongs in the platform shell, not DOCS specifically.",
  },
  {
    id: 18,
    name: "External data file upload UI (desktop)",
    module: "IDA",
    spec: "Basic upload screen, validates against template. Mutares POC scope.",
    showcaseStatus: "out-of-scope",
    showcaseNote: "Not a DOCS responsibility. Out of scope for this showcase.",
    productionStatus: "out-of-scope",
    productionNote: "IDA + LOGS work.",
  },
  {
    id: 19,
    name: "Real-time SCADA/MES via OPC UA",
    module: "IDA",
    spec: "Read-only OPC UA ingestion onto unified timeline. Stretch v1.0.",
    showcaseStatus: "out-of-scope",
    showcaseNote: "Not a DOCS responsibility.",
    productionStatus: "out-of-scope",
    productionNote: "IDA + platform work.",
  },
]

function CapabilityMatrixSection() {
  const [filter, setFilter] = useState("")
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return CAPABILITIES
    return CAPABILITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.module.toLowerCase().includes(q) ||
        c.showcaseStatus.includes(q) ||
        c.productionStatus.includes(q),
    )
  }, [filter])

  const counts = useMemo(() => {
    const c = { shipped: 0, partial: 0, missing: 0, oos: 0 }
    for (const cap of CAPABILITIES) {
      if (cap.showcaseStatus === "shipped") c.shipped++
      else if (cap.showcaseStatus === "partial") c.partial++
      else if (cap.showcaseStatus === "missing") c.missing++
      else c.oos++
    }
    return c
  }, [])

  return (
    <Section
      title="Capability matrix — showcase vs v1.0 spec"
      description="Each row: a capability from oppr_business.md §8. Two columns of status — what the showcase has, and what production v1.0 still needs. Filter by keyword."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter rows…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <CountBadge label="Shipped" value={counts.shipped} status="shipped" />
              <CountBadge label="Partial" value={counts.partial} status="partial" />
              <CountBadge label="Missing" value={counts.missing} status="missing" />
              <CountBadge label="Out of scope" value={counts.oos} status="out-of-scope" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[18%]">Capability</TableHead>
                <TableHead className="w-[8%]">Module</TableHead>
                <TableHead className="w-[28%]">Showcase</TableHead>
                <TableHead className="w-[28%]">Production v1.0</TableHead>
                <TableHead className="w-[13%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cap) => (
                <TableRow key={cap.id}>
                  <TableCell className="align-top text-xs font-mono text-muted-foreground">
                    §8.{cap.id}
                  </TableCell>
                  <TableCell className="align-top text-xs font-medium">{cap.name}</TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline" className="text-[10px]">
                      {cap.module}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {cap.showcaseNote}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {cap.productionNote}
                  </TableCell>
                  <TableCell className="align-top space-y-1">
                    <StatusPill status={cap.showcaseStatus} prefix="Showcase" />
                    <StatusPill status={cap.productionStatus} prefix="Prod" />
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

function CountBadge({
  label,
  value,
  status,
}: {
  label: string
  value: number
  status: CapStatus
}) {
  return (
    <Badge className={cn("gap-1", statusBadgeClass(status))}>
      {value} {label}
    </Badge>
  )
}

function StatusPill({ status, prefix }: { status: CapStatus; prefix: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {prefix}
      </span>
      <Badge className={cn("text-[10px]", statusBadgeClass(status))}>
        {statusLabel(status)}
      </Badge>
    </div>
  )
}

function statusLabel(s: CapStatus): string {
  return s === "shipped"
    ? "shipped"
    : s === "partial"
      ? "partial"
      : s === "missing"
        ? "missing"
        : "n/a"
}

function statusBadgeClass(s: CapStatus): string {
  return s === "shipped"
    ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
    : s === "partial"
      ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
      : s === "missing"
        ? "bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:text-red-300"
        : "bg-muted text-muted-foreground"
}

// --- Beyond spec -----------------------------------------------------------

interface BeyondRow {
  title: string
  detail: string
  reason: string
}

const BEYOND_SPEC: BeyondRow[] = [
  {
    title: "Safety palette + 13 typed callouts",
    detail:
      "LOTO, hot work, electrical, confined space, working at heights, authorised, permit, cryo etc. as structured callout subtypes.",
    reason:
      "Spec only requires PPE row + generic callouts. Typed safety callouts make site-critical content RAG-retrievable as structured data, not free text. Spec doesn't ask for it; operators win when authors can't fudge it.",
  },
  {
    title: "Cross-link source badge in IDA citations",
    detail:
      "When IDA (asset scope) cites a doc not linked to the active asset, show 'Not linked to this asset' with a popover explaining and pointing at Reset Demo.",
    reason:
      "Self-diagnosing prompt for stale IndexedDB. Builds operator trust in AI answers by being honest about provenance.",
  },
  {
    title: "Seed_version stale-data toast",
    detail:
      "DbProvider compares stored seed_version vs SEED_VERSION constant on boot, fires sonner.warning if mismatched.",
    reason:
      "Showcase-specific. Solves the 'demo data drift' confusion that hit the Shredder 2A citation case.",
  },
  {
    title: "Analysis-page system + skill",
    detail:
      "/analysis/<slug> route family, side-bar group, project-level + user-level skills with stack-discovery and react-shadcn references.",
    reason:
      "Meta-tooling. Lets us argue from a browsable, frozen artifact instead of throwing markdown at each other.",
  },
  {
    title: "RelatedRail + per-message Copy/Regenerate/Stop",
    detail:
      "Under each assistant turn — other docs, assets, logs from the cited doc set; per-message actions including AbortController-backed cancel.",
    reason:
      "PRD didn't ask for it; it makes the chat feel native to operators who know Notion/Linear.",
  },
  {
    title: "TipTap layout reorder (sticky strip + togglable metadata)",
    detail:
      "h-10 sticky page strip with all controls; metadata panel toggle persists in localStorage; auto-reopens on validation error.",
    reason:
      "Spec implied 'authoring environment' without specifying density. We claimed back ~120px of canvas.",
  },
  {
    title: "Inline auto-linking of entity codes in AI answers",
    detail:
      "Codes like HOL-OPS-SOP-0001, RMR-101, HOL-OPS-LOG-0001 in the AI's markdown become clickable buttons that route to the right entity.",
    reason:
      "Builds trust in citations and makes follow-up navigation 1-click.",
  },
  {
    title: "Floorplan modal with pins + connected assets table",
    detail:
      "Click a pin → asset detail. Click an asset → highlight its pin. Hover for doc/log counts.",
    reason:
      "Spec inherits floorplan from LOGS. We rebuilt it inside DOCS so the operator can navigate without leaving the module.",
  },
]

function BeyondSpecSection() {
  return (
    <Section
      title="Built beyond what the spec asked for"
      description="Things that aren't in oppr_business.md §8 but live in the showcase. Worth keeping. Some belong upstream in the platform; some are showcase-only."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {BEYOND_SPEC.map((b) => (
            <div key={b.title} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{b.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{b.detail}</div>
                  <div className="mt-1.5 rounded border-l-2 border-primary/40 bg-primary/5 px-2 py-1 text-[11px] italic text-foreground">
                    Why it's there: {b.reason}
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

// --- Stakeholder snapshot --------------------------------------------------

interface PersonaRow {
  works: string[]
  partial: string[]
  gap: string[]
}

const PERSONA_SNAPSHOT: Record<"operator" | "engineer" | "manager" | "compliance", PersonaRow> = {
  operator: {
    works: [
      "Scan-simulated mobile flow → asset → linked SOPs/manuals",
      "PPE pictogram row + safety callouts in the doc hero",
      "Ask IDA scoped to the asset they're standing in front of",
      "Voice input via SpeechRecognition (browser STT)",
      "Recently viewed + pinned docs",
      "Real PDF reader on mobile with page deep-link from citations",
    ],
    partial: [
      "Voice-first answers (text answers exist; voice playback isn't wired)",
      "Launch-log handoff (modal exists; deep-link to real LOGS doesn't)",
    ],
    gap: [
      "Real QR scanner with camera permission",
      "Offline reading of cached docs (sw + IndexedDB tiers)",
      "Multilingual SOP reading (translate in the read view)",
      "Permits / sign-off flow (today metadata only)",
    ],
  },
  engineer: {
    works: [
      "TipTap editor with 6 custom blocks + safety palette",
      "Metadata panel + naming convention enforcement",
      "Document templates per type (SOP / Manual / WI / LMRA)",
      "Version history drawer",
      "Linked assets + launch-log inline references",
      "Group by type + filters in the library",
    ],
    partial: [
      "Versioning (v1, v2 stored — no diff view between versions)",
      "Tags (free text — no controlled vocabulary, no taxonomy)",
    ],
    gap: [
      "AI-assisted authoring (rewrite, simplify, translate, suggest steps)",
      "Cross-doc reference graph (which SOPs reference which)",
      "Bulk operations (re-tag, re-assign asset, re-publish a folder)",
      "Comments / annotations on draft SOPs from peer reviewers",
    ],
  },
  manager: {
    works: [
      "Library overview with status filters",
      "Asset detail with linked-doc count",
      "Floorplan with pin overlays",
      "Ask IDA across the whole library",
    ],
    partial: [
      "Status badges (draft / in_review / published) but no review workflow",
    ],
    gap: [
      "Approval workflow (named reviewers, in_review → published gate)",
      "Audit log (who edited what, when, why)",
      "Doc usage analytics (views per SOP, time spent, where operators drop off)",
      "Compliance reporting (SOPs out-of-date past 12 months, missing PPE on hazardous work)",
      "Cross-shift / cross-site rollouts",
    ],
  },
  compliance: {
    works: [
      "Authoring → in_review → published status",
      "Naming convention enforced",
      "Document versioning (immutable past versions on publish)",
    ],
    partial: [
      "Asset linking (works) but no regulatory/site coverage roll-up",
    ],
    gap: [
      "E-signatures on publish (21 CFR Part 11 territory)",
      "Periodic re-validation reminders (every 12 months)",
      "Compliance tags (ISO 9001 §X, OSHA §Y, GDPR §Z)",
      "Read-receipts (operator confirms 'I read this updated SOP')",
      "Export package — all SOPs as a sealed PDF bundle for an audit",
    ],
  },
}

function StakeholderSnapshotSection() {
  return (
    <Section
      title="Per-stakeholder snapshot"
      description="What works, what's partial, and what's missing — sliced by who's actually using the tool."
    >
      <Tabs defaultValue="operator">
        <TabsList>
          <TabsTrigger value="operator" className="gap-1">
            <HardHat className="h-3.5 w-3.5" />
            Operator
          </TabsTrigger>
          <TabsTrigger value="engineer" className="gap-1">
            <Wrench className="h-3.5 w-3.5" />
            Process engineer
          </TabsTrigger>
          <TabsTrigger value="manager" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            Operations manager
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compliance / safety
          </TabsTrigger>
        </TabsList>
        {(["operator", "engineer", "manager", "compliance"] as const).map((k) => (
          <TabsContent key={k} value={k}>
            <PersonaCard row={PERSONA_SNAPSHOT[k]} />
          </TabsContent>
        ))}
      </Tabs>
    </Section>
  )
}

function PersonaCard({ row }: { row: PersonaRow }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <PersonaColumn
        title="Works today"
        icon={CheckCircle2}
        items={row.works}
        tone="emerald"
      />
      <PersonaColumn
        title="Partial"
        icon={CircleDashed}
        items={row.partial}
        tone="amber"
      />
      <PersonaColumn
        title="Missing"
        icon={XCircle}
        items={row.gap}
        tone="red"
      />
    </div>
  )
}

function PersonaColumn({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string
  icon: typeof Circle
  items: string[]
  tone: "emerald" | "amber" | "red"
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-red-500/30 bg-red-500/5"
  const iconClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"
  return (
    <Card className={cn(toneClass)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs">
          <Icon className={cn("h-3.5 w-3.5", iconClass)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5 text-xs">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// --- Self grilling ---------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Honest counter-hypotheses on this snapshot. The bar: at least one uncomfortable question per page."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Am I overstating 'shipped' on capability §8.27 (desktop authoring)?"
            a="Probably yes by a small margin. The TipTap editor is solid for happy-path authoring (text, lists, tables, custom blocks, metadata, naming code, versioning). What's missing for production: a manager review gate (in_review → published with a named approver), version-to-version diff, e-signatures, audit log of who edited what. Calling §8.27 'shipped in showcase' is true; calling it 'shipped for production v1.0' is not. Marked partial in the production column for that reason."
          />
          <Grill
            q="The showcase claims §8.26 (RAG over PDFs) is shipped. What would make it fall over with real customer data?"
            a="Three things: (1) chunk size — we use whole pages for PDFs and one paragraph for TipTap, which works on the 12-doc seed but degrades on 500-page manuals. (2) embedding consistency — Settings → Reset is the only path to re-embed; production needs a background job. (3) hybrid retrieval — pure cosine misses queries with rare entity codes; production needs BM25 or keyword + semantic. The flag-of-honesty is that the showcase RAG works because the seed is small and well-structured."
          />
          <Grill
            q="Is the QR scan menu (§8.6) really not DOCS's problem?"
            a="Mostly yes — LOGS owns the scan flow + disambiguation. But DOCS has to expose the right deep links: /m/assets/<id> for 'view documents' and /m/ask?scope=asset:<id> for 'ask IDA'. Both exist in the showcase. So DOCS's piece is shipped; the menu shell that LOGS draws is not, and the gap analysis correctly attributes that to LOGS."
          />
          <Grill
            q="Why is 'voice-first IDA' marked partial when speech recognition works?"
            a="Because operators need voice-first as the primary mode (large mic button, push-to-talk, voice playback of answers), not as a tap-then-also-talk affordance. The showcase has the latter. For an operator at the press with gloves on, the difference is the difference between 'tool I use' and 'tool I bypass'. Calling it 'shipped' would be a lie."
          />
          <Grill
            q="What's the most uncomfortable thing on this page?"
            a="That none of the manager/compliance gaps map to v1.0 spec lines. The business doc is operator-and-engineer heavy. Approvals, audit logs, e-sign, periodic re-validation, read-receipts — all of these matter for a real production rollout in regulated/quality-conscious environments, and none of them are in §8. If we ship v1.0 to spec, we'll learn this from the first customer who asks 'how do I prove SOP-A version-3 was approved by Maya on 2026-08-01'. Worth raising before that conversation happens."
          />
          <Grill
            q="Are 33 net-new ideas too many?"
            a="Yes — most won't ship and that's fine. The list's job is to surface the ones we'd want to argue about. If we cut to the 5 highest-leverage and the rest go in the parking lot, the AI-authoring trio (rewrite, suggest-from-LOGS, translate), the manager review workflow, and read-receipt + audit log are the obvious five. Everything else is interesting but not first."
          />
          <Grill
            q="Could the analysis-page system itself become a feature?"
            a="Speculative. 'Inline post-mortems on a /docs route' for customer engineers to document their own configuration choices is a stretch — but operators don't need this. Process engineers might. Worth flagging as a future-Insights-tie-in but not a v1.0 line item."
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

// --- Net-new ideas ---------------------------------------------------------

interface IdeaRow {
  title: string
  description: string
  leverage: "high" | "med" | "low"
  effort: "S" | "M" | "L"
  icon: typeof Sparkles
}

const IDEAS_AUTHORING: IdeaRow[] = [
  {
    title: "AI rewrite / simplify in selection",
    description:
      "Select a paragraph, hit ⌘K, choose 'Rewrite for operator clarity' / 'Tighten' / 'Translate to NL/FR'. Streams replacement diff. Audit-logged.",
    leverage: "high",
    effort: "M",
    icon: Wand2,
  },
  {
    title: "Suggest steps from a LOGS pattern",
    description:
      "IDA-in-DOCS flag: 'I see Quality check — Mixer fired 14× in Q1, 12 of them had \"feedstock too wet\" in the voice note. Suggest a Step 0 of the SOP: verify moisture content before mixer start.' One-click insert as a draft step.",
    leverage: "high",
    effort: "L",
    icon: Sparkles,
  },
  {
    title: "AI safety review before publish",
    description:
      "On Publish, IDA scans the doc: 'Step 4 mentions hot-work but no Hot-work callout. Step 7 implies energised work but no LOTO.' Suggests insertions; user accepts/rejects each.",
    leverage: "high",
    effort: "M",
    icon: ShieldCheck,
  },
  {
    title: "Auto-generate naming code suggestions",
    description:
      "Given title + type + linked assets, IDA proposes the next available naming code under the site/dept convention. Currently the field is manual with auto-increment-on-conflict.",
    leverage: "med",
    effort: "S",
    icon: BookOpen,
  },
  {
    title: "Speech-to-SOP",
    description:
      "Engineer talks through the procedure in voice; system structures it into Steps + safety callouts + PPE row. Manual cleanup pass before review.",
    leverage: "high",
    effort: "L",
    icon: Mic,
  },
  {
    title: "Live SOP feedback while operator runs (v1.1)",
    description:
      "Operator on mobile, step 3 of an SOP. They tap 'something's off' → voice note → IDA flags it to the doc owner with the step anchor. Becomes a v1.1 item.",
    leverage: "med",
    effort: "L",
    icon: ListChecks,
  },
  {
    title: "Block-level comments / annotations",
    description:
      "Reviewer drops a comment on a paragraph or step. Doc owner sees a comment thread per block. Resolves on merge.",
    leverage: "med",
    effort: "M",
    icon: ClipboardCheck,
  },
  {
    title: "Bulk operations on the library",
    description:
      "Select N docs → re-tag, re-assign asset, schedule re-validation, mass-publish a folder. Today every action is per-doc.",
    leverage: "med",
    effort: "M",
    icon: PanelsTopLeft,
  },
  {
    title: "Cross-doc reference graph",
    description:
      "Visual map: 'this SOP references HOL-OPS-SOP-0003 in step 5; that one references this back'. Find orphans, find circular references, find heavy hubs.",
    leverage: "low",
    effort: "M",
    icon: Network,
  },
]

const IDEAS_OPERATOR: IdeaRow[] = [
  {
    title: "Multilingual SOP reading on the fly",
    description:
      "Operator picks language from the read view header. Body translated in-place by IDA, with original code/PPE/safety blocks preserved.",
    leverage: "high",
    effort: "M",
    icon: Languages,
  },
  {
    title: "Voice playback of SOP steps",
    description:
      "Read mode → tap speaker icon → SOP narrated step-by-step. Hands-busy operator on the floor scenario.",
    leverage: "high",
    effort: "S",
    icon: Mic,
  },
  {
    title: "Offline cache for frequently-viewed docs",
    description:
      "Service worker + IndexedDB tier. Last-N viewed SOPs available without network. Stale-while-revalidate semantics.",
    leverage: "high",
    effort: "M",
    icon: Wifi,
  },
  {
    title: "Read-receipt on updated SOPs",
    description:
      "When a SOP is republished, operators on the assigned shift are pinged. They mark 'I read this' from the read view. Manager dashboards roll up the percentage.",
    leverage: "high",
    effort: "M",
    icon: ClipboardCheck,
  },
  {
    title: "Step-by-step run mode (read view variant)",
    description:
      "Tap a Steps block → fullscreen, one step at a time, swipe to advance. Optional sign-off per step. Distinct from 'logs embedded in SOPs' (which is v1.1).",
    leverage: "med",
    effort: "M",
    icon: ListChecks,
  },
  {
    title: "Inline 'ask about this paragraph'",
    description:
      "Long-press / right-click any block → 'Ask IDA about this'. Pre-fills the chat with that block's text + scope.",
    leverage: "med",
    effort: "S",
    icon: Search,
  },
  {
    title: "Photo annotations in steps",
    description:
      "Operator can pin annotations on diagrams (arrows, circles) at run time, sent back to the doc owner as a feedback packet.",
    leverage: "low",
    effort: "M",
    icon: PhotoIcon,
  },
  {
    title: "Map-drive navigation from QR scan",
    description:
      "Scan QR for asset X → if asset is part of a Round, surface 'continue with Round Y' as the highlighted CTA (per spec §4.5). Showcase pretends QR scan via picker.",
    leverage: "med",
    effort: "M",
    icon: MapIcon,
  },
]

const IDEAS_MANAGER: IdeaRow[] = [
  {
    title: "Manager review workflow with named reviewer",
    description:
      "in_review → published gate enforced by RBAC. Reviewer left a comment per block. Audit log records who/when/comment.",
    leverage: "high",
    effort: "M",
    icon: ShieldCheck,
  },
  {
    title: "Doc usage analytics",
    description:
      "Views per SOP per shift, time-to-read, sections where readers drop off, which assets the doc was accessed from. Dashboard tile.",
    leverage: "high",
    effort: "M",
    icon: PieChart,
  },
  {
    title: "Periodic re-validation reminders",
    description:
      "Each doc has a re-validate-by date. 30 days before, doc owner gets a sonner + email. Manager dashboard shows overdue.",
    leverage: "high",
    effort: "S",
    icon: ClipboardCheck,
  },
  {
    title: "Audit log + diff per version",
    description:
      "Versions table + per-version JSON-patch diff. Manager opens v3 → 'show diff vs v2' → marked-up view. Includes who/what/when.",
    leverage: "high",
    effort: "M",
    icon: BookOpen,
  },
  {
    title: "Compliance roll-ups (overdue, missing safety blocks, no PPE)",
    description:
      "Manager view: 'all SOPs touching FCK-102 with their last-validated date and which safety blocks they have'. Surfaces gaps before an audit does.",
    leverage: "high",
    effort: "M",
    icon: ShieldCheck,
  },
  {
    title: "Cross-shift / cross-site rollout state",
    description:
      "When a SOP is published at site HOL, manager sees 'this is v3 here, sites WAR and ROT are still on v2'. Roll out / hold per site.",
    leverage: "med",
    effort: "L",
    icon: Boxes,
  },
  {
    title: "SOP retire / archive + replacement chain",
    description:
      "'This SOP is retired and replaced by HOL-OPS-SOP-0017'. Old SOP marked archived; deep-link redirect; chain visible in version history.",
    leverage: "med",
    effort: "S",
    icon: BookOpen,
  },
]

const IDEAS_COMPLIANCE: IdeaRow[] = [
  {
    title: "E-signatures on Publish (21 CFR Part 11 lane)",
    description:
      "Reviewer + author sign with re-auth. Hash committed to the version row. Optional for non-regulated; mandatory for pharma/food.",
    leverage: "high",
    effort: "L",
    icon: ShieldCheck,
  },
  {
    title: "Compliance tags (ISO/OSHA/GDPR)",
    description:
      "Tag a doc with regulatory anchors. Auditor view filters by tag. RAG can answer 'show me all GDPR-tagged WIs'.",
    leverage: "med",
    effort: "S",
    icon: BookOpen,
  },
  {
    title: "Sealed audit export bundle",
    description:
      "Manager picks date range or asset → all SOPs at that date as a PDF bundle with a tamper-evident manifest.",
    leverage: "med",
    effort: "M",
    icon: BookOpen,
  },
  {
    title: "Operator read-receipt history",
    description:
      "Per operator: which SOP versions they've acknowledged, with timestamps. Aggregates to manager.",
    leverage: "high",
    effort: "M",
    icon: ClipboardCheck,
  },
  {
    title: "Permit issuance flow for hot-work / LOTO",
    description:
      "When an operator opens an SOP that contains a Permit-required callout, the read view surfaces 'Issue permit' → captures permit data → links it to the log execution.",
    leverage: "med",
    effort: "L",
    icon: ShieldCheck,
  },
]

const IDEAS_PLATFORM: IdeaRow[] = [
  {
    title: "Real QR generation + registration UI",
    description:
      "Print-ready QR sheets per asset; bulk register; rotate qr_token without changing asset_id.",
    leverage: "high",
    effort: "M",
    icon: Boxes,
  },
  {
    title: "Knowledge graph foundation (asset relationships)",
    description:
      "Upstream/downstream, line membership, parent/child. DOCS reads from it for 'docs for FCK-102 + its upstream RMR-101' queries.",
    leverage: "high",
    effort: "L",
    icon: Network,
  },
  {
    title: "IDA telemetry + thumbs up/down",
    description:
      "Capture which answers the user found useful, which citations they clicked, which they regenerated. Feeds future learning loop.",
    leverage: "med",
    effort: "S",
    icon: Sparkles,
  },
  {
    title: "Webhook out on publish",
    description:
      "When a doc publishes, fire a webhook with the new version. Lets customers push to MES, intranet, training systems.",
    leverage: "med",
    effort: "S",
    icon: Construction,
  },
  {
    title: "Localised seed for demos in NL/FR/DE/ES",
    description:
      "Pre-translated seed + UI strings so the showcase can be opened in front of customer engineers in their own language.",
    leverage: "low",
    effort: "S",
    icon: Languages,
  },
  {
    title: "Onboarding wizard for the customer engineer",
    description:
      "Step 1: pick a site. Step 2: import asset list + floorplan. Step 3: import 1-2 SOPs. Step 4: walk through QR scan → ask IDA. Cuts to demo from 2 hours to 20 minutes.",
    leverage: "high",
    effort: "M",
    icon: GraduationCap,
  },
]

function NetNewIdeasSection() {
  return (
    <Section
      title="Net-new ideas — beyond the v1.0 spec"
      description="Things the business doc doesn't ask for but would make DOCS materially better. Grouped by stakeholder. Rated by leverage (high/med/low) and rough effort (S/M/L). The point is to argue about what's worth picking up next, not to commit to all of them."
    >
      <Tabs defaultValue="authoring">
        <TabsList className="flex-wrap">
          <TabsTrigger value="authoring" className="gap-1">
            <Wrench className="h-3.5 w-3.5" />
            Authoring
          </TabsTrigger>
          <TabsTrigger value="operator" className="gap-1">
            <HardHat className="h-3.5 w-3.5" />
            Operator
          </TabsTrigger>
          <TabsTrigger value="manager" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            Manager
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-1">
            <Boxes className="h-3.5 w-3.5" />
            Platform
          </TabsTrigger>
        </TabsList>
        <TabsContent value="authoring">
          <IdeaGrid ideas={IDEAS_AUTHORING} />
        </TabsContent>
        <TabsContent value="operator">
          <IdeaGrid ideas={IDEAS_OPERATOR} />
        </TabsContent>
        <TabsContent value="manager">
          <IdeaGrid ideas={IDEAS_MANAGER} />
        </TabsContent>
        <TabsContent value="compliance">
          <IdeaGrid ideas={IDEAS_COMPLIANCE} />
        </TabsContent>
        <TabsContent value="platform">
          <IdeaGrid ideas={IDEAS_PLATFORM} />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function IdeaGrid({ ideas }: { ideas: IdeaRow[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ideas.map((idea) => {
        const Icon = idea.icon
        return (
          <Card key={idea.title}>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="text-sm font-semibold leading-tight">{idea.title}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <LeverageBadge lev={idea.leverage} />
                  <EffortBadge effort={idea.effort} />
                </div>
              </div>
              <div className="pl-6 text-xs text-muted-foreground">{idea.description}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function LeverageBadge({ lev }: { lev: "high" | "med" | "low" }) {
  return (
    <Badge
      className={cn(
        "text-[9px]",
        lev === "high"
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : lev === "med"
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-muted text-muted-foreground",
      )}
    >
      {lev} lev
    </Badge>
  )
}

function EffortBadge({ effort }: { effort: "S" | "M" | "L" }) {
  return (
    <Badge variant="outline" className="text-[9px]">
      {effort}
    </Badge>
  )
}

// --- Roadmap proposal ------------------------------------------------------

interface PhaseRow {
  phase: string
  goal: string
  items: string[]
}

const PHASES: PhaseRow[] = [
  {
    phase: "P0 — close the v1.0 cone (3-4 weeks)",
    goal: "Make every §8 row marked 'partial' or 'missing' for showcase-or-production go to 'shipped' in the showcase.",
    items: [
      "Manager review workflow (in_review → published, named reviewer, gate)",
      "Voice-first mobile IDA (large mic button, push-to-talk, voice playback)",
      "IDA telemetry: thumbs up/down + click-to-cite signals",
      "Real QR scan affordance (camera permission + fallback to picker)",
      "Doc-version diff view in VersionHistoryDrawer",
    ],
  },
  {
    phase: "P1 — AI-assisted authoring (4-6 weeks)",
    goal: "Move DOCS from 'we author SOPs by hand' to 'we draft 80% with IDA, polish 20%'. Highest leverage idea cluster.",
    items: [
      "Selection-based rewrite/simplify/translate",
      "AI safety review before Publish",
      "Suggest steps from a LOGS pattern (cross-module — needs IDA-LOGS link)",
      "Block-level comments / annotations",
      "Speech-to-SOP",
    ],
  },
  {
    phase: "P2 — operator delight (3-4 weeks)",
    goal: "Make the read view stickier so operators actually keep DOCS open instead of WhatsApp.",
    items: [
      "Multilingual reading + voice playback",
      "Offline cache for frequently-viewed docs",
      "Read-receipt on updated SOPs",
      "Step-by-step run mode in the read view",
      "Inline 'ask about this paragraph'",
    ],
  },
  {
    phase: "P3 — manager / compliance lane (4-6 weeks)",
    goal: "Make DOCS defensible at audit time. Targets the gap that v1.0 spec is silent on.",
    items: [
      "Doc usage analytics + dashboard",
      "Periodic re-validation reminders",
      "Audit log + diff per version",
      "Compliance roll-ups + tags (ISO/OSHA)",
      "E-signatures (gate behind a tenant flag)",
      "Sealed audit export bundle",
    ],
  },
  {
    phase: "P4 — platform leverage (open-ended)",
    goal: "Unlock cross-module + multi-customer features once the cone is closed.",
    items: [
      "Knowledge graph foundation",
      "Webhook out on publish",
      "Localised demos (NL/FR/DE/ES)",
      "Onboarding wizard",
      "Cross-doc reference graph",
    ],
  },
]

function RoadmapProposalSection() {
  return (
    <Section
      title="Phased roadmap proposal"
      description="One way to sequence the gaps + new ideas. Phases are sized in calendar weeks, not sprints. Argue with this — it's a starting opinion, not a plan."
    >
      <div className="space-y-3">
        {PHASES.map((p, i) => (
          <Card key={p.phase}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {i}
                </span>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm">{p.phase}</CardTitle>
                  <CardDescription className="text-xs">{p.goal}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 pl-10 text-xs">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary opacity-60" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// --- Open questions --------------------------------------------------------

function OpenQuestionsSection() {
  return (
    <Section
      title="Open questions for the team"
      description="Things this gap analysis can't answer alone. Worth arguing about before any of these phases get committed."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Q>
            <strong>Do we ship the v1.0 spec exactly,</strong> or do we ship the spec + a
            small slice of P3 (audit log + read-receipts) so the first regulated customer
            doesn't bounce?
          </Q>
          <Q>
            <strong>How do we draw the boundary between DOCS and IDA</strong> when
            features like 'AI rewrite in selection' live inside the editor but call into
            the IDA model? Is this a DOCS feature, an IDA feature, or a new
            'IDA-in-DOCS' surface that gets its own quotas / pricing?
          </Q>
          <Q>
            <strong>Operator IDA: voice-first or chat-first?</strong> The spec says voice-first.
            The showcase ships chat-first because chat is faster to build. If voice-first
            is the actual primary mode, we need to invest more — push-to-talk UX, voice
            playback, latency budget.
          </Q>
          <Q>
            <strong>Knowledge graph at v1.0:</strong> the spec says 'basic plant
            knowledge graph'. Is that a graph database, a few SQL relations, or a JSON
            blob per asset listing relationships? The cost spread across those three is
            wildly different.
          </Q>
          <Q>
            <strong>Multi-language: machine translate at runtime, or pre-translate per
            doc?</strong> First is one-feature, all-docs but expensive per query. Second
            is structured (translation memory) but doubles authoring effort. Hybrid is
            possible.
          </Q>
          <Q>
            <strong>If a customer is non-regulated, do they still want the audit
            trail?</strong> My instinct: yes — operations managers want it for shift-quality
            reasons even if compliance doesn't require it. Worth confirming.
          </Q>
          <Q>
            <strong>Are 'live SOP feedback' and 'logs embedded in SOPs'</strong> truly
            v1.1, or could a thin version of either land in v1.0 as an experimental flag
            that improves the operator demo?
          </Q>
        </CardContent>
      </Card>
      <Alert className="border-primary/30 bg-primary/5">
        <CircleHelp className="h-4 w-4" />
        <AlertTitle>Use this page to argue</AlertTitle>
        <AlertDescription>
          This isn't a plan. It's a thinking surface. Tell me which capability rows you
          disagree with, which net-new ideas should be killed, which open questions matter
          most. The next analysis page is the actual plan we commit to.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function Q({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>{children}</div>
    </div>
  )
}
