// Document body builders for the seed.
//
// Split out of seed.ts so the heavy TipTap JSON doesn't bury the relational
// inserts. Every document is plant-correct (Pigment Calcination at HOL —
// RMR-101 reception, FCK-102 mixer, FCK-103 mill, FRT-201 press,
// FRT-202 pre-kiln, STR-301 kiln charging) and showcases at least two of:
// tables, callouts, PPE chips, SVG diagrams, numbered step blocks,
// LaunchLog, LinkedAsset.

import { DIAGRAM_PRESETS } from "@/components/docs/diagramPresets"

// --- TipTap JSON helpers ----------------------------------------------------

export type JSONNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

export function p(text: string, attrs?: Record<string, unknown>): JSONNode {
  const node: JSONNode = { type: "paragraph", content: [{ type: "text", text }] }
  if (attrs) node.attrs = attrs
  return node
}
export function pStrong(text: string): JSONNode {
  return {
    type: "paragraph",
    content: [{ type: "text", text, marks: [{ type: "bold" }] }],
  }
}
export function h(level: number, text: string): JSONNode {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  }
}
export function bullet(items: string[]): JSONNode {
  return {
    type: "bulletList",
    content: items.map((t) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
    })),
  }
}
export function doc(content: JSONNode[]): JSONNode {
  return { type: "doc", content }
}

function callout(kind: string, body: JSONNode[]): JSONNode {
  return { type: "callout", attrs: { kind }, content: body }
}
function ppe(items: string[]): JSONNode {
  return { type: "ppe", attrs: { items: items.join(",") } }
}
function diagram(presetKey: keyof typeof DIAGRAM_PRESETS, caption?: string): JSONNode {
  const preset = DIAGRAM_PRESETS[presetKey]
  return {
    type: "diagram",
    attrs: { svg: preset.svg, caption: caption ?? preset.defaultCaption },
  }
}
function steps(items: JSONNode[][]): JSONNode {
  return {
    type: "stepList",
    content: items.map((blocks) => ({ type: "stepItem", content: blocks })),
  }
}
function table(rows: string[][], { headerRow = true } = {}): JSONNode {
  return {
    type: "table",
    content: rows.map((row, i) => ({
      type: "tableRow",
      content: row.map((cell) => ({
        type: i === 0 && headerRow ? "tableHeader" : "tableCell",
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [{ type: "paragraph", content: [{ type: "text", text: cell }] }],
      })),
    })),
  }
}
function launchLog(logId: string, anchorId: string, label: string): JSONNode {
  return { type: "launchLog", attrs: { logId, anchorId, label } }
}
function linkedAsset(assetId: string, code: string, name: string): JSONNode {
  return {
    type: "paragraph",
    content: [
      {
        type: "linkedAsset",
        attrs: { assetId, code, name },
      } as unknown as JSONNode,
    ],
  }
}

// --- Document bodies --------------------------------------------------------

export const SOP_HANDOVER_BODY = doc([
  h(1, "Daily handover SOP — Pigment Line"),
  p(
    "This procedure governs the daily shift handover at the HOL Pigment Calcination site. It applies to all line operators across Halls A, B, and C and the Yard. The outgoing shift completes the handover before leaving the floor; the incoming shift signs off when satisfied.",
  ),
  ppe(["hardhat", "glasses", "boots", "hi-vis"]),
  callout("notice", [
    p(
      "Handover is the only sanctioned channel for shift-to-shift communication. Verbal-only handoffs are not acceptable; capture every status item in this log.",
    ),
  ]),
  h(2, "Stations to walk"),
  p(
    "Walk the line in process order. Scan each asset's QR and capture the station status. The order matches material flow:",
  ),
  diagram("process-flow", "Walk the line in process order — Reception to Press."),
  h(2, "Status checklist"),
  table(
    [
      ["Asset", "What to confirm", "Expected"],
      ["RMR-101 Reception", "Open supplier batches, weighbridge calibration", "All batches tagged, no overdue"],
      ["FCK-102 Mixer", "Recipe loaded, dosing within tolerance", "Active recipe matches order"],
      ["FCK-103 Mill", "Motor load, outlet temperature", "Load < 90%, temp 65–85 °C"],
      ["FRT-201 Press", "Tonnage, die wear indicator, reject %", "Reject < 4%"],
      ["FRT-202 Pre-Kiln", "Sample moisture, visual grading", "Moisture < 6%"],
      ["STR-301 Kiln Charging", "Charge weight per setter, schedule", "1,200 kg ± 25 kg"],
    ],
    { headerRow: true },
  ),
  h(2, "Sign-off"),
  p(
    "Record the handover in the Daily handover log. Note operator names, line state, and any pending alarms. The incoming operator signs off when satisfied.",
    { id: "anchor-log-handover" },
  ),
  launchLog("log-handover-daily", "anchor-log-handover", "Daily handover"),
  callout("warning", [
    p(
      "If any expected condition is RED, do not sign off. Escalate to the line manager and stay on shift until resolved or formally re-assigned.",
    ),
  ]),
  h(2, "After handover"),
  p(
    "Outgoing operator submits any quality samples to the lab fridge and locks out their console session. See HOL-OPS-SOP-0003 for the site evacuation route in case of alarm during handover.",
  ),
])

export const SOP_MIXER_BODY = doc([
  h(1, "Feedstock Mixer (FCK-102) startup SOP"),
  p(
    "Use this SOP to bring the FCK-102 twin-shaft feedstock mixer online from a cold state at the start of a production day. The mixer blends kaolin, sodium carbonate, sulphur, and mineral oil into a homogeneous feedstock for downstream grinding (FCK-103).",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis", "dust-mask"]),
  callout("danger", [
    p(
      "Confirm the lockout/tagout is removed from the mixer drive before any startup attempt. Personnel may be inside the mixer chamber during cleaning windows.",
    ),
  ]),
  h(2, "Pre-start spec"),
  table(
    [
      ["Parameter", "Setpoint", "Acceptable range"],
      ["Recipe ID", "From production order", "—"],
      ["Hopper level (kaolin)", "≥ 60%", "60–95%"],
      ["Mixer chamber temp", "Ambient", "5–30 °C"],
      ["Drive interlock", "Engaged", "Engaged only"],
      ["Bag-house dP", "< 1.5 kPa", "0.5–1.5 kPa"],
    ],
    { headerRow: true },
  ),
  h(2, "Startup sequence"),
  steps([
    [p("Verify production order matches the recipe loaded on the HMI. If a recipe change is required, follow the recipe-change protocol on the operator panel.")],
    [p("Confirm hopper levels for all four raw streams meet the pre-start spec. If any stream is below 60%, request silo top-up before continuing.")],
    [p("Engage the bag-house and confirm dP stabilises below 1.5 kPa within 60 seconds.")],
    [p("Start the mixer drive at 30% speed. Hold for 90 seconds and watch for unusual vibration or current draw.")],
    [p("Ramp to production speed (typically 70–85% depending on recipe). Open the dosing slides to active recipe values.")],
    [p("Capture the startup observation in the surveillance log; note recipe, time, hopper levels, any deviations.")],
  ]),
  callout("tip", [
    p(
      "If outlet temperature climbs above 85 °C in the first 10 minutes, reduce drive speed by 5% and watch for moisture in raw feed. This is the most common root cause for a hot start.",
    ),
  ]),
  h(2, "Stabilisation and sample"),
  p(
    "Once at production speed, take three feedstock samples at 5-minute intervals from the mixer outlet. Confirm visual homogeneity and submit one sample to the lab. Release the line to FCK-103 only after the third sample passes.",
  ),
  launchLog("log-quality-extruder", "anchor-log-quality-mixer", "Quality check — Mixer"),
  h(2, "Troubleshooting"),
  table(
    [
      ["Symptom", "Likely cause", "Action"],
      ["High motor current", "Wet kaolin or oversized lump", "Reduce dose 10%, request silo flush"],
      ["Outlet temp > 90 °C", "Friction from dry mix", "Add 0.2% mineral oil, recheck after 5 min"],
      ["Visible streaking in sample", "Dosing valve sticking", "Switch to manual dosing, raise maintenance ticket"],
      ["Bag-house dP > 1.8 kPa", "Filter loaded", "Initiate jet-clean cycle from HMI"],
    ],
    { headerRow: true },
  ),
  callout("notice", [
    p(
      "Related documents: see HOL-OPS-MAN-0001 for the FCK-103 grinding mill that follows this stage, and HOL-OPS-LMRA-0001 before any work in the reception area.",
    ),
  ]),
])

export const MAN_MILL_BODY = doc([
  h(1, "Grinding Mill (FCK-103) operating manual"),
  p(
    "FCK-103 is a pendulum roller mill that reduces homogenised feedstock from FCK-102 to the target particle size before briquetting on FRT-201. This manual covers normal operation, jam recovery, and the maintenance schedule.",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis", "ear-pro"]),
  h(2, "Operating envelope"),
  table(
    [
      ["Parameter", "Min", "Nominal", "Max"],
      ["Motor load (%)", "40", "70", "90"],
      ["Outlet temperature (°C)", "55", "75", "90"],
      ["Feed rate (t/h)", "8", "12", "16"],
      ["Outlet particle size (D90, µm)", "60", "75", "95"],
      ["Mill differential pressure (kPa)", "1.0", "1.8", "2.5"],
    ],
    { headerRow: true },
  ),
  h(2, "Theory of operation"),
  p(
    "The mill grinds feedstock between three pendulum rollers and a fixed grinding ring. Centrifugal force from the main shaft drives the rollers outward; an integrated classifier returns oversize to the grinding zone. Air flow conveys product to the bag-house and onward to the press feed silo.",
  ),
  h(2, "Normal operation"),
  steps([
    [p("Confirm FCK-102 is running and outlet feed is steady before opening the mill feed gate.")],
    [p("Open the air damper to 60% and start the main motor. Allow it to reach idle current.")],
    [p("Open the feed gate progressively over 2 minutes until target feed rate is reached.")],
    [p("Monitor motor load and outlet temperature on the HMI. Adjust classifier speed to hold D90 within spec.")],
    [p("Capture hourly readings in the surveillance log; flag any drift > 10% from nominal.")],
  ]),
  h(2, "Jam recovery"),
  p(
    "When mill current exceeds 110% the controller automatically reduces feed. If the situation does not recover within 30 seconds, follow the decision tree below:",
  ),
  diagram("jam-decision", "Jam recovery — escalation flow when mill current exceeds 110%."),
  callout("danger", [
    p(
      "Never enter the mill chamber without a valid lockout/tagout (LOTO) and a confined-space permit. Hot internal surfaces remain dangerous for at least 4 hours after shutdown.",
    ),
  ]),
  h(2, "Maintenance schedule"),
  table(
    [
      ["Task", "Frequency", "Responsible"],
      ["Visual inspection of cutter ring", "Daily", "Shift operator"],
      ["Lubricate main bearings", "Weekly", "Maintenance"],
      ["Hydraulic pressure check", "Weekly", "Maintenance"],
      ["Cutter teeth wear measurement", "Monthly", "Maintenance"],
      ["Classifier alignment", "Quarterly", "Maintenance + vendor"],
      ["Full overhaul", "Annual", "Vendor"],
    ],
    { headerRow: true },
  ),
  h(2, "Spare parts (critical)"),
  table(
    [
      ["Part", "Spec", "Stock target", "Vendor SKU"],
      ["Roller assembly", "Mk III, 320 mm", "1", "VR-320-MK3"],
      ["Grinding ring", "Hardox 500, 1100 mm", "1", "GR-1100-H500"],
      ["Main bearing set", "SKF 22320 EK", "2", "SKF-22320-EK"],
      ["Drive belt", "Optibelt RB 8V-2240", "4", "OB-8V-2240"],
      ["Bag-house filter cartridge", "Donaldson Ultra-Web 660", "12", "DON-UW-660"],
    ],
    { headerRow: true },
  ),
  h(2, "Revision history"),
  table(
    [
      ["Version", "Date", "Author", "Changes"],
      ["v1.0", "2025-09-14", "Maya Chen", "Initial release"],
      ["v1.1", "2026-01-22", "Maya Chen", "Added jam decision tree, updated spare parts list"],
      ["v1.2", "2026-04-22", "Maya Chen", "Operating envelope table, monthly checks formalised"],
    ],
    { headerRow: true },
  ),
])

export const WI_PRESS_BODY = doc([
  h(1, "Briquette Press (FRT-201) reject capture WI"),
  p(
    "When FRT-201 produces off-spec briquettes, every reject event must be captured for QA review. Reject rate above 4% triggers an automatic divert to the mill feed and an alert to the shift lead.",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis", "ear-pro"]),
  diagram("press-cross-section", "FRT-201 briquette press — internal layout."),
  h(2, "When to use"),
  bullet([
    "Reject indicator on the HMI rises above 4%.",
    "Visible cracking or under-density on the outlet conveyor.",
    "Press tonnage is at or near the upper alarm threshold.",
  ]),
  h(2, "Procedure"),
  steps([
    [p("Pause the press feed from the HMI. Do NOT stop the press itself unless tonnage is in alarm.")],
    [p("Bag a 500 g sample of the rejected briquettes and tag with date, shift, time, and operator.")],
    [p("Capture the reject reason and sample tag in the press operations log. Photograph the sample if visual defect is unusual.")],
    [p("If reject rate exceeds 6% over 10 minutes, escalate per the matrix below.")],
    [p("After resolution, take three confirmation samples at 5-minute intervals before clearing the alarm.")],
  ]),
  callout("warning", [
    p(
      "Reject samples sit on the conveyor at temperatures up to 90 °C. Use the heat-rated gloves stored at the press station, not standard nitrile gloves.",
    ),
  ]),
  h(2, "Escalation matrix"),
  table(
    [
      ["Reject %", "Duration", "Action", "Notify"],
      ["4–6%", "Single occurrence", "Capture sample, continue", "Logbook only"],
      ["4–6%", "> 30 min", "Reduce feed, increase moisture target by 0.5%", "Shift lead"],
      ["6–10%", "Any", "Divert to mill feed, capture root cause", "Shift lead + maintenance"],
      ["> 10%", "Any", "Stop press, follow LOTO, raise priority ticket", "Plant manager"],
    ],
    { headerRow: true },
  ),
  callout("notice", [
    p(
      "Cross-reference: HOL-OPS-MAN-0001 for the upstream FCK-103 mill — most reject root causes originate there.",
    ),
  ]),
  launchLog("log-override-sorter", "anchor-log-press-reject", "Press reject capture"),
])

export const LMRA_RECEPTION_BODY = doc([
  h(1, "Raw Materials Reception (RMR-101) LMRA"),
  p(
    "Last Minute Risk Analysis to be completed before any task in the RMR-101 reception bay. Confirm each item with a colleague present. Sign off only when every item is green.",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis", "dust-mask"]),
  callout("danger", [
    p(
      "Truck movements in the reception yard are the highest-risk hazard at this site. Never enter the bay while a truck is reversing or being unloaded by forklift.",
    ),
  ]),
  h(2, "Hazards to confirm"),
  table(
    [
      ["Hazard", "Confirm", "If not"],
      ["Truck movement", "No truck reversing or unloading in next 10 min", "Wait outside yellow line"],
      ["Forklift operation", "Forklift parked, key removed", "Notify forklift operator"],
      ["Dust exposure (kaolin)", "Dust mask in place, ventilation on", "Stop work, escalate"],
      ["Sulphur drum integrity", "No leaks, drum upright, label legible", "Cordon off area"],
      ["Mineral oil spill risk", "Bund clean and dry, drip tray under transfer point", "Place containment, raise ticket"],
      ["Fall hazard (loading dock edge)", "Edge barrier present and locked", "Do not approach edge"],
      ["Communication", "Radio on Channel 2, battery > 50%", "Swap radio before starting"],
    ],
    { headerRow: true },
  ),
  h(2, "Sign-off"),
  p(
    "If any item cannot be confirmed, stop work and notify the supervisor before proceeding. Sign off in the LMRA log with name, time, and a 1-line context note.",
  ),
  callout("notice", [
    p(
      "For hot work in the reception area (welding, grinding, cutting), use HOL-OPS-LMRA-0002 in addition to this LMRA — both must be completed.",
    ),
  ]),
])

export const MAN_KILN_CHARGING_BODY = doc([
  h(1, "Kiln Charging & Stacking (STR-301) service guide"),
  p(
    "STR-301 is the kiln charging deck where graded briquettes are stacked into setters and fed to the rotary kiln. Stacking pattern and charge weight are recorded against the active firing schedule.",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis", "ear-pro"]),
  diagram("kiln-stacking", "Setter stacking pattern: 5 layers, offset rows."),
  h(2, "Charge specification"),
  table(
    [
      ["Parameter", "Setpoint", "Tolerance"],
      ["Charge weight per setter", "1,200 kg", "± 25 kg"],
      ["Layer count", "5", "Exactly 5"],
      ["Layer offset", "Row N+1 offset by 30 mm vs N", "± 5 mm"],
      ["Reject briquette ratio", "0%", "Reject material does not enter the setter"],
      ["Setter centring on roller", "Ø 50 mm tolerance", "—"],
    ],
    { headerRow: true },
  ),
  h(2, "Charging procedure"),
  steps([
    [p("Confirm firing schedule on the HMI matches the active production order.")],
    [p("Pull the next empty setter from the staging line. Verify it has been brushed since last firing.")],
    [p("Stack briquettes per the diagram above. Reject any cracked, under-density, or off-spec briquettes — divert to mill feed.")],
    [p("Tare the setter on the load cell and confirm net charge is within tolerance.")],
    [p("Release the setter to the kiln charging conveyor. Capture the load reference in the surveillance log.")],
  ]),
  callout("warning", [
    p(
      "The charging deck operates within 6 metres of the rotary kiln. Surface temperatures on the kiln shell can exceed 200 °C — never lean across the deck barrier.",
    ),
  ]),
])

export const SOP_EVACUATION_BODY = doc([
  h(1, "Site evacuation SOP"),
  p(
    "This SOP applies to all personnel on the HOL Pigment Calcination site. On hearing the continuous evacuation tone, stop work safely, evacuate via the marked routes, and proceed to the muster point.",
  ),
  ppe(["hi-vis"]),
  callout("danger", [
    p(
      "Do NOT use the goods elevator during evacuation. Do NOT collect personal belongings. Do NOT re-enter buildings until the all-clear is announced by the site supervisor.",
    ),
  ]),
  diagram("site-map", "Evacuation routes (red dashed) and muster point M."),
  h(2, "On hearing the alarm"),
  steps([
    [p("Stop work immediately and put any equipment into a safe state. Close the nearest dosing valve if you are at the mixer, mill, or press; otherwise leave equipment running unless its alarm shows red.")],
    [p("Walk — do not run — to the nearest marked exit. Routes are shown above; use the secondary route if your primary is blocked or smoke-affected.")],
    [p("Proceed to the Muster Point (M, north-east corner of the yard). Report to your shift lead for headcount.")],
    [p("Remain at the muster point until the all-clear is announced. Do not return to the building unless the site supervisor confirms it is safe.")],
  ]),
  h(2, "Muster headcount"),
  table(
    [
      ["Shift", "Lead", "Headcount target"],
      ["Day", "Maya Chen", "12 + visitors"],
      ["Late", "Tomás Pereira", "9 + visitors"],
      ["Night", "Aïsha Bakker", "6"],
    ],
    { headerRow: true },
  ),
  callout("notice", [
    p(
      "Visitors are checked in at reception and must be accounted for at the muster point. Reception keeps the daily visitor manifest on the bulletin board.",
    ),
  ]),
])

export const SOP_PREKILN_BODY = doc([
  h(1, "Pre-Kiln Inspection (FRT-202)"),
  p(
    "Briquettes from FRT-201 are visually graded and moisture-sampled at FRT-202 before being released to the kiln charging deck (STR-301). Off-spec briquettes are diverted back to FCK-103 mill feed.",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis"]),
  h(2, "Specification"),
  table(
    [
      ["Parameter", "Spec", "Reject if"],
      ["Moisture (%)", "≤ 6", "> 6"],
      ["Visual integrity", "No cracks > 5 mm", "Crack > 5 mm or chip > 10 mm"],
      ["Density (kg/m³)", "≥ 1,950", "< 1,900"],
      ["Surface colour", "Uniform pale grey", "Streaks / dark patches"],
    ],
    { headerRow: true },
  ),
  h(2, "Inspection procedure"),
  steps([
    [p("Take a 12-briquette sample from the conveyor every 30 minutes during production.")],
    [p("Run a moisture probe on three randomly selected briquettes. Record values on the HMI.")],
    [p("Visually grade the remaining nine briquettes. Reject any that fail the spec table.")],
    [p("If reject rate exceeds 8% in a 30-minute window, divert to mill feed and notify the press operator.")],
    [p("Capture the inspection result in the surveillance log every cycle.")],
  ]),
  callout("tip", [
    p(
      "Streaks on the briquette surface are usually a dosing problem at FCK-102, not a press fault. Ask the mixer operator before flagging the press.",
    ),
  ]),
])

export const LMRA_HOTWORK_BODY = doc([
  h(1, "Hot work permit — site-wide"),
  p(
    "Required before any welding, grinding, cutting, soldering, or other ignition-source work anywhere on site. Combine with the asset's local LMRA (e.g. HOL-OPS-LMRA-0001 for the reception bay).",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis", "mask"]),
  callout("danger", [
    p(
      "Sulphur dust and mineral oil residues are present across the site. Hot work without a fire watch and a clear 5-metre radius is not permitted.",
    ),
  ]),
  h(2, "Pre-work checks"),
  table(
    [
      ["Check", "Confirm"],
      ["Permit signed by supervisor", "Yes / No"],
      ["5-metre radius free of combustibles", "Yes / No"],
      ["Fire watch designated", "Name + radio channel"],
      ["Extinguisher type and location", "CO₂ or dry powder, < 5 m"],
      ["Ventilation in place", "Local extraction running"],
      ["Adjacent sensors isolated", "Smoke detector inhibit logged"],
      ["Post-work fire watch (60 min)", "Yes / No"],
    ],
    { headerRow: true },
  ),
  callout("warning", [
    p(
      "Permit is valid for one shift only. If work continues into the next shift, a new permit and a fresh fire-watch must be issued.",
    ),
  ]),
])

export const WI_STICKER_BODY = doc([
  h(1, "Sticker OCR capture (intake)"),
  p(
    "When a supplier delivers raw materials at RMR-101, each pallet carries a paper sticker with a 4-digit intake code. This work instruction captures the code via the HMI photo template configured for sticker OCR. The captured code joins the pallet to the supplier batch in the LOGS module.",
  ),
  ppe(["hardhat", "glasses", "gloves", "boots", "hi-vis"]),
  h(2, "Capture flow"),
  steps([
    [p("Scan the RMR-101 QR. The app offers Run a log → pick \"Réception matières premières\".")],
    [p("Tap the photo step. The HMI template opens with the sticker frame.")],
    [p("Align the 4-digit code in the frame. The app extracts the digits automatically.")],
    [p("Confirm the digits, then voice-note the contents (\"5 pallets, sodium carbonate, dry\").")],
    [p("Tap submit. The pallet is now joined to the supplier batch on the unified timeline.")],
  ]),
  callout("tip", [
    p(
      "If the OCR misreads (digits often confuse 0/O and 8/B), tap the frame to type a manual override. The app keeps both values for audit.",
    ),
  ]),
  callout("notice", [
    p(
      "Cross-reference: HOL-OPS-LMRA-0001 must be completed before any work in the reception bay. The LMRA is a separate quick-form log on the same asset.",
    ),
  ]),
  launchLog("log-quality-extruder", "anchor-log-sticker-capture", "Réception matières premières"),
])

export const SOP_END_OF_SHIFT_BODY = doc([
  h(1, "End-of-shift summary (asset-agnostic)"),
  p(
    "An asset-agnostic SOP — runnable anywhere on site without scanning a QR. Every shift lead completes one before clocking out. Captures observations across the line, not at any single asset.",
  ),
  ppe(["hi-vis"]),
  h(2, "What to capture"),
  bullet([
    "Shift production tonnage vs target.",
    "Top three issues encountered, in plain language.",
    "Any safety near-miss or observation.",
    "Pending items the next shift should know about.",
    "Headcount and any absences.",
  ]),
  callout("notice", [
    p(
      "This is a Level 2 capture in the intelligence ladder — IDA correlates these summaries with hard data across shifts to surface patterns operators see before sensors do.",
    ),
  ]),
  h(2, "Observation form"),
  table(
    [
      ["Field", "Type", "Required"],
      ["Tonnage produced", "Numeric", "Yes"],
      ["Top issue (1–3)", "Voice note", "At least one"],
      ["Safety observation", "Voice note + photo", "If applicable"],
      ["Pending for next shift", "Single-line text", "Yes"],
      ["Sign-off", "Slider", "Yes"],
    ],
    { headerRow: true },
  ),
])
