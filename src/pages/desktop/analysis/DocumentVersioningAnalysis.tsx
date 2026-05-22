// Document versioning & library lifecycle — analysis (2026-05-22).
//
// Today a document is one row with one status + one currentVersion. The moment
// you reopen a published doc and edit, saveContent flips that row to draft and
// bumps the version — so the live published edition goes offline immediately,
// there's no replace confirmation on re-publish, and the library can't show
// that a published doc is being worked on. This page proposes the fix: keep the
// published edition live while a forked draft edition goes through the cycle,
// confirm on replace, and surface the in-progress edition in the library.
// Proposal — awaiting sign-off on Decision 1 (the data model) before code.

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleHelp,
  Eye,
  FileStack,
  GitFork,
  Layers,
  Lock,
  ShieldCheck,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { ChevronDown } from "lucide-react"
import type { ReactNode } from "react"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function DocumentVersioningAnalysis() {
  return (
    <AnalysisLayout
      title="Document versioning & library lifecycle"
      subtitle="A published SOP must stay live while the next edition is authored, reviewed, and approved. Only on final approval does it replace the live version — with a confirmation — and become version 2. Today, editing a published doc takes it offline at the first save and bumps the version with no gate. This is the redesign: a forked draft edition over a still-live published one, a replace confirmation, and a library indication of work in progress."
      date="2026-05-22"
      scopes={["desktop", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemStatement />
      <Evidence />
      <CurrentModel />
      <RootCause />
      <ProposedModel />
      <Lifecycle />
      <ReplaceConfirmation />
      <LibraryIndication />
      <ServingRules />
      <EdgeCases />
      <SelfGrilling />
      <InterdependencyMap />
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
        <Cell icon={AlertTriangle} label="Issue" value="Editing a published doc takes it offline at the first save and bumps the version with no replace gate." />
        <Cell icon={CircleHelp} label="Status" value="Proposal · awaiting sign-off (Decision 1 — the data model)" />
        <Cell icon={GitFork} label="Approach" value="Forked draft edition over a still-live published version; replace confirmation; library work-in-progress indicator." />
        <Cell icon={ShieldCheck} label="Verification" value="N/A — no lifecycle code until sign-off. (Toast position + breadcrumb already shipped separately.)" />
      </CardContent>
    </Card>
  )
}

function Cell({ icon: Icon, label, value }: { icon: typeof GitFork; label: string; value: string }) {
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

function ProblemStatement() {
  return (
    <Section title="What's wrong">
      <Alert variant="destructive" className="border-destructive/40">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-sm">A published SOP shouldn't go offline the instant someone edits it</AlertTitle>
        <AlertDescription className="space-y-2 text-xs leading-relaxed">
          <p>
            The version is meant to be the <strong>published edition count</strong>: a doc is v1 once it
            has been authored → reviewed → approved → published. Reopening it to make changes should
            create a <strong>forked draft edition (v2)</strong> while v1 stays the live document operators
            see. v2 only replaces v1 — becoming the new live version — once it has itself gone through
            the full cycle and you confirm the replacement.
          </p>
          <p>Five things are off today (two already fixed as quick wins, three are this redesign):</p>
          <ul className="ml-4 list-disc space-y-0.5">
            <li><strong>Published goes offline on edit.</strong> The first save flips the one document row from <code>published</code> to <code>draft</code>; the live version is gone until re-publish.</li>
            <li><strong>No replace confirmation.</strong> Re-publishing silently overwrites the live doc — no "you're about to replace v1 with v2, accept?" gate.</li>
            <li><strong>Library can't show work in progress.</strong> A published doc being re-edited looks identical to an idle one; no indicator, no way to see the in-progress edition or its state.</li>
            <li className="text-muted-foreground"><strong>(Fixed)</strong> Save toast sat over the action buttons → moved to bottom-right.</li>
            <li className="text-muted-foreground"><strong>(Fixed)</strong> Breadcrumb truncated the title → now shows the full title.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Evidence() {
  const shots: [string, string][] = [
    ["published-edit-shows-v2.png", "Reopening a published doc already reads as Draft · v2 — but v1 is no longer live anywhere. The edition forked; the live version didn't survive."],
    ["draft-saved-v2.png", "Saving the draft keeps it at v2. The number is right (v2 is the next edition) — the bug is that v1 went offline the moment the draft started, with no gate to bring v2 live."],
  ]
  return (
    <Section title="Evidence" description="Editing a published document today.">
      <div className="space-y-4">
        {shots.map(([file, caption]) => (
          <Card key={file}>
            <CardContent className="space-y-2 p-3">
              <img src={`/analysis/document-versioning/${file}`} alt={caption} className="w-full rounded-md border" />
              <p className="text-xs text-muted-foreground">{caption}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function CurrentModel() {
  const rows: [string, string][] = [
    ["documents.status", "ONE lifecycle status for the whole document: pre_draft | draft | in_review | approved | published | archived."],
    ["documents.currentVersion", "A single number. Serving (read view, QR, RAG) reads the version row at currentVersion."],
    ["documentVersions[]", "One row per version: bodyJson, pdfStorageId, signoffs[]. Chunks + imageUsages are keyed by (documentId, version)."],
    ["saveContent (published branch)", "On the first changed save of a published doc: currentVersion += 1, status = 'draft'. The single row now describes the draft — the published edition is no longer represented as live."],
  ]
  return (
    <Section title="The current model" description="One row, one status, one current version — convex/schema.ts + convex/documents.ts.">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Field / code</TableHead>
                <TableHead>What it does today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell className="align-top font-mono text-xs">{k}</TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}

function RootCause() {
  return (
    <Section title="Root cause">
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-sm">One status field can't represent "v1 live AND v2 in progress" at the same time</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          A document has a single <code>status</code>. To serve v1 to operators while v2 is being drafted,
          two states must coexist — but the row can only hold one. So <code>saveContent</code>{" "}
          (<code>convex/documents.ts:419-439</code>) overwrites the published state with the draft state.
          The version <em>number</em> logic is already correct (save doesn't bump within an edition; the
          published→edit transition bumps once). What's missing is a place to keep the <strong>live
          published edition</strong> while the next one is worked on.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function ProposedModel() {
  return (
    <Section
      title="Decision 1 — how to hold a live version and a draft edition at once"
      description="This is the load-bearing call. Everything else (confirmation, library indicator, serving) builds on it."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">Recommended</Badge>
              <span className="text-sm font-semibold">Option A — dual-version fields on one row</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Add <code>liveVersion: number | null</code> to <code>documents</code>. Keep{" "}
              <code>currentVersion</code> as the working edition; <code>status</code> describes that
              working edition. <code>liveVersion</code> is the published version operators are served.
            </p>
            <ul className="space-y-1 text-xs">
              <Pro>One identity, one naming code, one library entry. No row de-duplication.</Pro>
              <Pro>Smallest delta on the existing code — the version-number logic already works; we add liveVersion + serve from it.</Pro>
              <Pro>History stays in <code>documentVersions</code>; chunks/usages already keyed by version.</Pro>
              <Pro>Serving rule is trivial: operators/QR/RAG read <code>liveVersion</code>; the editor reads <code>currentVersion</code>.</Pro>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Alternative</Badge>
              <span className="text-sm font-semibold">Option B — a separate forked document row</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The draft edition is its own <code>documents</code> row, linked to the published one by a
              <code> forkOf</code> pointer; merge on publish.
            </p>
            <ul className="space-y-1 text-xs">
              <Con>Two identities sharing one naming code → library must de-dupe and re-link everywhere.</Con>
              <Con>documentAssets / imageUsages / chunks must move or be re-pointed on merge.</Con>
              <Con>Heavier for a showcase; more places to break. Real value only with concurrent multi-fork editing, which isn't in scope.</Con>
            </ul>
          </CardContent>
        </Card>
      </div>
      <Alert className="bg-muted/30">
        <Layers className="h-4 w-4 text-primary" />
        <AlertDescription className="text-[11px] leading-relaxed">
          <strong>Recommendation: Option A.</strong> It reconciles with the versioning change already in{" "}
          <code>saveContent</code> — that code bumps <code>currentVersion</code> and sets the working
          status correctly; we just stop letting it erase the live edition by introducing{" "}
          <code>liveVersion</code> and serving from it.
        </AlertDescription>
      </Alert>
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

function Lifecycle() {
  const steps: [string, string, string][] = [
    ["Published v1 is live", "status: published · liveVersion 1 · currentVersion 1", "Operators, QR, and RAG all see v1. Nothing in progress."],
    ["Reopen & make a real edit", "status: draft · liveVersion 1 · currentVersion 2", "First changed save forks edition 2. v1 stays live and served. (Identical-body save stays a no-op.)"],
    ["Author → review → approve v2", "status: draft → in_review → approved · liveVersion still 1", "The full gated cycle runs on edition 2. v1 is untouched the whole time."],
    ["Publish v2 (with confirmation)", "status: published · liveVersion 2 · currentVersion 2", "Replace dialog: 'You're about to replace v1 with v2.' On accept, liveVersion = 2; v1 becomes history."],
  ]
  return (
    <Section title="The lifecycle" description="Option A in motion. liveVersion is what the world sees; currentVersion is what the editor works on.">
      <Card>
        <CardContent className="space-y-2 pt-6">
          {steps.map(([t, state, d], i) => (
            <div key={t} className="flex items-start gap-3 rounded-md border bg-card p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{i + 1}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t}</div>
                <div className="mt-0.5 font-mono text-[11px] text-primary">{state}</div>
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

function ReplaceConfirmation() {
  return (
    <Section
      title="Decision 2 — replace confirmation on publish"
      description="Publishing a forked edition is destructive to the live version, so it gets a gate. Mock of the dialog (real shadcn AlertDialog primitives)."
    >
      <div className="rounded-lg border bg-muted/30 p-6">
        <div className="mx-auto max-w-md rounded-lg border bg-background p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <FileStack className="h-4 w-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Replace the live document?</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Publishing <strong>v2</strong> will replace the currently live <strong>v1</strong> of{" "}
                <span className="font-mono">AMS-OPS-WI-0001</span>. Operators scanning the asset and Ask
                IDA will start seeing v2 immediately. v1 is kept in history.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="outline">Cancel</Button>
            <Button size="sm">Replace &amp; publish v2</Button>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function LibraryIndication() {
  return (
    <Section
      title="Decision 3 — library indication + expand to the in-progress edition"
      description="A published doc with a draft edition in flight should say so, and expand to show that edition and its state. Mock below."
    >
      <Card>
        <CardContent className="space-y-2 pt-6">
          {/* collapsed row with a work-in-progress badge */}
          <div className="rounded-md border">
            <div className="flex items-center gap-3 p-3">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">AMS-OPS-WI-0001</span>
              <span className="text-sm font-medium">testing doc 2</span>
              <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">Published · v1</Badge>
              <Badge variant="outline" className="gap-1 text-[10px] text-amber-700 dark:text-amber-300">
                <GitFork className="h-3 w-3" />
                v2 in progress
              </Badge>
              <span className="ml-auto text-xs text-muted-foreground">Updated 2m ago</span>
            </div>
            {/* expanded: the in-progress edition + its state */}
            <div className="border-t bg-muted/30 px-3 py-2.5 pl-10">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="text-[10px]">v2</Badge>
                <Badge className="bg-blue-500/15 text-[10px] text-blue-700 hover:bg-blue-500/25 dark:text-blue-300">In review</Badge>
                <span className="text-muted-foreground">Author floris@oppr.ai · reviewer pending</span>
                <Button size="sm" variant="ghost" className="ml-auto h-6 gap-1 text-[11px]">
                  <ArrowRight className="h-3 w-3" />
                  Open draft edition
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Collapsed, the row shows the live version plus a "v2 in progress" chip. Expanded, it reveals
            the forked edition and where it sits in the cycle. Idle published docs render exactly as today
            (no chip, no expansion) — the indicator only appears when <code>currentVersion &gt; liveVersion</code>.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function ServingRules() {
  const rows: [typeof Eye, string, string][] = [
    [Eye, "Operator read view / QR scan", "Always resolves liveVersion. A scan during editing still returns the approved v1, never a half-finished draft."],
    [Lock, "Ask IDA / RAG retrieval", "Indexes and answers from liveVersion only. The draft edition's chunks exist but aren't retrievable until it goes live."],
    [FileStack, "Desktop editor", "Loads currentVersion (the working edition). The header shows the working status + version; a 'v1 live' note clarifies what's still served."],
  ]
  return (
    <Section title="Who sees which version" description="The serving rule that falls out of Option A.">
      <Card>
        <CardContent className="grid gap-2 pt-6 sm:grid-cols-3">
          {rows.map(([Icon, t, d]) => (
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

function EdgeCases() {
  const rows: [string, string, "high" | "med" | "low"][] = [
    ["First publish ever (no prior live version)", "liveVersion null → set to currentVersion (1) on publish. No replace dialog the first time — nothing to replace.", "high"],
    ["Abandon the draft edition", "'Discard draft edition' deletes the currentVersion row + its chunks/usages, resets currentVersion = liveVersion, status = published. v1 untouched.", "high"],
    ["Identical-body save on a published doc", "Stays a no-op (already implemented) — no fork is created until a real change.", "med"],
    ["Reviewer/approver opens while editing", "They see and act on the draft edition (currentVersion). Operators still get liveVersion.", "med"],
    ["Delete a doc that has both a live and draft edition", "Delete removes all versions (unchanged). Archive applies to the document identity.", "low"],
    ["PDF-backed documents", "Same model; the forked edition can swap the attached PDF. liveVersion still serves the old PDF until publish.", "low"],
    ["Re-publish without changes after approval", "Allowed; liveVersion = currentVersion. If they're already equal it's a no-op.", "low"],
  ]
  return (
    <Section title="Edge cases" description="What the forked-edition model has to handle.">
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

function SelfGrilling() {
  return (
    <Section title="Self-grilling" description="The uncomfortable questions.">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="space-y-4 pt-6">
          <Grill
            q="Is a forked live/draft model overkill for a frontend showcase?"
            a="It's the minimum that makes the demo honest. The whole pitch is 'the live SOP operators follow stays stable while engineering revises it.' If editing a published doc visibly takes it offline, the lifecycle story collapses on stage. Option A adds one nullable field and a serving rule — that's not overkill, it's the cheapest correct version."
          />
          <Grill
            q="Doesn't the existing saveContent change already do versioning? Why more work?"
            a="It does the version-number half correctly (save doesn't bump; published→edit bumps once). But it implements the bump by overwriting the single status row, which is exactly what takes v1 offline. So this isn't a redo — it's finishing the same change: keep liveVersion, serve from it, gate the replace. I'd be wrong to claim the prior change was sufficient."
          />
          <Grill
            q="Should Ask IDA answer from the in-progress draft so engineers can test it?"
            a="No, by default. Operators and RAG must reflect the live SOP, or you get answers from an unapproved draft. The draft's chunks exist (keyed by version) but stay out of retrieval until publish. A future 'preview answers against this draft' mode is a deliberate, separate feature — not the default."
          />
          <Grill
            q="What stops two people forking the same published doc into conflicting v2s?"
            a="Option A allows one draft edition per document (currentVersion = liveVersion + 1). A second editor joins the same edition rather than forking a competing one — consistent with the showcase's single-tenant demo. True concurrent forks are Option B territory and explicitly out of scope."
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

function InterdependencyMap() {
  const rows: [string, "changes" | "stays" | "risk", string][] = [
    ["documents schema", "changes", "Add liveVersion: number | null (additive, nullable — existing rows backfill to currentVersion on first publish or via migration)."],
    ["saveContent", "changes", "Keep the bump logic; on the published→edit fork, set status=draft + currentVersion+1 but DO NOT touch liveVersion. Identical-body no-op stays."],
    ["publish mutation", "changes", "Gains the replace step: set liveVersion = currentVersion. The desktop publish action shows the confirm dialog first."],
    ["read view / QR / mobile", "changes", "Resolve liveVersion instead of currentVersion. New query getLiveVersion (fallback currentVersion when liveVersion is null)."],
    ["Ask IDA / retrieval", "risk", "Must filter chunks to liveVersion. If it keeps reading currentVersion, RAG would answer from the unapproved draft. The one place that bites if missed."],
    ["LibraryPage / DocumentLibraryTable", "changes", "Row gains the 'v2 in progress' chip + expansion when currentVersion > liveVersion."],
    ["DocumentEditPage header", "changes", "Show working status/version + a 'v1 still live' note; wire the publish confirm + 'Discard draft edition'."],
    ["documentVersions / chunks / imageUsages", "stays", "Already keyed by (documentId, version). No structural change."],
  ]
  return (
    <Section title="Interdependency map" description="What changes, what stays, what could break.">
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
              {rows.map(([s, verdict, d]) => (
                <TableRow key={s}>
                  <TableCell className="align-top text-xs font-medium">{s}</TableCell>
                  <TableCell className="align-top">
                    {verdict === "stays" ? (
                      <Badge className="bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">stays</Badge>
                    ) : verdict === "changes" ? (
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

function ImplementationPlan() {
  const steps: [number, string, string][] = [
    [1, "Schema + serving", "Add documents.liveVersion. Add getLiveVersion query (fallback currentVersion). Point read view, QR resolve, and mobile at it."],
    [2, "Fork on edit (don't kill the live version)", "In saveContent's published branch, bump currentVersion + set status draft but leave liveVersion. Backfill liveVersion = currentVersion for existing published docs."],
    [3, "Publish = replace, with confirmation", "publish sets liveVersion = currentVersion. Desktop publish action opens the AlertDialog first. First-ever publish (liveVersion null) skips the dialog."],
    [4, "RAG filters to live", "Retrieval restricts chunks to liveVersion so Ask IDA never answers from an unapproved draft."],
    [5, "Library indicator + expand", "Row chip + expansion when currentVersion > liveVersion, showing the draft edition's status + an Open action."],
    [6, "Editor header + discard", "Working status/version + 'v1 live' note; 'Discard draft edition' to drop the fork and revert to the live version."],
    [7, "Verify", "tsc -b + vite build. Reset demo + re-seed; walk a doc through publish → edit → approve → replace; confirm operators/RAG saw v1 throughout."],
  ]
  return (
    <Section title="Implementation plan" description="Schema + serving first; the live version must be safe before anything else moves.">
      <Card>
        <CardContent className="space-y-3 pt-6">
          {steps.map(([n, t, d]) => (
            <div key={n} className="flex items-start gap-3 rounded-md border bg-card p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{n}</div>
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

function Decisions() {
  return (
    <Section title="Open decisions" description="Sign-off needed before any lifecycle code. Decision 1 gates the rest.">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Decision q="1. Option A (dual-version fields: liveVersion + currentVersion on one row)?" note="Recommend yes — smallest correct change, one identity, reconciles with the existing saveContent logic. Option B (forked row) only pays off with concurrent multi-fork editing, which is out of scope." />
          <Decision q="2. Replace confirmation on publishing a forked edition?" note="Recommend yes — 'Replace v1 with v2?' AlertDialog before liveVersion advances. Skipped on the first-ever publish (nothing to replace)." />
          <Decision q="3. Library: chip + expansion showing the in-progress edition?" note="Recommend yes — chip when currentVersion > liveVersion, expand to the draft edition's state + Open. Idle published docs unchanged." />
          <Decision q="4. RAG / Ask IDA answers from the live version only?" note="Recommend yes — never answer operators from an unapproved draft. A 'preview against draft' mode is a separate future feature." />
          <Separator className="my-2" />
          <Alert className="bg-amber-500/5">
            <CircleHelp className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-xs">Open · 2026-05-22. Decision 1 gates the build.</AlertTitle>
            <AlertDescription className="text-[11px]">
              No lifecycle code in this pass. The toast position and breadcrumb full-title fixes already
              shipped. Confirm Decision 1 (and 2–4, which are the natural consequences) and I'll build
              from step 1 — schema + serving first, so the live version is never at risk.
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
