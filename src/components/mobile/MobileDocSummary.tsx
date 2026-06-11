// Operator-facing summary card shown above the document body on mobile.
//
// What an operator needs at a glance: (1) what PPE before they start,
// (2) which assets this doc applies to so they can scan/jump.
//
// PPE chips are tap targets — each opens a Popover with the item's label and
// short description so an operator who doesn't recognise a pictogram can
// still find out what's required without leaving the page.

import { useState } from "react"
import { useLocation } from "wouter"
import { Factory, X } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { usePpeCatalog } from "@/lib/ppeCatalog"
import { ppeDataUrl } from "@/lib/ppePictograms"
import type { Asset } from "@/types"

interface MobileDocSummaryProps {
  assets: Asset[]
  ppeItems: string[]
}

export function MobileDocSummary({
  assets,
  ppeItems,
}: MobileDocSummaryProps) {
  const [, navigate] = useLocation()
  const [open, setOpen] = useState<string | null>(null)
  const { resolve } = usePpeCatalog()
  if (ppeItems.length === 0 && assets.length === 0) return null

  return (
    <div className="mb-2.5 flex flex-col gap-2 rounded-lg border bg-card p-2.5">
      {ppeItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            PPE
          </span>
          {ppeItems.map((slug) => {
            const meta = resolve(slug)
            return (
              <Popover
                key={slug}
                open={open === slug}
                onOpenChange={(o) => setOpen(o ? slug : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${meta.label} info`}
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-1.5 text-[10px] font-medium text-blue-900 transition-colors hover:bg-blue-100 active:scale-95 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100"
                  >
                    <img src={ppeDataUrl(meta.pictogramId)} alt="" width={14} height={14} draggable={false} />
                    {meta.label}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  sideOffset={6}
                  className="w-[240px] p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                      <img src={ppeDataUrl(meta.pictogramId)} alt="" width={16} height={16} draggable={false} />
                      {meta.label}
                    </div>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                      aria-label="Close"
                      onClick={() => setOpen(null)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {meta.description && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {meta.description}
                    </p>
                  )}
                </PopoverContent>
              </Popover>
            )
          })}
        </div>
      )}
      {assets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Assets
          </span>
          {assets.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/m/assets/${a.id}`)}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 font-mono text-[10px] hover:border-primary/50"
            >
              <Factory className="h-3 w-3" />
              {a.code}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
