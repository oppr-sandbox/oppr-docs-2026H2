// Build a self-contained HTML document for the print preview window.
//
// Walks TipTap JSON and emits HTML for the standard nodes plus our custom
// blocks (callout, ppe, diagram, stepList/stepItem, launchLog, linkedAsset).
// The output is paginated by CSS @page rules + a leading title page wrapped
// in .doc-page so screen preview and print share the same DOM.

import type { Asset, Doc, DocVersion, User } from "@/types"
import { CALLOUT_META, type CalloutKind } from "@/components/docs/CalloutBlock"
import { PPE_META, type PpeItem } from "@/components/docs/PpeBlock"
import { buildPrintStyles } from "./printStyles"

export interface PdfExportOptions {
  titlePage: boolean
  revisionBlock: boolean
  recurringHeader: boolean
  recurringFooter: boolean
  assetList: boolean
  watermark: "none" | "controlled" | "draft" | "review"
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  titlePage: true,
  revisionBlock: true,
  recurringHeader: true,
  recurringFooter: true,
  assetList: false,
  watermark: "controlled",
}

interface BuildArgs {
  doc: Doc
  version: DocVersion
  assets: Asset[]
  owner: User | null
  options: PdfExportOptions
  ppeOnDoc: PpeItem[]
  /** Resolved signed URLs for images referenced in the body. Keyed by Convex Id. */
  imageUrlMap?: Record<string, string | null>
}

const TYPE_LABEL: Record<Doc["type"], string> = {
  sop: "Standard Operating Procedure",
  manual: "Manual",
  work_instruction: "Work Instruction",
  lmra: "Last-Minute Risk Assessment",
}

export function buildPrintDoc(args: BuildArgs): string {
  const { doc, version, assets, owner, options, ppeOnDoc, imageUrlMap } = args
  const effective = formatDate(version.published_at)
  const reviewBy = addOneYear(version.published_at)
  const watermarkText = watermarkLabel(options.watermark, doc.status)

  const styles = buildPrintStyles({
    docId: doc.naming_code,
    title: doc.title,
    version: doc.current_version,
    effective: options.recurringFooter ? effective : null,
    reviewBy,
    watermark: watermarkText,
  })

  const pages: string[] = []

  // Revision history goes on the title page (in the empty band below the
  // metadata grid) when both the title page and revision block are enabled.
  // If there's no title page, render it as the first body section instead.
  const titleHasRevision = options.titlePage && options.revisionBlock
  if (options.titlePage) {
    pages.push(
      renderTitlePage({
        doc,
        owner,
        effective,
        reviewBy,
        assets,
        ppeOnDoc,
        watermarkText,
        version: titleHasRevision ? version : null,
      }),
    )
  }

  const bodySections: string[] = []
  if (options.revisionBlock && !titleHasRevision) {
    bodySections.push(renderRevisionBlock({ doc, version, effective }))
  }
  if (options.assetList && assets.length > 0) {
    bodySections.push(renderAssetList(assets))
  }
  bodySections.push(
    `<div class="doc-body">${renderTipTapDoc(version.body_json, imageUrlMap)}</div>`,
  )
  pages.push(`<section class="doc-page">${bodySections.join("")}</section>`)

  const watermarkLayer = watermarkText
    ? `<div class="watermark" aria-hidden="true">${escapeHtml(watermarkText)}</div>`
    : ""

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.naming_code)} — ${escapeHtml(doc.title)}</title>
<meta name="generator" content="Oppr DOCS" />
<style>${styles}</style>
</head>
<body>
<div class="preview-toolbar no-print">
  <h1>${escapeHtml(doc.naming_code)} · v${doc.current_version} — ${escapeHtml(doc.title)}</h1>
  <button onclick="window.print()" class="primary">Print / Save as PDF</button>
  <button onclick="window.close()">Close</button>
</div>
${watermarkLayer}
${pages.join("\n")}
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Title page
// ---------------------------------------------------------------------------

function renderTitlePage(args: {
  doc: Doc
  owner: User | null
  effective: string
  reviewBy: string
  assets: Asset[]
  ppeOnDoc: PpeItem[]
  watermarkText: string | null
  version: DocVersion | null
}): string {
  const { doc, owner, effective, reviewBy, assets, ppeOnDoc, version } = args
  const ownerLabel = owner ? `${escapeHtml(owner.name)} (${escapeHtml(owner.role)})` : "—"
  const assetSummary =
    assets.length === 0
      ? "—"
      : assets.map((a) => `<code>${escapeHtml(a.code)}</code>`).join(", ")
  const tags = doc.tags
    .map((t) => `<span>${escapeHtml(t)}</span>`)
    .join("")
  const ppe = ppeOnDoc
    .map((p) => `<span>${escapeHtml(PPE_META[p]?.label ?? p)}</span>`)
    .join("")
  return `
<section class="doc-page title-page">
  <div class="title-eyebrow">Oppr DOCS · Controlled document</div>
  <div class="title-kicker">${escapeHtml(TYPE_LABEL[doc.type])}</div>
  <div class="title-main">
    <h1>${escapeHtml(doc.title)}</h1>
    <div class="title-code">${escapeHtml(doc.naming_code)} · v${doc.current_version} · ${escapeHtml(doc.status)}</div>
  </div>
  <div class="title-meta-grid">
    <div><div class="k">Owner</div><div class="v">${ownerLabel}</div></div>
    <div><div class="k">Effective</div><div class="v">${escapeHtml(effective)}</div></div>
    <div><div class="k">Review by</div><div class="v">${escapeHtml(reviewBy)}</div></div>
    <div><div class="k">Revision</div><div class="v">${doc.current_version}</div></div>
    <div><div class="k">Linked assets</div><div class="v">${assetSummary}</div></div>
    <div><div class="k">Type</div><div class="v">${escapeHtml(TYPE_LABEL[doc.type])}</div></div>
  </div>
  ${ppe ? `<div class="title-ppe">${ppe}</div>` : ""}
  ${tags ? `<div class="title-tags">${tags}</div>` : ""}
  ${version ? renderRevisionBlock({ doc, version, effective }) : ""}
  <div class="title-controlled">
    <div class="stamp">Controlled copy</div>
    <div>Print date ${escapeHtml(formatToday())}. Verify the latest revision in Oppr DOCS before use. Uncontrolled when printed and not stamped or registered.</div>
  </div>
</section>`
}

// ---------------------------------------------------------------------------
// Revision block
// ---------------------------------------------------------------------------

function renderRevisionBlock(args: {
  doc: Doc
  version: DocVersion
  effective: string
}): string {
  const { doc, version, effective } = args
  // For v1 we surface only the current version. A real revision history would
  // come from the doc_versions table; that's documented as a v2 follow-up.
  return `
<section class="revision-block">
  <h2>Revision history</h2>
  <table>
    <thead>
      <tr><th>Rev</th><th>Date</th><th>Status</th><th>Summary</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>v${doc.current_version}</td>
        <td>${escapeHtml(effective)}</td>
        <td>${escapeHtml(doc.status)}</td>
        <td>Current published version. Review at least annually.</td>
      </tr>
    </tbody>
  </table>
</section>`
}

// ---------------------------------------------------------------------------
// Asset list block
// ---------------------------------------------------------------------------

function renderAssetList(assets: Asset[]): string {
  return `
<section class="asset-list-block">
  <h2>Linked assets</h2>
  <ul>
    ${assets
      .map(
        (a) =>
          `<li><code>${escapeHtml(a.code)}</code> — ${escapeHtml(a.name)}${a.location ? ` <span style="color:#9ca3af">(${escapeHtml(a.location)})</span>` : ""}</li>`,
      )
      .join("")}
  </ul>
</section>`
}

// ---------------------------------------------------------------------------
// TipTap → HTML walker
// ---------------------------------------------------------------------------

interface TipTapNode {
  type: string
  content?: TipTapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  attrs?: Record<string, unknown>
}

// Image URL map is read by the image case via a module-scoped variable
// because the renderNode recursion threads through too many cases to plumb
// the map as an argument. Set at the start of renderTipTapDoc.
let CURRENT_IMAGE_URL_MAP: Record<string, string | null> | undefined

function renderTipTapDoc(
  json: unknown,
  imageUrlMap?: Record<string, string | null>,
): string {
  if (!json || typeof json !== "object") return ""
  const node = json as TipTapNode
  if (!Array.isArray(node.content)) return ""
  CURRENT_IMAGE_URL_MAP = imageUrlMap
  try {
    return node.content.map(renderNode).join("")
  } finally {
    CURRENT_IMAGE_URL_MAP = undefined
  }
}

function renderNode(node: TipTapNode): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${renderInline(node.content)}</p>`
    case "heading": {
      const level = clampLevel(node.attrs?.level)
      return `<h${level}>${renderInline(node.content)}</h${level}>`
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map(renderNode).join("")}</ul>`
    case "orderedList":
      return `<ol>${(node.content ?? []).map(renderNode).join("")}</ol>`
    case "listItem":
      return `<li>${(node.content ?? []).map(renderNode).join("")}</li>`
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(renderNode).join("")}</blockquote>`
    case "codeBlock":
      return `<pre><code>${escapeHtml(textOnly(node))}</code></pre>`
    case "horizontalRule":
      return `<hr />`
    case "hardBreak":
      return `<br />`
    case "image": {
      const dataImageId = node.attrs?.["data-image-id"] as string | undefined
      const directSrc = String(node.attrs?.src ?? "")
      const alt = String(node.attrs?.alt ?? "")
      const width = String(node.attrs?.width ?? "100")
      const resolved = dataImageId
        ? CURRENT_IMAGE_URL_MAP?.[dataImageId] ?? null
        : null
      const src = resolved ?? directSrc
      if (!src) {
        return `<span class="img-missing" data-image-id="${escapeAttr(dataImageId ?? "")}">[image not available]</span>`
      }
      const widthStyle =
        width === "33"
          ? "max-width:33%"
          : width === "66"
            ? "max-width:66%"
            : "max-width:100%"
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="${widthStyle}" />`
    }
    case "table":
      return `<table>${(node.content ?? []).map(renderNode).join("")}</table>`
    case "tableRow":
      return `<tr>${(node.content ?? []).map(renderNode).join("")}</tr>`
    case "tableHeader":
      return `<th>${(node.content ?? []).map(renderNode).join("")}</th>`
    case "tableCell":
      return `<td>${(node.content ?? []).map(renderNode).join("")}</td>`
    case "callout":
      return renderCallout(node)
    case "ppe":
      return renderPpe(node)
    case "diagram":
      return renderDiagram(node)
    case "stepList":
      return `<ol data-step-list>${(node.content ?? []).map(renderNode).join("")}</ol>`
    case "stepItem":
      return `<li data-step-item>${(node.content ?? []).map(renderNode).join("")}</li>`
    case "launchLog":
      return renderLaunchLog(node)
    case "linkedAsset":
      return renderLinkedAsset(node)
    default:
      // Unknown nodes — try to render their children if they're block-like
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(renderNode).join("")
      }
      return ""
  }
}

function renderInline(content: TipTapNode[] | undefined): string {
  if (!content) return ""
  return content
    .map((n) => {
      if (n.type === "text") return applyMarks(escapeHtml(n.text ?? ""), n.marks)
      if (n.type === "hardBreak") return "<br />"
      if (n.type === "linkedAsset") return renderLinkedAsset(n)
      // Shouldn't normally appear inside inline content, but be defensive
      return renderNode(n)
    })
    .join("")
}

function applyMarks(text: string, marks: TipTapNode["marks"]): string {
  if (!marks || marks.length === 0) return text
  let out = text
  for (const m of marks) {
    switch (m.type) {
      case "bold":
      case "strong":
        out = `<strong>${out}</strong>`
        break
      case "italic":
      case "em":
        out = `<em>${out}</em>`
        break
      case "strike":
        out = `<s>${out}</s>`
        break
      case "code":
        out = `<code>${out}</code>`
        break
      case "underline":
        out = `<u>${out}</u>`
        break
      case "link": {
        const href = String(m.attrs?.href ?? "")
        out = `<a href="${escapeAttr(href)}">${out}</a>`
        break
      }
      default:
        break
    }
  }
  return out
}

function renderCallout(node: TipTapNode): string {
  const kind = String(node.attrs?.kind ?? "notice") as CalloutKind
  const meta = CALLOUT_META[kind] ?? CALLOUT_META.notice
  const inner = (node.content ?? []).map(renderNode).join("")
  return `<div data-callout="${escapeAttr(meta.tone)}" data-kind="${escapeAttr(kind)}">
  <div data-callout-title>${escapeHtml(meta.label)}</div>
  ${inner}
</div>`
}

function renderPpe(node: TipTapNode): string {
  const raw = String(node.attrs?.items ?? "")
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as PpeItem[]
  if (items.length === 0) return ""
  return `<div data-ppe-block>
  <div class="label">Personal protective equipment</div>
  <div class="items">${items
    .map((p) => `<span>${escapeHtml(PPE_META[p]?.label ?? p)}</span>`)
    .join("")}</div>
</div>`
}

function renderDiagram(node: TipTapNode): string {
  const svg = String(node.attrs?.svg ?? "")
  const caption = String(node.attrs?.caption ?? "")
  return `<figure data-diagram-block>
  ${svg}
  ${caption ? `<figcaption class="caption">${escapeHtml(caption)}</figcaption>` : ""}
</figure>`
}

function renderLaunchLog(node: TipTapNode): string {
  const label = String(node.attrs?.label ?? "Launch log")
  return `<span data-launch-log>${escapeHtml(label)}</span>`
}

function renderLinkedAsset(node: TipTapNode): string {
  const label = String(node.attrs?.label ?? "")
  return `<span data-linked-asset>${escapeHtml(label)}</span>`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampLevel(v: unknown): 1 | 2 | 3 {
  const n = typeof v === "number" ? v : 1
  if (n <= 1) return 1
  if (n === 2) return 2
  return 3
}

function textOnly(node: TipTapNode): string {
  if (node.type === "text") return node.text ?? ""
  if (!node.content) return ""
  return node.content.map(textOnly).join("")
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

function addOneYear(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

function formatToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function watermarkLabel(
  choice: PdfExportOptions["watermark"],
  status: Doc["status"],
): string | null {
  if (choice === "none") return null
  if (choice === "controlled") return "Controlled copy"
  if (choice === "draft") return "Draft — not for use"
  if (choice === "review") return "Under review"
  // Auto: derive from status when supplied
  if (status === "draft") return "Draft — not for use"
  if (status === "in_review") return "Under review"
  return null
}
