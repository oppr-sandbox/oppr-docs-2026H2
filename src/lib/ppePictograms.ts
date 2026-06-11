// Self-drawn PPE pictograms in the ISO 7010 mandatory style (blue disc, white
// symbol). We draw our own simplified set rather than using ISO/shop artwork so
// the images are bundled, sanitised, license-clean, and inline into the PDF for
// free. Each entry returns the inner markup of a 0 0 100 100 viewBox; ppeSvg()
// wraps it with the blue disc.
//
// Symbols are schematic, not photorealistic — recognisable silhouettes that
// read at chip size and at full sign size. Keep new glyphs to white fills/
// strokes on the blue disc for consistency.

const BLUE = "#00529b"

// White head silhouette reused by several worn-PPE glyphs.
const HEAD = `<circle cx="50" cy="46" r="15" fill="#fff"/><path d="M30 78c0-12 9-20 20-20s20 8 20 20z" fill="#fff"/>`

const GLYPHS: Record<string, string> = {
  // M014 — hard hat
  hard_hat: `${HEAD}<path d="M28 44c0-13 10-22 22-22s22 9 22 22z" fill="${BLUE}"/><path d="M26 44c0-14 11-24 24-24s24 10 24 24v3H26z" fill="#fff"/><rect x="46" y="14" width="8" height="8" rx="2" fill="#fff"/>`,
  // M004 — eye protection (goggles)
  eye_protection: `${HEAD}<path d="M28 42c0-5 5-8 22-8s22 3 22 8v6c0 6-7 8-12 5-3-2-7-2-10 0-5 3-12 1-12-5z" fill="${BLUE}"/><path d="M30 42c0-4 6-6 20-6s20 2 20 6v5c0 5-6 6-10 3-3-2-7-2-10 0-4 3-10 2-10-3z" fill="#fff"/>`,
  // M003 — hearing protection (earmuffs)
  hearing: `${HEAD}<path d="M28 30c0-2 2-4 4-4s4 2 4 4v2" fill="none" stroke="#fff" stroke-width="4"/><path d="M64 30c0-2 2-4 4-4s4 2 4 4v2" fill="none" stroke="#fff" stroke-width="4"/><path d="M30 28c4-8 32-8 36 0" fill="none" stroke="#fff" stroke-width="4"/><rect x="26" y="38" width="11" height="20" rx="5" fill="#fff"/><rect x="63" y="38" width="11" height="20" rx="5" fill="#fff"/>`,
  // M008 — safety footwear (boot)
  footwear: `<path d="M34 26h12v30l28 12v14H34z" fill="#fff"/><path d="M34 76h40v6H30c-2 0-4-2-4-4v-2z" fill="#fff"/><path d="M46 50l16 7" stroke="${BLUE}" stroke-width="3"/>`,
  // M009 — safety gloves (pair of mittens)
  gloves: `<g fill="#fff"><path d="M28 44c0-3 3-4 5-4 0-4 6-4 6 0v2c0-3 5-3 5 0v18c0 8-5 14-12 14s-10-6-10-12c0-3 2-5 2-8z"/><path d="M72 44c0-3-3-4-5-4 0-4-6-4-6 0v2c0-3-5-3-5 0v18c0 8 5 14 12 14s10-6 10-12c0-3-2-5-2-8z"/></g>`,
  // M010 — protective clothing (coverall)
  protective_clothing: `<path d="M38 24h24l10 10-7 8-3-3v37H38V39l-3 3-7-8z" fill="#fff"/><path d="M50 24v50" stroke="${BLUE}" stroke-width="2"/>`,
  // M011 — wash hands (hands + drops)
  wash_hands: `<g fill="#fff"><path d="M30 58c0-4 3-5 6-5 0-5 7-5 7 0 0-4 6-4 6 0 0-4 6-4 6 0v8c0 9-6 15-15 15s-16-7-16-16c0-3 2-4 2-7z"/></g><g fill="#fff"><circle cx="40" cy="30" r="3"/><circle cx="52" cy="26" r="3"/><circle cx="62" cy="32" r="3"/></g>`,
  // M013 — face shield (head + visor)
  face_shield: `${HEAD}<path d="M27 36c4-7 42-7 46 0v16c0 4-4 6-8 6H35c-4 0-8-2-8-6z" fill="${BLUE}"/><path d="M29 37c4-6 38-6 42 0v15c0 3-3 5-7 5H36c-4 0-7-2-7-5z" fill="#fff" opacity="0.85"/>`,
  // M015 — hi-vis vest
  hi_vis: `<path d="M36 24l14 6 14-6 8 8-6 6v38H34V38l-6-6z" fill="#fff"/><path d="M44 33v33M56 33v33" stroke="${BLUE}" stroke-width="3"/><rect x="40" y="50" width="20" height="5" fill="${BLUE}"/>`,
  // M016 — face mask (head + simple mask)
  face_mask: `${HEAD}<path d="M30 46c6-3 34-3 40 0v8c0 6-7 12-20 12s-20-6-20-12z" fill="${BLUE}"/><path d="M32 47c5-2 31-2 36 0v6c0 5-6 10-18 10s-18-5-18-10z" fill="#fff"/><path d="M34 52h32" stroke="${BLUE}" stroke-width="2"/>`,
  // M017 — respirator (head + mask + canister)
  respirator: `${HEAD}<path d="M30 46c6-3 34-3 40 0v8c0 7-8 13-20 13s-20-6-20-13z" fill="${BLUE}"/><path d="M33 47c5-2 29-2 34 0v6c0 6-7 11-17 11s-17-5-17-11z" fill="#fff"/><rect x="58" y="56" width="12" height="12" rx="2" fill="#fff"/>`,
  // M018 — fall protection harness (body + straps + D-ring)
  harness: `${HEAD}<rect x="40" y="58" width="20" height="22" rx="3" fill="#fff"/><path d="M42 58l16 22M58 58L42 80" stroke="${BLUE}" stroke-width="3"/><circle cx="50" cy="58" r="4" fill="${BLUE}"/><circle cx="50" cy="56" r="3" fill="none" stroke="#fff" stroke-width="2"/>`,
  // M002 — read instructions (open book)
  read_instructions: `<path d="M22 32c10-5 22-5 28 2 6-7 18-7 28-2v36c-10-5-22-5-28 2-6-7-18-7-28-2z" fill="#fff"/><path d="M50 34v36" stroke="${BLUE}" stroke-width="3"/><path d="M28 40h14M28 48h14M58 40h14M58 48h14" stroke="${BLUE}" stroke-width="2"/>`,
  // M012 — use handrail (stairs + rail)
  handrail: `<path d="M24 74h12v-12h12v-12h12v-12h16v36z" fill="#fff"/><path d="M22 60l40-34" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="60" r="4" fill="#fff"/><circle cx="62" cy="26" r="4" fill="#fff"/>`,
  // M026 — hair net
  hair_net: `${HEAD}<path d="M30 42c0-12 9-20 20-20s20 8 20 20" fill="#fff"/><path d="M30 42c0-12 9-20 20-20s20 8 20 20" fill="none" stroke="${BLUE}" stroke-width="1.5"/><g stroke="${BLUE}" stroke-width="1.2"><path d="M36 24l-2 18M44 21l-1 21M50 20v22M56 21l1 21M64 24l2 18M31 32h38M30 40h40"/></g>`,
  // M048 — gas detector (handheld device)
  gas_detector: `<rect x="38" y="28" width="24" height="34" rx="4" fill="#fff"/><rect x="42" y="32" width="16" height="12" rx="2" fill="${BLUE}"/><circle cx="46" cy="52" r="3" fill="${BLUE}"/><circle cx="54" cy="52" r="3" fill="${BLUE}"/><rect x="46" y="62" width="8" height="14" rx="2" fill="#fff"/><path d="M62 34c6 0 10 4 10 10" fill="none" stroke="#fff" stroke-width="3"/>`,
  // M053 — life jacket
  life_jacket: `<path d="M38 24h24v10l8 4v30H58V44h-4v24h-8V44h-4v24H30V38l8-4z" fill="#fff"/><rect x="44" y="50" width="12" height="14" fill="${BLUE}"/>`,
  // M059 — lab coat
  lab_coat: `<path d="M40 24h20l10 8-6 6v38H36V38l-6-6z" fill="#fff"/><path d="M50 24v52" stroke="${BLUE}" stroke-width="2"/><path d="M50 30l-6 6 6 6 6-6z" fill="${BLUE}"/><rect x="40" y="58" width="6" height="10" fill="${BLUE}"/>`,
  // M001 — general mandatory (plain disc, faint ring for visibility at chip size)
  general_mandatory: `<circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="3" opacity="0.5"/>`,
  // Eye + ear combined
  eye_ear: `${HEAD}<rect x="24" y="40" width="9" height="16" rx="4" fill="#fff"/><rect x="67" y="40" width="9" height="16" rx="4" fill="#fff"/><path d="M33 44c4-6 30-6 34 0v4c0 4-5 5-9 3-3-2-7-2-10 0-4 2-9 1-9-3z" fill="#fff"/>`,
}

export const PPE_PICTOGRAM_IDS = Object.keys(GLYPHS)

export function hasPictogram(id: string): boolean {
  return id in GLYPHS
}

// Full standalone SVG markup for a pictogram. `size` sets width/height in px.
export function ppeSvg(id: string, size = 100): string {
  const glyph = GLYPHS[id] ?? GLYPHS.general_mandatory
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img"><circle cx="50" cy="50" r="49" fill="${BLUE}"/>${glyph}</svg>`
}

// Data-URL form for <img src> and PDF inlining (self-contained, no fetch).
export function ppeDataUrl(id: string, size = 100): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(ppeSvg(id, size))}`
}
