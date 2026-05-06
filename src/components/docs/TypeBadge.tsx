import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BookOpen, FileText, ListChecks, ShieldAlert } from "lucide-react"
import type { DocumentType } from "@/types"

interface TypeMeta {
  label: string
  icon: typeof FileText
  className: string
}

const META: Record<DocumentType, TypeMeta> = {
  sop: {
    label: "SOP",
    icon: FileText,
    className: "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-50",
  },
  manual: {
    label: "Manual",
    icon: BookOpen,
    className:
      "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-50",
  },
  work_instruction: {
    label: "Work instruction",
    icon: ListChecks,
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  lmra: {
    label: "LMRA",
    icon: ShieldAlert,
    className: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-50",
  },
}

interface TypeBadgeProps {
  type: DocumentType
  className?: string
  /** Hide the icon (used when space is tight). */
  iconOnly?: boolean
}

export function TypeBadge({ type, className, iconOnly }: TypeBadgeProps) {
  const meta = META[type] ?? {
    label: type,
    icon: FileText,
    className: "",
  }
  const Icon = meta.icon
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", meta.className, className)}
    >
      <Icon className="h-3 w-3" />
      {!iconOnly && <span>{meta.label}</span>}
    </Badge>
  )
}
