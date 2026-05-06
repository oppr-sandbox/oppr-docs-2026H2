// Mobile Assets list — searchable, with doc/log counts and pin badges.
//
// Reachable from the bottom-nav. Tapping a row navigates to the asset detail
// page; tapping the star toggles a localStorage-pinned flag (used on Home).

import { useMemo, useState } from "react"
import { Link, useLocation } from "wouter"
import { Map as MapIcon, Search } from "lucide-react"
import {
  useDb,
  useDbWatcher,
  listAssets,
  listAllAssetLogs,
} from "@/db"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { MobileSearchInput } from "@/components/mobile/MobileSearchInput"
import { MobileAssetCard } from "@/components/mobile/MobileAssetCard"
import { MobileGlobalSearch } from "@/components/mobile/MobileGlobalSearch"
import { usePinned } from "@/components/mobile/use-mobile-prefs"

export function MobileAssetsPage() {
  const { db, ready } = useDb()
  const watcher = useDbWatcher()
  const [, navigate] = useLocation()
  const { isPinned, togglePin } = usePinned()
  const [query, setQuery] = useState("")
  const [globalOpen, setGlobalOpen] = useState(false)

  const assets = useMemo(
    () => (db ? listAssets(db) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, watcher],
  )

  const logsByAsset = useMemo(
    () => (db ? listAllAssetLogs(db) : new Map<string, unknown[]>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, watcher],
  )

  const docsByAsset = useMemo(() => {
    const map = new Map<string, number>()
    if (!db) return map
    const stmt = db.prepare(
      `SELECT asset_id, COUNT(*) AS n FROM document_assets GROUP BY asset_id`,
    )
    try {
      while (stmt.step()) {
        const r = stmt.getAsObject() as { asset_id: string; n: number }
        map.set(r.asset_id, r.n)
      }
    } finally {
      stmt.free()
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, watcher])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return assets
    return assets.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q),
    )
  }, [assets, query])

  return (
    <div className="flex flex-col">
      <MobileHeader
        backTo={null}
        title="Assets"
        subtitle={`${assets.length} on this site`}
        right={
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search everything"
              className="h-10 w-10"
              onClick={() => setGlobalOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link href="/m/floorplan">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open floorplan"
                className="h-10 w-10"
              >
                <MapIcon className="h-5 w-5" />
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-3 p-3">
        <MobileSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search code, name, location…"
        />

        {!ready ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            {query ? "No assets match." : "No assets yet."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((asset) => (
              <MobileAssetCard
                key={asset.id}
                asset={asset}
                docCount={docsByAsset.get(asset.id) ?? 0}
                logCount={(logsByAsset.get(asset.id) ?? []).length}
                onClick={() => navigate(`/m/assets/${asset.id}`)}
                pinned={isPinned("asset", asset.id)}
                onTogglePin={() =>
                  togglePin({
                    kind: "asset",
                    id: asset.id,
                    label: asset.name,
                    sublabel: asset.code,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <MobileGlobalSearch
        open={globalOpen}
        onClose={() => setGlobalOpen(false)}
      />
    </div>
  )
}
