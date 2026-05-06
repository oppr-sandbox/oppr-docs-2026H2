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
