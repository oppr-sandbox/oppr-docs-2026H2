import {
  ASSETS,
  DOCUMENTS,
  LOGS,
  SEED_VERSION,
  SITE,
  T_PUBLISHED,
  T_UPDATED,
  paragraphChunks,
} from "./seedDataset"

interface SeedAsset {
  code: string
  name: string
  location: string | null
  qrToken: string
  description: string | null
  level: number
  floorplan: string | null
  isLinked: boolean
  linkedLogCode: string | null
  linkedLogName: string | null
  linkedLogDescription: string | null
  pinNumber: number | null
  pinX: number | null
  pinY: number | null
  logs: Array<{ code: string; name: string; description: string | null }>
}

interface SeedDocument {
  namingCode: string
  title: string
  type: "sop" | "manual" | "work_instruction" | "lmra"
  status: "draft" | "in_review" | "published" | "archived"
  tags: string[]
  bodyJson: unknown
  assetCodes: string[]
  chunks: Array<{ seq: number; text: string; pageOrSection: string | null }>
}

export interface SeedPayload {
  version: number
  site: string
  updatedAt: number
  publishedAt: number
  assets: SeedAsset[]
  logs: Array<{ name: string; type: string }>
  documents: SeedDocument[]
  documentLogRefs: Array<{
    documentNamingCode: string
    logName: string
    anchorId: string
  }>
}

export function buildSeedPayload(): SeedPayload {
  const assetByLegacyId = new Map(ASSETS.map((a) => [a.id, a]))

  const assets: SeedAsset[] = ASSETS.map((a) => ({
    code: a.code,
    name: a.name,
    location: a.location,
    qrToken: `qr-${a.code.toLowerCase()}`,
    description: a.description,
    level: a.level,
    floorplan: a.floorplan,
    isLinked: a.is_linked === 1,
    linkedLogCode: a.linked_log_code,
    linkedLogName: a.linked_log_name,
    linkedLogDescription: a.linked_log_description,
    pinNumber: a.pin_number,
    pinX: a.pin_x,
    pinY: a.pin_y,
    logs: a.logs.map((l) => ({
      code: l.code,
      name: l.name,
      description: l.description,
    })),
  }))

  const documents: SeedDocument[] = DOCUMENTS
    .filter((d) => d.body_kind === "tiptap" && d.body_json)
    .map((d) => {
      const body = d.body_json!
      const chunks = paragraphChunks(body).map((c, i) => ({
        seq: i + 1,
        text: c.text,
        pageOrSection: c.section,
      }))
      const assetCodes = d.asset_ids
        .map((aid) => assetByLegacyId.get(aid)?.code)
        .filter((c): c is string => Boolean(c))
      return {
        namingCode: d.naming_code,
        title: d.title,
        type: d.type,
        status: d.status,
        tags: d.tags,
        bodyJson: body,
        assetCodes,
        chunks,
      }
    })

  const documentLogRefs = [
    {
      documentNamingCode: "HOL-OPS-SOP-0001",
      logName: "Daily handover",
      anchorId: "anchor-log-handover",
    },
    {
      documentNamingCode: "HOL-OPS-SOP-0002",
      logName: "Quality check — Mixer",
      anchorId: "anchor-log-quality-mixer",
    },
  ]

  return {
    version: SEED_VERSION,
    site: SITE,
    updatedAt: new Date(T_UPDATED).getTime(),
    publishedAt: new Date(T_PUBLISHED).getTime(),
    assets,
    logs: LOGS.map((l) => ({ name: l.name, type: l.type })),
    documents,
    documentLogRefs,
  }
}
