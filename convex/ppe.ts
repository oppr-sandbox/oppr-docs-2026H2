import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { requireUser, requireUserId } from "./lib/auth"

// Factory PPE catalog (20). The first eight slugs match the original hardcoded
// PPE node ids so documents authored before the configurator keep rendering.
export const FACTORY_PPE = [
  { slug: "hardhat", label: "Hard hat", pictogramId: "hard_hat", description: "Protects the head from falling objects and impacts." },
  { slug: "glasses", label: "Safety glasses", pictogramId: "eye_protection", description: "Eye protection from dust, splashes and debris." },
  { slug: "gloves", label: "Gloves", pictogramId: "gloves", description: "Hand protection against cuts, abrasion and contaminants." },
  { slug: "boots", label: "Safety boots", pictogramId: "footwear", description: "Steel-toe with anti-slip soles. Required on the floor." },
  { slug: "hi-vis", label: "Hi-vis vest", pictogramId: "hi_vis", description: "Required wherever forklifts or vehicles operate." },
  { slug: "ear-pro", label: "Ear protection", pictogramId: "hearing", description: "Required in zones above 85 dB(A)." },
  { slug: "mask", label: "Respirator", pictogramId: "respirator", description: "Particulate/vapour filtration as specified per task." },
  { slug: "dust-mask", label: "Dust mask", pictogramId: "face_mask", description: "Disposable mask for non-toxic particulates." },
  { slug: "clothing", label: "Protective clothing", pictogramId: "protective_clothing", description: "Body-covering protective clothing for the task." },
  { slug: "wash-hands", label: "Wash your hands", pictogramId: "wash_hands", description: "Hand hygiene required before and after the task." },
  { slug: "face-shield", label: "Face shield", pictogramId: "face_shield", description: "Full-face protection against splashes and sparks." },
  { slug: "harness", label: "Safety harness", pictogramId: "harness", description: "Fall-arrest harness for work at height." },
  { slug: "read-first", label: "Read the instructions", pictogramId: "read_instructions", description: "Read the procedure before starting." },
  { slug: "handrail", label: "Use the handrail", pictogramId: "handrail", description: "Hold the handrail on stairs and platforms." },
  { slug: "hair-net", label: "Hair net", pictogramId: "hair_net", description: "Contain hair in food or clean areas." },
  { slug: "gas-detector", label: "Use gas detector", pictogramId: "gas_detector", description: "Carry a personal gas detector in this zone." },
  { slug: "life-jacket", label: "Life jacket", pictogramId: "life_jacket", description: "Required near open water." },
  { slug: "lab-coat", label: "Lab coat", pictogramId: "lab_coat", description: "Wear a lab coat in the laboratory." },
  { slug: "eye-ear", label: "Eye + ear protection", pictogramId: "eye_ear", description: "Both eye and hearing protection required." },
  { slug: "general", label: "General mandatory action", pictogramId: "general_mandatory", description: "A mandatory action applies — see local signage." },
] as const

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    const rows = await ctx.db.query("ppeItems").take(200)
    rows.sort((a, b) => a.sortOrder - b.sortOrder)
    return rows
  },
})

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    const existing = await ctx.db.query("ppeItems").take(1)
    if (existing.length > 0) return { ok: true, seeded: false }
    for (let i = 0; i < FACTORY_PPE.length; i++) {
      const p = FACTORY_PPE[i]
      await ctx.db.insert("ppeItems", {
        slug: p.slug,
        label: p.label,
        description: p.description,
        pictogramId: p.pictogramId,
        active: true,
        builtIn: true,
        sortOrder: i,
      })
    }
    return { ok: true, seeded: true }
  },
})

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const add = mutation({
  args: {
    label: v.string(),
    description: v.optional(v.string()),
    pictogramId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const label = args.label.trim()
    if (!label) throw new Error("Label is required")
    let slug = slugify(label)
    if (!slug) throw new Error("Label must contain letters or numbers")
    const clash = await ctx.db
      .query("ppeItems")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique()
    if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    const all = await ctx.db.query("ppeItems").take(200)
    const maxOrder = all.reduce((m, p) => Math.max(m, p.sortOrder), -1)
    return await ctx.db.insert("ppeItems", {
      slug,
      label,
      description: args.description?.trim() || null,
      pictogramId: args.pictogramId,
      active: true,
      builtIn: false,
      sortOrder: maxOrder + 1,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("ppeItems"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    pictogramId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const row = await ctx.db.get(args.id)
    if (!row) throw new Error("PPE item not found")
    const patch: Record<string, unknown> = {}
    if (args.label !== undefined && args.label.trim()) patch.label = args.label.trim()
    if (args.description !== undefined)
      patch.description = args.description.trim() || null
    if (args.pictogramId !== undefined) patch.pictogramId = args.pictogramId
    await ctx.db.patch(args.id, patch)
  },
})

export const setActive = mutation({
  args: { id: v.id("ppeItems"), active: v.boolean() },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const row = await ctx.db.get(args.id)
    if (!row) throw new Error("PPE item not found")
    await ctx.db.patch(args.id, { active: args.active })
  },
})

export const remove = mutation({
  args: { id: v.id("ppeItems") },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const row = await ctx.db.get(args.id)
    if (!row) throw new Error("PPE item not found")
    if (row.builtIn)
      throw new Error("Built-in PPE can't be deleted — deactivate it instead")
    await ctx.db.delete(args.id)
  },
})
