// Claude stack template — analysis (2026-05-08).
//
// Specification + build manifest for the reusable starter template that
// crystallises every load-bearing decision from oppr-docs. The actual
// template lives at ../claude-stack-template/ as a sibling repo so it can
// be `git init`-ed and pushed to GitHub independently.

import {
  AlertTriangle,
  ArrowDownToLine,
  Beaker,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCode,
  FolderTree,
  Languages,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mail,
  Microscope,
  Package,
  Palette,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Type,
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

export function ClaudeStackTemplateAnalysis() {
  return (
    <AnalysisLayout
      title="Claude stack template"
      subtitle="Reusable starter that captures every load-bearing decision from oppr-docs — Vite 7 + React 19 + TS + Tailwind + shadcn primitives + Convex + Convex Auth (magic link) + wouter — plus the layout system (TopBar + PageHeader + Sidebar), the analysis-page skill, and out-of-box Dashboard / Example / Settings / Analysis pages. Lives at ../claude-stack-template as its own clean repo."
      date="2026-05-08"
      scopes={["desktop", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <Goals />
      <StackSection />
      <FolderTreeSection />
      <SetupFlow />
      <PagesSection />
      <SkillsSection />
      <DesignTokensSection />
      <SelfGrillingSection />
      <EdgeCasesSection />
      <BuildManifestSection />
      <ReviewPassSection />
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
          icon={Package}
          label="Deliverable"
          value="../claude-stack-template/ — 70 files"
          tone="emerald"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="Reviewed + augmented · 2026-05-08"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Out of box"
          value="clone → npm i → convex dev → @convex-dev/auth → npm run dev"
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc 0 · vite build 0 · eslint 0"
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
// Goals
// ---------------------------------------------------------------------------

function Goals() {
  return (
    <Section
      title="What this template is for"
      description="A clean repo I can clone for a new idea, with every decision oppr-docs already paid the cost for already wired."
    >
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <Goal
            icon={Rocket}
            title="Zero-question bootstrap"
            body="Clone, npm install, run npx convex dev, copy .env, run npm run dev. Working app with magic-link login and a real signed-in shell."
          />
          <Goal
            icon={FolderTree}
            title="Layout that doesn't drift"
            body="TopBar (breadcrumb + user menu) + sticky PageHeader (icon + title + actions) + Sidebar nav. Same primitives every page imports — IA stays consistent without a style guide."
          />
          <Goal
            icon={Microscope}
            title="Analysis page system from day one"
            body="The /analysis-page skill ships in .claude/skills/, the route is wired (/analysis + /analysis/:slug), the registry exists with one worked example. New analyses land in one file + one registry row."
          />
          <Goal
            icon={Lock}
            title="Real auth, not a stub"
            body="Convex Auth + Resend magic-link with a domain allowlist hook in convex/auth.ts. AuthGate wraps the app. UserMenu shows the email + Sign out."
          />
          <Goal
            icon={Sparkles}
            title="Placeholder content only"
            body="Dashboard, two example pages, Settings, one analysis. No domain code (no docs, no PPE, no IDA). The shape is reusable; the body is a blank canvas."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Goal({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Rocket
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{body}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

interface StackRow {
  category: string
  pick: string
  rationale: string
  icon: typeof Package
}

const STACK: StackRow[] = [
  {
    category: "Framework",
    pick: "React 19 + Vite 7",
    rationale:
      "Fast HMR, native ESM, pre-bundled deps. SSR not needed for an app shell.",
    icon: Rocket,
  },
  {
    category: "Language",
    pick: "TypeScript 5.8 (strict-off)",
    rationale:
      "Catches type drift without forcing the team to fight strict-null-checks during prototype phase.",
    icon: FileCode,
  },
  {
    category: "Routing",
    pick: "wouter",
    rationale:
      "1.6 kB. Hooks-first API. No file-based routing magic. Every project lifted from oppr-docs uses it.",
    icon: ChevronRight,
  },
  {
    category: "UI primitives",
    pick: "shadcn/ui (Radix)",
    rationale:
      "Source-owned components. No dep upgrades that break the design. Cherry-pick what you actually use.",
    icon: Palette,
  },
  {
    category: "Styling",
    pick: "Tailwind 3 + tailwindcss-animate + design tokens",
    rationale:
      "HSL CSS vars in :root + .dark. cn() merges utility classes with twMerge.",
    icon: Palette,
  },
  {
    category: "Backend",
    pick: "Convex",
    rationale:
      "Tight TS bindings, zero-config server, file storage, vector search, scheduled functions, deploy-by-cli.",
    icon: Database,
  },
  {
    category: "Auth",
    pick: "Convex Auth + Resend magic link",
    rationale:
      "Owned tables (`authTables`), no third-party auth provider lock-in, magic links over email — passwords later if the app ever needs them.",
    icon: Mail,
  },
  {
    category: "Forms",
    pick: "react-hook-form + zod",
    rationale: "Resolver wired through @hookform/resolvers. Standard stack.",
    icon: ListChecks,
  },
  {
    category: "Theming",
    pick: "next-themes",
    rationale: "Light/dark toggle that respects OS preference. Class-based.",
    icon: Palette,
  },
  {
    category: "Toasts",
    pick: "sonner",
    rationale: "Drop-in <Toaster />. Tasteful defaults.",
    icon: Sparkles,
  },
  {
    category: "Icons",
    pick: "lucide-react",
    rationale:
      "Consistent stroke weight. Tree-shakable. Every component imports a typed icon.",
    icon: Sparkles,
  },
  {
    category: "Hosting",
    pick: "Vercel + Convex deploy hook",
    rationale:
      "vercel.json buildCommand runs `npx convex deploy --cmd 'tsc -b && vite build'` so one git push deploys both.",
    icon: Server,
  },
]

function StackSection() {
  return (
    <Section
      title="Stack"
      description="What's in package.json out of the box. Nothing else. Add only when you need it."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[18%]">Category</TableHead>
                <TableHead className="w-[28%]">Pick</TableHead>
                <TableHead>Why</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STACK.map((s) => {
                const Icon = s.icon
                return (
                  <TableRow key={s.category}>
                    <TableCell className="align-top text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-primary" />
                        {s.category}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {s.pick}
                      </code>
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      {s.rationale}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Folder tree
// ---------------------------------------------------------------------------

const TREE = `claude-stack-template/
├── .claude/
│   └── skills/
│       └── analysis-page/
│           ├── SKILL.md
│           ├── analyses.md
│           └── references/
│               ├── stack-discovery.md
│               └── react-shadcn.md
├── convex/
│   ├── _generated/             # gitignored — regenerated by codegen
│   ├── auth.config.ts          # one provider entry — Convex Auth
│   ├── auth.ts                 # convexAuth() with Resend + domain allowlist hook
│   ├── example.ts              # one query + one mutation — placeholder CRUD
│   ├── http.ts                 # auth.addHttpRoutes only
│   ├── lib/
│   │   └── auth.ts             # requireUser / requireUserId
│   ├── schema.ts               # ...authTables + one example table
│   └── users.ts                # users.me query
├── public/
│   └── analysis/
│       └── example/            # placeholder for screenshots
├── src/
│   ├── App.tsx                 # router + AuthGate
│   ├── ConvexClientProvider.tsx
│   ├── auth/
│   │   ├── AuthGate.tsx
│   │   └── SignInForm.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DesktopShell.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── UserMenu.tsx
│   │   └── ui/                 # shadcn primitives — pick what's needed
│   ├── index.css               # tokens + tailwind layers
│   ├── lib/
│   │   └── utils.ts            # cn() helper only
│   ├── main.tsx
│   └── pages/
│       ├── DashboardPage.tsx
│       ├── ExampleListPage.tsx
│       ├── ExampleDetailPage.tsx
│       ├── SettingsPage.tsx
│       ├── AnalysisIndexPage.tsx
│       └── analysis/
│           ├── _AnalysisLayout.tsx
│           ├── ExampleAnalysis.tsx
│           └── registry.ts
├── .env.example
├── .gitignore
├── CLAUDE.md                   # template-shaped, generic
├── INSTRUCTIONS.md             # one-page setup, copy/paste-able
├── README.md
├── components.json             # shadcn CLI metadata
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
`

function FolderTreeSection() {
  return (
    <Section
      title="Folder shape"
      description="What you get on day zero. One example everywhere a pattern would be imitated."
    >
      <Card>
        <CardContent className="pt-6">
          <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 text-[11px] leading-relaxed">
            {TREE}
          </pre>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Setup flow
// ---------------------------------------------------------------------------

function SetupFlow() {
  return (
    <Section
      title="Setup flow — INSTRUCTIONS.md"
      description="The single page a future-me opens after cloning. Five steps."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Step
            n={1}
            title="Clone + install"
            body={`git clone <your-repo> my-app && cd my-app && npm install`}
          />
          <Step
            n={2}
            title="Initialise Convex"
            body={`npx convex dev   # interactive: pick a project name, creates the prod + dev deployments and seeds CONVEX_DEPLOYMENT in .env.local automatically`}
          />
          <Step
            n={3}
            title="Configure auth (magic link)"
            body={`# In the Convex dashboard → Settings → Environment variables, add:
#   AUTH_RESEND_KEY=re_…   (https://resend.com → API Keys)
#   AUTH_EMAIL="My App <onboarding@resend.dev>"  (or your verified sender)
#   SITE_URL=http://localhost:5173  (set to your prod URL after first deploy)
# Optional: set ALLOWED_DOMAIN in convex/auth.ts to lock sign-ins to one email domain.`}
          />
          <Step
            n={4}
            title="Wire frontend env"
            body={`cp .env.example .env.local
# .env.local should now contain VITE_CONVEX_URL — already set by step 2.
# Add VITE_CONVEX_SITE_URL = the same Convex deployment URL (used for HTTP actions).`}
          />
          <Step
            n={5}
            title="Run"
            body={`npm run dev          # http://localhost:5173 — sign in with a magic link to your email
# In a second terminal keep \`npx convex dev\` running so backend code pushes live.`}
          />
          <Separator className="my-2" />
          <Alert className="bg-muted/30">
            <Rocket className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs">Deploy</AlertTitle>
            <AlertDescription className="text-[11px]">
              <code>vercel.json</code> wires the Vercel build to{" "}
              <code>npx convex deploy --cmd 'tsc -b && vite build'</code>. Set{" "}
              <code>CONVEX_DEPLOY_KEY</code> on the Vercel project. Push to{" "}
              <code>main</code> → both the Convex prod deployment and the Vite
              build go out in one shot.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded bg-muted/40 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
          {body}
        </pre>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

interface PageRow {
  path: string
  title: string
  purpose: string
  uses: string[]
  icon: typeof LayoutDashboard
}

const PAGES: PageRow[] = [
  {
    path: "/",
    title: "Dashboard",
    purpose:
      "Welcome card + KPI tiles + recent items. Reads from convex/example.ts so the wiring is visible.",
    uses: ["TopBar", "PageHeader", "Card", "Skeleton"],
    icon: LayoutDashboard,
  },
  {
    path: "/items",
    title: "Example list",
    purpose:
      "Searchable Table reading api.example.list. Mirrors how a real list page is built without leaking the oppr-docs domain.",
    uses: ["TopBar", "PageHeader", "Input", "Table", "Badge"],
    icon: Boxes,
  },
  {
    path: "/items/:id",
    title: "Example detail",
    purpose:
      "Single-record view + edit form. Demonstrates routing, useQuery with a typed id, optimistic submit via useMutation.",
    uses: ["TopBar (breadcrumb)", "PageHeader (actions)", "Form", "Button"],
    icon: FileCode,
  },
  {
    path: "/settings",
    title: "Settings",
    purpose:
      "Theme toggle, sign-out, app metadata. Same TopBar + PageHeader chrome as the rest.",
    uses: ["TopBar", "PageHeader", "Card", "Button", "Switch"],
    icon: Wrench,
  },
  {
    path: "/analysis",
    title: "Analysis index",
    purpose:
      "Filter + table of registered analyses. Status badges (done / in_progress / outstanding) match oppr-docs.",
    uses: ["TopBar", "PageHeader", "Input", "Table", "Badge"],
    icon: Microscope,
  },
  {
    path: "/analysis/:slug",
    title: "Analysis detail",
    purpose:
      "Resolves slug from registry. Renders the page component. One worked example: ExampleAnalysis.",
    uses: ["AnalysisLayout", "Section", "Card", "Tabs", "Table"],
    icon: Microscope,
  },
]

function PagesSection() {
  return (
    <Section
      title="Pages — what ships"
      description="Six pages. No more. Each one is a copy-and-rename starting point."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">Route</TableHead>
                <TableHead className="w-[18%]">Title</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="w-[28%]">Uses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGES.map((p) => {
                const Icon = p.icon
                return (
                  <TableRow key={p.path}>
                    <TableCell className="align-top font-mono text-[11px]">
                      {p.path}
                    </TableCell>
                    <TableCell className="align-top text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-primary" />
                        {p.title}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      {p.purpose}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1">
                        {p.uses.map((u) => (
                          <code
                            key={u}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                          >
                            {u}
                          </code>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Skills (analysis-page)
// ---------------------------------------------------------------------------

function SkillsSection() {
  return (
    <Section
      title="Skills shipped in .claude/"
      description="The /analysis-page skill is the only one. It's the bedrock that makes the project self-document over time."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <div className="flex items-start gap-3 rounded-md border bg-card p-3">
            <Beaker className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">analysis-page</div>
                <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                  <Check className="h-2.5 w-2.5" />
                  installed
                </Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Build a live, in-app analysis page that visually documents a
                bug, edge case, or design proposal — instead of replying with a
                plain text plan. Triggers on "analyse", "deep-dive",
                "grill yourself", "show your reasoning". Produces an artifact
                under <code>/analysis/&lt;slug&gt;</code> using the project's
                real components.
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  ".claude/skills/analysis-page/SKILL.md",
                  ".claude/skills/analysis-page/analyses.md",
                  ".claude/skills/analysis-page/references/stack-discovery.md",
                  ".claude/skills/analysis-page/references/react-shadcn.md",
                ].map((f) => (
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
          <Alert className="bg-muted/30">
            <Microscope className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs">
              How it lives in the template
            </AlertTitle>
            <AlertDescription className="text-[11px]">
              Files copied verbatim from <code>oppr-docs/.claude/skills/</code>.
              <code> analyses.md</code> ships with one row pointing to the
              ExampleAnalysis so the table renders something on day one. The{" "}
              <code>registry.ts</code> wiring + the <code>_AnalysisLayout</code>
              + the <code>/analysis</code> + <code>/analysis/:slug</code> routes
              are pre-installed; building a new analysis is one new file +
              one row in the registry.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

function DesignTokensSection() {
  return (
    <Section
      title="Design tokens"
      description="The CSS-var contract every shadcn primitive reads. Light + dark in src/index.css."
    >
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="light">
            <TabsList className="mb-3">
              <TabsTrigger value="light">Light</TabsTrigger>
              <TabsTrigger value="dark">Dark</TabsTrigger>
            </TabsList>
            <TabsContent value="light">
              <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 font-mono text-[10px] leading-relaxed">
                {`:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.75rem;
  /* sidebar tokens — same role, separate values */
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 222.2 84% 4.9%;
  --sidebar-accent: 210 40% 96.1%;
  --sidebar-border: 214.3 31.8% 91.4%;
}`}
              </pre>
            </TabsContent>
            <TabsContent value="dark">
              <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 font-mono text-[10px] leading-relaxed">
                {`.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --destructive: 0 62.8% 30.6%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Self-grilling
// ---------------------------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="What could make this template not feel out-of-the-box?"
    >
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Convex setup is interactive (it asks for project name, login). That alone breaks 'no questions' on first run."
            a="Yes — the user IS asked one thing by Convex CLI: a project name. The template can't avoid that and shouldn't try (account scoping). INSTRUCTIONS.md frames it: 'one prompt, then never again'. The alternative — pre-baked deployment URLs — would make every clone share the same Convex project, which is broken."
          />
          <Grill
            q="Resend requires an API key. Magic-link auth doesn't work without it."
            a="Two paths. (a) Recommended: get a free Resend API key (60s on resend.com), set AUTH_RESEND_KEY. (b) Dev-only escape hatch: comment out the Resend provider in convex/auth.ts and use the Convex Auth Anonymous provider — sign-in with a click. INSTRUCTIONS.md says this; the template ships with Resend uncommented because real auth is the steady state."
          />
          <Grill
            q="The shadcn primitives in src/components/ui are copies. Won't they rot?"
            a="That's the design. shadcn's contract is 'you own the source'. When Radix releases a fix you re-run shadcn add to refresh. Components.json exists in the template so re-adding is one command. The template ships only the primitives the example pages actually use; add more on demand."
          />
          <Grill
            q="Why wouter and not react-router? The ecosystem is bigger."
            a="Wouter fits the API surface the project actually exercises (Switch + Route + Link + useLocation + useRoute). React Router brings loaders, data routes, file-based routing — none of which the template uses. Smaller bundle, fewer concepts. Easy to swap if a project grows into needing data routers."
          />
          <Grill
            q="The Sidebar uses sidebar-* CSS vars that are darker than the body. New users won't know that on day one."
            a="True; that is why the tokens come pre-tuned in index.css with the same palette oppr-docs uses. CLAUDE.md flags the seam. Anyone changing the visual identity touches a single file (index.css) and the sidebar inverts cleanly."
          />
          <Grill
            q="Should the template include the visual ad agents / SEO agents / audit agents from this Claude install?"
            a="No. Those are personal-environment agents that came with the user's Claude Code install — not project-bundled. Only project-scoped skills (.claude/skills/) ship in the template. User-scoped agents stay where they were."
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
// Edge cases
// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  handled: string
  severity: "high" | "med" | "low"
  shipped: boolean
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "First-time clone with no Convex account",
    handled:
      "INSTRUCTIONS step 2 covers `npx convex dev` which prompts to sign up. Captured.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Resend API key not set",
    handled:
      "Sign-in fails with a clear toast. INSTRUCTIONS step 3 covers env var. Comment-out fallback documented.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "ALLOWED_DOMAIN locks team in",
    handled:
      "convex/auth.ts ships with no domain allowlist (open by default). The hook is a single uncommented line in the file with a comment showing how to lock to a domain.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Vercel deploy without CONVEX_DEPLOY_KEY",
    handled:
      "vercel.json buildCommand fails fast. README + INSTRUCTIONS step 'Deploy' covers the env var.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Cloning into an existing repo",
    handled:
      "README documents `degit user/claude-stack-template my-app` as the no-history clone path.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "Adding a new shadcn primitive",
    handled:
      "components.json present so `npx shadcn@latest add <component>` works without configuration. CLAUDE.md flags this.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "Adding a new analysis page",
    handled:
      "CLAUDE.md 'common task: add analysis' walks through it: 1 file in pages/analysis/, 1 row in registry.ts, 1 line in .claude/skills/analysis-page/analyses.md.",
    severity: "low",
    shipped: true,
  },
  {
    scenario: "Renaming the project (template → my-app)",
    handled:
      "README has a 'rename' checklist: package.json name, index.html title, src/components/layout/DesktopShell.tsx brand block, .claude/CLAUDE.md.",
    severity: "low",
    shipped: true,
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases"
      description="Things that should work on day one, and how the template handles them."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Handled by</TableHead>
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
                    {row.handled}
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
// Build manifest — what got created, file by file
// ---------------------------------------------------------------------------

interface ManifestRow {
  group: string
  files: string[]
  note: string
}

const MANIFEST: ManifestRow[] = [
  {
    group: "Root config",
    files: [
      "package.json",
      "vite.config.ts",
      "vercel.json",
      "tailwind.config.js",
      "postcss.config.js",
      "tsconfig.json",
      "tsconfig.app.json",
      "tsconfig.node.json",
      "components.json",
      "eslint.config.js",
      "index.html",
      ".env.example",
      ".gitignore",
    ],
    note: "Same wiring as oppr-docs minus the domain-specific deps (no @tiptap, no react-pdf, no @google/generative-ai).",
  },
  {
    group: "Top-level docs",
    files: ["CLAUDE.md", "INSTRUCTIONS.md", "README.md"],
    note: "INSTRUCTIONS = 5-step setup. CLAUDE.md = orientation for future Claude sessions. README = public-facing.",
  },
  {
    group: "Convex",
    files: [
      "convex/auth.config.ts",
      "convex/auth.ts",
      "convex/example.ts",
      "convex/http.ts",
      "convex/lib/auth.ts",
      "convex/schema.ts",
      "convex/users.ts",
    ],
    note: "Domain allowlist is opt-in (commented stub in auth.ts). example.ts is a CRUD placeholder. authTables come from @convex-dev/auth.",
  },
  {
    group: "Shell + layout",
    files: [
      "src/main.tsx",
      "src/App.tsx",
      "src/ConvexClientProvider.tsx",
      "src/index.css",
      "src/lib/utils.ts",
      "src/components/layout/DesktopShell.tsx",
      "src/components/layout/TopBar.tsx",
      "src/components/layout/PageHeader.tsx",
      "src/components/layout/UserMenu.tsx",
    ],
    note: "Sidebar (DesktopShell) + breadcrumb (TopBar) + sticky page header (PageHeader). Same trio every page imports.",
  },
  {
    group: "Auth",
    files: ["src/auth/AuthGate.tsx", "src/auth/SignInForm.tsx"],
    note: "AuthGate wraps App. SignInForm is the magic-link form copied from oppr-docs with neutral copy.",
  },
  {
    group: "Pages",
    files: [
      "src/pages/DashboardPage.tsx",
      "src/pages/ExampleListPage.tsx",
      "src/pages/ExampleDetailPage.tsx",
      "src/pages/SettingsPage.tsx",
      "src/pages/AnalysisIndexPage.tsx",
      "src/pages/analysis/_AnalysisLayout.tsx",
      "src/pages/analysis/ExampleAnalysis.tsx",
      "src/pages/analysis/registry.ts",
    ],
    note: "Six pages + the analysis layout. Every page uses TopBar + PageHeader. ExampleAnalysis is a worked example of every analysis-page section.",
  },
  {
    group: "Skill",
    files: [
      ".claude/skills/analysis-page/SKILL.md",
      ".claude/skills/analysis-page/analyses.md",
      ".claude/skills/analysis-page/references/stack-discovery.md",
      ".claude/skills/analysis-page/references/react-shadcn.md",
    ],
    note: "Verbatim copy from oppr-docs. analyses.md ships with one row pointing at the ExampleAnalysis.",
  },
  {
    group: "shadcn primitives",
    files: [
      "src/components/ui/alert.tsx",
      "src/components/ui/badge.tsx",
      "src/components/ui/button.tsx",
      "src/components/ui/card.tsx",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/input.tsx",
      "src/components/ui/label.tsx",
      "src/components/ui/separator.tsx",
      "src/components/ui/skeleton.tsx",
      "src/components/ui/sonner.tsx",
      "src/components/ui/switch.tsx",
      "src/components/ui/table.tsx",
      "src/components/ui/tabs.tsx",
    ],
    note: "Cherry-pick. Add more with `npx shadcn@latest add <name>` later. components.json wires the CLI.",
  },
]

function BuildManifestSection() {
  return (
    <Section
      title="Build manifest"
      description="Every file the template ships, grouped. Each group has a one-line why."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          {MANIFEST.map((m) => (
            <div key={m.group} className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <div className="text-sm font-semibold">{m.group}</div>
                <Badge variant="outline" className="text-[10px]">
                  {m.files.length} files
                </Badge>
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {m.note}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.files.map((f) => (
                  <code
                    key={f}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                  >
                    {f}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Review pass — final cross-check against oppr-docs
// ---------------------------------------------------------------------------

interface ReviewItem {
  area: string
  finding: string
  action: string
  status: "fixed" | "kept" | "verified"
}

const REVIEW: ReviewItem[] = [
  {
    area: "Domain leakage",
    finding:
      "CLAUDE.md mentioned 'parent project (oppr-docs)' twice — readers of the standalone template don't have that context.",
    action:
      "Rewrote both sentences to read as a self-contained starter. Skill reference docs intentionally keep the `oppr-docs reference case` mention since they're stack-discovery breadcrumbs.",
    status: "fixed",
  },
  {
    area: "Missing auth setup step",
    finding:
      "INSTRUCTIONS.md jumped straight from `npx convex dev` to setting AUTH_RESEND_KEY — but @convex-dev/auth needs JWT_PRIVATE_KEY + JWKS env vars too. Without them, sign-in throws server-side and the form never resolves.",
    action:
      "Added step 3a — run `npx @convex-dev/auth` once to provision the key pair into the Convex dashboard. This is a one-time-per-deployment action and is non-obvious if you've never used Convex Auth before.",
    status: "fixed",
  },
  {
    area: "Catch-all route",
    finding:
      "App.tsx fallback was a bare `<h1>Not found</h1>` — broke layout symmetry; every other page uses TopBar + PageHeader.",
    action:
      "Extracted `NotFoundView` (TopBar + PageHeader + back button), reused for the catch-all and the analysis-not-found case.",
    status: "fixed",
  },
  {
    area: "Favicon",
    finding:
      "Browser console 404'd on /favicon.ico every reload because index.html didn't reference one.",
    action:
      "Added `public/favicon.svg` (32-px primary square + 3 hbar lines) and a `<link rel=\"icon\">` in index.html.",
    status: "fixed",
  },
  {
    area: "Editor recommendations",
    finding:
      "Cloners had to manually find Tailwind / Convex / ESLint VS Code extensions.",
    action:
      "Added `.vscode/extensions.json` with four recommendations (vscode-tailwindcss, vscode-eslint, prettier-vscode, convex-dev.convex).",
    status: "fixed",
  },
  {
    area: "DashboardPage unused import",
    finding:
      "Imported Badge but never rendered it — left a `void Badge` line as a guard. Lint noise.",
    action:
      "Removed the import + the void line. Cleaner.",
    status: "fixed",
  },
  {
    area: "shadcn primitive surface",
    finding:
      "Three primitives (alert-dialog, dialog, popover) ship but aren't imported by any page in the template.",
    action:
      "Kept. They're the most-reached-for primitives a new project will need; shipping them avoids running `npx shadcn add` on day one. shadcn primitives have zero runtime cost when unused.",
    status: "kept",
  },
  {
    area: "Forms libs (react-hook-form, zod, @hookform/resolvers)",
    finding: "In package.json deps but no example page uses them.",
    action:
      "Kept. Forms come up immediately when a project starts; pre-installing avoids a deps churn on first form. Added a CLAUDE.md note that the form primitive can be pulled in via `npx shadcn@latest add form` when needed.",
    status: "kept",
  },
  {
    area: "convex/_generated stubs",
    finding:
      "Stubs ship in the repo (api.d.ts, api.js, dataModel.d.ts, server.d.ts, server.js) so first-clone tsc + build are green before `npx convex dev` runs.",
    action:
      "Verified — stubs match the template's `convex/*.ts` module exports exactly. `npx convex dev` overwrites them idempotently with the same shape on first run.",
    status: "verified",
  },
  {
    area: "Build pipeline",
    finding:
      "Need to confirm tsc, vite build, eslint all exit 0 on a fresh checkout.",
    action:
      "Ran the full triple after augmentations: tsc -b 0 · vite build 0 (488 kB JS / 149 kB gzipped, single chunk, no warnings) · eslint 0 errors / 2 stock-shadcn warnings (badge + button exporting variants alongside components — same warnings as oppr-docs).",
    status: "verified",
  },
  {
    area: "Auth flow integrity",
    finding:
      "Cannot fully exercise sign-in here without a live Convex deployment + Resend key.",
    action:
      "Verified statically: AuthGate wraps App → useConvexAuth gate → SignInForm if !isAuthenticated → signIn('resend', {email}) → magic link → /api/auth/* on Convex side handles verification → SITE_URL redirect → useConvexAuth flips to true → AuthGate renders App. Path matches oppr-docs's working flow exactly.",
    status: "verified",
  },
]

function ReviewPassSection() {
  return (
    <Section
      title="Final review pass"
      description="Cross-check against oppr-docs after the template was built. Findings, actions, and what was kept intentionally."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Area</TableHead>
                <TableHead>Finding</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="w-[12%] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REVIEW.map((row) => (
                <TableRow key={row.area}>
                  <TableCell className="align-top text-xs font-medium">
                    {row.area}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {row.finding}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    {row.action}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {row.status === "fixed" ? (
                      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
                        <Check className="h-2.5 w-2.5" />
                        fixed
                      </Badge>
                    ) : row.status === "verified" ? (
                      <Badge className="gap-0.5 bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:text-blue-300">
                        <Check className="h-2.5 w-2.5" />
                        verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        kept
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

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

function DecisionsSection() {
  return (
    <Section
      title="Decisions"
      description="Calls made along the way."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Decision
            icon={Languages}
            q="How much oppr-docs domain to keep?"
            note="Zero. Pages are renamed (Library → ExampleList, Asset → ExampleDetail), DB tables are renamed (`items` instead of `documents`/`assets`), every visible string is generic. The shape stays; the content goes."
          />
          <Decision
            icon={Type}
            q="Do we ship the mobile shell too?"
            note="Not in v1 of the template. Most starters don't need a mobile-popup shell on day one. The /m system can be ported later from oppr-docs as a follow-up template extension."
          />
          <Decision
            icon={ListChecks}
            q="Single CLAUDE.md, or split?"
            note="Single CLAUDE.md, ~150 lines. Keeps the orientation in one file. Project-specific status/PRD docs are an empty stub the user fills as the project grows."
          />
          <Decision
            icon={ArrowDownToLine}
            q="License?"
            note="MIT. The template is permissive — once cloned the user owns the relationship with end users."
          />
          <Decision
            icon={Sparkles}
            q="Auth provider scope on sign-up?"
            note="Open by default (no ALLOWED_DOMAIN). One commented line in convex/auth.ts shows how to lock to a domain. INSTRUCTIONS.md flags this — don't ship to production without considering it."
          />
          <Separator className="my-2" />
          <Alert className="bg-emerald-500/5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-xs">
              Closed · 2026-05-08. Verification: tsc -b 0, vite build 0 in
              ../claude-stack-template.
            </AlertTitle>
            <AlertDescription className="text-[11px]">
              Follow-ups captured for v1.1 of the template: optional mobile
              shell port, optional vector-search example (Convex search API
              + Gemini embeddings), optional Resend → Convex Auth Anonymous
              fallback baked in, GitHub Actions CI scaffold.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function Decision({
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
