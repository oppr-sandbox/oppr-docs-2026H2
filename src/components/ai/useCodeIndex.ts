// Build a lookup of every doc naming code, asset code, and log code in the
// database. The Markdown renderer uses this to auto-link bare codes that
// appear in the assistant's prose ("Inspect HOL-OPS-MAN-0001 …" or
// "RMR-101"). Codes that aren't in the DB stay plain text — we never
// fabricate links to entities that don't exist.

import { useMemo } from "react"
import { useDb, useDbWatcher } from "@/db"
import { listAssets } from "@/db/repositories/assets"
import { listDocuments } from "@/db/repositories/documents"

export type CodeKind = "doc" | "asset" | "log"

export interface CodeEntry {
  kind: CodeKind
  code: string
  /** Doc/asset id, OR for logs the asset id that owns them. */
  id: string
  /** Friendly label: doc title, asset name, or log name. */
  label: string
}

export type CodeIndex = Map<string, CodeEntry>

export function useCodeIndex(): CodeIndex {
  const { db } = useDb()
  const watcher = useDbWatcher()

  return useMemo(() => {
    const idx: CodeIndex = new Map()
    if (!db) return idx
    for (const d of listDocuments(db)) {
      idx.set(d.naming_code, {
        kind: "doc",
        code: d.naming_code,
        id: d.id,
        label: d.title,
      })
    }
    for (const a of listAssets(db)) {
      idx.set(a.code, {
        kind: "asset",
        code: a.code,
        id: a.id,
        label: a.name,
      })
      if (a.linked_log_code) {
        idx.set(a.linked_log_code, {
          kind: "log",
          code: a.linked_log_code,
          id: a.id,
          label: a.linked_log_name ?? a.linked_log_code,
        })
      }
    }
    return idx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, watcher])
}

/**
 * Pattern for entity codes used by the Oppr DOCS naming convention.
 * Examples that match: HOL-OPS-SOP-0001, RMR-101, HOL-OPS-LOG-0001.
 *
 * The third segment is a 2–4 character A-Z token (SOP/MAN/WI/LMRA/LOG/ASSET/etc.)
 * and the fourth is the 3–5 digit serial. We also accept short asset codes
 * like RMR-101 (two segments).
 */
export const CODE_PATTERN =
  /\b[A-Z]{2,4}-[A-Z0-9]{2,5}(?:-[A-Z]{2,5}-\d{3,5})?\b/g
