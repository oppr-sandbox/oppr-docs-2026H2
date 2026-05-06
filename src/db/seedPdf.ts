// Generate a real-looking multi-page PDF for the Drying Oven 4 manual seed.
//
// We use pdf-lib in the browser (no Node-only APIs) so the seed can build a
// genuine PDF blob the first time the DB initializes. Doing it at seed time
// rather than at build time keeps the bundle smaller in production paths
// that don't seed.
//
// The PDF is intentionally simple — title page + 3 content pages with text.
// Enough for the PDF reader, RAG-over-PDF chunking, and citation page deep-
// linking to all have something real to bite on.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

interface PageSpec {
  title: string
  body: string[]
}

const ORANGE = rgb(0.85, 0.4, 0.1)
const SLATE = rgb(0.2, 0.25, 0.32)
const MUTED = rgb(0.45, 0.5, 0.55)

const PAGES: PageSpec[] = [
  {
    title: "Drying Oven 4 — Vendor Manual",
    body: [
      "HOL-OPS-MAN-0002",
      "Manufacturer: Vendor Industries B.V.",
      "Model: DryAir 4-Series",
      "Serial: DA4-220947",
      "",
      "Scope: Operation, weekly maintenance, and shutdown",
      "procedure for the Drying Oven 4 unit installed at the",
      "Holliday Pigment Calcination site.",
      "",
      "This document is the supplier-issued manual reformatted",
      "for in-app distribution. Page numbers and section",
      "references mirror the printed copy held by maintenance.",
    ],
  },
  {
    title: "1. Operation",
    body: [
      "1.1 Pre-start",
      "Confirm the upstream press is producing within spec",
      "before the oven is brought online. Cold briquettes hold",
      "moisture above the kiln tolerance and will be diverted.",
      "",
      "1.2 Setpoints",
      "Inlet temperature: 110 deg C (range 95-125)",
      "Outlet temperature: 75 deg C (range 60-85)",
      "Belt speed: 0.20 m/s (range 0.15-0.30)",
      "Air flow: 4,200 m3/h (range 3,800-4,800)",
      "",
      "1.3 Startup sequence",
      "Pre-heat 20 minutes before charging. Hold setpoints",
      "for 5 minutes before opening the inlet damper.",
    ],
  },
  {
    title: "2. Maintenance",
    body: [
      "2.1 Daily",
      "- Inspect belt tracking and tension",
      "- Confirm differential pressure across the bag-house",
      "  is within 1.0-1.8 kPa",
      "- Drain condensate from the moisture trap",
      "",
      "2.2 Weekly",
      "- Lubricate belt bearings (Vendor part LB-220)",
      "- Replace bag-house filters if dP > 1.8 kPa",
      "- Inspect heating elements for discoloration",
      "",
      "2.3 Monthly",
      "- Calibrate inlet and outlet thermocouples",
      "- Tighten belt tension to 220 N target",
      "- Check insulation panels for damage",
    ],
  },
  {
    title: "3. Shutdown and Faults",
    body: [
      "3.1 Normal shutdown",
      "Close the inlet damper, allow belt to cycle empty",
      "for 5 minutes, then ramp heaters down at 5 deg C/min.",
      "",
      "3.2 Emergency shutdown",
      "Press the red mushroom on the local panel. Heaters",
      "trip immediately, belt continues at 50% to clear.",
      "",
      "3.3 Common faults",
      "- E-101 Inlet temperature low: check element fuse",
      "- E-102 Outlet temperature high: check air flow",
      "- E-201 Belt slip: re-tension or replace belt",
      "- E-301 Bag-house dP high: replace filters",
      "",
      "Vendor support: +31 20 555 4231",
      "Service contract reference: SC-HOL-2026-OV4",
    ],
  },
]

/**
 * Build the PDF as a Uint8Array. Returns ~6-8 KB.
 */
export async function buildDryingOvenPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle("Drying Oven 4 — Vendor Manual")
  pdfDoc.setAuthor("Vendor Industries B.V.")
  pdfDoc.setSubject("HOL-OPS-MAN-0002")
  pdfDoc.setCreator("Oppr DOCS")

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  for (const [pageIndex, spec] of PAGES.entries()) {
    const page = pdfDoc.addPage([595, 842]) // A4 in points
    const { width, height } = page.getSize()

    // Title bar
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width,
      height: 80,
      color: pageIndex === 0 ? ORANGE : rgb(0.97, 0.97, 0.98),
    })
    page.drawText(spec.title, {
      x: 48,
      y: height - 50,
      size: pageIndex === 0 ? 24 : 18,
      font: fontBold,
      color: pageIndex === 0 ? rgb(1, 1, 1) : SLATE,
    })

    // Body
    let y = height - 120
    for (const line of spec.body) {
      const isHeader = /^\d+\.\d+/.test(line) || line === ""
      page.drawText(line, {
        x: 48,
        y,
        size: 11,
        font: isHeader && line ? fontBold : font,
        color: SLATE,
      })
      y -= line === "" ? 8 : 18
      if (y < 80) break
    }

    // Footer
    page.drawText(`Page ${pageIndex + 1} of ${PAGES.length}`, {
      x: width - 100,
      y: 40,
      size: 9,
      font,
      color: MUTED,
    })
    page.drawText("HOL-OPS-MAN-0002 · DryAir 4-Series", {
      x: 48,
      y: 40,
      size: 9,
      font,
      color: MUTED,
    })
  }

  return await pdfDoc.save()
}
