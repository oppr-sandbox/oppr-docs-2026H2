import { useMemo } from "react"
import { useLocation } from "wouter"
import { useDb, useDbWatcher, listAssets } from "@/db"
import { Skeleton } from "@/components/ui/skeleton"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { QrScanCard } from "@/components/mobile/QrScanCard"

export function MobileScanPage() {
  const { db, ready } = useDb()
  const watcher = useDbWatcher()
  const [, navigate] = useLocation()

  const assets = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => (db ? listAssets(db) : []),
    [db, watcher],
  )

  return (
    <div className="flex flex-col">
      <MobileHeader
        backTo={null}
        title="Scan QR"
        subtitle="Tap a QR to simulate a scan"
      />
      <div className="flex flex-col gap-3 p-3">
        {!ready ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No assets available.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {assets.map((asset) => (
              <QrScanCard
                key={asset.id}
                asset={asset}
                onClick={() => navigate(`/m/assets/${asset.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
