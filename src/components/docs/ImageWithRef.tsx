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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

const DATA_ATTR = "data-image-id"
const WIDTH_VALUES = ["33", "66", "100"] as const
type ImageWidth = (typeof WIDTH_VALUES)[number]

function widthClass(w: ImageWidth | null): string {
  if (w === "33") return "max-w-[33%]"
  if (w === "66") return "max-w-[66%]"
  return "max-w-full"
}

function ImageNodeView({ node, updateAttributes, selected, editor }: ReactNodeViewProps) {
  const dataImageId = node.attrs[DATA_ATTR] as string | null
  const directSrc = node.attrs.src as string | null
  const alt = (node.attrs.alt as string) ?? ""
  const width = (node.attrs.width as ImageWidth | null) ?? "100"

  const resolved = useQuery(
    api.images.urlFor,
    dataImageId ? { id: dataImageId as Id<"images"> } : "skip",
  )

  const src = dataImageId ? (resolved ?? directSrc) : directSrc
  const editable = editor?.isEditable ?? false

  return (
    <NodeViewWrapper className="my-2">
      <div className={cn("relative inline-block w-full", widthClass(width))}>
        {src ? (
          <img src={src} alt={alt} className="block w-full rounded-md" />
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <ImageOff className="h-4 w-4" />
            {dataImageId ? "Resolving image…" : "Image src missing"}
          </div>
        )}
        {editable && selected && src && (
          <div className="absolute right-1 top-1 flex gap-0.5 rounded-md border bg-background/95 p-0.5 shadow-md backdrop-blur">
            {WIDTH_VALUES.map((w) => (
              <Button
                key={w}
                type="button"
                variant={width === w ? "secondary" : "ghost"}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => updateAttributes({ width: w })}
                title={`${w}% width`}
              >
                {w === "33" ? "S" : w === "66" ? "M" : "L"}
              </Button>
            ))}
          </div>
        )}
      </div>
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
      width: {
        default: "100" as ImageWidth,
        parseHTML: (element) => {
          const v = element.getAttribute("data-width")
          return WIDTH_VALUES.includes(v as ImageWidth) ? v : "100"
        },
        renderHTML: (attrs) => {
          const v = attrs.width
          return v ? { "data-width": v } : {}
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
