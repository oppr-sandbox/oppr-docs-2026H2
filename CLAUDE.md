# CLAUDE.md — Oppr DOCS

You are working on **Oppr DOCS v1.0 showcase**, a frontend-only React app at `oppr-docs/`. This file is your orientation. Read it first, then dip into the docs it points to as needed.

---

## Read these in order

1. **This file** — orientation, conventions, common tasks (≤250 lines)
2. **[`oppr-docs-status.md`](./oppr-docs-status.md)** — current build state: what's shipped, folder structure, data model, routes, known issues. Always check here before assuming what exists
3. **[`prd.md`](./prd.md)** — full requirements + milestone checklist. The source of truth for scope
4. **[`../oppr_business.md`](../oppr_business.md)** — the parent business doc. Read §3, §6, §7 (UC4), §8 (rows 25–29), §10 for DOCS-specific context

You don't need to read all four every turn. For most tasks: this file + a targeted look at the status doc is enough.

---

## What this project is, in 60 seconds

**Oppr** is a manufacturing-floor SaaS that captures operator knowledge (voice, photo, structured forms) and fuses it with machine data on a unified timeline. The product has three modules in a closed improvement loop: **LOGS** (capture) → **IDA** (investigate) → **DOCS** (standardize).

**Oppr DOCS** is the standardize half. It lets process engineers author SOPs in a rich-text editor, link them to assets, and lets operators retrieve them via QR scan and ask questions through IDA (RAG over docs).

**This codebase** is a frontend-only showcase: pure browser, SQLite via WASM, Google Gemini for Q&A, no backend. Built to demonstrate the full DOCS experience for sales demos and engineering alignment, not to run in production.

The 8-week paid POC frame in the business doc converts at €75–100K/year. Every visible feature here is sized to defend that conversation.

---

## Tech stack — the load-bearing parts

- **React 19 + TypeScript 5.8 + Vite 7**, strict-off TS (per `tsconfig.app.json`)
- **Tailwind 3** + **shadcn/ui** (Radix primitives) — design tokens in `src/index.css`
- **`sql.js`** (SQLite WASM) → **IndexedDB** for persistence; cross-tab sync via **BroadcastChannel**
- **TipTap 2.10** for authoring; custom `launchLog` (block) + `linkedAsset` (inline) nodes
- **`react-pdf` + `pdfjs-dist`** for PDF viewing + text extraction
- **`@google/generative-ai`** (`text-embedding-004` + `gemini-2.0-flash`)
- **`wouter`** for routing — top-level switch on `/m/*` toggles desktop vs mobile shell
- **`react-hook-form` + `zod`**, **`sonner`** toasts, **`next-themes`**

Full versions and rationale in `oppr-docs-status.md` → "Tech stack".

---

## Run / build / verify

```bash
# from oppr-docs/

npm install                  # one-time
cp .env.example .env.local   # paste VITE_GEMINI_API_KEY
npm run dev                  # http://localhost:5173

# Before declaring any change "done", run BOTH:
npx tsc -b                   # type-check (must exit 0)
npx vite build               # production build (must exit 0)
```

The dev server may already be running in the background — check `http://localhost:5173` before starting another.

If you change anything in `src/db/`, also run `Settings → Reset demo` to wipe IndexedDB and re-seed, otherwise old persisted state can mask bugs.

---

## Architecture in 5 lines

1. One Vite app. Same code serves desktop (`/`) and mobile (`/m/*`). The desktop sidebar's **Mobile** button calls `window.open('/m', …)` to launch a popup the user resizes to phone size.
2. Both windows share **one** sql.js DB blob in IndexedDB. Writes in either window broadcast on `BroadcastChannel('oppr-docs')` and the other window reloads its in-memory DB.
3. Repositories in `src/db/repositories/*.ts` are the only legitimate way to touch SQL. Every mutation calls `markDirty()` which schedules a 500 ms debounced `persist()`.
4. AI lives in `src/ai/*` — never imported from anywhere except `src/components/ai/AskPanel.tsx` and Settings.
5. The slide-in **Ask IDA** sheet (`AskIdaSheet`) is the universal Q&A surface. It accepts three scopes: `{ kind: 'doc', id }`, `{ kind: 'asset', id }`, `{ kind: 'library' }`.

---

## Folder ownership — respect this

| Folder | Owner concern | Don't do |
|---|---|---|
| `src/db/**` | DB engine, schema, repos, seed | Bypass repos to query SQL from a page |
| `src/ai/**` | Gemini calls, retrieval, embeddings | Import from `src/db/**` directly — go via the barrel `@/db` |
| `src/components/ui/**` | shadcn primitives, cherry-picked | Edit these. Replace if needed |
| `src/components/{layout,mobile,docs,ai}/**` | Feature components | Reach into pages |
| `src/pages/desktop/**` | Desktop routes | Touch mobile pages |
| `src/pages/mobile/**` | Mobile routes (`/m/*`) | Touch desktop pages |
| `src/lib/utils.ts` | `cn()` helper only | Add unrelated utilities here |

When unsure, look at the existing import graph and copy the pattern.

---

## Code conventions

- **No emojis** in code, comments, or output unless the user explicitly asks.
- **No comments unless the why is non-obvious.** Don't write "fetch the document then render it" — the code says that. Do write `// pdf.js detaches the buffer it receives — copy first` if the why is hidden.
- **No new docs files** unless the user asks (`*.md`, README additions, etc.).
- **Use `cn()`** from `@/lib/utils` for conditional classes.
- **Use shadcn components** before writing custom UI. The full set is in `src/components/ui/`.
- **Live data** — pages should call `useDb()` for the DB handle and `useDbWatcher()` (number) as a `useMemo`/`useEffect` dep so re-renders happen after writes.
- **Naming code format** for documents: `{SITE}-{DEPT}-{TYPE}-{NNNN}` (e.g. `HOL-OPS-SOP-0001`). Use `NamingCodeField` for any input.
- **TipTap content** — both editor and read view use the shared `.tiptap-content` CSS class in `src/index.css`. Never bring back the dead Tailwind `prose` classes (`@tailwindcss/typography` is not installed).
- **Wouter v3 API** — `<Link href="/x" className="…">…</Link>` (no nested anchor).

---

## Common pitfalls

- **`sql.js` import** — must NOT exclude it from `optimizeDeps`. With it excluded, Vite serves the raw ESM browser build which has no default export and the app breaks at runtime.
- **PDF bytes** — `react-pdf` and `pdfjs.getDocument` detach the buffer. Always pass a fresh copy: `bytes.slice()`.
- **Cross-tab writes** — drop in-flight unsaved edits in the receiving tab. Documented v1 limitation.
- **Library Q&A persists.** `qa_sessions.scope_kind` accepts `'doc'|'asset'|'library'`; library sessions store `scope_id = 'library'`. Older IndexedDB blobs get migrated by `rebuildQaSessionsIfStaleCheck()` in `src/db/migrations.ts` — SQLite has no `ALTER … CHECK`, so the table is rebuilt with rows preserved.
- **Schema drift** — when you add an `Asset` field, update **three** places: the SQL schema, the `Asset` type, and BOTH `mapAsset` functions (one in `src/db/repositories/assets.ts`, one in `src/db/repositories/documents.ts`).
- **TipTap extension lists must mirror.** `DocumentEditor.tsx` and `TiptapReadOnly.tsx` both load `StarterKit + Image + Link + Table family + LaunchLog + LinkedAsset + Callout + Ppe + Diagram + StepList/StepItem`. If you add a node to the editor but not the read view, content gets silently stripped on the next render (this bit us once with tables). The read view also needs `Image` and `Link` because authored images/links round-trip as native HTML, not custom nodes.
- **Custom-node SVG content** — `DiagramBlock` renders SVG via `dangerouslySetInnerHTML`. Curated presets only (`src/components/docs/diagramPresets.ts`); never accept user-pasted SVG without sanitising.
- **Embedding-model swap requires re-embed.** `gemini-embedding-2` outputs 768-dim vectors when `outputDimensionality: 768` is passed (we do). If you change `EMBEDDING_DIM` or model in `src/ai/gemini.ts`, every existing chunk vector lives in a different space — Settings → "Re-embed all" is mandatory or RAG returns garbage.
- **WASM same-origin** — wasm files are imported via `?url` so Vite hashes them and serves same-origin (the dev server sets `Cross-Origin-Embedder-Policy: require-corp`).

---

## Common task recipes

### "Add a new column to assets"
1. Add to `src/db/schema.sql` (CREATE TABLE statement).
2. Add to the `Asset` interface in `src/types/index.ts`.
3. Add to BOTH `mapAsset` functions: `src/db/repositories/assets.ts` + `src/db/repositories/documents.ts`.
4. Add to the SELECT column list of every query that returns assets.
5. Update the seed if the field has a meaningful initial value.
6. Settings → Reset demo, or the new column won't exist on existing IndexedDB blobs.

### "Add a new page"
1. Create the component in `src/pages/desktop/` or `src/pages/mobile/`.
2. Wire it into `src/App.tsx`'s `<Switch>`.
3. Add a sidebar entry in `src/components/layout/DesktopShell.tsx` (or bottom-nav in `MobileShell.tsx`) if it deserves top-level nav.

### "Add a new TipTap node"
1. Define the node with `Node.create()` in `src/components/docs/`.
2. Export both the node + a picker dialog component (see `LaunchLogBlock.tsx`, `PpeBlock.tsx`, or `DiagramBlock.tsx` as reference patterns — atom blocks vs content blocks differ slightly).
3. Add it to the editor's extensions array in `DocumentEditor.tsx`. Surface it in the toolbar and (optionally) the slash menu via `makeSlashItems()`.
4. Add it to the read-only view's extensions array in `TiptapReadOnly.tsx`. **Both lists must match** or stored content gets silently stripped.
5. Round-trip via `data-*` attributes so `parseHTML` works. For block content, return `[tag, attrs, 0]` from `renderHTML`; for atom blocks omit the `0`.
6. Update `paragraphChunks()` in `src/db/seed.ts` if the node carries indexable text — atoms (ppe, diagram, launchLog) are skipped, container blocks (callout, stepItem) recurse.

### "Add a new document-type template"
1. Define a TipTap JSON skeleton in `src/components/docs/DocumentTemplates.ts`.
2. Wire the case into `templateForType()`. The `New document` page swaps the body when the user changes type, but only while the body is still an untouched template — `isUntouchedTemplateBody()` checks via `JSON.stringify` equality.

### "Add a new diagram preset"
1. Add an SVG entry to `DIAGRAM_PRESETS` in `src/components/docs/diagramPresets.ts`. Use `viewBox` so it scales; prefer named hex over Tailwind classes since the SVG is rendered via `dangerouslySetInnerHTML`.
2. The picker dialog surfaces it automatically — no other wiring needed.

### "Add a new Ask IDA scope"
1. Extend `AskPanelScope` in `src/components/ai/AskPanel.tsx`.
2. Extend `Scope` in `src/ai/retrieval.ts` and add a branch in `getScopeChunks`.
3. Add a chunk-listing helper in `src/db/repositories/chunks.ts` if needed.
4. If you want persistence, loosen the `qa_sessions.scope_kind` CHECK constraint and update `createSession`/`listSessions` types.

### "Run agents in parallel for big work"
For multi-file feature work, dispatch sibling agents partitioned by **folder ownership** (see table above). Give each one:
- The path to this file (`oppr-docs/CLAUDE.md`)
- The path to the status doc (`oppr-docs/oppr-docs-status.md`)
- A scoped file list it owns and a do-not-touch list
- Verification command: `npx tsc -b && npx vite build`

This is how the M3–M8 build ran — see `prd.md` §13 for the milestone breakdown.

---

## Highlights from the business doc

(Compressed from `../oppr_business.md`, v0.5 — read the original for nuance.)

- **DOCS sits inside a 3-module loop**: LOGS captures, IDA investigates, DOCS standardizes. Operators close the loop by following updated SOPs and feeding new captures back.
- **8-week paid POC at €25K** converts to **€75–100K annual** if three success criteria are co-signed at Week 0 and met by Week 7. v1.0 makes that conversion repeatable.
- **First ICP**: waste, recycling, waste-to-energy. Pattern: **variable input → operator judgment → expensive asset**. Mutares Holliday is the active POC (June–July 2026).
- **Data model**: Medallion (bronze/silver/gold). App-captured data lands directly in **silver** because metadata is attached at capture time — that's the commercial differentiator vs traditional MES rollouts.
- **Intelligence ladder**: L1 manual exploration → L2 dashboards → L3 conversational (this is the v1.0 ROI moment) → L4 autonomous agents (roadmap).
- **DOCS v1.0 capabilities** (business doc §8 rows 25–29):
  - PDF upload + storage
  - RAG Q&A over docs
  - Desktop authoring (open-source editor + naming convention)
  - QR-scan → asset-linked docs on operator app
  - SOP → log clickable launch reference
- **DOCS v1.1+ (out of scope here)**: AI-assisted SOP authoring inside DOCS, live SOP feedback while operator runs an SOP, logs embedded inside SOPs.
- **Asset/QR registry must be platform-scoped**, not project-scoped. Documents reference assets via `asset_id ↔ document_id` mapping (the human-readable naming code `HOL-OPS-MAN-0001` is metadata, not a lookup key).

---

## Authoring style for any text Claude writes

The user is **Floris** (`floris@oppr.ai`), the founder. Direct, low-fluff, no hedging. He notices padding and unnecessary affirmations. Match that.

- Brief end-of-turn summaries — one or two sentences, what changed, what's next.
- Stand-alone updates while working — one sentence per status check-in.
- Don't narrate "let me", "I'll start by", or "let me think". Just do it and report.
- Don't claim work is done until both `tsc -b` and `vite build` exit 0.
- For UI/visual changes you can't verify yourself, say so explicitly rather than asserting it looks right.

---

## When this file goes stale

Update **CLAUDE.md** when:
- A folder ownership rule changes (move table)
- A new common pitfall surfaces
- A new common task recipe is worth capturing
- The architecture in "5 lines" no longer fits

Update **`oppr-docs-status.md`** when:
- A milestone ticks (M9, M10)
- A schema or route changes
- A tech-stack choice shifts
- Anything that would surprise a future Claude

Don't restate things across both files. Status is the snapshot, this file is the orientation.

---

## Agent skills

### Issue tracker

GitHub issues at `oppr-sandbox/oppr-docs-2026H2`, accessed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
