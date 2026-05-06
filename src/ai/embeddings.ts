// Embedding helpers — wraps Gemini's embedding model and provides a backfill
// routine for chunks that don't yet have a vector row.

import type { Database } from "sql.js"
import type { ChunkEmbedding } from "@/types"
import { listMissing, upsertMany } from "@/db/repositories/embeddings"
import { EMBEDDING_DIM, EMBEDDING_MODEL, getClient } from "./gemini"

/**
 * Maximum number of in-flight embed requests. The SDK doesn't expose a true
 * batch endpoint for the v1beta API used here, so we cap concurrency to be
 * polite to the rate-limited free tier.
 */
const CONCURRENCY = 4
const RATE_LIMIT_BACKOFF_MS = 200

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /\b429\b|rate.?limit|quota|RESOURCE_EXHAUSTED/i.test(msg)
}

/** Embed a single string. Returns an `EMBEDDING_DIM`-dim float vector. */
export async function embed(text: string): Promise<number[]> {
  const client = getClient()
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL })
  // The SDK's typed EmbedContentRequest doesn't expose outputDimensionality
  // yet, but the v1beta REST endpoint accepts it for gemini-embedding-2 / -001.
  // Cast through unknown so the field reaches the wire intact.
  const request = {
    content: { parts: [{ text }] },
    outputDimensionality: EMBEDDING_DIM,
  } as unknown as Parameters<typeof model.embedContent>[0]
  // Light retry on rate-limit. We don't retry generic errors — surfacing them
  // is more useful than silently looping.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await model.embedContent(request)
      const values = res.embedding?.values
      if (!Array.isArray(values)) {
        throw new Error("Gemini embed response missing 'embedding.values'")
      }
      return values
    } catch (err) {
      if (isRateLimitError(err) && attempt < 2) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_BACKOFF_MS * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error("embed: exhausted retries")
}

/**
 * Embed many strings with limited concurrency. Order of results matches input.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = new Array(texts.length)
  let next = 0
  async function worker() {
    while (true) {
      const i = next++
      if (i >= texts.length) return
      out[i] = await embed(texts[i])
    }
  }
  const workers = Array.from({ length: Math.min(CONCURRENCY, texts.length) }, () => worker())
  await Promise.all(workers)
  return out
}

export interface EmbedProgress {
  done: number
  total: number
}

/**
 * Find chunks without an embedding row, embed them, and persist via
 * upsertMany. Calls onProgress after each chunk is embedded.
 *
 * Returns a count of newly embedded chunks. `skipped` is currently always 0
 * — kept in the return type for forward compatibility.
 */
export async function embedMissingChunks(
  db: Database,
  onProgress?: (p: EmbedProgress) => void,
): Promise<{ embedded: number; skipped: number }> {
  const missingIds = listMissing(db)
  if (!missingIds.length) {
    onProgress?.({ done: 0, total: 0 })
    return { embedded: 0, skipped: 0 }
  }

  // Pull text for each missing chunk. We can't use chunks.listForDocument
  // here because we don't know which doc — but a flat SELECT by id list
  // is the simplest read that doesn't require a new repo helper.
  const placeholders = missingIds.map(() => "?").join(", ")
  const stmt = db.prepare(
    `SELECT id, text FROM chunks WHERE id IN (${placeholders})`,
  )
  const rows: { id: string; text: string }[] = []
  try {
    stmt.bind(missingIds)
    while (stmt.step()) {
      const row = stmt.getAsObject() as { id: string; text: string }
      rows.push({ id: row.id, text: row.text })
    }
  } finally {
    stmt.free()
  }

  // Process with limited concurrency and report progress as each completes.
  const total = rows.length
  let done = 0
  const results: ChunkEmbedding[] = []
  let next = 0

  async function worker() {
    while (true) {
      const i = next++
      if (i >= rows.length) return
      const row = rows[i]
      const vector = await embed(row.text)
      results.push({ chunk_id: row.id, vector })
      done++
      onProgress?.({ done, total })
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, rows.length) },
    () => worker(),
  )
  await Promise.all(workers)

  // Persist all in one transactional upsertMany.
  upsertMany(db, results)
  return { embedded: results.length, skipped: 0 }
}
