// TemplatesPage (/templates)
//
// DB-backed document templates. New documents can start from one of these
// instead of a blank page. Create / edit / duplicate / delete here.

import { useLocation } from "wouter"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Copy, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TypeBadge } from "@/components/docs/TypeBadge"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"

export function TemplatesPage() {
  const [, navigate] = useLocation()
  const templates = useQuery(api.templates.list, {})
  const duplicate = useMutation(api.templates.duplicate)
  const remove = useMutation(api.templates.remove)

  async function onDuplicate(id: string) {
    try {
      await duplicate({ id: id as Id<"templates"> })
      toast.success("Template duplicated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"? Existing documents are unaffected.`))
      return
    try {
      await remove({ id: id as Id<"templates"> })
      toast.success("Template deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar breadcrumb={[{ label: "Templates" }]} />
      <PageHeader
        icon={LayoutTemplate}
        title="Templates"
        subtitle="Starting points for new documents. Editing a template never changes documents already created from it."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/templates/new")}>
            <Plus className="h-3.5 w-3.5" />
            New template
          </Button>
        }
      />
      <div className="space-y-3 p-6">
        {templates === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">No templates yet</p>
                <p className="text-xs text-muted-foreground">
                  Create one, or run Settings → Fresh start to seed the defaults.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate("/templates/new")}>
                New template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((t) => (
            <Card key={t._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <TypeBadge type={t.type} />
                      {t.name}
                    </CardTitle>
                    {t.description && (
                      <CardDescription className="mt-1 text-xs">
                        {t.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => navigate(`/templates/${t._id}/edit`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Duplicate"
                      onClick={() => void onDuplicate(t._id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => void onDelete(t._id, t.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] text-muted-foreground">
                  Updated {new Date(t.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
