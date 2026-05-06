// PpeBlock — block-level row of PPE pictogram chips for procedure headers.
//
// Stores the selected PPE item codes as a comma-separated string in
// `data-items`. Render is a horizontal flex row of icon + label chips. The
// block is `atom: true` so the row is treated as a single unit (you can't
// type inside it).
//
// Two pickers: PpePicker (Dialog, used by slash menu deep entry) and
// PpeQuickPalette (Popover, used by the toolbar PPE button) — they share
// PPE_META + PPE_ORDER so both stay in sync.

import { useState } from "react"
import { Node, mergeAttributes, type RawCommands } from "@tiptap/core"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react"
import { Check, HardHat, Glasses, Footprints, Shirt, Shield, Wind, Ear } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PpeItem =
  | "hardhat"
  | "glasses"
  | "gloves"
  | "boots"
  | "hi-vis"
  | "ear-pro"
  | "mask"
  | "dust-mask"

interface PpeMeta {
  label: string
  icon: typeof HardHat
}

export const PPE_META: Record<PpeItem, PpeMeta> = {
  hardhat: { label: "Hard hat", icon: HardHat },
  glasses: { label: "Safety glasses", icon: Glasses },
  gloves: { label: "Gloves", icon: Shield },
  boots: { label: "Safety boots", icon: Footprints },
  "hi-vis": { label: "Hi-vis vest", icon: Shirt },
  "ear-pro": { label: "Ear protection", icon: Ear },
  mask: { label: "Respirator", icon: Wind },
  "dust-mask": { label: "Dust mask", icon: Wind },
}

const PPE_ORDER: PpeItem[] = [
  "hardhat",
  "glasses",
  "gloves",
  "boots",
  "hi-vis",
  "ear-pro",
  "mask",
  "dust-mask",
]

function parseItems(raw: string | undefined): PpeItem[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is PpeItem => (PPE_ORDER as string[]).includes(s))
}

function PpeView({ node }: NodeViewProps) {
  const items = parseItems(node.attrs.items as string | undefined)
  if (!items.length) {
    return (
      <NodeViewWrapper
        as="div"
        data-ppe
        className="my-3 flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
      >
        Required PPE: (none configured — edit to pick)
      </NodeViewWrapper>
    )
  }
  return (
    <NodeViewWrapper
      as="div"
      data-ppe
      data-items={items.join(",")}
      className="my-3 flex flex-wrap items-center gap-2 rounded-md border border-orange-300 bg-orange-50 px-3 py-2 dark:border-orange-500/40 dark:bg-orange-500/10"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-900 dark:text-orange-200">
        Required PPE
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => {
          const meta = PPE_META[it]
          const Icon = meta.icon
          return (
            <span
              key={it}
              className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-white px-2 py-0.5 text-[11px] font-medium text-orange-900 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-100"
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
          )
        })}
      </div>
    </NodeViewWrapper>
  )
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ppe: {
      insertPpe: (items: PpeItem[]) => ReturnType
    }
  }
}

export const PpeNode = Node.create({
  name: "ppe",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      items: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-items") ?? "",
        renderHTML: (attrs) => ({ "data-items": attrs.items }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-ppe]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-ppe": "" })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PpeView)
  },

  addCommands() {
    const commands: Partial<RawCommands> = {
      insertPpe:
        (items: PpeItem[]) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { items: items.join(",") },
            })
            .run()
        },
    }
    return commands as RawCommands
  },
})

// --- Picker dialog ----------------------------------------------------------

interface PpePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (items: PpeItem[]) => void
  initial?: PpeItem[]
}

export function PpePicker({
  open,
  onOpenChange,
  onSelect,
  initial = [],
}: PpePickerProps) {
  const [picked, setPicked] = useState<Set<PpeItem>>(new Set(initial))

  function toggle(it: PpeItem) {
    const next = new Set(picked)
    if (next.has(it)) next.delete(it)
    else next.add(it)
    setPicked(next)
  }

  function commit() {
    onSelect(PPE_ORDER.filter((it) => picked.has(it)))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Required PPE</DialogTitle>
          <DialogDescription>
            Pick the personal protective equipment required for this procedure.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-2">
          {PPE_ORDER.map((it) => {
            const meta = PPE_META[it]
            const Icon = meta.icon
            const on = picked.has(it)
            return (
              <button
                key={it}
                type="button"
                onClick={() => toggle(it)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  on
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{meta.label}</span>
                {on && <Check className="h-4 w-4 text-primary" />}
              </button>
            )
          })}
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

// --- Inline mini-palette (toolbar default) ---------------------------------

interface PpeQuickPaletteProps {
  /** Inserts a fresh PPE block with the toggled selection. */
  onInsert: (items: PpeItem[]) => void
  /** Custom trigger; defaults to the toolbar's hard-hat button. */
  children?: React.ReactNode
}

/**
 * Anchored popover used as the default surface for the toolbar PPE button.
 * Operators toggle pictograms inline and click "Insert PPE row" to drop a
 * fresh block at the cursor. The Dialog-based PpePicker stays around for the
 * slash menu's long-form entry and for editing existing blocks.
 */
export function PpeQuickPalette({ onInsert, children }: PpeQuickPaletteProps) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Set<PpeItem>>(new Set())

  function toggle(it: PpeItem) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(it)) next.delete(it)
      else next.add(it)
      return next
    })
  }

  function reset() {
    setPicked(new Set())
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Required PPE"
          >
            <HardHat className="h-4 w-4 text-orange-600" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[320px] p-2">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <HardHat className="h-3 w-3" />
          Required PPE
        </div>
        <div className="grid grid-cols-2 gap-1">
          {PPE_ORDER.map((it) => {
            const meta = PPE_META[it]
            const Icon = meta.icon
            const on = picked.has(it)
            return (
              <button
                key={it}
                type="button"
                onClick={() => toggle(it)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11px] font-medium transition-colors",
                  on
                    ? "border-orange-400 bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-100"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1 truncate">{meta.label}</span>
                {on && <Check className="h-3 w-3" />}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
          <div className="text-[10px] text-muted-foreground">
            {picked.size} selected
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => {
                setOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-[11px]"
              disabled={picked.size === 0}
              onClick={() => {
                onInsert(PPE_ORDER.filter((it) => picked.has(it)))
                setOpen(false)
                reset()
              }}
            >
              Insert PPE row
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
