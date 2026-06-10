// Client walker for launch-log pills. Returns the distinct
// { logId, code, label } triples referenced by `launchLog` nodes,
// first-seen order. Mirrors bodyRefs.ts / bodyAssets.ts.

export interface BodyLog {
  logId: string
  code: string
  label: string
}

export function walkBodyLogs(body: unknown): BodyLog[] {
  const seen = new Set<string>()
  const out: BodyLog[] = []
  visit(body, seen, out)
  return out
}

function visit(node: unknown, seen: Set<string>, out: BodyLog[]): void {
  if (!node || typeof node !== "object") return
  const n = node as {
    type?: string
    attrs?: Record<string, unknown>
    content?: unknown[]
  }
  if (n.type === "launchLog" && n.attrs) {
    const logId = n.attrs["logId"]
    if (typeof logId === "string" && logId.length > 0 && !seen.has(logId)) {
      seen.add(logId)
      out.push({
        logId,
        code: String(n.attrs["code"] ?? ""),
        label: String(n.attrs["label"] ?? ""),
      })
    }
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) visit(child, seen, out)
  }
}
