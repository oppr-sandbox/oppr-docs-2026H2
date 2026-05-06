import { ChevronLeft } from "lucide-react"
import { useLocation } from "wouter"
import type { ReactNode } from "react"

interface MobileHeaderProps {
  /**
   * Where the back button navigates. Defaults to /m. Set to `null` to hide
   * the back button entirely (top-level pages).
   */
  backTo?: string | null
  /** Optional explicit onClick override (e.g. open a parent picker). */
  onBack?: () => void
  title: string
  subtitle?: string
  /** Optional right-aligned action slot — typically a search/menu icon. */
  right?: ReactNode
}

/**
 * Sticky top header for mobile sub-pages. Renders a 44px-tall back button,
 * the title, an optional subtitle, and an optional right slot.
 */
export function MobileHeader({
  backTo = "/m",
  onBack,
  title,
  subtitle,
  right,
}: MobileHeaderProps) {
  const [, navigate] = useLocation()
  const showBack = onBack != null || backTo !== null

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-3 py-3 backdrop-blur">
      {showBack ? (
        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack()
              return
            }
            if (backTo) navigate(backTo)
          }}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : (
        <div className="h-11 w-2 shrink-0" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-base font-semibold leading-tight text-foreground">
          {title}
        </div>
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-1">{right}</div> : null}
    </header>
  )
}
