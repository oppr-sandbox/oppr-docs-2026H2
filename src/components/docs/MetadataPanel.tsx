// MetadataPanel
//
// Right-rail form for document metadata: title, type, owner, tags, assets,
// and naming code. Driven by a controlled `value`/`onChange` API so callers
// (DocumentNewPage, DocumentEditPage) own the form state.
//
// Validation rules are exposed as a reusable Zod schema (`metadataSchema`)
// and a thin `validateMetadata()` helper. Pages use `validateMetadata` before
// submit; the panel itself surfaces inline errors as the user edits.

import { useEffect, useState } from "react"
import { z } from "zod"
import type { DocumentType } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { AssetMultiSelect } from "./AssetMultiSelect"
import { NamingCodeField } from "./NamingCodeField"
import { X } from "lucide-react"

export interface MetadataValue {
  title: string
  type: DocumentType
  ownerId: string
  tags: string[]
  assetIds: string[]
  namingCode: string
}

export const metadataSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  type: z.enum(["sop", "manual", "work_instruction", "lmra"]),
  ownerId: z.string().default(""),
  tags: z.array(z.string().trim().min(1)).default([]),
  assetIds: z.array(z.string().min(1)).default([]),
  namingCode: z
    .string()
    .trim()
    .regex(
      /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-\d{4}$/,
      "Format: SITE-DEPT-TYPE-NNNN",
    ),
})

export interface ValidationResult {
  ok: boolean
  errors: Record<string, string>
}

export function validateMetadata(value: MetadataValue): ValidationResult {
  const result = metadataSchema.safeParse(value)
  if (result.success) return { ok: true, errors: {} }
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join(".")
    if (!errors[path]) errors[path] = issue.message
  }
  return { ok: false, errors }
}

export const TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "sop", label: "SOP" },
  { value: "manual", label: "Manual" },
  { value: "work_instruction", label: "Work instruction" },
  { value: "lmra", label: "LMRA" },
]

interface MetadataPanelProps {
  value: MetadataValue
  onChange: (next: MetadataValue) => void
  /** Optional — disables the naming-code field on edit. */
  lockNamingCode?: boolean
  /** Document id to ignore when checking naming-code uniqueness (own row). */
  ignoreId?: string
  /** Inline error messages keyed by field path. */
  errors?: Record<string, string>
}

export function MetadataPanel({
  value,
  onChange,
  lockNamingCode,
  ignoreId,
  errors = {},
}: MetadataPanelProps) {
  const me = useQuery(api.users.me)

  const [tagDraft, setTagDraft] = useState("")

  // Patch helper.
  function patch(p: Partial<MetadataValue>) {
    onChange({ ...value, ...p })
  }

  // When type changes, the NamingCodeField may auto-update; that flows back
  // through `onChange` from the field itself. Nothing to do here.
  useEffect(() => {
    // no-op; documented for clarity
  }, [value.type])

  function commitTagDraft() {
    const cleaned = tagDraft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (!cleaned.length) return
    const merged = Array.from(new Set([...value.tags, ...cleaned]))
    patch({ tags: merged })
    setTagDraft("")
  }

  function removeTag(tag: string) {
    patch({ tags: value.tags.filter((t) => t !== tag) })
  }

  return (
    <aside className="space-y-5 rounded-lg border bg-card p-4 text-card-foreground">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold">Metadata</h2>
        <p className="text-xs text-muted-foreground">
          Set how this document is filed and discovered.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="doc-title" className="text-xs font-medium">
          Title
        </Label>
        <Input
          id="doc-title"
          value={value.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Daily handover SOP"
        />
        {errors["title"] && (
          <p className="text-xs text-destructive">{errors["title"]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Type</Label>
        <Select
          value={value.type}
          onValueChange={(v) => patch({ type: v as DocumentType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Owner</Label>
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          {me ? (
            <div className="flex items-center justify-between">
              <span>{me.name ?? me.email ?? "You"}</span>
              <span className="text-xs uppercase text-muted-foreground">
                signed in
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">…</span>
          )}
        </div>
      </div>

      <NamingCodeField
        type={value.type}
        value={value.namingCode}
        onChange={(v) => patch({ namingCode: v })}
        disabled={lockNamingCode}
        ignoreId={ignoreId}
      />

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Tags</Label>
        {value.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.tags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="gap-1 pr-1 text-xs"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-muted-foreground/20"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              commitTagDraft()
            }
          }}
          onBlur={commitTagDraft}
          placeholder="quality, startup, …"
        />
        <p className="text-[11px] text-muted-foreground">
          Comma or Enter to add.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Linked assets</Label>
        <AssetMultiSelect
          value={value.assetIds}
          onChange={(ids) => patch({ assetIds: ids })}
        />
      </div>
    </aside>
  )
}
