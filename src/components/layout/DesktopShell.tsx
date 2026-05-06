import { ReactNode } from "react"
import { Link, useLocation } from "wouter"
import {
  FileText,
  Boxes,
  Smartphone,
  Settings,
  FolderKanban,
  PlusCircle,
  Microscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type NavItem = {
  label: string
  to: string
  icon: typeof FileText
  match?: (path: string) => boolean
}

const NAV: NavItem[] = [
  {
    label: "Library",
    to: "/",
    icon: FileText,
    match: (p) => p === "/" || p.startsWith("/docs"),
  },
  {
    label: "Assets",
    to: "/assets",
    icon: Boxes,
    match: (p) => p.startsWith("/assets"),
  },
]

const ANALYSIS_NAV: NavItem[] = [
  {
    label: "IDA sources & clear modal",
    to: "/analysis/ida-sources-and-clear-modal",
    icon: Microscope,
    match: (p) => p === "/analysis/ida-sources-and-clear-modal",
  },
  {
    label: "TipTap editor revamp",
    to: "/analysis/tiptap-editor-revamp",
    icon: Microscope,
    match: (p) => p === "/analysis/tiptap-editor-revamp",
  },
  {
    label: "Gap analysis",
    to: "/analysis/gap-analysis",
    icon: Microscope,
    match: (p) => p === "/analysis/gap-analysis",
  },
  {
    label: "Editor & Publish-to-PDF",
    to: "/analysis/editor-publish-flow",
    icon: Microscope,
    match: (p) => p === "/analysis/editor-publish-flow",
  },
  {
    label: "Frontend → Convex migration",
    to: "/analysis/frontend-to-convex-migration",
    icon: Microscope,
    match: (p) => p === "/analysis/frontend-to-convex-migration",
  },
]

const BOTTOM_NAV: NavItem[] = [
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
    match: (p) => p.startsWith("/settings"),
  },
]

export function DesktopShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation()

  function openMobileWindow() {
    window.open(
      `${window.location.origin}/m`,
      "oppr-mobile",
      "width=390,height=844,resizable=yes,scrollbars=yes",
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col self-start overflow-y-auto border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Oppr DOCS</div>
            <div className="text-xs text-sidebar-accent">v1.0 showcase</div>
          </div>
        </div>

        <div className="px-3 pt-4">
          <Button
            className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            size="sm"
            onClick={() => navigate("/docs/new")}
          >
            <PlusCircle className="h-4 w-4" />
            New document
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = item.match ? item.match(location) : location === item.to
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-border/40 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}

          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-border/40 hover:text-sidebar-foreground"
            onClick={openMobileWindow}
          >
            <Smartphone className="h-4 w-4" />
            <span className="flex-1 text-left">Mobile</span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-accent">
              Open
            </span>
          </button>

          {ANALYSIS_NAV.length > 0 && (
            <>
              <Separator className="my-3 bg-sidebar-border" />
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-accent">
                Analysis
              </div>
              {ANALYSIS_NAV.map((item) => {
                const Icon = item.icon
                const active = item.match
                  ? item.match(location)
                  : location === item.to
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-border/40 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon
            const active = item.match ? item.match(location) : location === item.to
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-border/40 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
