// TemplatesPage (/templates)
//
// Two tabs: DB-backed document templates (create / edit / duplicate / delete)
// and the org-wide PDF cover settings consumed by every export.

import { useState } from "react"
import { useLocation } from "wouter"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Copy, FileDown, LayoutTemplate, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TypeBadge } from "@/components/docs/TypeBadge"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { CoverSettingsEditor } from "@/components/docs/CoverSettingsEditor"
import { PpeConfigurator } from "@/components/docs/PpeConfigurator"

export function TemplatesPage() {
  const [, navigate] = useLocation()
  const templates = useQuery(api.templates.list, {})
  const duplicate = useMutation(api.templates.duplicate)
  const remove = useMutation(api.templates.remove)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  async function onDuplicate(id: string) {
    try {
      await duplicate({ id: id as Id<"templates"> })
      toast.success("Template duplicated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return
    try {
      await remove({ id: deleteTarget.id as Id<"templates"> })
      toast.success("Template deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar breadcrumb={[{ label: "Templates" }]} />
      <PageHeader
        icon={LayoutTemplate}
        title="Templates"
        subtitle="Starting points for new documents, and the PDF cover applied to every export."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/templates/new")}>
            <Plus className="h-3.5 w-3.5" />
            New template
          </Button>
        }
      />
      <div className="p-6">
        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates" className="gap-1.5">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="cover" className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" />
              PDF cover
            </TabsTrigger>
            <TabsTrigger value="safety" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Safety
            </TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="mt-4 space-y-3">
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
                          onClick={() => setDeleteTarget({ id: t._id, name: t.name })}
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
          </TabsContent>
          <TabsContent value="cover" className="mt-4">
            <CoverSettingsEditor />
          </TabsContent>
          <TabsContent value="safety" className="mt-4">
            <PpeConfigurator />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes &ldquo;{deleteTarget?.name}&rdquo;.
              Existing documents are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onConfirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
