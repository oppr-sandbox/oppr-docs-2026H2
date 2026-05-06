// NamingCodeField
//
// Generates and validates a naming code in the format
//   {SITE}-{DEPT}-{TYPE}-{NNNN}
// e.g. HOL-OPS-SOP-0007.
//
// - Auto-suggests the next sequence by scanning existing documents of the same
//   `type`. The TYPE token differs from `DocumentType`: work_instruction → WI,
//   lmra → LMRA.
// - User may override the value freely.
// - Validates uniqueness against the live document list and surfaces a
//   short error message inline.

import { useEffect, useMemo, useRef } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { DocumentType } from "@/types"

const SITE = "HOL"
const DEPT = "OPS"

const TYPE_TOKEN: Record<DocumentType, string> = {
  sop: "SOP",
  manual: "MAN",
  work_instruction: "WI",
  lmra: "LMRA",
}

interface NamingCodeFieldProps {
  type: DocumentType
  value: string
  onChange: (v: string) => void
  /** When true, the field is read-only. */
  disabled?: boolean
  /** Document id to ignore when checking uniqueness (own row, on edit). */
  ignoreId?: string
  label?: string
}

export function suggestNextCode(
  type: DocumentType,
  existingCodes: string[],
): string {
  const token = TYPE_TOKEN[type] ?? "DOC"
  const prefix = `${SITE}-${DEPT}-${token}-`
  let max = 0
  for (const code of existingCodes) {
    if (!code.startsWith(prefix)) continue
    const trailing = code.slice(prefix.length)
    const n = parseInt(trailing, 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  const next = (max + 1).toString().padStart(4, "0")
  return `${prefix}${next}`
}

const FORMAT_RE = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-\d{4}$/

export function NamingCodeField({
  type,
  value,
  onChange,
  disabled,
  ignoreId,
  label = "Naming code",
}: NamingCodeFieldProps) {
  const allDocs = useQuery(api.documents.list, {}) ?? []

  // Track the last "auto" value we set so we know whether to refresh on type change.
  const lastAutoRef = useRef<string | null>(null)

  // On first mount with empty value, OR when type changes and the field still
  // holds our previously-suggested value, push a fresh suggestion.
  useEffect(() => {
    if (disabled) return
    const codes = allDocs.map((d) => d.namingCode)
    const next = suggestNextCode(type, codes)
    const isEmpty = !value
    const isStillAuto = lastAutoRef.current && value === lastAutoRef.current
    if (isEmpty || isStillAuto) {
      lastAutoRef.current = next
      if (next !== value) onChange(next)
    }
    // We intentionally don't depend on `value` to avoid a feedback loop;
    // the user's manual edits stay sticky.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, allDocs, disabled])

  const validation = useMemo(() => {
    if (!value) return { ok: false, message: "Required" }
    if (!FORMAT_RE.test(value))
      return { ok: false, message: "Format: SITE-DEPT-TYPE-NNNN" }
    const clash = allDocs.find(
      (d) => d.namingCode === value && d._id !== ignoreId,
    )
    if (clash) return { ok: false, message: "Already used by another document" }
    return { ok: true, message: "" }
  }, [value, allDocs, ignoreId])

  function regenerate() {
    const codes = allDocs.map((d) => d.namingCode)
    const next = suggestNextCode(type, codes)
    lastAutoRef.current = next
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="naming-code" className="text-xs font-medium">
          {label}
        </Label>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={regenerate}
            title="Regenerate from latest sequence"
          >
            <RefreshCw className="h-3 w-3" />
            Auto
          </Button>
        )}
      </div>
      <Input
        id="naming-code"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        disabled={disabled}
        spellCheck={false}
        className="font-mono text-sm"
        placeholder="HOL-OPS-SOP-0001"
      />
      {!validation.ok && value && (
        <p className="text-xs text-destructive">{validation.message}</p>
      )}
    </div>
  )
}
