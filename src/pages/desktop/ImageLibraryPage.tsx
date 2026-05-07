import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { ImageDetailModal } from "@/components/docs/ImageDetailModal"
import { cn } from "@/lib/utils"

type SourceFilter = "all" | "upload" | "url"
type ViewMode = "flat" | "byDoc"

type ImageRow = {
  _id: Id<"images">
  filename: string
  altText: string
  source: "upload" | "url"
  byteSize: number | null
  createdAt: number
  usageCount: number
  documentRefs: Array<{
    documentId: Id<"documents">
    namingCode: string
    title: string
  }>
}

export function ImageLibraryPage() {
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [orphansOnly, setOrphansOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("flat")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [anchorId, setAnchorId] = useState<Id<"images"> | null>(null)
  const [detail, setDetail] = useState<Id<"images"> | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const removeMany = useMutation(api.images.removeMany)

  const args = useMemo(
    () => ({
      ...(sourceFilter !== "all" && { source: sourceFilter }),
      ...(search.trim() && { search: search.trim() }),
      ...(orphansOnly && { onlyOrphans: true }),
    }),
    [search, sourceFilter, orphansOnly],
  )
  const images = useQuery(api.images.list, args) as
    | ImageRow[]
    | undefined
  const ready = images !== undefined

  // Drop selections that no longer exist (after delete or filter change).
  useEffect(() => {
    if (!images) return
    const present = new Set(images.map((i) => String(i._id)))
    setSelected((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (present.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [images])

  const orderedIds: Id<"images">[] = images?.map((i) => i._id) ?? []

  function toggle(id: Id<"images">, mode: "single" | "shift" | "ctrl") {
    setSelected((prev) => {
      const key = String(id)
      const next = new Set(prev)
      if (mode === "shift" && anchorId && images) {
        const a = orderedIds.findIndex((x) => x === anchorId)
        const b = orderedIds.findIndex((x) => x === id)
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a]
          for (let i = lo; i <= hi; i++) next.add(String(orderedIds[i]))
          return next
        }
      }
      if (mode === "ctrl") {
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      }
      // single: toggle just this one, don't clear others (matches the
      // sticky-action-bar pattern more than the OS file-picker pattern).
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    if (mode !== "shift") setAnchorId(id)
  }

  function clearSelection() {
    setSelected(new Set())
    setAnchorId(null)
  }

  function toggleAllVisible() {
    if (!images) return
    const allKeys = images.map((i) => String(i._id))
    const allSelected = allKeys.every((k) => selected.has(k))
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const k of allKeys) next.delete(k)
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const k of allKeys) next.add(k)
        return next
      })
    }
  }

  const headerCheckState = useMemo<boolean | "indeterminate">(() => {
    if (!images || images.length === 0) return false
    const total = images.length
    let n = 0
    for (const i of images) if (selected.has(String(i._id))) n++
    if (n === 0) return false
    if (n === total) return true
    return "indeterminate"
  }, [images, selected])

  const selectedRows: ImageRow[] = useMemo(() => {
    if (!images) return []
    return images.filter((i) => selected.has(String(i._id)))
  }, [images, selected])

  const deletableCount = selectedRows.filter((r) => r.usageCount === 0).length
  const blockedCount = selectedRows.length - deletableCount

  async function handleConfirmedDelete() {
    setBusy(true)
    try {
      const ids = selectedRows.map((r) => r._id)
      const result = await removeMany({ ids })
      if (result.refused.length === 0) {
        toast.success(
          `Deleted ${result.ok.length} image${result.ok.length === 1 ? "" : "s"}.`,
        )
      } else if (result.ok.length === 0) {
        toast.error(
          `Refused: ${result.refused.length} image${
            result.refused.length === 1 ? "" : "s"
          } still in use.`,
        )
      } else {
        toast.warning(
          `Deleted ${result.ok.length}, refused ${result.refused.length} (still in use).`,
        )
      }
      clearSelection()
      setConfirmOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar
        breadcrumb={[
          { label: "Library", href: "/library" },
          { label: "Images" },
        ]}
      />
      <PageHeader
        icon={ImageIcon}
        title="Image library"
        subtitle="Every image referenced in any document. Click a row for the detail view; use the checkboxes to bulk-delete orphans."
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filename or alt text…"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as SourceFilter)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="upload">Uploaded</SelectItem>
              <SelectItem value="url">External URL</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat list</SelectItem>
              <SelectItem value="byDoc">Group by document</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={orphansOnly}
              onChange={(e) => setOrphansOnly(e.target.checked)}
            />
            Orphans only
          </label>
          <div className="ml-auto text-xs text-muted-foreground">
            {ready ? `${images.length} image${images.length === 1 ? "" : "s"}` : ""}
          </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[10px]">
                {selectedRows.length} selected
              </Badge>
              <span className="text-muted-foreground">
                {deletableCount} deletable
                {blockedCount > 0 && ` · ${blockedCount} still referenced`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={clearSelection}
              >
                <X className="mr-1 h-3 w-3" /> Clear
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                disabled={deletableCount === 0 || busy}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete {deletableCount > 0 ? deletableCount : ""}
              </Button>
            </div>
          </div>
        )}

        {viewMode === "flat" ? (
          <FlatList
            ready={ready}
            images={images}
            selected={selected}
            anchorId={anchorId}
            headerCheckState={headerCheckState}
            onToggle={toggle}
            onToggleAllVisible={toggleAllVisible}
            onOpenDetail={setDetail}
          />
        ) : (
          <GroupedList
            ready={ready}
            images={images}
            selected={selected}
            onToggle={toggle}
            onOpenDetail={setDetail}
          />
        )}
      </div>

      <ImageDetailModal
        imageId={detail}
        onClose={() => setDetail(null)}
        onOpenDoc={(docId) => {
          window.open(`/docs/${docId}`, "_blank")
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletableCount} image{deletableCount === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <span className="block">
                This permanently removes the image{deletableCount === 1 ? "" : "s"} and the
                underlying storage blob. Documents that reference{" "}
                {deletableCount === 1 ? "it" : "them"} will continue to render the
                placeholder.
              </span>
              {blockedCount > 0 && (
                <span className="block rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-amber-800 dark:text-amber-200">
                  {blockedCount} of the selected image{blockedCount === 1 ? "" : "s"}{" "}
                  {blockedCount === 1 ? "is" : "are"} still referenced by a document and
                  will be skipped. Remove {blockedCount === 1 ? "it" : "them"} from the
                  document(s) first if you want to delete{" "}
                  {blockedCount === 1 ? "it" : "them"}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || deletableCount === 0}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmedDelete()
              }}
            >
              Delete {deletableCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Flat list
// ---------------------------------------------------------------------------

function FlatList({
  ready,
  images,
  selected,
  anchorId,
  headerCheckState,
  onToggle,
  onToggleAllVisible,
  onOpenDetail,
}: {
  ready: boolean
  images: ImageRow[] | undefined
  selected: Set<string>
  anchorId: Id<"images"> | null
  headerCheckState: boolean | "indeterminate"
  onToggle: (id: Id<"images">, mode: "single" | "shift" | "ctrl") => void
  onToggleAllVisible: () => void
  onOpenDetail: (id: Id<"images">) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={headerCheckState}
                onCheckedChange={onToggleAllVisible}
                aria-label="Select all visible"
              />
            </TableHead>
            <TableHead className="w-[8%]">Preview</TableHead>
            <TableHead className="w-[24%]">Filename</TableHead>
            <TableHead className="w-[8%]">Source</TableHead>
            <TableHead className="w-[8%]">Size</TableHead>
            <TableHead className="w-[12%]">Used in</TableHead>
            <TableHead className="w-[12%]">Uploaded</TableHead>
            <TableHead>Alt text</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!ready ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}>
                  <Skeleton className="h-9 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : !images || images.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-xs text-muted-foreground"
              >
                No images yet. Insert one from the document editor.
              </TableCell>
            </TableRow>
          ) : (
            images.map((img) => (
              <ImageTableRow
                key={img._id}
                img={img}
                isSelected={selected.has(String(img._id))}
                isAnchor={anchorId === img._id}
                onToggle={onToggle}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function ImageTableRow({
  img,
  isSelected,
  isAnchor,
  onToggle,
  onOpenDetail,
}: {
  img: ImageRow
  isSelected: boolean
  isAnchor: boolean
  onToggle: (id: Id<"images">, mode: "single" | "shift" | "ctrl") => void
  onOpenDetail: (id: Id<"images">) => void
}) {
  return (
    <TableRow
      className={cn(
        "cursor-pointer",
        isSelected && "bg-primary/5",
        isAnchor && "ring-1 ring-inset ring-primary/30",
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("[data-row-checkbox]")) return
        onOpenDetail(img._id)
      }}
    >
      <TableCell
        data-row-checkbox
        onClick={(e) => {
          e.stopPropagation()
          const mode: "single" | "shift" | "ctrl" = e.shiftKey
            ? "shift"
            : e.metaKey || e.ctrlKey
              ? "ctrl"
              : "single"
          onToggle(img._id, mode)
        }}
      >
        <Checkbox checked={isSelected} aria-label="Select row" />
      </TableCell>
      <TableCell>
        <ImageThumb id={img._id} />
      </TableCell>
      <TableCell className="font-mono text-xs">{img.filename}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            img.source === "url" &&
              "border-amber-400/50 text-amber-700 dark:text-amber-300",
          )}
        >
          {img.source}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {img.byteSize ? `${(img.byteSize / 1024).toFixed(0)} KB` : "—"}
      </TableCell>
      <TableCell>
        {img.usageCount === 0 ? (
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground"
          >
            orphan
          </Badge>
        ) : (
          <Badge className="bg-primary/15 text-primary text-[10px]">
            {img.usageCount} doc{img.usageCount === 1 ? "" : "s"}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatDate(img.createdAt)}
      </TableCell>
      <TableCell className="truncate text-xs">{img.altText}</TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Grouped list (by document)
// ---------------------------------------------------------------------------

type Group = {
  key: string
  kind: "shared" | "doc" | "orphans"
  label: string
  sublabel?: string
  images: ImageRow[]
}

function buildGroups(images: ImageRow[]): Group[] {
  const shared: ImageRow[] = []
  const orphans: ImageRow[] = []
  const byDoc = new Map<string, { ref: ImageRow["documentRefs"][number]; images: ImageRow[] }>()
  for (const img of images) {
    if (img.usageCount === 0) {
      orphans.push(img)
      continue
    }
    if (img.usageCount >= 2) {
      shared.push(img)
      continue
    }
    const ref = img.documentRefs[0]
    if (!ref) continue
    const key = String(ref.documentId)
    const bucket = byDoc.get(key) ?? { ref, images: [] }
    bucket.images.push(img)
    byDoc.set(key, bucket)
  }
  const groups: Group[] = []
  if (shared.length > 0) {
    groups.push({
      key: "__shared__",
      kind: "shared",
      label: "Shared",
      sublabel: "Used in 2+ documents",
      images: shared,
    })
  }
  const docGroups = Array.from(byDoc.values())
  docGroups.sort((a, b) => a.ref.namingCode.localeCompare(b.ref.namingCode))
  for (const g of docGroups) {
    groups.push({
      key: String(g.ref.documentId),
      kind: "doc",
      label: g.ref.namingCode,
      sublabel: g.ref.title,
      images: g.images,
    })
  }
  if (orphans.length > 0) {
    groups.push({
      key: "__orphans__",
      kind: "orphans",
      label: "Orphans",
      sublabel: "Not currently referenced — safe to delete",
      images: orphans,
    })
  }
  return groups
}

function GroupedList({
  ready,
  images,
  selected,
  onToggle,
  onOpenDetail,
}: {
  ready: boolean
  images: ImageRow[] | undefined
  selected: Set<string>
  onToggle: (id: Id<"images">, mode: "single" | "shift" | "ctrl") => void
  onOpenDetail: (id: Id<"images">) => void
}) {
  const groups = useMemo(() => (images ? buildGroups(images) : []), [images])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleCollapsed(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!ready) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!images || images.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-xs text-muted-foreground">
        No images yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isCollapsed = collapsed.has(g.key)
        const headerToneClass =
          g.kind === "orphans"
            ? "border border-amber-500/30 bg-amber-500/10"
            : "bg-muted/40"
        const badgeClass =
          g.kind === "shared"
            ? ""
            : g.kind === "orphans"
              ? "border-amber-500/40 text-amber-700 dark:text-amber-300"
              : "font-mono"
        return (
          <div key={g.key}>
            <button
              type="button"
              onClick={() => toggleCollapsed(g.key)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium",
                headerToneClass,
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <Badge
                variant={g.kind === "shared" ? "secondary" : "outline"}
                className={cn("text-[10px]", badgeClass)}
              >
                {g.label}
              </Badge>
              {g.sublabel && (
                <span className="font-normal text-muted-foreground">
                  {g.sublabel}
                </span>
              )}
              <span className="ml-auto font-normal text-muted-foreground">
                {g.images.length} image{g.images.length === 1 ? "" : "s"}
              </span>
            </button>
            {!isCollapsed && (
              <div className="mt-2 space-y-1.5 pl-6">
                {g.images.map((img) => (
                  <GroupedImageRow
                    key={img._id}
                    img={img}
                    isSelected={selected.has(String(img._id))}
                    onToggle={onToggle}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function GroupedImageRow({
  img,
  isSelected,
  onToggle,
  onOpenDetail,
}: {
  img: ImageRow
  isSelected: boolean
  onToggle: (id: Id<"images">, mode: "single" | "shift" | "ctrl") => void
  onOpenDetail: (id: Id<"images">) => void
}) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted/30",
        isSelected && "bg-primary/5",
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("[data-row-checkbox]")) return
        onOpenDetail(img._id)
      }}
    >
      <span
        data-row-checkbox
        onClick={(e) => {
          e.stopPropagation()
          const mode: "single" | "shift" | "ctrl" = e.shiftKey
            ? "shift"
            : e.metaKey || e.ctrlKey
              ? "ctrl"
              : "single"
          onToggle(img._id, mode)
        }}
      >
        <Checkbox checked={isSelected} />
      </span>
      <ImageThumb id={img._id} small />
      <span className="font-mono text-[11px]">{img.filename}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">
        {img.usageCount === 0
          ? "—"
          : img.documentRefs.length === 1
            ? img.documentRefs[0].namingCode
            : `${img.usageCount} docs`}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Thumb
// ---------------------------------------------------------------------------

function ImageThumb({
  id,
  small,
}: {
  id: Id<"images">
  small?: boolean
}) {
  const url = useQuery(api.images.urlFor, { id })
  const errored = useRef(false)
  const size = small ? "h-7 w-7" : "h-9 w-9"
  const iconSize = small ? "h-3.5 w-3.5" : "h-4 w-4"
  if (url === undefined) {
    return <Skeleton className={cn(size, "rounded")} />
  }
  if (!url || errored.current) {
    return (
      <div
        className={cn(
          size,
          "flex items-center justify-center rounded border bg-muted/30",
        )}
      >
        <ImageIcon className={cn(iconSize, "text-muted-foreground")} />
      </div>
    )
  }
  return (
    <div className={cn(size, "overflow-hidden rounded border bg-muted/20")}>
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => {
          errored.current = true
        }}
      />
    </div>
  )
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
