// Migration analysis — frontend-only showcase → Convex + Vercel production app.
//
// Static planning artifact. Documents every subsystem in the current build,
// the target shape on Convex, and the migration steps. The standard bug-fix
// 12-section template is reshaped: there are no screenshots, no Results yet,
// and no Root-cause walkthrough — instead the meat is a per-surface
// migration table. Self-grilling stays mandatory.

import { useState } from "react"
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Database,
  FileText,
  Globe,
  KeyRound,
  ListChecks,
  Lock,
  Mail,
  Network,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
  Zap,
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function FrontendToConvexMigrationAnalysis() {
  return (
    <AnalysisLayout
      title="Frontend-only showcase → Convex + Vercel production app"
      subtitle="Today the entire app runs in the browser: sql.js + IndexedDB for persistence, BroadcastChannel for cross-tab sync, Gemini called directly from the client with a VITE_ key. To turn this into a real multi-user tool we move state to Convex, gate access to @oppr.ai emails via Convex Auth, push AI calls server-side, switch PDF and uploaded-file storage to Convex, and deploy the Vite bundle on Vercel. This page maps every surface that has to change."
      date="2026-05-06"
      scopes={["desktop", "mobile", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemStatementSection />
      <ArchitectureDiagramsSection />
      <SurfaceMigrationSection />
      <AuthFlowMockSection />
      <UploadFlowMockSection />
      <EdgeCasesSection />
      <SelfGrillingSection />
      <PhasedPlanSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

// --- Summary header card ---------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="Single-browser app: no auth, no shared state, AI key visible in client, no real uploads"
          tone="destructive"
        />
        <SummaryCell
          icon={Sparkles}
          label="Status"
          value="Open · planning"
          tone="default"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="Not started · ~16 surfaces to migrate · 5 phases"
          tone="default"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="—  (will be tsc -b ✓ · vite build ✓ · convex deploy ✓ · vercel deploy ✓)"
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
        <AlertTitle>The showcase architecture cannot scale to a real tool</AlertTitle>
        <AlertDescription>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>
              <strong>No identity.</strong> Anyone who hits the URL gets full access. There
              is no way to scope data to a user, a tenant, or even &quot;people we work with&quot;.
            </li>
            <li>
              <strong>No shared state.</strong> Persistence is{" "}
              <code>sql.js</code> →{" "}
              <code>IndexedDB</code>, scoped to a single browser profile. Cross-tab sync via{" "}
              <code>BroadcastChannel</code> only spans one window's tabs. Two users on two
              devices will never see the same library.
            </li>
            <li>
              <strong>AI key in the browser.</strong>{" "}
              <code>VITE_GEMINI_API_KEY</code> is bundled into the client JS. Anyone with
              devtools can read it. Acceptable for a sales demo, unacceptable for a real
              deployment.
            </li>
            <li>
              <strong>No real uploads.</strong> The &quot;PDF upload&quot; flow stuffs the file as a
              BLOB into a SQLite row inside IndexedDB. It works for one demo PDF; it falls
              over the moment we need attachments, photos, or shared documents at scale.
            </li>
            <li>
              <strong>No deploy story.</strong> The app runs on{" "}
              <code>localhost:5173</code> only. There is no production URL, no environment
              separation, no deploy pipeline.
            </li>
          </ol>
          <p className="mt-3 text-sm">
            We need to migrate to a real backend (Convex), wire authentication restricted
            to <code>@oppr.ai</code> emails, host on Vercel, and re-build every persistence
            and AI call against the server.
          </p>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// --- 2. Architecture diagrams (current vs target) -------------------------

function ArchitectureDiagramsSection() {
  return (
    <Section
      title="Architecture — before and after"
      description="No screenshots: this is a stack diagram, not a UI bug. Both diagrams render with the same shadcn primitives so the gap is visible at a glance."
    >
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current — frontend-only</TabsTrigger>
          <TabsTrigger value="target">Target — Convex + Vercel</TabsTrigger>
        </TabsList>
        <TabsContent value="current">
          <CurrentArchDiagram />
        </TabsContent>
        <TabsContent value="target">
          <TargetArchDiagram />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function ArchBox({
  title,
  subtitle,
  icon: Icon,
  tone = "muted",
  children,
}: {
  title: string
  subtitle?: string
  icon: typeof Database
  tone?: "muted" | "primary" | "destructive" | "emerald" | "amber"
  children?: React.ReactNode
}) {
  const toneClass = {
    muted: "border-border bg-muted/30",
    primary: "border-primary/40 bg-primary/5",
    destructive: "border-destructive/40 bg-destructive/5",
    emerald: "border-emerald-500/40 bg-emerald-500/5",
    amber: "border-amber-500/40 bg-amber-500/5",
  }[tone]
  return (
    <div className={cn("rounded-md border p-3", toneClass)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {subtitle}
        </div>
      )}
      {children && <div className="mt-2 space-y-1 text-[11px] leading-relaxed">{children}</div>}
    </div>
  )
}

function CurrentArchDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Today: everything in the browser</CardTitle>
        <CardDescription>
          Two windows (desktop + mobile popup) share one IndexedDB blob via BroadcastChannel.
          Gemini is called directly with a key the client can read.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-dashed bg-muted/20 p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Browser
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ArchBox title="Desktop window" subtitle="/" icon={Globe} tone="primary">
              DesktopShell · Library · Editor · Settings
            </ArchBox>
            <ArchBox title="Mobile popup" subtitle="/m" icon={Globe} tone="primary">
              MobileShell · Scan · Asset · Doc · Ask
            </ArchBox>
          </div>
          <div className="my-3 flex items-center justify-center text-xs text-muted-foreground">
            <ChevronRight className="h-3 w-3 rotate-90" />
            <span className="px-2">BroadcastChannel("oppr-docs")</span>
            <ChevronRight className="h-3 w-3 rotate-90" />
          </div>
          <ArchBox
            title="sql.js (WASM) → IndexedDB"
            subtitle="oppr-docs-db"
            icon={Database}
            tone="amber"
          >
            12 tables · 500 ms debounced persist · BLOB-in-row PDFs · embeddings as JSON
            arrays · ~140 chunks
          </ArchBox>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ArchBox title="Gemini API" subtitle="key in client" icon={Zap} tone="destructive">
              <code className="text-[10px]">VITE_GEMINI_API_KEY</code> — embedded in bundle
              · <code>gemini-embedding-2</code> · <code>gemini-3.1-flash-lite-preview</code>
            </ArchBox>
            <ArchBox title="No identity" icon={Lock} tone="destructive">
              No auth · no users · no row-level scoping
            </ArchBox>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Strengths: zero infra, fast to demo, deterministic seed. Limits: nothing crosses
          a device boundary.
        </div>
      </CardContent>
    </Card>
  )
}

function TargetArchDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Target: Convex + Vercel</CardTitle>
        <CardDescription>
          Vercel hosts the Vite bundle. Convex owns the database, file storage, vector index,
          server-side AI calls, and Convex Auth — gated to <code>@oppr.ai</code> at the
          identity callback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-dashed bg-muted/20 p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Vercel (edge)
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ArchBox title="Desktop window" subtitle="docs.oppr.ai" icon={Globe} tone="primary">
              DesktopShell · auth-gated · ConvexProvider
            </ArchBox>
            <ArchBox title="Mobile popup" subtitle="docs.oppr.ai/m" icon={Globe} tone="primary">
              MobileShell · same auth context · ConvexProvider
            </ArchBox>
          </div>
          <div className="my-3 flex items-center justify-center text-xs text-muted-foreground">
            <ChevronRight className="h-3 w-3 rotate-90" />
            <span className="px-2">Convex client (websocket subscriptions)</span>
            <ChevronRight className="h-3 w-3 rotate-90" />
          </div>
        </div>
        <div className="rounded-lg border border-dashed bg-muted/20 p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Convex (cloud)
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ArchBox title="Convex Auth" icon={KeyRound} tone="emerald">
              Magic-link or OAuth · server-side check rejects emails not ending in{" "}
              <code>@oppr.ai</code>
            </ArchBox>
            <ArchBox title="Convex DB" icon={Database} tone="emerald">
              users · documents · documentVersions · assets · chunks · qaSessions · qaMessages
              — all reactive
            </ArchBox>
            <ArchBox title="Convex File Storage" icon={Upload} tone="emerald">
              PDFs · uploaded attachments · accessed via signed URLs ·{" "}
              <code>storage.generateUploadUrl()</code>
            </ArchBox>
            <ArchBox title="Convex Vector Index" icon={Search} tone="emerald">
              <code>chunks.embedding</code> field · <code>vectorSearch()</code> replaces
              client-side cosine top-k
            </ArchBox>
            <ArchBox title="Convex Action: askQuestion" icon={Server} tone="emerald">
              Gemini key in env · streaming via Convex action → HTTP streaming endpoint ·
              persists messages on completion
            </ArchBox>
            <ArchBox title="Convex Action: embedChunks" icon={Network} tone="emerald">
              Triggered on document publish · backfills missing embeddings · idempotent
            </ArchBox>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Strengths: real multi-user, server-side secrets, sharable URL, real-time sync via
          subscriptions for free, no BroadcastChannel needed. Cost: a paid Convex plan, ~$25/mo at this scale.
        </div>
      </CardContent>
    </Card>
  )
}

// --- 3. Surface migration table -------------------------------------------

interface SurfaceRow {
  surface: string
  current: string
  target: string
  files: string[]
  effort: "S" | "M" | "L" | "XL"
  risk: "low" | "med" | "high"
}

const SURFACES: SurfaceRow[] = [
  {
    surface: "Persistence — relational rows",
    current: "sql.js + 12-table schema in src/db/schema.sql, persisted to IndexedDB key 'oppr-docs-db'",
    target: "Convex tables defined in convex/schema.ts; one-to-one with current SQLite tables (users, documents, documentVersions, documentAssets, assets, logs, documentLogRefs, chunks, qaSessions, qaMessages, meta). Drop pdf_blobs (becomes file storage). Repositories in src/db/repositories/* become Convex queries/mutations.",
    files: ["convex/schema.ts", "convex/documents.ts", "convex/assets.ts", "convex/qa.ts", "src/db/repositories/* (delete)"],
    effort: "L",
    risk: "med",
  },
  {
    surface: "Authentication",
    current: "None. Anyone with the URL has full access.",
    target: "Convex Auth with magic-link provider. authConfig.ts validates that the verified email ends in '@oppr.ai'; rejection happens in the auth callback before a session is issued. New users are inserted into users table on first sign-in. ConvexAuthProvider wraps App.tsx; <SignInForm /> guards everything else.",
    files: ["convex/auth.config.ts", "convex/auth.ts", "src/auth/SignInForm.tsx", "src/App.tsx"],
    effort: "M",
    risk: "med",
  },
  {
    surface: "User identity & ownership",
    current: "documents.owner_id is a hardcoded user from the seed; nothing enforces it.",
    target: "Every Convex query takes ctx.auth.getUserIdentity(); writes set ownerId from the authenticated identity; row-level checks reject reads/writes the user shouldn't see (in v1: all @oppr.ai users see everything; multi-tenant scoping is a v2 concern).",
    files: ["convex/lib/auth.ts (helper)", "convex/*.ts"],
    effort: "S",
    risk: "low",
  },
  {
    surface: "RAG / embeddings",
    current: "Embeddings stored as JSON arrays in embeddings.vector_json. Cosine top-k computed in browser via src/ai/similarity.ts. Backfill happens lazily on first query.",
    target: "chunks table in Convex has a vector index on the embedding field (768 dims). retrieveForQuery becomes a Convex query that calls ctx.vectorSearch('chunks', ...). Backfill becomes an internal action triggered on document publish.",
    files: ["convex/chunks.ts", "convex/ai/embed.ts", "convex/ai/retrieve.ts", "src/ai/embeddings.ts (delete)", "src/ai/similarity.ts (delete)", "src/ai/retrieval.ts (delete)"],
    effort: "L",
    risk: "med",
  },
  {
    surface: "AI generation (Gemini chat)",
    current: "src/ai/chat.ts — askQuestion() async generator calling generateContentStream from the client with VITE_GEMINI_API_KEY.",
    target: "convex/ai/chat.ts as an action that holds the GEMINI_API_KEY in Convex env. Streaming exposed via a Convex HTTP action that proxies SSE; client subscribes via fetch + ReadableStream. AskPanel rewires to consume the stream from the action endpoint instead of importing Gemini directly.",
    files: ["convex/ai/chat.ts", "convex/http.ts", "src/components/ai/AskPanel.tsx", "src/ai/chat.ts (delete)", "src/ai/gemini.ts (delete)"],
    effort: "L",
    risk: "high",
  },
  {
    surface: "PDF upload + storage",
    current: "DocumentNewPage?kind=pdf drops the file via FileReader, parses with pdfjs.getDocument(), stores BLOB in pdf_blobs table inside IndexedDB.",
    target: "Two-step: client requests an upload URL via api.files.generateUploadUrl, POSTs the bytes directly to Convex storage, then calls api.documents.attachPdf with the storageId. PDF text extraction stays on the client (pdfjs-dist) before upload and produces the chunks. PdfViewer fetches the blob URL via api.files.getUrl(storageId).",
    files: ["convex/files.ts", "convex/documents.ts", "src/pages/desktop/DocumentNewPage.tsx", "src/components/docs/PdfViewer.tsx"],
    effort: "M",
    risk: "med",
  },
  {
    surface: "Real upload widget",
    current: "Single drop-zone wired only to PDFs. No image upload, no attachments, no progress, no virus scan, no size limit.",
    target: "Reusable <FileUpload /> wrapper around Convex file storage with progress (via XHR upload events), 25 MB cap, MIME allow-list (pdf, png, jpg, webp), drag-drop + click-to-pick. Used by DocumentNewPage (PDF) and a future AssetPhotoUpload.",
    files: ["src/components/files/FileUpload.tsx (new)", "src/pages/desktop/DocumentNewPage.tsx"],
    effort: "M",
    risk: "low",
  },
  {
    surface: "Cross-tab / cross-device sync",
    current: "BroadcastChannel('oppr-docs') ping on writes; receiver reloads the IndexedDB blob into memory.",
    target: "Delete entirely. Convex queries in React (useQuery) re-run automatically when the underlying tables change — for free, across all open tabs and across devices. DbProvider becomes a thin auth/loading guard.",
    files: ["src/db/DbProvider.tsx (rewrite)", "src/db/sqlite.ts (delete)"],
    effort: "S",
    risk: "low",
  },
  {
    surface: "Asset ↔ Document linking",
    current: "document_assets join table; computed counts via SQL JOINs in repositories.",
    target: "documentAssets table on Convex with composite index on (assetId, documentId). Counts come from indexed queries; updates fan out to all watchers in real-time. The underlying data shape is unchanged; only the access path moves.",
    files: ["convex/documentAssets.ts", "convex/assets.ts"],
    effort: "S",
    risk: "low",
  },
  {
    surface: "Document authoring (TipTap)",
    current: "Editor is fully client-side. body_json saved to document_versions blob.",
    target: "Editor stays client-side. Save Draft / Submit / Publish call api.documents.publishVersion mutation that writes a new documentVersions row, re-extracts chunks, schedules embedChunks action. No editor logic changes.",
    files: ["src/pages/desktop/DocumentEditPage.tsx", "convex/documents.ts"],
    effort: "S",
    risk: "low",
  },
  {
    surface: "Versioning",
    current: "document_versions rows; current_version pointer on documents.",
    target: "documentVersions table indexed by (documentId, version). publishVersion is a Convex mutation that writes the row and bumps documents.currentVersion. Version history drawer queries the index.",
    files: ["convex/documents.ts", "convex/documentVersions.ts"],
    effort: "S",
    risk: "low",
  },
  {
    surface: "Q&A sessions / messages",
    current: "qa_sessions + qa_messages in IndexedDB. Library scope was ephemeral.",
    target: "qaSessions + qaMessages in Convex, scoped to the authenticated user. Library scope persists too (no schema CHECK to fight). Live history across devices.",
    files: ["convex/qa.ts", "src/components/ai/AskPanel.tsx"],
    effort: "M",
    risk: "low",
  },
  {
    surface: "Settings — API key & per-user prefs",
    current: "Gemini key + theme in localStorage. 'Reset demo' rewipes the IndexedDB blob.",
    target: "Gemini key moves to Convex env (server-side). Settings page no longer exposes it; instead it shows model versions (read-only) and theme (localStorage stays). 'Reset demo' becomes a dev-only Convex action gated to a 'developer' role.",
    files: ["src/pages/desktop/SettingsPage.tsx", "convex/admin.ts"],
    effort: "S",
    risk: "low",
  },
  {
    surface: "Routing & shells",
    current: "wouter top-level switch on /m vs everything else. window.open for the mobile popup.",
    target: "Unchanged in shape. Vercel rewrites /m/* and /* to the same SPA entry. Auth gate sits above the switch so unauthenticated users see SignInForm regardless of route. window.open works against the production URL but COOP/COEP headers must be set in vercel.json so sql.js → wasm doesn't break (or be removed if sql.js is dropped).",
    files: ["vercel.json", "src/App.tsx", "src/components/layout/DesktopShell.tsx"],
    effort: "S",
    risk: "med",
  },
  {
    surface: "Build & deployment",
    current: "Vite dev only — npm run dev → localhost:5173.",
    target: "Two pipelines: convex deploy --prod (schema + functions) and vercel deploy (Vite bundle). vercel.json sets framework=vite, build=npm run build, output=dist. Preview deployments per PR.",
    files: ["vercel.json", ".github/workflows/deploy.yml (optional)", "package.json"],
    effort: "M",
    risk: "low",
  },
  {
    surface: "Secrets / env",
    current: ".env.local with VITE_GEMINI_API_KEY (bundled into client).",
    target: "Three buckets: (1) Convex env — GEMINI_API_KEY, AUTH_RESEND_KEY (for magic-link). (2) Vercel env — CONVEX_URL, CONVEX_DEPLOYMENT. (3) Client uses no secrets. Removing VITE_GEMINI_API_KEY is a hard delete.",
    files: [".env.example", "convex env list (operational)"],
    effort: "S",
    risk: "med",
  },
]

function SurfaceMigrationSection() {
  return (
    <Section
      title="Surface-by-surface migration"
      description="Every subsystem in the showcase, mapped to its Convex equivalent. Effort: S (≤1 day) · M (1–3 days) · L (3–5 days) · XL (>1 week)."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[16%]">Surface</TableHead>
                <TableHead className="w-[26%]">Current</TableHead>
                <TableHead className="w-[34%]">Target on Convex</TableHead>
                <TableHead className="w-[14%]">Files touched</TableHead>
                <TableHead className="w-[5%] text-right">Effort</TableHead>
                <TableHead className="w-[5%] text-right">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SURFACES.map((row) => (
                <TableRow key={row.surface}>
                  <TableCell className="align-top text-xs font-medium">
                    {row.surface}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {row.current}
                  </TableCell>
                  <TableCell className="align-top text-xs">{row.target}</TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap gap-1">
                      {row.files.map((f) => (
                        <code
                          key={f}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px]"
                        >
                          {f}
                        </code>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant={
                        row.effort === "XL"
                          ? "destructive"
                          : row.effort === "L"
                            ? "default"
                            : row.effort === "M"
                              ? "secondary"
                              : "outline"
                      }
                      className="text-[10px]"
                    >
                      {row.effort}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant={
                        row.risk === "high"
                          ? "destructive"
                          : row.risk === "med"
                            ? "default"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {row.risk}
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

// --- 4. Auth flow mock -----------------------------------------------------

function AuthFlowMockSection() {
  return (
    <Section
      title="Sign-in gate (mock)"
      description="What an @oppr.ai user sees on cold-start, and what someone outside the domain sees. Static React mock — the real form will use Convex Auth's <SignInForm />."
    >
      <Tabs defaultValue="allowed">
        <TabsList>
          <TabsTrigger value="allowed">Allowed (@oppr.ai)</TabsTrigger>
          <TabsTrigger value="denied">Denied (other domain)</TabsTrigger>
          <TabsTrigger value="logic">Server-side check</TabsTrigger>
        </TabsList>
        <TabsContent value="allowed">
          <SignInMock state="allowed" />
        </TabsContent>
        <TabsContent value="denied">
          <SignInMock state="denied" />
        </TabsContent>
        <TabsContent value="logic">
          <AuthLogicCard />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function SignInMock({ state }: { state: "allowed" | "denied" }) {
  const [email, setEmail] = useState(state === "allowed" ? "floris@oppr.ai" : "someone@gmail.com")
  return (
    <Card>
      <CardContent className="grid gap-4 p-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Sign in to Oppr DOCS</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Access is restricted to <code>@oppr.ai</code> employees. We'll send a magic link
            to your work email.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="email-mock" className="text-xs">
              Work email
            </Label>
            <Input
              id="email-mock"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" className="w-full gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Send magic link
          </Button>
        </div>
        <div>
          {state === "allowed" ? (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="text-emerald-700 dark:text-emerald-300">
                Magic link sent
              </AlertTitle>
              <AlertDescription className="text-xs">
                Check <code>{email}</code>. The link expires in 10 minutes. After clicking
                it, you'll land on the library at <code>docs.oppr.ai</code>.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>This email isn't allowed</AlertTitle>
              <AlertDescription className="text-xs">
                Oppr DOCS is restricted to <code>@oppr.ai</code> employees. The address{" "}
                <code>{email}</code> can't sign in. If you think this is a mistake, contact
                an admin.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AuthLogicCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">How the @oppr.ai check is enforced</CardTitle>
        <CardDescription>
          Domain restriction is <strong>not</strong> a client-side filter — anyone can
          forge a request. The check has to live on the Convex side, in the auth callback
          that runs after the magic-link is verified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            convex/auth.ts (sketch)
          </div>
          <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-[11px] leading-relaxed">
{`import { convexAuth } from "@convex-dev/auth/server"
import { ResendOTP } from "./auth/ResendOTP"

const ALLOWED_DOMAIN = "oppr.ai"

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [ResendOTP],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const email = args.profile.email?.toLowerCase()
      if (!email || !email.endsWith(\`@\${ALLOWED_DOMAIN}\`)) {
        throw new Error("InvalidAccountId")  // generic — don't leak the rule
      }
      // upsert into users table, return userId
      ...
    },
  },
})`}
          </pre>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>
            <strong>Throw, don't return.</strong> Returning <code>null</code> creates an
            anonymous session in some Convex Auth flows. Throwing aborts the callback before
            a session is issued.
          </li>
          <li>
            <strong>Lowercase before checking.</strong>{" "}
            <code>Floris@Oppr.AI</code> is the same identity as{" "}
            <code>floris@oppr.ai</code>; the comparison must be case-insensitive.
          </li>
          <li>
            <strong>endsWith, not includes.</strong>{" "}
            <code>oppr.ai.attacker.com</code> would slip through{" "}
            <code>includes("oppr.ai")</code>.
          </li>
          <li>
            <strong>Don't echo the domain in the error.</strong> The user-visible message
            tells them the email isn't allowed, not what the rule is. Reduces enumeration.
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}

// --- 5. Upload flow mock ---------------------------------------------------

function UploadFlowMockSection() {
  return (
    <Section
      title="Real upload flow (mock)"
      description="What replaces the IndexedDB BLOB path. Two-step Convex upload, with progress and validation client-side."
    >
      <Card>
        <CardContent className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold">Drop-zone state</div>
            <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-primary" />
              <div className="text-sm font-medium">Drop a PDF here</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Or click to pick · max 25 MB · pdf, png, jpg, webp
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold">Uploading state</div>
            <div className="space-y-2 rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate font-medium">drying-oven-4-manual.pdf</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  3.4 MB
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[68%] rounded-full bg-primary transition-all" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Uploading to Convex storage…</span>
                <span>68%</span>
              </div>
            </div>
            <div className="mt-3 rounded-md border bg-muted/30 p-3 text-[11px] leading-relaxed">
              <ol className="list-decimal space-y-0.5 pl-5">
                <li>
                  Client calls <code>api.files.generateUploadUrl</code> → signed URL
                </li>
                <li>Client POSTs bytes directly to that URL (XHR with progress)</li>
                <li>
                  Client extracts text via <code>pdfjs-dist</code> (still client-side)
                </li>
                <li>
                  Client calls <code>api.documents.attachPdf</code>{" "}
                  with <code>{"{storageId, chunks}"}</code>
                </li>
                <li>
                  Convex action <code>embedChunks</code> backfills embeddings asynchronously
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// --- 6. Edge cases ---------------------------------------------------------

interface EdgeRow {
  scenario: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "User signs in with floris@OPPR.AI (mixed case)",
    current: "N/A — no auth.",
    expected: "Lowercased before the endsWith check. Same identity as floris@oppr.ai.",
    severity: "med",
  },
  {
    scenario: "User signs in with floris@oppr.ai.attacker.com",
    current: "N/A.",
    expected: "Rejected. endsWith('@oppr.ai') is exact; includes('oppr.ai') would be a hole.",
    severity: "high",
  },
  {
    scenario: "User signs in with oppr+test@oppr.ai (plus-aliased)",
    current: "N/A.",
    expected: "Allowed. Plus-aliasing is a feature of Gmail; the local part is irrelevant to the domain check.",
    severity: "low",
  },
  {
    scenario: "Existing IndexedDB blob from showcase mode",
    current: "Loaded silently, with stale-seed warning toast.",
    expected: "Pre-launch: a one-shot script that wipes IndexedDB on first auth'd visit. After migration, sql.js bundle is removed entirely.",
    severity: "med",
  },
  {
    scenario: "Mobile popup window on production URL",
    current: "window.open works on localhost.",
    expected: "Production: same-origin popups are allowed; auth state propagates because Convex Auth uses cookies + localStorage. Test that the popup inherits the parent's session, not a fresh sign-in.",
    severity: "high",
  },
  {
    scenario: "User uploads a 50 MB PDF",
    current: "Stored in IndexedDB; chrome eventually quota-evicts.",
    expected: "Client validates 25 MB cap before requesting the upload URL. Server enforces a hard limit too (storage.generateUploadUrl can be wrapped to reject).",
    severity: "med",
  },
  {
    scenario: "Re-embedding 12 seed docs after migration",
    current: "Settings → 'Re-embed all' wipes + rebuilds in browser. ~30–60s.",
    expected: "Convex action embedChunks runs server-side. Backfill is idempotent — keyed by chunkId — so it can be replayed if it crashes mid-batch.",
    severity: "low",
  },
  {
    scenario: "Convex offline (planned maintenance, network drop)",
    current: "App still works (everything is local).",
    expected: "App shows a 'reconnecting' banner; queries return cached values; mutations queue in the Convex client and replay on reconnect. Document by document — be explicit that v1 has no offline write support.",
    severity: "med",
  },
  {
    scenario: "First sign-in for a brand-new @oppr.ai user",
    current: "N/A.",
    expected: "createOrUpdateUser callback inserts a users row with role='operator' (or whatever default we pick). Subsequent sign-ins look up by tokenIdentifier.",
    severity: "low",
  },
  {
    scenario: "Streaming Gemini response disconnects mid-stream",
    current: "Client AbortController handles it.",
    expected: "HTTP action streams via ReadableStream. Client-side AbortController still works. The server-side action persists messages on completion only — partial streams are dropped, never persisted half-written.",
    severity: "med",
  },
  {
    scenario: "Multiple users edit the same document at the same time",
    current: "Doesn't happen — single browser.",
    expected: "Last-writer-wins on document_versions. v1 doesn't lock or merge. Surface a 'someone else edited this' banner if currentVersion changes while the user has the editor open. Tracked as a v2 follow-up.",
    severity: "med",
  },
  {
    scenario: "Vercel preview deployments need their own Convex deploy",
    current: "N/A.",
    expected: "Convex preview deployments per branch (convex deploy --preview). Vercel project env injects the matching CONVEX_URL per preview. Production stays on a separate, stable Convex deployment.",
    severity: "low",
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases"
      description="The migration has to handle each of these without regressing the showcase. Items here surface the open implementation questions."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">Scenario</TableHead>
                <TableHead className="w-[26%]">Current</TableHead>
                <TableHead className="w-[40%]">Expected</TableHead>
                <TableHead className="w-[6%] text-right">Sev.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((row) => (
                <TableRow key={row.scenario}>
                  <TableCell className="align-top text-xs font-medium">
                    {row.scenario}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {row.current}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
      description="Honest counter-hypotheses tested before committing to this migration."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Do we actually need a backend? The showcase already does the demo job."
            a="The showcase justifies the 8-week paid POC frame from the business doc. To convert that POC to €75–100K/year, the tool has to survive a customer pilot — which requires multi-user, audit log, real uploads, and a key that isn't in the bundle. So: yes, a backend is the gate to revenue, not a nice-to-have. Punting it means the next demo won't move forward."
          />
          <Grill
            q="Why Convex, not Postgres + tRPC + Next.js?"
            a="Three properties dominate: (1) reactive queries make BroadcastChannel and the cross-tab dance disappear for free; (2) integrated vector search means one less service to wire; (3) file storage is one API away. The cost is platform lock-in — if Convex pricing changes or we need self-hosting, this decision becomes expensive to reverse. The honest counter-bet is Postgres + Drizzle + tRPC, deployed on Fly or Railway, with pgvector for embeddings and S3 for files. That's 3–4× more infrastructure to wire and run; for a 2-person team building a sales tool, Convex's bundling beats the lock-in risk."
          />
          <Grill
            q="The @oppr.ai domain check is fragile — what if oppr.ai uses Google Workspace and our personal Gmail accounts get forwarded?"
            a="Google Workspace identity != personal Gmail. The OTP/magic-link is sent to the literal email; a personal Gmail won't receive it. Mail forwarding doesn't help — the magic link contains a session token bound to the destination email; clicking it from a forwarded address still verifies the @oppr.ai inbox. The real risk is shared mailboxes (e.g. ops@oppr.ai) — anyone with access becomes 'an oppr.ai user'. Mitigation: optionally maintain an explicit allow-list of personal addresses (floris@, …) on top of the domain check. Probably v2."
          />
          <Grill
            q="Convex vector search vs the current cosine top-k — what could go wrong?"
            a="The current code emits 768-dim vectors from gemini-embedding-2 with explicit outputDimensionality. Convex's vector index is also dense-cosine-friendly, but: (a) Convex enforces a fixed dimension at index creation, so an embedding-model swap requires a new index; (b) the result-shape API is different — we'll need to map from 'topK' to vectorSearch's response. Plan to write a thin adapter that lets the rest of the AI layer keep its current API. If the adapter ends up leaky, that's the moment to question the whole migration."
          />
          <Grill
            q="Streaming AI through a Convex HTTP action — is that fast enough?"
            a="Convex HTTP actions support ReadableStream natively. Gemini's flash-lite first token latency is ~400ms; a Convex HTTP edge hop adds ~50–80ms. The user-perceived TTFT goes from ~400ms to ~500ms. Acceptable for chat. The real risk is that long-running actions hit Convex's per-action timeout (default 10 min, configurable). For 'Ask IDA over the library' that's well within budget."
          />
          <Grill
            q="If we move auth to Convex first and persistence later, is the in-between state shippable?"
            a="No. Auth without persistence on the server gives you a sign-in screen that gates a single-browser app. The user-visible promise — 'log in, see your team's library' — only works once persistence is on Convex too. Auth + persistence have to ship as one phase, even if internally we do auth first."
          />
          <Grill
            q="What if @oppr.ai domain restriction is the wrong gate?"
            a="It's the right gate for v1 — it's small, blunt, and stops public access. Long-term we'll want admin-controlled invites (so contractors and partner companies can join individually), and possibly separate tenants per customer pilot. Convex Auth supports both via custom callbacks; the domain check is the v1 simplification, not the architecture."
          />
          <Grill
            q="What's the smallest first phase that proves the migration is viable?"
            a="Phase 1 in the plan below: Convex schema + auth + read-only library. Authenticated @oppr.ai user signs in, sees the seeded library, can read documents. No editing, no AI, no upload. If we can ship that in a week and it feels right, the rest of the migration is execution. If something fundamental breaks (auth, sync, build), we surface it before sinking time into ports."
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

// --- 8. Phased plan --------------------------------------------------------

interface Phase {
  number: number
  title: string
  goal: string
  steps: string[]
  exitCriteria: string
  effort: string
}

const PHASES: Phase[] = [
  {
    number: 1,
    title: "Convex foundation + read-only auth gate",
    goal: "Sign in with @oppr.ai, see the seeded library and assets, read documents. No edits, no AI, no upload.",
    steps: [
      "convex init; define schema.ts mirroring src/db/schema.sql (12 tables → 11; pdf_blobs becomes file storage).",
      "Wire Convex Auth with magic-link provider; implement createOrUpdateUser callback with the @oppr.ai endsWith check.",
      "Port seed.ts to a Convex action seedDemoData; idempotent on a 'meta.seedVersion' row.",
      "ConvexAuthProvider + ConvexProvider wrap App.tsx. SignInForm renders when unauthenticated.",
      "Replace LibraryPage's useDb queries with useQuery(api.documents.list).",
      "Replace AssetsPage and AssetDetailPage similarly.",
      "Replace DocumentReadPage's body fetch (TipTap doc).",
    ],
    exitCriteria: "An @oppr.ai user can sign in on the deployed Vercel preview, see the library, and read any document. Non-@oppr.ai email gets the rejection state. No edits or AI calls.",
    effort: "1 week",
  },
  {
    number: 2,
    title: "Authoring + versioning on Convex",
    goal: "All write paths move to Convex mutations. TipTap stays client-side. Multi-user edit visibility is real.",
    steps: [
      "publishVersion mutation: writes documentVersions row, bumps documents.currentVersion, re-extracts chunks (chunks live on Convex too).",
      "DocumentEditPage: useMutation wires Save Draft / Submit / Publish.",
      "VersionHistoryDrawer: useQuery(api.documents.versions, { documentId }).",
      "Add 'someone else just edited this' banner when currentVersion changes mid-edit.",
      "Delete src/db/repositories/* and src/db/sqlite.ts; rewrite DbProvider as a thin auth/loading guard or remove entirely.",
    ],
    exitCriteria: "Two browsers signed in to the same account see each other's edits land in real-time. Drafts and published versions are persisted server-side.",
    effort: "1 week",
  },
  {
    number: 3,
    title: "AI server-side (embeddings + retrieval + chat)",
    goal: "Gemini key off the client. Vector search via Convex. Streaming chat through an HTTP action.",
    steps: [
      "Move GEMINI_API_KEY to Convex env; remove VITE_GEMINI_API_KEY from the bundle.",
      "convex/ai/embed.ts action: embeds chunks; idempotent on chunkId + modelVersion.",
      "Schema: chunks gets a vector index on embedding (768 dims).",
      "convex/ai/retrieve.ts query: ctx.vectorSearch('chunks', ...) + scope filter (doc/asset/library).",
      "convex/ai/chat.ts action + HTTP action proxying SSE; responds with a ReadableStream of {delta} JSON lines.",
      "AskPanel: rewire askQuestion() generator to consume the HTTP action endpoint instead of importing Gemini.",
      "On document publish, schedule embedChunks for the new version.",
      "Settings page no longer exposes the API key; shows model versions read-only.",
    ],
    exitCriteria: "Bundle has no Gemini SDK or key. Asking a question on a fresh @oppr.ai account works end-to-end. Citations and streaming feel identical to today.",
    effort: "1.5 weeks",
  },
  {
    number: 4,
    title: "File storage + real upload widget",
    goal: "PDFs and any future attachments live in Convex storage, not in IndexedDB. Reusable upload component with progress.",
    steps: [
      "convex/files.ts: generateUploadUrl, getUrl, deleteFile.",
      "<FileUpload /> component: drag-drop, click-to-pick, XHR progress, MIME allow-list, 25 MB cap.",
      "DocumentNewPage rewires to use FileUpload + api.documents.attachPdf.",
      "PdfViewer takes a storageId, fetches via api.files.getUrl, copies bytes (pdf.js detaches buffers).",
      "Migration: any seed PDF (pdf-lib generated Drying Oven 4) is uploaded once during seed.",
      "Drop pdf_blobs handling from any remaining repo code.",
    ],
    exitCriteria: "Upload a 5 MB PDF, see it in the doc, ask IDA about it, get cited answers. No BLOB-in-row anywhere.",
    effort: "1 week",
  },
  {
    number: 5,
    title: "Vercel deploy + production hardening",
    goal: "Public production URL, preview-per-PR, production envs, basic ops.",
    steps: [
      "vercel.json: framework=vite, build=npm run build, output=dist, optional headers for COOP/COEP if sql.js still in tree.",
      "Vercel project env: CONVEX_URL, CONVEX_DEPLOYMENT (one set per environment).",
      "Convex prod deployment: convex deploy --prod; magic-link provider env (Resend / equivalent).",
      "Custom domain docs.oppr.ai (or sandbox-equivalent on the oppr-sandbox org).",
      "Smoke-test: sign in as @oppr.ai user from cold cache, library loads, ask question, upload a PDF.",
      "Add a /healthz route that pings Convex.",
      "Document deploy commands in README.",
    ],
    exitCriteria: "Production URL passes the smoke test. Preview URLs work per-PR. README has the runbook.",
    effort: "0.5 weeks",
  },
]

function PhasedPlanSection() {
  return (
    <Section
      title="Phased migration plan"
      description="5 phases, ~5 weeks of focused work. Each phase ends with a concrete exit criterion that's user-testable before the next one starts."
    >
      <div className="space-y-3">
        {PHASES.map((phase) => (
          <Card key={phase.number}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {phase.number}
                  </span>
                  <CardTitle className="text-sm">{phase.title}</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {phase.effort}
                </Badge>
              </div>
              <CardDescription className="ml-9">{phase.goal}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Steps
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-xs">
                  {phase.steps.map((s, i) => (
                    <li key={i} className="leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Exit criterion
                  </div>
                  <div className="text-xs leading-relaxed">{phase.exitCriteria}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// --- 9. Decisions ----------------------------------------------------------

interface DecisionRow {
  question: string
  options: string[]
  recommendation: string
}

const DECISIONS: DecisionRow[] = [
  {
    question: "Convex Auth (built-in) vs Clerk (third-party) on top of Convex?",
    options: [
      "Convex Auth: bundled, no extra service, magic-link or OAuth, callback-friendly.",
      "Clerk: richer admin UI, multi-factor, organisation primitives. Costs $25/mo+.",
    ],
    recommendation:
      "Convex Auth for v1. The @oppr.ai domain gate is trivial in the createOrUpdateUser callback; we don't need Clerk's admin features yet. If we onboard a customer with SSO requirements, revisit.",
  },
  {
    question: "Magic-link vs Google OAuth for Convex Auth?",
    options: [
      "Magic-link via Resend: one provider, no Google config, works with any @oppr.ai inbox.",
      "Google OAuth: one click, but requires Google Workspace consent screen + verifying the @oppr.ai workspace.",
    ],
    recommendation:
      "Magic-link first. Less setup, no Google review surface area, and the domain check happens on the verified email anyway. Add Google OAuth later as a 'sign in with your work account' convenience option.",
  },
  {
    question: "Vector index — keep current 768 dims or move to 1024?",
    options: [
      "768 dims (gemini-embedding-2 with outputDimensionality): re-uses current embedding code, smaller index.",
      "1024 dims (gemini-embedding-2 default): full fidelity, but bigger index and re-embed cost.",
    ],
    recommendation:
      "Stay at 768 for now. The seeded corpus is 12 documents — quality is bottlenecked by retrieval scope and chunking, not embedding fidelity. Revisit if recall feels weak post-migration.",
  },
  {
    question: "Drop sql.js entirely, or keep as a read-only offline mirror?",
    options: [
      "Drop entirely: lose the ~660 KB WASM bundle and the BroadcastChannel layer.",
      "Keep as a read-only IndexedDB cache: enables offline reads on mobile, but doubles persistence code.",
    ],
    recommendation:
      "Drop entirely. The mobile popup model is a polished demo, not an offline tool. Offline-first is a v2 conversation if a customer asks for it.",
  },
  {
    question: "Mobile popup window on the production URL?",
    options: [
      "Keep window.open and open docs.oppr.ai/m as a popup.",
      "Replace with a route on the same window (use a media-query layout) and drop the popup metaphor.",
    ],
    recommendation:
      "Keep the popup for now — it's the showcase's signature 'desktop + phone in one screen' demo move. Auth state propagates because Convex stores its session on the same origin. Test for popup blockers on first sign-in.",
  },
  {
    question: "What happens to the existing IndexedDB blob on first auth'd visit?",
    options: [
      "Wipe it on first authenticated load (one-shot script).",
      "Leave it as a read-only fallback for unauthenticated visitors.",
      "Migrate selected tables (qa_sessions history) into Convex.",
    ],
    recommendation:
      "Wipe it. Showcase data overlaps with seeded data, so migrating risks confusing operators. Anything worth keeping (e.g. saved chats) is showcase artifact, not real user data.",
  },
  {
    question: "Re-embed strategy after migration?",
    options: [
      "Re-embed everything from scratch on first deploy via the seed action.",
      "Try to dump+import existing embeddings from IndexedDB.",
    ],
    recommendation:
      "Re-embed from scratch. 12 documents × ~140 chunks at gemini-embedding-2 is sub-30-second work and avoids dimensional drift bugs.",
  },
  {
    question: "Where do per-user chat histories live in v1?",
    options: [
      "Scoped per user (qaSessions.userId = identity).",
      "Shared across all @oppr.ai users (one team library + one team chat).",
    ],
    recommendation:
      "Scoped per user. Chat history feels personal; sharing it leaks one user's questions to another. Shared docs and assets stay shared; chat stays private.",
  },
  {
    question: "Vercel + Convex env separation strategy?",
    options: [
      "One Convex deployment, one Vercel project — production only.",
      "Two Convex deployments (prod + preview), Vercel preview-per-PR pointing at preview Convex.",
    ],
    recommendation:
      "Two deployments. Preview-per-PR is what makes the eng loop fast; without it, every change is a prod deploy. Convex's preview deployments are exactly designed for this.",
  },
]

function DecisionsSection() {
  return (
    <Section
      title="Open decisions"
      description="Each row is a question that needs a call before Phase 1 starts. Recommendations are the default; reply with overrides if you disagree."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          {DECISIONS.map((d) => (
            <div key={d.question} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-2">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{d.question}</div>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                    {d.options.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-start gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/5 p-2 text-xs">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        Recommendation:{" "}
                      </span>
                      {d.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Alert>
        <Cloud className="h-4 w-4" />
        <AlertTitle>Open until Phase 1 kicks off</AlertTitle>
        <AlertDescription className="text-xs">
          Reply on this page (or in chat) with the calls you want to make. Once Phase 1
          starts, this section freezes into the canonical record of how the migration was
          framed.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// silence unused-import warnings for icons we'll surface as the page grows
void Boxes
void Check
