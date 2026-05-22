// Client mirror of convex/lib/assetWalker. Walks a TipTap JSON body for
// `linkedAsset` nodes and returns the distinct asset ids, first-seen order.
// Used to show the derived "Linked assets" list live in the metadata panel
// before a save persists them.

export function walkBodyAssetIds(body: unknown): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  visit(body, seen, out)
  return out
}

function visit(node: unknown, seen: Set<string>, out: string[]): void {
  if (!node || typeof node !== "object") return
  const n = node as {
    type?: string
    attrs?: Record<string, unknown>
    content?: unknown[]
  }
  if (n.type === "linkedAsset" && n.attrs) {
    const id = n.attrs["assetId"]
    if (typeof id === "string" && id.length > 0 && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) visit(child, seen, out)
  }
}
