import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { Doc, Id } from "./_generated/dataModel"
import { requireUser, requireUserId } from "./lib/auth"

const docTypeValidator = v.union(
  v.literal("sop"),
  v.literal("manual"),
  v.literal("work_instruction"),
  v.literal("lmra"),
)
const docStatusValidator = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("published"),
  v.literal("archived"),
)

export const list = query({
  args: {
    status: v.optional(docStatusValidator),
    type: v.optional(docTypeValidator),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    let docs = await ctx.db.query("documents").take(500)

    if (args.status) docs = docs.filter((d) => d.status === args.status)
    if (args.type) docs = docs.filter((d) => d.type === args.type)
    if (args.search) {
      const needle = args.search.toLowerCase()
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(needle) ||
          d.namingCode.toLowerCase().includes(needle),
      )
    }

    docs.sort((a, b) => b.updatedAt - a.updatedAt)
    return docs
  },
})

export const listWithAssetPreviews = query({
  args: {
    status: v.optional(docStatusValidator),
    type: v.optional(docTypeValidator),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    let docs = await ctx.db.query("documents").take(500)
    if (args.status) docs = docs.filter((d) => d.status === args.status)
    if (args.type) docs = docs.filter((d) => d.type === args.type)
    if (args.search) {
      const needle = args.search.toLowerCase()
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(needle) ||
          d.namingCode.toLowerCase().includes(needle),
      )
    }
    docs.sort((a, b) => b.updatedAt - a.updatedAt)

    const docAssets = await ctx.db.query("documentAssets").take(2000)
    const assetIds = Array.from(new Set(docAssets.map((da) => da.assetId)))
    const assets = await Promise.all(assetIds.map((id) => ctx.db.get(id)))
    const byAssetId = new Map<string, Doc<"assets">>()
    for (const a of assets) if (a) byAssetId.set(a._id, a)

    const assetsByDoc: Record<
      string,
      Array<{ id: string; code: string; name: string }>
    > = {}
    for (const da of docAssets) {
      const a = byAssetId.get(da.assetId)
      if (!a) continue
      const list = assetsByDoc[da.documentId] ?? []
      list.push({ id: a._id, code: a.code, name: a.name })
      assetsByDoc[da.documentId] = list
    }
    for (const k of Object.keys(assetsByDoc)) {
      assetsByDoc[k].sort((x, y) => x.code.localeCompare(y.code))
    }

    return { docs, assetsByDoc }
  },
})

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    return await ctx.db.get(args.id)
  },
})

export const getWithAssets = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const doc = await ctx.db.get(args.id)
    if (!doc) return null
    const links = await ctx.db
      .query("documentAssets")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.id))
      .take(500)
    const assets = (
      await Promise.all(links.map((l) => ctx.db.get(l.assetId)))
    ).filter((a): a is Doc<"assets"> => a !== null)
    assets.sort((a, b) => a.code.localeCompare(b.code))
    return { doc, assets }
  },
})

export const getCurrentVersion = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const doc = await ctx.db.get(args.documentId)
    if (!doc) return null
    if (doc.currentVersion < 1) return null
    return await ctx.db
      .query("documentVersions")
      .withIndex("by_documentId_and_version", (q) =>
        q.eq("documentId", args.documentId).eq("version", doc.currentVersion),
      )
      .unique()
  },
})

export const listVersions = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_documentId_and_version", (q) =>
        q.eq("documentId", args.documentId),
      )
      .take(500)
    versions.sort((a, b) => b.version - a.version)
    return versions
  },
})

export const listForAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const links = await ctx.db
      .query("documentAssets")
      .withIndex("by_assetId", (q) => q.eq("assetId", args.assetId))
      .take(500)
    const docs = (
      await Promise.all(links.map((l) => ctx.db.get(l.documentId)))
    ).filter((d): d is Doc<"documents"> => d !== null)
    docs.sort((a, b) => a.title.localeCompare(b.title))
    return docs
  },
})

const chunkInputValidator = v.array(
  v.object({
    text: v.string(),
    section: v.union(v.string(), v.null()),
  }),
)

const docTypeArg = v.union(
  v.literal("sop"),
  v.literal("manual"),
  v.literal("work_instruction"),
  v.literal("lmra"),
)
const docStatusArg = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("published"),
  v.literal("archived"),
)

async function ensureUniqueNamingCode(
  ctx: import("./_generated/server").MutationCtx,
  namingCode: string,
  ignoreId?: Id<"documents">,
) {
  const existing = await ctx.db
    .query("documents")
    .withIndex("by_namingCode", (q) => q.eq("namingCode", namingCode))
    .unique()
  if (existing && existing._id !== ignoreId) {
    throw new Error(`Naming code ${namingCode} is already in use.`)
  }
}

export const create = mutation({
  args: {
    namingCode: v.string(),
    title: v.string(),
    type: docTypeArg,
    tags: v.array(v.string()),
    assetIds: v.array(v.id("assets")),
    body: v.any(),
    chunks: chunkInputValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    await ensureUniqueNamingCode(ctx, args.namingCode)

    const now = Date.now()
    const docId = await ctx.db.insert("documents", {
      namingCode: args.namingCode,
      title: args.title.trim(),
      type: args.type,
      status: "draft",
      currentVersion: 1,
      ownerId: userId,
      tags: args.tags,
      updatedAt: now,
    })

    await ctx.db.insert("documentVersions", {
      documentId: docId,
      version: 1,
      bodyKind: "tiptap",
      bodyJson: args.body,
      pdfStorageId: null,
      publishedAt: now,
    })

    for (const [i, c] of args.chunks.entries()) {
      await ctx.db.insert("chunks", {
        documentId: docId,
        version: 1,
        seq: i + 1,
        text: c.text,
        pageOrSection: c.section,
        embedding: null,
        embeddingModel: null,
      })
    }

    for (const aid of args.assetIds) {
      await ctx.db.insert("documentAssets", {
        documentId: docId,
        assetId: aid,
      })
    }

    await ctx.scheduler.runAfter(0, internal.ai.embed.embedMissingInternal, {
      documentId: docId,
    })

    return docId
  },
})

export const savePublish = mutation({
  args: {
    id: v.id("documents"),
    namingCode: v.string(),
    title: v.string(),
    type: docTypeArg,
    status: docStatusArg,
    tags: v.array(v.string()),
    assetIds: v.array(v.id("assets")),
    body: v.any(),
    chunks: chunkInputValidator,
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const doc = await ctx.db.get(args.id)
    if (!doc) throw new Error("Document not found")
    if (args.namingCode !== doc.namingCode) {
      await ensureUniqueNamingCode(ctx, args.namingCode, args.id)
    }

    const now = Date.now()
    const nextVersion = doc.currentVersion + 1

    await ctx.db.patch(args.id, {
      namingCode: args.namingCode,
      title: args.title.trim(),
      type: args.type,
      status: args.status,
      tags: args.tags,
      currentVersion: nextVersion,
      updatedAt: now,
    })

    await ctx.db.insert("documentVersions", {
      documentId: args.id,
      version: nextVersion,
      bodyKind: "tiptap",
      bodyJson: args.body,
      pdfStorageId: null,
      publishedAt: now,
    })

    for (const [i, c] of args.chunks.entries()) {
      await ctx.db.insert("chunks", {
        documentId: args.id,
        version: nextVersion,
        seq: i + 1,
        text: c.text,
        pageOrSection: c.section,
        embedding: null,
        embeddingModel: null,
      })
    }

    const existingLinks = await ctx.db
      .query("documentAssets")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.id))
      .take(500)
    const existingAssetIds = new Set(existingLinks.map((l) => l.assetId))
    const wantedAssetIds = new Set(args.assetIds)

    for (const link of existingLinks) {
      if (!wantedAssetIds.has(link.assetId)) {
        await ctx.db.delete(link._id)
      }
    }
    for (const aid of args.assetIds) {
      if (!existingAssetIds.has(aid)) {
        await ctx.db.insert("documentAssets", {
          documentId: args.id,
          assetId: aid,
        })
      }
    }

    await ctx.scheduler.runAfter(0, internal.ai.embed.embedMissingInternal, {
      documentId: args.id,
    })

    return { version: nextVersion }
  },
})

export const attachPdf = mutation({
  args: {
    namingCode: v.string(),
    title: v.string(),
    type: docTypeArg,
    tags: v.array(v.string()),
    assetIds: v.array(v.id("assets")),
    storageId: v.id("_storage"),
    chunks: chunkInputValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    await ensureUniqueNamingCode(ctx, args.namingCode)

    const now = Date.now()
    const docId = await ctx.db.insert("documents", {
      namingCode: args.namingCode,
      title: args.title.trim(),
      type: args.type,
      status: "draft",
      currentVersion: 1,
      ownerId: userId,
      tags: args.tags,
      updatedAt: now,
    })

    await ctx.db.insert("documentVersions", {
      documentId: docId,
      version: 1,
      bodyKind: "pdf",
      bodyJson: null,
      pdfStorageId: args.storageId,
      publishedAt: now,
    })

    for (const [i, c] of args.chunks.entries()) {
      await ctx.db.insert("chunks", {
        documentId: docId,
        version: 1,
        seq: i + 1,
        text: c.text,
        pageOrSection: c.section,
        embedding: null,
        embeddingModel: null,
      })
    }

    for (const aid of args.assetIds) {
      await ctx.db.insert("documentAssets", {
        documentId: docId,
        assetId: aid,
      })
    }

    await ctx.scheduler.runAfter(0, internal.ai.embed.embedMissingInternal, {
      documentId: docId,
    })

    return docId
  },
})

export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const doc = await ctx.db.get(args.id)
    if (!doc) throw new Error("Document not found")
    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    })
  },
})
