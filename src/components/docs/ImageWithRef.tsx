// TipTap Image extension override.
//
// Adds a `data-image-id` attribute and a React node view that resolves it to
// a fresh signed URL via the Convex `images.urlFor` query. Lets the body
// store an immutable image-id reference; the URL is short-lived and resolved
// at render-time. URL-source images keep using their existing `src`.
//
// Width is a percentage 10..100 (5% steps). Align is left/center/right.
// Older docs may have width as the legacy "33" / "66" / "100" string —
// parseHTML normalises both.

import { mergeAttributes } from "@tiptap/core"
import Image from "@tiptap/extension-image"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"
import { useQuery } from "convex/react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageOff,
  Minus,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

const DATA_ATTR = "data-image-id"
const WIDTH_MIN = 10
const WIDTH_MAX = 100
const WIDTH_STEP = 5
const DEFAULT_WIDTH = 100
const ALIGN_VALUES = ["left", "center", "right"] as const
type ImageAlign = (typeof ALIGN_VALUES)[number]

function clampWidth(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_WIDTH
  if (n < WIDTH_MIN) return WIDTH_MIN
  if (n > WIDTH_MAX) return WIDTH_MAX
  return Math.round(n / WIDTH_STEP) * WIDTH_STEP
}

function parseWidth(raw: string | null): number {
  if (raw == null) return DEFAULT_WIDTH
  const n = Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_WIDTH
  return clampWidth(n)
}

function alignToFlex(align: ImageAlign): string {
  if (align === "left") return "justify-start"
  if (align === "right") return "justify-end"
  return "justify-center"
}

function ImageNodeView({
  node,
  updateAttributes,
  selected,
  editor,
}: ReactNodeViewProps) {
  const dataImageId = node.attrs[DATA_ATTR] as string | null
  const directSrc = node.attrs.src as string | null
  const alt = (node.attrs.alt as string) ?? ""
  const width = clampWidth(Number(node.attrs.width ?? DEFAULT_WIDTH))
  const align = (ALIGN_VALUES.includes(node.attrs.align)
    ? node.attrs.align
    : "center") as ImageAlign

  const resolved = useQuery(
    api.images.urlFor,
    dataImageId ? { id: dataImageId as Id<"images"> } : "skip",
  )

  const src = dataImageId ? (resolved ?? directSrc) : directSrc
  const editable = editor?.isEditable ?? false

  function bumpWidth(delta: number) {
    updateAttributes({ width: clampWidth(width + delta) })
  }

  return (
    <NodeViewWrapper className="my-2">
      <div className={cn("flex w-full", alignToFlex(align))}>
        <div
          className="relative inline-block"
          style={{ width: `${width}%` }}
        >
          {src ? (
            <img src={src} alt={alt} className="block w-full rounded-md" />
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              <ImageOff className="h-4 w-4" />
              {dataImageId ? "Resolving image…" : "Image src missing"}
            </div>
          )}
          {editable && selected && src && (
            <div className="absolute right-1 top-1 flex flex-col gap-1 rounded-md border bg-background/95 p-1 shadow-md backdrop-blur">
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => bumpWidth(-WIDTH_STEP)}
                  disabled={width <= WIDTH_MIN}
                  title="Smaller"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-9 text-center text-[10px] font-mono tabular-nums text-muted-foreground">
                  {width}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => bumpWidth(WIDTH_STEP)}
                  disabled={width >= WIDTH_MAX}
                  title="Larger"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <input
                type="range"
                min={WIDTH_MIN}
                max={WIDTH_MAX}
                step={WIDTH_STEP}
                value={width}
                onChange={(e) =>
                  updateAttributes({ width: clampWidth(Number(e.target.value)) })
                }
                className="h-1 w-full cursor-pointer accent-primary"
              />
              <div className="flex gap-0.5 border-t pt-1">
                <Button
                  type="button"
                  variant={align === "left" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => updateAttributes({ align: "left" })}
                  title="Align left"
                >
                  <AlignLeft className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant={align === "center" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => updateAttributes({ align: "center" })}
                  title="Align center"
                >
                  <AlignCenter className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant={align === "right" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => updateAttributes({ align: "right" })}
                  title="Align right"
                >
                  <AlignRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
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
        default: DEFAULT_WIDTH as number,
        parseHTML: (element) => parseWidth(element.getAttribute("data-width")),
        renderHTML: (attrs) => {
          const v = clampWidth(Number(attrs.width ?? DEFAULT_WIDTH))
          return { "data-width": String(v) }
        },
      },
      align: {
        default: "center" as ImageAlign,
        parseHTML: (element) => {
          const v = element.getAttribute("data-align")
          return ALIGN_VALUES.includes(v as ImageAlign) ? v : "center"
        },
        renderHTML: (attrs) => {
          const v = attrs.align
          return ALIGN_VALUES.includes(v as ImageAlign)
            ? { "data-align": v }
            : { "data-align": "center" }
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
