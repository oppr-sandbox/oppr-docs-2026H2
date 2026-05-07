// Document creation chooser. Replaces the "Switch to PDF import" toggle
// with an explicit choice at creation time. Two cards: Compose new (TipTap
// editor + metadata) and Import PDF (drop zone + metadata).

import { useLocation } from "wouter"
import { FileText, PlusCircle, Upload } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"

export function DocumentNewChooserPage() {
  const [, navigate] = useLocation()

  return (
    <div className="flex flex-col">
      <TopBar
        breadcrumb={[
          { label: "Library", href: "/library" },
          { label: "New document" },
        ]}
      />
      <PageHeader
        icon={PlusCircle}
        title="New document"
        subtitle="Pick how you want to start. You can change neither path mid-flow without losing your draft."
      />

      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ChooserCard
            icon={FileText}
            title="Compose new"
            description="Open the rich-text editor with a starting template for your document type. Author SOPs, manuals, and work instructions inline."
            onClick={() => navigate("/docs/new/compose")}
          />
          <ChooserCard
            icon={Upload}
            title="Import PDF"
            description="Upload an existing PDF. We extract per-page text, register it for retrieval, and serve it through the read view."
            onClick={() => navigate("/docs/new/import")}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          The next screen also lets you set metadata (title, type, owner,
          linked assets, naming code).
        </p>
      </div>
    </div>
  )
}

function ChooserCard({
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
      <CardHeader className="pb-3">
        <Icon className="h-10 w-10 text-primary" />
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
