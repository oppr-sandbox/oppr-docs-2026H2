// Asset Preview modal — mirrors the QR-card popover from the LOGS module.
//
// Surfaces everything an operator would see in the field: the QR, the asset
// description, level, floorplan, and the connected log. The header buttons
// (settings / print / download) are wired to no-ops at v1 — they're here for
// visual parity with the LOGS screenshot.

import type { Asset } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer, SlidersHorizontal } from "lucide-react"
import { AssetQrSvg } from "./AssetQrSvg"

export function AssetPreviewModal({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 sm:rounded-xl">
        {asset ? (
          <div className="px-8 pb-8 pt-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold">
                Asset Preview
              </DialogTitle>
              <div className="flex items-center gap-2 pr-8">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  aria-label="Preview options"
                  onClick={(e) => e.preventDefault()}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  aria-label="Print"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  aria-label="Download"
                  onClick={(e) => e.preventDefault()}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Brand logo strip */}
            <div className="mt-6 flex justify-center">
              <OpprLogo />
            </div>

            <div className="my-5 border-t" />

            {/* QR */}
            <div className="flex justify-center">
              <AssetQrSvg value={asset.qr_token} size={260} />
            </div>

            <div className="my-5 border-t" />

            {/* Details */}
            <div className="space-y-3 text-center">
              <h3 className="text-base font-semibold">{asset.name}</h3>
              {asset.description && (
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {asset.description}
                </p>
              )}
              <div className="space-y-1 pt-1 text-sm">
                <div>
                  <span className="font-semibold">Level:</span>{" "}
                  <span>{asset.level}</span>
                </div>
                {asset.floorplan && (
                  <div>
                    <span className="font-semibold">Floorplan:</span>{" "}
                    <span>{asset.floorplan}</span>
                  </div>
                )}
                {asset.linked_log_code && asset.linked_log_name && (
                  <div>
                    <span className="font-semibold">Linked Log:</span>{" "}
                    <span>
                      {asset.linked_log_name} - {asset.linked_log_code}
                    </span>
                  </div>
                )}
              </div>
              {asset.linked_log_description && (
                <p className="pt-1 text-sm text-muted-foreground">
                  {asset.linked_log_description}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function OpprLogo() {
  // Minimalist Oppr-style mark — green leaf + orange dot beside a small wordmark.
  return (
    <div className="flex items-center gap-1.5">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="11" cy="14" r="8" fill="#1FB5A8" />
        <circle cx="20" cy="9" r="3.5" fill="#F2994A" />
      </svg>
    </div>
  )
}
