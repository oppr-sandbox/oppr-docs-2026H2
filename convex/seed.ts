import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { requireUser } from "./lib/auth"

export const status = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    const meta = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", "seedVersion"))
      .unique()
    const docCount = (await ctx.db.query("documents").take(1)).length
    const assetCount = (await ctx.db.query("assets").take(1)).length
    return {
      seedVersion: meta ? Number(meta.value) : null,
      hasDocs: docCount > 0,
      hasAssets: assetCount > 0,
    }
  },
})

export const seedDemoData = mutation({
  args: {
    payload: v.object({
      version: v.number(),
      site: v.string(),
      updatedAt: v.number(),
      publishedAt: v.number(),
      assets: v.array(
        v.object({
          code: v.string(),
          name: v.string(),
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
      logs: v.array(
        v.object({
          name: v.string(),
          type: v.string(),
        }),
      ),
      documents: v.array(
        v.object({
          namingCode: v.string(),
          title: v.string(),
          type: v.union(
            v.literal("sop"),
            v.literal("manual"),
            v.literal("work_instruction"),
            v.literal("lmra"),
          ),
          status: v.union(
            v.literal("draft"),
            v.literal("in_review"),
            v.literal("published"),
            v.literal("archived"),
          ),
          tags: v.array(v.string()),
          bodyJson: v.any(),
          assetCodes: v.array(v.string()),
          chunks: v.array(
            v.object({
              seq: v.number(),
              text: v.string(),
              pageOrSection: v.union(v.string(), v.null()),
            }),
          ),
        }),
      ),
      documentLogRefs: v.array(
        v.object({
          documentNamingCode: v.string(),
          logName: v.string(),
          anchorId: v.string(),
        }),
      ),
    }),
  },
  handler: async (ctx, { payload }) => {
    await requireUser(ctx)

    const meta = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", "seedVersion"))
      .unique()
    const stored = meta ? Number(meta.value) : 0
    if (stored >= payload.version) {
      return { skipped: true, currentVersion: stored }
    }

    const assetIdByCode = new Map<string, Id<"assets">>()
    for (const a of payload.assets) {
      const id = await ctx.db.insert("assets", {
        code: a.code,
        name: a.name,
        site: payload.site,
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
      assetIdByCode.set(a.code, id)
      for (const log of a.logs) {
        await ctx.db.insert("assetLogs", {
          assetId: id,
          code: log.code,
          name: log.name,
          description: log.description,
        })
      }
    }

    const logIdByName = new Map<string, Id<"logs">>()
    for (const l of payload.logs) {
      const id = await ctx.db.insert("logs", { name: l.name, type: l.type })
      logIdByName.set(l.name, id)
    }

    const docIdByCode = new Map<string, Id<"documents">>()
    for (const d of payload.documents) {
      const docId = await ctx.db.insert("documents", {
        namingCode: d.namingCode,
        title: d.title,
        type: d.type,
        status: d.status,
        currentVersion: 1,
        ownerId: null,
        tags: d.tags,
        updatedAt: payload.updatedAt,
      })
      docIdByCode.set(d.namingCode, docId)

      await ctx.db.insert("documentVersions", {
        documentId: docId,
        version: 1,
        bodyKind: "tiptap",
        bodyJson: d.bodyJson,
        pdfStorageId: null,
        publishedAt: payload.publishedAt,
      })

      for (const code of d.assetCodes) {
        const aid = assetIdByCode.get(code)
        if (!aid) continue
        await ctx.db.insert("documentAssets", {
          documentId: docId,
          assetId: aid,
        })
      }

      for (const c of d.chunks) {
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
    }

    for (const r of payload.documentLogRefs) {
      const docId = docIdByCode.get(r.documentNamingCode)
      const logId = logIdByName.get(r.logName)
      if (!docId || !logId) continue
      await ctx.db.insert("documentLogRefs", {
        documentId: docId,
        version: 1,
        logId,
        anchorId: r.anchorId,
      })
    }

    if (meta) {
      await ctx.db.patch(meta._id, { value: String(payload.version) })
    } else {
      await ctx.db.insert("meta", {
        key: "seedVersion",
        value: String(payload.version),
      })
    }

    return {
      ok: true,
      counts: {
        assets: payload.assets.length,
        documents: payload.documents.length,
        logs: payload.logs.length,
      },
    }
  },
})
