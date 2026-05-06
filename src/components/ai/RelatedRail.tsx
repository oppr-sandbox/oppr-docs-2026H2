import { Factory, Files, FileText } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import {
  toLegacyAsset,
  toLegacyAssetLog,
  toLegacyDoc,
} from "@/lib/convex-adapters"
import type { Asset, AssetLog, Doc } from "@/types"

interface RelatedRailProps {
  citedDocumentIds: string[]
  hidden?: boolean
  onDocClick: (doc: Doc) => void
  onAssetClick: (asset: Asset) => void
  onLogClick: (log: AssetLog) => void
}

export function RelatedRail({
  citedDocumentIds,
  hidden,
  onDocClick,
  onAssetClick,
  onLogClick,
}: RelatedRailProps) {
  const result = useQuery(
    api.documents.relatedTo,
    citedDocumentIds.length > 0
      ? {
          documentIds: citedDocumentIds as Id<"documents">[],
        }
      : "skip",
  )

  if (hidden || !result) return null

  const otherDocs = result.otherDocs.map(toLegacyDoc)
  const assets = result.assets.map(toLegacyAsset)
  const logs = result.logs.map(toLegacyAssetLog)

  if (
    otherDocs.length === 0 &&
    assets.length === 0 &&
    logs.length === 0
  ) {
    return null
  }

  return (
    <div className="rounded-md border bg-background/60 p-2 text-xs">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Related
      </div>
      <div className="flex flex-col gap-1.5">
        {otherDocs.length > 0 && (
          <Group icon={Files} label="Other documents">
            {otherDocs.slice(0, 5).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onDocClick(d)}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-muted"
              >
                <span className="font-mono text-[10px] font-bold">
                  {d.naming_code}
                </span>
                <span className="truncate text-muted-foreground">
                  {d.title}
                </span>
              </button>
            ))}
          </Group>
        )}
        {assets.length > 0 && (
          <Group icon={Factory} label="Assets">
            {assets.slice(0, 5).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onAssetClick(a)}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-muted"
              >
                <span className="font-mono text-[10px] font-bold">
                  {a.code}
                </span>
                <span className="truncate text-muted-foreground">
                  {a.name}
                </span>
              </button>
            ))}
          </Group>
        )}
        {logs.length > 0 && (
          <Group icon={FileText} label="Logs">
            {logs.slice(0, 5).map((l) => (
              <button
                key={`${l.asset_id}-${l.code}`}
                type="button"
                onClick={() => onLogClick(l)}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-muted"
              >
                <span className="font-mono text-[10px] font-bold">
                  {l.code}
                </span>
                <span className="truncate text-muted-foreground">
                  {l.name}
                </span>
              </button>
            ))}
          </Group>
        )}
      </div>
    </div>
  )
}

function Group({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Files
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1 px-1.5 text-[10px] font-semibold text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}
