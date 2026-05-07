import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Link, useLocation, useSearch } from "wouter"
import {
  Files,
  Home,
  MessageSquare,
  ScanLine,
  WifiOff,
  X,
  Factory,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useOnline } from "./use-mobile-prefs"

const HINT_KEY = "oppr-docs:mobile-hint-seen"

// Routes where the bottom nav is hidden so the operator can focus.
// Matched against the wouter `useLocation()` pathname.
const NAV_HIDDEN_PATTERNS: RegExp[] = [
  /^\/m\/docs\/[^/]+$/, // doc reader — immersive
]

function shouldHideNav(pathname: string, search: string): boolean {
  if (NAV_HIDDEN_PATTERNS.some((re) => re.test(pathname))) return true
  // Ask page hides the nav once a scope is selected (chat mode).
  if (pathname === "/m/ask" && new URLSearchParams(search).has("scope")) {
    return true
  }
  return false
}

interface MobileShellState {
  navVisible: boolean
}

const MobileShellCtx = createContext<MobileShellState>({ navVisible: true })

export function useMobileShell(): MobileShellState {
  return useContext(MobileShellCtx)
}

export function MobileShell({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const search = useSearch()
  const [showHint, setShowHint] = useState(false)
  const online = useOnline()

  const navVisible = !shouldHideNav(location, search)

  useEffect(() => {
    if (typeof window === "undefined") return
    const seen = localStorage.getItem(HINT_KEY)
    if (!seen && window.innerWidth > 500) {
      setShowHint(true)
    }
  }, [])

  function dismissHint() {
    localStorage.setItem(HINT_KEY, "1")
    setShowHint(false)
  }

  const ctx = useMemo<MobileShellState>(
    () => ({ navVisible }),
    [navVisible],
  )

  return (
    <MobileShellCtx.Provider value={ctx}>
      {/* h-[100dvh] keeps the shell exactly viewport-height so the inner
          flex-1 overflow-y-auto actually scroll-contains its content and
          the bottom nav stays pinned regardless of page length. dvh is
          the dynamic viewport unit — accounts for iOS Safari's address
          bar growing/shrinking, unlike vh. */}
      <div className="flex h-[100dvh] w-full justify-center bg-muted/40">
        <div className="relative flex h-full w-full max-w-[430px] flex-col bg-background shadow-xl">
          {showHint && (
            <div className="absolute inset-x-0 top-0 z-50 mx-3 mt-3 rounded-lg border border-primary/30 bg-card p-3 text-xs shadow-md">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-foreground">
                    Resize this window
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Drag this browser window to roughly phone size (~390 × 844)
                    to experience the operator app as it would feel in hand.
                  </div>
                </div>
                <button
                  onClick={dismissHint}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {!online && (
            <div className="flex shrink-0 items-center justify-center gap-1.5 bg-amber-500/15 px-3 py-1.5 text-[11px] font-medium text-amber-900 dark:text-amber-200">
              <WifiOff className="h-3 w-3" />
              Offline — local data only
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

          {navVisible && (
            <nav className="grid shrink-0 grid-cols-5 border-t bg-background/95 backdrop-blur">
              <BottomLink to="/m" current={location} icon={Home} label="Home" />
              <BottomLink
                to="/m/assets"
                current={location}
                icon={Factory}
                label="Assets"
              />
              <BottomLink
                to="/m/docs"
                current={location}
                icon={Files}
                label="Docs"
              />
              <BottomLink
                to="/m/scan"
                current={location}
                icon={ScanLine}
                label="Scan"
              />
              <BottomLink
                to="/m/ask"
                current={location}
                icon={MessageSquare}
                label="Ask"
              />
            </nav>
          )}
        </div>
      </div>
    </MobileShellCtx.Provider>
  )
}

function BottomLink({
  to,
  current,
  icon: Icon,
  label,
}: {
  to: string
  current: string
  icon: typeof Home
  label: string
}) {
  const active =
    to === "/m"
      ? current === "/m"
      : current === to ||
        current.startsWith(`${to}/`) ||
        current.startsWith(`${to}?`)
  return (
    <Link
      href={to}
      className={cn(
        "flex flex-col items-center gap-0.5 px-1 py-2 text-[9px] transition-colors",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
