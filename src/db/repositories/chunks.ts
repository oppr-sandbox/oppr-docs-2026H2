// Chunks repository. Used by the AI/RAG layer (M8).

import type { Database } from "sql.js"
import type { Chunk } from "@/types"
import { markDirty } from "../sqlite"
import {
  asNullableString,
  asNumber,
  asString,
  run,
  selectAll,
} from "./_helpers"

function mapChunk(row: Record<string, unknown>): Chunk {
  return {
    id: asString(row.id),
    document_id: asString(row.document_id),
    version: asNumber(row.version),
    seq: asNumber(row.seq),
    text: asString(row.text),
    page_or_section: asNullableString(row.page_or_section),
  }
}

export function listForDocument(db: Database, documentId: string, version?: number): Chunk[] {
  if (version != null) {
    return selectAll(
      db,
      `SELECT id, document_id, version, seq, text, page_or_section
         FROM chunks WHERE document_id = ? AND version = ? ORDER BY seq`,
      [documentId, version],
      mapChunk,
    )
  }
  return selectAll(
    db,
    `SELECT id, document_id, version, seq, text, page_or_section
       FROM chunks WHERE document_id = ? ORDER BY seq`,
    [documentId],
    mapChunk,
  )
}

/**
 * Every chunk in the library, scoped to each document's current_version.
 * Used by the "library" Q&A scope so IDA can answer across the whole catalog.
 */
export function listAllCurrent(db: Database): Chunk[] {
  return selectAll(
    db,
    `SELECT c.id, c.document_id, c.version, c.seq, c.text, c.page_or_section
       FROM chunks c
       JOIN documents d ON d.id = c.document_id AND d.current_version = c.version
      ORDER BY c.document_id, c.seq`,
    [],
    mapChunk,
  )
}

export function listForAsset(db: Database, assetId: string): Chunk[] {
  return selectAll(
    db,
    `SELECT c.id, c.document_id, c.version, c.seq, c.text, c.page_or_section
       FROM chunks c
       JOIN document_assets da ON da.document_id = c.document_id
       JOIN documents d ON d.id = c.document_id AND d.current_version = c.version
      WHERE da.asset_id = ?
      ORDER BY c.document_id, c.seq`,
    [assetId],
    mapChunk,
  )
}

export function deleteForDocumentVersion(
  db: Database,
  documentId: string,
  version: number,
): void {
  run(db, "DELETE FROM chunks WHERE document_id = ? AND version = ?;", [documentId, version])
  markDirty()
}

export function insertMany(db: Database, chunks: Chunk[]): void {
  if (!chunks.length) return
  const stmt = db.prepare(
    `INSERT INTO chunks (id, document_id, version, seq, text, page_or_section)
     VALUES (?, ?, ?, ?, ?, ?);`,
  )
  try {
    for (const c of chunks) {
      stmt.run([c.id, c.document_id, c.version, c.seq, c.text, c.page_or_section])
    }
  } finally {
    stmt.free()
  }
  markDirty()
}
