import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUserId } from "./lib/auth"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    return await ctx.storage.getUrl(args.storageId)
  },
})

// Batch-resolve signed URLs for several storage ids. Returns a map keyed by
// the input id string. Used by the PDF export to fetch embedded PDF bytes.
export const getUrls = query({
  args: { ids: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const out: Record<string, string | null> = {}
    for (const id of args.ids) {
      out[id] = await ctx.storage.getUrl(id)
    }
    return out
  },
})
