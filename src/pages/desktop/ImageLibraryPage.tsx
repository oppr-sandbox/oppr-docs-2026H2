import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import { Image as ImageIcon, Search } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
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
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { ImageDetailModal } from "@/components/docs/ImageDetailModal"
import { cn } from "@/lib/utils"

type SourceFilter = "all" | "upload" | "url"

export function ImageLibraryPage() {
  const [, navigate] = useLocation()
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [orphansOnly, setOrphansOnly] = useState(false)
  const [selected, setSelected] = useState<Id<"images"> | null>(null)

  const args = useMemo(
    () => ({
      ...(sourceFilter !== "all" && { source: sourceFilter }),
      ...(search.trim() && { search: search.trim() }),
      ...(orphansOnly && { onlyOrphans: true }),
    }),
    [search, sourceFilter, orphansOnly],
  )
  const images = useQuery(api.images.list, args)
  const ready = images !== undefined

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
        subtitle="Every image referenced in any document. Click a row for the detail view."
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

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[8%]">Preview</TableHead>
                <TableHead className="w-[26%]">Filename</TableHead>
                <TableHead className="w-[10%]">Source</TableHead>
                <TableHead className="w-[10%]">Size</TableHead>
                <TableHead className="w-[12%]">Used in</TableHead>
                <TableHead className="w-[14%]">Uploaded</TableHead>
                <TableHead>Alt text</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!ready ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : images.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-xs text-muted-foreground"
                  >
                    No images yet. Insert one from the document editor.
                  </TableCell>
                </TableRow>
              ) : (
                images.map((img) => (
                  <TableRow
                    key={img._id}
                    className="cursor-pointer"
                    onClick={() => setSelected(img._id)}
                  >
                    <TableCell>
                      <ImageThumb id={img._id} source={img.source} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {img.filename}
                    </TableCell>
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
                          {img.usageCount} doc
                          {img.usageCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(img.createdAt)}
                    </TableCell>
                    <TableCell className="truncate text-xs">{img.altText}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ImageDetailModal
        imageId={selected}
        onClose={() => setSelected(null)}
        onOpenDoc={(docId) => {
          window.open(`/docs/${docId}`, "_blank")
        }}
      />
    </div>
  )
}

function ImageThumb({ id, source }: { id: Id<"images">; source: "upload" | "url" }) {
  const url = useQuery(api.images.urlFor, { id })
  if (url === undefined) {
    return <Skeleton className="h-9 w-9 rounded" />
  }
  if (!url) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }
  return (
    <div className="h-9 w-9 overflow-hidden rounded border bg-muted/20">
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
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
