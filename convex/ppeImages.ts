// Seeds real ISO 7010 mandatory-sign pictograms into Convex storage and links
// them to the ppeItems catalog. The artwork is the public standard set (clean,
// text-free, blue-disc/white-symbol), fetched once per deployment from the
// Wikimedia thumbnail renderer. Slugs without an ISO code keep their bundled
// SVG fallback. Internal-only: run from the CLI with
//   npx convex run ppeImages:seedPictograms
// (add '{"force":true}' to re-fetch rows that already have an image).

import { internalAction, internalMutation, internalQuery } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import { FACTORY_PPE, PPE_MCODE } from "./ppe"

// Wikimedia requires a descriptive User-Agent or it serves 429 (robot policy).
const UA = "OpprDocs/1.0 (https://oppr.ai; contact floris@oppr.ai)"

function fileUrl(mCode: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/ISO_7010_${mCode}.svg?width=512`
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchPng(url: string): Promise<Blob | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/png" } })
    if (res.ok) {
      const blob = await res.blob()
      return blob.size > 0 ? blob : null
    }
    if (res.status === 429) {
      await sleep(1500 * (attempt + 1))
      continue
    }
    return null // 404 etc. — leave the SVG fallback in place
  }
  return null
}

export const _catalog = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("ppeItems").take(200)
    return rows.map((r) => ({ id: r._id, slug: r.slug, storageId: r.storageId ?? null }))
  },
})

export const _setStorage = internalMutation({
  args: { id: v.id("ppeItems"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { storageId: args.storageId })
  },
})

// Seed the factory catalog when empty. Mirrors ppe.seedIfEmpty but is internal
// (no auth) so the image seeder can run standalone from the CLI.
export const _ensureSeeded = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("ppeItems").take(1)
    if (existing.length > 0) return { seeded: false }
    for (let i = 0; i < FACTORY_PPE.length; i++) {
      const p = FACTORY_PPE[i]
      await ctx.db.insert("ppeItems", {
        slug: p.slug,
        label: p.label,
        labelEn: p.label,
        labelNl: p.labelNl,
        description: p.description,
        descriptionNl: p.descriptionNl,
        pictogramId: p.pictogramId,
        storageId: null,
        active: true,
        builtIn: true,
        sortOrder: i,
      })
    }
    return { seeded: true }
  },
})

// Backfill bilingual copy on built-in rows seeded before labelNl/descriptionNl
// existed. Only fills empty fields — never clobbers an author's edits.
export const _backfillI18n = internalMutation({
  args: {},
  handler: async (ctx) => {
    let patched = 0
    for (const p of FACTORY_PPE) {
      const row = await ctx.db
        .query("ppeItems")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .unique()
      if (!row) continue
      const patch: Record<string, unknown> = {}
      if (!row.labelEn) patch.labelEn = p.label
      if (!row.labelNl) patch.labelNl = p.labelNl
      if (!row.descriptionNl) patch.descriptionNl = p.descriptionNl
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(row._id, patch)
        patched++
      }
    }
    return { patched }
  },
})

export const seedPictograms = internalAction({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const force = args.force ?? false
    await ctx.runMutation(internal.ppeImages._ensureSeeded, {})
    const rows = await ctx.runQuery(internal.ppeImages._catalog, {})
    const result = { stored: 0, skipped: 0, failed: [] as string[] }
    for (const row of rows) {
      const mCode = PPE_MCODE[row.slug]
      if (!mCode) {
        result.skipped++
        continue
      }
      if (row.storageId && !force) {
        result.skipped++
        continue
      }
      const blob = await fetchPng(fileUrl(mCode))
      await sleep(600) // be polite to the thumbnail renderer
      if (!blob) {
        result.failed.push(`${row.slug} (${mCode})`)
        continue
      }
      const storageId = await ctx.storage.store(blob)
      await ctx.runMutation(internal.ppeImages._setStorage, { id: row.id, storageId })
      result.stored++
    }
    return result
  },
})
