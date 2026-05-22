// Walk a TipTap JSON document body and collect every linked-asset reference.
// Mirrors imageWalker. Returns the distinct asset ids referenced by
// `linkedAsset` nodes, in first-seen order. Used to derive documentAssets
// from the body so the metadata panel never has to be filled in by hand.

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
