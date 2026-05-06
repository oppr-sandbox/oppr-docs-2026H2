// Analysis page for the IDA sources + clear-chat-modal issues.
//
// First analysis built using the analysis-page skill. Static documentation —
// no live DB, no AI, no fetching. The components rendered as "current" and
// "proposed" are React mocks so the spec is browsable and reviewable inside
// the app at /analysis/ida-sources-and-clear-modal.
//
// This page is the canonical record of how the issue was framed, debated,
// and resolved. The "Results" section documents what actually shipped.

import { useState } from "react"
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  ListChecks,
  QrCode,
  Trash2,
  Sparkles,
  Wrench,
  ShieldCheck,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

const ASSET_IMG = "/analysis/ida-sources-and-clear-modal/asset-page.png"
const RESPONSE_IMG = "/analysis/ida-sources-and-clear-modal/ida-response.png"
const CLEAR_MODAL_IMG = "/analysis/ida-sources-and-clear-modal/clear-modal-current.png"

export function IdaSourcesAnalysis() {
  return (
    <AnalysisLayout
      title="IDA sources, origin clarity, and the clear-chat modal"
      subtitle="The user asked IDA a question scoped to FCK-102 (Feedstock Mixer). The answer was short and useful — but the source list was noisy, the origin (asset-link, doc, log) was invisible, and at least one cited document didn't appear to belong to this asset. Plus the clear-chat dialog was a raw window.confirm popup that broke the mobile look-and-feel. This page documents the diagnosis, the proposed fix, and what shipped."
      date="2026-05-06"
      scopes={["mobile", "AI", "data-model"]}
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
          value="Noisy sources, invisible origin, ugly clear-chat dialog"
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
          value="6 plan items · 7 files touched · 1 new component · 1 new schema table"
          tone="default"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b ✓ · vite build ✓ · cross-link badge guarded by stale-seed toast"
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
        <AlertTitle>Three issues compounding in one screen</AlertTitle>
        <AlertDescription>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>
              <strong>Clear-chat modal</strong> was a raw <code>window.confirm</code> — the
              browser's native &quot;localhost:5173 says…&quot; popup. It looked broken in a
              mobile shell that's otherwise polished.
            </li>
            <li>
              <strong>Source list was undifferentiated</strong>. The 6 citations were all
              styled the same. There was no way to tell whether a source was a doc that's
              linked to <em>this</em> asset, a doc that isn't, or a log. The operator had
              to trust IDA blindly.
            </li>
            <li>
              <strong>One cited doc didn't belong to this asset</strong>. IDA cited
              &quot;Shredder 2A operating manual&quot; while the asset page lists 2 docs and 0
              logs — neither is that title. Likely a stale IndexedDB blob from before the
              asset was renamed; either way, the UI gave the operator no way to find out.
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// --- 2. Evidence tabs -------------------------------------------------------

function EvidenceSection() {
  return (
    <Section
      title="Evidence"
      description="Three screenshots from one operator session on 2026-05-06."
    >
      <Tabs defaultValue="response">
        <TabsList>
          <TabsTrigger value="response">IDA response</TabsTrigger>
          <TabsTrigger value="asset">Asset page</TabsTrigger>
          <TabsTrigger value="modal">Clear-chat modal</TabsTrigger>
        </TabsList>
        <TabsContent value="response">
          <EvidenceCard
            caption="Mobile Ask IDA, scope = Asset · FCK-102. Question: 'What's the daily check on this asset?' The answer reads as 4 numbered steps; the Sources list below has 6 entries. Source [1] is a different doc; sources [2]–[6] are 5 chunks from one SOP, with the same section ('Before handover') appearing 3 times."
            src={RESPONSE_IMG}
            orientation="portrait"
          />
        </TabsContent>
        <TabsContent value="asset">
          <EvidenceCard
            caption="Asset page for FCK-102 (Feedstock Mixer). Shows '2 docs · 0 logs' connected. None of the 2 connected docs is a 'Shredder 2A operating manual'."
            src={ASSET_IMG}
            orientation="landscape"
          />
        </TabsContent>
        <TabsContent value="modal">
          <EvidenceCard
            caption="Tapping the Clear button in the IDA panel triggered window.confirm. The browser drew its native dialog, prefixed with the host. Visually inconsistent with everything else."
            src={CLEAR_MODAL_IMG}
            orientation="portrait"
          />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function EvidenceCard({
  caption,
  src,
  orientation = "landscape",
}: {
  caption: string
  src: string
  orientation?: "landscape" | "portrait"
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div
          className={cn(
            "overflow-hidden rounded-md border bg-muted/30",
            orientation === "portrait" && "flex items-center justify-center",
          )}
        >
          <img
            src={src}
            alt={caption}
            className={cn(
              "block",
              orientation === "landscape"
                ? "h-auto w-full"
                : "h-auto max-h-[640px] w-auto",
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

// --- 3. Data-model map ------------------------------------------------------

function DataModelMapSection() {
  return (
    <Section
      title="What's actually in the seed for FCK-102"
      description="Pulled from src/db/seed.ts so the analysis reflects ground truth, not the operator's stale IndexedDB blob."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Asset <code className="font-mono">asset-shredder-2a</code> · Code FCK-102 · Name
            &quot;Feedstock Mixer&quot;
          </CardTitle>
          <CardDescription>
            The legacy id <code>asset-shredder-2a</code> is a hint that this asset was
            renamed at some point. That matters for diagnosing the &quot;Shredder 2A operating
            manual&quot; citation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Connected documents (asset_ids includes this asset)
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">HOL-OPS-SOP-0001</TableCell>
                  <TableCell>Daily handover SOP — Pigment Line</TableCell>
                  <TableCell>SOP</TableCell>
                  <TableCell>
                    <Badge variant="secondary">published</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">HOL-OPS-SOP-0002</TableCell>
                  <TableCell>Feedstock Mixer (FCK-102) startup SOP</TableCell>
                  <TableCell>SOP</TableCell>
                  <TableCell>
                    <Badge variant="secondary">published</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">HOL-OPS-LMRA-0002</TableCell>
                  <TableCell>Hot work permit — site-wide</TableCell>
                  <TableCell>LMRA</TableCell>
                  <TableCell>
                    <Badge variant="secondary">published</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Three docs in the seed. The operator's screenshot showed two — the asset
              page count is filtering or the operator's IndexedDB was one seed version
              behind. Either way, none of them is &quot;Shredder 2A operating manual&quot;.
            </p>
          </div>
          <Separator />
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Connected logs (asset_logs.asset_id = this asset)
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                Empty array. The seed sets <code>logs: []</code> for FCK-102. The
                &quot;0 logs&quot; counter on the asset page is correct.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// --- 4. Current behavior — reproduced inline -------------------------------

function CurrentBehaviorSection() {
  return (
    <Section
      title="Current behaviour, reproduced as React"
      description="Below is a faithful mock of what the operator saw, built from the same shadcn primitives the panel uses. Open the screenshots tab above for pixel reference."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <CurrentSourcesMock />
        <CurrentClearModalMock />
      </div>
    </Section>
  )
}

function CurrentSourcesMock() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm">Old Sources block</CardTitle>
        <CardDescription>6 chips. No origin distinction. Section repeats.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sources
        </div>
        <FlatPill index={1} title="Shredder 2A operating manual" section="Weekly maintenance" />
        <div className="rounded-lg border bg-background p-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">Daily handover SOP</span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              5 sections
              <ChevronDown className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <SubPill index={2} section="Before handover" />
            <SubPill index={3} section="During handover" />
            <SubPill index={4} section="Before handover" />
            <SubPill index={5} section={null} />
            <SubPill index={6} section="Before handover" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FlatPill({
  index,
  title,
  section,
}: {
  index: number
  title: string
  section: string | null
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-background p-2">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[10px] font-semibold text-primary">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{title}</div>
        {section && (
          <div className="truncate text-[11px] text-muted-foreground">{section}</div>
        )}
      </div>
    </div>
  )
}

function SubPill({ index, section }: { index: number; section: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px]">
      <span className="font-semibold text-primary">{index}</span>
      <span className="truncate text-muted-foreground">{section ?? "—"}</span>
    </span>
  )
}

function CurrentClearModalMock() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Old Clear flow</CardTitle>
        <CardDescription>
          <code>window.confirm()</code> — the operator got a system dialog with a
          &quot;localhost:5173 says…&quot; prefix. Photo above. Below is the JS equivalent in
          plain text since we can't render the OS dialog inline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 rounded-lg border-2 border-dashed border-destructive/40 bg-destructive/5 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
            Browser native dialog
          </div>
          <div className="rounded-md border bg-background p-3 text-xs">
            <div className="mb-1 text-muted-foreground">localhost:5173 says</div>
            <div>Clear this conversation? This deletes the messages but keeps the chat scope.</div>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="outline" disabled>
                Cancel
              </Button>
              <Button size="sm" disabled>
                OK
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Source: <code>src/components/ai/AskPanel.tsx:211</code> called{" "}
            <code>window.confirm(...)</code>. shadcn AlertDialog was already in
            <code> src/components/ui/alert-dialog.tsx</code> and unused.
          </p>
        </div>
      </CardContent>
    </Card>
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
            symptom="Clear-chat modal looked like a system dialog"
            cause={
              <>
                <code>handleClearChat</code> in <code>AskPanel.tsx:205</code> called{" "}
                <code>window.confirm()</code>. shadcn <code>AlertDialog</code> existed but
                wasn't used anywhere in this file.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom="Same section repeats across citations (e.g. 'Before handover' x3)"
            cause={
              <>
                <code>SourcesBlock.tsx</code> grouped by <code>document_id</code> only. Two
                chunks from the same section produced two pills with identical labels.
                Grouping keys should include <code>page_or_section</code> so duplicates
                collapse.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom="6 sources for a 4-step answer felt heavy"
            cause={
              <>
                <code>topKForScope(scope)</code> in <code>chat.ts:71</code> returns 6 for
                doc/asset and 3 for library. The retrieval works as intended, but the
                display flattened chunks 1:1 to pills. After section-level grouping the
                visual chip count drops from 6 to ~3.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom="No way to tell if a cited doc was connected to this asset"
            cause={
              <>
                The <code>Citation</code> type carried <code>document_id</code> and{" "}
                <code>document_title</code> but no origin tag. The pill renderer didn't
                cross-reference <code>document_assets</code> for the active scope, so the
                operator couldn't visually filter &quot;mine&quot; vs &quot;outside&quot;.
              </>
            }
            confidence="high"
          />
          <RootCauseRow
            symptom={'Citation [1] "Shredder 2A operating manual" doesn\'t exist in seed'}
            cause={
              <>
                Most likely cause: <strong>stale IndexedDB</strong>. The asset's id is
                still <code>asset-shredder-2a</code>, a leftover from an earlier seed
                version. The operator's local DB blob predates the rename. Less likely: a
                hallucinated title (citations are built deterministically from{" "}
                <code>retrieval.chunks</code> in <code>chat.ts:204-214</code> — the model
                can't influence the chip text).
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

// --- 6. Edge-cases table ---------------------------------------------------

interface EdgeRow {
  scenario: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
  shipped: boolean
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Asset has 0 connected docs; user asks question",
    current: "Asset retrieval returns []; chat returns '(no excerpts available)' answer.",
    expected: "Empty-state card: 'No documents are linked to this asset yet. Link one first or ask in library scope.'",
    severity: "high",
    shipped: false,
  },
  {
    scenario: "Asset has 1 doc; doc has 1 chunk",
    current: "1 pill rendered with section label. Fine.",
    expected: "Same as before — single-citation answers stay compact (legacy CitationPill path preserved).",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "Asset has 1 doc; same section yields 3 chunks",
    current: "3 sub-pills with identical labels.",
    expected: "1 sub-pill labelled 'Before handover ×3', click target = first chunk.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Library scope; top-3 = 3 docs",
    current: "3 separate cards.",
    expected: "Same. 3 docs → 3 cards is correct.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "Asset scope; cited doc isn't linked to the asset",
    current: "Pill rendered with no flag. User couldn't tell.",
    expected: "Cross-link badge with explainer popover. Origin computed in chat.ts via listDocumentsForAsset.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "User clicks Clear with 0 messages",
    current: "Confirm dialog appeared anyway, then cleared nothing.",
    expected: "Empty session: skip the dialog entirely, just reset local state.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "User clicks Clear during a streaming response",
    current: "Confirm fired, accept cleared messages but stream continued writing.",
    expected: "abortRef.current?.abort() runs first, then deleteMessages.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Operator on slow 4G, taps Clear, dismisses, taps again",
    current: "Two confirms in sequence. Second one appeared after first dismiss.",
    expected: "AlertDialog is modal; second tap while open is a no-op.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "IDA cites a doc; user taps the source pill",
    current: "Existing onOpen handler navigates to the doc. Works.",
    expected: "Same. Plus: cross-link popover gives one-click context before the user navigates away.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Operator returns next day; opens IDA on FCK-102",
    current: "Auto-resumes the prior asset session.",
    expected: "Default = blank chat with history accessible via History button.",
    severity: "low",
    shipped: false,
  },
  {
    scenario: "Logs ever join the citation pool",
    current: "Today logs aren't chunked. So no log citations.",
    expected: "Origin tag includes 'log' for future asset-log RAG; SourcesBlock renders amber tone.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "IndexedDB is stale (seed renamed)",
    current: "Citation referenced a title that no longer existed. Operator confused.",
    expected: "Boot-time toast: 'Demo data is out of date. Settings → Reset demo to refresh.' Driven by SEED_VERSION constant + meta table row.",
    severity: "med",
    shipped: true,
  },
]

function EdgeCasesSection() {
  const shippedCount = EDGE_CASES.filter((e) => e.shipped).length
  return (
    <Section
      title="Edge cases"
      description={`The proposal had to handle all of these without regressing the good cases. ${shippedCount} of ${EDGE_CASES.length} are covered by the shipped change.`}
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[24%]">Scenario</TableHead>
                <TableHead className="w-[26%]">Current</TableHead>
                <TableHead className="w-[34%]">Expected</TableHead>
                <TableHead className="w-[8%] text-right">Sev.</TableHead>
                <TableHead className="w-[8%] text-right">Ship.</TableHead>
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
                  <TableCell className="align-top text-right">
                    {row.shipped ? (
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

// --- 7. Self-grilling ------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Honest counter-hypotheses tested before touching production code."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Was the section-grouping the right grouping level? Why not just dedupe by chunk text?"
            a="Section grouping won because operators read sources at the section level — 'Before handover' is the meaningful unit. Dedupe by chunk text would also work, but the chip label would just say 'Before handover' anyway, so the result is identical with extra code. The shipped grouping uses (document_id, page_or_section) as the key and shows quote-count when N>1. If section is null we fall back to a single 'Unlabelled section' bucket per doc."
          />
          <Grill
            q="What would falsify the 'stale IndexedDB' hypothesis for the Shredder 2A title?"
            a="Settings → Reset demo, repeat the same prompt against FCK-102, and check whether [1] still says 'Shredder 2A operating manual'. If it does, the hypothesis is wrong and retrieval is genuinely leaking. The shipped seed_version toast turns the hypothesis into a self-diagnosing prompt — operators with stale data are told to reset before they trust the cross-link badge."
          />
          <Grill
            q="Does adding origin badges punish the model for being right?"
            a="Possible failure mode: after grouping + badge, the operator only trusts asset-linked citations and ignores valid library matches. Mitigation: in asset scope only show citations from chunks in the asset's pool (already true via listForAsset). The badge is a safety net — usually green-emerald 'Linked', very rarely orange 'Not linked', never silent."
          />
          <Grill
            q="Why not just delete the noisy citations server-side?"
            a="Two reasons. (1) The pool is already minimal — listForAsset is bounded. (2) Sometimes the operator wants context from a sibling doc (e.g., the site-wide LMRA on a hot-work step). Hiding it is worse than tagging it. Display-time grouping is the correct surface."
          />
          <Grill
            q="Was replacing window.confirm enough? What about the visual scope of 'Clear'?"
            a="Replacing window.confirm fixed the visual symptom. The deeper question is what 'Clear' does — keep the session row, drop the messages. That's already what popLastTurn / deleteMessages do. The shipped AlertDialog body explicitly says 'Messages will be removed. The current scope (Asset · FCK-102 · Feedstock Mixer) stays selected.' so the operator isn't surprised when their next question runs in the same context."
          />
          <Grill
            q="What's the smallest PR that still moves the needle?"
            a="Three diffs were the floor: AlertDialog for clear, section-level grouping, and origin tone in pills. The shipped change added origin computation in chat.ts plus the seed_version toast as a 4th and 5th diff. Each is independently verifiable; if any one needs to be reverted, the others stand on their own."
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
      description="Below are real React mocks of the two surfaces. They use the same primitives the production panel uses, so the diff is small."
    >
      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Sources block</TabsTrigger>
          <TabsTrigger value="modal">Clear-chat dialog</TabsTrigger>
        </TabsList>
        <TabsContent value="sources">
          <div className="grid gap-4 md:grid-cols-2">
            <CurrentSourcesMock />
            <ProposedSourcesMock />
          </div>
        </TabsContent>
        <TabsContent value="modal">
          <div className="grid gap-4 md:grid-cols-2">
            <CurrentClearModalMock />
            <ProposedClearModal />
          </div>
        </TabsContent>
      </Tabs>
    </Section>
  )
}

interface ProposedCitation {
  index: number
  title: string
  code: string
  origin: "asset-link" | "cross-link" | "log"
  sections: Array<{ label: string | null; quotes: number; firstIndex: number }>
}

const PROPOSED_GROUPS: ProposedCitation[] = [
  {
    index: 1,
    title: "Daily handover SOP — Pigment Line",
    code: "HOL-OPS-SOP-0001",
    origin: "asset-link",
    sections: [
      { label: "Before handover", quotes: 3, firstIndex: 1 },
      { label: "During handover", quotes: 1, firstIndex: 2 },
      { label: null, quotes: 1, firstIndex: 3 },
    ],
  },
  {
    index: 2,
    title: "Shredder 2A operating manual",
    code: "(stale)",
    origin: "cross-link",
    sections: [{ label: "Weekly maintenance", quotes: 1, firstIndex: 4 }],
  },
]

function ProposedSourcesMock() {
  const [openIndex, setOpenIndex] = useState<number | null>(1)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Shipped Sources block</CardTitle>
        <CardDescription>
          Grouped by (doc, section). Origin tag visible. 6 chunks → 2 cards → 4 unique sections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sources · 4 unique
        </div>
        {PROPOSED_GROUPS.map((g) => (
          <ProposedSourceCard
            key={g.index}
            group={g}
            open={openIndex === g.index}
            onToggle={() => setOpenIndex(openIndex === g.index ? null : g.index)}
          />
        ))}
        <p className="pt-1 text-[10px] text-muted-foreground">
          Tap the cross-link badge to see why this doc surfaced even though it's not
          linked to FCK-102.
        </p>
      </CardContent>
    </Card>
  )
}

function ProposedSourceCard({
  group,
  open,
  onToggle,
}: {
  group: ProposedCitation
  open: boolean
  onToggle: () => void
}) {
  const originTone =
    group.origin === "asset-link"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : group.origin === "log"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-orange-500/40 bg-orange-500/5"
  const originIcon =
    group.origin === "asset-link" ? Boxes : group.origin === "log" ? QrCode : AlertTriangle
  const Icon = originIcon
  const originLabel =
    group.origin === "asset-link"
      ? "Linked to this asset"
      : group.origin === "log"
        ? "Asset log"
        : "Not linked to this asset"

  return (
    <div className={cn("rounded-lg border bg-background p-2 transition-colors", originTone)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 text-left"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <FileText className="h-3 w-3 text-muted-foreground" />
        <span className="truncate text-xs font-medium">{group.title}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px]">
          <Icon className="h-3 w-3" />
          <span>{originLabel}</span>
        </span>
      </button>
      <div className="mt-1 pl-5 text-[10px] font-mono text-muted-foreground">
        {group.code}
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1 pl-5">
          {group.sections.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-0.5 text-[11px]"
            >
              <span className="font-semibold text-primary">{s.firstIndex}</span>
              <span className="truncate text-muted-foreground">
                {s.label ?? "Section unlabelled"}
              </span>
              {s.quotes > 1 && (
                <span className="rounded bg-muted px-1 text-[9px] text-muted-foreground">
                  ×{s.quotes}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ProposedClearModal() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Shipped Clear-chat dialog</CardTitle>
        <CardDescription>
          shadcn AlertDialog. Native to the app. Same colour tokens as the rest of the
          panel. Tap the button to see it open in place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Clear chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
                <AlertDialogDescription>
                  All messages in this chat will be removed. The current scope —{" "}
                  <span className="font-medium text-foreground">
                    Asset · FCK-102 · Feedstock Mixer
                  </span>{" "}
                  — stays selected, so your next question runs in the same context.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear messages
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

// --- 9. Results ------------------------------------------------------------

interface ResultRow {
  title: string
  files: string[]
  before: string
  after: string
}

const RESULTS: ResultRow[] = [
  {
    title: "ClearChatDialog component",
    files: [
      "src/components/ai/ClearChatDialog.tsx (new)",
      "src/components/ai/AskPanel.tsx",
      "src/components/ai/ScopeChip.tsx",
    ],
    before:
      "window.confirm() popup with 'localhost:5173 says…' prefix. No abort of in-flight stream on confirm. Empty sessions still triggered the dialog.",
    after:
      "shadcn AlertDialog. Body explicitly names the scope that stays selected ('Asset · FCK-102 · Feedstock Mixer'). Empty sessions skip the dialog. handleClearConfirm aborts the active stream before deleting messages.",
  },
  {
    title: "Section-level source grouping",
    files: ["src/components/ai/SourcesBlock.tsx"],
    before:
      "Citations grouped only by document_id. Five chunks from the same SOP rendered as five separate sub-pills, with the same section label appearing 3+ times.",
    after:
      "Two-level grouping by (document_id, page_or_section). Repeats collapse with an '×N' quote count. Single-citation answers still render the legacy CitationPill so simple cases stay compact. Hidden DOM anchors keep [N] footnote scrolling alive when chunks merge.",
  },
  {
    title: "Citation origin field",
    files: [
      "src/types/index.ts",
      "src/ai/chat.ts",
      "src/components/ai/SourcesBlock.tsx",
    ],
    before:
      "Citation type carried document_id and document_title only. The pill renderer couldn't tell the user whether a cited doc was actually linked to their asset.",
    after:
      "Citation gains origin: 'asset-link' | 'cross-link' | 'log'. In asset scope, chat.ts builds a Set of doc IDs from listDocumentsForAsset and tags each citation. Doc/library scopes default to 'asset-link' (no badge). Origin drives the pill's border tone and badge.",
  },
  {
    title: "Cross-link explainer popover",
    files: ["src/components/ai/SourcesBlock.tsx"],
    before:
      "If retrieval surfaced a doc not linked to the asset, the operator had no signal — and no way to tell whether IDA was confused or their data was stale.",
    after:
      "Cross-link badge opens a Popover saying 'This doc isn't connected to your asset. If this looks wrong, try Settings → Reset demo.' Diagnostic by design — should rarely fire under normal use.",
  },
  {
    title: "Stale-seed detection",
    files: [
      "src/db/schema.sql",
      "src/db/seed.ts",
      "src/db/DbProvider.tsx",
    ],
    before:
      "Operators on an old IndexedDB blob saw fixtures that no longer matched the current source. Symptoms (e.g. citations to renamed docs) looked like AI bugs.",
    after:
      "New meta(key, value) table. SEED_VERSION constant exported from seed.ts. seed() inserts a row on every reset. DbProvider checks once per page load and fires a sonner.warning toast on mismatch. The cross-link badge now has a self-diagnosing prompt right next to it.",
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

// --- 10. Implementation plan -----------------------------------------------

interface PlanStep {
  label: string
  files: string[]
  detail: string
  status: "shipped" | "deferred"
}

const PLAN: PlanStep[] = [
  {
    label: "Replace window.confirm with shadcn AlertDialog",
    files: [
      "src/components/ai/AskPanel.tsx",
      "src/components/ai/ClearChatDialog.tsx (new)",
      "src/components/ai/ScopeChip.tsx",
    ],
    detail:
      "Extracted ClearChatDialog with controlled open state and a scope-aware body. handleClearChat opens the dialog (or short-circuits for empty sessions); handleClearConfirm aborts the in-flight stream before deleteMessages. useScopeLabel exported from ScopeChip so the dialog can reuse it.",
    status: "shipped",
  },
  {
    label: "Group citations by (document_id, page_or_section)",
    files: ["src/components/ai/SourcesBlock.tsx"],
    detail:
      "Two-level grouping. Repeats collapse with an ×N quote-count badge. Simple single-citation answers still go through the legacy CitationPill so the visual stays compact. Hidden anchor nodes preserve [N] footnote scrolling for collapsed indices.",
    status: "shipped",
  },
  {
    label: "Add origin tag to citations",
    files: [
      "src/types/index.ts",
      "src/ai/chat.ts",
      "src/components/ai/SourcesBlock.tsx",
    ],
    detail:
      "Citation gains origin: 'asset-link' | 'cross-link' | 'log'. chat.ts builds a Set of asset-linked doc IDs (only for asset scope) and tags each citation. Pill border + badge tone follow the origin.",
    status: "shipped",
  },
  {
    label: "Cross-link tooltip explaining the linkage",
    files: ["src/components/ai/SourcesBlock.tsx"],
    detail:
      "Popover anchored to the cross-link badge. Copy points the operator at Settings → Reset demo when their data looks wrong, so the badge becomes a self-diagnosing prompt instead of a dead-end warning.",
    status: "shipped",
  },
  {
    label: "seed_version + warning toast on stale IndexedDB",
    files: [
      "src/db/schema.sql",
      "src/db/seed.ts",
      "src/db/DbProvider.tsx",
    ],
    detail:
      "meta(key, value) table. SEED_VERSION = 2 exported from seed.ts and stamped on every reset. DbProvider checks on first boot per page load and fires a sonner.warning toast on mismatch. Cross-tab DB swaps don't re-fire (guarded by a ref).",
    status: "shipped",
  },
  {
    label: "Verification",
    files: [],
    detail: "npx tsc -b → exit 0. npx vite build → exit 0 (only the pre-existing PdfViewer / TiptapReadOnly chunking warnings remain).",
    status: "shipped",
  },
  {
    label: "Empty-state for asset with 0 connected docs (deferred)",
    files: ["src/components/ai/AskPanel.tsx"],
    detail:
      "Not shipped in this pass. When an asset has no docs, the chat answer is '(no excerpts available)' which is correct but unhelpful. Tracked for the next IDA UX pass.",
    status: "deferred",
  },
  {
    label: "Default-blank IDA on each open + history drawer (deferred)",
    files: ["src/components/ai/AskPanel.tsx", "src/db/repositories/qa.ts"],
    detail:
      "Not shipped in this pass. The chat history rework (star/save/share, scope-filtered history) was scoped out so the source/origin/clear-modal change could ship as one focused diff.",
    status: "deferred",
  },
]

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan"
      description="The plan as it stood before implementation, annotated with shipped vs deferred status."
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
                        <Check className="h-2.5 w-2.5" />
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

// --- 11. Decisions ---------------------------------------------------------

interface DecisionRow {
  question: string
  decision: string
}

const DECISIONS: DecisionRow[] = [
  {
    question: "Origin tag UX — green-emerald for 'linked' or no badge?",
    decision:
      "Show a subtle 'Linked' badge in green-emerald only on multi-section grouped cards (single-pill layout stays unchanged). Cross-link gets the prominent orange badge + popover. Library scope shows no badge.",
  },
  {
    question: "Stale-seed banner — toast or persistent app-shell banner?",
    decision:
      "One-shot sonner.warning toast on first boot per page load. Cheap, dismissable, and doesn't punish operators who have a valid reason to be on an older version.",
  },
  {
    question: "Section-level dedupe — what label for null sections?",
    decision:
      "'Unlabelled section' bucket per doc. Operators may not act on these, but they preserve the citation index so [N] footnote scrolling still works.",
  },
  {
    question: "Library scope and origin tag",
    decision:
      "No badge in library scope. Every doc is fair game; flagging anything would be a false positive. Origin defaults to 'asset-link' for non-asset scopes.",
  },
  {
    question: "Confirm-while-streaming behaviour",
    decision:
      "Silent abort. handleClearConfirm calls abortRef.current?.abort() then deleteMessages. No special copy — the operator's intent is unambiguous.",
  },
]

function DecisionsSection() {
  return (
    <Section
      title="Decisions made"
      description="The open questions from the original plan, recorded with the call that was made before implementation."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          {DECISIONS.map((d) => (
            <div key={d.question} className="flex items-start gap-2">
              <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
          This case is shipped. Two follow-ups remain on the deferred list (empty-state
          for assets with zero connected docs, and the IDA history/star/share rework). Each
          will get its own analysis page when picked up.
        </AlertDescription>
      </Alert>
    </Section>
  )
}
