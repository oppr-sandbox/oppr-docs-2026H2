import { internalMutation, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { requireUserId } from "./lib/auth"
import { walkBodyAssetIds } from "./lib/assetWalker"
import { counterKey, typeToken } from "./naming"

// App tables to clear on reset. Auth tables (users / authAccounts / authSessions)
// are intentionally excluded so the signed-in user keeps their session.
const APP_TABLES = [
  "meta",
  "assets",
  "assetLogs",
  "documents",
  "documentVersions",
  "documentAssets",
  "logs",
  "documentLogRefs",
  "chunks",
  "qaSessions",
  "qaMessages",
  "images",
  "imageUsages",
  "importJobs",
  "templates",
  "namingLocations",
  "namingDisciplines",
  "namingCounters",
] as const

// Every app table cleared by wipeAll — a true blank slate with no legacy data,
// including the naming vocabulary and counters. Only the auth tables (the
// signed-in user's account/session) are preserved. After this you must add at
// least one location + discipline acronym before creating the first document.
const WIPE_TABLES = [
  "meta",
  "assets",
  "assetLogs",
  "documents",
  "documentVersions",
  "documentAssets",
  "logs",
  "documentLogRefs",
  "chunks",
  "qaSessions",
  "qaMessages",
  "images",
  "imageUsages",
  "importJobs",
  "templates",
  "namingLocations",
  "namingDisciplines",
  "namingCounters",
] as const

const docTypeValidator = v.union(
  v.literal("sop"),
  v.literal("manual"),
  v.literal("work_instruction"),
  v.literal("lmra"),
)

// Blank slate: delete all documents, versions, chunks, assets, images,
// templates, and their dependents (plus the backing storage files). Keeps the
// signed-in user and the naming vocabulary. Nothing is reseeded — the user
// rebuilds from scratch. Internal: run from the CLI (npx convex run
// reset:wipeAll) or schedule it; not exposed to the browser client.
export const wipeAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docVersions = await ctx.db.query("documentVersions").collect()
    for (const dv of docVersions) {
      if (dv.pdfStorageId) {
        try {
          await ctx.storage.delete(dv.pdfStorageId)
        } catch {
          /* best-effort */
        }
      }
    }
    const images = await ctx.db.query("images").collect()
    for (const img of images) {
      if (img.storageId) {
        try {
          await ctx.storage.delete(img.storageId)
        } catch {
          /* best-effort */
        }
      }
    }
    const jobs = await ctx.db.query("importJobs").collect()
    for (const j of jobs) {
      if (j.sourceStorageId) {
        try {
          await ctx.storage.delete(j.sourceStorageId)
        } catch {
          /* best-effort */
        }
      }
    }

    let deleted = 0
    for (const table of WIPE_TABLES) {
      const rows = await ctx.db.query(table).collect()
      for (const row of rows) {
        await ctx.db.delete(row._id)
        deleted++
      }
    }
    return { ok: true, deleted }
  },
})

// Walk a body and rewrite linkedAsset placeholder ids of the form "code:CODE"
// to the real inserted asset id. Leaves anything else untouched.
function rewriteAssetPlaceholders(
  node: unknown,
  idByCode: Map<string, Id<"assets">>,
): unknown {
  if (Array.isArray(node)) {
    return node.map((n) => rewriteAssetPlaceholders(n, idByCode))
  }
  if (!node || typeof node !== "object") return node
  const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }
  const next: Record<string, unknown> = { ...n }
  if (n.type === "linkedAsset" && n.attrs) {
    const raw = n.attrs["assetId"]
    if (typeof raw === "string" && raw.startsWith("code:")) {
      const code = raw.slice("code:".length)
      const realId = idByCode.get(code)
      next.attrs = { ...n.attrs, assetId: realId ?? "" }
    }
  }
  if (Array.isArray(n.content)) {
    next.content = n.content.map((c) => rewriteAssetPlaceholders(c, idByCode))
  }
  return next
}

export const resetToReference = mutation({
  args: {
    locations: v.array(v.object({ code: v.string(), label: v.string() })),
    disciplines: v.array(v.object({ code: v.string(), label: v.string() })),
    assets: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        site: v.string(),
        location: v.union(v.string(), v.null()),
        qrToken: v.string(),
        description: v.union(v.string(), v.null()),
        level: v.number(),
        floorplan: v.union(v.string(), v.null()),
        isLinked: v.boolean(),
        linkedLogCode: v.union(v.string(), v.null()),
        linkedLogName: v.union(v.string(), v.null()),
        linkedLogDescription: v.union(v.string(), v.null()),
        pinNumber: v.union(v.number(), v.null()),
        pinX: v.union(v.number(), v.null()),
        pinY: v.union(v.number(), v.null()),
        logs: v.array(
          v.object({
            code: v.string(),
            name: v.string(),
            description: v.union(v.string(), v.null()),
          }),
        ),
      }),
    ),
    templates: v.array(
      v.object({
        name: v.string(),
        type: docTypeValidator,
        description: v.union(v.string(), v.null()),
        bodyJson: v.any(),
      }),
    ),
    reference: v.object({
      location: v.string(),
      discipline: v.string(),
      type: docTypeValidator,
      title: v.string(),
      bodyJson: v.any(),
      chunks: v.array(
        v.object({
          seq: v.number(),
          text: v.string(),
          pageOrSection: v.union(v.string(), v.null()),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)

    // 1. Wipe storage referenced by docs/images/imports, then all app rows.
    const docVersions = await ctx.db.query("documentVersions").collect()
    for (const dv of docVersions) {
      if (dv.pdfStorageId) {
        try {
          await ctx.storage.delete(dv.pdfStorageId)
        } catch {
          /* best-effort */
        }
      }
    }
    const images = await ctx.db.query("images").collect()
    for (const img of images) {
      if (img.storageId) {
        try {
          await ctx.storage.delete(img.storageId)
        } catch {
          /* best-effort */
        }
      }
    }
    const jobs = await ctx.db.query("importJobs").collect()
    for (const j of jobs) {
      if (j.sourceStorageId) {
        try {
          await ctx.storage.delete(j.sourceStorageId)
        } catch {
          /* best-effort */
        }
      }
    }
    for (const table of APP_TABLES) {
      const rows = await ctx.db.query(table).collect()
      for (const row of rows) await ctx.db.delete(row._id)
    }

    // 2. Naming vocabulary.
    for (const l of args.locations) {
      await ctx.db.insert("namingLocations", { code: l.code, label: l.label })
    }
    for (const d of args.disciplines) {
      await ctx.db.insert("namingDisciplines", { code: d.code, label: d.label })
    }

    // 3. Assets + their logs.
    const idByCode = new Map<string, Id<"assets">>()
    for (const a of args.assets) {
      const id = await ctx.db.insert("assets", {
        code: a.code,
        name: a.name,
        site: a.site,
        location: a.location,
        qrToken: a.qrToken,
        description: a.description,
        level: a.level,
        floorplan: a.floorplan,
        isLinked: a.isLinked,
        linkedLogCode: a.linkedLogCode,
        linkedLogName: a.linkedLogName,
        linkedLogDescription: a.linkedLogDescription,
        pinNumber: a.pinNumber,
        pinX: a.pinX,
        pinY: a.pinY,
      })
      idByCode.set(a.code, id)
      for (const log of a.logs) {
        await ctx.db.insert("assetLogs", {
          assetId: id,
          code: log.code,
          name: log.name,
          description: log.description,
        })
      }
    }

    // 4. Templates.
    const now = Date.now()
    for (const t of args.templates) {
      await ctx.db.insert("templates", {
        name: t.name,
        type: t.type,
        description: t.description,
        bodyJson: t.bodyJson,
        updatedAt: now,
      })
    }

    // 5. The single reference document — fully through the lifecycle.
    const ref = args.reference
    const body = rewriteAssetPlaceholders(ref.bodyJson, idByCode)

    // Naming code = first in this triplet's sequence; seed the counter to 1.
    const seq = 1
    const namingCode = `${ref.location}-${ref.discipline}-${typeToken(
      ref.type,
    )}-${seq.toString().padStart(4, "0")}`
    await ctx.db.insert("namingCounters", {
      key: counterKey(ref.location, ref.discipline, ref.type),
      value: seq,
    })

    const docId = await ctx.db.insert("documents", {
      namingCode,
      location: ref.location,
      discipline: ref.discipline,
      title: ref.title,
      type: ref.type,
      status: "published",
      currentVersion: 1,
      ownerId: userId,
      authorId: userId,
      reviewerId: userId,
      approverId: userId,
      tags: [],
      updatedAt: now,
    })

    await ctx.db.insert("documentVersions", {
      documentId: docId,
      version: 1,
      bodyKind: "tiptap",
      bodyJson: body,
      pdfStorageId: null,
      publishedAt: now,
      signoffs: [
        { role: "author", userId, at: now },
        { role: "reviewer", userId, at: now },
        { role: "approver", userId, at: now },
      ],
    })

    for (const c of ref.chunks) {
      await ctx.db.insert("chunks", {
        documentId: docId,
        version: 1,
        seq: c.seq,
        text: c.text,
        pageOrSection: c.pageOrSection,
        embedding: null,
        embeddingModel: null,
      })
    }

    // Derive linked assets from the body pills.
    const assetIds = walkBodyAssetIds(body)
    for (const raw of assetIds) {
      const typed = ctx.db.normalizeId("assets", raw)
      if (typed) {
        await ctx.db.insert("documentAssets", {
          documentId: docId,
          assetId: typed,
        })
      }
    }

    return { ok: true, documentId: docId, namingCode }
  },
})
