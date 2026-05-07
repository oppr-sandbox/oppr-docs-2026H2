import type { ComponentType, ReactNode } from "react"
import type { LucideProps } from "lucide-react"

interface PageHeaderProps {
  icon?: ComponentType<LucideProps>
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-0.5 text-xs text-muted-foreground">
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
