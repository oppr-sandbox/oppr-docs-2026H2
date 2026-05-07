// StructuredDoc — typed intermediate format for the importer.
//
// Every importer producer (browser pdfjs first-pass, narrow-scope LLM
// mapper, future Python/markitdown service) targets this same shape, and
// every consumer (TipTap editor, PDF renderer, mobile read view, log spec)
// reads from it. The shape is intentionally narrower than TipTap so it
// validates with zod and round-trips cleanly.
//
// Decisions logged on 2026-05-07:
//   1a — bodyJson is canonical post-import; StructuredDoc is regenerated
//        best-effort if the user re-renders.
//   2a — text-only LLM. PPE / icon detection is purely deterministic at
//        extract time using image dimensions + page position.
//   3a — schema designed to be portable (JSON-only, no browser-only types)
//        so a future Python service can populate it directly.
//   4a — match-by-naming-code on re-import is documented but not yet wired.

import { z } from "zod"

export const SCHEMA_VERSION = 1

// ---------------------------------------------------------------------------
// Block kinds
// ---------------------------------------------------------------------------

export const ParagraphBlock = z.object({
  kind: z.literal("paragraph"),
  text: z.string(),
})
export type ParagraphBlock = z.infer<typeof ParagraphBlock>

export const ListBlock = z.object({
  kind: z.literal("list"),
  ordered: z.boolean(),
  items: z.array(z.string()),
})
export type ListBlock = z.infer<typeof ListBlock>

export const StepBlock = z.object({
  n: z.number(),
  title: z.string().nullable(),
  text: z.string(),
  imageRef: z
    .object({
      imageId: z.string().nullable(),
      page: z.number(),
      hint: z.string().nullable().optional(),
    })
    .nullable(),
})
export type StepBlock = z.infer<typeof StepBlock>

export const StepListBlock = z.object({
  kind: z.literal("stepList"),
  steps: z.array(StepBlock),
})
export type StepListBlock = z.infer<typeof StepListBlock>

export const CalloutBlock = z.object({
  kind: z.literal("callout"),
  tone: z.enum(["info", "warning", "safety"]),
  title: z.string().nullable(),
  text: z.string(),
})
export type CalloutBlock = z.infer<typeof CalloutBlock>

export const TableBlock = z.object({
  kind: z.literal("table"),
  caption: z.string().nullable(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
})
export type TableBlock = z.infer<typeof TableBlock>

export const ImageBlock = z.object({
  kind: z.literal("image"),
  imageId: z.string().nullable(),
  page: z.number(),
  alt: z.string(),
})
export type ImageBlock = z.infer<typeof ImageBlock>

export const HorizontalRuleBlock = z.object({
  kind: z.literal("horizontalRule"),
})
export type HorizontalRuleBlock = z.infer<typeof HorizontalRuleBlock>

export const LinkRefBlock = z.object({
  kind: z.literal("linkRef"),
  targetKind: z.enum(["document", "asset", "log"]),
  match: z.string(),
  resolvedId: z.string().nullable(),
  label: z.string().nullable(),
})
export type LinkRefBlock = z.infer<typeof LinkRefBlock>

export const Block = z.union([
  ParagraphBlock,
  ListBlock,
  StepListBlock,
  CalloutBlock,
  TableBlock,
  ImageBlock,
  HorizontalRuleBlock,
  LinkRefBlock,
])
export type Block = z.infer<typeof Block>

// ---------------------------------------------------------------------------
// Top-level structure
// ---------------------------------------------------------------------------

export const Section = z.object({
  id: z.string(),
  heading: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  blocks: z.array(Block),
})
export type Section = z.infer<typeof Section>

export const PpeItem = z.enum([
  "helmet",
  "gloves",
  "hivis",
  "boots",
  "ffp2",
  "hearing",
  "goggles",
  "clothes",
])
export type PpeItem = z.infer<typeof PpeItem>

export const PpeSpec = z.object({
  items: z.array(PpeItem),
  referToManual: z.boolean(),
})
export type PpeSpec = z.infer<typeof PpeSpec>

export const Revision = z.object({
  rev: z.string(),
  date: z.string().nullable(),
  summary: z.string().nullable(),
  preparedBy: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  approvedBy: z.string().nullable(),
})
export type Revision = z.infer<typeof Revision>

export const LinkedAsset = z.object({
  code: z.string(),
  name: z.string().nullable(),
  area: z.string().nullable(),
})
export type LinkedAsset = z.infer<typeof LinkedAsset>

export const LinkedDoc = z.object({
  code: z.string().nullable(),
  title: z.string().nullable(),
})
export type LinkedDoc = z.infer<typeof LinkedDoc>

export const DocumentMetadata = z.object({
  namingCode: z.string().nullable(),
  title: z.string(),
  type: z.enum(["sop", "manual", "work_instruction", "lmra"]),
  site: z.string().nullable(),
  department: z.string().nullable(),
  documentNumber: z.string().nullable(),
  currentRevision: z.string().nullable(),
  currentRevisionDate: z.string().nullable(),
  owner: z.string().nullable(),
  preparedBy: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  approvedBy: z.string().nullable(),
})
export type DocumentMetadata = z.infer<typeof DocumentMetadata>

export const ExtractWarning = z.object({
  kind: z.string(),
  detail: z.string(),
})
export type ExtractWarning = z.infer<typeof ExtractWarning>

export const StructuredDoc = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  source: z.object({
    filename: z.string(),
    sha256: z.string().nullable(),
    pageCount: z.number(),
    language: z.string().nullable(),
  }),
  metadata: DocumentMetadata,
  history: z.array(Revision),
  linkedAssets: z.array(LinkedAsset),
  linkedDocs: z.array(LinkedDoc),
  ppe: PpeSpec.nullable(),
  loto: z
    .object({
      required: z.boolean(),
      notes: z.string().nullable(),
    })
    .nullable(),
  sections: z.array(Section),
  extractWarnings: z.array(ExtractWarning),
})
export type StructuredDoc = z.infer<typeof StructuredDoc>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function emptyStructuredDoc(filename: string): StructuredDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    source: { filename, sha256: null, pageCount: 0, language: null },
    metadata: {
      namingCode: null,
      title: filename.replace(/\.[a-z0-9]+$/i, ""),
      type: "sop",
      site: null,
      department: null,
      documentNumber: null,
      currentRevision: null,
      currentRevisionDate: null,
      owner: null,
      preparedBy: null,
      reviewedBy: null,
      approvedBy: null,
    },
    history: [],
    linkedAssets: [],
    linkedDocs: [],
    ppe: null,
    loto: null,
    sections: [],
    extractWarnings: [],
  }
}

export function validateStructuredDoc(input: unknown):
  | { ok: true; doc: StructuredDoc }
  | { ok: false; error: string } {
  const result = StructuredDoc.safeParse(input)
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }
  }
  return { ok: true, doc: result.data }
}
