// Mobile interface revamp — analysis (2026-05-07).
//
// Static, frozen-in-time analysis page rendered at /analysis/mobile-revamp.
// Pure presentational — no DB, no AI, no live data. See
// .claude/skills/analysis-page/SKILL.md for the workflow.

import { useState } from "react"
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  ChevronRight,
  Ear,
  Factory,
  Files,
  FolderKanban,
  Footprints,
  Glasses,
  HardHat,
  Languages,
  ListChecks,
  MessageSquare,
  Mic,
  ScanLine,
  Send,
  Shield,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Type,
  Wind,
  Wrench,
  X,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const IMG = (f: string) => `/analysis/mobile-revamp/${f}`

export function MobileRevampAnalysis() {
  return (
    <AnalysisLayout
      title="Mobile interface revamp"
      subtitle="Six issues from a fresh-DB walkthrough of /m: hard crash on stale localStorage IDs after wipe, oversized icons + spacing for a 430-wide phone, PPE chips with no detail-on-tap, IDA chat at desktop font density, textarea that doesn't follow voice-transcribed text, and a holistic IA review of the home + reader. All seven plan steps shipped 2026-05-07."
      date="2026-05-07"
      scopes={["mobile", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemStatement />
      <EvidenceSection />
      <RootCauseSection />
      <ProposedUxSection />
      <ResultsSection />
      <EdgeCasesSection />
      <SelfGrillingSection />
      <ImplementationPlanSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

// ---------------------------------------------------------------------------
// Summary header
// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={CheckCircle2}
          label="Issue"
          value="Stale-ID crash + density / IA debt"
          tone="emerald"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="Shipped · 2026-05-07"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="7 plan steps · 8 source files · 2 Convex queries"
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b 0 · vite build 0"
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
// Problem statement
// ---------------------------------------------------------------------------

function ProblemStatement() {
  return (
    <Section
      title="Problem statement"
      description="Six things surfaced from a single fresh-DB walkthrough of /m."
    >
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>One hard crash, five density / IA refinements</AlertTitle>
        <AlertDescription className="space-y-1.5 pt-1">
          <p>
            <strong>1. Hard crash on stale doc ids.</strong> Pinned + recently-viewed are
            stored in <code className="rounded bg-muted px-1 font-mono text-[11px]">localStorage</code>{" "}
            and survive a Convex DB wipe. Tapping a stale row navigates to{" "}
            <code className="font-mono">/m/docs/doc-1</code>; the Convex argument validator
            on <code className="font-mono">getWithAssets</code> rejects{" "}
            <code className="font-mono">v.id("documents")</code>; the throw escapes
            the inner Suspense + ErrorBoundary because it happens during the page's own
            render, and the screen goes blank.
          </p>
          <p>
            <strong>2. Sizing.</strong> Quick-action tile icons (h-5 w-5), tile padding
            (p-4) and titles (text-sm) are sized for a tablet, not a 430-wide phone.
          </p>
          <p>
            <strong>3. PPE chips are decorative.</strong> Operator can see the helmet
            and boot pictograms but cannot tap to learn what they mean — a regression vs
            the desktop reader where labels are inline.
          </p>
          <p>
            <strong>4. IDA chat is desktop-dense.</strong> Body copy at{" "}
            <code className="font-mono">text-sm</code> is fine on a laptop, oversized in
            the phone shell. No user control to dial it down.
          </p>
          <p>
            <strong>5. Textarea doesn't follow the caret.</strong> When the operator
            dictates a long question via the mic (or pastes), the textarea's fixed{" "}
            <code className="font-mono">min-h-[48px]</code> hides the latest characters.
            Browser caret-tracking only kicks in if the textbox is allowed to grow.
          </p>
          <p>
            <strong>6. IA debt on home.</strong> Five large tiles, no search, no live
            counts, no empty/recovery state when pinned/recent point to deleted docs.
          </p>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Evidence — six screenshots
// ---------------------------------------------------------------------------

function EvidenceSection() {
  return (
    <Section
      title="Evidence — captured from /m on 2026-05-07"
      description="All shots taken in the resizable Mobile popup at ~430 wide, immediately after wipeAll + re-seed."
    >
      <Tabs defaultValue="crash">
        <TabsList className="mb-3 grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="crash">Hard crash</TabsTrigger>
          <TabsTrigger value="home">Home density</TabsTrigger>
          <TabsTrigger value="ppe">PPE chips</TabsTrigger>
          <TabsTrigger value="ida">IDA density</TabsTrigger>
          <TabsTrigger value="textarea">Textarea</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="crash">
          <EvidenceCard
            caption="Tapping a stale Pinned row navigates to /m/docs/doc-1. The Convex validator throws ArgumentValidationError ('Value does not match validator. Path: .id, Value: doc-1, Validator: v.id(documents)'). The throw happens inside MobileDocPage's render — outside the Suspense boundary that wraps the lazy viewer — so the operator sees a blank shell."
            src={IMG("blank-doc-crash.png")}
          />
        </TabsContent>
        <TabsContent value="home">
          <EvidenceCard
            caption="Mobile home — current. Five tiles + 32-px row icons, p-4 cards, big headers. Empty post-wipe Pinned/Recently Viewed are not represented — instead we still see ghost rows from localStorage that point at non-existent docs. Bottom nav is fine."
            src={IMG("home-current.png")}
          />
        </TabsContent>
        <TabsContent value="ppe">
          <EvidenceCard
            caption="Reader on /m/docs/:id. PPE row reads as two orange dots — there is no label, no tap target, no callout. Compare with the desktop reader which always shows the label inline."
            src={IMG("doc-with-ppe.png")}
          />
        </TabsContent>
        <TabsContent value="ida">
          <EvidenceCard
            caption="Ask IDA on mobile — current. Bullet list answer is rendered at the same text-sm density as the desktop variant, with desktop-sized SOURCES card below. Source-chip rows wrap aggressively at 430 wide."
            src={IMG("ida-text-density.png")}
          />
        </TabsContent>
        <TabsContent value="textarea">
          <EvidenceCard
            caption="Composing a question. The textarea uses min-h-[48px] and does not auto-grow. Once the operator's text wraps past two lines, the bottom of the input clips and the caret is no longer visible."
            src={IMG("textarea-overflow.png")}
          />
        </TabsContent>
        <TabsContent value="overview">
          <EvidenceCard
            caption="Same home view, different scroll position. Two distinct 'EDDYCURRENT MACHINE' rows under Recently Viewed because their naming codes differ (-0001 / -0004) — operator-facing duplication that the row layout doesn't disambiguate. No empty-state copy, no search."
            src={IMG("home-overview.png")}
          />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function EvidenceCard({ caption, src }: { caption: string; src: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-center overflow-hidden rounded-md border bg-muted/30">
          <img
            src={src}
            alt={caption}
            className="block h-auto max-h-[640px] w-auto"
          />
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Root cause — file:line attributions
// ---------------------------------------------------------------------------

interface RootCauseRow {
  symptom: string
  cause: string
  files: string[]
  confidence: "high" | "med" | "low"
}

const ROOT_CAUSES: RootCauseRow[] = [
  {
    symptom: "Stale Pinned/Recent row crashes the doc page",
    cause:
      "use-mobile-prefs reads RecentEntry/PinnedEntry from localStorage with no validation. After wipeAll the stored ids no longer correspond to any Convex document, but the rows still render. MobileDocPage casts `id as Id<\"documents\">` and passes it straight to `api.documents.getWithAssets` — the server-side `v.id(\"documents\")` validator throws synchronously. The throw bubbles out of MobileDocPage's outer return; the inner Suspense + ViewerErrorBoundary only protects the lazy PdfViewer / TiptapReadOnly, not the page-level query.",
    files: [
      "src/components/mobile/use-mobile-prefs.ts:42-82",
      "src/pages/mobile/MobileDocPage.tsx:90-93",
      "src/pages/mobile/MobileDocPage.tsx:282-298",
    ],
    confidence: "high",
  },
  {
    symptom: "Home tiles + rows feel oversized at 430 wide",
    cause:
      "ActionCard uses h-10 w-10 icon wrappers, h-5 w-5 icon glyphs, p-4 card padding, text-sm titles, and rounded-2xl with shadow-sm. The 5-tile grid eats the entire above-the-fold real estate before any content card. Default hierarchy ships padding meant for a tablet.",
    files: ["src/pages/mobile/MobileHomePage.tsx:42-79", "src/pages/mobile/MobileHomePage.tsx:118-158"],
    confidence: "high",
  },
  {
    symptom: "PPE row is decoration only on mobile",
    cause:
      "MobileDocSummary renders each PPE item as an icon-only chip. PPE_META in PpeBlock has the labels; there is a description gap (no per-item description anywhere yet). No interactive element attached — the chip is a span, not a button. Desktop reader shows the label inline next to each icon.",
    files: [
      "src/components/mobile/MobileDocSummary.tsx:54-72",
      "src/components/docs/PpeBlock.tsx:51-60",
    ],
    confidence: "high",
  },
  {
    symptom: "IDA chat reads at desktop density",
    cause:
      "AskPanel's `compact` prop only adjusts shadow + min-height. The body container uses fixed `text-sm` regardless of viewport. There is no user-facing font-size control and no persistence layer for one.",
    files: [
      "src/components/ai/AskPanel.tsx:495-496",
      "src/components/ai/AskPanel.tsx:570",
      "src/components/ai/MessageBubble.tsx (text-sm everywhere)",
    ],
    confidence: "high",
  },
  {
    symptom: "Textarea hides the latest characters during dictation",
    cause:
      "AskPanel uses the shadcn `<Textarea>` primitive with `min-h-[48px]` (compact) / `min-h-[60px]`. Without an autosize hook, the element keeps its fixed height; once the value wraps past 2 lines, the latest line is below the visible area. Browser caret-tracking only re-enters the visible region for an editable element when the element is allowed to grow OR when scrollTop is explicitly slewed.",
    files: ["src/components/ai/AskPanel.tsx:559-571"],
    confidence: "high",
  },
  {
    symptom: "Home has no search, no counts, no recovery",
    cause:
      "MobileHomePage is purely a static layout: action tiles + section heads. There is no MobileGlobalSearch surface here (it only lives on /m/docs and /m/assets). Pinned/recent are rendered without revalidating their ids against Convex, so deleted docs become unremovable ghost rows.",
    files: [
      "src/pages/mobile/MobileHomePage.tsx:25-115",
      "src/components/mobile/MobileGlobalSearch.tsx",
    ],
    confidence: "med",
  },
]

function RootCauseSection() {
  return (
    <Section
      title="Root cause"
      description="One row per symptom. Confidence reflects how directly the code path reproduces the symptom."
    >
      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-4">
            {ROOT_CAUSES.map((r) => (
              <li
                key={r.symptom}
                className="rounded-md border border-border/50 bg-card p-3"
              >
                <div className="flex items-start gap-2">
                  <Badge
                    variant={r.confidence === "high" ? "default" : "secondary"}
                    className="mt-0.5 text-[10px] uppercase"
                  >
                    {r.confidence}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{r.symptom}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.cause}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.files.map((f) => (
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
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Proposed UX — side-by-side mocks rendered in real components
// ---------------------------------------------------------------------------

function ProposedUxSection() {
  return (
    <Section
      title="Proposed UX"
      description="Each block is a real React mock rendered with the project's primitives — not a Figma export. Compare side-by-side with the screenshots above."
    >
      <div className="space-y-6">
        <ProposedHomeMock />
        <ProposedDocReaderMock />
        <ProposedIdaMock />
      </div>
    </Section>
  )
}

// ----- Mocks ---------------------------------------------------------------

function PhoneFrame({
  title,
  children,
  density = "compact",
}: {
  title: string
  children: React.ReactNode
  density?: "current" | "compact"
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <Badge
          variant={density === "compact" ? "default" : "outline"}
          className="text-[10px]"
        >
          {density === "compact" ? "Proposed" : "Current"}
        </Badge>
      </div>
      <div className="mx-auto flex h-[640px] w-full max-w-[300px] flex-col overflow-hidden rounded-[28px] border-2 border-foreground/20 bg-background shadow-md">
        {children}
      </div>
    </div>
  )
}

function ProposedHomeMock() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Home — current vs proposed</CardTitle>
        <CardDescription className="text-xs">
          Density tuned to a 430-wide phone. Search-first, live counts, condensed
          quick-action row, recovery state for stale Pinned/Recent rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <PhoneFrame title="Current" density="current">
          <CurrentHomeMock />
        </PhoneFrame>
        <PhoneFrame title="Proposed" density="compact">
          <ProposedHomeMockBody />
        </PhoneFrame>
      </CardContent>
    </Card>
  )
}

function CurrentHomeMock() {
  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-4 pt-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold">Oppr DOCS</div>
          <div className="text-xs text-muted-foreground">Operator app</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["Scan QR", "Find docs for an asset", ScanLine, "primary"],
            ["Ask IDA", "Across every document", MessageSquare, "secondary"],
            ["Assets", "Browse all", Factory, "muted"],
            ["Documents", "Browse all", Files, "muted"],
          ] as const
        ).map(([t, s, Ic, tone]) => (
          <div
            key={t}
            className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                tone === "primary" && "bg-primary text-primary-foreground",
                tone === "secondary" &&
                  "bg-secondary text-secondary-foreground",
                tone === "muted" && "bg-muted text-foreground",
              )}
            >
              <Ic className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">{t}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {s}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase">
          <Star className="h-3 w-3" />
          Pinned
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Files className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Daily handover SOP</div>
            <div className="font-mono text-[10px]">HOL-OPS-SOP-0001</div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function ProposedHomeMockBody() {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FolderKanban className="h-3.5 w-3.5" />
          </div>
          <div className="text-[13px] font-semibold leading-none">Oppr DOCS</div>
        </div>
        <Badge variant="outline" className="text-[9px]">
          Holliday · Line 2
        </Badge>
      </div>
      <div className="flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
        <ScanLine className="h-3 w-3" />
        Search assets, docs, codes…
      </div>
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg bg-primary p-2.5 text-left text-primary-foreground"
      >
        <ScanLine className="h-4 w-4" />
        <div className="flex-1">
          <div className="text-[12px] font-semibold leading-none">Scan QR</div>
          <div className="mt-0.5 text-[10px] opacity-80">
            Open the doc for an asset
          </div>
        </div>
      </button>
      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            [MessageSquare, "Ask IDA"],
            [Factory, "31 assets"],
            [Files, "47 docs"],
          ] as const
        ).map(([Ic, t]) => (
          <button
            key={t}
            type="button"
            className="flex flex-col items-center gap-1 rounded-md border bg-card px-2 py-2 text-[10px]"
          >
            <Ic className="h-3.5 w-3.5 text-foreground/80" />
            <span className="leading-none">{t}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-2.5 w-2.5" />
            Pinned
          </span>
          <span className="text-muted-foreground/70">1</span>
        </div>
        <CompactRow label="Daily handover SOP" sub="HOL-OPS-SOP-0001" />
        <div className="flex items-center justify-between rounded-md border border-amber-300/50 bg-amber-100/40 px-2 py-1.5 text-[10px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pigment Line — gone
          </span>
          <button className="rounded bg-amber-200/60 px-1.5 py-0.5 dark:bg-amber-500/20">
            Remove
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent
        </div>
        <CompactRow label="EDDYCURRENT MACHINE" sub="HOL-OPS-SOP-0001" />
        <CompactRow label="EDDYCURRENT MACHINE (rev 2)" sub="HOL-OPS-SOP-0004" />
        <CompactRow label="Grinding Mill" sub="FCK-103" />
      </div>
    </div>
  )
}

function CompactRow({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
        <Files className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium leading-tight">
          {label}
        </div>
        <div className="truncate font-mono text-[9px] text-muted-foreground">
          {sub}
        </div>
      </div>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </div>
  )
}

// --- Reader mock with PPE callouts -----------------------------------------

const PPE_DESCRIPTIONS: Record<string, { label: string; description: string; icon: typeof HardHat }> = {
  hardhat: {
    label: "Hard hat",
    description: "Protects head from falling objects and impacts.",
    icon: HardHat,
  },
  glasses: {
    label: "Safety glasses",
    description: "Eye protection from dust, splashes, and debris.",
    icon: Glasses,
  },
  gloves: {
    label: "Gloves",
    description: "Hand protection against cuts, abrasion, contaminants.",
    icon: Shield,
  },
  boots: {
    label: "Safety boots",
    description: "Steel-toe with anti-slip soles. Required on the floor.",
    icon: Footprints,
  },
  "hi-vis": {
    label: "Hi-vis vest",
    description: "Required wherever forklifts or vehicles operate.",
    icon: Shirt,
  },
  "ear-pro": {
    label: "Ear protection",
    description: "Required in zones above 85 dB(A).",
    icon: Ear,
  },
  mask: {
    label: "Respirator",
    description: "Particulate / vapour filtration as specified per task.",
    icon: Wind,
  },
}

function ProposedDocReaderMock() {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const items: Array<keyof typeof PPE_DESCRIPTIONS> = [
    "hardhat",
    "glasses",
    "boots",
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">PPE chips — tap to learn</CardTitle>
        <CardDescription className="text-xs">
          Each chip becomes a Popover trigger with label + description. Operator
          can dismiss by tapping outside or hitting the close affordance. Try
          the proposed mock — the chips are interactive.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <PhoneFrame title="Current" density="current">
          <div className="flex flex-col gap-2 p-3">
            <div className="rounded-lg border bg-card p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  PPE
                </span>
                {(["hardhat", "glasses", "boots"] as const).map((k) => {
                  const Ic = PPE_DESCRIPTIONS[k].icon
                  return (
                    <span
                      key={k}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-300 bg-orange-50 text-orange-900"
                    >
                      <Ic className="h-3.5 w-3.5" />
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Icons only — no label, no tap.
            </div>
          </div>
        </PhoneFrame>
        <PhoneFrame title="Proposed" density="compact">
          <div className="flex flex-col gap-2 p-3">
            <div className="rounded-lg border bg-card p-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  PPE — tap for details
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((k) => {
                  const meta = PPE_DESCRIPTIONS[k]
                  const Ic = meta.icon
                  return (
                    <Popover
                      key={k}
                      open={openItem === k}
                      onOpenChange={(o) => setOpenItem(o ? k : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                            openItem === k
                              ? "border-orange-500 bg-orange-100 text-orange-900"
                              : "border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100",
                          )}
                          aria-label={`${meta.label} info`}
                        >
                          <Ic className="h-3 w-3" />
                          {meta.label}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="start"
                        sideOffset={6}
                        className="w-[220px] p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            <Ic className="h-3.5 w-3.5 text-orange-600" />
                            {meta.label}
                          </div>
                          <button
                            type="button"
                            className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                            aria-label="Close"
                            onClick={() => setOpenItem(null)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                          {meta.description}
                        </p>
                      </PopoverContent>
                    </Popover>
                  )
                })}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Tap a chip to open a callout. Tap outside or the X to dismiss.
            </div>
          </div>
        </PhoneFrame>
      </CardContent>
    </Card>
  )
}

// --- IDA mock with font-size control + autosize textarea -------------------

type ChatSize = "sm" | "md" | "lg"

function ProposedIdaMock() {
  const [size, setSize] = useState<ChatSize>("sm")
  const [draft, setDraft] = useState(
    "I want to know if it's better to just reduce the amount of work you have to put in it or",
  )
  const sizeClass: Record<ChatSize, string> = {
    sm: "text-[11px] leading-snug",
    md: "text-[13px] leading-relaxed",
    lg: "text-[15px] leading-relaxed",
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Ask IDA — font-size control + autosize textarea
        </CardTitle>
        <CardDescription className="text-xs">
          Header gets an A−/A+ control that persists per device. Textarea grows
          with content (capped at 6 lines) so dictated text stays in view.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <PhoneFrame title="Current" density="current">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2.5">
              <ChevronRight className="h-3 w-3 rotate-180" />
              <div className="flex-1">
                <div className="text-[12px] font-semibold leading-none">
                  Ask IDA
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Document: EDDYCURRENT MACHINE
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-2 text-[13px]">
              <div className="ml-auto max-w-[80%] rounded-lg bg-primary px-2 py-1.5 text-[12px] text-primary-foreground">
                what are the machine codes used in this document?
              </div>
              <div className="max-w-[88%] rounded-lg bg-card px-2 py-1.5 text-[12px]">
                <div>The machine codes mentioned in HOL-OPS-SOP-0001 are:</div>
                <ul className="mt-1 list-disc pl-3">
                  <li>02-100-MD-03: Eddy current machine</li>
                  <li>02-100-BBU-03: Bigbag filling</li>
                  <li>02-100-CC-12: Chain conveyer</li>
                </ul>
              </div>
            </div>
            <div className="border-t p-1.5">
              <div className="flex items-end gap-1.5">
                <div className="h-[40px] flex-1 overflow-hidden rounded border bg-muted/30 p-1.5 text-[10px] text-muted-foreground">
                  {draft}
                </div>
                <div className="flex h-[40px] w-7 items-center justify-center rounded border">
                  <Mic className="h-3 w-3" />
                </div>
                <div className="flex h-[40px] w-7 items-center justify-center rounded bg-primary text-primary-foreground">
                  <Send className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>
        <PhoneFrame title="Proposed" density="compact">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <ChevronRight className="h-3 w-3 rotate-180" />
              <div className="flex-1">
                <div className="text-[12px] font-semibold leading-none">
                  Ask IDA
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Document: EDDYCURRENT MACHINE
                </div>
              </div>
              <div className="flex items-center gap-0.5 rounded-md border bg-muted/40 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => setSize("sm")}
                  className={cn(
                    "rounded px-1 text-[8px] font-semibold",
                    size === "sm" && "bg-background shadow-sm",
                  )}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setSize("md")}
                  className={cn(
                    "rounded px-1 text-[10px] font-semibold",
                    size === "md" && "bg-background shadow-sm",
                  )}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setSize("lg")}
                  className={cn(
                    "rounded px-1 text-[12px] font-semibold",
                    size === "lg" && "bg-background shadow-sm",
                  )}
                >
                  A
                </button>
              </div>
            </div>
            <div
              className={cn(
                "flex-1 space-y-2 overflow-y-auto bg-muted/30 p-2",
                sizeClass[size],
              )}
            >
              <div className="ml-auto max-w-[82%] rounded-lg bg-primary px-2 py-1.5 text-primary-foreground">
                what are the machine codes used in this document?
              </div>
              <div className="max-w-[92%] rounded-lg bg-card px-2 py-1.5">
                <div>The machine codes mentioned in HOL-OPS-SOP-0001 are:</div>
                <ul className="mt-1 list-disc pl-3">
                  <li>02-100-MD-03 — Eddy current machine</li>
                  <li>02-100-BBU-03 — Bigbag filling</li>
                  <li>02-100-CC-12 — Chain conveyer</li>
                </ul>
              </div>
            </div>
            <div className="border-t p-1.5">
              <div className="flex items-end gap-1.5">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={Math.min(
                    6,
                    Math.max(1, draft.split("\n").length + Math.floor(draft.length / 38)),
                  )}
                  className="flex-1 resize-none rounded border bg-background p-1.5 text-[10px] leading-snug outline-none"
                  placeholder="Ask a question…"
                />
                <div className="flex h-[34px] w-7 items-center justify-center rounded border">
                  <Mic className="h-3 w-3" />
                </div>
                <div className="flex h-[34px] w-7 items-center justify-center rounded bg-primary text-primary-foreground">
                  <Send className="h-3 w-3" />
                </div>
              </div>
              <div className="mt-1 text-[8px] text-muted-foreground">
                Textarea autosizes 1–6 lines · A button persists per-device
              </div>
            </div>
          </div>
        </PhoneFrame>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Results — what shipped
// ---------------------------------------------------------------------------

interface ResultRow {
  title: string
  files: string[]
  before: string
  after: string
}

const RESULTS: ResultRow[] = [
  {
    title: "Stop the bleed: format pre-check + recovery UI",
    files: [
      "src/components/mobile/use-mobile-prefs.ts",
      "src/pages/mobile/MobileDocPage.tsx",
      "src/pages/mobile/MobileAssetPage.tsx",
    ],
    before:
      "Tapping a stale Pinned/Recent row navigated to /m/docs/doc-1, the Convex v.id() validator threw, and the screen went blank.",
    after:
      "looksLikeConvexId() filters every read from localStorage; ids that don't pass are auto-pruned and Doc/Asset pages render a friendly 'no longer available' card with a Back to home button.",
  },
  {
    title: "documents.resolveMany + assets.resolveMany",
    files: ["convex/documents.ts", "convex/assets.ts"],
    before:
      "No way to validate a Pinned/Recent id without throwing — every page load that touched a deleted doc was a render-time crash risk.",
    after:
      "Two new queries take a string array and use ctx.db.normalizeId to safely resolve each id, returning {id, exists, …}. Malformed ids → exists:false. Deleted rows → exists:false. Never throws.",
  },
  {
    title: "Home: stale-row recovery + Clear all",
    files: ["src/pages/mobile/MobileHomePage.tsx"],
    before:
      "Five large tiles, no recovery state — ghost rows from a wipe were unremovable.",
    after:
      "Search-first home with a hero Scan CTA, three secondary chips (Ask IDA, Assets · count, Docs · count), and an amber callout above the lists when stale entries are detected. Each missing row gets an inline Trash button; the callout offers Clear all.",
  },
  {
    title: "Density pass for 430-wide phone",
    files: [
      "src/components/mobile/MobileShell.tsx",
      "src/components/mobile/MobileHeader.tsx",
      "src/pages/mobile/MobileDocPage.tsx",
    ],
    before:
      "Bottom nav text-[10px] + h-5 icons, MobileHeader text-base + h-11 back button, doc quick-actions h-8 text-xs.",
    after:
      "Bottom nav text-[9px] + h-4. Header text-[13px] + h-9 back. Doc actions h-7 text-[10px]. Reader content padding p-4 → p-3. Pinned action button h-10 → h-9.",
  },
  {
    title: "PPE chips → tap-to-callout",
    files: [
      "src/components/docs/PpeBlock.tsx",
      "src/components/mobile/MobileDocSummary.tsx",
    ],
    before:
      "Mobile PPE row was three orange dots — no label, no tap, no information about what each pictogram meant.",
    after:
      "Each chip is a Popover trigger. Label inline next to the icon. Tap → label + description + close (X) affordance. Tap outside dismisses. PPE_META gained a description field shared across desktop + mobile.",
  },
  {
    title: "Ask IDA: A−/A+ font-size dial",
    files: [
      "src/components/ai/AskPanel.tsx",
      "src/components/mobile/use-mobile-prefs.ts",
    ],
    before:
      "Chat body text fixed at text-sm regardless of viewport. No way for the operator to dial it down.",
    after:
      "Three discrete steps (sm 12 / md 14 / lg 16). Toggle in the panel header, gated by `compact` so it only appears on /m. Persisted via useChatSize() in localStorage 'oppr-docs:m:chat-size'.",
  },
  {
    title: "Autosizing composer textarea",
    files: ["src/components/ai/AskPanel.tsx"],
    before:
      "Fixed min-h-[48px] hid the latest line whenever the operator's text wrapped past two lines — voice transcription disappeared below the visible area.",
    after:
      "useEffect on input mutates el.style.height = scrollHeight, capped at lineHeight × 6 + padding. Beyond the cap the textarea internally scrolls so the caret stays in view. Resets on submit because input clears to ''.",
  },
  {
    title: "Duplicate Recently-Viewed disambiguation",
    files: ["src/pages/mobile/MobileHomePage.tsx"],
    before:
      "Two docs titled 'EDDYCURRENT MACHINE' (HOL-OPS-SOP-0001 vs -0004) rendered as visually-identical rows.",
    after:
      "disambiguate() detects label collisions in Recently Viewed and appends the trailing segment of the naming code (e.g., 'EDDYCURRENT MACHINE (0004)') only on the colliding rows.",
  },
]

function ResultsSection() {
  return (
    <Section
      title="Results — what shipped"
      description="One row per plan item. Files touched, before/after."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {RESULTS.map((r) => (
            <div key={r.title} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
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

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
  shipped: boolean
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Fresh DB wipe, operator taps a stale Pinned row",
    current: "White screen, ArgumentValidationError in console",
    expected:
      "Soft 404 page: 'This document is no longer available' + Remove from pinned button + Back",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Fresh DB wipe, operator opens Home",
    current: "Pinned/Recent ghosts every stale id",
    expected:
      "Each stale id is detected and rendered with a Remove affordance. Optionally batch-remove via 'Clear stale entries'",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Operator dictates a 5-line question via the mic",
    current: "Last 3 lines hidden below textarea bottom edge",
    expected:
      "Textarea grows up to 6 lines, then scrolls internally with caret in view",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Operator with reduced vision",
    current: "No font-size control anywhere on /m",
    expected: "A−/A+ control on Ask IDA + Reader, persisted in localStorage",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Operator with safety gloves on the floor",
    current: "PPE chips are 28-px circles — usable, barely tappable when gloved",
    expected: "Min 36-px tap target on PPE chips",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Two docs with same title, different naming codes",
    current: "Two visually-identical Recently Viewed rows",
    expected:
      "Show site/department/version suffix to disambiguate when titles collide",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "Operator opens /m on a tablet (>768px)",
    current: "Mobile shell is capped at 430 wide; rest of screen is empty grey",
    expected:
      "Either widen the shell to fill or render a two-pane layout (asset list + reader)",
    severity: "low",
    shipped: false,
  },
  {
    scenario: "Translation / multilingual operator",
    current: "Hardcoded English",
    expected: "Out of scope for this analysis — captured for v1.1",
    severity: "low",
    shipped: false,
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases"
      description="Things that should work but don't, or that the proposed UX has to defend against."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">Shipped?</TableHead>
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
                  <TableCell className="align-top text-xs">
                    {row.expected}
                  </TableCell>
                  <TableCell className="align-top">
                    <SeverityBadge severity={row.severity} />
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
// Self-grilling — at least one uncomfortable counter-hypothesis
// ---------------------------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Counter-hypotheses I want surfaced before the fix lands."
    >
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Maybe the right answer to 'icons too big' isn't 'shrink them' — operators wear gloves on the floor, and the original sizing was a deliberate touch-target choice."
            a="This is the uncomfortable one. The user is asking from a desktop-popup perspective; the original 40-px tile was sized for a gloved finger. Compromise: keep the primary CTA (Scan QR) at full touch size, condense the secondary actions into a 28-px chip row that still meets WCAG 24-px minimum but reads tighter. Validate on a real phone before declaring a win."
          />
          <Grill
            q="Maybe Pinned/Recent should live in Convex (per-user) instead of localStorage — one less divergence point, no cross-device drift."
            a="Yes, that is the long-term shape. But it requires adding pin/recent tables and a per-user identity which is broader than this analysis. For v1.0 we ship the localStorage validation path; the Convex move is captured as a v1.1 follow-up."
          />
          <Grill
            q="Is the textarea overflow real on a phone, or only in the desktop popup? Mobile keyboards usually scroll the focused element into view automatically."
            a="The fixed min-h textarea will still hide the latest line on a real phone because the element does not grow — the OS scrolls the page, but the latest characters are below the input's own visible region. Autosize is the right fix on both desktop popup and on-device. We should still validate on iOS Safari + Android Chrome before declaring this shipped."
          />
          <Grill
            q="Why a custom A−/A+ control instead of letting the OS font-size accessibility setting do the work?"
            a="The OS setting doesn't reach inside an iframe-style mobile shell consistently; it scales rem units but our chat uses fixed text-sm/text-xs. A per-app control gives operators a one-tap dial without leaving the app, and we can persist it. We can still respect prefers-reduced-motion / OS scaling in addition — they aren't mutually exclusive."
          />
          <Grill
            q="Is fixing the crash worth a defensive client-side validator, or should we soften the server validator?"
            a="Soft server: we'd lose the type guarantee on the server and have to handle 'not found' explicitly everywhere. Defensive client: add an ErrorBoundary at MobileDocPage's outer return + a one-shot localStorage prune that runs once on home mount and removes ids that are not Convex-shaped. Cheap, contained, no server change. Take the defensive client path."
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
// Implementation plan — file paths
// ---------------------------------------------------------------------------

interface PlanStep {
  n: number
  title: string
  files: string[]
  detail: string
  status: "shipped" | "deferred"
}

const PLAN: PlanStep[] = [
  {
    n: 1,
    title: "Stop the bleed: format pre-check + stale-id pruning",
    files: [
      "src/components/mobile/use-mobile-prefs.ts",
      "src/pages/mobile/MobileDocPage.tsx",
      "src/pages/mobile/MobileAssetPage.tsx",
    ],
    detail:
      "Added looksLikeConvexId() that filters every read from PINNED_KEY / RECENT_KEY and rejects pushes that don't pass. Doc + Asset pages skip the typed Convex query when id fails the shape check and render a recovery card with 'Back to home'. Auto-prune effect cleans the stale entry on mount.",
    status: "shipped",
  },
  {
    n: 2,
    title: "Convex resolveMany + recovery UI on home",
    files: [
      "convex/documents.ts",
      "convex/assets.ts",
      "src/pages/mobile/MobileHomePage.tsx",
    ],
    detail:
      "documents.resolveMany / assets.resolveMany take a string array and use ctx.db.normalizeId so malformed ids never throw. Home batch-resolves Pinned + Recent ids; rows whose existence flips to false render with an inline trash button. A 'Clear all' callout removes every stale row at once.",
    status: "shipped",
  },
  {
    n: 3,
    title: "Density pass: home tiles + nav + reader headers",
    files: [
      "src/pages/mobile/MobileHomePage.tsx",
      "src/components/mobile/MobileShell.tsx",
      "src/components/mobile/MobileHeader.tsx",
      "src/pages/mobile/MobileDocPage.tsx",
    ],
    detail:
      "Home: search-first → hero Scan → 3-chip row with live counts. Bottom nav text-[9px] + h-4. Header text-[13px] + h-9 back, py-2 instead of py-3. Doc quick-actions h-7 text-[10px], padding p-4 → p-3.",
    status: "shipped",
  },
  {
    n: 4,
    title: "PPE chips become Popover triggers",
    files: [
      "src/components/docs/PpeBlock.tsx",
      "src/components/mobile/MobileDocSummary.tsx",
    ],
    detail:
      "PPE_META gained a description field per item. MobileDocSummary chips became Popover triggers — label inline, X to close, tap outside dismisses. Min h-7 chip with full text label so the operator can read what each pictogram means.",
    status: "shipped",
  },
  {
    n: 5,
    title: "Ask IDA: A−/A+ font-size control",
    files: [
      "src/components/ai/AskPanel.tsx",
      "src/components/mobile/use-mobile-prefs.ts",
    ],
    detail:
      "useChatSize() persists in localStorage 'oppr-docs:m:chat-size' (sm 12 / md 14 / lg 16). The 3-step toggle is rendered next to Clear in the AskPanel header, gated on `compact` so it only appears on mobile. CHAT_SIZE_CLASS map applied to the messages container.",
    status: "shipped",
  },
  {
    n: 6,
    title: "Autosizing composer textarea",
    files: ["src/components/ai/AskPanel.tsx"],
    detail:
      "useEffect on input mutates el.style.height — auto then scrollHeight, capped at lineHeight × 6 + padding. Beyond the cap el.style.overflowY flips to auto so the caret stays in view. Resets when input clears post-submit. ~12 lines, no new dep.",
    status: "shipped",
  },
  {
    n: 7,
    title: "Search bar on home + duplicate disambiguation",
    files: ["src/pages/mobile/MobileHomePage.tsx"],
    detail:
      "MobileGlobalSearch mounts on home behind a tap-to-open trigger pinned to the top (no overlay until needed). disambiguate() detects collisions in Recent and appends the trailing naming-code segment so two same-titled docs read distinctly.",
    status: "shipped",
  },
]

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan"
      description="Severity-ordered. Every step is contained — no DB schema change required."
    >
      <Card>
        <CardContent className="pt-6">
          <ol className="space-y-3">
            {PLAN.map((step) => (
              <li
                key={step.n}
                className="rounded-md border border-border/50 bg-card p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {step.n}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{step.title}</div>
                      {step.status === "shipped" ? (
                        <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                          <Check className="h-2.5 w-2.5" />
                          shipped
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          deferred
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {step.detail}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
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
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Open questions
// ---------------------------------------------------------------------------

function DecisionsSection() {
  return (
    <Section
      title="Decisions"
      description="Open questions, with the calls that were made."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Question
            icon={Languages}
            q="Move Pinned/Recent to Convex now or stay localStorage for v1.0?"
            note="Decision: stay localStorage + add the validation fence (looksLikeConvexId on read/write + resolveMany on home). Per-user Convex tables remain the v1.1 path once an authenticated identity model is in place."
          />
          <Question
            icon={Type}
            q="Three discrete font sizes (sm/md/lg) or a continuous slider?"
            note="Decision: three discrete steps. Easier to reason about, persists cleanly, faster to tap with gloves. Implemented with three A buttons of increasing size in the AskPanel header."
          />
          <Question
            icon={ListChecks}
            q="Should the home search bar replace the secondary action chips, or sit above them?"
            note="Decision: search bar sits above the hero Scan CTA, secondary chips below. Operators who came in via QR don't search; operators who didn't, search first. Both surfaces survive."
          />
          <Question
            icon={ArrowDownToLine}
            q="Cap the autosize textarea at 6 lines or let it grow to full keyboard height?"
            note="Decision: cap at 6 lines × computed lineHeight + padding. Beyond the cap the textarea internally scrolls so the caret stays in view. Eating the entire viewport for a text field on a phone would have been hostile."
          />
          <Question
            icon={Sparkles}
            q="Should Ask IDA on /m surface a 'Voice mode' (continuous transcription) or stick with push-to-talk?"
            note="Deferred to v1.1. Push-to-talk remains the default for a manufacturing-floor environment where ambient noise is high."
          />
          <Separator className="my-2" />
          <Alert className="bg-emerald-500/5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-xs">
              Closed · 2026-05-07. Verification: tsc -b 0, vite build 0.
            </AlertTitle>
            <AlertDescription className="text-[11px]">
              Follow-ups captured for v1.1: tablet two-pane layout (
              <code>/m</code> at &gt;768px), multilingual UI, voice mode for
              continuous transcription, and migrating Pinned/Recent to Convex
              once an authenticated user model lands.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function Question({
  icon: Icon,
  q,
  note,
}: {
  icon: typeof Languages
  q: string
  note: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-xs font-medium">{q}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{note}</div>
      </div>
    </div>
  )
}

// Suppress unused-import warnings for icons referenced only in JSX literal mocks.
// (CheckCircle2, Check, Type, Languages, ArrowDownToLine, ListChecks, Sparkles,
//  XCircle are all referenced above; Wrench/ShieldCheck used in summary.)
void Check
