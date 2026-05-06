// Embeddings repository.
// Stores vectors as JSON-serialized float arrays per the schema.

import type { Database } from "sql.js"
import type { ChunkEmbedding } from "@/types"
import { markDirty } from "../sqlite"
import {
  asString,
  parseJson,
  run,
  selectAll,
  selectOne,
} from "./_helpers"

function mapEmbedding(row: Record<string, unknown>): ChunkEmbedding {
  return {
    chunk_id: asString(row.chunk_id),
    vector: parseJson<number[]>(row.vector_json, []),
  }
}

export function getEmbedding(db: Database, chunkId: string): ChunkEmbedding | null {
  return selectOne(
    db,
    "SELECT chunk_id, vector_json FROM embeddings WHERE chunk_id = ?",
    [chunkId],
    mapEmbedding,
  )
}

export function getMany(db: Database, chunkIds: string[]): ChunkEmbedding[] {
  if (!chunkIds.length) return []
  const placeholders = chunkIds.map(() => "?").join(", ")
  return selectAll(
    db,
    `SELECT chunk_id, vector_json FROM embeddings WHERE chunk_id IN (${placeholders})`,
    chunkIds,
    mapEmbedding,
  )
}

export function listAllEmbeddings(db: Database): ChunkEmbedding[] {
  return selectAll(
    db,
    "SELECT chunk_id, vector_json FROM embeddings",
    undefined,
    mapEmbedding,
  )
}

/**
 * Return chunk ids that exist but have no embedding row yet — drives the M8
 * background backfill.
 */
export function listMissing(db: Database): string[] {
  return selectAll(
    db,
    `SELECT c.id AS chunk_id
       FROM chunks c
       LEFT JOIN embeddings e ON e.chunk_id = c.id
      WHERE e.chunk_id IS NULL`,
    undefined,
    (row) => asString(row.chunk_id),
  )
}

export function upsertEmbedding(db: Database, embedding: ChunkEmbedding): void {
  run(
    db,
    `INSERT INTO embeddings (chunk_id, vector_json) VALUES (?, ?)
     ON CONFLICT(chunk_id) DO UPDATE SET vector_json = excluded.vector_json;`,
    [embedding.chunk_id, JSON.stringify(embedding.vector)],
  )
  markDirty()
}

/**
 * Wipe every embedding row. Used when the embedding model or output
 * dimension changes — old vectors live in a different space and would
 * pollute cosine similarity if mixed with newly embedded chunks.
 */
export function clearAllEmbeddings(db: Database): number {
  const before = selectOne(
    db,
    "SELECT COUNT(*) AS c FROM embeddings",
    undefined,
    (row) => Number(row.c ?? 0),
  ) ?? 0
  run(db, "DELETE FROM embeddings;")
  markDirty()
  return before
}

export function upsertMany(db: Database, embeddings: ChunkEmbedding[]): void {
  if (!embeddings.length) return
  const stmt = db.prepare(
    `INSERT INTO embeddings (chunk_id, vector_json) VALUES (?, ?)
     ON CONFLICT(chunk_id) DO UPDATE SET vector_json = excluded.vector_json;`,
  )
  try {
    for (const e of embeddings) {
      stmt.run([e.chunk_id, JSON.stringify(e.vector)])
    }
  } finally {
    stmt.free()
  }
  markDirty()
}
