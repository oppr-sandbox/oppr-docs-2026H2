# Oppr DOCS

Operator-facing knowledge base for manufacturing floors. Author SOPs in a rich editor, attach them to assets, retrieve them via QR, and ask questions through IDA (RAG over the document corpus).

Built on **React 19 + Vite + TypeScript + Tailwind + shadcn/ui** with **Convex** as the backend (auth, database, file storage, vector search, server-side AI). Streaming chat via **Gemini** behind a Convex HTTP action.

## Quick start (local)

```bash
npm install
npx convex dev          # in a separate terminal — provisions / connects the dev deployment
npm run dev             # starts Vite at http://localhost:5173
```

`npx convex dev` writes `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, and `VITE_CONVEX_SITE_URL` into `.env.local`. Sign in with an `@oppr.ai` magic link (configured via Convex Auth + Resend).

### One-time dev env

```bash
npx convex env set GEMINI_API_KEY <key>
npx convex env set AUTH_RESEND_KEY <resend api key>
npx convex env set AUTH_EMAIL "Oppr DOCS <onboarding@resend.dev>"
```

`SITE_URL` is set automatically by `npx @convex-dev/auth`. `JWT_PRIVATE_KEY` and `JWKS` are also provisioned by that command.

## Production deploy

The production stack runs **Vercel** (static Vite bundle) + **Convex prod deployment** (functions, DB, storage, vector index).

### 1. Push the branch

```bash
git push -u origin <branch>
```

### 2. Provision the prod Convex deployment

```bash
npx convex deploy --cmd "echo skip"
```

The first run prompts you to create a production deployment under your team. It writes the prod `CONVEX_DEPLOY_KEY` and prints the prod `CONVEX_URL` + `CONVEX_SITE_URL`. Note both URLs — you'll paste them into Vercel.

Set the prod env on the new deployment:

```bash
npx convex env set GEMINI_API_KEY <key>          --prod
npx convex env set AUTH_RESEND_KEY <key>         --prod
npx convex env set AUTH_EMAIL "Oppr DOCS <noreply@yourdomain>" --prod
npx convex env set SITE_URL https://<vercel-prod-url> --prod
```

`JWT_PRIVATE_KEY` + `JWKS` are auto-set when you ran `npx @convex-dev/auth` against the prod deployment (re-run with `--prod` if needed).

### 3. Connect Vercel

In the Vercel dashboard:

1. **Import** the GitHub repo.
2. **Framework**: Vite (auto-detected via `vercel.json`).
3. **Environment variables**:
   - `VITE_CONVEX_URL` = prod Convex URL (`https://*.convex.cloud`)
   - `VITE_CONVEX_SITE_URL` = prod Convex site URL (`https://*.convex.site`)
4. **Deploy**.

After the first deploy, copy the Vercel URL back into Convex prod's `SITE_URL` env (step 2) so magic-link redirects land on the right host. Push a trivial change to redeploy and pick up the corrected SITE_URL.

### 4. Smoke test

- Sign in with an `@oppr.ai` email — magic link arrives.
- Library loads.
- Open a doc, ask IDA a question — streaming response with citations.
- Upload a PDF, ask about it.

## Architecture

- **Auth**: Convex Auth (magic-link via Resend), gated to `@oppr.ai` in the `createOrUpdateUser` callback.
- **DB**: Convex tables (`documents`, `documentVersions`, `assets`, `documentAssets`, `chunks`, `qaSessions`, `qaMessages`, `meta`, `assetLogs`, `logs`, `documentLogRefs`) plus the `authTables` from `@convex-dev/auth`.
- **AI**: Gemini behind `convex/ai/`:
  - `embed.ts` — actions that embed chunks via `:embedContent` (idempotent on `chunkId + modelVersion`). Auto-scheduled on doc publish.
  - `ask.ts` — `askQuestion` action (non-streaming) + `askStream` HTTP action (streaming via `@google/generative-ai` SDK, NDJSON to the client).
- **Vector search**: `chunks.embedding` field with a 768-dim vector index, filtered by `documentId` for doc-scoped queries.
- **File storage**: PDFs upload via `generateUploadUrl` → POST → `attachPdf` mutation. Read via signed URLs from `getUrl`.
- **Routing**: `wouter` — top-level switch on `/m/*` for the mobile shell.

## Folder layout

```
oppr-docs/
├── convex/                      Backend (functions, schema, AI, storage)
│   ├── schema.ts
│   ├── auth.ts, auth.config.ts
│   ├── http.ts                  HTTP routes incl. /ai/askStream
│   ├── documents.ts, assets.ts, qa.ts, files.ts, logs.ts, users.ts, seed.ts
│   ├── ai/
│   │   ├── ask.ts               action + httpAction
│   │   ├── embed.ts             actions for embedding pipeline
│   │   └── constants.ts
│   └── lib/auth.ts              requireUser / requireUserId
├── src/
│   ├── auth/                    AuthGate, SignInForm
│   ├── components/
│   │   ├── ui/                  shadcn primitives
│   │   ├── layout/              DesktopShell
│   │   ├── mobile/              MobileShell + mobile widgets
│   │   ├── docs/                Editor, Viewer, asset/log pickers, dialogs
│   │   └── ai/                  AskPanel, ScopeChip, RelatedRail, etc.
│   ├── pages/
│   │   ├── desktop/             /, /assets/*, /docs/*, /settings, /analysis/*
│   │   └── mobile/              /m, /m/scan, /m/assets/*, /m/docs/*, /m/ask
│   ├── lib/
│   │   ├── convex-adapters.ts   Convex doc → legacy domain types
│   │   └── pdf-export/          buildPrintDoc + openPrintWindow
│   ├── admin/
│   │   ├── seedDataset.ts       Showcase dataset (assets, logs, docs)
│   │   ├── seedBodies.ts        TipTap doc body fixtures
│   │   └── buildSeedPayload.ts  Builds the payload for api.seed.seedDemoData
│   └── types/                   Shared domain types
└── vercel.json                  Vite framework + SPA rewrite for client routing
```

## Verification gates

```bash
npx tsc -b              # type-check (must exit 0)
npx vite build          # production build (must exit 0)
```

Both must pass before any change is considered done.

## Reset demo

Settings → "Seed demo data" pushes the showcase library to Convex (idempotent on `meta.seedVersion`). Settings → "Re-embed all" wipes + recomputes vectors against the current embedding model.
