// Cross-entity discovery used by the "Related" rail under each assistant
// message. Pure DB joins — no LLM cost.
//
// Inputs: the document IDs cited in an answer, plus the active scope.
// Outputs: assets touched by those docs, other docs that share those assets,
// and connected logs. We exclude the scope's own entity from results so the
// rail surfaces *new* navigation, not the thing the user is already on.

import type { Database } from "sql.js"
import type { Asset, AssetLog, Doc } from "@/types"
import { listAssets, listAssetLogs } from "@/db/repositories/assets"
import { listDocuments } from "@/db/repositories/documents"
import type { Scope } from "./retrieval"

export interface RelatedRail {
  otherDocs: Doc[]
  assets: Asset[]
  logs: AssetLog[]
}

export function buildRelatedRail(
  db: Database,
  citedDocIds: string[],
  scope: Scope,
): RelatedRail {
  if (!citedDocIds.length) {
    return { otherDocs: [], assets: [], logs: [] }
  }

  // 1. Cited docs -> set of asset ids they touch.
  const docAssetMap = listDocAssetEdges(db)
  const citedAssetIds = new Set<string>()
  for (const docId of citedDocIds) {
    const ids = docAssetMap.get(docId) ?? []
    for (const aid of ids) citedAssetIds.add(aid)
  }
  // If we're scoped to an asset, exclude that asset from the rail —
  // the user is already on it.
  if (scope.kind === "asset") citedAssetIds.delete(scope.id)

  const allAssets = listAssets(db)
  const assetById = new Map(allAssets.map((a) => [a.id, a]))
  const assets: Asset[] = []
  for (const aid of citedAssetIds) {
    const a = assetById.get(aid)
    if (a) assets.push(a)
  }
  assets.sort((a, b) => a.code.localeCompare(b.code))

  // 2. Other docs that share at least one of those assets.
  const otherDocIds = new Set<string>()
  for (const [docId, assetIds] of docAssetMap.entries()) {
    if (citedDocIds.includes(docId)) continue
    if (scope.kind === "doc" && docId === scope.id) continue
    if (assetIds.some((aid) => citedAssetIds.has(aid))) {
      otherDocIds.add(docId)
    }
  }
  const allDocs = listDocuments(db)
  const docById = new Map(allDocs.map((d) => [d.id, d]))
  const otherDocs: Doc[] = []
  for (const id of otherDocIds) {
    const d = docById.get(id)
    if (d) otherDocs.push(d)
  }
  otherDocs.sort((a, b) => a.naming_code.localeCompare(b.naming_code))

  // 3. Logs for those assets.
  const logs: AssetLog[] = []
  const logKeys = new Set<string>()
  for (const a of assets) {
    for (const l of listAssetLogs(db, a.id)) {
      const key = `${a.id}::${l.code}`
      if (logKeys.has(key)) continue
      logKeys.add(key)
      logs.push(l)
    }
  }

  return {
    otherDocs: otherDocs.slice(0, 6),
    assets: assets.slice(0, 6),
    logs: logs.slice(0, 6),
  }
}

/**
 * One-shot read of the document_assets join table into a map. Used twice
 * per call to buildRelatedRail; building it once is cheaper than two
 * separate per-doc queries.
 */
function listDocAssetEdges(db: Database): Map<string, string[]> {
  const map = new Map<string, string[]>()
  const stmt = db.prepare(
    "SELECT document_id, asset_id FROM document_assets",
  )
  try {
    while (stmt.step()) {
      const r = stmt.getAsObject() as { document_id: string; asset_id: string }
      const list = map.get(r.document_id) ?? []
      list.push(r.asset_id)
      map.set(r.document_id, list)
    }
  } finally {
    stmt.free()
  }
  return map
}
