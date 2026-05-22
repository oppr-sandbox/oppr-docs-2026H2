import { mutation } from "./_generated/server"

// One-off insertion of sample Site Assets. Idempotent on asset code. No auth
// requirement so it can be run from the CLI
// (`npx convex run seedAssets:addSampleAssets`). Mirrors the defaults used by
// assets.create.

const SAMPLE = [
  {
    code: "KLN-401",
    name: "Calcination kiln 4",
    description: "Rotary calcination kiln on line 4.",
  },
  {
    code: "CNV-210",
    name: "Feed conveyor 210",
    description: "Belt conveyor feeding the kiln charge.",
  },
  {
    code: "BGF-510",
    name: "Baghouse filter 510",
    description: "Dust-collection baghouse on the kiln exhaust.",
  },
]

export const addSampleAssets = mutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []
    for (const a of SAMPLE) {
      const existing = await ctx.db
        .query("assets")
        .withIndex("by_code", (q) => q.eq("code", a.code))
        .unique()
      if (existing) {
        skipped.push(a.code)
        continue
      }
      await ctx.db.insert("assets", {
        code: a.code,
        name: a.name,
        site: "HOL",
        location: null,
        qrToken: `qr-${a.code.toLowerCase()}`,
        description: a.description,
        level: 1,
        floorplan: null,
        isLinked: false,
        linkedLogCode: null,
        linkedLogName: null,
        linkedLogDescription: null,
        pinNumber: null,
        pinX: null,
        pinY: null,
        imageStorageId: null,
      })
      created.push(a.code)
    }
    return { created, skipped }
  },
})
