// Live PPE catalog hook for the editor and read views. All consumers share one
// Convex subscription. Resolves any stored slug (including deactivated or
// deleted ones) so a document keeps rendering its PPE; the picker uses only the
// active set. Falls back to the factory eight before the table is seeded.

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export interface PpeMeta {
  slug: string
  label: string
  description: string | null
  pictogramId: string
  active: boolean
  builtIn: boolean
}

// The original eight ids → pictogram + label, so chips render pre-seed and any
// slug that vanished from the table still resolves to something sensible.
const FALLBACK: Record<string, PpeMeta> = {
  hardhat: { slug: "hardhat", label: "Hard hat", description: null, pictogramId: "hard_hat", active: true, builtIn: true },
  glasses: { slug: "glasses", label: "Safety glasses", description: null, pictogramId: "eye_protection", active: true, builtIn: true },
  gloves: { slug: "gloves", label: "Gloves", description: null, pictogramId: "gloves", active: true, builtIn: true },
  boots: { slug: "boots", label: "Safety boots", description: null, pictogramId: "footwear", active: true, builtIn: true },
  "hi-vis": { slug: "hi-vis", label: "Hi-vis vest", description: null, pictogramId: "hi_vis", active: true, builtIn: true },
  "ear-pro": { slug: "ear-pro", label: "Ear protection", description: null, pictogramId: "hearing", active: true, builtIn: true },
  mask: { slug: "mask", label: "Respirator", description: null, pictogramId: "respirator", active: true, builtIn: true },
  "dust-mask": { slug: "dust-mask", label: "Dust mask", description: null, pictogramId: "face_mask", active: true, builtIn: true },
}

export function usePpeCatalog(): {
  items: PpeMeta[]
  active: PpeMeta[]
  resolve: (slug: string) => PpeMeta
} {
  const rows = useQuery(api.ppe.list)
  return useMemo(() => {
    const items: PpeMeta[] =
      rows && rows.length > 0
        ? rows.map((r) => ({
            slug: r.slug,
            label: r.label,
            description: r.description,
            pictogramId: r.pictogramId,
            active: r.active,
            builtIn: r.builtIn,
          }))
        : Object.values(FALLBACK)
    const bySlug = new Map(items.map((p) => [p.slug, p]))
    return {
      items,
      active: items.filter((p) => p.active),
      resolve: (slug: string) =>
        bySlug.get(slug) ??
        FALLBACK[slug] ?? {
          slug,
          label: slug,
          description: null,
          pictogramId: "general_mandatory",
          active: false,
          builtIn: false,
        },
    }
  }, [rows])
}
