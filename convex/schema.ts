import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

export default defineSchema({
  ...authTables,

  meta: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  assets: defineTable({
    code: v.string(),
    name: v.string(),
    site: v.string(),
    location: v.union(v.string(), v.null()),
    qrToken: v.string(),
    description: v.union(v.string(), v.null()),
    level: v.number(),
    floorplan: v.union(v.string(), v.null()),
    isLinked: v.boolean(),
    linkedLogCode: v.union(v.string(), v.null()),
    linkedLogName: v.union(v.string(), v.null()),
    linkedLogDescription: v.union(v.string(), v.null()),
    pinNumber: v.union(v.number(), v.null()),
    pinX: v.union(v.number(), v.null()),
    pinY: v.union(v.number(), v.null()),
  })
    .index("by_qrToken", ["qrToken"])
    .index("by_code", ["code"]),

  assetLogs: defineTable({
    assetId: v.id("assets"),
    code: v.string(),
    name: v.string(),
    description: v.union(v.string(), v.null()),
  }).index("by_assetId", ["assetId"]),

  documents: defineTable({
    namingCode: v.string(),
    title: v.string(),
    type: v.union(
      v.literal("sop"),
      v.literal("manual"),
      v.literal("work_instruction"),
      v.literal("lmra"),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("published"),
      v.literal("archived"),
    ),
    currentVersion: v.number(),
    ownerId: v.id("users"),
    tags: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_namingCode", ["namingCode"])
    .index("by_ownerId", ["ownerId"]),

  documentVersions: defineTable({
    documentId: v.id("documents"),
    version: v.number(),
    bodyKind: v.union(v.literal("tiptap"), v.literal("pdf")),
    bodyJson: v.union(v.any(), v.null()),
    pdfStorageId: v.union(v.id("_storage"), v.null()),
    publishedAt: v.number(),
  }).index("by_documentId_and_version", ["documentId", "version"]),

  documentAssets: defineTable({
    documentId: v.id("documents"),
    assetId: v.id("assets"),
  })
    .index("by_documentId", ["documentId"])
    .index("by_assetId", ["assetId"])
    .index("by_documentId_and_assetId", ["documentId", "assetId"]),

  logs: defineTable({
    name: v.string(),
    type: v.string(),
  }),

  documentLogRefs: defineTable({
    documentId: v.id("documents"),
    version: v.number(),
    logId: v.id("logs"),
    anchorId: v.string(),
  }).index("by_documentId_and_version", ["documentId", "version"]),

  chunks: defineTable({
    documentId: v.id("documents"),
    version: v.number(),
    seq: v.number(),
    text: v.string(),
    pageOrSection: v.union(v.string(), v.null()),
    embedding: v.union(v.array(v.float64()), v.null()),
    embeddingModel: v.union(v.string(), v.null()),
  })
    .index("by_documentId_and_version", ["documentId", "version"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["documentId"],
    }),

  qaSessions: defineTable({
    userId: v.id("users"),
    scopeKind: v.union(
      v.literal("doc"),
      v.literal("asset"),
      v.literal("library"),
    ),
    scopeId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_scopeKind_and_scopeId", [
      "userId",
      "scopeKind",
      "scopeId",
    ]),

  qaMessages: defineTable({
    sessionId: v.id("qaSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    citations: v.union(
      v.array(
        v.object({
          documentId: v.id("documents"),
          documentTitle: v.string(),
          chunkId: v.id("chunks"),
          pageOrSection: v.union(v.string(), v.null()),
          excerpt: v.string(),
          origin: v.union(
            v.literal("asset-link"),
            v.literal("cross-link"),
            v.literal("log"),
          ),
        }),
      ),
      v.null(),
    ),
  }).index("by_sessionId", ["sessionId"]),
})
