// NamingSettingsPage (/settings/naming)
//
// Manages the Location and Discipline vocabulary that feeds the document
// naming code {LOCATION}-{DISCIPLINE}-{TYPE}-{NNNN}. Types are fixed
// (SOP/MAN/WI/LMRA); the sequence is allocated automatically per triplet.

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Hash, Plus, Trash2 } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"

type Kind = "location" | "discipline"

export function NamingSettingsPage() {
  const vocab = useQuery(api.naming.listVocabulary)

  return (
    <div className="flex flex-col">
      <TopBar
        breadcrumb={[
          { label: "Settings", href: "/settings" },
          { label: "Naming acronyms" },
        ]}
      />
      <PageHeader
        icon={Hash}
        title="Naming acronyms"
        subtitle="The Location and Discipline options that build every document code. Type tokens (SOP, MAN, WI, LMRA) are fixed; the sequence number is automatic."
      />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <VocabCard
          kind="location"
          title="Locations"
          description="Site or plant. First token of the code, e.g. HOL."
          rows={vocab?.locations}
        />
        <VocabCard
          kind="discipline"
          title="Disciplines"
          description="Owning function. Second token, e.g. OPS."
          rows={vocab?.disciplines}
        />
      </div>
    </div>
  )
}

function VocabCard({
  kind,
  title,
  description,
  rows,
}: {
  kind: Kind
  title: string
  description: string
  rows: { _id: string; code: string; label: string }[] | undefined
}) {
  const add = useMutation(api.naming.addVocabulary)
  const remove = useMutation(api.naming.removeVocabulary)
  const [code, setCode] = useState("")
  const [label, setLabel] = useState("")
  const [busy, setBusy] = useState(false)

  async function onAdd() {
    if (!code.trim()) return
    setBusy(true)
    try {
      await add({ kind, code: code.trim(), label: label.trim() || code.trim() })
      setCode("")
      setLabel("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onRemove(id: string) {
    try {
      await remove({ kind, id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="divide-y rounded-md border">
          {rows === undefined ? (
            <div className="px-3 py-4 text-xs text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground">
              None yet — add one below.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r._id}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="w-16 font-mono font-medium">{r.code}</span>
                <span className="flex-1 truncate text-muted-foreground">
                  {r.label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => void onRemove(r._id)}
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="w-24 space-y-1">
            <Label className="text-[11px]">Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="HOL"
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter") void onAdd()
              }}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-[11px]">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Holliday"
              onKeyDown={(e) => {
                if (e.key === "Enter") void onAdd()
              }}
            />
          </div>
          <Button size="sm" onClick={() => void onAdd()} disabled={busy} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
