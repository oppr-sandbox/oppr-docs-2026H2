// Mobile Home — operator landing.
//
// Quick actions: Scan QR / Browse / Floorplan / Ask. Below that we surface
// the operator's pinned items (favorites) and recently viewed assets/docs so
// returning to a familiar SOP is one tap, not a hunt through search.

import { Link } from "wouter"
import {
  ChevronRight,
  Factory,
  Files,
  FolderKanban,
  Map as MapIcon,
  MessageSquare,
  ScanLine,
  Star,
} from "lucide-react"
import {
  usePinned,
  useRecentlyViewed,
  type EntityKind,
} from "@/components/mobile/use-mobile-prefs"
import { cn } from "@/lib/utils"

export function MobileHomePage() {
  const { recent } = useRecentlyViewed()
  const { pinned } = usePinned()

  return (
    <div className="flex flex-col gap-5 p-4 pt-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold">Oppr DOCS</div>
          <div className="text-xs text-muted-foreground">Operator app</div>
        </div>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-3">
        <ActionCard
          to="/m/scan"
          icon={ScanLine}
          title="Scan QR"
          subtitle="Find docs for an asset"
          tone="primary"
        />
        <ActionCard
          to="/m/ask?scope=library"
          icon={MessageSquare}
          title="Ask IDA"
          subtitle="Across every document"
          tone="secondary"
        />
        <ActionCard
          to="/m/assets"
          icon={Factory}
          title="Assets"
          subtitle="Browse all"
          tone="muted"
        />
        <ActionCard
          to="/m/docs"
          icon={Files}
          title="Documents"
          subtitle="Browse all"
          tone="muted"
        />
        <ActionCard
          to="/m/floorplan"
          icon={MapIcon}
          title="Floorplan"
          subtitle="Pin overview"
          tone="muted"
          className="col-span-2"
        />
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <Section
          title="Pinned"
          subtitle={`${pinned.length} saved`}
          icon={Star}
        >
          {pinned.map((p) => (
            <EntityRow
              key={`${p.kind}-${p.id}`}
              kind={p.kind}
              id={p.id}
              label={p.label}
              sublabel={p.sublabel}
            />
          ))}
        </Section>
      )}

      {/* Recently viewed */}
      {recent.length > 0 && (
        <Section title="Recently viewed">
          {recent.map((r) => (
            <EntityRow
              key={`${r.kind}-${r.id}-${r.visited_at}`}
              kind={r.kind}
              id={r.id}
              label={r.label}
              sublabel={r.sublabel}
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function ActionCard({
  to,
  icon: Icon,
  title,
  subtitle,
  tone,
  className,
}: {
  to: string
  icon: typeof ScanLine
  title: string
  subtitle: string
  tone: "primary" | "secondary" | "muted"
  className?: string
}) {
  return (
    <Link
      href={to}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm transition active:scale-[0.99]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          tone === "primary" && "bg-primary text-primary-foreground",
          tone === "secondary" && "bg-secondary text-secondary-foreground",
          tone === "muted" && "bg-muted text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold leading-tight">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {subtitle}
        </div>
      </div>
    </Link>
  )
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle?: string
  icon?: typeof Star
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {Icon && <Icon className="h-3 w-3" />}
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function EntityRow({
  kind,
  id,
  label,
  sublabel,
}: {
  kind: EntityKind
  id: string
  label: string
  sublabel?: string
}) {
  const to = kind === "doc" ? `/m/docs/${id}` : `/m/assets/${id}`
  const Icon = kind === "doc" ? Files : Factory
  return (
    <Link
      href={to}
      className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{label}</div>
        {sublabel && (
          <div className="truncate font-mono text-[10px] text-muted-foreground">
            {sublabel}
          </div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
