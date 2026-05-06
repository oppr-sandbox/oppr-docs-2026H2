import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DocumentStatus } from "@/types"

const LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  archived: "Archived",
}

interface StatusBadgeProps {
  status: DocumentStatus
  className?: string
}

/**
 * Maps a document status to a badge variant + colour:
 *   draft      → secondary (muted)
 *   in_review  → outline w/ amber text
 *   published  → success (green)
 *   archived   → outline w/ muted text
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = LABELS[status] ?? status

  switch (status) {
    case "draft":
      return (
        <Badge variant="secondary" className={cn("font-medium", className)}>
          {label}
        </Badge>
      )
    case "in_review":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-50",
            className,
          )}
        >
          {label}
        </Badge>
      )
    case "published":
      return (
        <Badge variant="success" className={cn("font-medium", className)}>
          {label}
        </Badge>
      )
    case "archived":
      return (
        <Badge
          variant="outline"
          className={cn("text-muted-foreground", className)}
        >
          {label}
        </Badge>
      )
    default:
      return <Badge className={className}>{label}</Badge>
  }
}
