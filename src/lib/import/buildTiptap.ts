// Minimal, generic PDF-layout → TipTap builder.
//
// Deliberately small. The importer's job is to get the text and images out of
// a digital PDF and into the editor as a pre-draft the user shapes by hand —
// not to reconstruct the original document. So we map only what we can detect
// reliably from pdf.js layout data:
//
//   - font-size clustering → heading levels (1..3)
//   - everything else      → paragraphs, with line-merging by vertical gap
//   - extracted images     → a trailing "Imported figures" section
//
// Deliberately deferred (need more than layout positions to do well):
//   - inline bold / italic — pdf.js item.fontName is an internal ref, not a
//     weight; resolving real weights needs page.commonObjs lookups.
//   - body tables — clusterRows gives rows, not columns; column reconstruction
//     is a separate pass. Authored tables stay as paragraphs for now.

import type { LayoutTextItem, PageLayout } from "./extractPdf"

type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
}

const MAX_HEADING_LEVELS = 3
// Imported images land small (a percentage of the column width). Authors scale
// up the few that matter rather than shrinking every full-bleed figure. Must be
// a multiple of 5 — ImageWithRef snaps width to 5% steps.
const IMPORTED_IMAGE_WIDTH = 35
// A row is only a heading candidate if it's short — headings aren't paragraphs.
const MAX_HEADING_CHARS = 120
// Vertical gap (in multiples of line height) above which we start a new
// paragraph rather than continuing the current one.
const PARAGRAPH_GAP_FACTOR = 1.8

interface Row {
  text: string
  size: number // dominant font size, rounded
  y: number
  height: number
  page: number
}

export function buildTiptapFromLayout(opts: {
  pageLayouts: PageLayout[]
  images: Array<{ pageNumber: number; hintAlt: string }>
  imageIdsByOrder: string[]
}): { type: "doc"; content: TiptapNode[] } {
  const rows = collectRows(opts.pageLayouts)
  const bodySize = dominantSize(opts.pageLayouts)
  const headingSizes = headingSizeRanks(rows, bodySize)

  const out: TiptapNode[] = []
  let paragraphBuffer = ""
  let prevY: number | null = null
  let prevPage: number | null = null
  let prevHeight = bodySize

  const flushParagraph = () => {
    const text = paragraphBuffer.replace(/\s+/g, " ").trim()
    if (text.length > 0) out.push(paragraph(text))
    paragraphBuffer = ""
  }

  for (const row of rows) {
    const level = headingLevel(row, headingSizes)
    if (level !== null) {
      flushParagraph()
      out.push(heading(level, row.text))
      prevY = null
      prevPage = row.page
      prevHeight = row.height
      continue
    }

    // Paragraph row. Start a new paragraph on a page break or a large vertical
    // gap from the previous line; otherwise continue the running paragraph.
    const pageBreak = prevPage !== null && row.page !== prevPage
    const gap = prevY !== null ? prevY - row.y : 0
    const bigGap = prevY !== null && gap > prevHeight * PARAGRAPH_GAP_FACTOR
    if (pageBreak || bigGap) flushParagraph()

    paragraphBuffer = paragraphBuffer ? `${paragraphBuffer} ${row.text}` : row.text
    prevY = row.y
    prevPage = row.page
    prevHeight = row.height
  }
  flushParagraph()

  // Trailing figures. The user drags these into place; the data-image-id
  // binding survives the move.
  const figureBlocks: TiptapNode[] = []
  opts.images.forEach((img, i) => {
    const imageId = opts.imageIdsByOrder[i] ?? null
    figureBlocks.push(image(imageId, img.hintAlt))
  })
  if (figureBlocks.length > 0) {
    out.push(heading(2, "Imported figures"))
    out.push(...figureBlocks)
  }

  if (out.length === 0) out.push({ type: "paragraph" })
  return { type: "doc", content: out }
}

// ---------------------------------------------------------------------------

function collectRows(pageLayouts: PageLayout[]): Row[] {
  const rows: Row[] = []
  for (const page of pageLayouts) {
    for (const row of page.rows) {
      const text = row
        .map((it) => it.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
      if (text.length === 0) continue
      rows.push({
        text,
        size: charWeightedSize(row),
        y: row[0]?.y ?? 0,
        height: medianHeight(row),
        page: page.pageNumber,
      })
    }
  }
  return rows
}

// Body font size = the rounded size carrying the most characters across the
// whole document. Headings are sizes meaningfully larger than this.
function dominantSize(pageLayouts: PageLayout[]): number {
  const weight = new Map<number, number>()
  for (const page of pageLayouts) {
    for (const it of page.items) {
      const s = Math.round(it.fontSize)
      if (s <= 0) continue
      weight.set(s, (weight.get(s) ?? 0) + Math.max(1, it.text.length))
    }
  }
  let best = 0
  let bestW = -1
  for (const [size, w] of weight) {
    if (w > bestW) {
      best = size
      bestW = w
    }
  }
  return best || 10
}

// The distinct heading sizes, largest first, capped at MAX_HEADING_LEVELS. A
// size qualifies if it's both at least one point and ~15% larger than body.
function headingSizeRanks(rows: Row[], bodySize: number): number[] {
  const threshold = Math.max(bodySize + 1, bodySize * 1.15)
  const sizes = new Set<number>()
  for (const r of rows) {
    if (r.text.length <= MAX_HEADING_CHARS && r.size >= threshold) {
      sizes.add(r.size)
    }
  }
  return [...sizes].sort((a, b) => b - a).slice(0, MAX_HEADING_LEVELS)
}

function headingLevel(row: Row, headingSizes: number[]): 1 | 2 | 3 | null {
  if (row.text.length > MAX_HEADING_CHARS) return null
  const idx = headingSizes.indexOf(row.size)
  if (idx < 0) return null
  return (Math.min(idx + 1, MAX_HEADING_LEVELS) as 1 | 2 | 3)
}

// The rounded size that carries the most characters in a row — robust to a
// large drop-cap or a trailing footnote marker skewing a max/min.
function charWeightedSize(row: LayoutTextItem[]): number {
  const weight = new Map<number, number>()
  for (const it of row) {
    const s = Math.round(it.fontSize)
    if (s <= 0) continue
    weight.set(s, (weight.get(s) ?? 0) + Math.max(1, it.text.length))
  }
  let best = 0
  let bestW = -1
  for (const [size, w] of weight) {
    if (w > bestW) {
      best = size
      bestW = w
    }
  }
  return best || 10
}

function medianHeight(row: LayoutTextItem[]): number {
  const hs = row.map((it) => it.height || it.fontSize || 10).sort((a, b) => a - b)
  return hs[Math.floor(hs.length / 2)] || 10
}

// ---------------------------------------------------------------------------

function heading(level: 1 | 2 | 3, text: string): TiptapNode {
  return { type: "heading", attrs: { level }, content: [{ type: "text", text }] }
}

function paragraph(text: string): TiptapNode {
  return { type: "paragraph", content: [{ type: "text", text }] }
}

function image(imageId: string | null, alt: string): TiptapNode {
  const attrs: Record<string, unknown> = {
    src: "",
    alt,
    width: IMPORTED_IMAGE_WIDTH,
    align: "center",
  }
  if (imageId) attrs["data-image-id"] = imageId
  return { type: "image", attrs }
}
