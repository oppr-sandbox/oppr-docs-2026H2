import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import { LayoutList, Layers, PlusCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDb, useDbWatcher } from "@/db"
import {
  listDocuments,
  updateDocument,
  type DocumentFilters,
} from "@/db/repositories/documents"
import type { Doc, DocumentStatus, DocumentType } from "@/types"
import {
  DocumentLibraryTable,
  type AssetPreview,
  type DocumentRowAction,
} from "@/components/docs/DocumentLibraryTable"
import { AskIdaSheet } from "@/components/ai/AskIdaSheet"
import { toast } from "sonner"

type StatusFilter = DocumentStatus | "all"
type TypeFilter = DocumentType | "all"

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "All types" },
  { value: "sop", label: "SOP" },
  { value: "manual", label: "Manual" },
  { value: "work_instruction", label: "Work instruction" },
  { value: "lmra", label: "LMRA" },
]

function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function LibraryPage() {
  const { db, ready } = useDb()
  const watcher = useDbWatcher()
  const [, navigate] = useLocation()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [groupByType, setGroupByType] = useState(false)

  const filters: DocumentFilters = useMemo(() => {
    const f: DocumentFilters = {}
    if (search.trim()) f.search = search.trim()
    if (statusFilter !== "all") f.status = statusFilter
    if (typeFilter !== "all") f.type = typeFilter
    return f
  }, [search, statusFilter, typeFilter])

  const docs = useMemo(() => {
    if (!db) return []
    return listDocuments(db, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filters, watcher])

  // Linked assets per document (id, code, name) for the hover popover.
  // One join query so there's no N+1 read.
  const assetsByDoc = useMemo(() => {
    const map: Record<string, AssetPreview[]> = {}
    if (!db) return map
    const stmt = db.prepare(
      `SELECT da.document_id AS document_id, a.id, a.code, a.name
         FROM document_assets da
         JOIN assets a ON a.id = da.asset_id
        ORDER BY a.code`,
    )
    try {
      while (stmt.step()) {
        const r = stmt.getAsObject() as {
          document_id: string
          id: string
          code: string
          name: string
        }
        const list = map[r.document_id] ?? []
        list.push({ id: r.id, code: r.code, name: r.name })
        map[r.document_id] = list
      }
    } finally {
      stmt.free()
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, watcher])

  function handleAction(action: DocumentRowAction, doc: Doc) {
    if (action === "open") {
      navigate(`/docs/${doc.id}`)
      return
    }
    if (action === "copy-id") {
      navigator.clipboard
        .writeText(doc.naming_code)
        .then(() => toast.success(`Copied ${doc.naming_code}`))
        .catch(() => toast.error("Failed to copy"))
      return
    }
    if (action === "duplicate") {
      toast.info("Duplicate is not wired up in the showcase build.")
      return
    }
    if (action === "archive") {
      if (!db) return
      try {
        updateDocument(db, doc.id, { status: "archived" })
        toast.success(`Archived ${doc.naming_code}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to archive")
      }
    }
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div>
          <h1 className="text-base font-semibold">Document library</h1>
          <p className="text-xs text-muted-foreground">
            All SOPs, manuals, and work instructions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AskIdaSheet scope={{ kind: "library" }} variant="outline" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/docs/new?kind=pdf")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF
          </Button>
          <Button size="sm" onClick={() => navigate("/docs/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New document
          </Button>
        </div>
      </header>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by title or naming code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TypeFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
              <Button
                type="button"
                variant={groupByType ? "ghost" : "secondary"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setGroupByType(false)}
                title="Flat list"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={groupByType ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setGroupByType(true)}
                title="Group by type"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {docs.length} document{docs.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {!ready ? (
          <LoadingState />
        ) : groupByType ? (
          <GroupedByType
            docs={docs}
            assetsByDoc={assetsByDoc}
            onRowClick={(d) => navigate(`/docs/${d.id}`)}
            onAssetClick={(id) => navigate(`/assets/${id}`)}
            onAction={handleAction}
          />
        ) : (
          <DocumentLibraryTable
            docs={docs}
            assetsByDoc={assetsByDoc}
            onRowClick={(d) => navigate(`/docs/${d.id}`)}
            onAssetClick={(id) => navigate(`/assets/${id}`)}
            onAction={handleAction}
          />
        )}
      </div>
    </div>
  )
}

const TYPE_LABELS: Record<DocumentType, string> = {
  sop: "Standard operating procedures",
  manual: "Manuals",
  work_instruction: "Work instructions",
  lmra: "LMRA cards",
}
const TYPE_ORDER: DocumentType[] = ["sop", "manual", "work_instruction", "lmra"]

interface GroupedByTypeProps {
  docs: Doc[]
  assetsByDoc: Record<string, AssetPreview[]>
  onRowClick: (d: Doc) => void
  onAssetClick: (id: string) => void
  onAction: (action: DocumentRowAction, doc: Doc) => void
}

function GroupedByType({
  docs,
  assetsByDoc,
  onRowClick,
  onAssetClick,
  onAction,
}: GroupedByTypeProps) {
  const groups = useMemo(() => {
    const map = new Map<DocumentType, Doc[]>()
    for (const t of TYPE_ORDER) map.set(t, [])
    for (const d of docs) {
      const list = map.get(d.type)
      if (list) list.push(d)
    }
    return TYPE_ORDER.filter((t) => (map.get(t) ?? []).length > 0).map((t) => ({
      type: t,
      docs: map.get(t) ?? [],
    }))
  }, [docs])

  if (groups.length === 0) return null

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.type}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">{TYPE_LABELS[g.type]}</h2>
            <span className="text-xs text-muted-foreground">
              {g.docs.length} document{g.docs.length === 1 ? "" : "s"}
            </span>
          </div>
          <DocumentLibraryTable
            docs={g.docs}
            assetsByDoc={assetsByDoc}
            onRowClick={onRowClick}
            onAssetClick={onAssetClick}
            onAction={onAction}
          />
        </section>
      ))}
    </div>
  )
}
