// "Related" rail rendered under each assistant message.
//
// In library scope this can balloon — citing 2 docs surfaces N other docs,
// M assets, and K logs that share an asset. We collapse the rail behind a
// single summary line by default so the answer stays the focus; the user
// taps to expand.
//
// In doc/asset scope we don't render at all — the operator is already on
// the relevant entity and "more like this" feels noisy.

import { useState } from "react"
import { ChevronDown, ChevronRight, FileText, Files, QrCode } from "lucide-react"
import type { Asset, AssetLog, Doc } from "@/types"
import { cn } from "@/lib/utils"
import type { RelatedRail as RelatedRailData } from "@/ai"

interface RelatedRailProps {
  data: RelatedRailData
  /** Hide the rail entirely (e.g., on doc/asset scope). */
  hidden?: boolean
  /** Start expanded instead of summary-only. Default false. */
  defaultOpen?: boolean
  onDocClick: (doc: Doc) => void
  onAssetClick: (asset: Asset) => void
  onLogClick: (log: AssetLog) => void
  className?: string
}

export function RelatedRail({
  data,
  hidden,
  defaultOpen = false,
  onDocClick,
  onAssetClick,
  onLogClick,
  className,
}: RelatedRailProps) {
  const { otherDocs, assets, logs } = data
  const [open, setOpen] = useState(defaultOpen)

  if (hidden) return null
  if (!otherDocs.length && !assets.length && !logs.length) return null

  const summary: string[] = []
  if (otherDocs.length)
    summary.push(`${otherDocs.length} doc${otherDocs.length === 1 ? "" : "s"}`)
  if (assets.length)
    summary.push(`${assets.length} asset${assets.length === 1 ? "" : "s"}`)
  if (logs.length)
    summary.push(`${logs.length} log${logs.length === 1 ? "" : "s"}`)

  return (
    <div className={cn("space-y-1.5", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Related — {summary.join(" · ")}
      </button>

      {open && (
        <div className="space-y-2 rounded-lg border border-dashed bg-muted/20 p-2">
          {otherDocs.length > 0 && (
            <RailSection
              icon={Files}
              label="Documents"
              chips={otherDocs.map((d) => ({
                key: d.id,
                primary: d.naming_code,
                secondary: d.title,
                onClick: () => onDocClick(d),
              }))}
              tone="primary"
            />
          )}
          {assets.length > 0 && (
            <RailSection
              icon={QrCode}
              label="Assets"
              chips={assets.map((a) => ({
                key: a.id,
                primary: a.code,
                secondary: a.name,
                onClick: () => onAssetClick(a),
              }))}
              tone="emerald"
            />
          )}
          {logs.length > 0 && (
            <RailSection
              icon={FileText}
              label="Logs"
              chips={logs.map((l) => ({
                key: `${l.asset_id}::${l.code}`,
                primary: l.code,
                secondary: l.name,
                onClick: () => onLogClick(l),
              }))}
              tone="amber"
            />
          )}
        </div>
      )}
    </div>
  )
}

interface ChipModel {
  key: string
  primary: string
  secondary: string
  onClick: () => void
}

function RailSection({
  icon: Icon,
  label,
  chips,
  tone,
}: {
  icon: typeof FileText
  label: string
  chips: ChipModel[]
  tone: "primary" | "emerald" | "amber"
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 hover:border-emerald-500/40 dark:text-emerald-200"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/5 text-amber-800 hover:border-amber-500/40 dark:text-amber-200"
        : "border-primary/20 bg-primary/5 text-foreground hover:border-primary/40"
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={c.onClick}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
              toneClass,
            )}
          >
            <span className="font-mono font-semibold">{c.primary}</span>
            <span className="max-w-[14ch] truncate text-muted-foreground">
              {c.secondary}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
