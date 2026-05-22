// Builds the "reset to one reference document" payload sent to
// convex/reset.ts:resetToReference. The reference document exercises every
// authoring primitive so it is the unambiguous template for everything built
// after it: headings, intro, PPE row, callouts, an inline asset pill, an image
// (resizable), a numbered step list, an SVG diagram, a troubleshooting table,
// and a launch-log block.
//
// The linkedAsset pill uses the placeholder assetId "code:RMR-101"; the server
// rewrites it to the real inserted asset id (the body is the source of truth
// for linked assets).

import { ASSETS, SITE, paragraphChunks } from "./seedDataset"
import { templateForType } from "@/components/docs/DocumentTemplates"
import { DIAGRAM_PRESETS } from "@/components/docs/diagramPresets"
import type { DocumentType } from "@/types"

interface JSONNode {
  type: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
  text?: string
}

const text = (t: string): JSONNode => ({ type: "text", text: t })
const p = (t: string): JSONNode => ({
  type: "paragraph",
  content: t ? [text(t)] : [],
})
const h = (level: number, t: string): JSONNode => ({
  type: "heading",
  attrs: { level },
  content: [text(t)],
})
function table(rows: string[][]): JSONNode {
  return {
    type: "table",
    content: rows.map((row, i) => ({
      type: "tableRow",
      content: row.map((cell) => ({
        type: i === 0 ? "tableHeader" : "tableCell",
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [{ type: "paragraph", content: cell ? [text(cell)] : [] }],
      })),
    })),
  }
}

// A tiny inline SVG image as a data URI so the reference always renders one
// resizable image without depending on stored files or external hosts.
const SAMPLE_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320"><rect width="640" height="320" fill="#0f172a"/><rect x="40" y="60" width="240" height="200" rx="8" fill="#1e293b" stroke="#475569"/><rect x="360" y="60" width="240" height="200" rx="8" fill="#1e293b" stroke="#475569"/><circle cx="320" cy="160" r="34" fill="#f59e0b"/><text x="320" y="300" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="18">Reactor RMR-101 — process photo placeholder</text></svg>`,
)}`

function buildBody(): JSONNode {
  return {
    type: "doc",
    content: [
      h(1, "Kiln start-up and charge preparation"),
      {
        type: "paragraph",
        content: [
          text(
            "Standard procedure for safely starting the calcination kiln and preparing a charge on ",
          ),
          {
            type: "linkedAsset",
            attrs: { assetId: "code:RMR-101", label: "RMR-101" },
          },
          text(
            ". Confirm every safety condition before energising the burner.",
          ),
        ],
      },
      { type: "ppe", attrs: { items: "hardhat,glasses,gloves,boots,ear-pro" } },
      {
        type: "callout",
        attrs: { kind: "warning" },
        content: [
          p(
            "Do not start the burner until the exhaust fan reads above 85% and the interlock panel is green.",
          ),
        ],
      },
      h(2, "Reference photo"),
      {
        type: "image",
        attrs: {
          src: SAMPLE_IMAGE,
          alt: "Reactor process placeholder",
          width: 70,
          align: "center",
        },
      },
      h(2, "Procedure"),
      {
        type: "stepList",
        content: [
          {
            type: "stepItem",
            content: [p("Verify the exhaust fan and interlock panel status.")],
          },
          {
            type: "stepItem",
            content: [p("Confirm charge weight is 1,200 kg ± 25 kg per setter.")],
          },
          {
            type: "stepItem",
            content: [p("Energise the burner and ramp to 600 °C over 40 min.")],
          },
          {
            type: "stepItem",
            content: [p("Log the start in the daily handover and sign off.")],
          },
        ],
      },
      h(2, "Process flow"),
      {
        type: "diagram",
        attrs: {
          svg: DIAGRAM_PRESETS["process-flow"].svg,
          caption: DIAGRAM_PRESETS["process-flow"].defaultCaption,
        },
      },
      h(2, "Troubleshooting"),
      table([
        ["Symptom", "Likely cause", "Action"],
        ["Burner won't ignite", "Low exhaust flow", "Check fan, re-arm interlock"],
        ["High mill current", "Charge too coarse", "Re-screen, reduce feed"],
      ]),
      h(2, "Sign-off"),
      {
        type: "launchLog",
        attrs: { logId: "", anchorId: "ref-handover", label: "Daily handover" },
      },
      p(
        "Operator signs off in the daily handover log when the procedure completes.",
      ),
    ],
  }
}

export function buildReferencePayload() {
  const body = buildBody()
  const chunks = paragraphChunks(body as never).map((c, i) => ({
    seq: i + 1,
    text: c.text,
    pageOrSection: c.section,
  }))

  const assets = ASSETS.map((a) => ({
    code: a.code,
    name: a.name,
    site: SITE,
    location: a.location,
    qrToken: `qr-${a.code.toLowerCase()}`,
    description: a.description,
    level: a.level,
    floorplan: a.floorplan,
    isLinked: a.is_linked === 1,
    linkedLogCode: a.linked_log_code,
    linkedLogName: a.linked_log_name,
    linkedLogDescription: a.linked_log_description,
    pinNumber: a.pin_number,
    pinX: a.pin_x,
    pinY: a.pin_y,
    logs: a.logs.map((l) => ({
      code: l.code,
      name: l.name,
      description: l.description,
    })),
  }))

  const types: DocumentType[] = ["sop", "manual", "work_instruction", "lmra"]
  const typeNames: Record<DocumentType, string> = {
    sop: "SOP — Standard",
    manual: "Manual — Equipment",
    work_instruction: "Work instruction — Standard",
    lmra: "LMRA — Standard",
  }
  const templates = types.map((t) => ({
    name: typeNames[t],
    type: t,
    description: null as string | null,
    bodyJson: templateForType(t),
  }))

  return {
    locations: [
      { code: "HOL", label: "Holliday" },
      { code: "ANT", label: "Antwerp" },
    ],
    disciplines: [
      { code: "OPS", label: "Operations" },
      { code: "MNT", label: "Maintenance" },
      { code: "QA", label: "Quality" },
      { code: "HSE", label: "Health, Safety & Environment" },
    ],
    assets,
    templates,
    reference: {
      location: "HOL",
      discipline: "OPS",
      type: "sop" as DocumentType,
      title: "Kiln start-up and charge preparation",
      bodyJson: body,
      chunks,
    },
  }
}
