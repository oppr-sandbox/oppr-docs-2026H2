import type { ComponentType, ReactNode } from "react"
import type { LucideProps } from "lucide-react"

interface PageHeaderProps {
  icon?: ComponentType<LucideProps>
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  /** Optional id on the root, so callers can measure the sticky header height. */
  id?: string
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  id,
}: PageHeaderProps) {
  return (
    <div
      id={id}
      className="sticky top-12 z-20 flex flex-wrap items-start justify-between gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <Icon className="h-5 w-5 shrink-0 text-primary" />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
