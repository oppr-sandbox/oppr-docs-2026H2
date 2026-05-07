// Editor overhaul — investigates the cluster of problems exposed during the
// first round of image-library + page-header testing, and proposes a coherent
// editor refresh that covers: image preview + resize, link dialog, table
// controls, toolbar grouping, document-creation flow, editor-state coherence,
// and print/preview fidelity. Static React doc — no feature code.

import {
  AlertTriangle,
  ArrowRight,
  Bold,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code,
  Edit,
  Eye,
  EyeOff,
  FileDown,
  FileText,
  Hash,
  HardHat,
  Heading1,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Palette,
  Play,
  PlusCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Type,
  Upload,
  User,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function EditorOverhaulAnalysis() {
  return (
    <AnalysisLayout
      title="Editor overhaul — image preview, toolbar, tables, document flow, print"
      subtitle="Eight related issues surfaced in the first round of testing the image-library + page-header changes. They share a single underlying problem: the editor stack grew organically and is no longer coherent. This proposes a single coordinated refresh covering the live editor, the new-document flow, the editor state model, and the print pipeline."
      date="2026-05-07"
      scopes={["desktop", "data-model"]}
    >
      <ProblemSection />
      <EvidenceSection />
      <IssueInventorySection />
      <ImagePreviewSection />
      <ImageResizeSection />
      <LinkDialogSection />
      <TableControlsSection />
      <ToolbarSection />
      <NewDocumentFlowSection />
      <EditorStateSection />
      <PrintFidelitySection />
      <ConstructionSopExtrasSection />
      <SelfGrillingSection />
      <ImplementationPlanSection />
      <OpenQuestionsSection />
    </AnalysisLayout>
  )
}

function ProblemSection() {
  return (
    <Section title="Problem">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Eight issues, one underlying drift.</AlertTitle>
        <AlertDescription className="space-y-1.5 pt-1.5 text-xs">
          <div>
            We just shipped the image library + page-header refresh. Testing
            shows: uploaded images render as a broken alt-text fallback in the
            editor (and in print); link insertion still uses{" "}
            <code>window.prompt</code>; tables auto-fit width and have no
            column controls; the toolbar has a "More" dropdown when there is
            obvious horizontal space; "Switch to PDF import" reads like a
            mid-edit toggle when it is really a creation-time choice; the new
            and edit pages have inconsistent action sets (Save / Submit /
            Publish / Hide metadata); and the printed PDF puts the revision
            block on page 2 when it belongs on the title page.
          </div>
          <div>
            Individually each is a bug or a polish item. Together they signal
            that the editor stack — toolbar, node extensions, document
            lifecycle, and print pipeline — has grown organically and is no
            longer coherent. The fix is a coordinated refresh, not eight
            separate patches.
          </div>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function EvidenceSection() {
  return (
    <Section
      title="Evidence — four screenshots from the same session"
      description="Each tab is one screenshot with a caption pointing at the issues it shows."
    >
      <Tabs defaultValue="image">
        <TabsList className="flex-wrap">
          <TabsTrigger value="image">Image preview</TabsTrigger>
          <TabsTrigger value="toolbar">Toolbar &amp; tables</TabsTrigger>
          <TabsTrigger value="edit">Edit page actions</TabsTrigger>
          <TabsTrigger value="print">Print fidelity</TabsTrigger>
        </TabsList>
        <TabsContent value="image">
          <ScreenshotCard
            src="/analysis/editor-overhaul/image-broken-preview.png"
            caption="New document page — image is uploaded successfully (toast confirmed dedup behavior in the previous frame), but renders as the broken-image alt-text fallback. The src attribute on the inserted node is empty, and the React node view renders only when its dataImageId resolves; in some flow it never does."
          />
        </TabsContent>
        <TabsContent value="toolbar">
          <ScreenshotCard
            src="/analysis/editor-overhaul/toolbar-more-menu.png"
            caption='The "More" dropdown is open. There are six items in it (Strikethrough, Numbered list, Quote, Code block, Image, HR, Numbered steps, Diagram, PPE picker) — but the toolbar has roughly 600px of empty space to the right of "More". The menu exists because the toolbar was sized for narrower layouts that no longer exist. Tables: header coloring is fine but every column is the same width, columns auto-resize as text is typed, no way to set widths.'
          />
        </TabsContent>
        <TabsContent value="edit">
          <ScreenshotCard
            src="/analysis/editor-overhaul/edit-page-busy.png"
            caption='Edit page after publishing. Top action strip: "Hide metadata", "Publish to PDF", "View", "Save draft", "Submit", "Publish". Six actions, three of them (Save / Submit / Publish) overlap conceptually. Compare with the New document page in the first screenshot which has only "Switch to PDF import" + "Create document". Two states, totally different action shapes.'
          />
        </TabsContent>
        <TabsContent value="print">
          <ScreenshotCard
            src="/analysis/editor-overhaul/print-revision-page2.png"
            caption='Print view. Title page has the document name, code, version, owner, dates, type, tags. Then a hard page break. On page 2: a "Revision history" block, a "Linked assets" block, then the body. The title page has a large empty area; the revision history would fit there and would be in the right reading order ("front matter" before content).'
          />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function ScreenshotCard({ src, caption }: { src: string; caption: string }) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <img
          src={src}
          alt="Screenshot"
          className="w-full rounded-md border"
        />
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

interface IssueRow {
  id: string
  area: "image" | "link" | "table" | "toolbar" | "flow" | "state" | "print"
  issue: string
  evidence: string
  severity: "high" | "med" | "low"
}

const ISSUES: IssueRow[] = [
  {
    id: "A",
    area: "image",
    issue: "Uploaded image renders as alt-text fallback in editor + print",
    evidence:
      "DocumentEditor.tsx setImage call passes src=''. ImageWithRef.tsx node view conditionally renders <img> only when src resolves. First mount of the inserted node gets src='', dataImageId set, query in flight → renders the 'Resolving image…' placeholder OR the alt fallback. Same node body when round-tripped to print emits <img src=''> through buildPrintDoc.",
    severity: "high",
  },
  {
    id: "B",
    area: "image",
    issue: "No image resize handles",
    evidence:
      "TipTap Image extension is base — no size attribute, no drag handle. Authors can only insert at native dimensions. For wide screenshots this means full-bleed in print and editor.",
    severity: "high",
  },
  {
    id: "C",
    area: "link",
    issue: "Link insertion still uses window.prompt",
    evidence:
      "DocumentEditor.tsx:563 calls window.prompt('Link URL'). Inconsistent with the new InsertImageDialog. Also no link target / rel options, no validation.",
    severity: "high",
  },
  {
    id: "D",
    area: "table",
    issue: "Tables auto-fit width, columns auto-resize as text is typed",
    evidence:
      "Table.configure({ resizable: false }) in DocumentEditor.tsx:287 and TiptapReadOnly.tsx:48. resizable=false means TipTap's column resize handles are off, so columns fall back to auto-width based on content.",
    severity: "med",
  },
  {
    id: "E",
    area: "table",
    issue: "No header coloring, no row banding, no cell shading",
    evidence:
      "Table extension uses default rendering. Print CSS does some header backgrounding (printStyles.ts) but the editor view shows the default unshaded table.",
    severity: "med",
  },
  {
    id: "F",
    area: "toolbar",
    issue: '"More" dropdown is unnecessary at current widths',
    evidence:
      'Toolbar overflow is hidden in a More menu, but the desktop editor canvas has 600px+ free to the right of the toolbar at typical viewport widths. Six common actions (Strikethrough, Quote, Code, Image, HR, Steps, Diagram, PPE) live there.',
    severity: "med",
  },
  {
    id: "G",
    area: "toolbar",
    issue: "No grouping or visual hierarchy in the ribbon",
    evidence:
      'Buttons are rendered in roughly insertion order, with one ToolbarDivider but no headers. Custom blocks (Callout, PPE, Hashtag, Launch log) live next to text formatting (Bold, Italic, Bullet list) without visual separation.',
    severity: "med",
  },
  {
    id: "H",
    area: "flow",
    issue: '"Switch to PDF import" reads as a mid-edit toggle, not a creation choice',
    evidence:
      'On /docs/new, "Switch to PDF import" is in the page header action slot next to "Create document". Once the user has typed body content, clicking it discards everything (with no confirmation) — the toggle is destructive and the framing implies it is non-destructive.',
    severity: "med",
  },
  {
    id: "I",
    area: "state",
    issue: "New document and Edit document pages have inconsistent action shapes",
    evidence:
      "New: Switch / Create. Edit: Hide metadata, Publish to PDF, View, Save draft, Submit, Publish. Six actions, three overlapping (Save/Submit/Publish). 'Hide metadata' only on Edit. The user has to relearn the action set every time the document changes state.",
    severity: "high",
  },
  {
    id: "J",
    area: "state",
    issue: "Editor width changes between New, Edit, and Read",
    evidence:
      'New document: full-width centered card, no metadata panel. Edit: dual-column with metadata panel on right. Read: single column with TOC rail. The visual reset between phases is jarring.',
    severity: "low",
  },
  {
    id: "K",
    area: "print",
    issue: "Revision block lands on page 2",
    evidence:
      "buildPrintDoc.ts emits the title page as its own <section> with page-break-after: always (printStyles.ts:122). The revision block is then rendered inside the body section, which always starts on a new page. It belongs on the title page in the empty space below the header card.",
    severity: "med",
  },
  {
    id: "L",
    area: "print",
    issue: "Body image appears as alt-text fallback in print too",
    evidence:
      "Same root cause as A. The TipTap body JSON has the dataImageId attr but no resolved src. buildPrintDoc.ts renderTipTapDoc re-emits the empty src. Print sees <img src=''> and renders the alt-text fallback the browser provides.",
    severity: "high",
  },
]

function IssueInventorySection() {
  return (
    <Section
      title="Issue inventory"
      description="Twelve issues, grouped by area, ranked by severity. Each has a row in this table; each gets its own deep-dive section below."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[10%]">Area</TableHead>
                <TableHead className="w-[28%]">Issue</TableHead>
                <TableHead className="w-[47%]">Evidence</TableHead>
                <TableHead className="w-[10%]">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ISSUES.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="align-top font-mono text-xs">
                    {it.id}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline" className="text-[10px]">
                      {it.area}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-xs font-medium">
                    {it.issue}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {it.evidence}
                  </TableCell>
                  <TableCell className="align-top">
                    <SeverityBadge sev={it.severity} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  )
}

function SeverityBadge({ sev }: { sev: "high" | "med" | "low" }) {
  return (
    <Badge
      className={cn(
        "text-[10px]",
        sev === "high"
          ? "bg-red-500/15 text-red-700 dark:text-red-300"
          : sev === "med"
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-muted text-muted-foreground",
      )}
    >
      {sev}
    </Badge>
  )
}

function ImagePreviewSection() {
  return (
    <Section
      title="Issue A — broken image preview"
      description="The single most urgent fix. Without this, the new image library is unusable."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            <strong>Root cause hypothesis.</strong> When the InsertImageDialog
            inserts the node, it calls{" "}
            <code>insertContent(&#123; type: "image", attrs: &#123; src: "",
            alt, "data-image-id": id &#125; &#125;)</code>. The browser then
            paints an <code>&lt;img src=""&gt;</code> immediately while the
            React node view boots and the <code>api.images.urlFor</code> query
            fires. Until the query resolves, the node view falls back to the
            alt-text placeholder. On a slow-ish first paint or if the node
            view isn't re-rendering when the query resolves, the user sees
            "broken image" forever.
          </p>
          <p>
            <strong>Two reinforcing problems.</strong>
          </p>
          <ol className="ml-6 list-decimal space-y-1 text-xs">
            <li>
              The default <code>renderHTML</code> on the Image extension
              still emits <code>&lt;img src=""&gt;</code>, so when the body
              JSON is rendered without the React node view (e.g. in print),
              there is nothing to resolve the URL.
            </li>
            <li>
              The InsertImageDialog calls{" "}
              <code>insertContent</code> with no <code>src</code>. Even when
              the URL is known at insert time we are not stashing it.
            </li>
          </ol>
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Proposed fix — two changes</AlertTitle>
            <AlertDescription className="space-y-1.5 pt-1.5 text-xs">
              <div>
                <strong>(1) At insert time, fetch the signed URL once</strong>{" "}
                and stash it in <code>src</code>. The node view still resolves
                via <code>data-image-id</code> on subsequent renders (because
                the signed URL expires) but the first paint is correct.
              </div>
              <div>
                <strong>(2) Print pipeline resolves URLs server-side</strong>.{" "}
                <code>buildPrintDoc.ts</code>'s <code>renderTipTapDoc</code>{" "}
                walks the body, finds <code>data-image-id</code> attrs, and
                queries <code>api.images.urlFor</code> via the print
                window's Convex client to substitute fresh URLs into{" "}
                <code>img.src</code> before paint. Or simpler: pass a{" "}
                <code>imageUrlMap</code> prop (Map&lt;imageId, url&gt;) into{" "}
                <code>buildPrintDoc</code>, pre-resolved by the caller, and
                substitute by string replacement.
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function ImageResizeSection() {
  return (
    <Section
      title="Issue B — image resize"
      description="Authors need to control how big an image is. Native TipTap Image has no resize."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            Two options ranked by complexity:
          </p>
          <Option
            n={1}
            title="Three preset widths — small / medium / full (recommended)"
            body="Add a `width` attribute to ImageWithRef with three values (33%, 66%, 100%). The node view renders a small popover when the image is selected, with three radio chips. Print pipeline reads the same attr. No drag-handle UX, no per-pixel control. Predictable in print. Consistent across authors. Aligned with the 'keep simple, ensure consistency' principle."
            tradeoff="Less flexible than free resize. Authors with a wide chart and a portrait phone screenshot get the same three options."
          />
          <Option
            n={2}
            title="Free drag-resize with min/max bounds"
            body="Use a community extension (e.g. tiptap-extension-resize-image) or roll one. Adds a corner drag handle. Stores width in px or % per node."
            tradeoff="Inconsistent results across authors. Users will produce 471px-wide images that look weird in print at A4 width. Recommend against for v1."
          />
          <p className="text-muted-foreground">
            Lean: option 1 ships now. Option 2 stays on the parking lot until
            we have evidence three sizes aren't enough.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

function Option({
  n,
  title,
  body,
  tradeoff,
}: {
  n: number
  title: string
  body: string
  tradeoff: string
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
          {n}
        </span>
        <div className="space-y-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{body}</div>
          <div className="text-[11px] italic text-muted-foreground">
            Trade-off: {tradeoff}
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkDialogSection() {
  return (
    <Section
      title="Issue C — link insertion still uses window.prompt"
      description="Replace with a small modal mirroring InsertImageDialog's URL tab."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            <code>setLink()</code> at <code>DocumentEditor.tsx:560</code>{" "}
            calls <code>window.prompt</code>. The user types a URL with no
            label, no validation, no target, no choice between in-app and
            external.
          </p>
          <p>
            <strong>Proposed dialog:</strong> single-tab modal. Two fields:
            URL (required) and Display text (defaults to the selected text in
            the editor, editable). Two checkboxes: "Open in new tab" and "Add
            nofollow" (both default off). One inline validator that nudges
            the user when the URL doesn't have a scheme. On unset, an Unlink
            button at the bottom-left.
          </p>
          <Alert>
            <LinkIcon className="h-4 w-4" />
            <AlertDescription className="text-xs">
              For internal links to other Oppr DOCS documents, the URL field
              accepts a naming code (e.g. <code>HOL-OPS-SOP-0001</code>) and
              resolves to <code>/docs/&lt;id&gt;</code> server-side. Saves
              authors from copying URLs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function TableControlsSection() {
  return (
    <Section
      title="Issues D + E — table column control + simple coloring"
      description="Keep the surface area small. Authors get header coloring, row banding, three column widths per cell, and a small 'merge / split' affordance. No spreadsheet UX."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            <strong>Column widths.</strong> Enable TipTap's{" "}
            <code>columnResizing</code> with a minimum of 80px. Add a small
            grip handle on column borders that snaps to one of three preset
            widths (narrow / normal / wide) — the author can also drag to a
            specific px value but the preset chips are the path of least
            resistance.
          </p>
          <p>
            <strong>Coloring (basic palette).</strong> A small bubble menu
            appears when a cell is selected. Two controls:
          </p>
          <ul className="ml-6 list-disc space-y-1 text-xs">
            <li>
              <strong>Header row toggle.</strong> Promotes the first row to a
              header, applies the standard header background. Off by default.
            </li>
            <li>
              <strong>Cell tint.</strong> 5 named tints — none, gray, blue,
              amber, green. Applied via a <code>data-tint</code> attribute and
              a CSS map. Same five tints in editor, read view, and print.
              No custom colors. Same palette your safety callouts already
              use, so docs feel cohesive.
            </li>
          </ul>
          <p>
            <strong>What we will NOT add.</strong> Per-cell font sizes,
            borders, background images, font color picker, conditional
            formatting, formulas. Cited in the 'keep simple' constraint.
          </p>

          <Card className="bg-muted/20">
            <CardContent className="pt-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preview — proposed cell-tint palette
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Hazard</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>Verify isolation</TableCell>
                    <TableCell className="bg-emerald-500/10">
                      Low
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2</TableCell>
                    <TableCell>Vent residual gas</TableCell>
                    <TableCell className="bg-amber-500/10">
                      Medium
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>3</TableCell>
                    <TableCell>Open vessel</TableCell>
                    <TableCell className="bg-red-500/10">
                      High
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Section>
  )
}

function ToolbarSection() {
  return (
    <Section
      title="Issues F + G — toolbar grouping, no More menu"
      description="Re-lay the toolbar into 4 named groups separated by dividers. Drop the More dropdown — there's room for the items it hides."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            <strong>Proposed groups, left to right.</strong>
          </p>
          <div className="space-y-3">
            <ToolbarGroupCard
              name="Text"
              icon={Type}
              items={[
                { icon: Heading1, label: "Heading" },
                { icon: Bold, label: "Bold" },
                { icon: Italic, label: "Italic" },
                { icon: Strikethrough, label: "Strike" },
                { icon: Quote, label: "Quote" },
                { icon: Code, label: "Code" },
              ]}
              note="Paragraph picker (Heading 1/2/3 / Body) becomes a small left-most select instead of a dropdown menu. B/I/S inline. Quote and Code complete the text family."
            />
            <ToolbarGroupCard
              name="Lists"
              icon={List}
              items={[
                { icon: List, label: "Bullet" },
                { icon: ListOrdered, label: "Numbered" },
                { icon: ListChecks, label: "Steps" },
              ]}
              note="Three list variants in one cluster. 'Steps' is the SOP-specific numbered-step block we already have — promoted to first-class."
            />
            <ToolbarGroupCard
              name="Insert"
              icon={PlusCircle}
              items={[
                { icon: LinkIcon, label: "Link" },
                { icon: ImageIcon, label: "Image" },
                { icon: TableIcon, label: "Table" },
                { icon: Hash, label: "HR" },
              ]}
              note="Things you bring INTO the doc. Link uses the new dialog. Image opens InsertImageDialog. Table inserts a 3×3 default with the new column-resize + tint affordances. HR is a horizontal rule."
            />
            <ToolbarGroupCard
              name="Safety &amp; Procedure"
              icon={ShieldCheck}
              items={[
                { icon: AlertTriangle, label: "Callout" },
                { icon: HardHat, label: "PPE" },
                { icon: Hash, label: "Diagram" },
                { icon: Play, label: "Launch log" },
                { icon: Edit, label: "Asset link" },
              ]}
              note="Custom Oppr-specific blocks. Visually separated so authors know this is the 'this is for SOPs' family, not standard rich-text editing."
            />
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Total ribbon height stays at h-10. Group labels are visible only
            on viewports ≥ 1280px; on narrower screens the group dividers
            stay but labels collapse to icons-only. The "More" dropdown is
            removed; if a future feature needs to overflow, we add it to the
            most relevant group rather than a generic spillover.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

function ToolbarGroupCard({
  name,
  icon: Icon,
  items,
  note,
}: {
  name: string
  icon: typeof Type
  items: Array<{ icon: typeof Bold; label: string }>
  note: string
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <div
          className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: name }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1 rounded border bg-background p-1.5">
        {items.map((it) => {
          const I = it.icon
          return (
            <Button
              key={it.label}
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={it.label}
            >
              <I className="h-3.5 w-3.5" />
            </Button>
          )
        })}
      </div>
      <div className="mt-1.5 text-[11px] italic text-muted-foreground">
        {note}
      </div>
    </div>
  )
}

function NewDocumentFlowSection() {
  return (
    <Section
      title="Issue H — new-document creation flow"
      description="Replace the 'Switch to PDF import' toggle with an explicit creation chooser."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            <strong>Today.</strong> Click "+ New document" → land on{" "}
            <code>/docs/new</code> with the TipTap editor + metadata form +
            "Switch to PDF import" button. Click that button → land on{" "}
            <code>/docs/new?kind=pdf</code> with the PDF dropzone. Switching
            back is undoable. Switching mid-edit silently loses content.
          </p>
          <p>
            <strong>Proposed.</strong> "+ New document" goes to a new
            chooser page, <code>/docs/new</code>:
          </p>
          <CreationChooserMock />
          <p>
            Click "Compose new" → <code>/docs/new/compose</code> (TipTap
            editor + metadata, no Switch toggle). Click "Import PDF" →{" "}
            <code>/docs/new/import</code> (PDF dropzone + metadata, no
            Switch toggle). The mode is committed on click; changing your
            mind means going back to the chooser, which warns "you'll lose
            anything you typed in this draft".
          </p>
          <p className="text-muted-foreground">
            This is also where we surface a third option later if needed
            ("Generate with AI", "From template") — the chooser is the
            extensibility seam.
          </p>
        </CardContent>
      </Card>
    </Section>
  )
}

function CreationChooserMock() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="cursor-pointer hover:border-primary">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <FileText className="h-10 w-10 text-primary" />
          <div className="text-sm font-semibold">Compose new</div>
          <div className="text-[11px] text-muted-foreground">
            Open the rich-text editor with a template for your document type.
            Author SOPs, manuals, work instructions inline.
          </div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:border-primary">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <Upload className="h-10 w-10 text-primary" />
          <div className="text-sm font-semibold">Import PDF</div>
          <div className="text-[11px] text-muted-foreground">
            Upload an existing PDF. We extract per-page text, register it
            for retrieval, and serve it through the read view.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EditorStateSection() {
  return (
    <Section
      title="Issues I + J — coherent state model across new / draft / in_review / published"
      description="Define the canonical states and the action set for each. Same shape on every page."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            <strong>Five canonical states.</strong> Every editor surface is
            in exactly one of these. The PageHeader and floating actions key
            off the state.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">State</TableHead>
                <TableHead className="w-[20%]">When</TableHead>
                <TableHead className="w-[34%]">Visible actions</TableHead>
                <TableHead className="w-[32%]">Editor surface</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <StateRow
                state="composing"
                when="/docs/new/compose, no doc record yet"
                actions="Cancel · Save draft"
                surface="TipTap, metadata side panel collapsible. Every save creates the draft and routes to /docs/:id/edit."
              />
              <StateRow
                state="draft"
                when="/docs/:id/edit, status=draft"
                actions="View · Save draft · Submit for review"
                surface="TipTap, metadata side panel collapsible. Body is editable. No version history yet."
              />
              <StateRow
                state="in_review"
                when="/docs/:id/edit, status=in_review"
                actions="View · Withdraw · Approve &amp; publish"
                surface="TipTap, metadata side panel collapsible, read-only ribbon (gray). Body is editable but flagged as 'in review'. Approve flow hides Save draft."
              />
              <StateRow
                state="published"
                when="/docs/:id (read), status=published"
                actions="Edit (creates next version) · Publish to PDF · Print · History"
                surface="TiptapReadOnly, metadata badges below title, no editing. Click Edit → forks v(n+1) draft, switches to draft state."
              />
              <StateRow
                state="archived"
                when="/docs/:id (read), status=archived"
                actions="Restore · Print · History (read-only)"
                surface="TiptapReadOnly, archived watermark, no Edit."
              />
            </TableBody>
          </Table>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Three principles.</strong>{" "}
              (1) <strong>Save draft</strong> is the only "save" — never named
              just "Save".{" "}
              (2) <strong>Publish</strong> is hidden behind "Approve &amp;
              publish" in the in_review state — you can't publish your own
              draft directly, you must Submit then Approve.{" "}
              (3) <strong>Edit</strong> on a published doc creates a NEW
              version automatically — no "Save and version up" confusion.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function StateRow({
  state,
  when,
  actions,
  surface,
}: {
  state: string
  when: string
  actions: string
  surface: string
}) {
  return (
    <TableRow>
      <TableCell className="align-top">
        <Badge variant="outline" className="font-mono text-[10px]">
          {state}
        </Badge>
      </TableCell>
      <TableCell className="align-top text-xs text-muted-foreground">
        {when}
      </TableCell>
      <TableCell className="align-top text-xs">{actions}</TableCell>
      <TableCell className="align-top text-xs text-muted-foreground">
        {surface}
      </TableCell>
    </TableRow>
  )
}

function PrintFidelitySection() {
  return (
    <Section
      title="Issues K + L — print fidelity"
      description="Move the revision block to the title page, resolve image URLs server-side before print."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            <strong>Revision block on title page.</strong> Today the title
            page is a separate <code>&lt;section class="doc-page"&gt;</code>{" "}
            with <code>page-break-after: always</code>. The revision block is
            then prepended to the body section, which begins on a new page.
          </p>
          <p>
            <strong>Fix.</strong>{" "}
            <code>buildPrintDoc.ts:65</code>{" "}
            <code>renderTitlePage</code> takes a new argument{" "}
            <code>versionRows</code> and renders the revision history in the
            empty band below the metadata grid. Body section drops its
            current revision block. Print order becomes: title-card +
            revision-history (page 1) → asset list (still page 2 if
            assets present) → body. Page breaks unchanged elsewhere.
          </p>
          <Separator />
          <p>
            <strong>Image URLs in print.</strong> The print pipeline opens a
            new window, which has no Convex client. Two fixes:
          </p>
          <ol className="ml-6 list-decimal space-y-1 text-xs">
            <li>
              The page that triggers print (<code>DocumentReadPage.tsx</code>{" "}
              or the PublishToPdfDialog) walks the body, collects every{" "}
              <code>data-image-id</code>, batches a query to{" "}
              <code>api.images.urlsFor(ids)</code>, and passes the resolved
              map into <code>buildPrintDoc</code>.
            </li>
            <li>
              <code>buildPrintDoc.renderTipTapDoc</code> substitutes{" "}
              <code>data-image-id="X"</code>{" "}
              <code>src=""</code> with the resolved src from the map. If a
              URL is missing (image deleted, network issue), emit a
              placeholder <code>&lt;span class="img-missing"&gt;</code> so
              we never silently print a broken image.
            </li>
          </ol>
          <Alert>
            <CircleAlert className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Add <code>api.images.urlsFor</code> as a batched query — takes
              an array of imageIds, returns a record. Saves N+1 round-trips
              for docs with many images.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

function ConstructionSopExtrasSection() {
  return (
    <Section
      title="Construction-SOP investigation — what else does the editor need?"
      description="The user explicitly asked: what should the editor have for consistent construction SOPs? This section ranks ten candidates by leverage and effort."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p>
            Construction SOPs share a structure across vendors: title +
            scope, applicable assets, PPE, hazards / LMRA, sequenced steps
            with imagery, sign-off. Ten things would make the editor
            consistently good at producing them.
          </p>
          <ConstructionExtrasGrid />
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="text-xs">
              The first three (LMRA block, document templates from type,
              numbered steps with imagery + sign-off) are the highest leverage
              for construction. The rest can come later or stay parking-lot.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

interface ExtraIdea {
  title: string
  description: string
  leverage: "high" | "med" | "low"
  effort: "S" | "M" | "L"
  icon: typeof ShieldCheck
}

const EXTRA_IDEAS: ExtraIdea[] = [
  {
    title: "First-class LMRA block",
    description:
      "Last-Minute Risk Assessment as a structured block: hazards table (item / severity / control), sign-off line. Already partially modeled via callouts; promote to a dedicated TipTap node so it round-trips reliably.",
    leverage: "high",
    effort: "M",
    icon: ShieldCheck,
  },
  {
    title: "Document type → template body on creation",
    description:
      "templateForType already exists. Surface it visibly: when the user picks SOP / Manual / WI / LMRA in the chooser, the editor opens with the right skeleton (PPE row + Steps + Sign-off for SOP, etc.). Today templates exist but are easy to delete by accident.",
    leverage: "high",
    effort: "S",
    icon: FileText,
  },
  {
    title: "Numbered Steps with sign-off + image slot",
    description:
      "Extend StepListBlock so each step has an optional image (from /images) and a sign-off checkbox. Operators on mobile tick the box; the doc stays canonical, the run produces a record.",
    leverage: "high",
    effort: "M",
    icon: ListChecks,
  },
  {
    title: "Tools / equipment block",
    description:
      "Like PPE, but for tools: 'You will need: torque wrench (35 Nm), bucket, M12 socket'. Structured so tool inventory + procurement can index it.",
    leverage: "med",
    effort: "S",
    icon: HardHat,
  },
  {
    title: "Permit-required indicator",
    description:
      "Boolean on the doc: 'Permit required: hot work / confined space / working at heights / electrical isolation'. Shows in the read view as a bold banner; gates a real permit flow later.",
    leverage: "med",
    effort: "S",
    icon: ShieldCheck,
  },
  {
    title: "Cross-reference to other SOPs",
    description:
      "Inline mention typing '@HOL-' opens an autocomplete listing matching naming codes; selecting one inserts a clickable reference rendered as a chip. Today users paste raw URLs.",
    leverage: "high",
    effort: "M",
    icon: LinkIcon,
  },
  {
    title: "Acceptance criteria block",
    description:
      "Structured 'Done when:' checklist that operators can tick off. Different from steps — it's the verification, not the procedure.",
    leverage: "med",
    effort: "S",
    icon: CheckCircle2,
  },
  {
    title: "Inline measurement / spec table preset",
    description:
      "One-click insertion of a 'Spec' table preset: column 1 'Property', column 2 'Value', column 3 'Tolerance', narrow widths, header tinted. The 5-tint table palette makes this trivially consistent.",
    leverage: "med",
    effort: "S",
    icon: TableIcon,
  },
  {
    title: "Image annotation overlay",
    description:
      "Click an image, drop arrows / circles / numbers as annotations. Stored as a layered SVG over the image. Print-safe. The diagram preset library is the closest existing thing, but it's curated; this would be authored.",
    leverage: "low",
    effort: "L",
    icon: Edit,
  },
  {
    title: "Lockable language regions",
    description:
      "Mark a paragraph as 'do not translate' for the multilingual reading flow when it lands. Useful for safety-critical wording where machine translation could degrade meaning.",
    leverage: "low",
    effort: "S",
    icon: Palette,
  },
]

function ConstructionExtrasGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {EXTRA_IDEAS.map((idea) => {
        const Icon = idea.icon
        return (
          <Card key={idea.title}>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="text-sm font-semibold leading-tight">
                    {idea.title}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Badge
                    className={cn(
                      "text-[9px]",
                      idea.leverage === "high"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : idea.leverage === "med"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {idea.leverage} lev
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">
                    {idea.effort}
                  </Badge>
                </div>
              </div>
              <div className="pl-6 text-xs text-muted-foreground">
                {idea.description}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Hardest counter-questions on this proposal."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Is the 'image src='' empty at insert' really the only root cause for the broken image?"
            a="Probably no. There is a second possibility: the React node view's useQuery does fire, but the editor's prosemirror view doesn't re-render the node view when the query state changes from undefined to the URL. TipTap's React node views need explicit useState/useEffect linkage when external state changes outside of node attrs — useQuery returning a new value doesn't automatically re-trigger ReactNodeViewRenderer. The fix is to pre-resolve the URL at insert time AND keep the node view as a fallback for stale/expired URLs."
          />
          <Grill
            q="Three preset image widths (33/66/100) — is that going to feel limiting?"
            a="It will, for some authors. But the alternative is per-pixel control, which produces inconsistent docs across authors. The same trade-off as the cell-tint palette: 5 named colors, not a picker. The bet is that consistency in the corpus is worth more than per-author flexibility. If we get pushback, add a 'custom' option that snaps to 10% increments."
          />
          <Grill
            q="The state model collapses Save / Submit / Publish into three commands across three states. Is that actually less confusing than today's six buttons?"
            a="Yes if we're disciplined. The trick is naming. 'Save draft' (lowercase 'd' for draft state), 'Submit for review' (clear next-step verb), 'Approve & publish' (consequence verbalised). Today 'Save draft' + 'Submit' + 'Publish' coexist in one row, and a new author can't tell which is the right verb to use. Fewer buttons, each named after its intent, beats more buttons named after their state."
          />
          <Grill
            q="Putting the revision block on the title page — does it crowd a v15+ document?"
            a="At v15+, the revision block has 15 rows. At ~14px line height that's 210px. Title page is ~960px tall on A4. Fine. If a doc reaches v50, we truncate to last-10 with a '5 older revisions omitted — see History in the app' line. Cap at last-10 by default."
          />
          <Grill
            q="Hardest one: adding the construction extras (LMRA block, tool block, permit indicator) means more custom TipTap nodes. The CLAUDE.md pitfall about 'extension lists must mirror' bit us once with tables. Are we trading the editor's complexity for richer SOP output?"
            a="Yes. That's the right trade for the ICP (construction / waste / recycling) but it does compound. Mitigations: (1) every new node ships with both editor AND read-view registration in the same commit, blocked by a tsc rule that errors if a node is registered in only one place — small lint we could write. (2) we cap at the three high-leverage extras for v1.0; the others wait for evidence. (3) the toolbar grouping in the proposal is partly defensive — if 'Safety & Procedure' becomes the home for these blocks, adding a fifth or sixth doesn't crowd 'Insert' or 'Text'."
          />
          <Grill
            q="What about the 'New document' chooser page — is that an extra click for the 95% case?"
            a="Yes, one extra click. But the 'compose new' button is in the obvious spot, so it's a single click anyway — and the 5% who want PDF import no longer have to discover a 'switch' button mid-edit. Net win on the easy case AND the hard case. Counter-argument: keep the keyboard shortcut Cmd+N → composer skipping the chooser. We'd lose the chooser as the 'add new modes here' seam, though, so probably not."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Grill({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="font-medium">Q. {q}</div>
      <div className="mt-1 text-muted-foreground">A. {a}</div>
    </div>
  )
}

function ImplementationPlanSection() {
  return (
    <Section
      title="Implementation plan"
      description="Three phases, each one verifiable with npx tsc -b && npx vite build. Approx 6–8 commits total."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Phase
            n={1}
            title="P1 — fix the blocking bugs (image, link, print) — same day"
            steps={[
              "ImageWithRef: pre-resolve signed URL at insert and stash in src; node view continues to refresh data-image-id on re-render",
              "Insert link dialog (mirror InsertImageDialog), replace setLink window.prompt at DocumentEditor.tsx:560",
              "Add api.images.urlsFor batch query",
              "buildPrintDoc + DocumentReadPage: pre-resolve image URLs, substitute in printable HTML",
              "buildPrintDoc.renderTitlePage: render revision-history rows on the title page; remove from body section",
            ]}
          />
          <Phase
            n={2}
            title="P2 — toolbar regrouping + table polish — next session"
            steps={[
              "DocumentEditor toolbar: refactor into 4 named groups (Text / Lists / Insert / Safety & Procedure), drop the More dropdown",
              "Table.configure({ resizable: true, handleWidth: 4 }), 80px min column width, snap-to-preset chips on column borders",
              "Cell tint extension: 5-color palette (none/gray/blue/amber/green) wired through editor + read view + print",
              "Header row toggle for tables (default off)",
              "ImageWithRef: width attribute (33%/66%/100%), small floating selector when image selected",
            ]}
          />
          <Phase
            n={3}
            title="P3 — flow + state coherence — bigger lift"
            steps={[
              "/docs/new chooser page (compose vs import); /docs/new/compose and /docs/new/import as the post-chooser routes",
              "Introduce <DocumentEditorShell> that owns the canonical state (composing/draft/in_review/published/archived) and renders the right action set",
              "DocumentReadPage and DocumentEditPage migrate to use DocumentEditorShell; identical PageHeader shape across all states",
              "Document type → template body on creation: surface the existing templateForType in the chooser",
              "Width: pick a single canvas width and use it across composing/draft/published — no jarring reset",
            ]}
          />
          <Phase
            n={4}
            title="P4 — construction-SOP extras — opt in"
            steps={[
              "First-class LMRA block (TipTap node + read + print)",
              "Numbered Steps: image slot per step, sign-off checkbox",
              "Tools / equipment block",
              "@-mention autocomplete for cross-references",
            ]}
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Phase({
  n,
  title,
  steps,
}: {
  n: number
  title: string
  steps: string[]
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <ArrowRight className="h-3.5 w-3.5 text-primary" />
        Phase {n} — {title}
      </div>
      <ul className="space-y-0.5 pl-5 text-xs text-muted-foreground">
        {steps.map((s) => (
          <li key={s} className="list-disc">
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

function OpenQuestionsSection() {
  return (
    <Section
      title="Open questions for the user"
      description="Decisions before P2 starts — P1 is uncontroversial blocker fixes."
    >
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <Q>
            <strong>Image widths.</strong> 3 presets (33/66/100) or 5 (25/33/50/66/100)? Lean: 3.
          </Q>
          <Q>
            <strong>Cell tint palette.</strong> 5 colors (none/gray/blue/amber/green). Drop or
            add any? Need a "red" for high-severity rows?
          </Q>
          <Q>
            <strong>Toolbar groups.</strong> Are the four groups (Text /
            Lists / Insert / Safety &amp; Procedure) the right cut, or should
            Tables be a fifth group of their own? At current button counts,
            tables fit in Insert; if more table actions appear (header
            toggle, tint), it could spin out.
          </Q>
          <Q>
            <strong>State model.</strong> Five states proposed
            (composing/draft/in_review/published/archived). Should there be
            a "deprecated" state distinct from archived (for SOPs replaced
            by a successor)? Or do we use a "replacedBy" field instead?
          </Q>
          <Q>
            <strong>Creation chooser.</strong> Two options for now (compose,
            import). Should "From template" be a third tile in v1, or wait
            until templates are richer than just the type defaults?
          </Q>
          <Q>
            <strong>Construction extras.</strong> Of the ten ideas, which
            three should P4 implement first? My pick: LMRA block, numbered
            steps with image+sign-off, @-mention cross-refs. Push back if
            another set fits the next customer better.
          </Q>
          <Q>
            <strong>Cmd+N shortcut.</strong> Skip the chooser when the user
            hits Cmd+N? Or always go through the chooser for consistency? I
            lean: always through the chooser.
          </Q>
        </CardContent>
      </Card>
    </Section>
  )
}

function Q({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <div>{children}</div>
    </div>
  )
}
