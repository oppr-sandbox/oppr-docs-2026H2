import { v } from "convex/values"
import { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server"
import { requireUser, requireUserId } from "./lib/auth"
import { walkBodyDiagrams, walkBodyImages } from "./lib/imageWalker"

const sourceValidator = v.union(v.literal("upload"), v.literal("url"))

type ImageDocRef = {
  documentId: Id<"documents">
  namingCode: string
  title: string
  status: Doc<"documents">["status"]
}

async function attachUsageRefs(
  ctx: QueryCtx,
  images: Doc<"images">[],
): Promise<
  Array<
    Doc<"images"> & { usageCount: number; documentRefs: ImageDocRef[] }
  >
> {
  const refs = await Promise.all(
    images.map(async (img) => {
      const usages = await ctx.db
        .query("imageUsages")
        .withIndex("by_imageId", (q) => q.eq("imageId", img._id))
        .collect()
      const seen = new Set<string>()
      const out: ImageDocRef[] = []
      for (const u of usages) {
        const key = String(u.documentId)
        if (seen.has(key)) continue
        seen.add(key)
        const doc = await ctx.db.get(u.documentId)
        if (!doc) continue
        out.push({
          documentId: doc._id,
          namingCode: doc.namingCode,
          title: doc.title,
          status: doc.status,
        })
      }
      out.sort((a, b) => a.namingCode.localeCompare(b.namingCode))
      return out
    }),
  )
  return images.map((img, i) => ({
    ...img,
    usageCount: refs[i].length,
    documentRefs: refs[i],
  }))
}

export const list = query({
  args: {
    source: v.optional(sourceValidator),
    onlyOrphans: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    let rows = await ctx.db.query("images").take(1000)
    if (args.source) rows = rows.filter((r) => r.source === args.source)
    if (args.search) {
      const q = args.search.trim().toLowerCase()
      rows = rows.filter(
        (r) =>
          r.filename.toLowerCase().includes(q) ||
          r.altText.toLowerCase().includes(q),
      )
    }
    rows.sort((a, b) => b.createdAt - a.createdAt)
    const withRefs = await attachUsageRefs(ctx, rows)
    return args.onlyOrphans
      ? withRefs.filter((r) => r.usageCount === 0)
      : withRefs
  },
})

export const get = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const img = await ctx.db.get(args.id)
    if (!img) return null
    const usages = await ctx.db
      .query("imageUsages")
      .withIndex("by_imageId", (q) => q.eq("imageId", args.id))
      .collect()
    const docs = await Promise.all(
      usages.map(async (u) => {
        const doc = await ctx.db.get(u.documentId)
        return doc ? { usage: u, doc } : null
      }),
    )
    return {
      image: img,
      uploader: img.uploadedBy ? await ctx.db.get(img.uploadedBy) : null,
      usages: docs
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .map((d) => ({
          documentId: d.doc._id,
          namingCode: d.doc.namingCode,
          title: d.doc.title,
          status: d.doc.status,
          version: d.usage.documentVersion,
          context: d.usage.context,
        })),
    }
  },
})

export const urlFor = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const img = await ctx.db.get(args.id)
    if (!img) return null
    if (img.source === "url") return img.externalUrl
    if (img.storageId) return await ctx.storage.getUrl(img.storageId)
    return null
  },
})

export const urlsFor = query({
  args: { ids: v.array(v.id("images")) },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const result: Record<string, string | null> = {}
    for (const id of args.ids) {
      const img = await ctx.db.get(id)
      if (!img) {
        result[id] = null
        continue
      }
      if (img.source === "url") {
        result[id] = img.externalUrl
        continue
      }
      result[id] = img.storageId ? await ctx.storage.getUrl(img.storageId) : null
    }
    return result
  },
})

// Walks each document's current-version tiptap body for diagram nodes. The
// diagram SVG is cached in the node attrs (rendered by renderDiagramSvg, the
// app's trust boundary) so no re-rendering is needed here. Background images
// are referenced inside the SVG by their storage URL, so the SVG is
// self-contained; backgroundUrl is surfaced separately for the UI.
export const listDiagrams = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    const docs = await ctx.db.query("documents").take(500)
    const out: Array<{
      key: string
      svg: string
      caption: string
      backgroundUrl: string | null
      documentId: Id<"documents">
      namingCode: string
      title: string
      status: Doc<"documents">["status"]
    }> = []
    for (const doc of docs) {
      const ver = await ctx.db
        .query("documentVersions")
        .withIndex("by_documentId_and_version", (q) =>
          q.eq("documentId", doc._id).eq("version", doc.currentVersion),
        )
        .first()
      if (!ver || ver.bodyKind !== "tiptap" || !ver.bodyJson) continue
      const refs = walkBodyDiagrams(ver.bodyJson)
      refs.forEach((d, i) => {
        out.push({
          key: `${doc._id}:${i}`,
          svg: d.svg,
          caption: d.caption,
          backgroundUrl: d.backgroundUrl,
          documentId: doc._id,
          namingCode: doc.namingCode,
          title: doc.title,
          status: doc.status,
        })
      })
    }
    out.sort(
      (a, b) =>
        a.namingCode.localeCompare(b.namingCode) || a.key.localeCompare(b.key),
    )
    return out
  },
})

export const createFromUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    byteSize: v.number(),
    width: v.union(v.number(), v.null()),
    height: v.union(v.number(), v.null()),
    sha256: v.string(),
    altText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)

    const existing = await ctx.db
      .query("images")
      .withIndex("by_sha256", (q) => q.eq("sha256", args.sha256))
      .first()
    if (existing) {
      // De-dup: drop the duplicate upload, keep the existing record.
      await ctx.storage.delete(args.storageId)
      const url = existing.storageId
        ? await ctx.storage.getUrl(existing.storageId)
        : null
      return { id: existing._id, deduped: true as const, url }
    }

    const id = await ctx.db.insert("images", {
      source: "upload",
      storageId: args.storageId,
      externalUrl: null,
      filename: args.filename,
      contentType: args.contentType,
      byteSize: args.byteSize,
      width: args.width,
      height: args.height,
      sha256: args.sha256,
      altText: args.altText,
      uploadedBy: userId,
      createdAt: Date.now(),
    })
    const url = await ctx.storage.getUrl(args.storageId)
    return { id, deduped: false as const, url }
  },
})

export const createFromUrl = mutation({
  args: {
    externalUrl: v.string(),
    filename: v.string(),
    contentType: v.string(),
    altText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const id = await ctx.db.insert("images", {
      source: "url",
      storageId: null,
      externalUrl: args.externalUrl,
      filename: args.filename,
      contentType: args.contentType,
      byteSize: null,
      width: null,
      height: null,
      sha256: null,
      altText: args.altText,
      uploadedBy: userId,
      createdAt: Date.now(),
    })
    return { id, url: args.externalUrl }
  },
})

export const updateAttrs = mutation({
  args: {
    id: v.id("images"),
    filename: v.optional(v.string()),
    altText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const img = await ctx.db.get(args.id)
    if (!img) throw new Error("Image not found")
    const patch: Partial<Doc<"images">> = {}
    if (args.filename !== undefined) patch.filename = args.filename
    if (args.altText !== undefined) patch.altText = args.altText
    if (Object.keys(patch).length > 0) await ctx.db.patch(args.id, patch)
  },
})

export const replace = mutation({
  args: {
    id: v.id("images"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    byteSize: v.number(),
    width: v.union(v.number(), v.null()),
    height: v.union(v.number(), v.null()),
    sha256: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const img = await ctx.db.get(args.id)
    if (!img) throw new Error("Image not found")

    const collision = await ctx.db
      .query("images")
      .withIndex("by_sha256", (q) => q.eq("sha256", args.sha256))
      .first()
    if (collision && collision._id !== args.id) {
      await ctx.storage.delete(args.storageId)
      throw new Error(
        `That content already exists as image ${collision._id}. Use that image instead.`,
      )
    }

    const oldStorage = img.storageId
    await ctx.db.patch(args.id, {
      source: "upload",
      storageId: args.storageId,
      externalUrl: null,
      filename: args.filename,
      contentType: args.contentType,
      byteSize: args.byteSize,
      width: args.width,
      height: args.height,
      sha256: args.sha256,
    })
    if (oldStorage) await ctx.storage.delete(oldStorage)
  },
})

export const remove = mutation({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const img = await ctx.db.get(args.id)
    if (!img) return
    const usages = await ctx.db
      .query("imageUsages")
      .withIndex("by_imageId", (q) => q.eq("imageId", args.id))
      .collect()
    if (usages.length > 0) {
      throw new Error(
        `Cannot delete: image is used in ${usages.length} document${
          usages.length === 1 ? "" : "s"
        }.`,
      )
    }
    if (img.storageId) await ctx.storage.delete(img.storageId)
    await ctx.db.delete(args.id)
  },
})

export const removeMany = mutation({
  args: { ids: v.array(v.id("images")) },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const ok: Id<"images">[] = []
    const refused: Array<{ id: Id<"images">; reason: string }> = []
    for (const id of args.ids) {
      const img = await ctx.db.get(id)
      if (!img) {
        refused.push({ id, reason: "not found" })
        continue
      }
      const usages = await ctx.db
        .query("imageUsages")
        .withIndex("by_imageId", (q) => q.eq("imageId", id))
        .collect()
      if (usages.length > 0) {
        refused.push({
          id,
          reason: `used in ${usages.length} document${usages.length === 1 ? "" : "s"}`,
        })
        continue
      }
      if (img.storageId) await ctx.storage.delete(img.storageId)
      await ctx.db.delete(id)
      ok.push(id)
    }
    return { ok, refused }
  },
})

// Internal helper called from documents.savePublish + create. Diffs the
// imageUsages rows for a given (documentId, version) against the image refs
// found in the body. Inserts missing rows; deletes stale ones. For external
// URLs that lack a data-image-id we synthesise an `images` row on the fly so
// the repo can still see them.
export const recomputeUsagesForVersion = internalMutation({
  args: {
    documentId: v.id("documents"),
    documentVersion: v.number(),
    body: v.any(),
  },
  handler: async (ctx, args) => {
    const refs = walkBodyImages(args.body)

    const resolvedIds: Id<"images">[] = []
    for (const ref of refs) {
      if (ref.imageId) {
        // Validate the imageId still exists; skip if it's stale.
        const exists = await ctx.db.get(ref.imageId as Id<"images">)
        if (exists) resolvedIds.push(ref.imageId as Id<"images">)
        continue
      }
      if (ref.externalUrl) {
        // Legacy / url-source. Either find an existing url-source row by
        // exact externalUrl or create one.
        const existing = await ctx.db
          .query("images")
          .filter((q) =>
            q.and(
              q.eq(q.field("source"), "url"),
              q.eq(q.field("externalUrl"), ref.externalUrl),
            ),
          )
          .first()
        if (existing) {
          resolvedIds.push(existing._id)
        } else {
          const filename = filenameFromUrl(ref.externalUrl)
          const id = await ctx.db.insert("images", {
            source: "url",
            storageId: null,
            externalUrl: ref.externalUrl,
            filename,
            contentType: contentTypeFromFilename(filename),
            byteSize: null,
            width: null,
            height: null,
            sha256: null,
            altText: ref.altText,
            uploadedBy: null,
            createdAt: Date.now(),
          })
          resolvedIds.push(id)
        }
      }
    }

    const existingUsages = await ctx.db
      .query("imageUsages")
      .withIndex("by_documentId_and_version", (q) =>
        q
          .eq("documentId", args.documentId)
          .eq("documentVersion", args.documentVersion),
      )
      .collect()
    const existingByImageId = new Map<string, Doc<"imageUsages">>()
    for (const u of existingUsages) existingByImageId.set(u.imageId, u)

    const desired = new Set<string>(resolvedIds)
    for (const u of existingUsages) {
      if (!desired.has(u.imageId)) await ctx.db.delete(u._id)
    }
    for (const imageId of resolvedIds) {
      if (!existingByImageId.has(imageId)) {
        await ctx.db.insert("imageUsages", {
          imageId,
          documentId: args.documentId,
          documentVersion: args.documentVersion,
          context: "body",
          createdAt: Date.now(),
        })
      }
    }
  },
})

function filenameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split("/").pop()
    if (last && last.includes(".")) return last
    return u.hostname + u.pathname
  } catch {
    return url.slice(0, 60)
  }
}

function contentTypeFromFilename(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? ""
  if (ext === "png") return "image/png"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "gif") return "image/gif"
  if (ext === "webp") return "image/webp"
  if (ext === "svg") return "image/svg+xml"
  return "application/octet-stream"
}
