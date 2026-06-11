// Effective (most senior) status of a document for counting and filtering.
//
// Forking a published document for a new edition flips its `status` to the
// working edition's state (draft/in_review/…) while `liveVersion` stays pinned
// to the published edition. For headcount and library filtering we want the
// document to count under its most senior identity: a document that has a live
// version is "published" regardless of the working edition, and an archived
// document stays archived. Mirrors the server helper in convex/documents.ts.

import type { DocumentStatus } from "@/types"

export function effectiveStatus(doc: {
  status: DocumentStatus
  live_version?: number | null
}): DocumentStatus {
  if (doc.status === "archived") return "archived"
  return doc.live_version != null ? "published" : doc.status
}
