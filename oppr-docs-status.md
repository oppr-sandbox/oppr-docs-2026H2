# Oppr DOCS — Build Status

**Snapshot:** 2026-05-06
**Build state:** Green. `npx tsc -b` and `npx vite build` both exit 0.
**Dev server:** `npm run dev` → http://localhost:5173

This file is a living record of what's actually shipped in `oppr-docs/`. Update it whenever work lands. For requirements, read [`prd.md`](./prd.md). For business context, read [`../oppr_business.md`](../oppr_business.md). For Claude orientation, read [`CLAUDE.md`](./CLAUDE.md).

---

## What Oppr DOCS is

A frontend-only **showcase build** of the DOCS module from the Oppr v1.0 platform — the standardize half of the LOGS → IDA → DOCS continuous-improvement loop described in the business doc. Built to demonstrate the operator + process-engineer experience without standing up production infrastructure.

Three visible surfaces:

1. **Desktop knowledge-worker app** — author SOPs, manage assets, browse the document library, ask IDA across documents.
2. **Mobile-window operator app** — sidebar "Mobile" link opens a popup at `/m`. Resize manually to phone size. Simulated QR scan → asset → linked docs → ask IDA.
3. **Settings** — Gemini API key, theme toggle, "Reset demo" button, embedding tools.

---

## Tech stack (concrete versions)

| Layer | Choice | Why |
|---|---|---|
| Runtime | React 19 + TypeScript 5.8 | Same as `../oppr-design-showcase` — direct cherry-pick |
| Build | Vite 7 | Fast dev, native ESM, WASM-friendly |
| Styling | Tailwind 3 + shadcn/ui (Radix) + CSS custom-property tokens | Light/dark theme, 40+ components copied from showcase |
| Routing | `wouter` 3 | Lightweight; `/m/*` branch renders mobile shell, everything else desktop |
| Database | `sql.js` 1.13 → IndexedDB | Zero backend; all data in the browser; cross-tab sync via BroadcastChannel |
| Editor | TipTap 2.10 (StarterKit + Image + Link + Placeholder + Table family + 6 custom nodes) | Open source, React-native, extensible |
| PDF view | `react-pdf` 10 + `pdfjs-dist` 5 | View + extract text on upload; reads `?page=` for citation deep links |
| PDF generation | `pdf-lib` 1.17 | Builds the seeded Drying Oven 4 manual at boot so the demo has a real PDF blob |
| AI | `@google/generative-ai` 0.24 → `gemini-embedding-2` (768-dim) + `gemini-3.1-flash-lite-preview` | Embedding model emits 768 dims via `outputDimensionality`; chat model is fast/cheap; key from Settings (localStorage) or `VITE_GEMINI_API_KEY` |
| Markdown | `react-markdown` 10 + `remark-gfm` 4 | Used by the AI chat panel; throttled re-parse during streaming so partial tokens don't flicker |
| Forms | `react-hook-form` 7 + `zod` 4 | Used in MetadataPanel |
| Toasts | `sonner` 2 | Used everywhere |
| Theming | `next-themes` 0.4 | Light/dark mode, defaults light |

Bundle size: ~2.25 MB JS gzipped 727 KB. Heavy because of sql.js + pdfjs + tiptap + react-markdown + pdf-lib. Acceptable for a showcase; not optimised.

---

## What's built (M1–M8 ✅)

### M1 — Scaffold
- Vite project at `oppr-docs/` with all configs cherry-picked from the showcase
- `src/components/ui/*` — 44 shadcn components (calendar, carousel, chart removed; the rest copied verbatim)
- Theme tokens (`src/index.css`)
- Routing shell — top-level `useLocation` switch; `/m/*` → `MobileShell`, else → `DesktopShell`
- Desktop sidebar with **Mobile** button that calls `window.open('/m', 'oppr-mobile', 'width=390,height=844…')`

### M2 — SQLite + seed
- `src/db/sqlite.ts` — singleton sql.js engine; WASM loaded via `?url` import (same-origin, COEP-safe); 500 ms debounced persist to IndexedDB key `oppr-docs-db`. `seed()` is now async because it generates a real PDF.
- `src/db/migrations.ts` — runs `schema.sql` (12 tables; see [Data model](#data-model)). Includes `rebuildQaSessionsIfStaleCheck()` — rebuilds `qa_sessions` if the persisted schema's CHECK still excludes `'library'`.
- `src/db/seed.ts` — deterministic seed: 3 users, 6 HOL pigment-calcination assets, 4 logs, **12 documents** (10 TipTap + 1 generated PDF + 1 reserved). Bodies factored into `src/db/seedDocs.ts`. Real PDF for Drying Oven 4 generated at boot via `src/db/seedPdf.ts` (`pdf-lib`, 4 pages). `paragraphChunks()` walks the body recursively and emits one chunk per paragraph / list item / table row; tables prefix each row with column headers; step lists prefix `Step N:`; atom blocks (ppe / diagram / launchLog / linkedAsset) are skipped.
- `src/db/repositories/*.ts` — typed read/write helpers for every table
- `src/db/DbProvider.tsx` — React context, `useDb()` + `useDbWatcher()`, BroadcastChannel cross-tab sync, `reset()`
- Reset Demo button wired in Settings

### M3 — Library + Assets
- `LibraryPage` — full-text search + status/type filters, `DocumentLibraryTable` with linked-asset counts
- `AssetsPage` — card grid, doc counts per asset
- `AssetDetailPage` — header + linked-docs table
- Two-line cells (primary text + mono code) following production Oppr Logs pattern

### M4 — PDF
- `DocumentNewPage?kind=pdf` — drop-zone, parses with `pdfjs.getDocument()`, stores BLOB in `pdf_blobs`, extracts per-page text into `chunks`
- `PdfViewer` — page nav + zoom; copies bytes before passing to react-pdf (pdf.js detaches buffers)

### M5 — TipTap authoring + versioning
- `DocumentEditor` — full toolbar, slash menu (`/` opens floating panel — no tippy), StarterKit + custom nodes
- `MetadataPanel` — sticky right rail; title/type/owner/tags/assets/code; zod validation
- `NamingCodeField` — `{SITE}-{DEPT}-{TYPE}-{NNNN}` with auto-increment + uniqueness check
- `DocumentEditPage` — Save Draft / Submit for review / Publish, each calls `publishVersion` and re-extracts chunks
- `VersionHistoryDrawer` — shadcn Sheet listing all versions

### M6 — SOP→Log clickable launch (custom block)
- `LaunchLogNode` (TipTap block atom) + `LaunchLogPicker` dialog
- `LinkedAssetNode` (inline atom) + `LinkedAssetPicker`
- Both round-trip through `data-*` attributes; rendered identically by `TiptapReadOnly`

### M7 — Mobile-window operator app
- `MobileShell` with bottom nav (Home / Scan / Ask) and resize-hint overlay
- `MobileScanPage` — asset picker simulating QR scan
- `MobileAssetPage` — header, linked-docs list, floating Ask button
- `MobileDocPage` — branches PDF vs TipTap, with ErrorBoundary + Suspense fallback
- `MobileAskPage` — uses AskPanel in compact mode, scoped via `?scope=doc:id` or `?scope=asset:id`

### M8 — Gemini Q&A
- `src/ai/gemini.ts` — API key resolution (localStorage → `VITE_GEMINI_API_KEY`)
- `src/ai/embeddings.ts` — `embed`, `embedBatch` (concurrency 4 + 200ms backoff), `embedMissingChunks`
- `src/ai/similarity.ts` — `cosineSim`, `topK`
- `src/ai/retrieval.ts` — `retrieveForQuery` for `doc` | `asset` | `library` scopes
- `src/ai/chat.ts` — `askQuestion()` async generator, streams via `generateContentStream`, yields `{delta}` then `{done, citations}`
- `src/components/ai/AskPanel.tsx` — chat UI with persisted sessions for doc/asset, ephemeral for library
- `src/components/ai/AskIdaSheet.tsx` — slide-in Sheet wrapper used in DocumentReadPage and LibraryPage

### Recent polish (post-M8)
- **WYSIWYG editor** — replaced dead `prose` Tailwind classes (`@tailwindcss/typography` not installed) with a shared `.tiptap-content` CSS class; editor and read view now look identical
- **Ask IDA as slide-in** — DocumentReadPage and LibraryPage both have an "Ask IDA" header button that opens a right-side Sheet
- **Library Q&A scope persists** — `qa_sessions.scope_kind` accepts `'library'`; older blobs are auto-migrated by rebuilding the table.

### Chat / RAG hardening (the second round)
- **Markdown rendering** for assistant turns via `react-markdown` + `remark-gfm`. Throttled re-parse (~30 Hz) during streaming so partial tokens don't flicker.
- **Inline `[N]` citation anchors** become clickable footnote buttons that scroll to the matching pill; **bare entity codes** (HOL-OPS-SOP-0001 / RMR-101 / HOL-OPS-LOG-0001) auto-link when they exist in the DB (`useCodeIndex`).
- **`SourcesBlock`** groups citations by document with hover-card previews and "Open at this location" deep links (PDF jumps via `?page=N`).
- **`RelatedRail`** under each assistant message — pure DB joins from the cited doc set produce other docs, assets, and logs the user can pivot to.
- **`StarterPrompts`** per-scope on empty state, **per-message Copy / Regenerate / Stop**, **`AbortController`** to cancel mid-stream, **6-turn sliding history** to keep context bounded.
- **`ScopeChip`** in the panel header — switch between Library / Document / Asset live without closing the chat.
- **Per-scope context block** (`src/ai/context.ts`) — for inventory questions on library scope, or always for doc/asset, a deterministic summary (full doc inventory, doc TOC, asset details) is injected before EXCERPTS so overview questions answer correctly without RAG samples.
- **Mobile parity** — `MobileAskPage` supports library scope first-class, has "Ask across everything" as the headline option, and the scope chip works inside the mobile panel.

### Document authoring upgrades (latest)
- **6 custom TipTap nodes**: `LaunchLog`, `LinkedAsset`, `Callout` (warning/caution/notice/tip/danger), `Ppe`, `Diagram` (six curated SVG presets in `diagramPresets.ts`), `StepList`/`StepItem` (auto-numbered procedure steps).
- **`TiptapReadOnly` extension list now mirrors the editor** (Image, Link, Table family + all custom nodes). Previous bug: tables / images authored in the editor were silently stripped on the read view because the extensions weren't loaded.
- **Document hero block** (`DocumentHero`) on `DocumentReadPage`: bold ID badge + type/status/version pills, owner, dates, asset chips, tags, **PPE pictogram row** extracted from the body's first `ppe` node.
- **Auto-generated TOC** (`DocumentToc`) sidebar with smooth-scroll anchors and IntersectionObserver scroll-spy.
- **Print** button on the read header; `@media print` CSS hides chrome and adds page-break hints to tables, callouts, step lists, and diagrams.
- **Library "Group by type" toggle** — clusters docs by SOP / Manual / WI / LMRA in the Library page.
- **`New document` templates** (`DocumentTemplates.ts`) — picking a doc type seeds the editor with a typed skeleton (PPE row, safety callout, step list, troubleshooting table for SOP; operating envelope, maintenance schedule, spare parts, revision history for Manual; etc.). Switching type before editing swaps the skeleton; once the user types, the body is left alone.
- **Mobile** — `MobileDocSummary` shows PPE icons + asset chips above the body so the operator gets the safety briefing above the fold.

### Seed enrichment (latest)
- 8 → **12 documents**, all plant-correct for the pigment-calcination skin (RMR-101 / FCK-102 / FCK-103 / FRT-201 / FRT-202 / STR-301).
- Bodies factored into `src/db/seedDocs.ts`. Every authoring primitive (table, callout, PPE chip, SVG diagram, step list, LaunchLog, LinkedAsset) appears at least twice.
- One **real PDF** generated via `pdf-lib` at boot for `HOL-OPS-MAN-0002` (Drying Oven 4) — 4 pages, real text content, real metadata. Per-page chunks materialised so RAG works against it.
- New docs: `HOL-OPS-SOP-0004` Pre-Kiln Inspection, `HOL-OPS-LMRA-0002` Hot work permit, `HOL-OPS-WI-0002` Sticker OCR capture (UC1 from business doc), `HOL-OPS-SOP-0005` End-of-shift summary (UC3 asset-agnostic).

### AI model swap (latest)
- Embedding model: `text-embedding-004` → **`gemini-embedding-2`** with `outputDimensionality: 768` so existing 768-dim chunk storage and similarity math stay valid.
- Chat model: `gemini-2.0-flash` → **`gemini-3.1-flash-lite-preview`**.
- Settings page rebuilt: live test panels for embedding (input → dim/latency/L2-norm/vector preview) and generation (input → latency/text), plus "Re-embed all (clear + rebuild)" because vectors from the old model live in a different space than the new one.

---

## What's not built (M9–M10 ⏳)

- Manager review flow — version diff, approve from "in_review" → "published"
- Floorplan view (the visually striking feature in production — see screenshots)
- Asset List ↔ Asset Hierarchy tab toggle
- Project Context pill in sidebar header
- Inline edit/delete actions in tables
- Reorder up/down arrows on tables
- Keyboard shortcuts (cmd+k command palette, cmd+s save)
- Empty-state onboarding "Load demo data" CTA
- README demo script

See [`prd.md`](./prd.md) §13 for the full milestone list.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│                                                                  │
│  ┌───────────────────┐         ┌───────────────────────────┐    │
│  │ Desktop window     │  open  │ Mobile popup window        │    │
│  │ http://…/          │ ─────▶ │ http://…/m                 │    │
│  │ DesktopShell       │        │ MobileShell                │    │
│  └─────────┬─────────┘         └─────────┬─────────────────┘    │
│            │                              │                      │
│            ▼                              ▼                      │
│       ┌──────────────────────────────────────────┐               │
│       │  Single sql.js DB instance per window     │               │
│       │  Persisted to shared IndexedDB key        │               │
│       │  Cross-tab sync via BroadcastChannel       │               │
│       └────────────────┬─────────────────────────┘               │
│                        │                                          │
│                        ▼                                          │
│              ┌───────────────────┐                                │
│              │ Google Gemini API │  (embeddings + chat)           │
│              └───────────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
```

**Single source of truth** for both windows: the IndexedDB-backed SQLite blob. Mobile and desktop see the same data. Edits in one trigger a `BroadcastChannel('oppr-docs')` ping; the other window reloads its in-memory DB and bumps a version counter so consumers re-render.

---

## Folder structure

```
oppr-docs/
├── prd.md                  ← requirements (PRD + checklist)
├── oppr-docs-status.md     ← THIS FILE
├── CLAUDE.md               ← Claude orientation
├── README.md
├── package.json
├── vite.config.ts          ← `?url` WASM imports, COEP headers
├── tailwind.config.js
├── tsconfig.{,app,node}.json
├── index.html
├── .env.example            ← VITE_GEMINI_API_KEY
├── .env.local              ← gitignored; real key here
├── public/
│   └── favicon.ico
└── src/
    ├── main.tsx
    ├── App.tsx             ← top-level route switch (desktop vs mobile)
    ├── index.css           ← Tailwind + design tokens + .tiptap-content
    ├── vite-env.d.ts
    ├── components/
    │   ├── ui/             ← 44 shadcn primitives (cherry-picked)
    │   ├── layout/
    │   │   └── DesktopShell.tsx
    │   ├── mobile/         ← mobile-only components
    │   ├── docs/           ← DOCS-specific (editor, viewer, panels, blocks)
    │   └── ai/             ← AskPanel, AskIdaSheet
    ├── pages/
    │   ├── desktop/        ← /, /docs/*, /assets/*, /settings
    │   └── mobile/         ← /m, /m/scan, /m/assets/*, /m/docs/*, /m/ask
    ├── db/
    │   ├── sqlite.ts       ← engine, IndexedDB persistence, debounced writes
    │   ├── DbProvider.tsx  ← React context + cross-tab sync
    │   ├── migrations.ts   ← runs schema.sql via Vite ?raw import
    │   ├── schema.sql      ← 12 tables, full schema
    │   ├── seed.ts         ← deterministic seed
    │   ├── index.ts        ← barrel export
    │   └── repositories/   ← one file per entity
    ├── ai/
    │   ├── gemini.ts       ← client + key resolution
    │   ├── embeddings.ts
    │   ├── similarity.ts
    │   ├── retrieval.ts    ← scope-aware chunk retrieval
    │   ├── chat.ts         ← streaming askQuestion()
    │   └── index.ts
    ├── types/
    │   └── index.ts        ← Asset, Doc, DocVersion, Citation, etc.
    ├── lib/
    │   └── utils.ts        ← cn()
    └── hooks/
        └── use-toast.ts
```

### Folder ownership rules (for parallel agent work)
- `src/db/**` — DB layer only. Don't reach in from pages.
- `src/ai/**` — AI layer only. Page code calls via barrel exports.
- `src/components/ui/**` — shadcn primitives. Don't edit; replace if needed.
- `src/components/{layout,mobile,docs,ai}/**` — feature components.
- `src/pages/desktop/**` and `src/pages/mobile/**` — route components only.

---

## Data model

12 SQLite tables. Schema source of truth: `src/db/schema.sql`.

```
users(id, name, role)
assets(id, code, name, site, location, qr_token, created_at,
       description, level, floorplan, is_linked,
       linked_log_code, linked_log_name, linked_log_description)
documents(id, naming_code, title, type, status, current_version,
          owner_id, tags_json, created_at, updated_at)
document_versions(id, document_id, version, body_kind, body_json,
                  pdf_blob_id, published_at)
document_assets(document_id, asset_id)
pdf_blobs(id, filename, mime, bytes, page_count)
logs(id, name, type)
document_log_refs(document_id, version, log_id, anchor_id)
chunks(id, document_id, version, seq, text, page_or_section)
embeddings(chunk_id, vector_json)
qa_sessions(id, scope_kind, scope_id, created_at)   -- scope_kind: 'doc'|'asset'|'library'
qa_messages(id, session_id, role, text, citations_json, created_at)
```

Seed totals: 3 users, 6 assets, 4 logs, **12 documents** (10 TipTap + 1 generated PDF + 1 reserved), ~140 chunks, 0 embeddings (computed on first Q&A or via Settings).

Every TS shape mirrors a row in `src/types/index.ts`.

---

## Routes

### Desktop
| Path | Component | Purpose |
|---|---|---|
| `/` | LibraryPage | Doc library + filters + Ask IDA (library scope) |
| `/docs/new` | DocumentNewPage | New TipTap doc |
| `/docs/new?kind=pdf` | DocumentNewPage | PDF upload flow |
| `/docs/:id` | DocumentReadPage | Read view + Ask IDA (doc scope) + History |
| `/docs/:id/edit` | DocumentEditPage | Two-column TipTap editor + MetadataPanel |
| `/assets` | AssetsPage | Asset registry |
| `/assets/:id` | AssetDetailPage | Asset + linked docs |
| `/settings` | SettingsPage | API key, theme, embeddings, reset |

### Mobile (popup window)
| Path | Component | Purpose |
|---|---|---|
| `/m` | MobileHomePage | Scan / Ask shortcuts |
| `/m/scan` | MobileScanPage | Simulated QR pick → asset |
| `/m/assets/:id` | MobileAssetPage | Linked docs list |
| `/m/docs/:id` | MobileDocPage | PDF or TipTap reader |
| `/m/ask?scope=doc:id` | MobileAskPage | AskPanel scoped to doc |
| `/m/ask?scope=asset:id` | MobileAskPage | AskPanel scoped to asset |

---

## AI / RAG flow

1. **Embedding** — `text-embedding-004` (768-dim). Lazy backfill: first time a user asks a question, any unembedded chunks are embedded inline (with a progress toast). Or run "Embed all chunks" from Settings to do it upfront.
2. **Retrieval** — `retrieveForQuery(db, q, scope, k=5)`. Scope can be:
   - `{ kind: "doc", id }` — chunks for that doc's current version
   - `{ kind: "asset", id }` — chunks across all docs linked to that asset
   - `{ kind: "library" }` — every chunk in the catalog (current version each)
3. **Cosine top-k** — pure JS, in-memory. No vector DB.
4. **Generation** — `gemini-2.0-flash` via `generateContentStream`. System prompt instructs `[^N]` citation format. Excerpts injected as numbered context blocks. History replayed as `user`/`model` turns.
5. **Persistence** — doc/asset Q&A persists to `qa_sessions` + `qa_messages`. Library Q&A is ephemeral (avoids touching the schema's CHECK constraint).
6. **UI** — `AskPanel` is the chat UI; `AskIdaSheet` wraps it in a right slide-in on desktop. Mobile `/m/ask` uses `AskPanel compact`.

---

## Build & verification

```bash
# Type-check
npx tsc -b

# Production build
npx vite build

# Dev server
npm run dev   # → http://localhost:5173
```

Last verified build (2026-05-05):
- 2,378 modules transformed
- 13 s build time
- 1,494 KB JS (459 KB gzip), 76 KB CSS (13 KB gzip)
- 1,046 KB pdf.worker (separate chunk), 660 KB sql-wasm
- Two benign warnings: PdfViewer/TiptapReadOnly are both static and lazy-imported (Mobile uses lazy + Suspense as a defensive fallback).

---

## Known issues / quirks

- **Cross-window writes** drop in-flight unsaved edits in the receiving tab — accepted v1 limitation. PRD §15.
- **PDFs as BLOBs in SQLite** could bloat memory if you upload many large files. Cap at 10 MB or split storage; not yet implemented.
- **Gemini key in browser** — `VITE_*` vars are bundled into the client; key is visible in devtools. Fine for local showcase, rotate after demos.
- **Library Q&A persists.** `qa_sessions.scope_kind` accepts `'library'`. Older IndexedDB blobs are auto-migrated on next boot — no reset required for the schema change, but the migration only runs once per blob.
- **Embedding seed docs takes ~30–60 s** on first Q&A. UI shows progress toast. After an embedding-model swap (e.g. to `gemini-embedding-2`), Settings → "Re-embed all" is mandatory because old vectors live in a different space.

---

## Recent diffs worth knowing about

- **2026-05-05** — `Asset` type extended with production-mirror fields (description/level/floorplan/is_linked/linked_log_*) by the user mid-flight. Both `mapAsset` mappers updated. Schema `assets` table widened.
- **2026-05-05** — `optimizeDeps.exclude: ['sql.js']` removed from `vite.config.ts`. With it set, Vite served `sql.js` raw and the ESM browser build doesn't expose a default export — broke runtime.
- **2026-05-05** — WYSIWYG: shared `.tiptap-content` CSS class replaces dead `prose` classes.
- **2026-05-05** — Ask IDA moved from inline panel to slide-in Sheet; library scope added.

---

## How to update this file

When you ship work that materially changes:
- a tech choice → update the **Tech stack** table
- a milestone status → tick **What's built** / **What's not built**
- a folder or contract → update **Folder structure** / **Folder ownership rules**
- a schema → update **Data model**
- a route → update **Routes**

Append a row to **Recent diffs worth knowing about** for anything that would surprise a future Claude or future you.
