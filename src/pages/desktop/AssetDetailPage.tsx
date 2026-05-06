import { useMemo, useState } from "react"
import { Link, useLocation, useRoute } from "wouter"
import { ArrowLeft, Factory, FileText, Link as LinkIcon, MapPin, Pencil, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import {
  toLegacyAsset,
  toLegacyAssetLog,
  toLegacyDoc,
} from "@/lib/convex-adapters"
import {
  DocumentLibraryTable,
  type AssetPreview,
  type DocumentRowAction,
} from "@/components/docs/DocumentLibraryTable"
import { DeleteDocumentDialog } from "@/components/docs/DeleteDocumentDialog"
import type { AssetLog, Doc } from "@/types"
import { AssetPreviewModal } from "@/components/docs/AssetPreviewModal"
import { EditAssetModal } from "@/components/docs/EditAssetModal"
import { LogReferenceModal } from "@/components/docs/LogReferenceModal"
import { toast } from "sonner"

export function AssetDetailPage() {
  const [, params] = useRoute<{ id: string }>("/assets/:id")
  const id = params?.id
  const [, navigate] = useLocation()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [activeLog, setActiveLog] = useState<AssetLog | null>(null)

  const result = useQuery(
    api.assets.getWithDocs,
    id ? { id: id as Id<"assets"> } : "skip",
  )
  const previewBundle = useQuery(api.documents.listWithAssetPreviews, {})
  const updateAssetMut = useMutation(api.assets.update)
  const archive = useMutation(api.documents.archive)
  const remove = useMutation(api.documents.remove)
  const [docToDelete, setDocToDelete] = useState<Doc | null>(null)
  const [deleting, setDeleting] = useState(false)
  const ready = result !== undefined

  const asset = useMemo(
    () => (result ? toLegacyAsset(result.asset) : null),
    [result],
  )
  const docs = useMemo(
    () => (result ? result.documents.map(toLegacyDoc) : []),
    [result],
  )
  const logs = useMemo(
    () => (result ? result.logs.map(toLegacyAssetLog) : []),
    [result],
  )
  const assetsByDoc = useMemo<Record<string, AssetPreview[]>>(
    () => previewBundle?.assetsByDoc ?? {},
    [previewBundle],
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

  if (!ready) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="space-y-3 p-6">
        <Link
          href="/assets"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to assets
        </Link>
        <h1 className="text-xl font-semibold">Asset not found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn't find an asset with id <code>{id}</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-14 items-center gap-3 border-b px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/assets")}
          className="-ml-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Assets
        </Button>
      </header>

      <div className="space-y-6 p-6">
        <div className="rounded-md border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-semibold">{asset.name}</h1>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {asset.code}
                </div>
              </div>
              {asset.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {asset.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{asset.site}</span>
                  {asset.location && (
                    <>
                      <span className="opacity-60">·</span>
                      <span>{asset.location}</span>
                    </>
                  )}
                </div>
                {asset.floorplan && (
                  <div className="flex items-center gap-1">
                    <Factory className="h-3.5 w-3.5" />
                    <span>{asset.floorplan}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>{asset.is_linked ? "Linked on floorplan" : "Unlinked"}</span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide opacity-60">Level&nbsp;</span>
                  <span>{asset.level}</span>
                </div>
              </div>
              {logs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Connected logs
                  </div>
                  <ul className="space-y-1.5">
                    {logs.map((log) => (
                      <li key={log.code}>
                        <button
                          type="button"
                          onClick={() => setActiveLog(log)}
                          className="flex w-full items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/60"
                        >
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <div className="font-mono text-sm font-semibold">
                              {log.code}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.name}
                              {log.description ? ` — ${log.description}` : ""}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                QR code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit asset
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Linked documents</h2>
            <span className="text-xs text-muted-foreground">
              {docs.length} document{docs.length === 1 ? "" : "s"}
            </span>
          </div>
          <DocumentLibraryTable
            docs={docs}
            assetsByDoc={assetsByDoc}
            onRowClick={(d) => navigate(`/docs/${d.id}`)}
            onAssetClick={(aid) => navigate(`/assets/${aid}`)}
            onAction={handleAction}
            emptyMessage="No documents are linked to this asset yet."
          />
        </div>
      </div>

      <AssetPreviewModal
        asset={asset}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
      <EditAssetModal
        asset={asset}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (patch) => {
          try {
            await updateAssetMut({
              id: asset.id as Id<"assets">,
              ...patch,
            })
            toast.success("Asset updated")
            setEditOpen(false)
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Failed to update asset",
            )
          }
        }}
      />
      <LogReferenceModal
        log={activeLog}
        open={!!activeLog}
        onOpenChange={(o) => !o && setActiveLog(null)}
      />
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
