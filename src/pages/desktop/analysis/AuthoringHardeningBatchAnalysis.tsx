// Case file for the 2026-06-10 authoring-hardening batch: nine workstreams
// from a founder screenshot review, shipped in one pass. Static React doc.

import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function AuthoringHardeningBatchAnalysis() {
  return (
    <AnalysisLayout
      title="Authoring hardening — naming lifecycle, pills, images, PDF, minimal seed"
      subtitle="Nine workstreams from a screenshot review of a real authoring session: the image library couldn't answer 'which document uses this', imported figures landed full-width, dragging an image duplicated it at 100%, launch-log pills didn't match the other pills and never reached the sidebar, legacy documents failed validation because location/discipline lived only inside the naming code, and the PDF export buried linked machines in 'Appendices' while dropping diagram backgrounds. All shipped, plus a full DB reset to a two-document test set."
      date="2026-06-10"
      scopes={["desktop", "data-model"]}
    >
      <RootCausesSection />
      <ShippedSection />
      <NamingLifecycleSection />
      <SeedSection />
      <CleanupSection />
      <VerificationSection />
      <BatchTwoSection />
    </AnalysisLayout>
  )
}

const BATCH2: Array<[string, string]> = [
  [
    "Stale-tab diagnosis",
    "Most 'missing' batch-1 changes were an already-open tab running the old bundle while Convex live-pushed the new data into it (new seed docs + logs visible, new UI not). The deployment was READY; a hard refresh resolves it. Verified by fetching the live index.html (asset hash matches the new build).",
  ],
  [
    "Version-aware reading + export",
    "Real bug: the read page's 'View this version' set state that nothing consumed — the body always rendered the serving version and the PDF dialog exported it too. Now documents.getVersionByNumber feeds both: the version override actually swaps the rendered body, /docs/:id?v=N deep-links an edition, and the PDF button exports exactly the version on screen. With a fork in progress the banner offers View v2 draft / View live v1; the draft banner states that the PDF exports the draft.",
  ],
  [
    "PDF dialog reframed",
    "'Publish to PDF' renamed — button is PDF, the dialog is an export of the viewed version with code · vN · status shown, watermark defaulting to Draft for unpublished editions. Edit page toasts 'Draft saved' before opening it. False 'popup blocker' toast fixed (the window opened but the null-check misfired).",
  ],
  [
    "Cover settings",
    "New single-row coverSettings table + 'PDF cover' tab on /templates: company name, header/footer text, logo (image library), title size, page numbers, confidentiality label, default watermark, accent color. Every export consumes the saved setup — no per-document chooser.",
  ],
  [
    "Library fork chip",
    "Status column is one line: StatusBadge + amber GitBranch chip (v2 draft) linking straight to /docs/:id?v=2.",
  ],
  [
    "Modal consistency",
    "Native confirm() removed from TemplatesPage (delete template) and SettingsPage (re-embed) — both now shadcn AlertDialogs. The create-new-version dialog gained a static-vs-dynamic breakdown: what carries over editable (body, derived links, roles) vs what never changes (naming code, filing, the live version's history).",
  ],
  [
    "Editor polish",
    "Toolbar safety palette now uses the same icon+label list form as the on-block CHANGE TYPE menu (grouped Danger/Warning/Notice/Tip). Version-history drawer dropped the TIPTAP chip. Diagram builder: Import template got an icon; Background image moved out of the dropdown into the palette rail.",
  ],
]

function BatchTwoSection() {
  return (
    <Section
      title="Batch 2 — same-day follow-up (review round)"
      description="The founder re-reviewed on the live deployment; one real regression-class bug (version viewing), several reframes, and one new subsystem (cover settings)."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-52">Item</TableHead>
            <TableHead>What changed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {BATCH2.map(([item, change]) => (
            <TableRow key={item}>
              <TableCell className="align-top text-xs font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {item}
                </span>
              </TableCell>
              <TableCell className="align-top text-xs text-muted-foreground">
                {change}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  )
}

function RootCausesSection() {
  return (
    <Section
      title="Root causes worth remembering"
      description="The three real bugs in the batch — the rest was missing capability, not breakage."
    >
      <div className="space-y-3">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Image drag-drop duplicated at full width</AlertTitle>
          <AlertDescription className="pt-1.5 text-xs">
            The <code>&lt;img&gt;</code> inside the React node view was natively
            draggable, so the browser's own image drag won the race against
            ProseMirror. The drop inserted a brand-new image node from the URL
            payload — default attrs, so width 100%. Fix in{" "}
            <code>ImageWithRef.tsx</code>: <code>draggable=false</code> on the
            img, <code>draggable + data-drag-handle</code> on the wrapper so
            ProseMirror owns the gesture and the drop MOVES the node with attrs
            intact.
          </AlertDescription>
        </Alert>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            "Location is required" on documents that clearly had one
          </AlertTitle>
          <AlertDescription className="pt-1.5 text-xs">
            Documents created before the location/discipline columns existed
            store that information only inside the naming code
            (HOL-OPS-WI-0001). The metadata panel showed em-dashes, zod failed
            every save, and the PDF button (which saves first) was blocked.
            Worse: the dropdowns were editable, so you could set AMS/MAI under
            a HOL-OPS code. Fix: the naming code is now parsed as the source of
            truth (<code>parseNamingCode</code>, client + server), values are
            backfilled on hydrate and on save, and the selects lock once a code
            exists.
          </AlertDescription>
        </Alert>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Diagram backgrounds missing from the PDF</AlertTitle>
          <AlertDescription className="pt-1.5 text-xs">
            Diagram models embed their background as a Convex storage URL inside
            the cached SVG (<code>&lt;image href&gt;</code>). The print window
            auto-prints ~350 ms after opening — before the remote image loads.
            Fix: the export dialog fetches each background up front, inlines it
            as a data URL, and <code>buildPrintDoc</code> substitutes it into
            the SVG, making the artifact self-contained.
          </AlertDescription>
        </Alert>
      </div>
    </Section>
  )
}

const SHIPPED: Array<[string, string, string]> = [
  [
    "Image library",
    "Group-by-document view (StatusBadge per group, orphans last), document status in the flat list's Used-in column, Diagrams tab now lists every diagram node found in current versions with SVG preview + source doc.",
    "ImageLibraryPage.tsx · convex/images.ts (listDiagrams) · convex/lib/imageWalker.ts",
  ],
  [
    "Importer image size",
    "Extracted figures and StructuredDoc images insert at width 35%, centered — enlarge in the editor instead of shrinking every figure.",
    "src/lib/import/buildTiptap.ts · renderToTiptap.ts",
  ],
  [
    "Image drag-drop",
    "Dragging an image moves the node (size/align preserved); no more full-width duplicates.",
    "ImageWithRef.tsx",
  ],
  [
    "Launch-log pills",
    "Restyled to match the asset/reference chips (text-xs font-medium, sky tone, mono code). Node carries a code attr; picker shows code + name; the modal shows the code chip.",
    "LaunchLogBlock.tsx",
  ],
  [
    "Linked logs in the sidebar",
    "New body walker derives launched logs into a sky 'Linked logs' card next to Linked machines / Reference documents, on both the edit and new pages.",
    "src/lib/bodyLogs.ts · MetadataPanel.tsx · DocumentEditPage.tsx · DocumentNewPage.tsx",
  ],
  [
    "Shortcuts hint",
    "Info icon at the toolbar's right edge; hover card lists the live TipTap bindings (Ctrl+Alt+1/2/3 headings, Ctrl+B/I, Ctrl+Shift+7/8 lists, Ctrl+Shift+S strike, Ctrl+Alt+C code block, undo/redo, slash menu).",
    "DocumentEditor.tsx",
  ],
  [
    "PDF export",
    "Compact one-page title with a large mono code badge + PPE band; 'Document overview' front-matter page right after it (revision history, linked machines always on, NEW linked-logs table, references) — no more 'Appendices'; tinted section styling matching the in-app cards; diagram backgrounds inlined.",
    "buildPrintDoc.ts · printStyles.ts · PublishToPdfDialog.tsx",
  ],
  [
    "Placeholder logs",
    "logs table gains an optional code; five placeholders seeded: AMS-OPS-LOG-0001 Extruder cleaning, 0002 Daily handover, 0003 Quality check — Mixer, 0004 Maintenance round, 0005 Press reject capture.",
    "convex/schema.ts · convex/seedMinimal.ts",
  ],
]

function ShippedSection() {
  return (
    <Section title="What shipped" description="One row per workstream.">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Area</TableHead>
            <TableHead>Change</TableHead>
            <TableHead className="w-72">Files</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SHIPPED.map(([area, change, files]) => (
            <TableRow key={area}>
              <TableCell className="align-top text-xs font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {area}
                </span>
              </TableCell>
              <TableCell className="align-top text-xs text-muted-foreground">
                {change}
              </TableCell>
              <TableCell className="align-top font-mono text-[11px] text-muted-foreground">
                {files}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  )
}

function NamingLifecycleSection() {
  return (
    <Section
      title="Naming-code lifecycle — the system"
      description="One rule closes every edge case from the screenshots: the code is the identity, filing is derived from it, and changing filing mints a new document."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Creating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <div>
              Compose and PDF-import flows require location + discipline + type
              before the first save (zod gate, required asterisks); the code is
              allocated server-side from the per-triplet counter.
            </div>
            <div>
              Importer pre-drafts carry no code and burn no sequence number
              until the first real save promotes them — the save is rejected
              until filing is set.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Editing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <div>
              With a code present, location/discipline/type are greyed out and
              the code box renders as locked. <code>saveContent</code> ignores
              type drift and backfills missing filing from the code.
            </div>
            <div>
              Saved reviewer/approver assignments hydrate back into the review
              flow on open.
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-primary" />
              Changing filing — documents.refile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <div>
              "Need a different filing? Create a new document…" under the locked
              code opens a dialog: pick the new triplet, preview the next code
              (old → new), and confirm. The mutation copies the current
              version's body, chunks, roles, and derived links onto a fresh
              document with a newly allocated code, and (default on) archives
              the old document so two live copies never coexist.
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

function SeedSection() {
  return (
    <Section
      title="Minimal test dataset"
      description="npx convex run seedMinimal:run — wipes every app table (templates + signed-in user preserved) and seeds exactly enough to exercise everything."
    >
      <div className="flex flex-wrap gap-1.5 pb-2">
        <Badge variant="outline" className="font-mono">AMS-OPS-MAN-0001 · published</Badge>
        <Badge variant="outline" className="font-mono">AMS-OPS-SOP-0001 · draft</Badge>
        <Badge variant="outline" className="font-mono">EXT-201</Badge>
        <Badge variant="outline" className="font-mono">MIX-101</Badge>
        <Badge variant="outline" className="font-mono">AMS-OPS-LOG-0001…0005</Badge>
        <Badge variant="outline">2 stored SVG images</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        The SOP is the test vehicle: two asset pills (EXT-201, MIX-101), a
        reference pill to the manual, one launch-log (AMS-OPS-LOG-0001 with
        code), both images at 35% width, PPE row, warning callout, step list,
        and a troubleshooting table. Its review flow is fully assigned, so
        submit → approve → publish can be walked end to end, and refile can be
        tested against the AMS/HOL × OPS/MNT vocabulary.
      </p>
    </Section>
  )
}

function CleanupSection() {
  return (
    <Section
      title="Cleanup"
      description="Dead code removed; docs brought back to reality."
    >
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>
          Deleted the legacy seed paths: <code>src/admin/</code>{" "}
          (buildSeedPayload / seedDataset / seedBodies / referenceDoc),{" "}
          <code>convex/seed.ts</code>, <code>convex/reset.ts</code>,{" "}
          <code>convex/seedAssets.ts</code> — superseded by{" "}
          <code>convex/seedMinimal.ts</code>; <code>convex/admin.ts wipeAll</code>{" "}
          remains the CLI full wipe.
        </li>
        <li>
          Deleted <code>NamingCodeField.tsx</code> (client-side max-scan
          suggestion, hard-coded HOL/OPS — replaced by server-side allocation
          long ago, no remaining imports).
        </li>
        <li>
          CLAUDE.md, oppr-docs-status.md, and README.md rewritten off the dead
          sql.js/IndexedDB architecture onto the Convex reality.
        </li>
      </ul>
    </Section>
  )
}

function VerificationSection() {
  return (
    <Section title="Verification">
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>
          <code>npx tsc -b</code> and <code>npx vite build</code> exit 0;
          Convex functions pushed to dev:different-newt-869.
        </li>
        <li>
          Seed verified by the CLI run result (2 docs, 2 assets, 5 logs, 2
          images).
        </li>
        <li>
          Visual checks still owed: PDF preview of AMS-OPS-SOP-0001 (front
          matter, PPE band, diagram backgrounds), drag-drop feel, and the
          refile dialog flow in the browser.
        </li>
      </ul>
    </Section>
  )
}
