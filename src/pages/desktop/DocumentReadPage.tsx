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
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { toLegacyAsset, toLegacyDoc } from "@/lib/convex-adapters"
import { TiptapReadOnly } from "@/components/docs/TiptapReadOnly"
import { VersionHistoryDrawer } from "@/components/docs/VersionHistoryDrawer"
import { DocumentHero, extractPpeItems } from "@/components/docs/DocumentHero"
import { DocumentToc } from "@/components/docs/DocumentToc"
import { AskIdaSheet } from "@/components/ai/AskIdaSheet"
import { PublishToPdfDialog } from "@/components/docs/PublishToPdfDialog"

export function DocumentReadPage() {
  const [, params] = useRoute<{ id: string }>("/docs/:id")
  const id = params?.id
  useSearch()
  const [, navigate] = useLocation()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [overrideVersion, setOverrideVersion] = useState<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const docResult = useQuery(
    api.documents.getWithAssets,
    id ? { id: id as Id<"documents"> } : "skip",
  )
  const currentVersion = useQuery(
    api.documents.getCurrentVersion,
    id ? { documentId: id as Id<"documents"> } : "skip",
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
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="-ml-2">
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
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="-ml-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Library
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-muted-foreground">
            <span className="font-mono text-xs">{docWithAssets.naming_code}</span>
            <span className="mx-2">·</span>
            <span>{docWithAssets.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AskIdaSheet
            scope={{ kind: "doc", id: docWithAssets.id }}
            variant="outline"
          />
          <PublishToPdfDialog
            documentId={docWithAssets.id}
            trigger={
              <Button
                size="sm"
                className="gap-1.5 bg-orange-600 text-white hover:bg-orange-700"
              >
                <FileDown className="h-4 w-4" />
                Publish to PDF
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="mr-1 h-4 w-4" />
            History
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/docs/${docWithAssets.id}/edit`)}
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </div>
      </header>

      <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[1fr_240px] print:block print:p-0">
        <div className="min-w-0 space-y-4">
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
          />

          {version == null ? (
            <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
              No published version yet.
            </div>
          ) : version.body_kind === "pdf" ? (
            <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
              PDF rendering moves to Convex storage in Phase 4.
            </div>
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
