# ADR 0001 — Assets and logs are shared, platform-scoped registries

- Status: accepted
- Date: 2026-06-11

## Context

Oppr is one platform with three modules in a closed loop: **LOGS** (capture)
→ **IDA** (investigate) → **DOCS** (standardize). Two data concepts are owned
by the platform, not by any single module:

- **Assets** — the machine/equipment registry. The same asset (and its QR
  token) must resolve identically whether an operator scans it in LOGS or
  opens its linked SOPs in DOCS. The business doc is explicit: the asset/QR
  registry is platform-scoped, not project-scoped.
- **Logs** — the operator-capture stream lives in the LOGS module. DOCS
  references logs so a SOP can launch the exact log it standardizes
  (`AMS-OPS-LOG-0001`…). Those logs will be **imported** from LOGS, not
  authored in DOCS.

This showcase is a standalone Convex deployment, so it keeps its **own** copy
of both tables to be demoable in isolation. The risk: if components read or
write those tables freely, swapping the local copy for the real
platform-scoped registry later becomes a wide, cross-cutting change.

## Decision

1. **One access seam per registry.** All reads and writes of `assets` go
   through `convex/assets.ts`; all reads and writes of `logs` go through
   `convex/logs.ts`. No React component queries those tables directly — it
   calls `api.assets.*` / `api.logs.*`. (Documents reference assets via the
   `documentAssets` join and logs via `documentLogRefs`; neither embeds asset
   or log fields.)

2. **Provenance fields carry platform identity.** Both tables gain optional
   `source` (`"local"` default, or `"platform"`) and `externalId` (the row's
   id in the wider Oppr platform), with a `by_externalId` index for dedup on
   import. Optional so every existing row stays valid with no backfill.

3. **The naming code is metadata, not a lookup key.** Documents link to assets
   by `assetId` (Convex id), never by parsing the human-readable code
   `HOL-OPS-MAN-0001`. The code is for humans; the id is the join.

## Consequences

- Replacing the local registry with an imported, platform-scoped one is a
  server-side change confined to `convex/assets.ts` / `convex/logs.ts` plus an
  import job that upserts on `externalId`. The UI and the document/asset/log
  join tables don't change.
- RAG scope slicing is unaffected: asset scope resolves linked documents from
  `documentAssets` regardless of where the asset row originated.
- The showcase can keep seeding local placeholder assets and logs
  (`seedMinimal`) while real deployments import platform rows; the two coexist
  because every row is tagged by `source`.

## If you're about to change this

- Don't add a component that imports `convex/_generated` and queries `assets`
  or `logs` directly — route it through the module instead.
- Don't make documents depend on asset/log codes as keys.
- When you wire the real import, upsert by `externalId`, set
  `source: "platform"`, and leave locally-seeded rows untouched.
