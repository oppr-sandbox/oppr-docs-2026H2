// TipTap Image extension override.
//
// Adds a `data-image-id` attribute and a React node view that resolves it to
// a fresh signed URL via the Convex `images.urlFor` query. Lets the body
// store an immutable image-id reference; the URL is short-lived and resolved
// at render-time. URL-source images keep using their existing `src`.

import { mergeAttributes } from "@tiptap/core"
import Image from "@tiptap/extension-image"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"
import { useQuery } from "convex/react"
import { ImageOff } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

const DATA_ATTR = "data-image-id"

function ImageNodeView({ node }: ReactNodeViewProps) {
  const dataImageId = node.attrs[DATA_ATTR] as string | null
  const directSrc = node.attrs.src as string | null
  const alt = (node.attrs.alt as string) ?? ""

  const resolved = useQuery(
    api.images.urlFor,
    dataImageId ? { id: dataImageId as Id<"images"> } : "skip",
  )

  // Use the resolved URL when available (handles expired signed URLs on re-mount).
  // Fall back to whatever is in src so first paint is correct on insert.
  const src = dataImageId ? (resolved ?? directSrc) : directSrc

  return (
    <NodeViewWrapper className="my-2">
      {src ? (
        <img src={src} alt={alt} className="max-w-full rounded-md" />
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <ImageOff className="h-4 w-4" />
          {dataImageId ? "Resolving image…" : "Image src missing"}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const ImageWithRef = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      [DATA_ATTR]: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute(DATA_ATTR),
        renderHTML: (attrs) => {
          const v = attrs[DATA_ATTR]
          return v ? { [DATA_ATTR]: v } : {}
        },
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})
