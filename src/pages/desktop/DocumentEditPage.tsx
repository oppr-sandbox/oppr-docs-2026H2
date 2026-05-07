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
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { toLegacyAsset, toLegacyDoc } from "@/lib/convex-adapters"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/docs/StatusBadge"
import { TypeBadge } from "@/components/docs/TypeBadge"
import { DocumentEditor } from "@/components/docs/DocumentEditor"
import { PublishToPdfDialog } from "@/components/docs/PublishToPdfDialog"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  MetadataPanel,
  validateMetadata,
  type MetadataValue,
} from "@/components/docs/MetadataPanel"
import { chunksFromTipTap } from "@/components/docs/chunking"
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

  const docId = params?.id ?? ""
  const savePublish = useMutation(api.documents.savePublish)
  const docResult = useQuery(
    api.documents.getWithAssets,
    docId ? { id: docId as Id<"documents"> } : "skip",
  )
  const versionResult = useQuery(
    api.documents.getCurrentVersion,
    docId ? { documentId: docId as Id<"documents"> } : "skip",
  )
  const ready = docResult !== undefined

  const docWithAssets = useMemo(() => {
    if (!docResult) return null
    return {
      ...toLegacyDoc(docResult.doc),
      assets: docResult.assets.map(toLegacyAsset),
    }
  }, [docResult])

  const currentVersion = useMemo(() => {
    if (!versionResult) return null
    return {
      id: versionResult._id,
      document_id: versionResult.documentId,
      version: versionResult.version,
      body_kind: versionResult.bodyKind,
      body_json: versionResult.bodyJson,
      pdf_blob_id: versionResult.pdfStorageId,
      published_at: new Date(versionResult.publishedAt).toISOString(),
    }
  }, [versionResult])

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
    if (!meta || !docWithAssets) return
    const validation = validateMetadata(meta)
    if (!validation.ok) {
      setErrors(validation.errors)
      toast.error("Please fix the metadata errors")
      return
    }
    setErrors({})
    setSaving(targetStatus)
    try {
      const raw = chunksFromTipTap(body)
      const result = await savePublish({
        id: docWithAssets.id as Id<"documents">,
        namingCode: meta.namingCode,
        title: meta.title.trim(),
        type: meta.type,
        status: targetStatus,
        tags: meta.tags,
        assetIds: meta.assetIds as Id<"assets">[],
        body,
        chunks: raw.map((r) => ({ text: r.text, section: r.section })),
      })

      const label =
        targetStatus === "draft"
          ? "Draft saved"
          : targetStatus === "in_review"
            ? "Submitted for review"
            : "Published"
      toast.success(`${label} (v${result.version})`)
      if (navigateAfter) setLocation(navigateAfter)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSaving(null)
    }
  }

  if (!ready) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading…</div>
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
      <TopBar
        breadcrumb={[
          { label: "Library", href: "/library" },
          {
            label: `${meta.namingCode || docWithAssets.naming_code} · ${
              meta.title || "Untitled"
            }`,
            href: `/docs/${docWithAssets.id}`,
          },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        title={`${meta.namingCode || docWithAssets.naming_code} · ${
          meta.title || "Untitled document"
        }`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <TypeBadge type={meta.type} />
            <StatusBadge status={docWithAssets.status} />
            <span className="font-mono text-[10px]">
              v{docWithAssets.current_version}
            </span>
          </span>
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={toggleMeta}
              title={metaVisible ? "Hide metadata panel" : "Show metadata panel"}
            >
              {metaVisible ? (
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Eye className="mr-1.5 h-3.5 w-3.5" />
              )}
              <span className="hidden md:inline">
                {metaVisible ? "Hide metadata" : "Show metadata"}
              </span>
              {!metaVisible && errorCount > 0 && (
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"
                  aria-label={`${errorCount} metadata error${errorCount === 1 ? "" : "s"}`}
                />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/docs/${docWithAssets.id}`)}
            >
              View
            </Button>
            <PublishToPdfDialog
              documentId={docWithAssets.id}
              trigger={
                <Button
                  size="sm"
                  className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700"
                  title="Publish to PDF — title page, header/footer, page numbers"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Publish to PDF
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              disabled={saving !== null}
              onClick={() => void save("draft")}
            >
              {saving === "draft" ? "Saving…" : "Save draft"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={saving !== null}
              onClick={() => void save("in_review")}
            >
              {saving === "in_review" ? "Submitting…" : "Submit"}
            </Button>
            <Button
              size="sm"
              disabled={saving !== null}
              onClick={() => void save("published", `/docs/${docWithAssets.id}`)}
            >
              {saving === "published" ? "Publishing…" : "Publish"}
            </Button>
          </>
        }
      />

      <div
        className={cn(
          "grid grid-cols-1 gap-6 px-6 pb-6 pt-4",
          metaVisible && "lg:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <div className="min-w-0">
          <div className="w-full">
            <DocumentEditor
              content={body}
              onChange={(json) => setBody(json)}
              placeholder="Continue writing… type / for blocks"
              toolbarTopOffset={104}
            />
          </div>
        </div>
        {metaVisible && (
          <div className="lg:sticky lg:top-28 lg:self-start">
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
