// Seed data for the Oppr DOCS showcase.
//
// Deterministic: all IDs are stable string slugs (`user-engineer`, `doc-1`, etc.)
// rather than UUIDs, so the seed produces the same dataset every time.
// Timestamps are baked in so reset() always returns identical fixtures.
//
// Document bodies are factored out into seedDocs.ts to keep this file focused
// on the relational inserts. The Drying Oven 4 PDF is generated at seed time
// via pdf-lib (seedPdf.ts) so the demo has at least one genuine PDF to test
// the reader, page deep-linking, and RAG-over-PDF chunking.

import type { Database } from "sql.js"
import {
  type JSONNode,
  SOP_HANDOVER_BODY,
  SOP_MIXER_BODY,
  MAN_MILL_BODY,
  WI_PRESS_BODY,
  LMRA_RECEPTION_BODY,
  MAN_KILN_CHARGING_BODY,
  SOP_EVACUATION_BODY,
  SOP_PREKILN_BODY,
  LMRA_HOTWORK_BODY,
  WI_STICKER_BODY,
  SOP_END_OF_SHIFT_BODY,
} from "./seedDocs"
import { buildDryingOvenPdf } from "./seedPdf"

// --- Versioning -------------------------------------------------------------

/**
 * Bump this whenever the seed changes in a way the operator should be told
 * about (renamed assets, new docs, reshuffled connections). On boot the
 * provider compares the value in the `meta` table to this constant and
 * surfaces a toast suggesting Settings → Reset demo when they diverge.
 */
export const SEED_VERSION = 2

// --- Static IDs -------------------------------------------------------------

const USER_ENGINEER = "user-engineer"
const USER_OPERATOR = "user-operator"
const USER_MANAGER = "user-manager"

export const SITE = "HOL"

export const T_CREATED = "2026-01-15T08:00:00.000Z"
export const T_UPDATED = "2026-04-22T14:30:00.000Z"
export const T_PUBLISHED = "2026-04-22T14:30:00.000Z"

// --- Asset definitions ------------------------------------------------------

export interface AssetSeed {
  id: string
  code: string
  name: string
  location: string | null
  description: string
  level: number
  floorplan: string
  is_linked: number
  linked_log_code: string | null
  linked_log_name: string | null
  linked_log_description: string | null
  pin_number: number
  pin_x: number
  pin_y: number
  logs: Array<{ code: string; name: string; description: string | null }>
}

const FLOORPLAN_PIGMENT = "Pigment Calcination Floorplan"

export const ASSETS: AssetSeed[] = [
  {
    id: "asset-extruder-8c",
    code: "RMR-101",
    name: "Raw Materials Reception Bay",
    location: "Yard — North",
    description:
      "Intake point for the four raw material streams: kaolin (China clay), sodium carbonate, sulphur, and mineral oil. Each incoming supplier batch is identified, weighed, and tagged here before transfer to the silos and dosing system upstream of the mixer.",
    level: 1,
    floorplan: FLOORPLAN_PIGMENT,
    is_linked: 1,
    linked_log_code: "HOL-OPS-LOG-0001",
    linked_log_name: "Réception matières premières",
    linked_log_description: "Saisie de l'identité du lot fournisseur à la réception.",
    pin_number: 1,
    pin_x: 11,
    pin_y: 50,
    logs: [
      {
        code: "HOL-OPS-LOG-0001",
        name: "Réception matières premières",
        description: "Saisie de l'identité du lot fournisseur à la réception.",
      },
      {
        code: "HOL-OPS-LOG-0001-1",
        name: "Contrôle pesée bascule",
        description: "Vérification du poids net contre le bon de livraison.",
      },
    ],
  },
  {
    id: "asset-shredder-2a",
    code: "FCK-102",
    name: "Feedstock Mixer",
    location: "Hall A — Line 2",
    description:
      "Continuous twin-shaft mixer that blends the dosed raw materials into a homogeneous feedstock for downstream grinding. Recipe and dosing setpoints are pulled from the active production order.",
    level: 1,
    floorplan: FLOORPLAN_PIGMENT,
    is_linked: 0,
    linked_log_code: null,
    linked_log_name: null,
    linked_log_description: null,
    pin_number: 2,
    pin_x: 28,
    pin_y: 70,
    logs: [],
  },
  {
    id: "asset-sorter-3b",
    code: "FCK-103",
    name: "Grinding Mill",
    location: "Hall B — Line 3",
    description:
      "Pendulum roller mill that reduces the mixed feedstock to the target particle size before briquetting. Mill load and outlet temperature are tracked on the HMI and fed back to the production dashboard.",
    level: 1,
    floorplan: FLOORPLAN_PIGMENT,
    is_linked: 1,
    linked_log_code: "HOL-OPS-LOG-0002",
    linked_log_name: "Surveillance broyeur",
    linked_log_description: "Charge moteur et température de sortie en continu.",
    pin_number: 3,
    pin_x: 36,
    pin_y: 70,
    logs: [
      {
        code: "HOL-OPS-LOG-0002",
        name: "Surveillance broyeur",
        description: "Charge moteur et température de sortie en continu.",
      },
    ],
  },
  {
    id: "asset-intake-1",
    code: "FRT-201",
    name: "Briquette Hydraulic Press",
    location: "Hall B — Line 4",
    description:
      "Hydraulic ring-die press that compresses the milled mixture into briquettes. Press tonnage, die wear, and reject rate are the critical parameters captured every shift.",
    level: 1,
    floorplan: FLOORPLAN_PIGMENT,
    is_linked: 1,
    linked_log_code: "HOL-OPS-LOG-0002-1",
    linked_log_name: "Presse à briquettes",
    linked_log_description: "Contrôle qualité des briquettes en sortie de presse.",
    pin_number: 4,
    pin_x: 44,
    pin_y: 70,
    logs: [
      {
        code: "HOL-OPS-LOG-0002-1",
        name: "Presse à briquettes",
        description: "Contrôle qualité des briquettes en sortie de presse.",
      },
      {
        code: "HOL-OPS-LOG-0002-2",
        name: "Vérification matrice presse",
        description: "Inspection de l'usure de la matrice et du tonnage.",
      },
    ],
  },
  {
    id: "asset-oven-4",
    code: "FRT-202",
    name: "Pre-Kiln Briquette Inspection",
    location: "Hall C — Line 4",
    description:
      "Inspection station where briquettes are visually graded and sampled for moisture before charging to the kiln. Off-spec briquettes are diverted back to the mill feed.",
    level: 1,
    floorplan: FLOORPLAN_PIGMENT,
    is_linked: 1,
    linked_log_code: "HOL-OPS-LOG-0003",
    linked_log_name: "Inspection pré-four",
    linked_log_description: "Vérification visuelle et humidité avant chargement four.",
    pin_number: 5,
    pin_x: 56,
    pin_y: 70,
    logs: [
      {
        code: "HOL-OPS-LOG-0003",
        name: "Inspection pré-four",
        description: "Vérification visuelle et humidité avant chargement four.",
      },
    ],
  },
  {
    id: "asset-conveyor-5",
    code: "STR-301",
    name: "Kiln Charging & Stacking",
    location: "Hall C — Kiln Bay",
    description:
      "Charging deck where graded briquettes are stacked into setters and fed to the rotary kiln. Stacking pattern and charge weight are recorded against the active firing schedule.",
    level: 1,
    floorplan: FLOORPLAN_PIGMENT,
    is_linked: 0,
    linked_log_code: null,
    linked_log_name: null,
    linked_log_description: null,
    pin_number: 6,
    pin_x: 50,
    pin_y: 25,
    logs: [],
  },
]

// --- Log definitions --------------------------------------------------------

export interface LogSeed {
  id: string
  name: string
  type: string
}

export const LOGS: LogSeed[] = [
  { id: "log-quality-extruder", name: "Quality check — Mixer", type: "quality" },
  { id: "log-override-sorter", name: "Press reject capture", type: "override" },
  { id: "log-handover-daily", name: "Daily handover", type: "handover" },
  { id: "log-maintenance-weekly", name: "Maintenance round — weekly", type: "maintenance" },
]

// --- Document seeds ---------------------------------------------------------

export interface DocSeed {
  id: string
  naming_code: string
  title: string
  type: "sop" | "manual" | "work_instruction" | "lmra"
  status: "draft" | "in_review" | "published" | "archived"
  owner_id: string
  tags: string[]
  body_kind: "tiptap" | "pdf"
  body_json?: JSONNode
  pdf_blob_id?: string
  asset_ids: string[]
}

export const DOCUMENTS: DocSeed[] = [
  {
    id: "doc-1",
    naming_code: "HOL-OPS-SOP-0001",
    title: "Daily handover SOP — Pigment Line",
    type: "sop",
    status: "published",
    owner_id: USER_ENGINEER,
    tags: ["handover", "shift", "operations"],
    body_kind: "tiptap",
    body_json: SOP_HANDOVER_BODY,
    asset_ids: [
      "asset-extruder-8c",
      "asset-shredder-2a",
      "asset-sorter-3b",
      "asset-intake-1",
      "asset-oven-4",
      "asset-conveyor-5",
    ],
  },
  {
    id: "doc-2",
    naming_code: "HOL-OPS-SOP-0002",
    title: "Feedstock Mixer (FCK-102) startup SOP",
    type: "sop",
    status: "published",
    owner_id: USER_ENGINEER,
    tags: ["mixer", "startup", "quality"],
    body_kind: "tiptap",
    body_json: SOP_MIXER_BODY,
    asset_ids: ["asset-shredder-2a"],
  },
  {
    id: "doc-3",
    naming_code: "HOL-OPS-MAN-0001",
    title: "Grinding Mill (FCK-103) operating manual",
    type: "manual",
    status: "published",
    owner_id: USER_ENGINEER,
    tags: ["mill", "maintenance", "vendor"],
    body_kind: "tiptap",
    body_json: MAN_MILL_BODY,
    asset_ids: ["asset-sorter-3b"],
  },
  {
    id: "doc-4",
    naming_code: "HOL-OPS-WI-0001",
    title: "Briquette Press (FRT-201) reject capture",
    type: "work_instruction",
    status: "in_review",
    owner_id: USER_OPERATOR,
    tags: ["press", "reject", "qa"],
    body_kind: "tiptap",
    body_json: WI_PRESS_BODY,
    asset_ids: ["asset-intake-1"],
  },
  {
    id: "doc-5",
    naming_code: "HOL-OPS-LMRA-0001",
    title: "Raw Materials Reception (RMR-101) LMRA",
    type: "lmra",
    status: "published",
    owner_id: USER_OPERATOR,
    tags: ["lmra", "safety", "reception"],
    body_kind: "tiptap",
    body_json: LMRA_RECEPTION_BODY,
    asset_ids: ["asset-extruder-8c"],
  },
  {
    id: "doc-6",
    naming_code: "HOL-OPS-MAN-0002",
    title: "Drying Oven 4 — vendor manual",
    type: "manual",
    status: "published",
    owner_id: USER_ENGINEER,
    tags: ["oven", "vendor"],
    body_kind: "pdf",
    pdf_blob_id: "pdf-1",
    asset_ids: ["asset-oven-4"],
  },
  {
    id: "doc-7",
    naming_code: "HOL-OPS-MAN-0003",
    title: "Kiln Charging (STR-301) service guide",
    type: "manual",
    status: "published",
    owner_id: USER_ENGINEER,
    tags: ["kiln", "stacking", "service"],
    body_kind: "tiptap",
    body_json: MAN_KILN_CHARGING_BODY,
    asset_ids: ["asset-conveyor-5"],
  },
  {
    id: "doc-8",
    naming_code: "HOL-OPS-SOP-0003",
    title: "Site evacuation SOP",
    type: "sop",
    status: "published",
    owner_id: USER_MANAGER,
    tags: ["safety", "site-wide", "evacuation"],
    body_kind: "tiptap",
    body_json: SOP_EVACUATION_BODY,
    asset_ids: ["asset-extruder-8c", "asset-oven-4"],
  },
  {
    id: "doc-9",
    naming_code: "HOL-OPS-SOP-0004",
    title: "Pre-Kiln Inspection (FRT-202)",
    type: "sop",
    status: "published",
    owner_id: USER_ENGINEER,
    tags: ["inspection", "quality"],
    body_kind: "tiptap",
    body_json: SOP_PREKILN_BODY,
    asset_ids: ["asset-oven-4"],
  },
  {
    id: "doc-10",
    naming_code: "HOL-OPS-LMRA-0002",
    title: "Hot work permit — site-wide",
    type: "lmra",
    status: "published",
    owner_id: USER_MANAGER,
    tags: ["lmra", "safety", "hot-work"],
    body_kind: "tiptap",
    body_json: LMRA_HOTWORK_BODY,
    asset_ids: ["asset-extruder-8c", "asset-shredder-2a", "asset-sorter-3b"],
  },
  {
    id: "doc-11",
    naming_code: "HOL-OPS-WI-0002",
    title: "Sticker OCR capture (intake)",
    type: "work_instruction",
    status: "in_review",
    owner_id: USER_OPERATOR,
    tags: ["intake", "ocr", "sticker"],
    body_kind: "tiptap",
    body_json: WI_STICKER_BODY,
    asset_ids: ["asset-extruder-8c"],
  },
  {
    id: "doc-12",
    naming_code: "HOL-OPS-SOP-0005",
    title: "End-of-shift summary (asset-agnostic)",
    type: "sop",
    status: "draft",
    owner_id: USER_OPERATOR,
    tags: ["asset-agnostic", "summary", "shift"],
    body_kind: "tiptap",
    body_json: SOP_END_OF_SHIFT_BODY,
    asset_ids: [],
  },
]

// --- Chunking helpers -------------------------------------------------------
//
// Walk the TipTap JSON tree extracting plain text per leaf block. Tables get
// one chunk per row; callouts and step lists recurse into their children;
// atom blocks (ppe / diagram / launchLog) are skipped (no useful prose).

export interface ParaChunk {
  text: string
  section: string | null
}

export function paragraphChunks(body: JSONNode): ParaChunk[] {
  const out: ParaChunk[] = []
  let currentSection: string | null = null

  function leafText(node: JSONNode): string {
    if (node.type === "text") return node.text ?? ""
    return (node.content ?? []).map(leafText).join("")
  }

  function visit(node: JSONNode) {
    switch (node.type) {
      case "heading": {
        const text = leafText(node).trim()
        if (text) currentSection = text
        return
      }
      case "paragraph": {
        const text = leafText(node).trim()
        if (text) out.push({ text, section: currentSection })
        return
      }
      case "bulletList":
      case "orderedList": {
        for (const li of node.content ?? []) visit(li)
        return
      }
      case "listItem":
      case "callout":
      case "stepItem": {
        for (const child of node.content ?? []) visit(child)
        return
      }
      case "stepList": {
        let stepNum = 0
        for (const child of node.content ?? []) {
          stepNum += 1
          // Capture step number as a soft prefix so retrieval keeps numbering.
          const start = out.length
          visit(child)
          for (let i = start; i < out.length; i++) {
            out[i] = { ...out[i], text: `Step ${stepNum}: ${out[i].text}` }
          }
        }
        return
      }
      case "table": {
        // First row is treated as headers if cells are tableHeader; subsequent
        // rows become one chunk each, prefixed with the headers for context.
        const rows = node.content ?? []
        if (!rows.length) return
        const headers: string[] = []
        const firstRow = rows[0]
        const isHeaderRow = (firstRow.content ?? []).every((c) => c.type === "tableHeader")
        if (isHeaderRow) {
          for (const cell of firstRow.content ?? []) headers.push(leafText(cell).trim())
        }
        const dataRows = isHeaderRow ? rows.slice(1) : rows
        for (const row of dataRows) {
          const cells = (row.content ?? []).map((c) => leafText(c).trim())
          const text = headers.length
            ? cells.map((v, i) => `${headers[i] ?? ""}: ${v}`).join(" · ")
            : cells.join(" · ")
          if (text) out.push({ text, section: currentSection })
        }
        return
      }
      // Atom blocks: ppe, diagram, launchLog, linkedAsset — no useful prose.
      default:
        return
    }
  }

  for (const node of body.content ?? []) visit(node)
  return out
}

// --- Per-page chunks for the seeded PDF -------------------------------------
//
// The pdf-lib output above contains four pages of plain text. We materialise
// the chunks here so RAG works against the PDF without needing to re-extract
// at runtime. Keep the text in sync with seedPdf.ts.

export const DRYING_OVEN_PAGE_CHUNKS: ParaChunk[] = [
  {
    section: "Page 1",
    text:
      "Drying Oven 4 — Vendor Manual. HOL-OPS-MAN-0002. Manufacturer: Vendor Industries B.V. Model: DryAir 4-Series. Serial: DA4-220947. Operation, weekly maintenance, and shutdown procedure for the Drying Oven 4 unit installed at the Holliday Pigment Calcination site.",
  },
  {
    section: "Page 2",
    text:
      "1. Operation. Pre-start: confirm the upstream press is producing within spec. Setpoints — inlet 110 °C (95–125), outlet 75 °C (60–85), belt speed 0.20 m/s (0.15–0.30), air flow 4,200 m³/h (3,800–4,800). Startup: pre-heat 20 minutes before charging; hold setpoints 5 minutes before opening the inlet damper.",
  },
  {
    section: "Page 3",
    text:
      "2. Maintenance. Daily: inspect belt tracking and tension; confirm bag-house dP within 1.0–1.8 kPa; drain the moisture trap. Weekly: lubricate belt bearings (Vendor part LB-220); replace bag-house filters if dP > 1.8 kPa; inspect heating elements. Monthly: calibrate inlet and outlet thermocouples; tighten belt tension to 220 N target; check insulation panels.",
  },
  {
    section: "Page 4",
    text:
      "3. Shutdown and Faults. Normal: close inlet damper, cycle belt empty 5 minutes, ramp heaters down at 5 °C/min. Emergency: press the red mushroom on the local panel — heaters trip immediately; belt continues at 50% to clear. Common faults: E-101 inlet temp low (check element fuse), E-102 outlet temp high (check air flow), E-201 belt slip (re-tension or replace), E-301 bag-house dP high (replace filters). Vendor support +31 20 555 4231; service contract SC-HOL-2026-OV4.",
  },
]

// --- Seed entry point -------------------------------------------------------

export async function seed(db: Database): Promise<void> {
  const dryingOvenPdfBytes = await buildDryingOvenPdf()

  db.run("BEGIN TRANSACTION;")
  try {
    // Users
    const userStmt = db.prepare("INSERT INTO users (id, name, role) VALUES (?, ?, ?);")
    userStmt.run([USER_ENGINEER, "Maya Chen", "engineer"])
    userStmt.run([USER_OPERATOR, "Tomás Pereira", "operator"])
    userStmt.run([USER_MANAGER, "Aïsha Bakker", "manager"])
    userStmt.free()

    // Assets
    const assetStmt = db.prepare(
      `INSERT INTO assets
        (id, code, name, site, location, qr_token, created_at,
         description, level, floorplan, is_linked,
         linked_log_code, linked_log_name, linked_log_description,
         pin_number, pin_x, pin_y)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    )
    const assetLogStmt = db.prepare(
      `INSERT INTO asset_logs (asset_id, code, name, description) VALUES (?, ?, ?, ?);`,
    )
    for (const a of ASSETS) {
      assetStmt.run([
        a.id,
        a.code,
        a.name,
        SITE,
        a.location,
        `qr-${a.code.toLowerCase()}`,
        T_CREATED,
        a.description,
        a.level,
        a.floorplan,
        a.is_linked,
        a.linked_log_code,
        a.linked_log_name,
        a.linked_log_description,
        a.pin_number,
        a.pin_x,
        a.pin_y,
      ])
      for (const l of a.logs) {
        assetLogStmt.run([a.id, l.code, l.name, l.description])
      }
    }
    assetStmt.free()
    assetLogStmt.free()

    // Logs
    const logStmt = db.prepare("INSERT INTO logs (id, name, type) VALUES (?, ?, ?);")
    for (const l of LOGS) logStmt.run([l.id, l.name, l.type])
    logStmt.free()

    // PDF blob — real generated PDF for Drying Oven 4.
    const pdfStmt = db.prepare(
      "INSERT INTO pdf_blobs (id, filename, mime, bytes, page_count) VALUES (?, ?, ?, ?, ?);",
    )
    pdfStmt.run([
      "pdf-1",
      "drying-oven-4-manual.pdf",
      "application/pdf",
      dryingOvenPdfBytes,
      4,
    ])
    pdfStmt.free()

    // Documents + versions + asset links + chunks
    const docStmt = db.prepare(
      `INSERT INTO documents (id, naming_code, title, type, status, current_version, owner_id, tags_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    )
    const versionStmt = db.prepare(
      `INSERT INTO document_versions (id, document_id, version, body_kind, body_json, pdf_blob_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
    )
    const docAssetStmt = db.prepare(
      "INSERT INTO document_assets (document_id, asset_id) VALUES (?, ?);",
    )
    const chunkStmt = db.prepare(
      `INSERT INTO chunks (id, document_id, version, seq, text, page_or_section)
       VALUES (?, ?, ?, ?, ?, ?);`,
    )

    for (const d of DOCUMENTS) {
      docStmt.run([
        d.id,
        d.naming_code,
        d.title,
        d.type,
        d.status,
        1,
        d.owner_id,
        JSON.stringify(d.tags),
        T_CREATED,
        T_UPDATED,
      ])
      versionStmt.run([
        `${d.id}-v1`,
        d.id,
        1,
        d.body_kind,
        d.body_kind === "tiptap" ? JSON.stringify(d.body_json) : null,
        d.body_kind === "pdf" ? d.pdf_blob_id ?? null : null,
        T_PUBLISHED,
      ])
      for (const aid of d.asset_ids) docAssetStmt.run([d.id, aid])

      if (d.body_kind === "tiptap" && d.body_json) {
        const chunks = paragraphChunks(d.body_json)
        chunks.forEach((c, i) => {
          chunkStmt.run([`${d.id}-chunk-${i + 1}`, d.id, 1, i + 1, c.text, c.section])
        })
      } else if (d.body_kind === "pdf" && d.id === "doc-6") {
        DRYING_OVEN_PAGE_CHUNKS.forEach((c, i) => {
          chunkStmt.run([`${d.id}-chunk-${i + 1}`, d.id, 1, i + 1, c.text, c.section])
        })
      }
    }
    docStmt.free()
    versionStmt.free()
    docAssetStmt.free()
    chunkStmt.free()

    // Log refs — point at TipTap node ids that exist in the seeded SOPs.
    const refStmt = db.prepare(
      `INSERT INTO document_log_refs (document_id, version, log_id, anchor_id) VALUES (?, ?, ?, ?);`,
    )
    refStmt.run(["doc-1", 1, "log-handover-daily", "anchor-log-handover"])
    refStmt.run(["doc-2", 1, "log-quality-extruder", "anchor-log-quality-mixer"])
    refStmt.free()

    // Stamp the seed version so the provider can detect stale IndexedDB blobs
    // belonging to operators on older versions of the demo data.
    db.run(
      "INSERT OR REPLACE INTO meta (key, value) VALUES ('seed_version', ?);",
      [String(SEED_VERSION)],
    )

    db.run("COMMIT;")
  } catch (err) {
    db.run("ROLLBACK;")
    throw err
  }
}

/**
 * Read the seed version that was stamped into the persisted DB. Returns null
 * for pre-versioned blobs (the meta table existed but no row was inserted).
 */
export function getStoredSeedVersion(db: Database): number | null {
  const stmt = db.prepare("SELECT value FROM meta WHERE key = 'seed_version'")
  try {
    if (stmt.step()) {
      const row = stmt.getAsObject() as { value?: string }
      const n = row.value ? Number(row.value) : NaN
      return Number.isFinite(n) ? n : null
    }
  } finally {
    stmt.free()
  }
  return null
}
