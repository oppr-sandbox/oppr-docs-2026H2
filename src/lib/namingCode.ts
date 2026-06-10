// Naming-code parsing: {LOCATION}-{DISCIPLINE}-{TYPE}-{NNNN}.
// The code is the document's immutable identity; location/discipline/type are
// derivable from it, which is how older documents (created before those fields
// existed) get their filing backfilled.

import type { DocumentType } from "@/types"

export const TYPE_TOKEN: Record<DocumentType, string> = {
  sop: "SOP",
  manual: "MAN",
  work_instruction: "WI",
  lmra: "LMRA",
}

const TOKEN_TO_TYPE: Record<string, DocumentType> = {
  SOP: "sop",
  MAN: "manual",
  WI: "work_instruction",
  LMRA: "lmra",
}

export interface ParsedNamingCode {
  location: string
  discipline: string
  type: DocumentType | null
  seq: number
}

export function parseNamingCode(code: string): ParsedNamingCode | null {
  const m = /^([A-Z0-9]+)-([A-Z0-9]+)-([A-Z0-9]+)-(\d+)$/.exec(code)
  if (!m) return null
  return {
    location: m[1],
    discipline: m[2],
    type: TOKEN_TO_TYPE[m[3]] ?? null,
    seq: parseInt(m[4], 10),
  }
}
