// SafetyPalette
//
// Popover anchored to the toolbar's Safety button. Renders a 4×4 grid of
// typed callouts (CalloutKind) so authors can pick the correct safety frame
// instead of typing "LOTO required" into a generic Danger callout. Each
// click inserts a callout via the editor command and closes the popover.
//
// 13 entries currently, grouped visually by tone (danger / warning / notice
// / tip). The icon does the per-type lifting; tone is for severity scanning.

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { CALLOUT_META, type CalloutKind } from "./CalloutBlock"

const SAFETY_ORDER: CalloutKind[] = [
  // Danger family
  "danger",
  "hotwork",
  "loto",
  "electrical",
  // Warning family
  "warning",
  "caution",
  "heights",
  "confined",
  // Notice family
  "notice",
  "authorised",
  "permit",
  "cryo",
  // Tip
  "tip",
]

const TONE_RING: Record<string, string> = {
  danger: "ring-red-400/40 hover:ring-red-400/70",
  warning: "ring-amber-400/40 hover:ring-amber-400/70",
  notice: "ring-sky-400/40 hover:ring-sky-400/70",
  tip: "ring-emerald-400/40 hover:ring-emerald-400/70",
}

const TONE_TEXT: Record<string, string> = {
  danger: "text-red-700 dark:text-red-300",
  warning: "text-amber-700 dark:text-amber-300",
  notice: "text-sky-700 dark:text-sky-300",
  tip: "text-emerald-700 dark:text-emerald-300",
}

interface SafetyPaletteProps {
  onSelect: (kind: CalloutKind) => void
  /** Custom trigger; defaults to a 32×32 ghost button with a ShieldAlert icon. */
  children?: React.ReactNode
  /** Force-controlled open state (used by slash-menu integration). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SafetyPalette({
  onSelect,
  children,
  open,
  onOpenChange,
}: SafetyPaletteProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Safety palette"
          >
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[340px] p-2">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ShieldAlert className="h-3 w-3" />
          Safety callouts
        </div>
        <div className="grid grid-cols-4 gap-1">
          {SAFETY_ORDER.map((kind) => {
            const meta = CALLOUT_META[kind]
            const Icon = meta.icon
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  onSelect(kind)
                  onOpenChange?.(false)
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border bg-background px-1.5 py-2 text-[10px] font-medium transition-colors hover:bg-muted/40",
                  "ring-1 ring-inset",
                  TONE_RING[meta.tone],
                )}
                title={meta.label}
              >
                <Icon className={cn("h-4 w-4", TONE_TEXT[meta.tone])} />
                <span className="line-clamp-2 text-center leading-tight">
                  {meta.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">
          Click a tile to insert a typed callout. Use the slash menu (/) for the
          long form picker.
        </div>
      </PopoverContent>
    </Popover>
  )
}
