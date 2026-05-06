// Vector similarity helpers used for top-k retrieval.

export function cosineSim(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < len; i++) {
    const ai = a[i]
    const bi = b[i]
    dot += ai * bi
    magA += ai * ai
    magB += bi * bi
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export interface ScoredCandidate {
  id: string
  score: number
}

export function topK(
  query: number[],
  candidates: { id: string; vector: number[] }[],
  k: number,
): ScoredCandidate[] {
  if (!candidates.length || k <= 0) return []
  const scored: ScoredCandidate[] = candidates.map((c) => ({
    id: c.id,
    score: cosineSim(query, c.vector),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, k)
}
