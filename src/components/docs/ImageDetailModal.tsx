import { useEffect, useState } from "react"
import { Image as ImageIcon, Download, Copy } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ImageDetailModalProps {
  imageId: Id<"images"> | null
  onClose: () => void
  onOpenDoc: (docId: Id<"documents">) => void
}

export function ImageDetailModal({
  imageId,
  onClose,
  onOpenDoc,
}: ImageDetailModalProps) {
  return (
    <Dialog open={imageId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Image detail</DialogTitle>
        </DialogHeader>
        {imageId && <Body imageId={imageId} onOpenDoc={onOpenDoc} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function Body({
  imageId,
  onOpenDoc,
  onClose,
}: {
  imageId: Id<"images">
  onOpenDoc: (docId: Id<"documents">) => void
  onClose: () => void
}) {
  const detail = useQuery(api.images.get, { id: imageId })
  const url = useQuery(api.images.urlFor, { id: imageId })
  const updateAttrs = useMutation(api.images.updateAttrs)
  const remove = useMutation(api.images.remove)

  const [filename, setFilename] = useState("")
  const [altText, setAltText] = useState("")
  const [savingFilename, setSavingFilename] = useState(false)
  const [savingAlt, setSavingAlt] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (detail) {
      setFilename(detail.image.filename)
      setAltText(detail.image.altText)
    }
  }, [detail])

  if (!detail) {
    return (
      <div className="space-y-3">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const { image, usages } = detail
  const usageCount = usages.length

  async function commitFilename() {
    if (filename === detail.image.filename) return
    setSavingFilename(true)
    try {
      await updateAttrs({ id: imageId, filename })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSavingFilename(false)
    }
  }

  async function commitAlt() {
    if (altText === detail.image.altText) return
    setSavingAlt(true)
    try {
      await updateAttrs({ id: imageId, altText })
      toast.success("Alt text updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSavingAlt(false)
    }
  }

  async function handleDownload() {
    if (!url) return toast.error("No URL to download from")
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = image.filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed")
    }
  }

  async function handleCopyUrl() {
    if (!url) return toast.error("No URL")
    try {
      await navigator.clipboard.writeText(url)
      toast.success("URL copied")
    } catch {
      toast.error("Failed to copy")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await remove({ id: imageId })
      toast.success("Image deleted")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="truncate text-base font-semibold">{image.filename}</h2>
        <p className="truncate text-[11px] text-muted-foreground">
          {image.contentType}
          {image.byteSize ? ` · ${(image.byteSize / 1024).toFixed(0)} KB` : ""}
          {image.width && image.height
            ? ` · ${image.width}×${image.height}`
            : ""}
          {detail.uploader?.email
            ? ` · uploaded by ${detail.uploader.email}`
            : ""}
        </p>
      </div>

      <div className="flex items-center justify-center rounded-md border bg-muted/20 p-3">
        {url ? (
          <img
            src={url}
            alt={image.altText}
            className="max-h-[50vh] max-w-full rounded object-contain"
          />
        ) : (
          <div className="flex h-40 items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
            Image unavailable
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Alt text
            </div>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onBlur={() => void commitAlt()}
              disabled={savingAlt}
            />
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Saves on blur. Propagates to every doc that uses this image.
            </p>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Filename
            </div>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onBlur={() => void commitFilename()}
              disabled={savingFilename}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1 rounded-md border bg-muted/20 p-2 font-mono text-[10px]">
            <MetaRow label="source" value={image.source} />
            {image.sha256 && (
              <MetaRow label="sha256" value={`${image.sha256.slice(0, 5)}…${image.sha256.slice(-4)}`} />
            )}
            {image.externalUrl && (
              <MetaRow label="url" value={truncate(image.externalUrl, 40)} />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Used in {usageCount} document{usageCount === 1 ? "" : "s"}
          </div>
          {usageCount === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-3 text-center text-xs text-muted-foreground">
              Not currently referenced. Safe to delete.
            </div>
          ) : (
            <ul className="divide-y rounded-md border bg-card">
              {usages.map((u) => (
                <li key={u.documentId} className="px-2.5 py-2">
                  <button
                    type="button"
                    onClick={() => onOpenDoc(u.documentId)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {u.namingCode}
                      </div>
                      <div className="truncate text-sm">{u.title}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          u.status === "published" &&
                            "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
                          u.status === "in_review" &&
                            "border-amber-500/40 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {u.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        v{u.version}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void handleDownload()}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleCopyUrl()}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy URL
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleDelete()}
          disabled={usageCount > 0 || deleting}
          title={
            usageCount > 0
              ? `Used in ${usageCount} document${usageCount === 1 ? "" : "s"}`
              : "Delete this image"
          }
        >
          {deleting
            ? "Deleting…"
            : usageCount > 0
              ? `Delete (used in ${usageCount} doc${usageCount === 1 ? "" : "s"})`
              : "Delete"}
        </Button>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}
