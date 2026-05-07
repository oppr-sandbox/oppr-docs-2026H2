// Page header spec — proposes the two-tier header system after the IA
// overhaul exposed an over-stuffed TopBar. Static React doc — no feature
// code. Read at /analysis/page-header-spec.

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Edit,
  FileText,
  History,
  Home,
  Library,
  MessageSquareText,
  PlusCircle,
  Printer,
  Upload,
  User,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function PageHeaderSpecAnalysis() {
  return (
    <AnalysisLayout
      title="Page header spec — TopBar, PageHeader, and floating Ask IDA"
      subtitle="The IA overhaul put global breadcrumbs in place but lumped page-specific actions into the same row. This proposes a clean two-tier system across every desktop page, plus a floating Ask IDA so the universal Q&A surface stops fighting for header real-estate."
      date="2026-05-07"
      scopes={["desktop", "AI"]}
    >
      <ProblemSection />
      <EvidenceSection />
      <PrinciplesSection />
      <ProposedSystemSection />
      <PerPageDecisionsSection />
      <SelfGrillingSection />
      <ImplementationPlanSection />
      <OpenQuestionsSection />
    </AnalysisLayout>
  )
}

function ProblemSection() {
  return (
    <Section title="Problem">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>The TopBar is doing the job of three components.</AlertTitle>
        <AlertDescription className="space-y-1.5 pt-1.5 text-xs">
          <div>
            On every desktop page it currently renders: breadcrumb (global),
            page-specific actions (per page), Ask IDA (global), New document
            (semi-global), and the user menu (global). On the Assets page the
            floorplan picker is also in there — really a page-specific filter
            that has nothing to do with global navigation.
          </div>
          <div>
            Result: the bar is loud, density varies wildly between pages, and
            the breadcrumb gets visually drowned by the colored "+ New document"
            CTA on its right. The breadcrumb is supposed to be the quiet anchor
            telling you where you are; it can't do that if it shares a row with
            the brightest button on the page.
          </div>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function EvidenceSection() {
  return (
    <Section
      title="Evidence — current Assets page"
      description="The image below is what the user reported. Every red box is a thing that does not belong in the global TopBar."
    >
      <Card>
        <CardContent className="pt-6">
          <figure className="space-y-2">
            <img
              src="/analysis/page-header-spec/topbar-overstuffed.png"
              alt="Assets page with over-stuffed TopBar"
              className="w-full rounded-md border"
            />
            <figcaption className="text-xs text-muted-foreground">
              TopBar contains: breadcrumb (Home › Assets), Floorplan picker
              (page-specific), Ask IDA, "+ New document", user avatar + role
              chip. Below the bar: "Project Assets" title + subtitle. Five
              concerns sharing a 12-row.
            </figcaption>
          </figure>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <ConcernCard
              tone="bad"
              title="Floorplan picker"
              note="Page-specific filter for the Assets page only. Surfaces in the global bar today."
            />
            <ConcernCard
              tone="bad"
              title="Ask IDA"
              note="Global by intent — but using header real-estate that should be reserved for the page. Better as a floating bottom-right button so it's there everywhere without being in the way."
            />
            <ConcernCard
              tone="bad"
              title="+ New document"
              note="Big purple CTA on every page including Settings, Analysis, doc reads, and asset detail. It's only meaningful from Library and Dashboard."
            />
            <ConcernCard
              tone="ok"
              title="Breadcrumb"
              note="Belongs here. Quiet, left-aligned. Today gets visually dominated by the buttons next to it."
            />
            <ConcernCard
              tone="ok"
              title="User avatar + role chip"
              note="Belongs here. Small, right-aligned, identifies the signed-in user on every screen."
            />
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function ConcernCard({
  tone,
  title,
  note,
}: {
  tone: "ok" | "bad"
  title: string
  note: string
}) {
  const Icon = tone === "ok" ? CheckCircle2 : XCircle
  const iconClass =
    tone === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400"
  const borderClass =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-red-500/30 bg-red-500/5"
  return (
    <div className={cn("rounded-md border p-3", borderClass)}>
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", iconClass)} />
        <div className="min-w-0 space-y-0.5">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{note}</div>
        </div>
      </div>
    </div>
  )
}

function PrinciplesSection() {
  return (
    <Section
      title="Principles"
      description="Five rules to drive every per-page decision in the table below."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Principle
            n={1}
            title="The TopBar is for orientation, not action."
            body="Breadcrumb on the left, user menu on the right. Nothing else. If something is page-specific, it goes in the PageHeader. If something is universal but not navigational (Ask IDA), it floats."
          />
          <Principle
            n={2}
            title="The PageHeader is per-page and is allowed to be loud."
            body="Page title + subtitle on the left, page-specific actions on the right (Upload PDF, Floorplan picker, Save / Submit / Edit, etc.). Density is intentional and OK because it relates to the user's current intent."
          />
          <Principle
            n={3}
            title="Ask IDA is a floating bottom-right button."
            body="Universal Q&A surface that should never compete for header space. Auto-scopes from the current route: doc page → doc scope, asset page → asset scope, everywhere else → library scope. Hidden on routes where IDA is not meaningful (Settings, Analysis, Document/new while drafting)."
          />
          <Principle
            n={4}
            title="The breadcrumb tells you where you are. It does not need to act."
            body="Click any segment to navigate. Last segment is non-clickable text. Long titles truncate via CSS with a tooltip on hover."
          />
          <Principle
            n={5}
            title="Mobile is unchanged in this spec."
            body="The mobile shell has its own MobileHeader with its own logic. Out of scope here. Only desktop pages get the new tier-2 split."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Principle({
  n,
  title,
  body,
}: {
  n: number
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
        {n}
      </span>
      <div className="space-y-0.5">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{body}</div>
      </div>
    </div>
  )
}

function ProposedSystemSection() {
  return (
    <Section
      title="Proposed system — three components"
      description="Static mock of the new layout. Render top to bottom: TopBar, PageHeader, page body. Floating Ask IDA overlays."
    >
      <div className="space-y-3">
        <ProposedTopBar />
        <ProposedPageHeader />
        <ProposedFloatingAsk />
      </div>
    </Section>
  )
}

function ProposedTopBar() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">1. TopBar (always identical)</CardTitle>
        <CardDescription className="text-xs">
          h-12, sticky, breadcrumb left + user menu right. No buttons in
          between. Used on every desktop route.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-12 items-center justify-between gap-3 rounded-md border bg-background/95 px-4 backdrop-blur">
          <nav className="flex min-w-0 items-center gap-1 text-xs">
            <span className="flex h-6 items-center gap-1 rounded px-1.5 text-muted-foreground">
              <Home className="h-3 w-3" />
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span className="rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Library
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span className="truncate px-1.5 py-0.5 font-medium text-foreground">
              HOL-OPS-SOP-0001 · Mixer feedstock check
            </span>
          </nav>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                F
              </span>
              <Badge variant="outline" className="text-[10px]">
                Author
              </Badge>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProposedPageHeader() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          2. PageHeader (per-page, loud is OK)
        </CardTitle>
        <CardDescription className="text-xs">
          Sits below the TopBar. Title + subtitle on the left. Page-specific
          actions on the right. Density varies — that is the point.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PageHeaderMock
          icon={Library}
          title="Document library"
          subtitle="All SOPs, manuals, and work instructions"
          actions={
            <>
              <Button size="sm" variant="outline">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload PDF
              </Button>
              <Button size="sm">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                New document
              </Button>
            </>
          }
        />
        <PageHeaderMock
          icon={FileText}
          title="HOL-OPS-SOP-0001 · Mixer feedstock check"
          subtitle="Published v3 · Owned by Floris · Last reviewed 2026-04-22"
          actions={
            <>
              <Button size="sm" variant="outline">
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print
              </Button>
              <Button size="sm" variant="outline">
                <History className="mr-1.5 h-3.5 w-3.5" />
                History
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700"
              >
                Publish to PDF
              </Button>
              <Button size="sm">
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            </>
          }
        />
      </CardContent>
    </Card>
  )
}

function PageHeaderMock({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: typeof Home
  title: string
  subtitle: string
  actions: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  )
}

function ProposedFloatingAsk() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          3. Floating Ask IDA (bottom-right)
        </CardTitle>
        <CardDescription className="text-xs">
          One button on every desktop page where IDA is meaningful. Auto-scopes
          from the route. Skipped on Settings, Analysis index, and during
          document drafting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-44 overflow-hidden rounded-md border bg-muted/20">
          <div className="absolute right-4 bottom-4 flex items-center gap-2">
            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow">
              scope: doc
            </span>
            <Button
              size="lg"
              className="h-12 w-12 rounded-full p-0 shadow-lg"
              aria-label="Ask IDA"
            >
              <MessageSquareText className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute left-4 top-4 text-xs text-muted-foreground">
            Page body
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PageRow {
  route: string
  page: string
  breadcrumb: string
  pageHeaderTitle: string
  pageHeaderActions: string
  ida: "library" | "doc" | "asset" | "hidden"
  newDocCta: boolean
}

const PAGE_ROWS: PageRow[] = [
  {
    route: "/",
    page: "Dashboard",
    breadcrumb: "Dashboard",
    pageHeaderTitle: "Dashboard",
    pageHeaderActions: "—",
    ida: "library",
    newDocCta: false,
  },
  {
    route: "/library",
    page: "Library",
    breadcrumb: "Library",
    pageHeaderTitle: "Document library",
    pageHeaderActions: "Upload PDF · New document",
    ida: "library",
    newDocCta: true,
  },
  {
    route: "/docs/:id",
    page: "Document read",
    breadcrumb: "Library › NAMING · Title",
    pageHeaderTitle: "NAMING · Title",
    pageHeaderActions: "Print · History · Publish to PDF · Edit",
    ida: "doc",
    newDocCta: false,
  },
  {
    route: "/docs/:id/edit",
    page: "Document edit",
    breadcrumb: "Library › NAMING · Title › Edit",
    pageHeaderTitle: "Editing — title (sticky strip)",
    pageHeaderActions:
      "Show/Hide metadata · View · Save draft · Submit · Publish to PDF",
    ida: "hidden",
    newDocCta: false,
  },
  {
    route: "/docs/new",
    page: "Document new",
    breadcrumb: "Library › New document",
    pageHeaderTitle: "New document (or PDF import)",
    pageHeaderActions: "Switch mode · Create / Import",
    ida: "hidden",
    newDocCta: false,
  },
  {
    route: "/assets",
    page: "Assets",
    breadcrumb: "Assets",
    pageHeaderTitle: "Project Assets",
    pageHeaderActions: "Floorplan picker",
    ida: "library",
    newDocCta: false,
  },
  {
    route: "/assets/:id",
    page: "Asset detail",
    breadcrumb: "Assets › CODE · Name",
    pageHeaderTitle: "CODE · Name",
    pageHeaderActions: "QR · Edit",
    ida: "asset",
    newDocCta: false,
  },
  {
    route: "/images",
    page: "Image library (proposed)",
    breadcrumb: "Library › Images",
    pageHeaderTitle: "Image library",
    pageHeaderActions: "Upload images",
    ida: "hidden",
    newDocCta: false,
  },
  {
    route: "/analysis",
    page: "Analysis index",
    breadcrumb: "Analysis",
    pageHeaderTitle: "Analysis",
    pageHeaderActions: "—",
    ida: "hidden",
    newDocCta: false,
  },
  {
    route: "/analysis/:slug",
    page: "Analysis detail",
    breadcrumb: "Analysis › <title>",
    pageHeaderTitle: "<title>",
    pageHeaderActions: "—",
    ida: "hidden",
    newDocCta: false,
  },
  {
    route: "/settings",
    page: "Settings",
    breadcrumb: "Settings",
    pageHeaderTitle: "Settings",
    pageHeaderActions: "—",
    ida: "hidden",
    newDocCta: false,
  },
]

function PerPageDecisionsSection() {
  return (
    <Section
      title="Per-page decision table"
      description="One row per desktop route. The TopBar columns are always identical; the differences are in PageHeader and floating IDA scope."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">Route</TableHead>
                <TableHead className="w-[18%]">Breadcrumb</TableHead>
                <TableHead className="w-[18%]">PageHeader title</TableHead>
                <TableHead className="w-[28%]">PageHeader actions</TableHead>
                <TableHead className="w-[10%]">Ask IDA</TableHead>
                <TableHead className="w-[12%]">+ New doc CTA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGE_ROWS.map((r) => (
                <TableRow key={r.route}>
                  <TableCell className="align-top font-mono text-[11px] text-muted-foreground">
                    {r.route}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    {r.breadcrumb}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    {r.pageHeaderTitle}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {r.pageHeaderActions}
                  </TableCell>
                  <TableCell className="align-top">
                    <IdaBadge scope={r.ida} />
                  </TableCell>
                  <TableCell className="align-top">
                    {r.newDocCta ? (
                      <Badge className="bg-primary/15 text-primary">yes</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        no
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

function IdaBadge({ scope }: { scope: "library" | "doc" | "asset" | "hidden" }) {
  if (scope === "hidden") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        hidden
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
      {scope}
    </Badge>
  )
}

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Where this proposal could be wrong."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="A floating Ask IDA — does that fight with toasts, sheet drawers, or print mode?"
            a="The Sonner toaster is top-right (we set position='top-right' in App.tsx), so they don't clash. The Sheet slides in from the right and uses a higher z-index than the floating button — fine. Print mode hides the floating button via print:hidden. The one real conflict is mobile, where the TopBar is replaced by MobileHeader and the floating button could overlap the bottom nav — solution: hide the floating button in the mobile shell entirely (mobile already has its own /m/ask page reachable from the nav)."
          />
          <Grill
            q="Will users hunt for '+ New document' if it's not in every header?"
            a="Test: where do they actually click it from today? Library top-right is the natural spot. The Dashboard quick-action card is a second entry. The sidebar used to have one and we removed it for the active-nav reason. Three entry points (Library page, Dashboard card, keyboard shortcut later) is plenty. Putting it on every page communicates 'this app is about creating new docs from anywhere' — that's not the truth, the app is mostly read."
          />
          <Grill
            q="The breadcrumb on /docs/:id shows the doc's naming code + title. The PageHeader also shows them. Is that duplicate?"
            a="Yes — and that's fine. The breadcrumb's job is 'where am I in the hierarchy' (truncated, single line, in the chrome). The PageHeader's job is 'what is this' with full styling, version, owner. They serve different reading patterns. We'll truncate the breadcrumb harder so it's clearly the secondary surface."
          />
          <Grill
            q="On the editor page, the existing sticky h-10 strip has the editor controls. Where does that live in the new system?"
            a="It is the PageHeader for the editor — purpose-built, dense, with toggles for metadata visibility. It sits at top-12 (below the TopBar) with z-20. Don't introduce a separate PageHeader component on top of it; the strip IS the page header for that route. The breadcrumb trail (Library › NAMING · Title › Edit) lives in the TopBar above."
          />
          <Grill
            q="Hardest one: is the Floorplan picker on Assets actually a PageHeader element, or is it really an in-page filter that should live with the table view toggles?"
            a="Lean: in-page filter, not PageHeader. Reasoning: on /assets the picker selects a context for the whole page including the floorplan modal; on a multi-floorplan future where /assets/floorplan/X exists, the picker would move to URL state and disappear from header entirely. Keep it where it conceptually belongs — next to the existing list/grid/floorplan icon-button group on the page body. PageHeader stays clean."
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

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan"
      description="In dependency order. Each step is ~1 commit. Verification: npx tsc -b && npx vite build."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Step
            n={1}
            title="Trim TopBar to breadcrumb + UserMenu only"
            files={[
              "src/components/layout/TopBar.tsx — drop hideAskIda/hideNewDoc/askScope props and the buttons they gate",
            ]}
            notes="Removing children prop later — first pass keeps it for transition."
          />
          <Step
            n={2}
            title="Introduce <PageHeader> component"
            files={[
              "src/components/layout/PageHeader.tsx — new (icon, title, subtitle, actions)",
            ]}
            notes="Mirror the mock above. Single responsibility, no nav."
          />
          <Step
            n={3}
            title="Introduce <FloatingAskIda> with route-driven scope"
            files={[
              "src/components/ai/FloatingAskIda.tsx — new",
              "src/App.tsx — render it once inside DesktopShell",
            ]}
            notes="Resolves scope from useLocation + useRoute. Hides on /settings, /analysis*, /docs/new, /docs/*/edit."
          />
          <Step
            n={4}
            title="Refactor every desktop page to TopBar + PageHeader"
            files={[
              "src/pages/desktop/DashboardPage.tsx",
              "src/pages/desktop/LibraryPage.tsx",
              "src/pages/desktop/AssetsPage.tsx — Floorplan picker moves down to the existing list/grid toggle row",
              "src/pages/desktop/AssetDetailPage.tsx",
              "src/pages/desktop/DocumentReadPage.tsx",
              "src/pages/desktop/DocumentEditPage.tsx — keeps the dense sticky strip as its PageHeader",
              "src/pages/desktop/DocumentNewPage.tsx",
              "src/pages/desktop/SettingsPage.tsx",
              "src/pages/desktop/AnalysisIndexPage.tsx",
              "src/pages/desktop/analysis/_AnalysisLayout.tsx",
            ]}
            notes="Drop AskIdaSheet imports from individual pages — they all rely on the floating one now."
          />
          <Step
            n={5}
            title="Tooltip the breadcrumb when truncated"
            files={[
              "src/components/layout/TopBar.tsx — title attribute on segments",
            ]}
            notes="Cheap; uses native browser tooltip. Won't pursue Radix Tooltip for v1."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Step({
  n,
  title,
  files,
  notes,
}: {
  n: number
  title: string
  files: string[]
  notes?: string
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ArrowRight className="h-3.5 w-3.5 text-primary" />
        Step {n} — {title}
      </div>
      <ul className="mt-1.5 space-y-0.5 pl-5">
        {files.map((f) => (
          <li key={f} className="text-xs font-mono text-muted-foreground">
            {f}
          </li>
        ))}
      </ul>
      {notes && (
        <div className="mt-1.5 text-xs italic text-muted-foreground">
          {notes}
        </div>
      )}
    </div>
  )
}

function OpenQuestionsSection() {
  return (
    <Section
      title="Open questions for the user"
      description="Things this analysis can't decide alone."
    >
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <Q>
            <strong>Floating button position</strong> — bottom-right is the
            spec. Bottom-center, or right-side rail like Linear's, are
            alternatives. Which feels right?
          </Q>
          <Q>
            <strong>Floating button on Settings + Analysis</strong> — propose
            hidden because IDA isn't relevant there. Override?
          </Q>
          <Q>
            <strong>Avatar dropdown content</strong> — currently email + role
            chip + Sign out. Add: theme toggle, link to Settings, link to
            Profile (if we add one)?
          </Q>
          <Q>
            <strong>PageHeader on Document edit</strong> — the proposal is to
            keep the existing dense h-10 strip as-is and call it the
            PageHeader. Alternative: collapse it into a standard PageHeader
            with a "More actions" overflow menu. The dense strip is faster for
            authors who use Save/Submit a lot. Stay or restructure?
          </Q>
          <Q>
            <strong>Breadcrumb on long doc titles</strong> — title attribute
            tooltip is cheapest. Want a Radix Tooltip with a 500ms hover delay
            instead? Or skip and rely on the PageHeader showing the full
            title?
          </Q>
        </CardContent>
      </Card>
    </Section>
  )
}

function Q({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-2"><User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><div>{children}</div></div>
}
