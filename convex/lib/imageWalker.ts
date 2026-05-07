// Walk a TipTap JSON document body and collect every image reference.
// Returns one entry per <img> node, in document order. Both data-image-id
// (uploaded via the new flow) and bare external src URLs (legacy or url-source)
// are surfaced.

export interface BodyImageRef {
  imageId: string | null
  externalUrl: string | null
  altText: string
}

export function walkBodyImages(body: unknown): BodyImageRef[] {
  const out: BodyImageRef[] = []
  visit(body, out)
  return out
}

function visit(node: unknown, out: BodyImageRef[]): void {
  if (!node || typeof node !== "object") return
  const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }
  if (n.type === "image" && n.attrs) {
    const dataId = n.attrs["data-image-id"] ?? n.attrs["dataImageId"]
    const src = n.attrs["src"]
    const alt = n.attrs["alt"]
    out.push({
      imageId: typeof dataId === "string" && dataId.length > 0 ? dataId : null,
      externalUrl: typeof src === "string" && !dataId ? src : null,
      altText: typeof alt === "string" ? alt : "",
    })
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) visit(child, out)
  }
}
