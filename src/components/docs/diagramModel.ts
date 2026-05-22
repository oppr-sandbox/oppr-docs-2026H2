// DiagramModel — the structured source of truth for builder-made diagrams.
//
// Decision 1 from /analysis/diagram-builder: the model is canonical, the SVG is
// derived (see renderDiagramSvg.ts). The DiagramNode caches the rendered SVG in
// data-svg so the read view + PDF export need no change, and stores this model
// in data-model so the builder can reopen and edit it.
//
// v3: an optional background image (floorplan etc.) the boxes/arrows overlay,
// free-standing arrows (color + thickness), a large 2400×1600 working canvas,
// and generic placeholder copy in templates. Everything lives in one SVG
// coordinate space, so when the figure renders at document width the background
// and the overlaid shapes scale together — reactive without a second
// coordinate system.

export type DiagramNodeKind = "process" | "decision" | "terminator" | "asset" | "text"

export type DiagramSide = "top" | "right" | "bottom" | "left"
export const DIAGRAM_SIDES: DiagramSide[] = ["top", "right", "bottom", "left"]

// Fixed, on-brand swatch set. No free-form color input — every fill is one of
// these so the output reads on both themes and stays consistent.
export const DIAGRAM_TINTS = {
  blue: { fill: "#dbeafe", stroke: "#1d4ed8", text: "#1e3a8a" },
  amber: { fill: "#fef3c7", stroke: "#b45309", text: "#78350f" },
  green: { fill: "#dcfce7", stroke: "#15803d", text: "#14532d" },
  violet: { fill: "#ede9fe", stroke: "#6d28d9", text: "#4c1d95" },
  red: { fill: "#fee2e2", stroke: "#b91c1c", text: "#7f1d1d" },
  slate: { fill: "#f1f5f9", stroke: "#334155", text: "#1e293b" },
} as const

export type DiagramTintKey = keyof typeof DIAGRAM_TINTS

// Free-arrow colors + thicknesses. Fixed sets, same reasoning as tints.
export const ARROW_COLORS = {
  red: "#dc2626",
  slate: "#475569",
  blue: "#1d4ed8",
  green: "#15803d",
  amber: "#b45309",
  black: "#111827",
} as const
export type ArrowColorKey = keyof typeof ARROW_COLORS

export const ARROW_WIDTHS = { thin: 1.5, med: 2.5, thick: 4 } as const
export type ArrowWidthKey = keyof typeof ARROW_WIDTHS

export interface DiagramModelNode {
  id: string
  kind: DiagramNodeKind
  x: number
  y: number
  w: number
  h: number
  label: string
  tint: DiagramTintKey
  /** Optional registry link, shown beneath the label on `asset` nodes. */
  assetCode?: string
}

export interface DiagramModelEdge {
  id: string
  from: string
  to: string
  /** Anchor sides. Undefined falls back to center-to-center clipping. */
  fromSide?: DiagramSide
  toSide?: DiagramSide
  /** Short branch label, e.g. "Yes" / "No". */
  label?: string
}

export interface DiagramArrow {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: ArrowColorKey
  width: ArrowWidthKey
}

// A background image is a placed, resizable, lockable element in world space —
// not the thing that sizes the canvas (see /analysis/diagram-builder-rebuild,
// Decision 2). When locked it renders behind everything and ignores pointer
// events so shapes can be drawn on top.
export interface DiagramBackground {
  url: string
  x: number
  y: number
  w: number
  h: number
  locked: boolean
}

/** Raw upload result; the builder decides where to place it in world space. */
export interface UploadedBackground {
  url: string
  naturalWidth: number
  naturalHeight: number
}

export interface DiagramModel {
  v: 1
  width: number
  height: number
  nodes: DiagramModelNode[]
  edges: DiagramModelEdge[]
  arrows: DiagramArrow[]
  background?: DiagramBackground | null
}

// Large working area — the user zooms/scrolls; output auto-crops to content
// (or to the background image when one is set).
export const DIAGRAM_CANVAS = { width: 2400, height: 1600 } as const
export const DIAGRAM_GRID = 10
export const DIAGRAM_CROP_PAD = 36

export const NODE_MIN = { w: 60, h: 32 }
export const NODE_MAX = { w: 480, h: 320 }

export const DEFAULT_NODE_TINT: Record<DiagramNodeKind, DiagramTintKey> = {
  process: "blue",
  decision: "red",
  terminator: "slate",
  asset: "green",
  text: "slate",
}

export const DEFAULT_NODE_SIZE: Record<
  DiagramNodeKind,
  { w: number; h: number }
> = {
  process: { w: 150, h: 64 },
  decision: { w: 160, h: 90 },
  terminator: { w: 150, h: 56 },
  asset: { w: 160, h: 72 },
  text: { w: 170, h: 44 },
}

const DEFAULT_LABEL: Record<DiagramNodeKind, string> = {
  process: "Step",
  decision: "Decision?",
  terminator: "Start",
  asset: "Equipment",
  text: "Text",
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function emptyDiagramModel(): DiagramModel {
  return {
    v: 1,
    width: DIAGRAM_CANVAS.width,
    height: DIAGRAM_CANVAS.height,
    nodes: [],
    edges: [],
    arrows: [],
    background: null,
  }
}

export function createNode(
  kind: DiagramNodeKind,
  x: number,
  y: number,
): DiagramModelNode {
  const size = DEFAULT_NODE_SIZE[kind]
  return {
    id: uid("n"),
    kind,
    x,
    y,
    w: size.w,
    h: size.h,
    label: DEFAULT_LABEL[kind],
    tint: DEFAULT_NODE_TINT[kind],
    ...(kind === "asset" ? { assetCode: "" } : {}),
  }
}

export function createEdge(
  from: string,
  to: string,
  fromSide?: DiagramSide,
  toSide?: DiagramSide,
): DiagramModelEdge {
  return { id: uid("e"), from, to, fromSide, toSide }
}

export function createArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): DiagramArrow {
  return { id: uid("a"), x1, y1, x2, y2, color: "red", width: "med" }
}

/**
 * Normalise a stored background to the placed-element shape. Legacy backgrounds
 * were `{ url, width, height }` (image sized the whole canvas); backfill them to
 * `{ url, x:0, y:0, w:width, h:height, locked:false }` so old diagrams reopen
 * and render identically.
 */
function normalizeBackground(bg: unknown): DiagramBackground | null {
  if (!bg || typeof bg !== "object") return null
  const o = bg as Record<string, unknown>
  if (typeof o.url !== "string") return null
  if (typeof o.w === "number" && typeof o.h === "number") {
    return {
      url: o.url,
      x: typeof o.x === "number" ? o.x : 0,
      y: typeof o.y === "number" ? o.y : 0,
      w: o.w,
      h: o.h,
      locked: o.locked === true,
    }
  }
  const w = typeof o.width === "number" ? o.width : 600
  const h = typeof o.height === "number" ? o.height : 400
  return { url: o.url, x: 0, y: 0, w, h, locked: false }
}

/** Best-effort parse of a stored model. Returns null for legacy svg-only nodes. */
export function parseDiagramModel(raw: unknown): DiagramModel | null {
  if (!raw) return null
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw
    if (obj && obj.v === 1 && Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
      // Normalise fields added in later versions.
      return {
        ...obj,
        arrows: Array.isArray(obj.arrows) ? obj.arrows : [],
        background: normalizeBackground(obj.background),
      } as DiagramModel
    }
  } catch {
    // fall through
  }
  return null
}

// --- geometry (shared by renderer + builder) --------------------------------

export function nodeCenter(n: DiagramModelNode): { cx: number; cy: number } {
  return { cx: n.x + n.w / 2, cy: n.y + n.h / 2 }
}

export function sideAnchor(
  n: DiagramModelNode,
  side: DiagramSide,
): { x: number; y: number } {
  const { cx, cy } = nodeCenter(n)
  switch (side) {
    case "top":
      return { x: cx, y: n.y }
    case "bottom":
      return { x: cx, y: n.y + n.h }
    case "left":
      return { x: n.x, y: cy }
    case "right":
      return { x: n.x + n.w, y: cy }
  }
}

// Point where the center→(tx,ty) ray exits the node's bounding box.
export function centerClip(
  n: DiagramModelNode,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const { cx, cy } = nodeCenter(n)
  const dx = tx - cx
  const dy = ty - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const scaleX = dx !== 0 ? n.w / 2 / Math.abs(dx) : Infinity
  const scaleY = dy !== 0 ? n.h / 2 / Math.abs(dy) : Infinity
  const s = Math.min(scaleX, scaleY)
  return { x: cx + dx * s, y: cy + dy * s }
}

export function edgeEndpoints(
  from: DiagramModelNode,
  to: DiagramModelNode,
  edge: Pick<DiagramModelEdge, "fromSide" | "toSide">,
): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
  const fc = nodeCenter(from)
  const tc = nodeCenter(to)
  const p1 = edge.fromSide
    ? sideAnchor(from, edge.fromSide)
    : centerClip(from, tc.cx, tc.cy)
  const p2 = edge.toSide
    ? sideAnchor(to, edge.toSide)
    : centerClip(to, fc.cx, fc.cy)
  return { p1, p2 }
}

const SIDE_NORMAL: Record<DiagramSide, { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

// Endpoint plus the outward normal of the side it leaves/enters. For an explicit
// side that's fixed; for a center-clip endpoint we derive it from whichever box
// edge the center→target ray exits, so the curve always meets the box square-on.
function endpointWithNormal(
  n: DiagramModelNode,
  side: DiagramSide | undefined,
  tx: number,
  ty: number,
): { x: number; y: number; nx: number; ny: number } {
  if (side) {
    const a = sideAnchor(n, side)
    const nm = SIDE_NORMAL[side]
    return { x: a.x, y: a.y, nx: nm.x, ny: nm.y }
  }
  const { cx, cy } = nodeCenter(n)
  const dx = tx - cx
  const dy = ty - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy, nx: 0, ny: 0 }
  const scaleX = dx !== 0 ? n.w / 2 / Math.abs(dx) : Infinity
  const scaleY = dy !== 0 ? n.h / 2 / Math.abs(dy) : Infinity
  const s = Math.min(scaleX, scaleY)
  return {
    x: cx + dx * s,
    y: cy + dy * s,
    nx: scaleX <= scaleY ? Math.sign(dx) : 0,
    ny: scaleX <= scaleY ? 0 : Math.sign(dy),
  }
}

/**
 * Cubic-bezier connector between two nodes. The control points extend along each
 * endpoint's outward side-normal, so the curve leaves and enters every box
 * perpendicular to its edge — the arrowhead (orient="auto") then points straight
 * into the box. Shared by the builder and renderDiagramSvg so on-canvas and
 * stored output stay identical. `mid` is the curve's t=0.5 point for label
 * placement.
 */
export function edgePath(
  from: DiagramModelNode,
  to: DiagramModelNode,
  edge: Pick<DiagramModelEdge, "fromSide" | "toSide">,
): { d: string; mid: { x: number; y: number } } {
  const fc = nodeCenter(from)
  const tc = nodeCenter(to)
  const a = endpointWithNormal(from, edge.fromSide, tc.cx, tc.cy)
  const b = endpointWithNormal(to, edge.toSide, fc.cx, fc.cy)
  const dist = Math.hypot(b.x - a.x, b.y - a.y)
  const k = Math.max(24, Math.min(0.45 * dist, 140))
  const c1x = a.x + a.nx * k
  const c1y = a.y + a.ny * k
  const c2x = b.x + b.nx * k
  const c2y = b.y + b.ny * k
  const d =
    `M${a.x.toFixed(1)},${a.y.toFixed(1)} ` +
    `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ` +
    `${b.x.toFixed(1)},${b.y.toFixed(1)}`
  return {
    d,
    mid: {
      x: (a.x + 3 * c1x + 3 * c2x + b.x) / 8,
      y: (a.y + 3 * c1y + 3 * c2y + b.y) / 8,
    },
  }
}

/** Nearest anchor side of a node to a point. */
export function nearestSide(
  n: DiagramModelNode,
  x: number,
  y: number,
): DiagramSide {
  let best: DiagramSide = "top"
  let bestD = Infinity
  for (const s of DIAGRAM_SIDES) {
    const a = sideAnchor(n, s)
    const d = (a.x - x) ** 2 + (a.y - y) ** 2
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  return best
}

/**
 * Bounding box of all content, padded. Used to auto-crop the output viewBox.
 * The background is just another bbox contributor (its placed x/y/w/h rect), so
 * content + background union and crop together — no special-case framing.
 */
export function contentBounds(
  model: DiagramModel,
  pad = DIAGRAM_CROP_PAD,
): { x: number; y: number; w: number; h: number } {
  const hasContent =
    model.nodes.length > 0 || model.arrows.length > 0 || !!model.background
  if (!hasContent) {
    return { x: 0, y: 0, w: model.width, h: model.height }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of model.nodes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.w)
    maxY = Math.max(maxY, n.y + n.h)
  }
  for (const a of model.arrows) {
    minX = Math.min(minX, a.x1, a.x2)
    minY = Math.min(minY, a.y1, a.y2)
    maxX = Math.max(maxX, a.x1, a.x2)
    maxY = Math.max(maxY, a.y1, a.y2)
  }
  if (model.background) {
    const bg = model.background
    minX = Math.min(minX, bg.x)
    minY = Math.min(minY, bg.y)
    maxX = Math.max(maxX, bg.x + bg.w)
    maxY = Math.max(maxY, bg.y + bg.h)
  }
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  }
}

export const BG_MIN = 40

export function clampNodeSize(w: number, h: number): { w: number; h: number } {
  return {
    w: Math.max(NODE_MIN.w, Math.min(NODE_MAX.w, w)),
    h: Math.max(NODE_MIN.h, Math.min(NODE_MAX.h, h)),
  }
}

// --- node label layout (shared by builder + renderer) -----------------------
// SVG <text> doesn't wrap, so we break the label into up to two lines by an
// approximate character budget and truncate with an ellipsis past that. The
// builder and renderDiagramSvg both call nodeTextRows so on-canvas and stored
// output stay identical.

const LABEL_CHAR_PX = 7.8 // ~avg glyph width at the 13px semibold label size
const LABEL_PAD = 16
const LABEL_LINE_H = 15

/** Greedy word-wrap into at most `maxLines`, ellipsising any overflow. */
export function wrapLabel(label: string, maxChars: number, maxLines = 2): string[] {
  const text = (label ?? "").replace(/\s+/g, " ").trim()
  if (!text) return [""]
  const cpl = Math.max(4, Math.floor(maxChars))
  const words = text.split(" ")
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w
    if (cand.length <= cpl) {
      cur = cand
      continue
    }
    if (cur) lines.push(cur)
    cur = w
    if (lines.length >= maxLines) break
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  const fitAll = lines.join(" ").length >= text.length && lines.length <= maxLines
  if (lines.length > maxLines) lines.length = maxLines
  if (!fitAll && lines.length) {
    const last = lines[lines.length - 1]
    const cut = last.length > cpl - 1 ? last.slice(0, cpl - 1) : last
    lines[lines.length - 1] = `${cut.replace(/[ .]+$/, "")}…`
  }
  return lines.map((l) => (l.length > cpl ? `${l.slice(0, cpl - 1)}…` : l)).slice(0, maxLines)
}

export function nodeLabelLines(n: DiagramModelNode): string[] {
  return wrapLabel(n.label, (n.w - LABEL_PAD) / LABEL_CHAR_PX, 2)
}

/** Baseline positions for a node's label lines (and asset code), vertically centered. */
export function nodeTextRows(n: DiagramModelNode): {
  lines: string[]
  firstY: number
  lh: number
  code: string | null
  codeY: number | null
} {
  const { cy } = nodeCenter(n)
  const lines = nodeLabelLines(n)
  const hasCode = n.kind === "asset" && !!n.assetCode
  const rows = lines.length + (hasCode ? 1 : 0)
  const blockTop = cy - ((rows - 1) * LABEL_LINE_H) / 2
  const firstY = blockTop + 4
  return {
    lines,
    firstY,
    lh: LABEL_LINE_H,
    code: hasCode ? n.assetCode! : null,
    codeY: hasCode ? firstY + lines.length * LABEL_LINE_H : null,
  }
}

// --- starter templates (model-based, editable after insert) -----------------
// Generic placeholder copy — operators rename per their line.

export function processLineTemplate(): DiagramModel {
  const m = emptyDiagramModel()
  const y = 600
  const startX = 200
  const gap = 240
  const w = 150
  const h = 64
  for (let i = 0; i < 5; i++) {
    m.nodes.push({
      id: `n_pl${i}`,
      kind: "process",
      x: startX + i * gap,
      y,
      w,
      h,
      label: `Equipment ${i + 1}`,
      tint: "blue",
    })
  }
  for (let i = 0; i < 4; i++) {
    m.edges.push({
      id: `e_pl${i}`,
      from: `n_pl${i}`,
      to: `n_pl${i + 1}`,
      fromSide: "right",
      toSide: "left",
    })
  }
  return m
}

export function decisionBranchTemplate(): DiagramModel {
  const m = emptyDiagramModel()
  m.nodes.push(
    { id: "n_q", kind: "decision", x: 1080, y: 480, w: 170, h: 96, label: "Condition?", tint: "red" },
    { id: "n_yes", kind: "process", x: 860, y: 760, w: 160, h: 64, label: "Step A", tint: "green" },
    { id: "n_no", kind: "process", x: 1320, y: 760, w: 160, h: 64, label: "Step B", tint: "amber" },
  )
  m.edges.push(
    { id: "e_y", from: "n_q", to: "n_yes", fromSide: "bottom", toSide: "top", label: "Yes" },
    { id: "e_n", from: "n_q", to: "n_no", fromSide: "bottom", toSide: "top", label: "No" },
  )
  return m
}
