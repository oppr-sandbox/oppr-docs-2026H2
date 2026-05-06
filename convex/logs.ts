import { v } from "convex/values"
import { query } from "./_generated/server"
import { requireUser } from "./lib/auth"

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    const logs = await ctx.db.query("logs").take(500)
    logs.sort((a, b) => a.name.localeCompare(b.name))
    return logs
  },
})

export const get = query({
  args: { id: v.id("logs") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    return await ctx.db.get(args.id)
  },
})
