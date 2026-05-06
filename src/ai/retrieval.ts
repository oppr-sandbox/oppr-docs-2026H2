// RAG retrieval: given a scope (doc or asset) and a query string, embed the
// query, look up chunk embeddings in our scope's pool, and return the top-k
// chunks ranked by cosine similarity.

import type { Database } from "sql.js"
import type { Chunk, Doc } from "@/types"
import {
  listAllCurrent,
  listForAsset,
  listForDocument,
} from "@/db/repositories/chunks"
import { getMany } from "@/db/repositories/embeddings"
import { getDocument } from "@/db/repositories/documents"
import { embed } from "./embeddings"
import { topK } from "./similarity"

export type Scope =
  | { kind: "doc"; id: string }
  | { kind: "asset"; id: string }
  | { kind: "library" }

export interface RetrievalResult {
  chunks: Chunk[]
  scores: number[]
  doc: Doc | null
}

/**
 * Build the candidate chunk pool for the requested scope.
 * - "doc" scope uses the document's current_version (matches what the
 *   reader page renders). The caller doesn't need to know the version.
 * - "asset" scope uses the join through document_assets.
 * - "library" scope spans every chunk in the catalog (current version each).
 */
function getScopeChunks(db: Database, scope: Scope): Chunk[] {
  if (scope.kind === "doc") {
    const doc = getDocument(db, scope.id)
    if (!doc) return []
    return listForDocument(db, scope.id, doc.current_version)
  }
  if (scope.kind === "asset") {
    return listForAsset(db, scope.id)
  }
  return listAllCurrent(db)
}

export async function retrieveForQuery(
  db: Database,
  queryText: string,
  scope: Scope,
  k = 5,
): Promise<RetrievalResult> {
  const chunks = getScopeChunks(db, scope)
  if (!chunks.length) {
    return {
      chunks: [],
      scores: [],
      doc: scope.kind === "doc" ? getDocument(db, scope.id) : null,
    }
  }

  const ids = chunks.map((c) => c.id)
  const embeddingRows = getMany(db, ids)
  // Index for O(1) lookup of vectors by chunk id.
  const vectorById = new Map(embeddingRows.map((e) => [e.chunk_id, e.vector]))

  const candidates = chunks
    .filter((c) => vectorById.has(c.id))
    .map((c) => ({ id: c.id, vector: vectorById.get(c.id)! }))

  if (!candidates.length) {
    // Embeddings not yet computed — caller should kick off embedMissingChunks
    // and retry. We return empty rather than throw.
    return {
      chunks: [],
      scores: [],
      doc: scope.kind === "doc" ? getDocument(db, scope.id) : null,
    }
  }

  const queryVec = await embed(queryText)
  const scored = topK(queryVec, candidates, k)
  const chunkById = new Map(chunks.map((c) => [c.id, c]))
  const resultChunks: Chunk[] = []
  const scores: number[] = []
  for (const s of scored) {
    const c = chunkById.get(s.id)
    if (c) {
      resultChunks.push(c)
      scores.push(s.score)
    }
  }

  return {
    chunks: resultChunks,
    scores,
    doc: scope.kind === "doc" ? getDocument(db, scope.id) : null,
  }
}
