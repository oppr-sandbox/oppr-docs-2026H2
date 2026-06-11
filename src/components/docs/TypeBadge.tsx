import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DocumentType } from "@/types"
import { typeBadgeClass, typeIcon, useDocTypes } from "@/lib/typeMeta"

interface TypeBadgeProps {
  type: DocumentType
  className?: string
  /** Hide the label (used when space is tight). */
  iconOnly?: boolean
}

// Renders a document-type chip from the editable namingTypes vocabulary. All
// badges share one Convex subscription via useDocTypes; unknown slugs fall back
// to a neutral placeholder so a deleted type still renders.
export function TypeBadge({ type, className, iconOnly }: TypeBadgeProps) {
  const { resolve } = useDocTypes()
  const meta = resolve(type)
  const Icon = typeIcon(meta.icon)
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", typeBadgeClass(meta.color), className)}
    >
      <Icon className="h-3 w-3" />
      {!iconOnly && <span>{meta.label}</span>}
    </Badge>
  )
}
