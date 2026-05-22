// Analysis: Authoring completeness & document lifecycle.
//
// Static case file at /analysis/authoring-completeness. Pure presentational —
// no DB, no AI, no live data. Renders proposed UX as real shadcn mocks.
// See .claude/skills/analysis-page/SKILL.md.

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDot,
  Hash,
  Image as ImageIcon,
  ListChecks,
  Lock,
  ShieldCheck,
  Wrench,
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

// ---------------------------------------------------------------------------
// 1. Summary band
// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="8 workstreams to make authoring complete, governed, and foolproof"
          tone="destructive"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="Shipped · 2026-05-21"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="Schema + naming/templates/lifecycle backend, metadata + naming + templates UI, gated edit flow, corner-drag resize, asset pill labels, PDF-as-attachment, reset-to-reference seed"
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b 0 · vite build 0 · backend deployed"
          tone="emerald"
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

// ---------------------------------------------------------------------------
// 2. Problem statement
// ---------------------------------------------------------------------------

function ProblemStatement() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>What we're solving</AlertTitle>
      <AlertDescription className="space-y-2 text-sm leading-relaxed">
        <p>
          The showcase can author documents, but the authoring loop isn't{" "}
          <em>complete</em>. There is no governed review cycle, the naming code
          is hard-coded to <code>HOL-OPS</code>, templates are buried in a
          source file with no management surface, the metadata panel mixes
          first-class fields with things that should be derived from the body,
          and image resize fights the user. We want a clean, foolproof v1 of
          the whole authoring spine — starting from a wiped database with a
          single, fully-featured reference document.
        </p>
        <p className="text-xs">
          Forward constraint (noted, not designed for here): document bodies
          move to a separate store later. Today they live in Convex behind the
          function boundary, which is the right seam to keep.
        </p>
      </AlertDescription>
    </Alert>
  )
}

// ---------------------------------------------------------------------------
// 3. Scope overview
// ---------------------------------------------------------------------------

interface ScopeRow {
  n: number
  workstream: string
  newPages: string
  complexity: "S" | "M" | "L"
}

const SCOPE: ScopeRow[] = [
  {
    n: 1,
    workstream: "Fresh start — wipe DB, seed one full reference document",
    newPages: "—",
    complexity: "S",
  },
  {
    n: 2,
    workstream: "Author / Reviewer / Approver lifecycle (gated transitions)",
    newPages: "—",
    complexity: "L",
  },
  {
    n: 3,
    workstream: "Template system — DB-backed, with a /templates manager",
    newPages: "/templates, /templates/new, /templates/:id/edit",
    complexity: "L",
  },
  {
    n: 4,
    workstream: "Naming system — location + discipline + type + per-triplet seq",
    newPages: "/settings/naming (vocabulary config)",
    complexity: "M",
  },
  {
    n: 5,
    workstream: "Metadata cleanup — drop tags + manual assets, add the 3 selectors",
    newPages: "—",
    complexity: "S",
  },
  {
    n: 6,
    workstream: "Asset linking in body — pill insert + auto-derived links",
    newPages: "—",
    complexity: "M",
  },
  {
    n: 7,
    workstream: "Image insert from library + robust corner-drag resize",
    newPages: "—",
    complexity: "M",
  },
]

function ScopeOverview() {
  return (
    <Section
      title="The complete list"
      description="Seven workstreams. Three new pages. Numbering and lifecycle decisions already locked (see Decisions)."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Workstream</TableHead>
                <TableHead>New pages</TableHead>
                <TableHead className="w-20 text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCOPE.map((r) => (
                <TableRow key={r.n}>
                  <TableCell className="align-top font-mono text-xs text-muted-foreground">
                    {r.n}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {r.workstream}
                  </TableCell>
                  <TableCell className="align-top font-mono text-[11px] text-muted-foreground">
                    {r.newPages}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.complexity === "L" &&
                          "border-destructive/40 text-destructive",
                        r.complexity === "M" &&
                          "border-amber-500/40 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {r.complexity === "S"
                        ? "small"
                        : r.complexity === "M"
                          ? "medium"
                          : "large"}
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

// ---------------------------------------------------------------------------
// 4. Per-workstream breakdown
// ---------------------------------------------------------------------------

function Workstream({
  n,
  title,
  current,
  gap,
  proposed,
  files,
}: {
  n: number
  title: string
  current: string
  gap: string
  proposed: React.ReactNode
  files: string[]
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
            WS{n}
          </Badge>
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded border border-destructive/20 bg-destructive/5 p-2.5">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
              Today
            </div>
            <div className="text-xs text-muted-foreground">{current}</div>
          </div>
          <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2.5">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Gap
            </div>
            <div className="text-xs text-muted-foreground">{gap}</div>
          </div>
        </div>
        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2.5">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Proposed
          </div>
          <div className="space-y-1.5 text-xs text-foreground">{proposed}</div>
        </div>
        <div className="flex flex-wrap gap-1">
          {files.map((f) => (
            <code
              key={f}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
            >
              {f}
            </code>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Workstreams() {
  return (
    <Section
      title="Workstream by workstream"
      description="Each card: what exists today, the gap, and the proposed shape with the files it touches."
    >
      <div className="space-y-4">
        <Workstream
          n={1}
          title="Fresh start — one full reference document"
          current="seed.ts loads 12 demo docs (pigment-calcination skin). wipeAll exists as an internalMutation but isn't reachable from the UI; Settings reset re-seeds the 12."
          gap="We want to demo from a clean slate with exactly one document that exercises every authoring primitive, so the reference is unambiguous."
          proposed={
            <>
              <p>
                Add a <code>resetToReference</code> admin path: wipe all app
                tables, then seed <strong>one</strong> document that uses every
                element — heading tree, PPE row, callouts, a step list, a
                troubleshooting table, an SVG diagram, a launch-log block, a
                linked-asset pill, and an image. It carries a full lifecycle
                record (author set, reviewer set, approved, published).
              </p>
              <p>
                Keep the 6-asset registry (the pill picker and QR flow need
                targets) but trim documents to the single reference.
              </p>
            </>
          }
          files={[
            "convex/admin.ts",
            "convex/seed.ts",
            "src/admin/seedDataset.ts",
            "src/admin/seedBodies.ts",
            "SettingsPage.tsx",
          ]}
        />

        <Workstream
          n={2}
          title="Author / Reviewer / Approver lifecycle"
          current="savePublish() accepts any status and writes it. Anyone can jump straight to Published. No author/reviewer/approver fields exist. Status enum is draft | in_review | published | archived."
          gap="No governed cycle. No record of who reviewed or approved. No gate stopping an unreviewed doc from publishing."
          proposed={
            <>
              <p>
                Add an <code>approved</code> state and three role fields to{" "}
                <code>documents</code>: <code>authorId</code>,{" "}
                <code>reviewerId</code>, <code>approverId</code> (all nullable
                so you can start without them). For a single-user showcase the
                role pickers default to "me" but are explicit fields, so the
                same person can be author + reviewer + approver.
              </p>
              <p>
                Gate transitions <strong>server-side</strong> in dedicated
                mutations (not the catch-all savePublish):
              </p>
              <LifecycleStepperMock />
              <p>
                Record a <code>signoffs</code> sub-record per version (who,
                role, timestamp) so the read view and PDF export can show the
                approval trail.
              </p>
            </>
          }
          files={[
            "convex/schema.ts",
            "convex/documents.ts",
            "DocumentEditPage.tsx",
            "DocumentHero.tsx",
            "StatusBadge.tsx",
          ]}
        />

        <Workstream
          n={3}
          title="Template system — DB-backed manager"
          current="DocumentTemplates.ts holds 4 hard-coded JSON skeletons keyed by type. templateForType() swaps them in the new-doc flow. No way to edit a template without a code change."
          gap="No management surface. Can't add a second SOP template, can't tune the standard skeleton, can't see what placeholders a template carries."
          proposed={
            <>
              <p>
                New Convex <code>templates</code> table:{" "}
                <code>name</code>, <code>type</code>, <code>bodyJson</code>,{" "}
                <code>description</code>, <code>updatedAt</code>. A{" "}
                <code>/templates</code> manager lists them with
                Edit / Duplicate / Delete; editing opens the real{" "}
                <code>DocumentEditor</code> in a template-authoring mode.
              </p>
              <p>
                The new-document flow gains a step:{" "}
                <strong>start blank</strong> or{" "}
                <strong>start from a template</strong> (picker grouped by type).
                Seed the table from today's 4 skeletons so nothing is lost.
                Templates use the same TipTap JSON, so placeholders are just
                empty paragraphs / empty table cells the author fills in.
              </p>
            </>
          }
          files={[
            "convex/schema.ts",
            "convex/templates.ts",
            "src/pages/desktop/TemplatesPage.tsx",
            "src/pages/desktop/TemplateEditPage.tsx",
            "DocumentNewChooserPage.tsx",
            "App.tsx",
            "DesktopShell.tsx",
          ]}
        />

        <Workstream
          n={4}
          title="Naming system — configurable, per-triplet sequence"
          current="NamingCodeField hard-codes SITE='HOL', DEPT='OPS'. Type token mapped in code. Next number scans existing codes client-side for the max + 1 (race-prone, type-only scope)."
          gap="No way to choose location or discipline. No vocabulary to pick from. The sequence is type-only and computed on the client, so two simultaneous creates can collide."
          proposed={
            <>
              <p>
                Vocabulary tables in Convex (<code>namingLocations</code>,{" "}
                <code>namingDisciplines</code>, plus the fixed type tokens) with
                a <code>/settings/naming</code> page to manage the dropdown
                options (code + label, e.g. <code>HOL</code> = "Holliday").
              </p>
              <p>
                The code becomes{" "}
                <code>{"{LOC}-{DISC}-{TYPE}-{NNNN}"}</code> built from three
                dropdowns. The sequence is{" "}
                <strong>per location+discipline+type</strong>, allocated{" "}
                <strong>atomically server-side</strong> from a{" "}
                <code>namingCounters</code> row keyed by the triplet — no client
                max-scan, no race.
              </p>
              <NamingBuilderMock />
            </>
          }
          files={[
            "convex/schema.ts",
            "convex/naming.ts",
            "src/pages/desktop/NamingSettingsPage.tsx",
            "NamingCodeField.tsx",
            "MetadataPanel.tsx",
            "convex/documents.ts",
          ]}
        />

        <Workstream
          n={5}
          title="Metadata cleanup"
          current="MetadataPanel shows Title, Type, Owner, Naming code, Tags (free entry), and Linked assets (manual AssetMultiSelect)."
          gap="Tags are noise for a governed SOP set. Manual linked-assets duplicate what's already in the body. Location and discipline have nowhere to live."
          proposed={
            <>
              <p>
                Remove the <strong>Tags</strong> field and the manual{" "}
                <strong>Linked assets</strong> multi-select. Add{" "}
                <strong>Location</strong> and <strong>Discipline</strong>{" "}
                selectors next to Type — together they drive the naming code.
              </p>
              <p>
                Replace the manual asset field with a{" "}
                <strong>read-only "Linked assets (from body)"</strong> list,
                derived from the asset pills present in the document (see WS6).
                Author + reviewer + approver pickers (WS2) also live here.
              </p>
            </>
          }
          files={["MetadataPanel.tsx", "convex/schema.ts", "convex/documents.ts"]}
        />

        <Workstream
          n={6}
          title="Asset linking in the body"
          current="LinkedAssetNode + LinkedAssetPicker already exist: a toolbar/slash entry opens a search dialog over the registry and inserts a [# CODE] pill. Label is always the code only."
          gap="No choice of label format (code vs code + name). And documentAssets is still populated from the manual metadata field, not from the pills the author actually placed."
          proposed={
            <>
              <p>
                Extend the picker with a label-format toggle:{" "}
                <strong>code only</strong> (<code>RMR-101</code>) or{" "}
                <strong>code + name</strong> (
                <code>RMR-101 — Raw-meal reactor</code>). Pill stores both{" "}
                <code>assetId</code> and the chosen display form.
              </p>
              <p>
                On save, walk the body for <code>linkedAsset</code> nodes and
                recompute <code>documentAssets</code> — exactly the pattern{" "}
                <code>recomputeUsagesForVersion</code> uses for images. The
                metadata "Linked assets" list (WS5) reads from this. Manual
                linking is gone; the body is the single source of truth.
              </p>
            </>
          }
          files={[
            "LinkedAssetBlock.tsx",
            "convex/lib/assetWalker.ts",
            "convex/documents.ts",
            "convex/lib/imageWalker.ts",
          ]}
        />

        <Workstream
          n={7}
          title="Image insert + robust resize"
          current="Insert already supports upload / URL / library. Resize is a +/- button cluster + slider pinned absolute right-1 top-1 INSIDE the width-% inner div."
          gap="As the image shrinks, the inner div shrinks, so the control cluster slides up and to the left — away from the cursor. You chase the corner down-left every step. A moving target."
          proposed={
            <>
              <p>
                Replace the click-to-shrink cluster with a{" "}
                <strong>bottom-right corner drag handle</strong> using{" "}
                <code>setPointerCapture</code>. The handle sits on the corner
                you're dragging, so it stays under the cursor for the whole
                gesture — the standard Notion / Google-Docs pattern. Width still
                clamps to 10–100% and persists as <code>data-width</code>.
              </p>
              <p>
                Keep align (left/center/right) as a small fixed toolbar, but
                anchor it to the <em>outer</em> full-width wrapper so it never
                moves with the image. Optional A11y: arrow-key nudge when
                selected.
              </p>
              <ResizeHandleMock />
            </>
          }
          files={["ImageWithRef.tsx"]}
        />
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Inline mocks
// ---------------------------------------------------------------------------

function LifecycleStepperMock() {
  const steps = [
    { label: "Draft", gate: "free", done: true },
    { label: "In review", gate: "reviewer set", done: true },
    { label: "Approved", gate: "approver + Approve", done: true },
    { label: "Published", gate: "must be Approved", done: false },
  ]
  return (
    <div className="my-2 flex flex-wrap items-stretch gap-1 rounded-md border bg-background p-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1">
          <div
            className={cn(
              "rounded-md border px-2 py-1 text-center",
              s.done
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-dashed border-muted-foreground/40",
            )}
          >
            <div className="flex items-center gap-1 text-[11px] font-semibold">
              {s.done ? (
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
              {s.label}
            </div>
            <div className="text-[9px] text-muted-foreground">{s.gate}</div>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  )
}

function NamingBuilderMock() {
  return (
    <div className="my-2 rounded-md border bg-background p-3">
      <div className="flex flex-wrap items-end gap-2 text-[11px]">
        <MockSelect label="Location" value="HOL" />
        <span className="pb-1.5 font-mono text-muted-foreground">-</span>
        <MockSelect label="Discipline" value="OPS" />
        <span className="pb-1.5 font-mono text-muted-foreground">-</span>
        <MockSelect label="Type" value="SOP" />
        <span className="pb-1.5 font-mono text-muted-foreground">-</span>
        <div>
          <div className="mb-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            Seq (auto)
          </div>
          <div className="rounded border bg-muted/40 px-2 py-1 font-mono">
            0003
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <Hash className="h-3 w-3 text-muted-foreground" />
        <code className="font-mono font-semibold">HOL-OPS-SOP-0003</code>
        <span className="text-[10px] text-muted-foreground">
          (next in the HOL+OPS+SOP sequence, allocated on create)
        </span>
      </div>
    </div>
  )
}

function MockSelect({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-2 rounded border bg-background px-2 py-1 font-mono">
        {value}
        <span className="text-muted-foreground">▾</span>
      </div>
    </div>
  )
}

function ResizeHandleMock() {
  return (
    <div className="my-2 flex gap-3">
      <div className="flex-1 rounded-md border border-destructive/20 bg-destructive/5 p-2">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
          Today — controls inside the image
        </div>
        <div className="relative mx-auto h-16 w-2/3 rounded bg-muted">
          <div className="absolute right-0.5 top-0.5 flex gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-background shadow" />
            <div className="h-3 w-3 rounded-sm bg-background shadow" />
          </div>
        </div>
        <div className="mt-1 text-[9px] text-muted-foreground">
          Shrinks → cluster slides up-left, away from cursor.
        </div>
      </div>
      <div className="flex-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          Proposed — corner drag handle
        </div>
        <div className="relative mx-auto h-16 w-2/3 rounded bg-muted">
          <div className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border-2 border-primary bg-background" />
        </div>
        <div className="mt-1 text-[9px] text-muted-foreground">
          Handle is on the corner you drag — stays under the cursor.
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. Data-model map
// ---------------------------------------------------------------------------

interface SchemaRow {
  table: string
  change: "new" | "altered"
  detail: string
}

const SCHEMA: SchemaRow[] = [
  {
    table: "documents",
    change: "altered",
    detail:
      "+ authorId, reviewerId, approverId (nullable); + location, discipline; status union gains 'approved'",
  },
  {
    table: "documentVersions",
    change: "altered",
    detail: "+ signoffs: [{ role, userId, at }] for the approval trail",
  },
  {
    table: "templates",
    change: "new",
    detail: "name, type, description, bodyJson, updatedAt — backs /templates",
  },
  {
    table: "namingLocations",
    change: "new",
    detail: "code, label — dropdown vocabulary",
  },
  {
    table: "namingDisciplines",
    change: "new",
    detail: "code, label — dropdown vocabulary",
  },
  {
    table: "namingCounters",
    change: "new",
    detail:
      "key (loc|disc|type), value — atomic per-triplet sequence, patched inside create",
  },
  {
    table: "documentAssets",
    change: "altered",
    detail:
      "becomes a derived cache recomputed from body pills on save (was manual)",
  },
]

function DataModelMap() {
  return (
    <Section
      title="Data-model changes"
      description="Three new tables, two altered. Bodies stay behind the Convex function boundary for the future separate-store move."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead className="w-20">Change</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCHEMA.map((r) => (
                <TableRow key={r.table}>
                  <TableCell className="align-top font-mono text-xs">
                    {r.table}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.change === "new"
                          ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                          : "border-amber-500/40 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {r.change}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {r.detail}
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
// 6. Edge cases
// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Two authors create a doc with the same triplet at once",
    current: "Client max-scan: both read N, both insert N+1 → duplicate code",
    expected: "Atomic counter patch server-side → distinct codes",
    severity: "high",
  },
  {
    scenario: "Submit for review with no reviewer set",
    current: "Allowed — status flips to in_review regardless",
    expected: "Blocked with a clear 'set a reviewer first' message",
    severity: "high",
  },
  {
    scenario: "Publish a doc that was never approved",
    current: "Allowed — Publish writes 'published' directly",
    expected: "Blocked unless status is 'approved'",
    severity: "high",
  },
  {
    scenario: "Author removes an asset pill from the body, then saves",
    current: "documentAssets unchanged (it's the manual field)",
    expected: "Link recomputed from body → stale link dropped",
    severity: "med",
  },
  {
    scenario: "Delete a naming Location that existing docs already use",
    current: "n/a (no vocabulary today)",
    expected: "Soft-block or warn; existing codes keep their literal string",
    severity: "med",
  },
  {
    scenario: "Edit a template after docs were created from it",
    current: "n/a (templates are code)",
    expected: "No retro-change; templates seed new docs only, never mutate live docs",
    severity: "med",
  },
  {
    scenario: "Same person is author, reviewer and approver",
    current: "n/a",
    expected: "Permitted (single-user showcase); trail records the same id 3x",
    severity: "low",
  },
  {
    scenario: "Reset to reference while a draft is open in another tab",
    current: "Reset re-seeds 12; open tab keeps stale ids",
    expected: "Reset wipes to 1 doc; stale-id fence already handles the orphan",
    severity: "low",
  },
]

function EdgeCases() {
  return (
    <Section
      title="Edge cases"
      description="The scenarios that decide whether this is foolproof or just demo-shaped."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="w-16 text-right">Sev</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((r) => (
                <TableRow key={r.scenario}>
                  <TableCell className="align-top text-xs font-medium">
                    {r.scenario}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {r.current}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {r.expected}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.severity === "high" &&
                          "border-destructive/40 text-destructive",
                        r.severity === "med" &&
                          "border-amber-500/40 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {r.severity}
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

// ---------------------------------------------------------------------------
// 7. Self-grilling
// ---------------------------------------------------------------------------

function Grill({ q, a }: { q: string; a: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <div className="font-medium">Q. {q}</div>
      <div className="mt-1 text-muted-foreground">A. {a}</div>
    </div>
  )
}

function SelfGrilling() {
  return (
    <Section
      title="Self-grilling"
      description="The uncomfortable questions before we commit."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Grill
            q="If author = reviewer = approver = the same person, is this governance or theater?"
            a="Honestly, in a single-user showcase it's theater on the separation-of-duties front — one person clicks all three. But the cycle is still worth building: it demonstrates the workflow a real deployment enforces with multiple users, and the gates (can't publish unapproved, can't review without a reviewer) are real state-machine constraints, not cosmetics. We should NOT oversell it as enforced multi-person sign-off. It's a faithful mock of the process, gated correctly, that swaps in real users later."
          />
          <Grill
            q="Is a DB-backed template manager over-engineering for a showcase? Code templates 'just work'."
            a="It's the biggest single line item here, so the question is fair. But the user explicitly asked for a page to manage templates, and the whole point of this pass is 'complete and foolproof', not 'minimum demo'. The table is small (name/type/body) and reuses the existing editor. The risk isn't complexity — it's scope creep into template versioning, per-template permissions, etc. Draw the line at CRUD. No template versioning in v1."
          />
          <Grill
            q="We're deriving documentAssets from body pills. What about PDF-import docs that have no TipTap body?"
            a="Real hole. PDF docs (bodyKind='pdf') carry no linkedAsset nodes, so the body-walk yields zero assets and they'd lose all asset links. Fix: only recompute-from-body for bodyKind='tiptap'; for PDFs keep an explicit asset attach step (the import flow already collects assetIds). So 'body is the single source of truth' is true for composed docs only — must say so, not paper over it."
          />
          <Grill
            q="Per-triplet counters mean a counter row per combination. Does that table grow unbounded?"
            a="It grows with distinct (location, discipline, type) combos actually used — bounded by |locations| × |disciplines| × 4 types, realistically tens of rows. Not a concern. The real concern is the counter and the document insert must be in the same mutation/transaction so a failed insert doesn't burn a number — acceptable to burn numbers on failure (gaps are fine for SOP codes), but we shouldn't allocate then orphan routinely."
          />
          <Grill
            q="Wiping to one document — do we lose the RAG / Ask-IDA demo richness?"
            a="Partly. One doc means cross-document retrieval and the 'ask across the library' story get thin. Mitigation: make the single reference document genuinely rich (multiple sections, tables, a linked asset, a launch-log) so single-doc Q&A still demos well, and keep 'reset to reference' as one option alongside the existing fuller seed rather than deleting the 12-doc seed entirely."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 8. Implementation plan
// ---------------------------------------------------------------------------

interface PlanStep {
  phase: string
  steps: string[]
}

const PLAN: PlanStep[] = [
  {
    phase: "Phase 1 — Schema & server foundation",
    steps: [
      "convex/schema.ts: add 'approved' status; authorId/reviewerId/approverId/location/discipline on documents; signoffs on documentVersions; new templates, namingLocations, namingDisciplines, namingCounters tables.",
      "convex/naming.ts: allocateCode mutation (atomic counter patch keyed by triplet) + vocabulary CRUD queries/mutations.",
      "convex/documents.ts: split savePublish into submitForReview / approve / publish gated mutations; keep saveDraft ungated.",
      "convex/lib/assetWalker.ts + recompute documentAssets from tiptap body on save (skip for bodyKind='pdf').",
    ],
  },
  {
    phase: "Phase 2 — Templates",
    steps: [
      "convex/templates.ts: list / get / create / update / duplicate / remove.",
      "Seed templates table from the 4 existing DocumentTemplates.ts skeletons.",
      "src/pages/desktop/TemplatesPage.tsx + TemplateEditPage.tsx (reuse DocumentEditor).",
      "DocumentNewChooserPage.tsx: add blank-vs-template branch + template picker.",
      "App.tsx routes + DesktopShell sidebar entry.",
    ],
  },
  {
    phase: "Phase 3 — Naming + metadata",
    steps: [
      "NamingCodeField.tsx: 3 dropdowns (location/discipline/type) + server-allocated seq; drop client max-scan.",
      "src/pages/desktop/NamingSettingsPage.tsx under /settings/naming for vocabulary CRUD.",
      "MetadataPanel.tsx: remove Tags + manual AssetMultiSelect; add Location/Discipline; add author/reviewer/approver pickers; read-only derived linked-assets list.",
    ],
  },
  {
    phase: "Phase 4 — Lifecycle UI",
    steps: [
      "DocumentEditPage.tsx action bar: Save draft / Submit / Approve / Publish wired to the gated mutations with disabled states + reasons.",
      "DocumentHero.tsx + StatusBadge.tsx: show approved state + sign-off trail.",
    ],
  },
  {
    phase: "Phase 5 — Asset pill + image resize",
    steps: [
      "LinkedAssetBlock.tsx: code-only vs code+name label toggle in the picker.",
      "ImageWithRef.tsx: corner-drag resize handle via setPointerCapture; align toolbar anchored to outer wrapper.",
    ],
  },
  {
    phase: "Phase 6 — Fresh start",
    steps: [
      "convex/admin.ts + seed path: resetToReference (wipe + seed one full document with a complete lifecycle record).",
      "SettingsPage.tsx: 'Reset to reference document' action alongside existing reset.",
      "Verify: npx tsc -b && npx vite build both exit 0.",
    ],
  },
]

function ImplementationPlan() {
  return (
    <Section
      title="Implementation plan"
      description="Six phases. Schema first so everything downstream type-checks against the new shape."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          {PLAN.map((p) => (
            <div key={p.phase}>
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4 text-primary" />
                {p.phase}
              </div>
              <ol className="ml-6 list-decimal space-y-1 text-xs text-muted-foreground">
                {p.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// 9. Decisions
// ---------------------------------------------------------------------------

function Decision({
  q,
  a,
  locked,
}: {
  q: string
  a: string
  locked?: boolean
}) {
  return (
    <div className="text-sm leading-relaxed">
      <div className="flex items-center gap-1.5 font-medium">
        {locked ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <CircleDot className="h-3.5 w-3.5 text-amber-500" />
        )}
        {q}
      </div>
      <div className="ml-5 mt-0.5 text-muted-foreground">{a}</div>
    </div>
  )
}

function Decisions() {
  return (
    <Section
      title="Decisions"
      description="Three locked with the user. The rest are recommendations awaiting confirmation."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Decision
            locked
            q="Numbering scope"
            a="Per location + discipline + type. Each triplet gets its own counter; codes increment within the combination."
          />
          <Decision
            locked
            q="Template storage"
            a="DB-backed with a full CRUD /templates page. Seeded from the 4 existing code skeletons."
          />
          <Decision
            locked
            q="Lifecycle gating"
            a="Gate at each transition: draft is free; in_review needs a reviewer; approved needs approver + Approve click; published requires approved."
          />
          <Separator />
          <Decision
            locked
            q="PDF-import docs"
            a="Resolved: a PDF imports as a pdfAttachment node embedded in a normal TipTap document — you author and add asset pills around it. So body-derived linked assets work everywhere; there is no separate PDF body type to special-case."
          />
          <Decision
            locked
            q="Seeding"
            a="Resolved: reset wipes everything and seeds exactly one fully-featured reference document (plus the asset registry, naming vocabulary, and templates). Build forward from it."
          />
          <Decision
            locked
            q="Naming vocabulary page placement"
            a="Resolved: /settings/naming, linked from Settings → Configuration."
          />
        </CardContent>
      </Card>
      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle>Closed</AlertTitle>
        <AlertDescription className="text-sm">
          All seven workstreams shipped and verified (tsc 0, vite build 0,
          backend deployed). Baseline reset lives at Settings → Fresh start.
          Follow-ups: importer-created documents don't yet flow through the
          gated lifecycle or per-triplet counter; manager-facing review queue
          (filter by "assigned to me for review") is not built.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function AuthoringCompletenessAnalysis() {
  return (
    <AnalysisLayout
      title="Authoring completeness & document lifecycle"
      subtitle="Making the full authoring spine complete and foolproof: a governed author/reviewer/approver cycle, a configurable per-triplet naming system, a DB-backed template manager, a cleaned-up metadata panel, body-derived asset links, and a robust image resize — starting from a wiped database with one full reference document."
      date="2026-05-21"
      scopes={["desktop", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemStatement />
      <ScopeOverview />
      <Workstreams />
      <DataModelMap />
      <EdgeCases />
      <SelfGrilling />
      {/* <Results /> — fill in after the fix ships */}
      <ImplementationPlan />
      <Decisions />
    </AnalysisLayout>
  )
}
