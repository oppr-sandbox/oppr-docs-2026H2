// Modal "New document" picker. Wraps a trigger element. On click of a card,
// closes the modal and routes to /docs/new/compose or /docs/new/import.

import { useState, type ReactNode } from "react"
import { useLocation } from "wouter"
import { FileText, PlusCircle, Upload } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface NewDocumentDialogProps {
  trigger: ReactNode
}

export function NewDocumentDialog({ trigger }: NewDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [, navigate] = useLocation()

  function pick(path: string) {
    setOpen(false)
    navigate(path)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4 text-primary" />
            New document
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pick how you want to start. Both paths land in the editor with
            metadata next.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2 md:grid-cols-2">
          <PickerCard
            icon={FileText}
            title="Compose new"
            description="Open the rich-text editor with a starting template for your document type."
            onClick={() => pick("/docs/new/compose")}
          />
          <PickerCard
            icon={Upload}
            title="Import PDF"
            description="Upload an existing PDF. We extract per-page text and serve it through the read view."
            onClick={() => pick("/docs/new/import")}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PickerCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof FileText
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="cursor-pointer transition-colors hover:border-primary"
    >
      <CardHeader className="pb-2">
        <Icon className="h-8 w-8 text-primary" />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
