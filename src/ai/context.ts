// Per-scope context blocks injected into the system prompt before retrieval.
//
// The retrieval layer alone gives the model only the chunks similar to the
// question. For overview / inventory questions ("what docs do I have?",
// "list every SOP", "which assets does this doc cover?") that's the wrong
// shape — the model only sees what came back from cosine similarity.
//
// Each scope here builds a deterministic, factual, compact summary so the
// model can reason about what *exists*, not just what was retrieved.

import type { Database } from "sql.js"
import { listAssets, listAssetLogs } from "@/db/repositories/assets"
import {
  getDocumentWithAssets,
  listDocuments,
} from "@/db/repositories/documents"
import { listForDocument } from "@/db/repositories/chunks"
import type { Scope } from "./retrieval"

const MAX_HEADING_OUTLINE_ROWS = 30
const MAX_LIBRARY_DOCS_INLINE = 80

export interface ScopeContext {
  /** Plain-text block to inject before retrieval excerpts. */
  text: string
  /** Friendly scope label for the assistant header / system prompt. */
  label: string
}

export function buildScopeContext(db: Database, scope: Scope): ScopeContext {
  if (scope.kind === "library") return libraryContext(db)
  if (scope.kind === "asset") return assetContext(db, scope.id)
  return docContext(db, scope.id)
}

function libraryContext(db: Database): ScopeContext {
  const docs = listDocuments(db)
  const assets = listAssets(db)
  const lines: string[] = []

  lines.push(`LIBRARY INVENTORY — ${docs.length} document${docs.length === 1 ? "" : "s"}, ${assets.length} asset${assets.length === 1 ? "" : "s"}.`)
  lines.push("")
  lines.push("Documents:")
  for (const d of docs.slice(0, MAX_LIBRARY_DOCS_INLINE)) {
    const linkedAssets = listAssetCodesForDoc(db, d.id)
    const tail = linkedAssets.length ? ` · linked: ${linkedAssets.join(", ")}` : ""
    lines.push(
      `- ${d.naming_code} · ${d.title} · ${d.type.toUpperCase()} · ${d.status} · v${d.current_version}${tail}`,
    )
  }
  if (docs.length > MAX_LIBRARY_DOCS_INLINE) {
    lines.push(`- … ${docs.length - MAX_LIBRARY_DOCS_INLINE} more documents not listed`)
  }
  lines.push("")
  lines.push("Assets:")
  for (const a of assets) {
    lines.push(
      `- ${a.code} · ${a.name}${a.location ? ` · ${a.location}` : ""}${a.linked_log_code ? ` · log: ${a.linked_log_code}` : ""}`,
    )
  }

  return {
    text: lines.join("\n"),
    label: `Library · ${docs.length} doc${docs.length === 1 ? "" : "s"}`,
  }
}

function docContext(db: Database, id: string): ScopeContext {
  const doc = getDocumentWithAssets(db, id)
  if (!doc) {
    return { text: `DOCUMENT not found: ${id}`, label: "Document" }
  }

  const lines: string[] = []
  lines.push(
    `DOCUMENT: ${doc.naming_code} · ${doc.title} · ${doc.type.toUpperCase()} · ${doc.status} · v${doc.current_version}`,
  )
  if (doc.tags.length) lines.push(`Tags: ${doc.tags.join(", ")}`)
  if (doc.assets.length) {
    lines.push(
      `Linked assets: ${doc.assets.map((a) => `${a.code} (${a.name})`).join(", ")}`,
    )
  }

  // Outline: chunk page_or_section labels in document order — a cheap TOC.
  const chunks = listForDocument(db, doc.id, doc.current_version)
  const outline = chunkOutline(chunks)
  if (outline.length) {
    lines.push("")
    lines.push("Outline:")
    for (const o of outline.slice(0, MAX_HEADING_OUTLINE_ROWS)) {
      lines.push(`- ${o}`)
    }
    if (outline.length > MAX_HEADING_OUTLINE_ROWS) {
      lines.push(`- … ${outline.length - MAX_HEADING_OUTLINE_ROWS} more sections`)
    }
  }

  return { text: lines.join("\n"), label: `${doc.naming_code} · ${doc.title}` }
}

function assetContext(db: Database, id: string): ScopeContext {
  const asset = listAssets(db).find((a) => a.id === id)
  if (!asset) return { text: `ASSET not found: ${id}`, label: "Asset" }

  const lines: string[] = []
  lines.push(
    `ASSET: ${asset.code} · ${asset.name}${asset.location ? ` · ${asset.location}` : ""}`,
  )
  if (asset.description) lines.push(`Description: ${asset.description}`)

  // Documents linked to this asset.
  const allDocs = listDocuments(db)
  const docs = allDocs.filter((d) =>
    listAssetCodesForDoc(db, d.id).includes(asset.code),
  )
  if (docs.length) {
    lines.push("")
    lines.push(`Documents linked to this asset (${docs.length}):`)
    for (const d of docs) {
      lines.push(
        `- ${d.naming_code} · ${d.title} · ${d.type.toUpperCase()} · v${d.current_version}`,
      )
    }
  }

  // Logs.
  const logs = listAssetLogs(db, asset.id)
  if (logs.length) {
    lines.push("")
    lines.push(`Connected logs (${logs.length}):`)
    for (const l of logs) {
      lines.push(`- ${l.code} · ${l.name}${l.description ? ` — ${l.description}` : ""}`)
    }
  }

  return {
    text: lines.join("\n"),
    label: `${asset.code} · ${asset.name}`,
  }
}

function chunkOutline(
  chunks: { seq: number; page_or_section: string | null }[],
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of chunks) {
    const key = c.page_or_section?.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

/** Codes (e.g. "RMR-101") for every asset linked to a document. */
function listAssetCodesForDoc(db: Database, docId: string): string[] {
  const stmt = db.prepare(
    `SELECT a.code FROM assets a
       JOIN document_assets da ON da.asset_id = a.id
      WHERE da.document_id = ?
      ORDER BY a.code`,
  )
  const out: string[] = []
  try {
    stmt.bind([docId])
    while (stmt.step()) {
      const r = stmt.getAsObject() as { code: string }
      out.push(r.code)
    }
  } finally {
    stmt.free()
  }
  return out
}
