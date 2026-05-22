import { useMemo, useRef, useState } from "react"
import { useLocation, useRoute, useSearch } from "wouter"
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  FileDown,
  History,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { toast } from "sonner"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { toLegacyAsset, toLegacyDoc } from "@/lib/convex-adapters"
import { PdfViewer } from "@/components/docs/PdfViewer"
import { TiptapReadOnly } from "@/components/docs/TiptapReadOnly"
import { VersionHistoryDrawer } from "@/components/docs/VersionHistoryDrawer"
import { DocumentHero, extractPpeItems } from "@/components/docs/DocumentHero"
import { DocumentToc } from "@/components/docs/DocumentToc"
import { PublishToPdfDialog } from "@/components/docs/PublishToPdfDialog"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"

export function DocumentReadPage() {
  const [, params] = useRoute<{ id: string }>("/docs/:id")
  const id = params?.id
  const search = useSearch()
  const [, navigate] = useLocation()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [overrideVersion, setOverrideVersion] = useState<number | null>(null)
  const [forkOpen, setForkOpen] = useState(false)
  const [forking, setForking] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const createNewVersion = useMutation(api.documents.createNewVersion)

  const initialPage = useMemo(() => {
    const p = new URLSearchParams(search).get("page")
    if (!p) return 1
    const n = parseInt(p, 10)
    return Number.isFinite(n) && n > 0 ? n : 1
  }, [search])

  const docResult = useQuery(
    api.documents.getWithAssets,
    id ? { id: id as Id<"documents"> } : "skip",
  )
  const currentVersion = useQuery(
    api.documents.getServingVersion,
    id ? { documentId: id as Id<"documents"> } : "skip",
  )
  const pdfUrl = useQuery(
    api.files.getUrl,
    currentVersion?.pdfStorageId
      ? { storageId: currentVersion.pdfStorageId }
      : "skip",
  )
  const ready = docResult !== undefined

  const docWithAssets = useMemo(() => {
    if (!docResult) return null
    return {
      ...toLegacyDoc(docResult.doc),
      assets: docResult.assets.map(toLegacyAsset),
    }
  }, [docResult])

  const version = useMemo(() => {
    if (!currentVersion) return null
    return {
      id: currentVersion._id,
      document_id: currentVersion.documentId,
      version: currentVersion.version,
      body_kind: currentVersion.bodyKind,
      body_json: currentVersion.bodyJson,
      pdf_blob_id: currentVersion.pdfStorageId,
      published_at: new Date(currentVersion.publishedAt).toISOString(),
    }
  }, [currentVersion])

  const owner = null

  const rawDoc = docResult?.doc
  const liveVer = rawDoc?.liveVersion ?? null
  const workingVer = rawDoc?.currentVersion ?? 1
  const workingStatus = rawDoc?.status
  // A published edition is live; editing it forks the next draft. A working
  // draft exists when the latest edition is ahead of the live one.
  const isPublished = workingStatus === "published"
  const hasWorkingDraft = liveVer != null && workingVer > liveVer

  function goEdit() {
    if (rawDoc) navigate(`/docs/${rawDoc._id}/edit`)
  }
  function handleEdit() {
    if (!rawDoc) return
    // Published editions are read-only — confirm forking a new version first.
    if (isPublished) setForkOpen(true)
    else goEdit()
  }
  async function confirmFork() {
    if (!rawDoc) return
    setForking(true)
    try {
      const res = await createNewVersion({ id: rawDoc._id })
      toast.success(`Started v${res.version} draft`)
      setForkOpen(false)
      navigate(`/docs/${rawDoc._id}/edit`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't create a new version",
      )
    } finally {
      setForking(false)
    }
  }

  if (!ready) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!docWithAssets) {
    return (
      <div className="space-y-3 p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/library")} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to library
        </Button>
        <h1 className="text-xl font-semibold">Document not found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn't find a document with id <code>{id}</code>.
        </p>
      </div>
    )
  }

  const isViewingHistorical =
    overrideVersion != null && overrideVersion !== docWithAssets.current_version
  const renderedVersionNumber = version?.version ?? docWithAssets.current_version
  const ppeItems =
    version?.body_kind === "tiptap" ? extractPpeItems(version.body_json) : []

  return (
    <div className="flex h-full flex-col print:block">
      <div className="print:hidden">
        <TopBar
          breadcrumb={[
            { label: "Library", href: "/library" },
            { label: `${docWithAssets.naming_code} · ${docWithAssets.title}` },
          ]}
        />
        <PageHeader
          title={`${docWithAssets.naming_code} · ${docWithAssets.title}`}
          subtitle={
            hasWorkingDraft
              ? `v${renderedVersionNumber} · Live`
              : `v${renderedVersionNumber} · ${docWithAssets.status}`
          }
          actions={
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="mr-1 h-3.5 w-3.5" />
                Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHistoryOpen(true)}
              >
                <History className="mr-1 h-3.5 w-3.5" />
                History
              </Button>
              <PublishToPdfDialog
                documentId={docWithAssets.id}
                trigger={
                  <Button
                    size="sm"
                    className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Publish to PDF
                  </Button>
                }
              />
              <Button size="sm" onClick={handleEdit}>
                <Edit className="mr-1 h-3.5 w-3.5" />
                {isPublished ? "New version" : "Edit"}
              </Button>
            </>
          }
        />
      </div>

      <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[1fr_240px] print:block print:p-0">
        <div className="min-w-0 space-y-4">
          {hasWorkingDraft && !isViewingHistorical && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 print:hidden">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>
                  You are viewing the live v{liveVer}. A newer edition (v
                  {workingVer}) is in progress
                  {workingStatus ? ` · ${workingStatus}` : ""} and will replace it
                  once published.
                </span>
                <Button size="sm" variant="outline" onClick={goEdit}>
                  Open in editor
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {isViewingHistorical && (
            <Alert className="print:hidden">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>
                  Viewing v{renderedVersionNumber} — not the current version (v
                  {docWithAssets.current_version}).
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOverrideVersion(null)}
                >
                  Back to current
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <DocumentHero
            doc={docWithAssets}
            assets={docWithAssets.assets}
            owner={owner}
            versionNumber={renderedVersionNumber}
            ppeItems={ppeItems}
            roles={docResult?.roles}
            statusOverride={
              hasWorkingDraft && !isViewingHistorical ? "published" : undefined
            }
          />

          {version == null ? (
            <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
              No published version yet.
            </div>
          ) : version.body_kind === "pdf" ? (
            <PdfViewer url={pdfUrl ?? null} pageNumber={initialPage} />
          ) : (
            <div ref={contentRef} className="rounded-md border bg-background p-6">
              <TiptapReadOnly content={version.body_json} />
            </div>
          )}
        </div>

        <aside className="space-y-5 print:hidden">
          {version?.body_kind === "tiptap" && (
            <div className="sticky top-20">
              <DocumentToc body={version.body_json} contentRef={contentRef} />
            </div>
          )}
        </aside>
      </div>

      <AlertDialog open={forkOpen} onOpenChange={setForkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a new version?</AlertDialogTitle>
            <AlertDialogDescription>
              This document is published. You are about to create version v
              {workingVer + 1}, starting as a draft copy of the live v
              {liveVer ?? workingVer}. The live version stays online for
              operators until the new one is reviewed, approved, and published.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmFork()
              }}
              disabled={forking}
            >
              {forking ? "Creating…" : `Create v${workingVer + 1} draft`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VersionHistoryDrawer
        documentId={docWithAssets.id}
        currentVersion={docWithAssets.current_version}
        selectedVersion={overrideVersion ?? docWithAssets.current_version}
        onSelect={(v) =>
          setOverrideVersion(v === docWithAssets.current_version ? null : v)
        }
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  )
}
