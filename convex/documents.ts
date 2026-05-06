import { query } from "./_generated/server"
import { v } from "convex/values"
import { Doc } from "./_generated/dataModel"
import { requireUser } from "./lib/auth"

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
