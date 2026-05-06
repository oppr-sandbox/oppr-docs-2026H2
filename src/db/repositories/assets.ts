// Assets repository.

import type { Database } from "sql.js"
import type { Asset, AssetLog, AssetWithDocs, Doc } from "@/types"
import { markDirty } from "../sqlite"
import {
  asNullableNumber,
  asNullableString,
  asString,
  parseJson,
  asNumber,
  selectAll,
  selectOne,
} from "./_helpers"

const ASSET_COLUMNS = `id, code, name, site, location, qr_token, created_at,
  description, level, floorplan, is_linked,
  linked_log_code, linked_log_name, linked_log_description,
  pin_number, pin_x, pin_y`

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
    level: asNumber(row.level),
    floorplan: asNullableString(row.floorplan),
    is_linked: asNumber(row.is_linked),
    linked_log_code: asNullableString(row.linked_log_code),
    linked_log_name: asNullableString(row.linked_log_name),
    linked_log_description: asNullableString(row.linked_log_description),
    pin_number: asNullableNumber(row.pin_number),
    pin_x: asNullableNumber(row.pin_x),
    pin_y: asNullableNumber(row.pin_y),
  }
}

function mapAssetLog(row: Record<string, unknown>): AssetLog {
  return {
    asset_id: asString(row.asset_id),
    code: asString(row.code),
    name: asString(row.name),
    description: asNullableString(row.description),
  }
}

function mapDoc(row: Record<string, unknown>): Doc {
  return {
    id: asString(row.id),
    naming_code: asString(row.naming_code),
    title: asString(row.title),
    type: asString(row.type) as Doc["type"],
    status: asString(row.status) as Doc["status"],
    current_version: asNumber(row.current_version),
    owner_id: asString(row.owner_id),
    tags: parseJson<string[]>(row.tags_json, []),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  }
}

export function listAssets(db: Database): Asset[] {
  return selectAll(
    db,
    `SELECT ${ASSET_COLUMNS} FROM assets ORDER BY code`,
    undefined,
    mapAsset,
  )
}

export function getAsset(db: Database, id: string): Asset | null {
  return selectOne(
    db,
    `SELECT ${ASSET_COLUMNS} FROM assets WHERE id = ?`,
    [id],
    mapAsset,
  )
}

export function getAssetByCode(db: Database, code: string): Asset | null {
  return selectOne(
    db,
    `SELECT ${ASSET_COLUMNS} FROM assets WHERE code = ?`,
    [code],
    mapAsset,
  )
}

export function listByQrToken(db: Database, qrToken: string): Asset | null {
  return selectOne(
    db,
    `SELECT ${ASSET_COLUMNS} FROM assets WHERE qr_token = ?`,
    [qrToken],
    mapAsset,
  )
}

export function listAssetLogs(db: Database, assetId: string): AssetLog[] {
  return selectAll(
    db,
    `SELECT asset_id, code, name, description
       FROM asset_logs
      WHERE asset_id = ?
      ORDER BY code`,
    [assetId],
    mapAssetLog,
  )
}

/**
 * Returns all asset_logs grouped by asset_id in one query so list views can
 * render counts + popovers without N+1 reads.
 */
export function listAllAssetLogs(db: Database): Map<string, AssetLog[]> {
  const map = new Map<string, AssetLog[]>()
  const rows = selectAll(
    db,
    `SELECT asset_id, code, name, description
       FROM asset_logs
      ORDER BY code`,
    undefined,
    mapAssetLog,
  )
  for (const r of rows) {
    const list = map.get(r.asset_id) ?? []
    list.push(r)
    map.set(r.asset_id, list)
  }
  return map
}

export function getAssetWithDocs(db: Database, id: string): AssetWithDocs | null {
  const asset = getAsset(db, id)
  if (!asset) return null
  const documents = selectAll(
    db,
    `SELECT d.id, d.naming_code, d.title, d.type, d.status, d.current_version,
            d.owner_id, d.tags_json, d.created_at, d.updated_at
       FROM documents d
       JOIN document_assets da ON da.document_id = d.id
      WHERE da.asset_id = ?
      ORDER BY d.title`,
    [id],
    mapDoc,
  )
  return { ...asset, documents }
}

export interface AssetUpdate {
  name?: string
  code?: string
  description?: string | null
  level?: number
}

/**
 * Partial update for the showcase Edit Asset modal. Only fields the modal
 * exposes are writable — site/QR/floorplan/log links stay read-only here.
 */
export function updateAsset(db: Database, id: string, patch: AssetUpdate): void {
  const sets: string[] = []
  const params: unknown[] = []
  if (patch.name !== undefined) {
    sets.push("name = ?")
    params.push(patch.name)
  }
  if (patch.code !== undefined) {
    sets.push("code = ?")
    params.push(patch.code)
  }
  if (patch.description !== undefined) {
    sets.push("description = ?")
    params.push(patch.description)
  }
  if (patch.level !== undefined) {
    sets.push("level = ?")
    params.push(patch.level)
  }
  if (!sets.length) return
  params.push(id)
  const stmt = db.prepare(`UPDATE assets SET ${sets.join(", ")} WHERE id = ?`)
  try {
    stmt.bind(params as never)
    stmt.step()
  } finally {
    stmt.free()
  }
  markDirty()
}
