import { internalAction, internalMutation } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { counterKey } from "./naming"
import { FACTORY_PPE } from "./ppe"

// Minimal test dataset: wipes every app table except templates, then seeds
// exactly enough to exercise the whole tool end to end —
//   2 assets, 5 placeholder logs (AMS-OPS-LOG-*), 2 stored images, and
//   2 documents (the SOP references the manual, links both assets, launches
//   one log, and embeds both images).
// Run from the CLI: npx convex run seedMinimal:run
// Templates and the signed-in user are preserved.

const WIPE_TABLES = [
  "meta",
  "assets",
  "assetLogs",
  "documents",
  "documentVersions",
  "documentAssets",
  "logs",
  "documentLogRefs",
  "chunks",
  "qaSessions",
  "qaMessages",
  "images",
  "imageUsages",
  "importJobs",
  "namingLocations",
  "namingDisciplines",
  "namingTypes",
  "namingCounters",
  "ppeItems",
] as const

const FACTORY_TYPES = [
  { slug: "sop", token: "SOP", label: "SOP", icon: "FileText", color: "sky" },
  { slug: "manual", token: "MAN", label: "Manual", icon: "BookOpen", color: "violet" },
  { slug: "work_instruction", token: "WI", label: "Work instruction", icon: "ListChecks", color: "emerald" },
  { slug: "lmra", token: "LMRA", label: "LMRA", icon: "ShieldAlert", color: "rose" },
  { slug: "toolbox", token: "TBOX", label: "Toolbox talk", icon: "Presentation", color: "amber" },
  { slug: "policy", token: "POL", label: "Policy", icon: "Landmark", color: "indigo" },
]

const IMAGE_A_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#f8fafc"/><rect x="60" y="140" width="200" height="170" rx="10" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/><text x="160" y="230" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#334155">Hopper</text><rect x="300" y="170" width="280" height="110" rx="55" fill="#ddd6fe" stroke="#7c3aed" stroke-width="2"/><text x="440" y="232" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#4c1d95">Screw barrel</text><rect x="620" y="160" width="130" height="130" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><text x="685" y="232" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#92400e">Die</text><line x1="260" y1="225" x2="300" y2="225" stroke="#334155" stroke-width="3"/><line x1="580" y1="225" x2="620" y2="225" stroke="#334155" stroke-width="3"/><text x="400" y="60" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#0f172a">EXT-201 twin-screw extruder — cross-section</text><circle cx="440" cy="320" r="9" fill="#ef4444"/><text x="458" y="326" font-family="sans-serif" font-size="16" fill="#b91c1c">Hot zone — do not touch</text></svg>`

const IMAGE_B_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#f8fafc"/><circle cx="400" cy="240" r="120" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/><path d="M400 140 L400 340 M310 240 L490 240" stroke="#2563eb" stroke-width="6" stroke-linecap="round" transform="rotate(30 400 240)"/><rect x="330" y="80" width="140" height="40" rx="6" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/><text x="400" y="106" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#334155">Feed inlet</text><text x="400" y="50" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#0f172a">MIX-101 feedstock mixer — agitator</text><text x="400" y="420" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">Check paddle clearance before every cleaning cycle</text></svg>`

interface SeedResult {
  ok: boolean
  documents: string[]
  assets: string[]
  logs: string[]
  images: number
}

export const run = internalAction({
  args: {},
  // Explicit return type breaks the self-referential inference through
  // internal.seedMinimal.insert.
  handler: async (ctx): Promise<SeedResult> => {
    const imageA = await ctx.storage.store(
      new Blob([IMAGE_A_SVG], { type: "image/svg+xml" }),
    )
    const imageB = await ctx.storage.store(
      new Blob([IMAGE_B_SVG], { type: "image/svg+xml" }),
    )
    return (await ctx.runMutation(internal.seedMinimal.insert, {
      imageA,
      imageB,
      imageABytes: IMAGE_A_SVG.length,
      imageBBytes: IMAGE_B_SVG.length,
    })) as SeedResult
  },
})

interface JSONNode {
  type: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
  text?: string
}

const text = (t: string): JSONNode => ({ type: "text", text: t })
const p = (t: string): JSONNode => ({
  type: "paragraph",
  content: t ? [text(t)] : [],
})
const h = (level: number, t: string): JSONNode => ({
  type: "heading",
  attrs: { level },
  content: [text(t)],
})
const ppe = (items: string): JSONNode => ({ type: "ppe", attrs: { items } })
const callout = (kind: string, t: string): JSONNode => ({
  type: "callout",
  attrs: { kind },
  content: [p(t)],
})
const image = (id: string, alt: string): JSONNode => ({
  type: "image",
  attrs: { src: "", alt, "data-image-id": id, width: 35, align: "center" },
})
const steps = (items: string[]): JSONNode => ({
  type: "stepList",
  content: items.map((it) => ({
    type: "stepItem",
    content: [p(it)],
  })),
})
function table(rows: string[][]): JSONNode {
  return {
    type: "table",
    content: rows.map((row, i) => ({
      type: "tableRow",
      content: row.map((cell) => ({
        type: i === 0 ? "tableHeader" : "tableCell",
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [p(cell)],
      })),
    })),
  }
}

// Plain-text chunks for RAG: one per heading/paragraph/step/table row, with the
// nearest heading as the section label.
function bodyChunks(
  body: JSONNode,
): Array<{ seq: number; text: string; section: string | null }> {
  const out: Array<{ text: string; section: string | null }> = []
  let section: string | null = null

  function textOf(node: JSONNode): string {
    if (node.text) return node.text
    return (node.content ?? []).map(textOf).join(" ").trim()
  }

  function visit(node: JSONNode) {
    if (node.type === "heading") {
      section = textOf(node)
      out.push({ text: section, section })
      return
    }
    if (node.type === "paragraph" || node.type === "stepItem") {
      const t = textOf(node)
      if (t) out.push({ text: t, section })
      return
    }
    if (node.type === "tableRow") {
      const t = textOf(node)
      if (t) out.push({ text: t, section })
      return
    }
    for (const child of node.content ?? []) visit(child)
  }
  visit(body)
  return out.map((c, i) => ({ seq: i + 1, ...c }))
}

export const insert = internalMutation({
  args: {
    imageA: v.id("_storage"),
    imageB: v.id("_storage"),
    imageABytes: v.number(),
    imageBBytes: v.number(),
  },
  handler: async (ctx, args) => {
    for (const tbl of WIPE_TABLES) {
      const rows = await ctx.db.query(tbl).collect()
      for (const row of rows) await ctx.db.delete(row._id)
    }

    const user = await ctx.db.query("users").first()
    const userId = user?._id ?? null
    const now = Date.now()

    for (const [code, label] of [
      ["AMS", "Amsterdam"],
      ["HOL", "Holliday"],
    ]) {
      await ctx.db.insert("namingLocations", { code, label })
    }
    for (const [code, label] of [
      ["OPS", "Operations"],
      ["MNT", "Maintenance"],
    ]) {
      await ctx.db.insert("namingDisciplines", { code, label })
    }
    for (let i = 0; i < FACTORY_TYPES.length; i++) {
      const t = FACTORY_TYPES[i]
      await ctx.db.insert("namingTypes", {
        slug: t.slug,
        token: t.token,
        label: t.label,
        icon: t.icon,
        color: t.color,
        active: true,
        builtIn: true,
        sortOrder: i,
      })
    }
    for (let i = 0; i < FACTORY_PPE.length; i++) {
      const p = FACTORY_PPE[i]
      await ctx.db.insert("ppeItems", {
        slug: p.slug,
        label: p.label,
        labelEn: p.label,
        labelNl: p.labelNl,
        description: p.description,
        pictogramId: p.pictogramId,
        storageId: null,
        active: true,
        builtIn: true,
        sortOrder: i,
      })
    }

    const extruderId = await ctx.db.insert("assets", {
      code: "EXT-201",
      name: "Twin-screw Extruder",
      site: "AMS",
      location: "Hall B — Line 2",
      qrToken: "qr-ext-201",
      description:
        "Twin-screw compounding extruder. Cleaning and die changeover follow AMS-OPS-SOP-0001.",
      level: 1,
      floorplan: null,
      isLinked: true,
      linkedLogCode: "AMS-OPS-LOG-0001",
      linkedLogName: "Extruder cleaning",
      linkedLogDescription: "Capture each cleaning cycle on EXT-201.",
      pinNumber: 1,
      pinX: 30,
      pinY: 45,
    })
    const mixerId = await ctx.db.insert("assets", {
      code: "MIX-101",
      name: "Feedstock Mixer",
      site: "AMS",
      location: "Hall A — Line 1",
      qrToken: "qr-mix-101",
      description:
        "Batch feedstock mixer upstream of the extruder. Paddle clearance check before every cleaning cycle.",
      level: 1,
      floorplan: null,
      isLinked: false,
      linkedLogCode: null,
      linkedLogName: null,
      linkedLogDescription: null,
      pinNumber: 2,
      pinX: 60,
      pinY: 45,
    })
    await ctx.db.insert("assetLogs", {
      assetId: extruderId,
      code: "AMS-OPS-LOG-0001",
      name: "Extruder cleaning",
      description: "Capture each cleaning cycle on EXT-201.",
    })

    const LOGS: Array<[string, string, string]> = [
      ["AMS-OPS-LOG-0001", "Extruder cleaning", "maintenance"],
      ["AMS-OPS-LOG-0002", "Daily handover", "handover"],
      ["AMS-OPS-LOG-0003", "Quality check — Mixer", "quality"],
      ["AMS-OPS-LOG-0004", "Maintenance round — weekly", "maintenance"],
      ["AMS-OPS-LOG-0005", "Press reject capture", "override"],
    ]
    const logIdByCode = new Map<string, Id<"logs">>()
    for (const [code, name, type] of LOGS) {
      const id = await ctx.db.insert("logs", {
        code,
        name,
        type,
        description: null,
      })
      logIdByCode.set(code, id)
    }

    const imgAId = await ctx.db.insert("images", {
      source: "upload",
      storageId: args.imageA,
      externalUrl: null,
      filename: "ext-201-cross-section.svg",
      contentType: "image/svg+xml",
      byteSize: args.imageABytes,
      width: 800,
      height: 450,
      sha256: null,
      altText: "EXT-201 twin-screw extruder cross-section",
      uploadedBy: userId,
      createdAt: now,
    })
    const imgBId = await ctx.db.insert("images", {
      source: "upload",
      storageId: args.imageB,
      externalUrl: null,
      filename: "mix-101-agitator.svg",
      contentType: "image/svg+xml",
      byteSize: args.imageBBytes,
      width: 800,
      height: 450,
      sha256: null,
      altText: "MIX-101 feedstock mixer agitator",
      uploadedBy: userId,
      createdAt: now,
    })

    // Document 1 — the manual the SOP references. Published, full signoff trail.
    const manualBody: JSONNode = {
      type: "doc",
      content: [
        h(1, "Extruder EXT-201 service manual"),
        {
          type: "paragraph",
          content: [
            text("Reference manual for "),
            {
              type: "linkedAsset",
              attrs: { assetId: extruderId, label: "EXT-201" },
            },
            text(
              ". Covers operating envelope, cleaning intervals, and die changeover torque values.",
            ),
          ],
        },
        h(2, "Operating envelope"),
        table([
          ["Parameter", "Min", "Max"],
          ["Barrel temperature", "165 °C", "215 °C"],
          ["Screw speed", "80 rpm", "320 rpm"],
          ["Die pressure", "—", "190 bar"],
        ]),
        h(2, "Cleaning intervals"),
        p(
          "Run a full cleaning cycle after every product changeover, or after 72 hours of continuous operation on the same compound — whichever comes first.",
        ),
        callout(
          "notice",
          "Cleaning cycles are captured in the Extruder cleaning log (AMS-OPS-LOG-0001).",
        ),
      ],
    }

    const manualId = await ctx.db.insert("documents", {
      namingCode: "AMS-OPS-MAN-0001",
      location: "AMS",
      discipline: "OPS",
      title: "Extruder EXT-201 service manual",
      type: "manual",
      status: "published",
      currentVersion: 1,
      liveVersion: 1,
      ownerId: userId,
      authorId: userId,
      reviewerId: userId,
      approverId: userId,
      tags: [],
      updatedAt: now,
    })
    await ctx.db.insert("documentVersions", {
      documentId: manualId,
      version: 1,
      bodyKind: "tiptap",
      bodyJson: manualBody,
      pdfStorageId: null,
      publishedAt: now,
      signoffs: userId
        ? [
            { role: "author", userId, at: now },
            { role: "reviewer", userId, at: now },
            { role: "approver", userId, at: now },
          ]
        : [],
    })
    for (const c of bodyChunks(manualBody)) {
      await ctx.db.insert("chunks", {
        documentId: manualId,
        version: 1,
        seq: c.seq,
        text: c.text,
        pageOrSection: c.section,
        embedding: null,
        embeddingModel: null,
      })
    }
    await ctx.db.insert("documentAssets", {
      documentId: manualId,
      assetId: extruderId,
    })

    // Document 2 — the working SOP that exercises everything: both asset
    // pills, a reference to the manual, one launch-log, both images, PPE,
    // callout, steps, table. Draft with the review flow filled in.
    const sopBody: JSONNode = {
      type: "doc",
      content: [
        h(1, "Extruder cleaning and changeover"),
        {
          type: "paragraph",
          content: [
            text("Cleaning and die-changeover procedure for "),
            {
              type: "linkedAsset",
              attrs: { assetId: extruderId, label: "EXT-201" },
            },
            text(" with upstream isolation of "),
            {
              type: "linkedAsset",
              attrs: { assetId: mixerId, label: "MIX-101" },
            },
            text(". Torque values and the operating envelope live in "),
            {
              type: "referenceDoc",
              attrs: {
                docId: manualId,
                code: "AMS-OPS-MAN-0001",
                label: "AMS-OPS-MAN-0001 — Extruder EXT-201 service manual",
              },
            },
            text("."),
          ],
        },
        ppe("hardhat,glasses,gloves,boots"),
        callout(
          "warning",
          "Barrel surfaces stay above 80 °C for 45 minutes after shutdown. Use heat-rated gloves for any contact before the cooldown timer clears.",
        ),
        image(imgAId, "EXT-201 twin-screw extruder cross-section"),
        h(2, "Procedure"),
        steps([
          "Stop the feed from MIX-101 and confirm the hopper has run empty.",
          "Purge the barrel with cleaning compound at 180 °C until the extrudate runs clear.",
          "Break the die bolts in the cross pattern and remove the die for soak cleaning.",
          "Inspect the screw tips; photograph any wear and attach it to the cleaning log.",
          "Refit the die and torque to the values in the service manual.",
        ]),
        image(imgBId, "MIX-101 feedstock mixer agitator"),
        h(2, "Capture"),
        p(
          "Every cleaning cycle is captured in the operational log below — launch it when the purge starts, close it after the torque check.",
        ),
        {
          type: "launchLog",
          attrs: {
            logId: logIdByCode.get("AMS-OPS-LOG-0001"),
            anchorId: "seed-anchor-ext-cleaning",
            label: "Extruder cleaning",
            code: "AMS-OPS-LOG-0001",
          },
        },
        h(2, "Troubleshooting"),
        table([
          ["Symptom", "Likely cause", "Action"],
          [
            "Extrudate stays discoloured after purge",
            "Degraded compound in the mixing zone",
            "Second purge cycle at +10 °C; escalate to maintenance if it persists",
          ],
          [
            "Die bolts above torque spec on removal",
            "Thermal seizure",
            "Apply penetrating oil, wait 10 min, never use an impact driver",
          ],
        ]),
      ],
    }

    const sopId = await ctx.db.insert("documents", {
      namingCode: "AMS-OPS-SOP-0001",
      location: "AMS",
      discipline: "OPS",
      title: "Extruder cleaning and changeover",
      type: "sop",
      status: "draft",
      currentVersion: 1,
      ownerId: userId,
      authorId: userId,
      reviewerId: userId,
      approverId: userId,
      tags: [],
      updatedAt: now,
    })
    await ctx.db.insert("documentVersions", {
      documentId: sopId,
      version: 1,
      bodyKind: "tiptap",
      bodyJson: sopBody,
      pdfStorageId: null,
      publishedAt: now,
      signoffs: userId ? [{ role: "author", userId, at: now }] : [],
    })
    for (const c of bodyChunks(sopBody)) {
      await ctx.db.insert("chunks", {
        documentId: sopId,
        version: 1,
        seq: c.seq,
        text: c.text,
        pageOrSection: c.section,
        embedding: null,
        embeddingModel: null,
      })
    }
    for (const assetId of [extruderId, mixerId]) {
      await ctx.db.insert("documentAssets", { documentId: sopId, assetId })
    }
    const cleaningLogId = logIdByCode.get("AMS-OPS-LOG-0001")
    if (cleaningLogId) {
      await ctx.db.insert("documentLogRefs", {
        documentId: sopId,
        version: 1,
        logId: cleaningLogId,
        anchorId: "seed-anchor-ext-cleaning",
      })
    }

    // Counters continue after the seeded codes.
    await ctx.db.insert("namingCounters", {
      key: counterKey("AMS", "OPS", "manual"),
      value: 1,
    })
    await ctx.db.insert("namingCounters", {
      key: counterKey("AMS", "OPS", "sop"),
      value: 1,
    })

    for (const documentId of [manualId, sopId]) {
      await ctx.runMutation(internal.images.recomputeUsagesForVersion, {
        documentId,
        documentVersion: 1,
        body: documentId === manualId ? manualBody : sopBody,
      })
      await ctx.scheduler.runAfter(0, internal.ai.embed.embedMissingInternal, {
        documentId,
      })
    }

    return {
      ok: true,
      documents: ["AMS-OPS-MAN-0001", "AMS-OPS-SOP-0001"],
      assets: ["EXT-201", "MIX-101"],
      logs: LOGS.map(([code]) => code),
      images: 2,
    }
  },
})
