// Chunking helpers for document content.
//
// Two flavours:
//
// 1. `chunksFromTipTap(json)` — walks a TipTap JSON document and produces
//    one chunk per paragraph / list item / heading. Section labels track the
//    most recent heading the chunk lives under.
// 2. `chunksFromPdfPages(pages)` — given an array of per-page strings,
//    splits each page on blank lines (\n\n) and emits chunks tagged with
//    `Page N`. Chunks larger than `MAX_CHARS` are split on paragraph
//    boundaries.

import type { Chunk } from "@/types"

const MIN_CHARS = 1
const MAX_CHARS = 800

interface RawChunk {
  text: string
  section: string | null
}

interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
}

/** Concatenate plain text from a TipTap inline subtree. */
function inlineText(node: TipTapNode | undefined): string {
  if (!node) return ""
  if (node.type === "text") return node.text ?? ""
  if (!node.content) return ""
  return node.content.map(inlineText).join("")
}

function blockText(node: TipTapNode): string {
  if (!node.content) return ""
  return node.content.map(inlineText).join("").trim()
}

/** Walk a TipTap doc and pull out chunkable text by block. */
export function chunksFromTipTap(json: unknown): RawChunk[] {
  const out: RawChunk[] = []
  let section: string | null = null
  const root = json as TipTapNode | null
  if (!root || !root.content) return out

  function visit(nodes: TipTapNode[]): void {
    for (const node of nodes) {
      if (node.type === "heading") {
        const text = blockText(node)
        if (text) {
          section = text
          out.push({ text, section })
        }
      } else if (node.type === "paragraph" || node.type === "blockquote") {
        const text = blockText(node)
        if (text.length >= MIN_CHARS) out.push({ text, section })
      } else if (node.type === "bulletList" || node.type === "orderedList") {
        for (const item of node.content ?? []) {
          // Each listItem usually wraps a paragraph; flatten its text.
          const itemText = (item.content ?? [])
            .map((inner) => blockText(inner))
            .filter(Boolean)
            .join(" ")
          if (itemText.length >= MIN_CHARS) out.push({ text: itemText, section })
        }
      } else if (node.type === "codeBlock") {
        const text = blockText(node)
        if (text) out.push({ text, section })
      } else if (node.type === "table") {
        // Flatten table cells into one chunk per row.
        for (const row of node.content ?? []) {
          const cells = (row.content ?? [])
            .map((cell) => blockText(cell))
            .filter(Boolean)
          if (cells.length) out.push({ text: cells.join(" | "), section })
        }
      } else if (node.content) {
        visit(node.content)
      }
    }
  }

  visit(root.content)
  return splitLong(out)
}

/** PDF page → chunks split on blank lines. */
export function chunksFromPdfPages(pages: string[]): RawChunk[] {
  const out: RawChunk[] = []
  pages.forEach((page, idx) => {
    const section = `Page ${idx + 1}`
    const paragraphs = page
      .split(/\n\s*\n/g)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length >= MIN_CHARS)
    for (const p of paragraphs) out.push({ text: p, section })
  })
  return splitLong(out)
}

/** Break paragraphs longer than MAX_CHARS into sentence-ish pieces. */
function splitLong(input: RawChunk[]): RawChunk[] {
  const out: RawChunk[] = []
  for (const c of input) {
    if (c.text.length <= MAX_CHARS) {
      out.push(c)
      continue
    }
    // Greedy split on sentence boundaries, falling back to fixed-width.
    const sentences = c.text.match(/[^.!?]+[.!?]?\s*/g) ?? [c.text]
    let buffer = ""
    for (const s of sentences) {
      if ((buffer + s).length > MAX_CHARS && buffer) {
        out.push({ text: buffer.trim(), section: c.section })
        buffer = s
      } else {
        buffer += s
      }
    }
    if (buffer.trim()) out.push({ text: buffer.trim(), section: c.section })
  }
  return out
}

/** Materialize raw chunks into Chunk rows ready for `chunks.insertMany`. */
export function buildChunkRows(
  documentId: string,
  version: number,
  raw: RawChunk[],
): Chunk[] {
  return raw.map((r, i) => ({
    id: `${documentId}-v${version}-c${i + 1}`,
    document_id: documentId,
    version,
    seq: i + 1,
    text: r.text,
    page_or_section: r.section,
  }))
}
