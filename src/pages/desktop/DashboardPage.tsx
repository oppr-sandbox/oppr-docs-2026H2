import { useMemo } from "react"
import { useLocation } from "wouter"
import {
  Boxes,
  FileText,
  LayoutDashboard,
  Library,
  PlusCircle,
  Smartphone,
  Sparkles,
  Upload,
} from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { toLegacyDoc } from "@/lib/convex-adapters"
import type { DocumentStatus } from "@/types"

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  archived: "Archived",
}

export function DashboardPage() {
  const [, navigate] = useLocation()
  const docsResult = useQuery(api.documents.list, {})
  const assetsResult = useQuery(api.assets.list)
  const ready = docsResult !== undefined && assetsResult !== undefined

  const docs = useMemo(
    () => (docsResult ? docsResult.map(toLegacyDoc) : []),
    [docsResult],
  )

  const recent = useMemo(
    () =>
      docs
        .filter((d) => d.status === "published")
        .slice(0, 5),
    [docs],
  )

  const drafts = useMemo(
    () =>
      docs
        .filter((d) => d.status === "draft" || d.status === "in_review")
        .slice(0, 5),
    [docs],
  )

  const counts = useMemo(() => {
    const c: Record<DocumentStatus, number> = {
      draft: 0,
      in_review: 0,
      published: 0,
      archived: 0,
    }
    for (const d of docs) c[d.status]++
    return c
  }, [docs])

  function openMobileWindow() {
    window.open(
      `${window.location.origin}/m`,
      "oppr-mobile",
      "width=390,height=844,resizable=yes,scrollbars=yes",
    )
  }

  return (
    <div className="flex flex-col">
      <TopBar breadcrumb={[{ label: "Dashboard" }]} />
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Quick start and a snapshot of the library."
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick actions
              </CardTitle>
              <CardDescription className="text-xs">
                Start something new in one click.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1 py-3"
                onClick={() => navigate("/docs/new")}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="text-xs">New document</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1 py-3"
                onClick={() => navigate("/docs/new/import")}
              >
                <Upload className="h-4 w-4" />
                <span className="text-xs">Upload PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1 py-3"
                onClick={() => navigate("/library")}
              >
                <Library className="h-4 w-4" />
                <span className="text-xs">Browse library</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1 py-3"
                onClick={openMobileWindow}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs">Open mobile</span>
              </Button>
            </CardContent>
          </Card>

          {/* Library stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Library className="h-4 w-4 text-primary" />
                Library
              </CardTitle>
              <CardDescription className="text-xs">
                {ready ? `${docs.length} documents · ${assetsResult?.length ?? 0} assets` : "Loading…"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!ready ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(counts) as DocumentStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => navigate("/library")}
                      className="rounded-md border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="text-2xl font-semibold tabular-nums">
                        {counts[s]}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {STATUS_LABEL[s]}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent published */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                Recently published
              </CardTitle>
              <CardDescription className="text-xs">
                Latest SOPs, manuals, and work instructions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!ready ? (
                <DocListSkeleton />
              ) : recent.length === 0 ? (
                <Empty label="No published documents yet." />
              ) : (
                <ul className="divide-y">
                  {recent.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/docs/${d.id}`)}
                        className="flex w-full items-center justify-between gap-2 py-2 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {d.title}
                          </div>
                          <div className="truncate font-mono text-[10px] text-muted-foreground">
                            {d.naming_code}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          v{d.current_version}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Drafts in review */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Boxes className="h-4 w-4 text-primary" />
                Needs attention
              </CardTitle>
              <CardDescription className="text-xs">
                Drafts and items in review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!ready ? (
                <DocListSkeleton />
              ) : drafts.length === 0 ? (
                <Empty label="Nothing in draft or review." />
              ) : (
                <ul className="divide-y">
                  {drafts.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/docs/${d.id}`)}
                        className="flex w-full items-center justify-between gap-2 py-2 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {d.title}
                          </div>
                          <div className="truncate font-mono text-[10px] text-muted-foreground">
                            {d.naming_code}
                          </div>
                        </div>
                        <Badge
                          className={
                            d.status === "in_review"
                              ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 text-[10px]"
                              : "bg-muted text-muted-foreground text-[10px]"
                          }
                        >
                          {STATUS_LABEL[d.status]}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DocListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
      {label}
    </div>
  )
}
