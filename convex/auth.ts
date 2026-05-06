import Resend from "@auth/core/providers/resend"
import { convexAuth } from "@convex-dev/auth/server"

const ALLOWED_DOMAIN = "oppr.ai"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL ?? "Oppr DOCS <onboarding@resend.dev>",
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const email = args.profile.email?.toLowerCase()
      if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        throw new Error("InvalidAccountId")
      }

      if (args.existingUserId) {
        return args.existingUserId
      }

      return await ctx.db.insert("users", {
        email,
        name: args.profile.name as string | undefined,
        image: args.profile.image as string | undefined,
        emailVerificationTime:
          args.type === "verification" ? Date.now() : undefined,
      })
    },
  },
})
