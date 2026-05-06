# Oppr DOCS — v1.0 Showcase

Frontend-only showcase of the Oppr DOCS module. Local SQLite (sql.js + IndexedDB), Google Gemini for Q&A, simulated mobile app via a resized browser window.

See [`prd.md`](./prd.md) for the full requirements and progress checklist.

## Quick start

```bash
npm install
cp .env.example .env.local
# edit .env.local and set VITE_GEMINI_API_KEY=...
npm run dev
```

The Gemini key can also be entered later via Settings.

## Mobile view

Click **Mobile** in the left sidebar of the desktop app. A new browser window opens at `/m`. Resize that window to roughly 390 × 844 to feel the operator experience. Both windows share the same local SQLite, so changes in one show up in the other (reload to refresh).

## Architecture

- **Stack**: React 19 + TypeScript + Vite + Tailwind + shadcn/ui (cherry-picked from `../oppr-design-showcase`).
- **Routing**: `wouter`. Top-level switch on `/m/*` for the mobile shell.
- **Database**: `sql.js` loaded via WASM. Persisted to IndexedDB after every write (debounced).
- **AI**: Google Gemini — `text-embedding-004` for chunk embeddings, `gemini-2.0-flash` for chat.
- **Editor**: TipTap with a custom `LaunchLog` block.
- **PDF**: `react-pdf` (`pdfjs-dist` for text extraction).

## Folder layout

```
src/
├── components/
│   ├── ui/        — shadcn primitives, copied from showcase
│   ├── layout/    — DesktopShell
│   ├── mobile/    — MobileShell
│   └── docs/      — DOCS-specific (editor, viewer, panels)
├── pages/
│   ├── desktop/   — /, /docs/*, /assets/*, /settings
│   └── mobile/    — /m, /m/scan, /m/assets/*, /m/docs/*, /m/ask
├── db/            — sql.js layer + schema + seed
├── ai/            — Gemini wrapper + cosine similarity
├── types/         — shared domain types
├── lib/utils.ts   — cn() helper
└── hooks/         — use-toast.ts
```

## Reset demo

`Settings → Reset demo` wipes IndexedDB and re-seeds.
