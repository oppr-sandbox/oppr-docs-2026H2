// Operator-facing summary card shown above the document body on mobile.
//
// What an operator needs at a glance: (1) what PPE before they start,
// (2) which assets this doc applies to so they can scan/jump. Anything
// else (owner, version, dates) lives in the header subtitle and we keep
// this card thin so the body shows up above the fold on a phone.

import { useLocation } from "wouter"
import {
  Factory,
  HardHat,
  Glasses,
  Footprints,
  Shirt,
  Shield,
  Wind,
  Ear,
} from "lucide-react"
import type { Asset } from "@/types"

type PpeItem =
  | "hardhat"
  | "glasses"
  | "gloves"
  | "boots"
  | "hi-vis"
  | "ear-pro"
  | "mask"
  | "dust-mask"

const PPE_ICON: Record<PpeItem, typeof HardHat> = {
  hardhat: HardHat,
  glasses: Glasses,
  gloves: Shield,
  boots: Footprints,
  "hi-vis": Shirt,
  "ear-pro": Ear,
  mask: Wind,
  "dust-mask": Wind,
}

interface MobileDocSummaryProps {
  assets: Asset[]
  ppeItems: PpeItem[]
}

export function MobileDocSummary({
  assets,
  ppeItems,
}: MobileDocSummaryProps) {
  const [, navigate] = useLocation()
  if (ppeItems.length === 0 && assets.length === 0) return null

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-2xl border bg-card p-3">
      {ppeItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            PPE
          </span>
          {ppeItems.map((it) => {
            const Icon = PPE_ICON[it]
            return (
              <span
                key={it}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100"
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            )
          })}
        </div>
      )}
      {assets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Assets
          </span>
          {assets.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/m/assets/${a.id}`)}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 font-mono text-[11px] hover:border-primary/50"
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
