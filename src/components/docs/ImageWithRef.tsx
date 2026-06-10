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

import { useRef } from "react"
import { mergeAttributes } from "@tiptap/core"
import Image from "@tiptap/extension-image"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"
import { useQuery } from "convex/react"
import { AlignCenter, AlignLeft, AlignRight, ImageOff } from "lucide-react"
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

  // Outer wrapper is always full width; its width is the 100% reference for the
  // image's width percentage. We measure it during a drag so the handle tracks
  // the cursor regardless of how small the image gets.
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ startX: number; startWidth: number; base: number } | null>(
    null,
  )

  function onHandlePointerDown(e: React.PointerEvent) {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    const base = wrapperRef.current?.getBoundingClientRect().width ?? 0
    if (base <= 0) return
    dragState.current = { startX: e.clientX, startWidth: width, base }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    const st = dragState.current
    if (!st) return
    // Right-aligned images grow leftward, so invert the delta for that case.
    const sign = align === "right" ? -1 : 1
    const deltaPct = ((e.clientX - st.startX) / st.base) * 100 * sign
    const next = Math.round((st.startWidth + deltaPct) / WIDTH_STEP) * WIDTH_STEP
    updateAttributes({ width: clampWidth(next) })
  }

  function onHandlePointerUp(e: React.PointerEvent) {
    if (dragState.current) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      dragState.current = null
    }
  }

  return (
    // draggable + data-drag-handle let ProseMirror own the drag, so dropping
    // MOVES the node (attrs intact). Without it the browser's native <img>
    // drag wins and the drop inserts a fresh full-width copy.
    <NodeViewWrapper className="my-2" draggable={editable ? true : undefined}>
      <div
        ref={wrapperRef}
        data-drag-handle={editable ? "" : undefined}
        className={cn("relative flex w-full", alignToFlex(align))}
      >
        {/* Align toolbar anchored to the OUTER wrapper — never moves with the
            image as it resizes. */}
        {editable && selected && src && (
          <div className="absolute right-0 top-0 z-10 flex gap-0.5 rounded-md border bg-background/95 p-1 shadow-md backdrop-blur">
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
        )}

        <div className="relative inline-block" style={{ width: `${width}%` }}>
          {src ? (
            <img
              src={src}
              alt={alt}
              draggable={false}
              className={cn(
                "block w-full rounded-md",
                editable && selected && "ring-2 ring-primary/40",
              )}
            />
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              <ImageOff className="h-4 w-4" />
              {dataImageId ? "Resolving image…" : "Image src missing"}
            </div>
          )}

          {editable && selected && src && (
            <>
              {/* Width readout pinned to the outer-stable top-left of the image. */}
              <span className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground shadow-sm">
                {width}%
              </span>
              {/* Corner drag handle — sits on the corner you drag, so it stays
                  under the cursor for the whole gesture. */}
              <div
                role="slider"
                aria-label="Resize image"
                aria-valuenow={width}
                aria-valuemin={WIDTH_MIN}
                aria-valuemax={WIDTH_MAX}
                tabIndex={0}
                draggable={false}
                onDragStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                    e.preventDefault()
                    updateAttributes({ width: clampWidth(width + WIDTH_STEP) })
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                    e.preventDefault()
                    updateAttributes({ width: clampWidth(width - WIDTH_STEP) })
                  }
                }}
                className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-background shadow-sm touch-none"
              />
            </>
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
