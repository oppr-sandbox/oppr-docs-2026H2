// Hero block at the top of the read view — promotes everything an operator
// or engineer needs at-a-glance: title, naming code, type/status badges,
// version, owner, last update, asset chips, tags. PPE chips are pulled from
// the document body's first PPE node so the operator can see required PPE
// without scrolling.

import { format } from "date-fns"
import { useLocation } from "wouter"
import {
  Factory,
  HardHat,
  Glasses,
  Footprints,
  Shirt,
  Shield,
  Wind,
  Ear,
  User as UserIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./StatusBadge"
import { TypeBadge } from "./TypeBadge"
import type { Asset, Doc, User } from "@/types"
import { cn } from "@/lib/utils"

type PpeItem =
  | "hardhat"
  | "glasses"
  | "gloves"
  | "boots"
  | "hi-vis"
  | "ear-pro"
  | "mask"
  | "dust-mask"

const PPE_LABEL: Record<PpeItem, string> = {
  hardhat: "Hard hat",
  glasses: "Safety glasses",
  gloves: "Gloves",
  boots: "Safety boots",
  "hi-vis": "Hi-vis",
  "ear-pro": "Ear pro",
  mask: "Respirator",
  "dust-mask": "Dust mask",
}

const PPE_ICON: Record<PpeItem, typeof HardHat> = {
  hardhat: HardHat,
  glasses: Glasses,
  gloves: Shield,
  boots: Footprints,
  "hi-vis": Shirt,
  "ear-pro": Ear,
  mask: Wind,
  "dust-mask": Wind,
}

interface DocumentHeroProps {
  doc: Doc
  assets: Asset[]
  owner: User | null
  versionNumber: number
  ppeItems?: PpeItem[]
  /** Lifecycle role display names, resolved server-side. */
  roles?: {
    author: string | null
    reviewer: string | null
    approver: string | null
  }
  /** Override the status badge — the reader shows the live edition's status. */
  statusOverride?: Doc["status"]
  className?: string
}

export function DocumentHero({
  doc,
  assets,
  owner,
  versionNumber,
  ppeItems = [],
  roles,
  statusOverride,
  className,
}: DocumentHeroProps) {
  const [, navigate] = useLocation()
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-foreground">
              {doc.naming_code || "Pre-draft"}
            </code>
            <TypeBadge type={doc.type} />
            <StatusBadge status={statusOverride ?? doc.status} />
            <Badge variant="outline" className="text-xs">
              v{versionNumber}
            </Badge>
          </div>
          <h1 className="text-xl font-semibold leading-tight">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" />
              <span>{roles?.author ?? owner?.name ?? "Unknown author"}</span>
            </div>
            <span>Updated {formatDate(doc.updated_at)}</span>
            <span>Created {formatDate(doc.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
          <Section label="Linked assets">
            {assets.length === 0 ? (
              <span className="text-xs text-muted-foreground">None</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {assets.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => navigate(`/assets/${a.id}`)}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 font-mono text-[11px] hover:border-primary/50 hover:bg-muted/70"
                  >
                    <Factory className="h-3 w-3" />
                    {a.code}
                  </button>
                ))}
              </div>
            )}
          </Section>
          <Section label="Review & approval">
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Reviewer</span>
                <span className="truncate">{roles?.reviewer ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Approver</span>
                <span className="truncate">{roles?.approver ?? "—"}</span>
              </div>
            </div>
          </Section>
          <Section label="Required PPE">
            {ppeItems.length === 0 ? (
              <span className="text-xs text-muted-foreground">N/A</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {ppeItems.map((it) => {
                  const Icon = PPE_ICON[it]
                  return (
                    <span
                      key={it}
                      className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100"
                    >
                      <Icon className="h-3 w-3" />
                      {PPE_LABEL[it]}
                    </span>
                  )
                })}
              </div>
            )}
          </Section>
        </div>
    </div>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy")
  } catch {
    return iso
  }
}

/**
 * Walk the TipTap body looking for the first `ppe` node and return its items
 * array, parsed from the comma-separated `data-items` attr. Returns []
 * for non-TipTap bodies or when no PPE node is present.
 */
export function extractPpeItems(body: unknown): PpeItem[] {
  if (!body || typeof body !== "object") return []
  const root = body as { type?: string; content?: unknown[]; attrs?: Record<string, unknown> }
  if (root.type !== "doc") return []
  const stack: unknown[] = [...(root.content ?? [])]
  while (stack.length) {
    const node = stack.shift() as
      | { type?: string; content?: unknown[]; attrs?: Record<string, unknown> }
      | undefined
    if (!node) continue
    if (node.type === "ppe") {
      const items = (node.attrs?.items as string | undefined) ?? ""
      return items
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is PpeItem =>
          (
            ["hardhat", "glasses", "gloves", "boots", "hi-vis", "ear-pro", "mask", "dust-mask"] as string[]
          ).includes(s),
        )
    }
    if (node.content) stack.push(...node.content)
  }
  return []
}
