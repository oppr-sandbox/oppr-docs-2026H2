// Documents repository.
//
// Mutation methods (`createDocument`, `updateDocument`, `publishVersion`) call
// `markDirty()` from the engine module so the singleton can debounce-persist
// to IndexedDB. Pure reads do NOT call it.

import type { Database } from "sql.js"
import type {
  Asset,
  Doc,
  DocVersion,
  DocWithAssets,
  DocumentBodyKind,
  DocumentStatus,
  DocumentType,
} from "@/types"
import { markDirty } from "../sqlite"
import {
  asNullableNumber,
  asNullableString,
  asNumber,
  asString,
  nowIso,
  parseJson,
  run,
  selectAll,
  selectOne,
} from "./_helpers"

// --- Mappers ----------------------------------------------------------------

function mapDoc(row: Record<string, unknown>): Doc {
  return {
    id: asString(row.id),
    naming_code: asString(row.naming_code),
    title: asString(row.title),
    type: asString(row.type) as DocumentType,
    status: asString(row.status) as DocumentStatus,
    current_version: asNumber(row.current_version),
    owner_id: asString(row.owner_id),
    tags: parseJson<string[]>(row.tags_json, []),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  }
}

function mapVersion(row: Record<string, unknown>): DocVersion {
  const bodyKind = asString(row.body_kind) as DocumentBodyKind
  return {
    id: asString(row.id),
    document_id: asString(row.document_id),
    version: asNumber(row.version),
    body_kind: bodyKind,
    body_json: bodyKind === "tiptap" ? parseJson<unknown>(row.body_json, null) : null,
    pdf_blob_id: asNullableString(row.pdf_blob_id),
    published_at: asString(row.published_at),
  }
}

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: asString(row.id),
    code: asString(row.code),
    name: asString(row.name),
    site: asString(row.site),
    location: asNullableString(row.location),
    qr_token: asString(row.qr_token),
    created_at: asString(row.created_at),
    description: asNullableString(row.description),
    level: asNumber(row.level ?? 1),
    floorplan: asNullableString(row.floorplan),
    is_linked: asNumber(row.is_linked ?? 0),
    linked_log_code: asNullableString(row.linked_log_code),
    linked_log_name: asNullableString(row.linked_log_name),
    linked_log_description: asNullableString(row.linked_log_description),
    pin_number: asNullableNumber(row.pin_number),
    pin_x: asNullableNumber(row.pin_x),
    pin_y: asNullableNumber(row.pin_y),
  }
}

// --- Reads ------------------------------------------------------------------

export interface DocumentFilters {
  status?: DocumentStatus
  type?: DocumentType
  search?: string
  ownerId?: string
}

export function listDocuments(db: Database, filters?: DocumentFilters): Doc[] {
  const where: string[] = []
  const params: Array<string | number> = []
  if (filters?.status) {
    where.push("status = ?")
    params.push(filters.status)
  }
  if (filters?.type) {
    where.push("type = ?")
    params.push(filters.type)
  }
  if (filters?.ownerId) {
    where.push("owner_id = ?")
    params.push(filters.ownerId)
  }
  if (filters?.search) {
    where.push("(LOWER(title) LIKE ? OR LOWER(naming_code) LIKE ?)")
    const needle = `%${filters.search.toLowerCase()}%`
    params.push(needle, needle)
  }
  const sql =
    `SELECT id, naming_code, title, type, status, current_version, owner_id, tags_json, created_at, updated_at
       FROM documents` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY updated_at DESC"
  return selectAll(db, sql, params.length ? params : undefined, mapDoc)
}

export function getDocument(db: Database, id: string): Doc | null {
  return selectOne(
    db,
    `SELECT id, naming_code, title, type, status, current_version, owner_id, tags_json, created_at, updated_at
       FROM documents WHERE id = ?`,
    [id],
    mapDoc,
  )
}

export function getDocumentByNamingCode(db: Database, code: string): Doc | null {
  return selectOne(
    db,
    `SELECT id, naming_code, title, type, status, current_version, owner_id, tags_json, created_at, updated_at
       FROM documents WHERE naming_code = ?`,
    [code],
    mapDoc,
  )
}

export function getDocumentWithAssets(db: Database, id: string): DocWithAssets | null {
  const doc = getDocument(db, id)
  if (!doc) return null
  const assets = selectAll(
    db,
    `SELECT a.id, a.code, a.name, a.site, a.location, a.qr_token, a.created_at,
            a.description, a.level, a.floorplan, a.is_linked,
            a.linked_log_code, a.linked_log_name, a.linked_log_description,
            a.pin_number, a.pin_x, a.pin_y
       FROM assets a
       JOIN document_assets da ON da.asset_id = a.id
      WHERE da.document_id = ?
      ORDER BY a.code`,
    [id],
    mapAsset,
  )
  return { ...doc, assets }
}

export function listDocumentsForAsset(db: Database, assetId: string): Doc[] {
  return selectAll(
    db,
    `SELECT d.id, d.naming_code, d.title, d.type, d.status, d.current_version,
            d.owner_id, d.tags_json, d.created_at, d.updated_at
       FROM documents d
       JOIN document_assets da ON da.document_id = d.id
      WHERE da.asset_id = ?
      ORDER BY d.title`,
    [assetId],
    mapDoc,
  )
}

export function getCurrentVersion(db: Database, documentId: string): DocVersion | null {
  return selectOne(
    db,
    `SELECT v.id, v.document_id, v.version, v.body_kind, v.body_json, v.pdf_blob_id, v.published_at
       FROM document_versions v
       JOIN documents d ON d.id = v.document_id AND d.current_version = v.version
      WHERE v.document_id = ?`,
    [documentId],
    mapVersion,
  )
}

export function getVersion(
  db: Database,
  documentId: string,
  version: number,
): DocVersion | null {
  return selectOne(
    db,
    `SELECT id, document_id, version, body_kind, body_json, pdf_blob_id, published_at
       FROM document_versions WHERE document_id = ? AND version = ?`,
    [documentId, version],
    mapVersion,
  )
}

export function listVersions(db: Database, documentId: string): DocVersion[] {
  return selectAll(
    db,
    `SELECT id, document_id, version, body_kind, body_json, pdf_blob_id, published_at
       FROM document_versions WHERE document_id = ?
      ORDER BY version DESC`,
    [documentId],
    mapVersion,
  )
}

// --- Writes -----------------------------------------------------------------

export type CreateDocumentInput = Omit<
  Doc,
  "id" | "created_at" | "updated_at" | "current_version"
> & {
  id?: string
  assetIds?: string[]
}

export function createDocument(db: Database, input: CreateDocumentInput): Doc {
  const id = input.id ?? crypto.randomUUID()
  const now = nowIso()
  run(
    db,
    `INSERT INTO documents (id, naming_code, title, type, status, current_version, owner_id, tags_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?);`,
    [id, input.naming_code, input.title, input.type, input.status, input.owner_id, JSON.stringify(input.tags ?? []), now, now],
  )
  if (input.assetIds && input.assetIds.length) {
    for (const aid of input.assetIds) {
      run(db, "INSERT OR IGNORE INTO document_assets (document_id, asset_id) VALUES (?, ?);", [id, aid])
    }
  }
  markDirty()
  const created = getDocument(db, id)
  if (!created) throw new Error("createDocument: insert succeeded but read returned null")
  return created
}

export function updateDocument(db: Database, id: string, patch: Partial<Doc>): void {
  const sets: string[] = []
  const params: Array<string | number> = []
  if (patch.title != null) {
    sets.push("title = ?")
    params.push(patch.title)
  }
  if (patch.naming_code != null) {
    sets.push("naming_code = ?")
    params.push(patch.naming_code)
  }
  if (patch.type != null) {
    sets.push("type = ?")
    params.push(patch.type)
  }
  if (patch.status != null) {
    sets.push("status = ?")
    params.push(patch.status)
  }
  if (patch.owner_id != null) {
    sets.push("owner_id = ?")
    params.push(patch.owner_id)
  }
  if (patch.tags != null) {
    sets.push("tags_json = ?")
    params.push(JSON.stringify(patch.tags))
  }
  if (!sets.length) return
  sets.push("updated_at = ?")
  params.push(nowIso())
  params.push(id)
  run(db, `UPDATE documents SET ${sets.join(", ")} WHERE id = ?;`, params)
  markDirty()
}

export function setDocumentAssets(db: Database, id: string, assetIds: string[]): void {
  run(db, "DELETE FROM document_assets WHERE document_id = ?;", [id])
  for (const aid of assetIds) {
    run(db, "INSERT OR IGNORE INTO document_assets (document_id, asset_id) VALUES (?, ?);", [id, aid])
  }
  markDirty()
}

export function deleteDocument(db: Database, id: string): void {
  run(db, "DELETE FROM documents WHERE id = ?;", [id])
  markDirty()
}

export type PublishVersionBody =
  | { kind: "tiptap"; json: unknown }
  | { kind: "pdf"; blobId: string }

/**
 * Append a new version row, bump documents.current_version, and bump updated_at.
 * Returns the freshly published version.
 */
export function publishVersion(
  db: Database,
  documentId: string,
  body: PublishVersionBody,
): DocVersion {
  const doc = getDocument(db, documentId)
  if (!doc) throw new Error(`publishVersion: document ${documentId} not found`)
  const nextVersion = doc.current_version + 1
  const versionId = `${documentId}-v${nextVersion}`
  const publishedAt = nowIso()
  run(
    db,
    `INSERT INTO document_versions (id, document_id, version, body_kind, body_json, pdf_blob_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      versionId,
      documentId,
      nextVersion,
      body.kind,
      body.kind === "tiptap" ? JSON.stringify(body.json) : null,
      body.kind === "pdf" ? body.blobId : null,
      publishedAt,
    ],
  )
  run(
    db,
    "UPDATE documents SET current_version = ?, updated_at = ? WHERE id = ?;",
    [nextVersion, publishedAt, documentId],
  )
  markDirty()
  const v = getVersion(db, documentId, nextVersion)
  if (!v) throw new Error("publishVersion: insert succeeded but read returned null")
  return v
}
