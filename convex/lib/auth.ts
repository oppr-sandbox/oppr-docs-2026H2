import { getAuthUserId } from "@convex-dev/auth/server"
import { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server"
import { Id } from "../_generated/dataModel"

type AnyCtx = QueryCtx | MutationCtx | ActionCtx

export async function requireUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }
  return identity
}

export async function requireUserId(ctx: AnyCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new Error("Not authenticated")
  }
  return userId
}
