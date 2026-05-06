// Mobile Floorplan — slimmed-down version of the desktop FloorplanModal.
//
// The image scales to the phone width; pins overlay at pin_x/pin_y%. A
// "Connected Assets" list below mirrors the same data so an operator can
// scroll-tap rather than aim at small pins.

import { useMemo } from "react"
import { useLocation } from "wouter"
import { ChevronRight, MapPin } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { toLegacyAsset } from "@/lib/convex-adapters"
import { Skeleton } from "@/components/ui/skeleton"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { FLOORPLAN_IMAGE_SRC } from "@/components/docs/FloorplanModal"

export function MobileFloorplanPage() {
  const [, navigate] = useLocation()
  const raw = useQuery(api.assets.list)
  const ready = raw !== undefined
  const assets = useMemo(() => (raw ? raw.map(toLegacyAsset) : []), [raw])

  const floorplanName =
    assets.find((a) => a.floorplan)?.floorplan ?? "Floorplan"

  return (
    <div className="flex flex-col">
      <MobileHeader
        backTo="/m/assets"
        title={floorplanName}
        subtitle={
          ready ? `${assets.length} pinned asset${assets.length === 1 ? "" : "s"}` : ""
        }
      />

      <div className="flex flex-col gap-4 p-3">
        {!ready ? (
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-muted/20">
            <div className="relative">
              <img
                src={FLOORPLAN_IMAGE_SRC}
                alt={floorplanName}
                className="block h-auto w-full select-none"
                draggable={false}
              />
              {assets
                .filter(
                  (a) =>
                    a.pin_x != null &&
                    a.pin_y != null &&
                    a.pin_number != null,
                )
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => navigate(`/m/assets/${a.id}`)}
                    aria-label={`${a.code} ${a.name}`}
                    title={`${a.code} — ${a.name}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-95"
                    style={{ left: `${a.pin_x}%`, top: `${a.pin_y}%` }}
                  >
                    <MobileFloorplanPin n={a.pin_number ?? 0} />
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Connected Assets
          </div>
          {!ready ? (
            <>
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </>
          ) : (
            assets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => navigate(`/m/assets/${a.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm transition active:scale-[0.99]"
              >
                <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center gap-0.5 rounded-full bg-primary px-1.5 font-mono text-[11px] font-bold text-primary-foreground">
                  <MapPin className="h-3 w-3" />
                  {a.pin_number != null
                    ? String(a.pin_number).padStart(2, "0")
                    : "—"}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {a.code}
                  </div>
                  <div className="truncate text-sm font-semibold text-foreground">
                    {a.name}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MobileFloorplanPin({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center gap-0.5 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow ring-2 ring-white">
      <MapPin className="h-2.5 w-2.5" />
      {String(n).padStart(2, "0")}
    </span>
  )
}
