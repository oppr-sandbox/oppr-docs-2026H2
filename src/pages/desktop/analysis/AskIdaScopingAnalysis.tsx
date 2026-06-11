// Analysis page: how the Ask IDA "talk to" scope slices the database, the
// full verification run against the real pipeline, the grill session, and
// what was changed as a result. Static documentation — no live data.

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Factory,
  FileText,
  Globe,
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

export function AskIdaScopingAnalysis() {
  return (
    <AnalysisLayout
      title="Ask IDA scoping — how 'talk to' slices the database"
      subtitle="Full verification of the scope selector: when you talk to an asset you must be talking to the documents linked to that asset, when you talk to a document only to that document, and to the whole library otherwise. This page documents how the pipeline works end-to-end, what the check found (one real recall bug, one dead UI path, three stale-era leftovers), the grill session, and everything that was changed."
      date="2026-06-10"
      scopes={["AI", "data-model", "mobile", "desktop"]}
    >
      <SummaryCards />
      <ScopesSection />
      <PipelineSection />
      <ServingRulesSection />
      <FindingsSection />
      <GrillSection />
      <ChangesSection />
      <PlatformBoundarySection />
    </AnalysisLayout>
  )
}

function SummaryCards() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Verdict
          </div>
          <p className="mt-1 text-sm">
            Doc and library scope were correct. Asset scope answered from the
            right slice but searched the wrong one: a library-wide vector
            search post-filtered to linked docs, losing recall and making the
            cross-link badge unreachable.
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Wrench className="h-3.5 w-3.5 text-sky-600" />
            Fixed
          </div>
          <p className="mt-1 text-sm">
            Asset scope now vector-searches only the linked documents at the
            index level, with an explicit library-wide fallback flagged
            "Not linked". Archived documents no longer answer asset/library
            questions. Chat text-size dial actually works; citation numbers
            are explained.
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Status
          </div>
          <p className="mt-1 text-sm">
            Shipped 2026-06-10. tsc -b and vite build green; Convex functions
            pushed to dev and production.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// --- The three scopes --------------------------------------------------------

function ScopesSection() {
  return (
    <Section
      title="The three scopes"
      description="The scope chip in the chat header decides which slice of the database the retrieval step is allowed to read. The same AskPanel serves desktop and mobile; scope travels with the session."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <ScopeCard
          icon={FileText}
          title="Document"
          tone="indigo"
          slice="Exactly one document — the vector search is filtered to its chunks at the index level (filterFields: documentId)."
          serves="The version you'd read: the live (published) version, or the working version if the document was never published."
          use="Reading or running a single SOP and asking about its specifics."
        />
        <ScopeCard
          icon={Factory}
          title="Asset"
          tone="emerald"
          slice="All documents linked to the asset via documentAssets (the body-derived asset pills). The vector search is now filtered to those documents' chunks."
          serves="Live versions of linked, non-archived documents. If they can't fill the answer, the search widens to the library and those extra sources are flagged 'Not linked'."
          use="An operator at a machine (QR scan) asking how to clean, change over, or troubleshoot it."
        />
        <ScopeCard
          icon={Globe}
          title="Library"
          tone="sky"
          slice="Every chunk in the database — unfiltered vector search across all documents."
          serves="Live versions of all non-archived documents; never-published drafts serve their working version."
          use="Catalog questions: 'which SOP covers X', comparisons, where-do-I-find."
        />
      </div>
    </Section>
  )
}

const SCOPE_TONES: Record<string, string> = {
  indigo: "border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300",
  emerald: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  sky: "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-300",
}

function ScopeCard({
  icon: Icon,
  title,
  tone,
  slice,
  serves,
  use,
}: {
  icon: typeof FileText
  title: string
  tone: string
  slice: string
  serves: string
  use: string
}) {
  return (
    <Card className={cn("border", SCOPE_TONES[tone])}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-1.5 font-semibold">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        <DetailRow label="Slice" text={slice} />
        <DetailRow label="Serves" text={serves} />
        <DetailRow label="Use it for" text={use} />
      </CardContent>
    </Card>
  )
}

function DetailRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <p className="text-xs leading-relaxed text-foreground">{text}</p>
    </div>
  )
}

// --- Pipeline ----------------------------------------------------------------

const PIPELINE_STEPS: { title: string; where: string; detail: string }[] = [
  {
    title: "Authoring writes chunks",
    where: "src/components/docs/chunking.ts → convex/documents.ts",
    detail:
      "Saving a document converts the TipTap body into text chunks (one per section-ish block, carrying a pageOrSection label). Chunks are keyed by documentId + version, so the live version and a draft fork each have their own chunk set.",
  },
  {
    title: "Publish schedules embeddings",
    where: "convex/ai/embed.ts",
    detail:
      "Each chunk's text is embedded with gemini-embedding-2 at 768 dimensions and written onto the chunk row. The vectorIndex on chunks (by_embedding, filterFields: documentId) is what every scope searches. Changing the embedding model requires Settings → Re-embed all.",
  },
  {
    title: "The question is embedded",
    where: "convex/ai/ask.ts → embedQuery()",
    detail:
      "The user's question goes through the same embedding model, producing the query vector. The Gemini key lives only in the Convex environment — it never reaches the browser.",
  },
  {
    title: "Vector search, sliced per scope",
    where: "convex/ai/ask.ts → prepareAskContext()",
    detail:
      "Doc scope: filter eq(documentId). Asset scope: the linked document ids are resolved first from documentAssets, then the search filters to or(eq(documentId, …)) over them (capped at 64). Library: unfiltered. Over-fetch is 30 (16 for library) because version duplicates get filtered next.",
  },
  {
    title: "Version + status filter",
    where: "convex/ai/ask.ts → lookupAfterSearch()",
    detail:
      "Each hit is joined to its document and kept only if it belongs to the served version: liveVersion when published, currentVersion when never published. Drafts of published documents never leak. Archived documents are dropped for asset/library scope (doc scope still answers about an archived doc you explicitly opened).",
  },
  {
    title: "Cross-link fallback (asset scope only)",
    where: "convex/ai/ask.ts → prepareAskContext()",
    detail:
      "If the linked documents yield fewer than k usable chunks, a second, unfiltered search fills the remaining slots from the wider library. Those chunks are marked origin: cross-link — the prompt tells the model they're not linked to the asset, and the UI shows the orange 'Not linked' badge.",
  },
  {
    title: "Prompt assembly + scope overview",
    where: "convex/ai/ask.ts → buildScopeOverview()",
    detail:
      "The top-k excerpts are numbered [1]…[k]. Doc/asset scope always adds a deterministic SCOPE OVERVIEW block (the doc's filing + linked assets, or the asset's linked document list); library scope only adds the full inventory when the question looks like an inventory question. The last 6 turns of cleaned history ride along.",
  },
  {
    title: "Streaming + citations",
    where: "convex/ai/ask.ts → askStream (HTTP action) → AskPanel",
    detail:
      "gemini-3.1-flash-lite streams NDJSON deltas over the /ai/askStream endpoint on the .convex.site host. The final event carries the citations array (documentId, chunkId, pageOrSection, excerpt, origin) in the same order as the [N] markers; the panel persists the turn into qaSessions/qaMessages, so every scope keeps its own durable conversation.",
  },
]

function PipelineSection() {
  return (
    <Section
      title="The pipeline, end to end"
      description="What happens between typing a question and the answer with numbered sources. Every step lives server-side in convex/ai/* except the panel itself."
    >
      <div className="space-y-2">
        {PIPELINE_STEPS.map((s, i) => (
          <div
            key={s.title}
            className="flex gap-3 rounded-md border bg-card p-3"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium">{s.title}</span>
                <code className="text-[10px] text-muted-foreground">
                  {s.where}
                </code>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {s.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

// --- Serving rules ------------------------------------------------------------

function ServingRulesSection() {
  return (
    <Section
      title="Which version answers"
      description="RAG follows the same serving rule as QR and the mobile reader: operators get the live edition."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document state</TableHead>
            <TableHead>Doc scope</TableHead>
            <TableHead>Asset / library scope</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Rule
            state="Published, no draft in progress"
            doc="Live version"
            rest="Live version"
          />
          <Rule
            state="Published, draft fork in progress"
            doc="Live version — the draft's chunks exist but are filtered out"
            rest="Live version"
          />
          <Rule
            state="Never published (draft/in review/approved)"
            doc="Working version"
            rest="Working version — drafts are answerable while authoring"
          />
          <Rule
            state="Archived"
            doc="Live version (you explicitly opened it)"
            rest="Excluded — archived knowledge must not guide operators"
          />
        </TableBody>
      </Table>
    </Section>
  )
}

function Rule({
  state,
  doc,
  rest,
}: {
  state: string
  doc: string
  rest: string
}) {
  return (
    <TableRow>
      <TableCell className="text-xs font-medium">{state}</TableCell>
      <TableCell className="text-xs">{doc}</TableCell>
      <TableCell className="text-xs">{rest}</TableCell>
    </TableRow>
  )
}

// --- Findings -----------------------------------------------------------------

interface Finding {
  severity: "bug" | "dead" | "stale" | "ok"
  title: string
  detail: string
}

const FINDINGS: Finding[] = [
  {
    severity: "bug",
    title: "Asset scope searched the whole library, then filtered",
    detail:
      "The vector search ran unfiltered (top 30 of the entire library) and linked-doc filtering happened afterwards. If the asset's documents didn't rank in the global top 30 for that phrasing, they were never even considered — the screenshot case ('What's the daily check on this asset?') is exactly this shape. Fixed: the search itself is now sliced to linked documents via the index filter.",
  },
  {
    severity: "dead",
    title: "The cross-link origin could never occur",
    detail:
      "Because non-linked documents were silently dropped during post-filtering, every surviving citation was by definition linked — so origin was always 'asset-link' and the orange 'Not linked' badge, its popover, and the origin plumbing were dead UI. Fixed: the badge is now real — it appears exactly when the library-wide fallback contributed a source.",
  },
  {
    severity: "bug",
    title: "Chat text-size buttons did nothing",
    detail:
      "The size class landed on the scroll container, but three layers below it re-hardcoded the font: the message bubbles (text-sm), the Markdown wrapper (text-sm), and .tiptap-content (font-size: 0.95rem). Fixed: bubbles inherit, a .chat-content override makes the tiptap surface inherit, headings/citation chips scale in em, and the small step dropped to 11px — significantly more text per screen.",
  },
  {
    severity: "stale",
    title: "Citation numbers were unexplained",
    detail:
      "The [1]/[5]/[6] chips after sentences are footnote anchors: tapping one scrolls to the matching numbered source pill below the answer. Nothing said so. Fixed: the Sources header now reads 'numbers in the answer point here', and each chip carries a tooltip.",
  },
  {
    severity: "stale",
    title: "Cross-link popover suggested 'Settings → Reset demo'",
    detail:
      "Copy from the pre-Convex IndexedDB era ('your local data may be out of date'). There is no local data anymore. Fixed: the popover now explains the library-wide fallback and suggests linking the document to the asset.",
  },
  {
    severity: "ok",
    title: "Doc scope verified correct",
    detail:
      "Index-level filter on documentId, live-version rule applied, citations deep-link to the page/section. No change.",
  },
  {
    severity: "ok",
    title: "Library scope verified correct",
    detail:
      "Unfiltered search with live-version rule; the inventory overview only joins when the question is inventory-shaped, which keeps ordinary answers from reciting the catalog. Top-k raised 3 → 5 so comparison questions get enough context.",
  },
]

const SEVERITY_BADGE: Record<Finding["severity"], { label: string; cls: string }> = {
  bug: { label: "Bug", cls: "bg-red-500/15 text-red-700 dark:text-red-300" },
  dead: { label: "Dead path", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  stale: { label: "Stale", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  ok: { label: "Verified OK", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
}

function FindingsSection() {
  return (
    <Section
      title="What the verification found"
      description="The complete check of the talk-to mechanism against the running code, screenshot evidence included."
    >
      <div className="space-y-2">
        {FINDINGS.map((f) => {
          const b = SEVERITY_BADGE[f.severity]
          return (
            <div key={f.title} className="rounded-md border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("border-0", b.cls)}>{b.label}</Badge>
                <span className="text-sm font-medium">{f.title}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {f.detail}
              </p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// --- Grill session -------------------------------------------------------------

const GRILL: { question: string; answer: string; action: string }[] = [
  {
    question:
      "If an asset has zero linked documents, what does the operator get?",
    answer:
      "Previously: '(no excerpts available)' — a dead end at the machine. Now the library-wide fallback still surfaces the best matches, clearly badged as not linked, so the operator gets help and the gap (missing link) is visible.",
    action: "Implemented (cross-link fallback)",
  },
  {
    question: "Can a draft of a published SOP leak into operator answers?",
    answer:
      "No. Chunks are keyed by version and lookupAfterSearch only passes the served version. Verified, and now also covered for archived documents.",
    action: "Verified + archived-exclusion added",
  },
  {
    question: "Does re-linking a document to an asset require re-embedding?",
    answer:
      "No. Links live in documentAssets and are resolved per question; embeddings are per chunk and unaffected. Linking takes effect on the next question immediately.",
    action: "Verified, documented here",
  },
  {
    question: "What happens when an asset has more than 64 linked documents?",
    answer:
      "The index filter caps at 64 or-terms; beyond that the slice silently narrows. Acceptable at showcase scale (single-digit links), flagged for the platform build where asset registries grow.",
    action: "Deferred — documented limit",
  },
  {
    question: "Why do some source pills say 'Unlabelled section'?",
    answer:
      "Chunks built from body content that sits before any heading carry no pageOrSection label. Cosmetic; the excerpt hover still shows the text. Improving the chunker's label inference is a v1.1 item.",
    action: "Deferred",
  },
  {
    question: "Is the non-streaming askQuestion action still needed?",
    answer:
      "The panel uses the streaming HTTP action exclusively. askQuestion is kept as the non-streaming fallback API surface; flagged to the dead-code audit to confirm no client calls remain.",
    action: "Audited in the refactor pass",
  },
]

function GrillSection() {
  return (
    <Section
      title="Grill session"
      description="The hard questions asked of the setup before signing it off, and what each one triggered."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[36%]">Question</TableHead>
            <TableHead>Answer</TableHead>
            <TableHead className="w-[18%]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {GRILL.map((g) => (
            <TableRow key={g.question}>
              <TableCell className="align-top text-xs font-medium">
                {g.question}
              </TableCell>
              <TableCell className="align-top text-xs">{g.answer}</TableCell>
              <TableCell className="align-top text-xs text-muted-foreground">
                {g.action}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  )
}

// --- Changes -------------------------------------------------------------------

const CHANGES: { file: string; change: string }[] = [
  {
    file: "convex/ai/ask.ts",
    change:
      "Asset scope: linked docs resolved before the search; vector search filtered with or(eq(documentId,…)); library-wide cross-link fallback fills to k with origin marking; archived docs excluded for asset/library; library top-k 3→5; prompt marks non-linked excerpts and the system instruction tells the model to caveat them.",
  },
  {
    file: "src/components/ai/AskPanel.tsx",
    change:
      "Message bubbles inherit font size instead of hardcoding text-sm; small step is 11px.",
  },
  {
    file: "src/components/ai/MessageContent.tsx",
    change:
      "chat-content class (inherits size), headings and citation/code chips scale in em, citation anchors get a tooltip explaining where they lead.",
  },
  {
    file: "src/components/ai/SourcesBlock.tsx",
    change:
      "Header explains the numbered anchors; cross-link popover copy rewritten for the Convex era (link the doc on the asset page).",
  },
  {
    file: "src/index.css",
    change:
      ".tiptap-content.chat-content overrides: font-size/line-height inherit, proportional em spacing so the small size genuinely shows more text.",
  },
]

function ChangesSection() {
  return (
    <Section title="What changed" description="File-level record of this pass.">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">File</TableHead>
            <TableHead>Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CHANGES.map((c) => (
            <TableRow key={c.file}>
              <TableCell className="align-top font-mono text-[11px]">
                {c.file}
              </TableCell>
              <TableCell className="align-top text-xs">{c.change}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  )
}

// --- Platform boundary -----------------------------------------------------------

function PlatformBoundarySection() {
  return (
    <Section
      title="Platform boundary: assets and logs are shared registries"
      description="Why the asset and log tables are deliberately thin and accessed only through their Convex modules."
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm leading-relaxed">
          <p>
            In the full Oppr platform the asset registry and the log stream are
            owned by the wider toolset (LOGS/IDA), not by DOCS. This showcase
            creates its own <code className="text-xs">assets</code> and{" "}
            <code className="text-xs">logs</code> tables, but everything that
            touches them goes through <code className="text-xs">convex/assets.ts</code>{" "}
            and <code className="text-xs">convex/logs.ts</code> — no component
            queries those tables directly. That keeps the swap to an imported,
            platform-scoped registry a server-side change.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            Rows now carry optional <code>source</code> /{" "}
            <code>externalId</code> fields so imported records can keep their
            platform identity alongside the local Convex id.
            <ArrowRight className="h-3 w-3" />
            See the ADR in <code>docs/adr/</code>.
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}
