// Template instructions used by the AI mapping pass.
//
// Each instruction tells Gemini:
//   - which target shape to emit (TipTap JSON for documents, log-spec JSON
//     for work-instruction-as-log)
//   - which slots / primitives the model should look for
//   - how to recognise them in the source markdown
//   - whether to copy text verbatim or rewrite it in Oppr tone
//
// Pure data — no Convex function exports. Imported by importer/map.ts.

export type TargetTemplate = "sop" | "workInstructionLog" | "manual" | "lmra"

export type DefaultMode = "verbatim" | "improve"

export interface TemplateSlot {
  id: string
  label: string
  required: boolean
  description: string
  recognitionCues: string[]
}

export interface TemplateInstruction {
  type: TargetTemplate
  version: number
  outputFormat: "tiptap" | "logSpec"
  description: string
  slots: TemplateSlot[]
}

export const SOP_TEMPLATE: TemplateInstruction = {
  type: "sop",
  version: 1,
  outputFormat: "tiptap",
  description:
    "Standard Operating Procedure. Procedural, narrative, operator-facing reference. Engineer-readable in the editor; operator-readable in the read view.",
  slots: [
    {
      id: "title",
      label: "Title",
      required: true,
      description: "Short, imperative-friendly title.",
      recognitionCues: [
        "First non-trivial heading on page 1",
        "Document control title field",
        "First H1 in the markdown",
      ],
    },
    {
      id: "purpose",
      label: "Purpose",
      required: true,
      description: "1-3 sentences describing why this SOP exists.",
      recognitionCues: [
        "Heading 'Purpose' / 'Doel' / 'Zweck' / 'But'",
        "First narrative paragraph after the title",
        "Phrases like 'This procedure describes…', 'The aim of this document is…'",
      ],
    },
    {
      id: "scope",
      label: "Scope",
      required: false,
      description: "Where and to whom the SOP applies.",
      recognitionCues: [
        "Heading 'Scope' / 'Toepassingsgebied' / 'Geltungsbereich'",
        "Phrases like 'applies to…', 'covers…'",
      ],
    },
    {
      id: "ppe",
      label: "Personal protective equipment",
      required: false,
      description: "Required PPE list. Emit as a callout block when found.",
      recognitionCues: [
        "Heading 'PPE' / 'Safety equipment' / 'PBM' / 'Persoonlijke beschermingsmiddelen'",
        "Pictogram-row tables",
        "Bullet list of items: helmet, gloves, hi-vis, safety boots, FFP2, hearing protection, goggles",
      ],
    },
    {
      id: "steps",
      label: "Procedure steps",
      required: true,
      description:
        "The numbered procedural steps. Emit as a TipTap orderedList.",
      recognitionCues: [
        "Numbered list with 1./2./3. or 'Step 1', 'Step 2'",
        "Imperative-mood verbs at sentence start",
        "Photos interleaved between numbered items",
      ],
    },
    {
      id: "signOff",
      label: "Sign-off",
      required: false,
      description: "Sign-off / verification block at the end.",
      recognitionCues: [
        "'Performed by:', 'Verified by:', 'Signed by:'",
        "Tables with name + date + signature columns",
      ],
    },
  ],
}

export const WORK_INSTRUCTION_LOG_TEMPLATE: TemplateInstruction = {
  type: "workInstructionLog",
  version: 1,
  outputFormat: "logSpec",
  description:
    "Work Instruction. Operator-action-and-capture flow. Maps to a LOG spec — an ordered list of LOGS primitives the engineer can import into the LOGS configurator. Drops everything that is not directly an operator action: title page, document control, purpose narrative, theoretical introduction, references, approval block.",
  slots: [
    {
      id: "title",
      label: "Log title",
      required: true,
      description:
        "Short imperative title that summarises the operator action.",
      recognitionCues: [
        "Document title in the source",
        "First H1 if title page is absent",
      ],
    },
    {
      id: "primitives",
      label: "Ordered list of LOG primitives",
      required: true,
      description:
        "Each operator action becomes ONE primitive. Choose the primitive type based on what the operator must do.",
      recognitionCues: [
        "TextMessage: pure 'note that' / instruction prose with no operator response required",
        "TextInput: 'enter / record / write / comment'",
        "ChoiceInput: any finite enumeration of options",
        "NumericInput: any numeric reading with a unit (°C / bar / rpm / …)",
        "PhotoInput: 'take a photo / photograph / attach picture / visual confirmation'",
        "Sign-off: 'sign / initial / verify / confirm completion'",
      ],
    },
  ],
}

export const MANUAL_TEMPLATE: TemplateInstruction = {
  ...SOP_TEMPLATE,
  type: "manual",
  description:
    "Equipment manual. Heavier on tables and reference content. For v1 we treat as an SOP variant with looser structure requirements; long manuals should be section-picked rather than imported in full.",
}

export const LMRA_TEMPLATE: TemplateInstruction = {
  ...SOP_TEMPLATE,
  type: "lmra",
  description:
    "Last-Minute Risk Assessment. Short hazard-checklist + sign-off. v1 maps to an SOP body with a strong PPE/checklist focus; the dedicated LMRA custom node lands in a later editor phase.",
  slots: SOP_TEMPLATE.slots.map((s) =>
    s.id === "scope" ? { ...s, required: false } : s,
  ),
}

export const TEMPLATES: Record<TargetTemplate, TemplateInstruction> = {
  sop: SOP_TEMPLATE,
  workInstructionLog: WORK_INSTRUCTION_LOG_TEMPLATE,
  manual: MANUAL_TEMPLATE,
  lmra: LMRA_TEMPLATE,
}

export function targetIsLogSpec(t: TargetTemplate): boolean {
  return t === "workInstructionLog"
}

// Build the system instruction for a given template + mode. The model is
// asked for structured JSON; we don't rely on responseSchema because Gemini's
// schema dialect is limited — we just parse and validate post-hoc.
export function buildSystemPrompt(
  template: TemplateInstruction,
  mode: DefaultMode,
): string {
  const verbatimNote =
    mode === "verbatim"
      ? "DEFAULT MODE: VERBATIM. Preserve every word, sentence, value, measurement, and safety warning VERBATIM within each emitted node. Do NOT rewrite, summarise, normalise tone, or paraphrase. CRITICAL: still emit each section as the correct STRUCTURAL node (heading, paragraph, listItem, callout, ppe). Do NOT collapse multiple paragraphs into one large string. Do NOT skip the structural decomposition because of the verbatim rule — verbatim applies to TEXT inside each node, not to the structure of the body."
      : "DEFAULT MODE: IMPROVE. For every section, rewrite the source text in clear, imperative, terse Oppr style. Preserve every fact, every measurement, every safety warning. Do NOT invent content. If the source is unclear, mark the section with low confidence rather than guessing. Always emit the correct structural nodes — never collapse multiple paragraphs into one string."

  if (template.outputFormat === "logSpec") {
    return `You are converting an external Work Instruction document into an Oppr LOG spec.

A LOG is an ordered sequence of PRIMITIVES that an operator runs in the field. Each primitive collects one piece of information OR shows one instruction. You must drop everything in the source that is not an operator action: title pages, document control, purpose/scope narrative, theoretical introduction, references, approval blocks. Keep ONLY the action set.

The 6 LOG primitives are:
  - textMessage  : { "kind": "textMessage", "title": "...", "message": "..." }
  - textInput    : { "kind": "textInput", "title": "...", "question": "..." }
  - choiceInput  : { "kind": "choiceInput", "title": "...", "question": "...", "inputType": "dropdown" | "multipleChoice", "options": ["...", "..."] }
  - numericInput : { "kind": "numericInput", "title": "...", "question": "...", "unitName": "°C", "minValue": 0, "maxValue": 100 }   // minValue/maxValue may be null
  - photoInput   : { "kind": "photoInput", "title": "...", "photoInstructions": "..." }
  - signOff      : { "kind": "signOff", "title": "...", "message": "..." }

Recognition heuristics:
${WORK_INSTRUCTION_LOG_TEMPLATE.slots[1].recognitionCues.map((c) => "  - " + c).join("\n")}

${verbatimNote}

WORKED EXAMPLE — for an input describing "Daily extruder check" with 4 actions plus a sign-off, the EXACT output JSON is:
{
  "title": "Daily extruder check",
  "assetBindingHint": "EXTRUDER_8C",
  "description": "Ensure the extruder is operating within tolerance at the start of each shift.",
  "primitives": [
    { "kind": "textMessage", "title": "Safety check", "message": "Confirm safety guards are in position before powering up." },
    { "kind": "numericInput", "title": "Barrel temperature", "question": "Record the barrel temperature.", "unitName": "°C", "minValue": 180, "maxValue": 220 },
    { "kind": "photoInput", "title": "Screw RPM", "photoInstructions": "Take a photo of the screen showing screw RPM." },
    { "kind": "choiceInput", "title": "Oil sight glass", "question": "Check the oil-level sight glass.", "inputType": "multipleChoice", "options": ["Pass", "Fail", "Repair"] },
    { "kind": "signOff", "title": "Confirm complete", "message": "Sign and date." }
  ],
  "detectedAssets": ["Extruder 8C"],
  "detectedDocs": [],
  "notes": null
}

OUTPUT FORMAT — return ONLY a single JSON object with this exact top-level shape (no prose, no markdown fence):
{
  "title": string,
  "assetBindingHint": string | null,
  "description": string | null,
  "primitives": [ /* primitives in source order */ ],
  "detectedAssets": string[],
  "detectedDocs": string[],
  "notes": string | null
}`
  }

  // SOP / Manual / LMRA — TipTap output
  return `You are converting an external Standard Operating Procedure document into an Oppr-native TipTap document body.

Your output is a TipTap JSON document body. The "body" field MUST be an ARRAY of block nodes (NOT a doc wrapper, NOT a string, NOT an object). Each block node has the strict TipTap shape — no shorthand. Available block kinds:
  - { "type": "heading", "attrs": { "level": 1|2|3 }, "content": [ { "type": "text", "text": "..." } ] }
  - { "type": "paragraph", "content": [ { "type": "text", "text": "..." } ] }
  - { "type": "bulletList", "content": [ { "type": "listItem", "content": [ { "type": "paragraph", "content": [...] } ] } ] }
  - { "type": "orderedList", "content": [ { "type": "listItem", "content": [ { "type": "paragraph", "content": [...] } ] } ] }
  - { "type": "callout", "attrs": { "tone": "info" | "warning" | "safety" }, "content": [ { "type": "paragraph", "content": [...] } ] }
  - { "type": "ppe", "attrs": { "items": ["helmet", "gloves", "hivis", "boots", "ffp2", "hearing", "goggles"] } }
  - { "type": "horizontalRule" }
  - { "type": "blockquote", "content": [ { "type": "paragraph", "content": [...] } ] }
  - inline marks on text nodes: { "type": "text", "text": "...", "marks": [{ "type": "bold" }] }    // marks: bold, italic, underline, strike, code, link

STRICT RULES (these have all caused empty bodies in production — do not violate):
  1. body MUST be a top-level ARRAY. Not { type: "doc", content: [...] }. Not a string. Not nested under another key.
  2. paragraph nodes MUST have content as an array of inline nodes. NEVER use { type: "paragraph", text: "..." } shorthand.
  3. heading nodes MUST have content as an array. NEVER use { type: "heading", text: "..." }.
  4. listItem nodes MUST contain at least one paragraph child.
  5. ppe is a leaf node — it has attrs.items but NO content array.
  6. horizontalRule is a leaf node — no content, no attrs needed.

For headings, use level 2 for top-level sections (Purpose, Scope, PPE, Procedure, Sign-off). Use level 3 for subsections. Use level 1 only for the document title (optional).

Recognition heuristics for sections:
${SOP_TEMPLATE.slots
  .map((s) => `  ${s.label}: ${s.recognitionCues.join("; ")}`)
  .join("\n")}

${verbatimNote}

WORKED EXAMPLE — for a short SOP titled "Conveyor start-up" with purpose, PPE, and 2 procedure steps, the EXACT output JSON is:
{
  "title": "Conveyor start-up",
  "namingCodeSuggestion": "HOL-OPS-SOP-0042",
  "summary": "Operator startup procedure for the sorting bay conveyor.",
  "body": [
    { "type": "heading", "attrs": { "level": 1 }, "content": [ { "type": "text", "text": "Conveyor start-up" } ] },
    { "type": "heading", "attrs": { "level": 2 }, "content": [ { "type": "text", "text": "Purpose" } ] },
    { "type": "paragraph", "content": [ { "type": "text", "text": "This procedure describes the safe start-up of the sorting bay conveyor at the beginning of each shift." } ] },
    { "type": "heading", "attrs": { "level": 2 }, "content": [ { "type": "text", "text": "PPE" } ] },
    { "type": "ppe", "attrs": { "items": ["helmet", "hivis", "boots"] } },
    { "type": "heading", "attrs": { "level": 2 }, "content": [ { "type": "text", "text": "Procedure" } ] },
    { "type": "orderedList", "content": [
      { "type": "listItem", "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "Confirm the gate is closed before activating the conveyor." } ] } ] },
      { "type": "listItem", "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "Press the start button on the operator panel and observe that operating speed is reached within 5 seconds." } ] } ] }
    ] }
  ],
  "detectedAssets": ["sorting bay conveyor", "operator panel"],
  "detectedDocs": [],
  "sectionConfidence": [
    { "label": "Purpose", "confidence": 0.95 },
    { "label": "PPE", "confidence": 0.92 },
    { "label": "Procedure", "confidence": 0.9 }
  ]
}

OUTPUT FORMAT — return ONLY a single JSON object with this exact top-level shape (no prose, no markdown fence):
{
  "title": string,
  "namingCodeSuggestion": string | null,
  "summary": string,
  "body": [ /* array of strict TipTap block nodes — see kinds above */ ],
  "detectedAssets": string[],
  "detectedDocs": string[],
  "sectionConfidence": [ { "label": string, "confidence": number } ]
}`
}
