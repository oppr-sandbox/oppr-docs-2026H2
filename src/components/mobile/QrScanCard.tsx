// Tap target that simulates an asset QR scan. Renders the same QR pattern as
// the desktop AssetPreviewModal so screenshots side-by-side stay consistent.

import { ChevronRight, MapPin } from "lucide-react"
import type { Asset } from "@/types"
import { AssetQrSvg } from "@/components/docs/AssetQrSvg"

interface QrScanCardProps {
  asset: Asset
  onClick: () => void
}

export function QrScanCard({ asset, onClick }: QrScanCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-border">
        <AssetQrSvg
          value={asset.qr_token}
          size={72}
          className="h-full w-full"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {asset.code}
        </div>
        <div className="truncate text-base font-semibold text-foreground">
          {asset.name}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {asset.location && <span className="truncate">{asset.location}</span>}
          {asset.pin_number != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              <MapPin className="h-2.5 w-2.5" />
              {String(asset.pin_number).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  )
}
