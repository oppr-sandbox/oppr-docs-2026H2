// PDF blob repository.
//
// Bytes are stored as a SQLite BLOB. sql.js binds Uint8Array directly when
// passed via `Statement.run([..., bytes, ...])` — no JSON serialization.

import type { Database } from "sql.js"
import type { PdfBlob } from "@/types"
import { markDirty } from "../sqlite"
import { asNumber, asString, run, selectOne } from "./_helpers"

function mapPdf(row: Record<string, unknown>): PdfBlob {
  const raw = row.bytes
  let bytes: Uint8Array
  if (raw instanceof Uint8Array) {
    bytes = raw
  } else if (raw instanceof ArrayBuffer) {
    bytes = new Uint8Array(raw)
  } else if (Array.isArray(raw)) {
    bytes = new Uint8Array(raw as number[])
  } else {
    bytes = new Uint8Array(0)
  }
  return {
    id: asString(row.id),
    filename: asString(row.filename),
    mime: asString(row.mime),
    bytes,
    page_count: asNumber(row.page_count),
  }
}

export function getPdf(db: Database, id: string): PdfBlob | null {
  return selectOne(
    db,
    "SELECT id, filename, mime, bytes, page_count FROM pdf_blobs WHERE id = ?",
    [id],
    mapPdf,
  )
}

export function insertPdf(
  db: Database,
  input: { id?: string; filename: string; mime?: string; bytes: Uint8Array; page_count?: number },
): PdfBlob {
  const id = input.id ?? crypto.randomUUID()
  const mime = input.mime ?? "application/pdf"
  const pageCount = input.page_count ?? 0
  const stmt = db.prepare(
    "INSERT INTO pdf_blobs (id, filename, mime, bytes, page_count) VALUES (?, ?, ?, ?, ?);",
  )
  try {
    stmt.run([id, input.filename, mime, input.bytes, pageCount])
  } finally {
    stmt.free()
  }
  markDirty()
  return { id, filename: input.filename, mime, bytes: input.bytes, page_count: pageCount }
}

export function updatePageCount(db: Database, id: string, page_count: number): void {
  run(db, "UPDATE pdf_blobs SET page_count = ? WHERE id = ?;", [page_count, id])
  markDirty()
}

export function deletePdf(db: Database, id: string): void {
  run(db, "DELETE FROM pdf_blobs WHERE id = ?;", [id])
  markDirty()
}
