import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useLocation, useRoute, useSearch } from "wouter"
import { Copy, FileDown, Maximize2, Share2, Star, X } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { toLegacyAsset, toLegacyDoc } from "@/lib/convex-adapters"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { MobileDocSummary } from "@/components/mobile/MobileDocSummary"
import { AskFloatingButton } from "@/components/mobile/AskFloatingButton"
import { extractPpeItems } from "@/components/docs/DocumentHero"
import { PublishToPdfDialog } from "@/components/docs/PublishToPdfDialog"
import {
  usePinned,
  useRecentlyViewed,
} from "@/components/mobile/use-mobile-prefs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const TiptapReadOnly = lazy(() =>
  import("@/components/docs/TiptapReadOnly").then((m) => ({
    default: m.TiptapReadOnly,
  })),
)

interface ViewerErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}
interface ViewerErrorBoundaryState {
  hasError: boolean
}

class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = { hasError: false }
  static getDerivedStateFromError(): ViewerErrorBoundaryState {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.warn("[oppr-docs] Viewer failed to load:", error)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

const VIEWER_FALLBACK = (
  <div className="p-6 text-sm text-muted-foreground">Loading viewer…</div>
)

const VIEWER_UNAVAILABLE = (
  <div className="p-6 text-sm text-muted-foreground">
    Document viewer not yet available.
  </div>
)

export function MobileDocPage() {
  const [, params] = useRoute<{ id: string }>("/m/docs/:id")
  const id = params?.id ?? ""
  useSearch()
  const [, navigate] = useLocation()
  const { isPinned, togglePin } = usePinned()
  const { pushRecent } = useRecentlyViewed()
  const [fullscreen, setFullscreen] = useState(false)

  const docResult = useQuery(
    api.documents.getWithAssets,
    id ? { id: id as Id<"documents"> } : "skip",
  )
  const ready = docResult !== undefined
  const currentVersion = useQuery(
    api.documents.getCurrentVersion,
    id ? { documentId: id as Id<"documents"> } : "skip",
  )

  const doc = useMemo(() => {
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

  // Source of back navigation: previous asset page if present, else /m/docs.
  const backTo = doc?.assets?.[0]
    ? `/m/assets/${doc.assets[0].id}`
    : "/m/docs"

  useEffect(() => {
    if (!doc) return
    pushRecent({
      kind: "doc",
      id: doc.id,
      label: doc.title,
      sublabel: doc.naming_code,
    })
  }, [doc, pushRecent])

  if (!ready) {
    return (
      <div className="flex flex-col">
        <MobileHeader backTo="/m/docs" title="Loading…" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex flex-col">
        <MobileHeader backTo="/m/docs" title="Not found" />
        <div className="p-4 text-sm text-muted-foreground">
          Document not found.
        </div>
      </div>
    )
  }

  function handleCopy() {
    if (!doc) return
    navigator.clipboard
      .writeText(doc.naming_code)
      .then(() => toast.success(`Copied ${doc.naming_code}`))
      .catch(() => toast.error("Failed to copy"))
  }

  async function handleShare() {
    if (!doc) return
    const shareData = {
      title: doc.title,
      text: `${doc.naming_code} — ${doc.title}`,
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled — ignore
      }
    } else {
      handleCopy()
      toast.message("Sharing not supported here — naming code copied instead.")
    }
  }

  const pinned = isPinned("doc", doc.id)

  return (
    <div className="flex flex-col">
      <MobileHeader
        backTo={backTo}
        title={doc.title}
        subtitle={doc.naming_code}
        right={
          <Button
            variant="ghost"
            size="icon"
            aria-label={pinned ? "Unpin document" : "Pin document"}
            className="h-10 w-10"
            onClick={() =>
              togglePin({
                kind: "doc",
                id: doc.id,
                label: doc.title,
                sublabel: doc.naming_code,
              })
            }
          >
            <Star
              className={cn(
                "h-5 w-5",
                pinned ? "fill-amber-500 text-amber-500" : "",
              )}
            />
          </Button>
        }
      />

      {/* Quick actions */}
      <div className="sticky top-[60px] z-[5] flex items-center gap-1 border-b bg-background/95 px-2 py-1.5 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleCopy}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy code
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Full
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleShare}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <PublishToPdfDialog
          documentId={doc.id}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
          }
        />
      </div>

      <div className="flex flex-col p-4 pb-24">
        <MobileDocSummary
          assets={doc.assets}
          ppeItems={
            version?.body_kind === "tiptap"
              ? extractPpeItems(version.body_json)
              : []
          }
        />
        {!version ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No published version yet.
          </div>
        ) : version.body_kind === "pdf" ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            PDF rendering moves to Convex storage in Phase 4.
          </div>
        ) : version.body_kind === "tiptap" ? (
          version.body_json == null ? (
            <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Document body is empty.
            </div>
          ) : (
            <ViewerErrorBoundary fallback={VIEWER_UNAVAILABLE}>
              <Suspense fallback={VIEWER_FALLBACK}>
                <TiptapReadOnly content={version.body_json} />
              </Suspense>
            </ViewerErrorBoundary>
          )
        ) : (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            Unknown document body type.
          </div>
        )}
      </div>

      {fullscreen && (
        <FullscreenViewer
          title={doc.title}
          subtitle={doc.naming_code}
          onClose={() => setFullscreen(false)}
        >
          {version?.body_kind === "tiptap" && version.body_json != null ? (
            <ViewerErrorBoundary fallback={VIEWER_UNAVAILABLE}>
              <Suspense fallback={VIEWER_FALLBACK}>
                <TiptapReadOnly content={version.body_json} />
              </Suspense>
            </ViewerErrorBoundary>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nothing to display.
            </div>
          )}
        </FullscreenViewer>
      )}

      <AskFloatingButton to={`/m/ask?scope=doc:${doc.id}`} />
    </div>
  )
}

function FullscreenViewer({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <header className="flex items-center gap-2 border-b bg-background/95 px-3 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close fullscreen"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="truncate text-base font-semibold leading-tight">
            {title}
          </div>
          {subtitle && (
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  )
}
