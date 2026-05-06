// Scope chip — the always-visible "what am I asking about" pill at the top
// of every chat panel. Click to swap scope without leaving the panel.
//
// Library / asset / doc are all reachable here; the chip itself shows the
// active entity's code + label so the user always knows where they are.

import { useMemo, useState } from "react"
import {
  ChevronDown,
  Factory,
  FileText,
  Files,
  Globe,
  Search,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDb, useDbWatcher } from "@/db"
import { listAssets } from "@/db/repositories/assets"
import { listDocuments } from "@/db/repositories/documents"
import { getDocument } from "@/db/repositories/documents"
import { getAsset } from "@/db/repositories/assets"
import type { AskPanelScope } from "./AskPanel"
import { cn } from "@/lib/utils"

interface ScopeChipProps {
  scope: AskPanelScope
  onChange: (next: AskPanelScope) => void
  className?: string
}

export function ScopeChip({ scope, onChange, className }: ScopeChipProps) {
  const [open, setOpen] = useState(false)
  const label = useScopeLabel(scope)

  const Icon =
    scope.kind === "library"
      ? Globe
      : scope.kind === "asset"
        ? Factory
        : FileText

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5",
            className,
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">
            <span className="font-semibold">{label.kindLabel}</span>
            {label.code && (
              <>
                <span className="text-muted-foreground"> · </span>
                <span className="font-mono">{label.code}</span>
              </>
            )}
            {label.title && (
              <>
                <span className="text-muted-foreground"> · </span>
                <span className="text-muted-foreground">{label.title}</span>
              </>
            )}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <ScopeSwitcher
          scope={scope}
          onPick={(next) => {
            onChange(next)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export function useScopeLabel(scope: AskPanelScope) {
  const { db } = useDb()
  const watcher = useDbWatcher()
  return useMemo(() => {
    if (scope.kind === "library") {
      return { kindLabel: "Library", code: null, title: "All documents" }
    }
    if (!db) return { kindLabel: scope.kind, code: null, title: null }
    if (scope.kind === "doc") {
      const d = getDocument(db, scope.id)
      return {
        kindLabel: "Document",
        code: d?.naming_code ?? null,
        title: d?.title ?? null,
      }
    }
    const a = getAsset(db, scope.id)
    return {
      kindLabel: "Asset",
      code: a?.code ?? null,
      title: a?.name ?? null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, scope, watcher])
}

function ScopeSwitcher({
  scope,
  onPick,
}: {
  scope: AskPanelScope
  onPick: (next: AskPanelScope) => void
}) {
  const { db } = useDb()
  const watcher = useDbWatcher()
  const [tab, setTab] = useState<"library" | "doc" | "asset">(scope.kind)
  const [query, setQuery] = useState("")

  const docs = useMemo(
    () => (db ? listDocuments(db) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, watcher],
  )
  const assets = useMemo(
    () => (db ? listAssets(db) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, watcher],
  )

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.naming_code.toLowerCase().includes(q),
    )
  }, [docs, query])

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return assets
    return assets.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q),
    )
  }, [assets, query])

  return (
    <div className="flex flex-col">
      <div className="border-b p-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="library" className="text-xs">
              <Globe className="mr-1 h-3 w-3" />
              Library
            </TabsTrigger>
            <TabsTrigger value="doc" className="text-xs">
              <FileText className="mr-1 h-3 w-3" />
              Document
            </TabsTrigger>
            <TabsTrigger value="asset" className="text-xs">
              <Factory className="mr-1 h-3 w-3" />
              Asset
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === "library" ? (
        <div className="space-y-2 p-3">
          <p className="text-xs text-muted-foreground">
            Ask across every document in the library. Best for catalog,
            comparison, or "where do I find …" questions.
          </p>
          <button
            type="button"
            onClick={() => onPick({ kind: "library" })}
            className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Use library scope
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "doc" ? "Search documents…" : "Search assets…"}
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-auto p-1">
            {tab === "doc" ? (
              <DocList
                docs={filteredDocs}
                onPick={(id) => onPick({ kind: "doc", id })}
              />
            ) : (
              <AssetList
                assets={filteredAssets}
                onPick={(id) => onPick({ kind: "asset", id })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DocList({
  docs,
  onPick,
}: {
  docs: ReturnType<typeof listDocuments>
  onPick: (id: string) => void
}) {
  if (!docs.length) {
    return (
      <div className="px-2 py-6 text-center text-xs text-muted-foreground">
        No documents match.
      </div>
    )
  }
  return (
    <ul className="flex flex-col">
      {docs.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            onClick={() => onPick(d.id)}
            className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
          >
            <Files className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] font-bold">
                {d.naming_code}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {d.title}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

function AssetList({
  assets,
  onPick,
}: {
  assets: ReturnType<typeof listAssets>
  onPick: (id: string) => void
}) {
  if (!assets.length) {
    return (
      <div className="px-2 py-6 text-center text-xs text-muted-foreground">
        No assets match.
      </div>
    )
  }
  return (
    <ul className="flex flex-col">
      {assets.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => onPick(a.id)}
            className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
          >
            <Factory className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] font-bold">{a.code}</div>
              <div className="truncate text-xs text-muted-foreground">
                {a.name}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
