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
    // Optional asset photo stored in Convex storage.
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
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
    // Naming code is derived from these three tokens + an auto sequence.
    location: v.optional(v.union(v.string(), v.null())),
    discipline: v.optional(v.union(v.string(), v.null())),
    title: v.string(),
    type: v.union(
      v.literal("sop"),
      v.literal("manual"),
      v.literal("work_instruction"),
      v.literal("lmra"),
    ),
    status: v.union(
      v.literal("pre_draft"),
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("archived"),
    ),
    // The highest / working edition number. Advances only when a published
    // document is forked for a new edit (see createNewVersion), never on save.
    currentVersion: v.number(),
    // The published edition operators / QR / RAG are served. Stays pinned to the
    // live version while a newer edition is being drafted, so v1 remains live
    // until v2 completes the cycle. Null/undefined until first publish — readers
    // fall back to currentVersion in that case.
    liveVersion: v.optional(v.number()),
    ownerId: v.union(v.id("users"), v.null()),
    // Lifecycle roles. Nullable so a draft can start before they are set;
    // gated transitions enforce they exist before advancing.
    authorId: v.optional(v.union(v.id("users"), v.null())),
    reviewerId: v.optional(v.union(v.id("users"), v.null())),
    approverId: v.optional(v.union(v.id("users"), v.null())),
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
    // Per-version approval trail. Recorded as the document advances through
    // review → approved → published.
    signoffs: v.optional(
      v.array(
        v.object({
          role: v.union(
            v.literal("author"),
            v.literal("reviewer"),
            v.literal("approver"),
          ),
          userId: v.id("users"),
          at: v.number(),
        }),
      ),
    ),
  }).index("by_documentId_and_version", ["documentId", "version"]),

  // ---- Templates -----------------------------------------------------------
  // DB-backed document templates. Seeded from the original code skeletons;
  // managed via the /templates page.
  templates: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("sop"),
      v.literal("manual"),
      v.literal("work_instruction"),
      v.literal("lmra"),
    ),
    description: v.union(v.string(), v.null()),
    bodyJson: v.any(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  // ---- PDF cover settings ---------------------------------------------------
  // Single-row table (upserted): org-wide configuration for how exported PDFs
  // look. Every export consumes this; there is no per-document override.
  coverSettings: defineTable({
    companyName: v.union(v.string(), v.null()),
    headerText: v.union(v.string(), v.null()),
    footerText: v.union(v.string(), v.null()),
    titleSize: v.union(v.literal("sm"), v.literal("md"), v.literal("lg")),
    logoImageId: v.optional(v.union(v.id("images"), v.null())),
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
    updatedAt: v.number(),
  }),

  // ---- Naming vocabulary + counters ----------------------------------------
  namingLocations: defineTable({
    code: v.string(),
    label: v.string(),
  }).index("by_code", ["code"]),

  namingDisciplines: defineTable({
    code: v.string(),
    label: v.string(),
  }).index("by_code", ["code"]),

  // One row per (location, discipline, type) triplet. `value` is the last
  // allocated sequence number; the next code uses value + 1. Patched
  // atomically inside the create mutation so concurrent creates can't collide.
  namingCounters: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  documentAssets: defineTable({
    documentId: v.id("documents"),
    assetId: v.id("assets"),
  })
    .index("by_documentId", ["documentId"])
    .index("by_assetId", ["assetId"])
    .index("by_documentId_and_assetId", ["documentId", "assetId"]),

  logs: defineTable({
    // Placeholder identity for the LOGS module, e.g. AMS-OPS-LOG-0001.
    code: v.optional(v.string()),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
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
    // When this chunk's embedding was last written. Drives the AI status panel.
    embeddedAt: v.optional(v.number()),
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

  images: defineTable({
    source: v.union(v.literal("upload"), v.literal("url")),
    storageId: v.union(v.id("_storage"), v.null()),
    externalUrl: v.union(v.string(), v.null()),
    filename: v.string(),
    contentType: v.string(),
    byteSize: v.union(v.number(), v.null()),
    width: v.union(v.number(), v.null()),
    height: v.union(v.number(), v.null()),
    sha256: v.union(v.string(), v.null()),
    altText: v.string(),
    uploadedBy: v.union(v.id("users"), v.null()),
    createdAt: v.number(),
  })
    .index("by_sha256", ["sha256"])
    .index("by_uploadedBy", ["uploadedBy"]),

  imageUsages: defineTable({
    imageId: v.id("images"),
    documentId: v.id("documents"),
    documentVersion: v.number(),
    context: v.union(
      v.literal("body"),
      v.literal("thumbnail"),
      v.literal("asset"),
    ),
    createdAt: v.number(),
  })
    .index("by_imageId", ["imageId"])
    .index("by_documentId", ["documentId"])
    .index("by_documentId_and_version", ["documentId", "documentVersion"]),

  importJobs: defineTable({
    sourceStorageId: v.union(v.id("_storage"), v.null()),
    sourceFilename: v.string(),
    sourceContentType: v.string(),
    sourceByteSize: v.number(),
    sourceSha256: v.union(v.string(), v.null()),
    targetTemplate: v.union(
      v.literal("sop"),
      v.literal("workInstructionLog"),
      v.literal("manual"),
      v.literal("lmra"),
      v.literal("auto"),
    ),
    defaultMode: v.union(v.literal("verbatim"), v.literal("improve")),
    stage: v.union(
      v.literal("uploaded"),
      v.literal("extracted"),
      v.literal("mapped"),
      v.literal("linksResolved"),
      v.literal("finalized"),
      v.literal("failed"),
    ),
    classification: v.union(
      v.object({
        kind: v.union(
          v.literal("digitalPdf"),
          v.literal("scannedPdf"),
          v.literal("unsupported"),
        ),
        pageCount: v.number(),
        detectedLanguage: v.union(v.string(), v.null()),
      }),
      v.null(),
    ),
    extractedMarkdown: v.union(v.string(), v.null()),
    extractedPages: v.union(
      v.array(
        v.object({
          pageNumber: v.number(),
          text: v.string(),
        }),
      ),
      v.null(),
    ),
    extractedImageIds: v.array(v.id("images")),
    extractStats: v.optional(
      v.union(
        v.object({
          imagesDetected: v.number(),
          imagesExtracted: v.number(),
          imagesSkipped: v.number(),
          pageFallbackImages: v.number(),
          jpegImages: v.number(),
          pngImages: v.number(),
        }),
        v.null(),
      ),
    ),
    mappedBody: v.union(v.any(), v.null()),
    mappedLogSpec: v.union(v.any(), v.null()),
    mappingNotes: v.union(v.string(), v.null()),
    structuredDoc: v.optional(v.union(v.any(), v.null())),
    linkResolutions: v.union(
      v.array(
        v.object({
          match: v.string(),
          kind: v.union(
            v.literal("document"),
            v.literal("asset"),
            v.literal("log"),
          ),
          confidence: v.number(),
          targetId: v.union(v.string(), v.null()),
          targetLabel: v.union(v.string(), v.null()),
          accepted: v.boolean(),
        }),
      ),
      v.null(),
    ),
    suggestedNamingCode: v.union(v.string(), v.null()),
    suggestedTitle: v.union(v.string(), v.null()),
    suggestedAssetIds: v.array(v.id("assets")),
    finalizedDocumentId: v.union(v.id("documents"), v.null()),
    error: v.union(v.string(), v.null()),
    createdBy: v.union(v.id("users"), v.null()),
    updatedAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_stage", ["stage"]),

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
