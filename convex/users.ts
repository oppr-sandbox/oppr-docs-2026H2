import { query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireUser } from "./lib/auth"

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    return await ctx.db.get(userId)
  },
})

// All users who have signed in. Backs the reviewer / approver pickers. For the
// single-user showcase this is usually just you, which is fine — you can be
// author, reviewer, and approver.
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    const users = await ctx.db.query("users").take(200)
    return users.map((u) => ({
      id: u._id,
      name: u.name ?? null,
      email: u.email ?? null,
    }))
  },
})
