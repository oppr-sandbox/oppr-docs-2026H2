import type { ReactNode } from "react"
import { Link, useLocation } from "wouter"
import { ChevronRight, Home, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AskIdaSheet } from "@/components/ai/AskIdaSheet"
import type { AskPanelScope } from "@/components/ai/AskPanel"
import { UserMenu } from "./UserMenu"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface TopBarProps {
  breadcrumb: BreadcrumbItem[]
  // Page-specific actions render between breadcrumb and global ones.
  children?: ReactNode
  // Hides the global "+ New document" button (e.g. on the New document page).
  hideNewDoc?: boolean
  // Hides the Ask IDA button entirely (e.g. when the page hosts its own).
  hideAskIda?: boolean
  // Ask IDA scope — defaults to the whole library.
  askScope?: AskPanelScope
}

export function TopBar({
  breadcrumb,
  children,
  hideNewDoc,
  hideAskIda,
  askScope,
}: TopBarProps) {
  const [, navigate] = useLocation()
  const scope: AskPanelScope = askScope ?? { kind: "library" }

  return (
    <div className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Breadcrumb items={breadcrumb} />
      <div className="flex items-center gap-1.5">
        {children}
        {!hideAskIda && <AskIdaSheet scope={scope} variant="ghost" />}
        {!hideNewDoc && (
          <Button size="sm" onClick={() => navigate("/docs/new")}>
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            New document
          </Button>
        )}
        <UserMenu />
      </div>
    </div>
  )
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 overflow-hidden text-xs"
    >
      <Link
        href="/"
        className="flex h-6 items-center gap-1 rounded px-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Home"
      >
        <Home className="h-3 w-3" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                "truncate",
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className="truncate px-1.5 py-0.5 font-medium text-foreground">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
