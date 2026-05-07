// Defensive TipTap-shape extraction + sanitisation for AI-generated bodies.
//
// The Gemini mapping step is told to emit a `body` array of TipTap block
// nodes, but in practice it sometimes returns:
//   - a TipTap doc-wrapper { type: "doc", content: [...] }
//   - a top-level `content` array instead of `body`
//   - paragraph nodes with { text: "..." } shorthand instead of
//     { content: [{ type: "text", text: "..." }] }
//   - blocks with unknown types from a markdown-flavoured shape
//
// extractBodyContent + sanitizeNodes turn whatever Gemini gave us into
// something the editor's setContent can render without silently dropping
// the document. buildFallbackBody is the rope used when sanitisation
// produces an empty array.

export interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

const ALLOWED_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "callout",
  "ppe",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
])

const TEXT_CONTAINER_TYPES = new Set([
  "paragraph",
  "heading",
  "codeBlock",
  "tableHeader",
  "tableCell",
  "blockquote",
])

const ALLOWED_INLINE_TYPES = new Set(["text", "hardBreak"])

const ALLOWED_MARK_TYPES = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
])

// Walk the AI-returned object looking for the body array. Tries the canonical
// path (.body) first, then the TipTap doc-wrapper conventions, then a few
// alternative key names Gemini sometimes invents.
export function extractBodyContent(mapped: unknown): unknown[] {
  if (!mapped || typeof mapped !== "object") return []
  const m = mapped as Record<string, unknown>

  if (Array.isArray(m.body)) return m.body

  if (m.body && typeof m.body === "object") {
    const inner = (m.body as Record<string, unknown>).content
    if (Array.isArray(inner)) return inner
  }

  if (m.type === "doc" && Array.isArray(m.content)) return m.content

  if (Array.isArray(m.content)) return m.content

  for (const key of ["blocks", "nodes", "tiptap", "document"]) {
    const v = m[key]
    if (Array.isArray(v)) return v
    if (v && typeof v === "object") {
      const inner = (v as Record<string, unknown>).content
      if (Array.isArray(inner)) return inner
    }
  }

  return []
}

interface SanitiseResult {
  nodes: TiptapNode[]
  droppedCount: number
  normalisedCount: number
}

export function sanitizeNodes(input: unknown[]): SanitiseResult {
  const out: TiptapNode[] = []
  let dropped = 0
  let normalised = 0

  for (const raw of input) {
    if (typeof raw === "string") {
      const text = raw.trim()
      if (text) {
        out.push({
          type: "paragraph",
          content: [{ type: "text", text }],
        })
        normalised += 1
      }
      continue
    }
    const node = sanitizeBlock(raw)
    if (!node) {
      dropped += 1
      continue
    }
    out.push(node.node)
    normalised += node.normalised ? 1 : 0
  }

  return { nodes: out, droppedCount: dropped, normalisedCount: normalised }
}

interface NodeOk {
  node: TiptapNode
  normalised: boolean
}

function sanitizeBlock(raw: unknown): NodeOk | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  let type = typeof r.type === "string" ? r.type : null
  if (!type) return null

  // Common alias normalisation.
  if (type === "ordered_list") type = "orderedList"
  if (type === "bullet_list") type = "bulletList"
  if (type === "list_item") type = "listItem"
  if (type === "code_block") type = "codeBlock"
  if (type === "horizontal_rule") type = "horizontalRule"
  if (type === "hard_break") type = "hardBreak"

  if (!ALLOWED_BLOCK_TYPES.has(type)) return null

  let normalised = false
  const node: TiptapNode = { type }

  if (r.attrs && typeof r.attrs === "object") {
    node.attrs = { ...(r.attrs as Record<string, unknown>) }
  }

  // Heading attrs: clamp level to 1..3.
  if (type === "heading") {
    const rawLevel = (node.attrs?.level ?? 2) as number
    const level = Math.max(1, Math.min(3, Number(rawLevel) || 2))
    node.attrs = { ...(node.attrs ?? {}), level }
  }

  // Shorthand: { type: "paragraph", text: "..." } → wrap into a text node.
  if (TEXT_CONTAINER_TYPES.has(type) && typeof r.text === "string") {
    const t = r.text.trim()
    node.content = t ? [{ type: "text", text: r.text }] : []
    normalised = true
    return { node, normalised }
  }

  // listItem shorthand: { type: "listItem", text: "..." } → wrap with paragraph.
  if (type === "listItem" && typeof r.text === "string") {
    node.content = [
      {
        type: "paragraph",
        content: [{ type: "text", text: r.text }],
      },
    ]
    normalised = true
    return { node, normalised }
  }

  // listItem must contain at least one paragraph; if children are inline-only
  // (text / hardBreak), wrap them into a paragraph.
  if (Array.isArray(r.content)) {
    if (TEXT_CONTAINER_TYPES.has(type)) {
      node.content = sanitizeInlineContent(r.content)
    } else if (type === "listItem") {
      const children = sanitizeListItemContent(r.content)
      if (children.normalised) normalised = true
      node.content = children.nodes
    } else {
      const children: TiptapNode[] = []
      for (const child of r.content) {
        const c = sanitizeBlock(child)
        if (c) {
          children.push(c.node)
          if (c.normalised) normalised = true
        }
      }
      node.content = children
    }
  }

  // PPE atom block: items array on attrs, no content needed.
  if (type === "ppe") {
    const items = node.attrs?.items
    if (!Array.isArray(items)) {
      node.attrs = { items: [] }
    }
    delete node.content
    return { node, normalised }
  }

  // Horizontal rule + hardBreak are leaf nodes.
  if (type === "horizontalRule" || type === "hardBreak") {
    delete node.content
    return { node, normalised }
  }

  // Bullet/ordered lists must contain only listItem children. Drop strays.
  if (type === "bulletList" || type === "orderedList") {
    const items = (node.content ?? []).filter((c) => c.type === "listItem")
    if (items.length === 0) return null
    node.content = items
  }

  // Empty paragraph after sanitisation is fine — TipTap allows empty paragraphs.
  if (TEXT_CONTAINER_TYPES.has(type) && !node.content) node.content = []

  return { node, normalised }
}

function sanitizeListItemContent(content: unknown[]): {
  nodes: TiptapNode[]
  normalised: boolean
} {
  // listItem in TipTap expects block children (typically a paragraph).
  // If the model produced inline text directly, wrap it in a paragraph.
  let normalised = false
  const blocks: TiptapNode[] = []
  const inlineBuffer: TiptapNode[] = []

  function flushInline() {
    if (inlineBuffer.length === 0) return
    blocks.push({ type: "paragraph", content: inlineBuffer.splice(0) })
    normalised = true
  }

  for (const raw of content) {
    if (typeof raw === "string") {
      const t = raw.trim()
      if (t) inlineBuffer.push({ type: "text", text: raw })
      continue
    }
    if (!raw || typeof raw !== "object") continue
    const r = raw as Record<string, unknown>
    const type = typeof r.type === "string" ? r.type : null
    if (!type) continue
    if (ALLOWED_INLINE_TYPES.has(type)) {
      const inline = sanitizeInlineContent([raw])
      inlineBuffer.push(...inline)
      continue
    }
    flushInline()
    const block = sanitizeBlock(raw)
    if (block) blocks.push(block.node)
  }
  flushInline()

  return { nodes: blocks, normalised }
}

function sanitizeInlineContent(content: unknown[]): TiptapNode[] {
  const out: TiptapNode[] = []
  for (const raw of content) {
    if (typeof raw === "string") {
      if (raw.length > 0) out.push({ type: "text", text: raw })
      continue
    }
    if (!raw || typeof raw !== "object") continue
    const r = raw as Record<string, unknown>
    const type = typeof r.type === "string" ? r.type : null
    if (!type || !ALLOWED_INLINE_TYPES.has(type)) continue

    if (type === "text") {
      const text = typeof r.text === "string" ? r.text : null
      if (!text) continue
      const node: TiptapNode = { type: "text", text }
      if (Array.isArray(r.marks)) {
        const marks = sanitizeMarks(r.marks)
        if (marks.length > 0) node.marks = marks
      }
      out.push(node)
    } else if (type === "hardBreak") {
      out.push({ type: "hardBreak" })
    }
  }
  return out
}

function sanitizeMarks(
  raw: unknown[],
): Array<{ type: string; attrs?: Record<string, unknown> }> {
  const out: Array<{ type: string; attrs?: Record<string, unknown> }> = []
  for (const m of raw) {
    if (!m || typeof m !== "object") continue
    const obj = m as Record<string, unknown>
    const type = typeof obj.type === "string" ? obj.type : null
    if (!type || !ALLOWED_MARK_TYPES.has(type)) continue
    const mark: { type: string; attrs?: Record<string, unknown> } = { type }
    if (obj.attrs && typeof obj.attrs === "object") {
      mark.attrs = obj.attrs as Record<string, unknown>
    }
    out.push(mark)
  }
  return out
}

// Deterministic per-page paragraph fallback when AI mapping returns nothing
// usable. Better than an empty document — gives the user the source text to
// edit, with a clear callout that the structuring pass failed.
export function buildFallbackBody(
  pages: Array<{ pageNumber: number; text: string }>,
  filename: string,
): TiptapNode[] {
  const nodes: TiptapNode[] = []

  nodes.push({
    type: "callout",
    attrs: { tone: "warning" },
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "AI structural mapping returned no usable blocks for this import. The verbatim per-page text below is a deterministic fallback so the document is editable. Re-run AI mapping from the import wizard, or restructure manually.",
          },
        ],
      },
    ],
  })

  nodes.push({
    type: "heading",
    attrs: { level: 1 },
    content: [
      {
        type: "text",
        text: filename.replace(/\.[^.]+$/, ""),
      },
    ],
  })

  for (const page of pages) {
    nodes.push({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: `Page ${page.pageNumber}` }],
    })
    const lines = page.text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length === 0) {
      nodes.push({
        type: "paragraph",
        content: [
          { type: "text", text: "(no extractable text on this page)" },
        ],
      })
      continue
    }
    for (const line of lines) {
      nodes.push({
        type: "paragraph",
        content: [{ type: "text", text: line }],
      })
    }
  }

  return nodes
}
