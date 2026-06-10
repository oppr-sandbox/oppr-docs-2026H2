import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser, requireUserId } from "./lib/auth"

// Single-row settings for the PDF export cover/header/footer. `get` returns
// the row (with the logo resolved to a fetchable URL so the export path can
// inline it as a data URL) or null when nothing has been configured yet.

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    const row = await ctx.db.query("coverSettings").first()
    if (!row) return null
    let logoUrl: string | null = null
    if (row.logoImageId) {
      const img = await ctx.db.get(row.logoImageId)
      if (img) {
        logoUrl =
          img.source === "url"
            ? img.externalUrl
            : img.storageId
              ? await ctx.storage.getUrl(img.storageId)
              : null
      }
    }
    return { ...row, logoUrl }
  },
})

export const upsert = mutation({
  args: {
    companyName: v.union(v.string(), v.null()),
    headerText: v.union(v.string(), v.null()),
    footerText: v.union(v.string(), v.null()),
    titleSize: v.union(v.literal("sm"), v.literal("md"), v.literal("lg")),
    logoImageId: v.union(v.id("images"), v.null()),
    showPageNumbers: v.boolean(),
    confidentialityLabel: v.union(v.string(), v.null()),
    defaultWatermark: v.union(
      v.literal("none"),
      v.literal("controlled"),
      v.literal("draft"),
      v.literal("review"),
      v.null(),
    ),
    accentColor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const row = { ...args, updatedAt: Date.now() }
    const existing = await ctx.db.query("coverSettings").first()
    if (existing) {
      await ctx.db.patch(existing._id, row)
      return existing._id
    }
    return await ctx.db.insert("coverSettings", row)
  },
})
