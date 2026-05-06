---
name: analysis-page
description: Build a live, in-app "Analysis" page that visually documents a complex bug, edge case, or UX issue in the oppr-docs project — instead of replying with a plain text plan. Use this skill whenever the user asks to "analyze", "deep-dive", "grill yourself", "document the issue / work process", "show your reasoning", or describes a multi-symptom UX/AI bug that touches more than one component (sources, modals, scope mixing, mobile vs desktop parity, data model questions). Also use it when the user pastes screenshots and says "look at this and tell me what's going on" before any fix is committed. The point of this skill is to slow Claude down: produce a documented, browsable artifact under `/analysis/<slug>` that uses the app's real components, BEFORE editing the actual feature.
---

# Analysis Page

## Why this skill exists

When Floris flags a complex issue in oppr-docs (verbose IDA answers, broken modal, scope spillover, cross-link confusion, mobile/desktop drift), the natural reflex is to:

1. Reason in chat,
2. Drop a markdown plan,
3. Start editing.

That loses two things he cares about:

- **The reasoning is unbrowsable** — once the plan scrolls out of context, it is gone.
- **There's no shared visual artifact** — he has to mentally re-render screenshots and edge-case tables from prose.

This skill flips it. For any non-trivial issue, the first deliverable is a route inside the app — `/analysis/<slug>` — that visually walks through the problem using the same shadcn primitives the product is built on. He can click through it, share a screenshot of it back to me, or use it as the spec when we implement the fix.

Implementation of the underlying fix happens **after** he reviews the analysis page and signs off.

---

## When to trigger

Trigger the skill when any of these are true:

- The user asks for "analysis", "deep dive", "thorough investigation", "edge case grilling", "self-grilling", "documented work process".
- The user pastes 2+ screenshots and asks what's going on, or to compare desktop vs mobile, or to compare expected vs actual.
- The user describes a bug that involves more than one of: AI/IDA, sources/citations, scope (doc/asset/library), modals, mobile parity, data-model linking (assets ↔ docs ↔ logs).
- The user explicitly says "before fixing" / "first plan" / "don't change code yet".
- The reply you would otherwise write would be longer than ~25 lines of prose plan.

Do **not** trigger for simple bugs, copy tweaks, or single-component visual fixes. That is overkill.

---

## What the skill produces

For every analysis you create exactly these things:

1. **A new page** at `src/pages/desktop/analysis/<PascalSlug>Analysis.tsx`.
2. **A route** in `src/App.tsx` under the desktop `<Switch>`: `<Route path="/analysis/<slug>" component={<PascalSlug>Analysis} />`.
3. **A sidebar entry** in `src/components/layout/DesktopShell.tsx`, inside a new `ANALYSIS` group rendered below the main `NAV` array, separated by `<Separator />`. Each analysis is a sub-item.
4. **Screenshots copied** from the path the user gave (typically `c:\Users\fwyer\Documents\claude\Docs_v0.1\screenshots\*`) into `oppr-docs/public/analysis/<slug>/`. Reference them in JSX as `/analysis/<slug>/<filename>` (Vite serves `public/` from root).
5. **An update to this skill's `analyses.md` index** (one line per analysis) so future Claude can see what already exists.

The slug is kebab-case, derived from the issue. Examples: `ida-sources-and-clear-modal`, `mobile-floorplan-pin-overflow`, `scope-spillover-ask-ida`.

---

## Page anatomy

Every analysis page renders these sections in this order. Use only shadcn primitives from `src/components/ui/` and existing layout patterns.

```
1. <PageHeader>           Title, sub-title, meta (date, scope: desktop/mobile/AI)
2. <ProblemStatement>     2–4 sentence summary in an <Alert variant="destructive">
3. <Evidence>             Tabs: each tab = one screenshot with a caption explaining what it shows
4. <CurrentBehavior>      Where useful, render a literal <Card> mock of the buggy UI using the app's real components, so the issue is reproduced inside the analysis
5. <DataModelMap>         Optional. When the bug involves linking (asset↔doc↔log), show a small table or inline diagram of what's actually in the DB for the example entities
6. <EdgeCasesTable>       <Table>: row per edge case, columns: Scenario / Current / Expected / Severity
7. <SelfGrilling>         <Card> with a series of "Am I sure?" / "What would falsify this?" / "Counter-hypotheses I considered" — written in first person, honest, no marketing
8. <ProposedUX>           Side-by-side or before/after using real components. NOT a figma — actually render the proposed fix as a static React mock
9. <ImplementationPlan>   Numbered list with file paths, repo helpers, and verification commands
10. <OpenQuestions>       Bulleted, addressed to the user, things you need him to confirm before coding
```

Use `src/pages/desktop/analysis/_AnalysisLayout.tsx` (create on first use) for the wrapping `<main>` shell with consistent padding, breadcrumb, and section dividers. Subsequent analyses import it.

### Component allowlist (in order of preference)

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Alert`, `AlertTitle`, `AlertDescription` (use `variant="destructive"` for problem statement, default for notes)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` for screenshot evidence and before/after
- `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` for edge cases and data-model dumps
- `Badge` for severity (`destructive`, `default`, `secondary`, `outline`)
- `Separator` between sections
- `Accordion` if a section grows past ~12 rows and would otherwise dominate the page

If you reach for something not in `src/components/ui/`, stop and check the directory listing first.

---

## Sidebar wiring

The desktop sidebar lives in `src/components/layout/DesktopShell.tsx`. Today it has `NAV: NavItem[]` (Library, Assets) and `BOTTOM_NAV: NavItem[]` (Settings).

Add a third array `ANALYSIS_NAV: NavItem[]` and a render block. The block goes after the main `NAV.map(...)` and after the existing `<Separator className="my-3 bg-sidebar-border" />`, but **before** the Mobile button. Keep the existing Mobile button unchanged.

Pattern:

```tsx
import { Microscope } from "lucide-react"

const ANALYSIS_NAV: NavItem[] = [
  {
    label: "IDA sources & clear modal",
    to: "/analysis/ida-sources-and-clear-modal",
    icon: Microscope,
    match: (p) => p === "/analysis/ida-sources-and-clear-modal",
  },
  // append new analyses here, newest at the top
]
```

Render it like this, after the existing NAV map and Separator:

```tsx
{ANALYSIS_NAV.length > 0 && (
  <>
    <div className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-accent">
      Analysis
    </div>
    {ANALYSIS_NAV.map((item) => {
      const Icon = item.icon
      const active = item.match ? item.match(location) : location === item.to
      return (
        <Link
          key={item.to}
          href={item.to}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-border/40 hover:text-sidebar-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="truncate">{item.label}</span>
        </Link>
      )
    })}
    <Separator className="my-3 bg-sidebar-border" />
  </>
)}
```

The label inside the sidebar must be terse (≤ 32 chars). The full title only appears on the page itself.

---

## Step-by-step recipe

1. **Read CLAUDE.md and oppr-docs-status.md** if you haven't this session, so the data model and folder ownership are fresh. Your analysis must reflect the actual codebase, not a hypothetical one.
2. **Inspect the bug live**. Read the relevant repos and components. If the user gave codes (asset codes like `FCK-102`, doc codes like `HOL-OPS-SOP-0001`), grep the seed and the repos to confirm what is actually in the DB. The analysis has to use real linkage data, not imagined.
3. **Pick a slug** in kebab-case. Look at the existing `analyses.md` index in this skill folder to avoid clashing.
4. **Copy screenshots** from the path the user mentioned into `oppr-docs/public/analysis/<slug>/`. Use `cp` (Bash). Keep filenames stable; rename `image copy 13.png` → something descriptive like `ida-response.png` so the JSX reads cleanly.
5. **Create `_AnalysisLayout.tsx`** the first time, then the page file. The page file is a normal React component — no DB calls, no AI calls, no live data. It is a static document that happens to be rendered with the same components the product uses.
6. **Wire the route in `src/App.tsx`**. Add the import and the `<Route>` in the desktop `<Switch>` block (before the catch-all "Not found" route).
7. **Wire the sidebar** in `DesktopShell.tsx` per the pattern above.
8. **Append a row to `analyses.md`** in this skill folder so the index stays current.
9. **Verify**. Run `npx tsc -b && npx vite build` from `oppr-docs/`. Both must exit 0 — Floris told you in CLAUDE.md not to claim done before that.
10. **Tell the user where to look** in one sentence: e.g., "Analysis page is at /analysis/ida-sources-and-clear-modal — review the Edge Cases and Self-Grilling tabs and tell me which proposed fix to take."

Do not start changing the underlying feature until the user confirms the analysis is right.

---

## Tone for the page itself

The page is a written artifact Floris will read. Match the tone he asked for elsewhere:

- Direct, low-fluff, no marketing.
- Use first person where appropriate ("I think the root cause is X. Here is what would falsify that.").
- The Self-Grilling section must contain at least one **uncomfortable** question — something where the proposed fix could be wrong. If you can't find one, you haven't grilled enough.
- No emojis. No "let me", "I'll start by". State things.
- Where you cite a file, use `path:line` format so the reader can jump there.

---

## What NOT to do

- Don't add a backend, fetch from the live DB, or wire the analysis page to live data. It is a frozen-in-time document. If the underlying state changes, edit the page.
- Don't put the analysis under `Library` or any module nav. It belongs in its own group so it doesn't pollute the operator-facing IA.
- Don't pre-write the fix in the same PR as the analysis page. The analysis is a checkpoint; the fix comes after sign-off.
- Don't skip the screenshots. The visual grounding is most of the point.
- Don't chain to the live `qa_sessions` table or any AI call from inside the page. Pure presentational React only.

---

## Existing analyses

See [`analyses.md`](./analyses.md) for the up-to-date index. Append, don't reorder.
