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
  referencesBlock: boolean
  watermark: "none" | "controlled" | "draft" | "review"
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  titlePage: true,
  revisionBlock: true,
  recurringHeader: true,
  recurringFooter: true,
  assetList: false,
  referencesBlock: true,
  watermark: "controlled",
}

export interface RevisionEntry {
  version: number
  publishedAt: number
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
  /** Full version history, newest first. Drives the revision table. */
  versions?: RevisionEntry[]
  /** Resolve referenceDoc ids → title for the references table. */
  refTitleById?: Record<string, string>
  /** Resolve pdfAttachment storageIds → rasterised page image data URLs. */
  pdfPagesByStorageId?: Record<string, string[]>
}

const TYPE_LABEL: Record<Doc["type"], string> = {
  sop: "Standard Operating Procedure",
  manual: "Manual",
  work_instruction: "Work Instruction",
  lmra: "Last-Minute Risk Assessment",
}

export function buildPrintDoc(args: BuildArgs): string {
  const {
    doc,
    version,
    assets,
    owner,
    options,
    ppeOnDoc,
    imageUrlMap,
    versions,
    refTitleById,
    pdfPagesByStorageId,
  } = args
  CURRENT_PDF_PAGES = pdfPagesByStorageId
  const effective = formatDate(version.published_at)
  const reviewBy = addOneYear(version.published_at)
  // The PDF reflects the live (published) edition. When a newer edition is being
  // drafted, current_version is ahead of the live one — export the live number.
  const displayVersion = doc.live_version ?? doc.current_version
  const displayStatus: Doc["status"] =
    doc.live_version != null ? "published" : doc.status
  const watermarkText = watermarkLabel(options.watermark, displayStatus)

  const styles = buildPrintStyles({
    docId: doc.naming_code,
    title: doc.title,
    version: displayVersion,
    effective: options.recurringFooter ? effective : null,
    reviewBy,
    watermark: watermarkText,
  })

  const pages: string[] = []

  // Revision history goes on the title page (in the empty band below the
  // metadata grid) when both the title page and revision block are enabled.
  // If there's no title page, render it as the first body section instead.
  // When a title page is present, the revision history, linked-machine list,
  // and references table all live ON the title page (controlled-document
  // convention) rather than trailing the body.
  const onTitle = options.titlePage
  const titleHasRevision = onTitle && options.revisionBlock
  const refs = options.referencesBlock
    ? collectReferences(version.body_json)
    : []
  const titleAssets = onTitle && options.assetList ? assets : []
  const titleRefs = onTitle ? refs : []

  if (onTitle) {
    pages.push(
      renderTitlePage({
        doc,
        owner,
        effective,
        reviewBy,
        assets,
        ppeOnDoc,
        watermarkText,
        displayVersion,
        displayStatus,
        version: titleHasRevision ? version : null,
        versions,
        assetList: titleAssets,
        refs: titleRefs,
        refTitleById,
      }),
    )
  }

  const bodySections: string[] = []
  if (options.revisionBlock && !titleHasRevision) {
    bodySections.push(
      renderRevisionBlock({ displayVersion, displayStatus, version, versions }),
    )
  }
  if (!onTitle && options.assetList && assets.length > 0) {
    bodySections.push(renderAssetList(assets))
  }
  bodySections.push(
    `<div class="doc-body">${renderTipTapDoc(version.body_json, imageUrlMap)}</div>`,
  )
  if (!onTitle && refs.length > 0) {
    bodySections.push(renderReferences(refs, refTitleById))
  }
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
  <h1>${escapeHtml(doc.naming_code)} · v${displayVersion} — ${escapeHtml(doc.title)}</h1>
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
  displayVersion: number
  displayStatus: Doc["status"]
  version: DocVersion | null
  versions?: RevisionEntry[]
  assetList: Asset[]
  refs: RefEntry[]
  refTitleById?: Record<string, string>
}): string {
  const {
    doc,
    owner,
    effective,
    reviewBy,
    ppeOnDoc,
    displayVersion,
    displayStatus,
    version,
    versions,
    assetList,
    refs,
    refTitleById,
  } = args
  const ownerLabel = owner ? `${escapeHtml(owner.name)} (${escapeHtml(owner.role)})` : "—"
  const ppe = ppeOnDoc
    .map((p) => `<span>${escapeHtml(PPE_META[p]?.label ?? p)}</span>`)
    .join("")
  // Everything below the metadata grid is compiled together so the front page
  // carries the full controlled-document context: revision history, then the
  // linked machines and references in the same table format.
  return `
<section class="doc-page title-page">
  <div class="title-eyebrow">Oppr DOCS · Controlled document</div>
  <div class="title-kicker">${escapeHtml(TYPE_LABEL[doc.type])}</div>
  <div class="title-main">
    <h1>${escapeHtml(doc.title)}</h1>
    <div class="title-code">${escapeHtml(doc.naming_code)} · v${displayVersion} · ${escapeHtml(displayStatus)}</div>
  </div>
  <div class="title-meta-grid">
    <div><div class="k">Owner</div><div class="v">${ownerLabel}</div></div>
    <div><div class="k">Effective</div><div class="v">${escapeHtml(effective)}</div></div>
    <div><div class="k">Review by</div><div class="v">${escapeHtml(reviewBy)}</div></div>
    <div><div class="k">Revision</div><div class="v">${displayVersion}</div></div>
    <div><div class="k">Type</div><div class="v">${escapeHtml(TYPE_LABEL[doc.type])}</div></div>
    <div><div class="k">Status</div><div class="v">${escapeHtml(displayStatus)}</div></div>
  </div>
  ${ppe ? `<div class="title-ppe">${ppe}</div>` : ""}
  ${version ? renderRevisionBlock({ displayVersion, displayStatus, version, versions }) : ""}
  ${assetList.length > 0 ? renderAssetList(assetList) : ""}
  ${refs.length > 0 ? renderReferences(refs, refTitleById) : ""}
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
  displayVersion: number
  displayStatus: Doc["status"]
  version: DocVersion
  versions?: RevisionEntry[]
}): string {
  const { displayVersion, displayStatus, version, versions } = args
  // Auto-generated from the publish history. Only published revisions up to the
  // live one appear (an in-progress draft is excluded), newest first, and we
  // show just the three most recent so the front page stays compact.
  const all =
    versions && versions.length > 0
      ? versions.map((r) => ({ version: r.version, publishedAt: r.publishedAt }))
      : [{ version: displayVersion, publishedAt: Date.parse(version.published_at) }]
  const rows = all
    .filter((r) => r.version <= displayVersion)
    .sort((a, b) => b.version - a.version)
    .slice(0, 3)
  const body = rows
    .map((r) => {
      const isCurrent = r.version === displayVersion
      return `<tr>
        <td>v${r.version}</td>
        <td>${escapeHtml(formatDate(new Date(r.publishedAt).toISOString()))}</td>
        <td>${escapeHtml(isCurrent ? displayStatus : "superseded")}</td>
        <td>${isCurrent ? "Current version. Review at least annually." : "Superseded revision."}</td>
      </tr>`
    })
    .join("")
  return `
<section class="revision-block">
  <h2>Revision history</h2>
  <table>
    <thead>
      <tr><th>Rev</th><th>Date</th><th>Status</th><th>Summary</th></tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</section>`
}

// ---------------------------------------------------------------------------
// References & related documents (auto-generated from referenceDoc chips)
// ---------------------------------------------------------------------------

interface RefEntry {
  docId: string
  code: string
  label: string
}

function collectReferences(body: unknown): RefEntry[] {
  const seen = new Set<string>()
  const out: RefEntry[] = []
  const visit = (n: unknown) => {
    if (!n || typeof n !== "object") return
    const node = n as {
      type?: string
      attrs?: Record<string, unknown>
      content?: unknown[]
    }
    if (node.type === "referenceDoc" && node.attrs) {
      const docId = String(node.attrs["docId"] ?? "")
      const code = String(node.attrs["code"] ?? "")
      const label = String(node.attrs["label"] ?? code)
      const key = docId || code || label
      if (key && !seen.has(key)) {
        seen.add(key)
        out.push({ docId, code, label })
      }
    }
    if (Array.isArray(node.content)) node.content.forEach(visit)
  }
  visit(body)
  return out
}

// Title is resolved from the document list at render time; the chip label is
// decorative (may be code-only), so we never rely on it for the title column.
function renderReferences(
  refs: RefEntry[],
  titleById?: Record<string, string>,
): string {
  return `
<section class="reference-block">
  <h2>References &amp; related documents</h2>
  <table>
    <thead>
      <tr><th>Code</th><th>Title</th></tr>
    </thead>
    <tbody>
      ${refs
        .map((r) => {
          const title = titleById?.[r.docId] ?? deriveTitle(r.label, r.code)
          return `<tr><td><code>${escapeHtml(r.code || "—")}</code></td><td>${escapeHtml(title)}</td></tr>`
        })
        .join("")}
    </tbody>
  </table>
</section>`
}

// Fall back to the chip label minus the code prefix when no resolved title.
function deriveTitle(label: string, code: string): string {
  if (label && label !== code) {
    const stripped = label.replace(code, "").replace(/^\s*[—-]\s*/, "").trim()
    if (stripped) return stripped
  }
  return "—"
}

// ---------------------------------------------------------------------------
// Asset list block
// ---------------------------------------------------------------------------

function renderAssetList(assets: Asset[]): string {
  return `
<section class="asset-list-block">
  <h2>Linked machines</h2>
  <table>
    <thead>
      <tr><th>Code</th><th>Machine</th></tr>
    </thead>
    <tbody>
      ${assets
        .map(
          (a) =>
            `<tr><td><code>${escapeHtml(a.code)}</code></td><td>${escapeHtml(a.name)}${a.location ? ` <span style="color:#9ca3af">(${escapeHtml(a.location)})</span>` : ""}</td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
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
// Rasterised PDF pages (data URLs) keyed by storageId, for pdfAttachment nodes.
let CURRENT_PDF_PAGES: Record<string, string[]> | undefined

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
      const widthRaw = Number(node.attrs?.width ?? 100)
      const width = Number.isFinite(widthRaw)
        ? Math.max(10, Math.min(100, Math.round(widthRaw)))
        : 100
      const alignRaw = String(node.attrs?.align ?? "center")
      const align =
        alignRaw === "left" || alignRaw === "right" ? alignRaw : "center"
      const resolved = dataImageId
        ? CURRENT_IMAGE_URL_MAP?.[dataImageId] ?? null
        : null
      const src = resolved ?? directSrc
      if (!src) {
        return `<span class="img-missing" data-image-id="${escapeAttr(dataImageId ?? "")}">[image not available]</span>`
      }
      const marginStyle =
        align === "left"
          ? "margin-right:auto;margin-left:0"
          : align === "right"
            ? "margin-left:auto;margin-right:0"
            : "margin-left:auto;margin-right:auto"
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="display:block;width:${width}%;${marginStyle}" />`
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
    case "referenceDoc":
      return renderReferenceDoc(node)
    case "pdfAttachment":
      return renderPdfAttachment(node)
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
      if (n.type === "referenceDoc") return renderReferenceDoc(n)
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

function renderReferenceDoc(node: TipTapNode): string {
  const label = String(node.attrs?.label ?? node.attrs?.code ?? "")
  return `<span data-reference-doc>${escapeHtml(label)}</span>`
}

function renderPdfAttachment(node: TipTapNode): string {
  const storageId = String(node.attrs?.storageId ?? "")
  const filename = String(node.attrs?.filename ?? "Attached PDF")
  const pageCount = Number(node.attrs?.pageCount ?? 0)
  const pages = storageId ? CURRENT_PDF_PAGES?.[storageId] : undefined
  const head = `<div class="pdf-attachment-head">Attached PDF — ${escapeHtml(filename)}${
    pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""
  }</div>`
  if (pages && pages.length > 0) {
    const imgs = pages
      .map(
        (src, i) =>
          `<figure class="pdf-page"><img src="${escapeAttr(src)}" alt="${escapeAttr(filename)} page ${i + 1}" /></figure>`,
      )
      .join("")
    return `<section class="pdf-attachment">${head}${imgs}</section>`
  }
  return `<section class="pdf-attachment-note">${head}<p>Open the source document in Oppr DOCS to view the PDF.</p></section>`
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
