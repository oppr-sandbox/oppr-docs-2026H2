// Client walker for reference-document chips. Returns the distinct
// { docId, code } pairs referenced by `referenceDoc` nodes, first-seen order.
// Titles are resolved at render time from the document list — the chip's stored
// label is decorative and may be code-only.

export interface BodyRef {
  docId: string
  code: string
}

export function walkBodyRefs(body: unknown): BodyRef[] {
  const seen = new Set<string>()
  const out: BodyRef[] = []
  visit(body, seen, out)
  return out
}

function visit(node: unknown, seen: Set<string>, out: BodyRef[]): void {
  if (!node || typeof node !== "object") return
  const n = node as {
    type?: string
    attrs?: Record<string, unknown>
    content?: unknown[]
  }
  if (n.type === "referenceDoc" && n.attrs) {
    const docId = n.attrs["docId"]
    if (typeof docId === "string" && docId.length > 0 && !seen.has(docId)) {
      seen.add(docId)
      out.push({ docId, code: String(n.attrs["code"] ?? "") })
    }
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) visit(child, seen, out)
  }
}
