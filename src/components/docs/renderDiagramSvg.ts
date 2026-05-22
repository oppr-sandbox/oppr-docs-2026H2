// renderDiagramSvg — pure DiagramModel -> SVG string.
//
// This is the trust boundary (see /analysis/diagram-builder § Safety): the only
// way model data becomes markup. Every label is XML-escaped here; the output is
// a closed set of elements (image / rect / polygon / line / text / marker). No
// script, no foreignObject, no event attributes. The same string is cached into
// the DiagramNode's data-svg, so the read view and PDF export consume it
// unchanged.
//
// v3: optional background <image> (a floorplan etc.) the shapes overlay, and
// free-standing arrows (color + thickness). The viewBox auto-crops to content,
// or to the background image when one is set, so the figure scales to document
// width with nothing chopped — and the background + overlays scale together.
//
// NOTE: a background image is referenced by its Convex storage URL, not embedded.
// It is NOT yet tracked in imageUsages, so deleting it from the image library
// would break this diagram. Flagged in /analysis/diagram-builder (v3); wiring
// usage is a separate task.

import {
  ARROW_COLORS,
  ARROW_WIDTHS,
  DIAGRAM_TINTS,
  contentBounds,
  edgePath,
  nodeCenter,
  nodeTextRows,
  type DiagramArrow,
  type DiagramModel,
  type DiagramModelNode,
} from "./diagramModel"

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Small QR-ish glyph so an asset box reads as an asset at a glance.
function assetGlyph(x: number, y: number, color: string): string {
  const cells = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [2, 1],
    [0, 2], [1, 2], [2, 2],
  ]
  const s = 3
  return cells
    .map(([cx, cy]) => `<rect x="${x + cx * (s + 1)}" y="${y + cy * (s + 1)}" width="${s}" height="${s}" fill="${color}"/>`)
    .join("")
}

function labelLinesMarkup(n: DiagramModelNode, color: string): string {
  const { cx } = nodeCenter(n)
  const rows = nodeTextRows(n)
  const lines = rows.lines
    .map((ln, i) => `<text x="${cx}" y="${(rows.firstY + i * rows.lh).toFixed(1)}" fill="${color}" font-weight="600">${esc(ln)}</text>`)
    .join("")
  const code =
    rows.code && rows.codeY !== null
      ? `<text x="${cx}" y="${rows.codeY.toFixed(1)}" fill="${color}" font-size="11" font-family="ui-monospace, monospace">${esc(rows.code)}</text>`
      : ""
  return lines + code
}

function nodeMarkup(n: DiagramModelNode): string {
  const t = DIAGRAM_TINTS[n.tint] ?? DIAGRAM_TINTS.slate
  const { cx, cy } = nodeCenter(n)

  if (n.kind === "text") {
    return labelLinesMarkup(n, t.text)
  }

  const common = `fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.5"`
  let shape: string
  if (n.kind === "decision") {
    const pts = `${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}`
    shape = `<polygon points="${pts}" ${common}/>`
  } else if (n.kind === "terminator") {
    shape = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.h / 2}" ${common}/>`
  } else {
    shape = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" ${common}/>`
  }

  const glyph = n.kind === "asset" ? assetGlyph(n.x + 8, n.y + 8, t.text) : ""
  return shape + glyph + labelLinesMarkup(n, t.text)
}

function arrowMarkup(a: DiagramArrow): string {
  const color = ARROW_COLORS[a.color] ?? ARROW_COLORS.red
  const width = ARROW_WIDTHS[a.width] ?? ARROW_WIDTHS.med
  return `<line x1="${a.x1.toFixed(1)}" y1="${a.y1.toFixed(1)}" x2="${a.x2.toFixed(1)}" y2="${a.y2.toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#dg-arrow-cs)"/>`
}

export function renderDiagramSvg(model: DiagramModel): string {
  const byId = new Map(model.nodes.map((n) => [n.id, n]))
  const b = contentBounds(model)

  const bg = model.background
    ? `<image href="${esc(model.background.url)}" x="${model.background.x.toFixed(1)}" y="${model.background.y.toFixed(1)}" width="${model.background.w.toFixed(1)}" height="${model.background.h.toFixed(1)}" preserveAspectRatio="xMidYMid meet"/>`
    : ""

  const edges = model.edges
    .map((e) => {
      const from = byId.get(e.from)
      const to = byId.get(e.to)
      if (!from || !to) return ""
      const { d, mid } = edgePath(from, to, e)
      const line = `<path d="${d}" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#dg-arrow)"/>`
      if (!e.label) return line
      return (
        line +
        `<text x="${mid.x.toFixed(1)}" y="${(mid.y - 4).toFixed(1)}" fill="#475569" font-size="11" text-anchor="middle">${esc(e.label)}</text>`
      )
    })
    .join("")

  const nodes = model.nodes.map(nodeMarkup).join("")
  const arrows = model.arrows.map(arrowMarkup).join("")

  return (
    `<svg viewBox="${b.x.toFixed(0)} ${b.y.toFixed(0)} ${b.w.toFixed(0)} ${b.h.toFixed(0)}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="w-full h-auto">` +
    `<defs>` +
    `<marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#475569"/></marker>` +
    `<marker id="dg-arrow-cs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>` +
    `</defs>` +
    bg +
    `<g font-family="ui-sans-serif, system-ui" font-size="13" text-anchor="middle">` +
    edges +
    nodes +
    arrows +
    `</g></svg>`
  )
}
