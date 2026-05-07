import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import { LayoutList, Layers, Library as LibraryIcon, PlusCircle, Upload } from "lucide-react"
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
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { Doc, DocumentStatus, DocumentType } from "@/types"
import { toLegacyDoc } from "@/lib/convex-adapters"
import {
  DocumentLibraryTable,
  type AssetPreview,
  type DocumentRowAction,
} from "@/components/docs/DocumentLibraryTable"
import { DeleteDocumentDialog } from "@/components/docs/DeleteDocumentDialog"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
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
  const [, navigate] = useLocation()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [groupByType, setGroupByType] = useState(false)

  const queryArgs = useMemo(
    () => ({
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(typeFilter !== "all" && { type: typeFilter }),
      ...(search.trim() && { search: search.trim() }),
    }),
    [search, statusFilter, typeFilter],
  )

  const result = useQuery(api.documents.listWithAssetPreviews, queryArgs)
  const archive = useMutation(api.documents.archive)
  const remove = useMutation(api.documents.remove)
  const [docToDelete, setDocToDelete] = useState<Doc | null>(null)
  const [deleting, setDeleting] = useState(false)
  const ready = result !== undefined
  const docs = useMemo(
    () => (result ? result.docs.map(toLegacyDoc) : []),
    [result],
  )
  const assetsByDoc = useMemo<Record<string, AssetPreview[]>>(
    () => result?.assetsByDoc ?? {},
    [result],
  )

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
      toast.info("Duplicate isn't wired up yet.")
      return
    }
    if (action === "archive") {
      archive({ id: doc.id as Id<"documents"> })
        .then(() => toast.success(`Archived ${doc.naming_code}`))
        .catch((err) =>
          toast.error(err instanceof Error ? err.message : "Failed to archive"),
        )
      return
    }
    if (action === "delete") {
      setDocToDelete(doc)
    }
  }

  async function handleArchiveFromDialog() {
    if (!docToDelete) return
    try {
      await archive({ id: docToDelete.id as Id<"documents"> })
      toast.success(`Archived ${docToDelete.naming_code}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive")
    } finally {
      setDocToDelete(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!docToDelete) return
    setDeleting(true)
    try {
      await remove({ id: docToDelete.id as Id<"documents"> })
      toast.success(`Deleted ${docToDelete.naming_code}`)
      setDocToDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar breadcrumb={[{ label: "Library" }]} />
      <PageHeader
        icon={LibraryIcon}
        title="Document library"
        subtitle="All SOPs, manuals, and work instructions"
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/docs/new?kind=pdf")}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload PDF
            </Button>
            <Button size="sm" onClick={() => navigate("/docs/new")}>
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              New document
            </Button>
          </>
        }
      />
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

      <DeleteDocumentDialog
        doc={docToDelete}
        open={!!docToDelete}
        onOpenChange={(o) => !o && !deleting && setDocToDelete(null)}
        onArchive={() => void handleArchiveFromDialog()}
        onConfirmDelete={() => void handleDeleteConfirm()}
        busy={deleting}
      />
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
