// PPE configurator — the Safety tab on the Templates page.
//
// Lists every PPE item with its bundled pictogram, lets you toggle which appear
// in the editor's PPE picker, edit label/description/pictogram, add custom
// items, and delete custom ones. Built-in items can be deactivated but not
// deleted. Self-seeds the factory catalog on first visit.

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PPE_PICTOGRAM_IDS, ppeDataUrl } from "@/lib/ppePictograms"

interface PpeRow {
  _id: Id<"ppeItems">
  slug: string
  label: string
  description: string | null
  pictogramId: string
  active: boolean
  builtIn: boolean
  sortOrder: number
}

function Pictogram({ id, size = 28 }: { id: string; size?: number }) {
  return (
    <img
      src={ppeDataUrl(id)}
      alt=""
      width={size}
      height={size}
      className="shrink-0"
      draggable={false}
    />
  )
}

export function PpeConfigurator() {
  const rows = useQuery(api.ppe.list) as PpeRow[] | undefined
  const seed = useMutation(api.ppe.seedIfEmpty)

  useEffect(() => {
    if (rows !== undefined && rows.length === 0) {
      void seed({}).catch(() => {})
    }
  }, [rows, seed])

  const activeCount = useMemo(
    () => (rows ?? []).filter((r) => r.active).length,
    [rows],
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Required PPE</CardTitle>
        <CardDescription className="text-xs">
          The personal protective equipment authors can add to a document. Only
          active items appear in the editor&rsquo;s PPE picker. Built-in items
          can be switched off but not deleted; add your own below.
          {rows !== undefined && (
            <span className="ml-1 font-medium text-foreground">
              {activeCount} active.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows === undefined ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Seeding defaults…</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((r) => (
              <PpeItemRow key={r._id} row={r} />
            ))}
          </div>
        )}
        <AddPpe />
      </CardContent>
    </Card>
  )
}

function PpeItemRow({ row }: { row: PpeRow }) {
  const setActive = useMutation(api.ppe.setActive)
  const update = useMutation(api.ppe.update)
  const remove = useMutation(api.ppe.remove)
  const [editing, setEditing] = useState(false)

  async function guard(fn: () => Promise<unknown>) {
    try {
      await fn()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div
      className={cn(
        "rounded-md border p-2.5",
        row.active ? "bg-card" : "bg-muted/40 opacity-70",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Pictogram id={row.pictogramId} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{row.label}</span>
            {row.builtIn && (
              <span className="rounded bg-muted px-1 text-[9px] text-muted-foreground">
                built-in
              </span>
            )}
          </div>
          {row.description && (
            <p className="truncate text-[11px] text-muted-foreground">
              {row.description}
            </p>
          )}
        </div>
        <Switch
          checked={row.active}
          onCheckedChange={(v) =>
            void guard(() => setActive({ id: row._id, active: v }))
          }
        />
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px]"
          onClick={() => setEditing((e) => !e)}
        >
          {editing ? "Close" : "Edit"}
        </Button>
        {!row.builtIn && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => void guard(() => remove({ id: row._id }))}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {editing && (
        <div className="mt-2 space-y-2 border-t pt-2">
          <Input
            defaultValue={row.label}
            className="h-8 text-xs"
            placeholder="Label"
            onBlur={(e) =>
              e.target.value.trim() !== row.label &&
              void guard(() => update({ id: row._id, label: e.target.value }))
            }
          />
          <Input
            defaultValue={row.description ?? ""}
            className="h-8 text-xs"
            placeholder="Description"
            onBlur={(e) =>
              (e.target.value.trim() || null) !== row.description &&
              void guard(() =>
                update({ id: row._id, description: e.target.value }),
              )
            }
          />
          <PictogramPicker
            value={row.pictogramId}
            onChange={(id) =>
              void guard(() => update({ id: row._id, pictogramId: id }))
            }
          />
        </div>
      )}
    </div>
  )
}

function AddPpe() {
  const add = useMutation(api.ppe.add)
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [pictogramId, setPictogramId] = useState(PPE_PICTOGRAM_IDS[0])
  const [busy, setBusy] = useState(false)

  async function onAdd() {
    if (!label.trim()) return
    setBusy(true)
    try {
      await add({ label: label.trim(), description: description.trim(), pictogramId })
      setLabel("")
      setDescription("")
      setPictogramId(PPE_PICTOGRAM_IDS[0])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="text-[11px] font-medium text-muted-foreground">
        Add a PPE item
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1 space-y-1">
          <Label className="text-[11px]">Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Cut-resistant gloves"
            className="h-8 text-xs"
          />
        </div>
        <div className="min-w-[12rem] flex-1 space-y-1">
          <Label className="text-[11px]">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="h-8 text-xs"
          />
        </div>
        <Button size="sm" onClick={() => void onAdd()} disabled={busy} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Pictogram</Label>
        <PictogramPicker value={pictogramId} onChange={setPictogramId} />
      </div>
    </div>
  )
}

function PictogramPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {PPE_PICTOGRAM_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "rounded border p-0.5 transition-colors",
            value === id
              ? "border-primary ring-1 ring-primary"
              : "border-input hover:bg-muted",
          )}
          title={id}
        >
          <img src={ppeDataUrl(id)} alt="" width={24} height={24} draggable={false} />
        </button>
      ))}
    </div>
  )
}
