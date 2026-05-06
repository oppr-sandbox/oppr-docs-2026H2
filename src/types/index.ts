// Shared domain types. Used across DB layer, pages, and AI layer.

export type DocumentType = "sop" | "manual" | "work_instruction" | "lmra"
export type DocumentStatus = "draft" | "in_review" | "published" | "archived"
export type DocumentBodyKind = "tiptap" | "pdf"
export type UserRole = "engineer" | "operator" | "manager"

export interface Asset {
  id: string
  code: string // e.g. "RMR-101"
  name: string // human-readable
  site: string
  location: string | null
  qr_token: string // simulated QR payload
  created_at: string
  // v1 additions — surfaced in the Project Assets table to mirror the LOGS module:
  description: string | null
  level: number // 0 = root machine/system, 1 = loggable station
  floorplan: string | null // floorplan name this asset sits on
  is_linked: number // 0/1 — whether the asset is placed on its floorplan
  linked_log_code: string | null // e.g. "HOL-OPS-LOG-0001"
  linked_log_name: string | null // e.g. "Réception matières premières"
  linked_log_description: string | null // operator-facing context line
  pin_number: number | null // floorplan pin number (1-based)
  pin_x: number | null // floorplan pin x as percent 0-100
  pin_y: number | null // floorplan pin y as percent 0-100
}

// Reference to an Oppr LOGS log entry attached to an asset.
// DOCS does not own log records — clicking one opens a modal that points at
// the LOGS module.
export interface AssetLog {
  asset_id: string
  code: string // e.g. "HOL-OPS-LOG-0001"
  name: string
  description: string | null
}

export interface Doc {
  id: string
  naming_code: string // e.g. "HOL-OPS-MAN-0001"
  title: string
  type: DocumentType
  status: DocumentStatus
  current_version: number
  owner_id: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface DocVersion {
  id: string
  document_id: string
  version: number
  body_kind: DocumentBodyKind
  body_json: unknown | null // TipTap JSON when body_kind="tiptap"
  pdf_blob_id: string | null
  published_at: string
}

export interface PdfBlob {
  id: string
  filename: string
  mime: string
  bytes: Uint8Array
  page_count: number
}

export interface Log {
  id: string
  name: string
  type: string // free text for the showcase
}

export interface DocLogRef {
  document_id: string
  version: number
  log_id: string
  anchor_id: string // TipTap node id
}

export interface Chunk {
  id: string
  document_id: string
  version: number
  seq: number
  text: string
  page_or_section: string | null
}

export interface ChunkEmbedding {
  chunk_id: string
  vector: number[] // 768-dim for text-embedding-004
}

export interface QaSession {
  id: string
  scope_kind: "doc" | "asset" | "library"
  // For library sessions, scope_id is the literal string "library".
  scope_id: string
  created_at: string
}

export interface QaMessage {
  id: string
  session_id: string
  role: "user" | "assistant"
  text: string
  citations: Citation[] | null
  created_at: string
}

export type CitationOrigin = "asset-link" | "cross-link" | "log"

export interface Citation {
  document_id: string
  document_title: string
  chunk_id: string
  page_or_section: string | null
  excerpt: string
  /**
   * Where the cited chunk's parent document sits relative to the active
   * scope. In asset scope: "asset-link" means the document is in
   * document_assets for that asset; "cross-link" means it surfaced from
   * outside that link (rare — usually a stale IndexedDB symptom). In
   * doc/library scope this is always "asset-link" (no badge rendered).
   * "log" is reserved for future asset-log RAG.
   */
  origin: CitationOrigin
}

export interface User {
  id: string
  name: string
  role: UserRole
}

// Convenient view types

export interface DocWithAssets extends Doc {
  assets: Asset[]
}

export interface AssetWithDocs extends Asset {
  documents: Doc[]
}
