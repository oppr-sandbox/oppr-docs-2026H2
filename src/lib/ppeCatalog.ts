// Live PPE catalog hook for the editor and read views. All consumers share one
// Convex subscription. Resolves any stored slug (including deactivated or
// deleted ones) so a document keeps rendering its PPE; the picker uses only the
// active set. Labels follow the configured NL/EN language. Pictograms resolve
// to the real ISO 7010 image stored in Convex, falling back to the bundled SVG.
// Falls back to the factory eight before the table is seeded.

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ppeDataUrl } from "@/lib/ppePictograms"

export interface PpeMeta {
  slug: string
  label: string
  description: string | null
  pictogramId: string
  /** Real ISO 7010 image URL from Convex storage; null → use the SVG. */
  imageUrl: string | null
  active: boolean
  builtIn: boolean
}

// Source for a pictogram <img>: prefer the stored ISO image, else the SVG.
export function ppeImageSrc(meta: { imageUrl?: string | null; pictogramId: string }): string {
  return meta.imageUrl || ppeDataUrl(meta.pictogramId)
}

// The original eight ids → pictogram + label, so chips render pre-seed and any
// slug that vanished from the table still resolves to something sensible.
const FALLBACK: Record<string, PpeMeta> = {
  hardhat: { slug: "hardhat", label: "Hard hat", description: null, pictogramId: "hard_hat", imageUrl: null, active: true, builtIn: true },
  glasses: { slug: "glasses", label: "Safety glasses", description: null, pictogramId: "eye_protection", imageUrl: null, active: true, builtIn: true },
  gloves: { slug: "gloves", label: "Gloves", description: null, pictogramId: "gloves", imageUrl: null, active: true, builtIn: true },
  boots: { slug: "boots", label: "Safety boots", description: null, pictogramId: "footwear", imageUrl: null, active: true, builtIn: true },
  "hi-vis": { slug: "hi-vis", label: "Hi-vis vest", description: null, pictogramId: "hi_vis", imageUrl: null, active: true, builtIn: true },
  "ear-pro": { slug: "ear-pro", label: "Ear protection", description: null, pictogramId: "hearing", imageUrl: null, active: true, builtIn: true },
  mask: { slug: "mask", label: "Respirator", description: null, pictogramId: "respirator", imageUrl: null, active: true, builtIn: true },
  "dust-mask": { slug: "dust-mask", label: "Dust mask", description: null, pictogramId: "face_mask", imageUrl: null, active: true, builtIn: true },
}

export function usePpeCatalog(): {
  items: PpeMeta[]
  active: PpeMeta[]
  language: "en" | "nl"
  resolve: (slug: string) => PpeMeta
} {
  const rows = useQuery(api.ppe.list)
  const language = useQuery(api.ppe.getLanguage) ?? "en"
  return useMemo(() => {
    const pickLabel = (r: {
      label: string
      labelEn?: string | null
      labelNl?: string | null
    }): string =>
      (language === "nl" ? r.labelNl || r.label : r.labelEn || r.label) || r.label
    const pickDescription = (r: {
      description: string | null
      descriptionNl?: string | null
    }): string | null =>
      (language === "nl" ? r.descriptionNl || r.description : r.description) ??
      null
    const items: PpeMeta[] =
      rows && rows.length > 0
        ? rows.map((r) => ({
            slug: r.slug,
            label: pickLabel(r),
            description: pickDescription(r),
            pictogramId: r.pictogramId,
            imageUrl: r.imageUrl ?? null,
            active: r.active,
            builtIn: r.builtIn,
          }))
        : Object.values(FALLBACK)
    const bySlug = new Map(items.map((p) => [p.slug, p]))
    return {
      items,
      active: items.filter((p) => p.active),
      language,
      resolve: (slug: string) =>
        bySlug.get(slug) ??
        FALLBACK[slug] ?? {
          slug,
          label: slug,
          description: null,
          pictogramId: "general_mandatory",
          imageUrl: null,
          active: false,
          builtIn: false,
        },
    }
  }, [rows, language])
}
