// DiagramBlock — inline SVG figure node.
//
// We accept a raw SVG string in `data-svg`. Rendering uses
// dangerouslySetInnerHTML, so the picker offers curated presets only — we do
// NOT accept arbitrary user-pasted SVG in the picker (script-stripping would
// be required for that, and it's overkill for the showcase). The seed and
// new-doc templates produce all current SVGs.

import { useState } from "react"
import { Node, mergeAttributes, type RawCommands } from "@tiptap/core"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DIAGRAM_PRESETS, type DiagramPresetKey } from "./diagramPresets"

function DiagramView({ node }: NodeViewProps) {
  const svg = (node.attrs.svg as string) ?? ""
  const caption = (node.attrs.caption as string) ?? ""
  return (
    <NodeViewWrapper
      as="figure"
      data-diagram
      className="my-4 flex flex-col items-center gap-1.5 rounded-md border bg-card p-4"
    >
      <div
        className="diagram-svg w-full max-w-2xl text-foreground"
        // SVG comes from controlled presets; we don't accept free-form input.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && (
        <figcaption className="text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </NodeViewWrapper>
  )
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    diagram: {
      insertDiagram: (attrs: { svg: string; caption: string }) => ReturnType
    }
  }
}

export const DiagramNode = Node.create({
  name: "diagram",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      svg: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-svg") ?? "",
        renderHTML: (attrs) => ({ "data-svg": attrs.svg }),
      },
      caption: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-caption") ?? "",
        renderHTML: (attrs) => ({ "data-caption": attrs.caption }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "figure[data-diagram]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { "data-diagram": "" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramView)
  },

  addCommands() {
    const commands: Partial<RawCommands> = {
      insertDiagram:
        (attrs: { svg: string; caption: string }) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({ type: this.name, attrs })
            .run()
        },
    }
    return commands as RawCommands
  },
})

// --- Picker dialog ----------------------------------------------------------

interface DiagramPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (attrs: { svg: string; caption: string }) => void
}

export function DiagramPicker({
  open,
  onOpenChange,
  onSelect,
}: DiagramPickerProps) {
  const keys = Object.keys(DIAGRAM_PRESETS) as DiagramPresetKey[]
  const [picked, setPicked] = useState<DiagramPresetKey>(keys[0])
  const [caption, setCaption] = useState("")

  function commit() {
    const preset = DIAGRAM_PRESETS[picked]
    onSelect({ svg: preset.svg, caption: caption || preset.defaultCaption })
    onOpenChange(false)
    setCaption("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert diagram</DialogTitle>
          <DialogDescription>
            Pick a preset diagram. Caption appears under the figure.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-2">
          {keys.map((k) => {
            const preset = DIAGRAM_PRESETS[k]
            const on = picked === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPicked(k)}
                className={cn(
                  "flex flex-col items-stretch gap-1 rounded-md border p-2 text-left transition-colors",
                  on ? "border-primary bg-primary/10" : "border-input hover:bg-muted",
                )}
              >
                <div
                  className="h-32 w-full overflow-hidden rounded bg-background"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: preset.svg }}
                />
                <div className="text-xs font-medium">{preset.label}</div>
              </button>
            )
          })}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="diagram-caption">
            Caption
          </label>
          <Input
            id="diagram-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={DIAGRAM_PRESETS[picked].defaultCaption}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={commit}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
