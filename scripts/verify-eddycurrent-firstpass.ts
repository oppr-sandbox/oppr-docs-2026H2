// Stand-alone verification — run firstPass detectors against a hand-crafted
// pages array reconstructed from the actual eddycurrent SOP extraction. Lets
// us spot-check what the deterministic detectors produce without spinning up
// the wizard. Run:  npx tsx scripts/verify-eddycurrent-firstpass.ts

import { buildFirstPass } from "../src/lib/import/firstPass"
import { renderToTiptap } from "../src/lib/import/renderToTiptap"
import { validateStructuredDoc } from "../src/lib/import/structuredDoc"

// Pages text reconstructed from the user's actual run (spaces and all,
// matching what pdfjs produces). Pages 4 & 5 contain the work-instruction
// table; the linear-reader gives us the left-column text only.
const PAGES = [
  {
    pageNumber: 1,
    text: `Urban Mining Corp
Keileweg 80, 3029 BT Rotterdam
www.umincorp.com CONFIDENTIAL Page 1 of 6
Document Type
STANDARD OPERATION PROCEDURE
Document Title
EDDYCURRENT MACHINE
Document Number
UP - OPS - SOP - 010
02 05/12/2023 Release for use Wesley FW NT
01 24/0 8 /2023 Issued for first Review Wesley FW NT
Rev. no
Date
Status of Document
Prep. By
Rev. By
App. By`,
  },
  {
    pageNumber: 2,
    text: `UP - OPS - SOP - 010 - [100] Eddycurrent machine r.02.docx
Title: EDDYCURRENT MACHINE
Date: 05/12/2023 Rev.: 02 No. of pages 6
Urban Mining Corp
Keileweg 80, 3029 BT Rotterdam
www.umincorp.com CONFIDENTIAL Page 2 of 6
1. Purpose
1.1. Purpose and scope of SOP
The purpose of this document is to describe the operating procedure of the eddy current machines used to remove non - ferro particles from the feedstock stream
1.2. Equipment List
In this document the following tagged equipment items are mentioned:
No.
Area
Equipment Tag
01 100 02 - 100 - MD - 03 - Eddy current machine (Bakker Magnetics)
02 100 02 - 100 - BBU - 03 – Bigbag filling station for non - ferro offspec rest stream from eddy current machine
03 100 02 - 100 - CC - 12 – Chain conveyer underneath eddy current to transport offspec to big bag filling station
1.3. Overview of reference Documents
No.
Doc. Number
Doc. Title
01 XXX Eddy Current Operating Manual
02 XXX Filling of bigbags and use of forklift
03 UP - OPS - TRG - 007 [100] TRAINING - Eddy Current Machine
2. Safety Precautions
Utilizing an eddy current machine to extract metal particles from a PET flake feedstock stream demands strict adherence to safety protocols to ensure the protection of both the operators and the integrity of the process.
Before operation
inspect the machine for any signs of damage or malfunction, ensuring that all components are securely fastened and that there are no exposed wires or electrical parts.
Operators should be equipped with appropriate personal protective equipment (PPE), including safety gloves, eye protection, and ear protection if the machine produces significant noise.
All metallic objects, tools, or personal items should be kept away from the machine's intake and discharge areas to avoid unintended attraction.
Also, before operations be sure to check the Emergency stop mechanism which should be clear in sight and easily accessible.`,
  },
  {
    pageNumber: 3,
    text: `During operations be sure to:
Check that the feedstock stream is flowing at the recommended rate to prevent overloading the eddy current machine
Regularly check the machine's waste collection area and ensure it's emptied in a safe manner.
2.1. Required PPE
Wear safety goggles
Wear gloves
Wear helmet
Use ear protection
Wear safety clothes
Wear safety boots
Refer to manual
3. Equipment and materials
During unloading of the bigbags with off spec material, be sure to follow normal operating procedures for bigbag filling station:
Proper placement of bigbags in the filling rack
Check if bigbag is being filled uniformly during filling
Caution when using forklift during removal of full bag
For more information, see SOP on filling and removal of full bigbags
4. LOTO
No additional LOTO requirements for use of Eddy current machine.`,
  },
  {
    pageNumber: 4,
    text: `5. Work instruction
This operating procedure will consist of executing the following steps:
Step no.
Description
Photo/ Screenshot
01 Turning on Eddy Current Machine.
go to the Main Panel of section 100.
On the main panel we have to switch on Eddy Current from Disabled to Enabled.
02 Now wait till Eddy reaches 3200/min on the panel marked in red
It takes at least a few minutes to reach the maximum speed.
03 To run material, the polymer sorter must also be switched on:
We can back it to the template of Turning ON/OFF the Polymer Sorter.
After Eddy current is running (speed has been reached) the following has to be enabled:
Put "Raw material to Silo's" on Enabled
Put "Polymer sorter" on Enabled`,
  },
  {
    pageNumber: 5,
    text: `12 Very important thing is if the Eddy Current (02 - 100 - MD - 03) has some fault then it can be accepted with the "ACK" button and then (when the fault is resolved) be reset with the "RESET" button.
13 How to stop the eddy Current This only requires the following:
Put "Raw material to Silo's" on Disabled
Put "Polymer sorter" on Disabled
ONLY turn off Eddy Current when production is expected to be shut down completely
6. Revision Control
Rev. no
Updated by
Description of update
01 Wesley/FW Initial draft of SOP`,
  },
  {
    pageNumber: 6,
    text: `Urban Mining Corp
Keileweg 80, 3029 BT Rotterdam
www.umincorp.com CONFIDENTIAL Page 6 of 6`,
  },
]

const result = buildFirstPass({
  filename: "UP-OPS-SOP-010 - [100] Eddycurrent machine r.02.pdf",
  pages: PAGES,
  pageLayouts: [],
  images: [],
  imageIdsByOrder: [],
  classification: {
    kind: "digitalPdf",
    pageCount: 6,
    detectedLanguage: "en",
  },
})

console.log("=== Metadata ===")
console.log(JSON.stringify(result.doc.metadata, null, 2))
console.log("\n=== History ===")
console.log(JSON.stringify(result.doc.history, null, 2))
console.log("\n=== Linked assets ===")
console.log(JSON.stringify(result.doc.linkedAssets, null, 2))
console.log("\n=== Linked docs ===")
console.log(JSON.stringify(result.doc.linkedDocs, null, 2))
console.log("\n=== PPE ===")
console.log(JSON.stringify(result.doc.ppe, null, 2))
console.log("\n=== LOTO ===")
console.log(JSON.stringify(result.doc.loto, null, 2))
console.log("\n=== Sections (first 3) ===")
console.log(JSON.stringify(result.doc.sections.slice(0, 3), null, 2))
console.log("\n=== Section count ===")
console.log(`${result.doc.sections.length} sections`)
console.log("\n=== Validation ===")
const validation = validateStructuredDoc(result.doc)
if (validation.ok) {
  console.log("zod validation passed.")
} else {
  console.log(`zod validation FAILED: ${validation.error}`)
}

const tiptap = renderToTiptap(result.doc)
console.log(`\n=== TipTap output: ${tiptap.content.length} top-level blocks ===`)
const counts: Record<string, number> = {}
for (const n of tiptap.content) {
  const t = (n as { type: string }).type
  counts[t] = (counts[t] ?? 0) + 1
}
console.log(JSON.stringify(counts, null, 2))
