// Streaming Q&A.
//
// Pipeline per question:
//   1. Maybe build a SCOPE OVERVIEW block. For library scope it's only
//      injected when the question looks inventory/overview-shaped — otherwise
//      the model would parrot the inventory back as part of its answer. For
//      doc/asset scopes the overview is small and useful for grounding so
//      it's always included.
//   2. Retrieve top-k chunks for the user query inside the scope. K is
//      scope-aware (library is tighter to focus the answer).
//   3. Compose: optional SCOPE OVERVIEW + EXCERPTS + QUESTION.
//   4. Stream Gemini's response. Yields {delta} per token chunk and a final
//      {done, citations} once streaming completes.
//
// Citations use plain `[1]`, `[2]`, … bracket form. The Markdown renderer
// post-processes these into clickable footnote anchors that scroll to the
// matching pill in the Sources block. Don't change the bracket shape
// without updating MessageContent.tsx.

import type { Database } from "sql.js"
import type { Citation, CitationOrigin, QaMessage } from "@/types"
import { getDocument, listDocumentsForAsset } from "@/db/repositories/documents"
import { CHAT_MODEL, getClient } from "./gemini"
import { retrieveForQuery, type Scope } from "./retrieval"
import { buildScopeContext } from "./context"

export interface AskChunkEvent {
  delta?: string
  done?: boolean
  citations?: Citation[]
}

export interface AskOptions {
  /** Caps how many prior turns are replayed. Default 6. */
  historyLimit?: number
  /** Cancel the underlying generateContentStream. */
  signal?: AbortSignal
}

const SYSTEM_INSTRUCTION = [
  "You are IDA, the Q&A assistant inside Oppr DOCS — a manufacturing knowledge base.",
  "You may receive two grounding blocks for every question:",
  "  • SCOPE OVERVIEW — a deterministic, factual summary of what exists in the current scope (only when relevant).",
  "  • EXCERPTS — the chunks that are most semantically similar to the question, numbered [1], [2], …",
  "Hard rules:",
  "  • Answer the user's question directly. Be concise. Operators are on the floor.",
  "  • DO NOT recite the SCOPE OVERVIEW back. DO NOT include phrases like 'Total Inventory', 'Document Scope Summary', 'Documents:', 'Assets:'. The UI already shows that data — don't restate it.",
  "  • Use EXCERPTS for specifics (steps, values, procedures). Cite each excerpt you actually use as `[1]`, `[2]`, … in plain brackets. Do not write Markdown footnotes.",
  "  • For subjective questions ('most interesting', 'best', 'recommend'), pick ONE answer with at most one short sentence of justification. Do not enumerate alternatives.",
  "  • For inventory/listing questions ('list every SOP', 'how many docs', 'which assets'), answer with a tight Markdown list — no preamble, no totals paragraph.",
  "  • Format with Markdown: bold, lists, short headings. Keep entity codes (HOL-OPS-SOP-0001, RMR-101, HOL-OPS-LOG-0001) verbatim — the UI auto-links them.",
  "  • If neither block has the answer, say so plainly in one sentence. Do not invent facts.",
  "  • Never apologize. Never refer to 'the excerpts' or 'the scope overview'. Just answer.",
].join("\n")

// Heuristic: is this question asking about inventory/structure rather than
// content? Used only for library scope. Doc and asset scopes always get the
// overview because it's tiny and ground-truth-y for those entities.
const INVENTORY_QUESTION_RE =
  /\b(list|every|all\s+(?:doc|sop|manual|asset|log|file)|how\s+many|which\s+(?:doc|sop|asset|log)|what\s+(?:doc|sop|asset|log|files?)\s+(?:do|are|exist)|inventory|catalog|summary|overview)\b/i

function shouldIncludeScopeOverview(scope: Scope, question: string): boolean {
  if (scope.kind !== "library") return true
  return INVENTORY_QUESTION_RE.test(question)
}

// Scope-aware top-K. Library casts a wider net but we want a tighter slice
// so the answer stays focused on the most-relevant 3 sources. Doc/asset are
// already narrow pools, 6 is fine.
function topKForScope(scope: Scope): number {
  return scope.kind === "library" ? 3 : 6
}

function cleanSection(
  section: string | null,
  title: string,
  namingCode: string,
): string | null {
  if (!section) return null
  const s = section.trim()
  if (!s) return null
  // Drop sections that just repeat the doc title or naming code — cited
  // chunks like "title · title" are noise.
  const t = title.trim().toLowerCase()
  const sLower = s.toLowerCase()
  if (sLower === t) return null
  if (t && sLower.startsWith(t)) return null
  if (sLower === namingCode.trim().toLowerCase()) return null
  return s
}

function buildContextBlock(
  chunks: { id: string; text: string; document_id: string; page_or_section: string | null }[],
  titleByDocId: Map<string, string>,
  codeByDocId: Map<string, string>,
): string {
  if (!chunks.length) return "(no excerpts available)"
  return chunks
    .map((c, i) => {
      const title = titleByDocId.get(c.document_id) ?? "(unknown document)"
      const code = codeByDocId.get(c.document_id) ?? ""
      const section = cleanSection(c.page_or_section, title, code)
      const loc = section ? ` — ${section}` : ""
      const header = code ? `${code} · ${title}${loc}` : `${title}${loc}`
      return `[${i + 1}] ${header}\n${c.text}`
    })
    .join("\n\n")
}

function historyToGeminiContents(history: QaMessage[]) {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }))
}

/**
 * Ask a question scoped to a doc, asset, or the whole library. Yields
 * {delta} for each token chunk and a final {done: true, citations} once
 * streaming completes. Pass `options.signal` to cancel mid-stream.
 */
export async function* askQuestion(
  db: Database,
  scope: Scope,
  question: string,
  history: QaMessage[] = [],
  options: AskOptions = {},
): AsyncGenerator<AskChunkEvent, void, unknown> {
  const { historyLimit = 6, signal } = options

  const includeOverview = shouldIncludeScopeOverview(scope, question)
  const scopeCtx = includeOverview ? buildScopeContext(db, scope) : null
  const retrieval = await retrieveForQuery(db, question, scope, topKForScope(scope))

  // Doc-title + naming-code lookup so each citation has a human label.
  const docIds = Array.from(new Set(retrieval.chunks.map((c) => c.document_id)))
  const titleByDocId = new Map<string, string>()
  const codeByDocId = new Map<string, string>()
  for (const id of docIds) {
    const d = getDocument(db, id)
    if (d) {
      titleByDocId.set(id, d.title)
      codeByDocId.set(id, d.naming_code)
    }
  }

  const contextBlock = buildContextBlock(retrieval.chunks, titleByDocId, codeByDocId)

  const promptParts: string[] = []
  if (scopeCtx) {
    promptParts.push(`SCOPE OVERVIEW:\n${scopeCtx.text}`, "")
  }
  promptParts.push(
    `EXCERPTS:\n${contextBlock}`,
    "",
    `QUESTION: ${question}`,
    "",
    "Answer the question directly. Cite specifics with [1], [2], etc. Do not summarize what's available — just answer.",
  )
  const userPrompt = promptParts.join("\n")

  const client = getClient()
  const model = client.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  })

  // Filter out error/aborted assistant turns so they don't pollute the
  // model's view of the conversation. The UI still shows them.
  const cleanHistory = history.filter((m) => {
    if (m.role !== "assistant") return true
    const t = m.text.trim()
    if (!t) return false
    if (t === "(stopped)" || t === "(no response)") return false
    if (t.startsWith("Error:")) return false
    return true
  })

  const trimmedHistory =
    historyLimit > 0 ? cleanHistory.slice(-historyLimit) : []

  const contents = [
    ...historyToGeminiContents(trimmedHistory),
    { role: "user" as const, parts: [{ text: userPrompt }] },
  ]

  const stream = await model.generateContentStream({ contents })

  try {
    for await (const chunk of stream.stream) {
      if (signal?.aborted) {
        // We can't truly cancel the wire request, but we stop yielding deltas
        // so the UI freezes the visible response and discards the rest.
        break
      }
      const delta = chunk.text()
      if (delta) yield { delta }
    }
  } finally {
    // No SDK-level cancel call available; the generator's `return()` will
    // cause the consumer to stop awaiting once we exit.
  }

  // For asset scope, build the set of doc IDs actually linked to that asset
  // so each citation can be tagged "asset-link" (normal) or "cross-link"
  // (rare — usually a stale IndexedDB symptom).
  const assetLinkedDocIds =
    scope.kind === "asset"
      ? new Set(listDocumentsForAsset(db, scope.id).map((d) => d.id))
      : null

  const citations: Citation[] = retrieval.chunks.map((c) => {
    const title = titleByDocId.get(c.document_id) ?? "(unknown)"
    const code = codeByDocId.get(c.document_id) ?? ""
    let origin: CitationOrigin = "asset-link"
    if (assetLinkedDocIds && !assetLinkedDocIds.has(c.document_id)) {
      origin = "cross-link"
    }
    return {
      document_id: c.document_id,
      document_title: title,
      chunk_id: c.id,
      page_or_section: cleanSection(c.page_or_section, title, code),
      excerpt: c.text.length > 320 ? `${c.text.slice(0, 320)}…` : c.text,
      origin,
    }
  })

  yield { done: true, citations }
}

/**
 * Plain prompt -> string. No retrieval, no streaming. Used by the Settings
 * page to verify the generative model independently of the RAG pipeline.
 */
export async function generate(prompt: string): Promise<string> {
  const client = getClient()
  const model = client.getGenerativeModel({ model: CHAT_MODEL })
  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  })
  return res.response.text()
}
