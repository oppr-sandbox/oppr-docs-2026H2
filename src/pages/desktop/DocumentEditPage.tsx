// DocumentEditPage
//
// Authoring surface with a slim sticky page strip + a togglable metadata
// panel.
//
//   • Top strip (h-10, sticky)        — title · type · status · code · v · Save | Submit | Publish ▾
//   • DocumentEditor (toolbar sticky) — docked under the strip via toolbarTopOffset=40
//   • Metadata panel (right, 320px)   — togglable; visibility persisted in localStorage
//
// Save flows are unchanged from v1: validateMetadata → updateDocument →
// setDocumentAssets → publishVersion → re-extract chunks.

import { useEffect, useMemo, useState } from "react"
import { useLocation, useRoute } from "wouter"
import { toast } from "sonner"
import { Eye, EyeOff, FileDown } from "lucide-react"
import {
  useDb,
  useDbWatcher,
  getDocumentWithAssets,
  getCurrentVersion,
  updateDocument,
  setDocumentAssets,
  publishVersion,
  deleteForDocumentVersion,
  insertMany as insertChunks,
} from "@/db"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/docs/StatusBadge"
import { TypeBadge } from "@/components/docs/TypeBadge"
import { DocumentEditor } from "@/components/docs/DocumentEditor"
import { PublishToPdfDialog } from "@/components/docs/PublishToPdfDialog"
import {
  MetadataPanel,
  validateMetadata,
  type MetadataValue,
} from "@/components/docs/MetadataPanel"
import {
  buildChunkRows,
  chunksFromTipTap,
} from "@/components/docs/chunking"
import { cn } from "@/lib/utils"
import type { DocumentStatus, DocumentType } from "@/types"

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] }
const META_VISIBLE_KEY = "oppr-docs:edit-metadata-visible"

function readMetaVisible(): boolean {
  if (typeof window === "undefined") return true
  try {
    const v = window.localStorage.getItem(META_VISIBLE_KEY)
    if (v === null) return true
    return v === "1"
  } catch {
    return true
  }
}

function writeMetaVisible(visible: boolean) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(META_VISIBLE_KEY, visible ? "1" : "0")
  } catch {
    /* ignore */
  }
}

export function DocumentEditPage() {
  const [, params] = useRoute<{ id: string }>("/docs/:id/edit")
  const [, setLocation] = useLocation()
  const { db, ready } = useDb()
  const watcher = useDbWatcher()

  const docId = params?.id ?? ""
  const docWithAssets = useMemo(
    () => (db && docId ? getDocumentWithAssets(db, docId) : null),
    [db, docId, watcher],
  )
  const currentVersion = useMemo(
    () => (db && docId ? getCurrentVersion(db, docId) : null),
    [db, docId, watcher],
  )

  const [meta, setMeta] = useState<MetadataValue | null>(null)
  const [body, setBody] = useState<unknown>(EMPTY_DOC)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<DocumentStatus | null>(null)
  const [bodyHydrated, setBodyHydrated] = useState(false)
  const [metaVisible, setMetaVisible] = useState<boolean>(() => readMetaVisible())

  function toggleMeta() {
    setMetaVisible((prev) => {
      const next = !prev
      writeMetaVisible(next)
      return next
    })
  }

  // Hydrate metadata from the loaded doc (first time only — don't clobber
  // user edits when the watcher bumps after a save).
  useEffect(() => {
    if (!docWithAssets || meta) return
    setMeta({
      title: docWithAssets.title,
      type: docWithAssets.type as DocumentType,
      ownerId: docWithAssets.owner_id,
      tags: docWithAssets.tags,
      assetIds: docWithAssets.assets.map((a) => a.id),
      namingCode: docWithAssets.naming_code,
    })
  }, [docWithAssets, meta])

  // Hydrate body from current version once.
  useEffect(() => {
    if (bodyHydrated || !currentVersion) return
    if (currentVersion.body_kind === "tiptap" && currentVersion.body_json) {
      setBody(currentVersion.body_json)
    }
    setBodyHydrated(true)
  }, [currentVersion, bodyHydrated])

  // Auto-show the metadata panel when validation errors arrive so the
  // operator isn't stuck staring at a Publish toast they can't act on.
  useEffect(() => {
    if (Object.keys(errors).length > 0 && !metaVisible) {
      setMetaVisible(true)
      writeMetaVisible(true)
    }
  }, [errors, metaVisible])

  async function save(targetStatus: DocumentStatus, navigateAfter?: string) {
    if (!db || !meta || !docWithAssets) return
    const validation = validateMetadata(meta)
    if (!validation.ok) {
      setErrors(validation.errors)
      toast.error("Please fix the metadata errors")
      return
    }
    setErrors({})
    setSaving(targetStatus)
    try {
      updateDocument(db, docWithAssets.id, {
        title: meta.title.trim(),
        type: meta.type,
        naming_code: meta.namingCode,
        tags: meta.tags,
        status: targetStatus,
      })
      setDocumentAssets(db, docWithAssets.id, meta.assetIds)
      const version = publishVersion(db, docWithAssets.id, {
        kind: "tiptap",
        json: body,
      })
      deleteForDocumentVersion(db, docWithAssets.id, version.version)
      const raw = chunksFromTipTap(body)
      const rows = buildChunkRows(docWithAssets.id, version.version, raw)
      if (rows.length) insertChunks(db, rows)

      const label =
        targetStatus === "draft"
          ? "Draft saved"
          : targetStatus === "in_review"
            ? "Submitted for review"
            : "Published"
      toast.success(`${label} (v${version.version})`)
      if (navigateAfter) setLocation(navigateAfter)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSaving(null)
    }
  }

  if (!ready || !db) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading database…</div>
    )
  }
  if (!docWithAssets) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-lg font-semibold">Document not found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn’t find a document with id <span className="font-mono">{docId}</span>.
        </p>
        <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
          Back to library
        </Button>
      </div>
    )
  }
  if (!meta) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }

  if (currentVersion?.body_kind === "pdf") {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-lg font-semibold">PDF documents aren’t editable</h1>
        <p className="text-sm text-muted-foreground">
          “{docWithAssets.title}” is backed by a PDF blob. Use the read view or
          re-import to replace the source.
        </p>
        <Button variant="outline" size="sm" onClick={() => setLocation(`/docs/${docWithAssets.id}`)}>
          Open read view
        </Button>
      </div>
    )
  }

  const errorCount = Object.keys(errors).length

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-20 flex h-10 items-center justify-between border-b bg-background px-4 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold">
            {meta.title || "Untitled document"}
          </h1>
          <TypeBadge type={meta.type} />
          <StatusBadge status={docWithAssets.status} />
          <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
            {meta.namingCode} · v{docWithAssets.current_version}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-7 gap-1 px-2 text-[11px]"
            onClick={toggleMeta}
            title={metaVisible ? "Hide metadata panel" : "Show metadata panel"}
          >
            {metaVisible ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            <span className="hidden md:inline">
              {metaVisible ? "Hide metadata" : "Show metadata"}
            </span>
            {!metaVisible && errorCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive"
                aria-label={`${errorCount} metadata error${errorCount === 1 ? "" : "s"}`}
              />
            )}
          </Button>
          <PublishToPdfDialog
            documentId={docWithAssets.id}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-[11px] text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                title="Publish to PDF — title page, header/footer, page numbers"
              >
                <FileDown className="h-3 w-3" />
                <span className="hidden md:inline">Publish to PDF</span>
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => setLocation(`/docs/${docWithAssets.id}`)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={saving !== null}
            onClick={() => void save("draft")}
          >
            {saving === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={saving !== null}
            onClick={() => void save("in_review")}
          >
            {saving === "in_review" ? "Submitting…" : "Submit"}
          </Button>
          <Button
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={saving !== null}
            onClick={() => void save("published", `/docs/${docWithAssets.id}`)}
          >
            {saving === "published" ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "grid grid-cols-1 gap-6 px-6 pb-6 pt-4",
          metaVisible && "lg:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <div className="min-w-0">
          <div className="mx-auto w-full max-w-[80ch]">
            <DocumentEditor
              content={body}
              onChange={(json) => setBody(json)}
              placeholder="Continue writing… type / for blocks"
              toolbarTopOffset={40}
            />
          </div>
        </div>
        {metaVisible && (
          <div className="lg:sticky lg:top-14 lg:self-start">
            <MetadataPanel
              value={meta}
              onChange={setMeta}
              errors={errors}
              ignoreId={docWithAssets.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
