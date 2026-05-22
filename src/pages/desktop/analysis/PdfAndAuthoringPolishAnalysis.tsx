// Analysis: PDF export gaps + authoring polish (machine pill, PDF dialog,
// metadata panel, image library). Static case file at
// /analysis/pdf-and-authoring-polish. No DB/AI — frozen review built from the
// real components. See .claude/skills/analysis-page/SKILL.md.

import {
  AlertTriangle,
  CircleDot,
  Factory,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

const IMG = (f: string) => `/analysis/pdf-and-authoring-polish/${f}`

// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="6 polish items across the machine pill, PDF export, the publish dialog, metadata, and image insert"
          tone="destructive"
        />
        <SummaryCell
          icon={CircleDot}
          label="Status"
          value="Shipped · 2026-05-21 (all 6)"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="Machine icon+wording, save-before-export + live state, grouped always-on dialog, rasterised embedded PDF, names/titles resolved at render, metadata machines+refs, image-library tab"
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b 0 · vite build 0 · backend deployed"
          tone="emerald"
        />
      </CardContent>
    </Card>
  )
}

function SummaryCell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertTriangle
  label: string
  value: string
  tone: "destructive" | "emerald" | "default"
}) {
  const iconClass =
    tone === "destructive"
      ? "text-destructive"
      : tone === "emerald"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-primary"
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-sm leading-snug">{value}</div>
      </div>
    </div>
  )
}

function ProblemStatement() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>What we're solving</AlertTitle>
      <AlertDescription className="space-y-2 text-sm leading-relaxed">
        <p>
          Six issues raised from a real authoring session on{" "}
          <code>AMS-HSE-MAN-0001</code> (a PDF-imported manual with an asset
          chip and a reference-doc chip added in the body): the asset/machine
          chip still uses a <code>#</code> glyph; the PDF export drops the
          embedded PDF, the linked-asset list, and the references table even
          with every toggle on; the publish dialog is a flat list of switches;
          the metadata panel shows asset codes without names and has no
          reference-document list; and the image dialog has no "pick from
          library" path.
        </p>
        <p className="text-xs">
          This is a review, not a fix. Below: evidence, root cause per symptom
          with confidence, the cross-impacts you didn't list, a grilling, the
          proposed shape, and a sequenced plan. Nothing ships until you sign off.
        </p>
      </AlertDescription>
    </Alert>
  )
}

// ---------------------------------------------------------------------------

interface ScopeRow {
  n: number
  item: string
  kind: "bug" | "ux" | "feature"
  effort: "S" | "M" | "L"
}

const SCOPE: ScopeRow[] = [
  { n: 1, item: "Machine/asset chip + toolbar use a machine icon, not #", kind: "ux", effort: "S" },
  { n: 2, item: "PDF export renders the embedded PDF attachment", kind: "bug", effort: "L" },
  { n: 3, item: "PDF export shows linked-asset list + references when present", kind: "bug", effort: "M" },
  { n: 4, item: "Publish-to-PDF dialog: always-on header/footer + grouped sections", kind: "ux", effort: "M" },
  { n: 5, item: "Metadata panel: asset names, reference-doc list, condensed UI", kind: "ux", effort: "M" },
  { n: 6, item: "Insert image: pick from the image library", kind: "feature", effort: "M" },
]

function ScopeOverview() {
  return (
    <Section
      title="The six items"
      description="Two are genuine bugs, three are UX, one is a missing feature."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="w-20">Kind</TableHead>
                <TableHead className="w-16 text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCOPE.map((r) => (
                <TableRow key={r.n}>
                  <TableCell className="align-top font-mono text-xs text-muted-foreground">
                    {r.n}
                  </TableCell>
                  <TableCell className="align-top text-sm">{r.item}</TableCell>
                  <TableCell className="align-top">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.kind === "bug" && "border-destructive/40 text-destructive",
                        r.kind === "ux" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                        r.kind === "feature" && "border-primary/40 text-primary",
                      )}
                    >
                      {r.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Badge variant="outline" className="text-[10px]">
                      {r.effort === "S" ? "small" : r.effort === "M" ? "medium" : "large"}
                    </Badge>
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

// ---------------------------------------------------------------------------

function EvidenceCard({
  caption,
  src,
  orientation = "landscape",
}: {
  caption: string
  src: string
  orientation?: "landscape" | "portrait"
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div
          className={cn(
            "overflow-hidden rounded-md border bg-muted/30",
            orientation === "portrait" && "flex items-center justify-center",
          )}
        >
          <img
            src={src}
            alt={caption}
            className={cn(
              "block",
              orientation === "landscape" ? "h-auto w-full" : "mx-auto h-auto max-h-[620px] w-auto",
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

function Evidence() {
  return (
    <Section title="Evidence" description="The session that surfaced all six.">
      <Tabs defaultValue="pill">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pill">Machine pill</TabsTrigger>
          <TabsTrigger value="pdf-title">PDF — no assets</TabsTrigger>
          <TabsTrigger value="pdf-body">PDF — empty body</TabsTrigger>
          <TabsTrigger value="dialog">Publish dialog</TabsTrigger>
          <TabsTrigger value="editor">Editor state</TabsTrigger>
          <TabsTrigger value="meta">Metadata</TabsTrigger>
          <TabsTrigger value="image">Insert image</TabsTrigger>
        </TabsList>
        <TabsContent value="pill">
          <EvidenceCard
            src={IMG("editor-asset-pill-hash.png")}
            caption="The asset chip renders as # BGF-510, and the toolbar's asset button is also a # (Hash) icon. Nothing signals 'machine / asset'."
          />
        </TabsContent>
        <TabsContent value="pdf-title">
          <EvidenceCard
            orientation="portrait"
            src={IMG("pdf-titlepage-no-assets.png")}
            caption="PDF preview title page: Linked assets shows '—' even though the body has a BGF-510 chip. Note 'v1' and 'draft'."
          />
        </TabsContent>
        <TabsContent value="pdf-body">
          <EvidenceCard
            orientation="portrait"
            src={IMG("pdf-body-pdf-missing.png")}
            caption="PDF preview body: only the 'Imported from …' paragraph renders. The embedded PDF, the asset list, and the references table are all absent."
          />
        </TabsContent>
        <TabsContent value="dialog">
          <EvidenceCard
            orientation="portrait"
            src={IMG("publish-dialog-current.png")}
            caption="Publish-to-PDF: a flat stack of six switches (incl. recurring header/footer that should just always be on) + watermark radios."
          />
        </TabsContent>
        <TabsContent value="editor">
          <EvidenceCard
            src={IMG("editor-machine-and-ref.png")}
            caption="The editor: a # BGF-510 asset chip, an AMS-HSE-SOP-0001 reference chip, and the embedded PDF all present — but the header still reads v1 (these edits are unsaved)."
          />
        </TabsContent>
        <TabsContent value="meta">
          <EvidenceCard
            src={IMG("metadata-panel-current.png")}
            caption="Metadata panel: linked assets show the code only (no name), there is no reference-documents list, and the layout is loose."
          />
        </TabsContent>
        <TabsContent value="image">
          <EvidenceCard
            orientation="portrait"
            src={IMG("insert-image-no-library.png")}
            caption="Insert image has Upload + Paste URL tabs only — no way to pick an image already in the library."
          />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

// ---------------------------------------------------------------------------

interface RootRow {
  symptom: string
  cause: string
  where: string
  confidence: "high" | "med"
}

const ROOTS: RootRow[] = [
  {
    symptom: "Asset chip + toolbar use #",
    cause: "LinkedAssetBlock node view and the editor toolbar/slash item all use the Hash icon; the PDF glyph is ◇.",
    where: "LinkedAssetBlock.tsx:49 · DocumentEditor.tsx (toolbar Hash, slash icon) · printStyles.ts:455",
    confidence: "high",
  },
  {
    symptom: "Embedded PDF missing from export",
    cause: "buildPrintDoc's renderNode has no 'pdfAttachment' case → it hits the default branch, finds no children, emits nothing. A stored PDF also can't be inlined into an HTML print window as-is.",
    where: "buildPrintDoc.ts renderNode (no pdfAttachment case)",
    confidence: "high",
  },
  {
    symptom: "Asset list + references absent despite toggles on",
    cause: "The dialog reads the PERSISTED current version (getWithAssets + getCurrentVersion), not the live editor. The chips were added but not saved — the header still says v1 — so the persisted body has no chips and documentAssets is empty. Toggles were irrelevant.",
    where: "PublishToPdfDialog.tsx:46-53 (queries by documentId) · DocumentEditPage save bumps the version on save only",
    confidence: "high",
  },
  {
    symptom: "Recurring header/footer are fiddly toggles",
    cause: "They're modelled as optional switches in PdfExportOptions; for a controlled SOP they should be on by default and not something you decide each export.",
    where: "buildPrintDoc.ts PdfExportOptions · PublishToPdfDialog.tsx ToggleRows",
    confidence: "high",
  },
  {
    symptom: "Metadata: code-only assets, no refs",
    cause: "MetadataPanel renders derivedAssets as a Hash + code badge and never shows the name it already has; there is no derived reference-document list at all.",
    where: "MetadataPanel.tsx (Linked assets block) · DocumentEditPage/NewPage compute derivedAssets but not derivedRefs",
    confidence: "high",
  },
  {
    symptom: "References/asset labels lose the title when inserted 'code only'",
    cause: "Chips store a `label` chosen at insert time. With the 'code only' toggle, label === code, so the PDF references table renders Code | Code and the metadata shows no title. The chip label must be decorative — resolve docId/assetId → {code, title/name} at render time, never trust the stored label for the table/panel.",
    where: "buildPrintDoc.ts collectReferences (uses label) · MetadataPanel derived lists",
    confidence: "high",
  },
  {
    symptom: "No image-library picker",
    cause: "InsertImageDialog only has Upload + URL tabs. api.images.list exists, so a Library tab is feasible.",
    where: "InsertImageDialog.tsx:52-79 · convex/images.ts:59 (list)",
    confidence: "high",
  },
]

function RootCause() {
  return (
    <Section
      title="Root cause per symptom"
      description="The asset/references gap is NOT a toggle bug — it's that the preview reads saved state."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symptom</TableHead>
                <TableHead>Cause</TableHead>
                <TableHead className="w-16 text-right">Conf.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROOTS.map((r) => (
                <TableRow key={r.symptom}>
                  <TableCell className="align-top text-xs font-medium">
                    {r.symptom}
                    <div className="mt-1 font-mono text-[10px] font-normal text-muted-foreground">
                      {r.where}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {r.cause}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.confidence === "high"
                          ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                          : "border-amber-500/40 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {r.confidence}
                    </Badge>
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

// ---------------------------------------------------------------------------

function ProposedUx() {
  return (
    <Section
      title="Proposed shape"
      description="Rendered with the real primitives, not a figma."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Factory className="h-4 w-4 text-emerald-600" />
              Machine chip + toolbar
            </CardTitle>
            <CardDescription className="text-xs">
              One machine icon everywhere: node, toolbar, slash menu, PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Before</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-800">
                # BGF-510
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">After</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-800">
                <Factory className="h-3 w-3" /> BGF-510
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings2 className="h-4 w-4 text-primary" />
              Publish dialog — grouped
            </CardTitle>
            <CardDescription className="text-xs">
              Header/footer become always-on; the rest groups into sections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <GroupMock
              title="Always on"
              items={["Recurring header", "Recurring footer", "Controlled-copy stamp"]}
              locked
            />
            <GroupMock
              title="Cover & structure"
              items={["Title page", "Revision history"]}
            />
            <GroupMock
              title="Appendices"
              items={["Linked-asset list", "References table", "Embedded PDF pages"]}
            />
            <GroupMock title="Watermark" items={["None · Controlled · Draft · Review"]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-indigo-600" />
              Metadata panel — condensed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="rounded-md border bg-card p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Linked machines
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-800">
                  <Factory className="h-3 w-3" />
                  <span className="font-mono">BGF-510</span>
                  <span className="text-emerald-700/70">Baghouse filter 510</span>
                </span>
              </div>
              <div className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reference documents
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-800">
                  <span className="font-mono">AMS-HSE-SOP-0001</span>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Both lists are derived live from the body chips, so they always
              match what's in the document.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4 text-fuchsia-600" />
              Insert image — Library tab
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex gap-1 rounded-md border p-1 text-[11px]">
              <span className="rounded bg-muted px-2 py-1">Upload</span>
              <span className="rounded px-2 py-1 text-muted-foreground">URL</span>
              <span className="rounded bg-primary/10 px-2 py-1 font-medium text-primary">
                Library
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square rounded border bg-muted/40" />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pick an existing image (already deduped) and insert by id — no
              re-upload.
            </p>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

function GroupMock({
  title,
  items,
  locked,
}: {
  title: string
  items: string[]
  locked?: boolean
}) {
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        {locked && (
          <Badge variant="outline" className="h-4 px-1 text-[8px]">
            always
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => (
          <span
            key={it}
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px]",
              locked ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted",
            )}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  expected: string
  severity: "high" | "med" | "low"
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Export from the editor with unsaved chip edits",
    expected: "Either export the live editor body, or warn 'unsaved changes — save first'. Never silently export stale state.",
    severity: "high",
  },
  {
    scenario: "Export a PDF-imported doc (body is mostly a PDF attachment)",
    expected: "Render the PDF pages (rasterised) into the export, or clearly state the source PDF is attached separately. Don't drop it.",
    severity: "high",
  },
  {
    scenario: "10+ page embedded PDF in a controlled-copy export",
    expected: "Rasterising every page is slow/heavy. Cap, or make 'embed PDF pages' an explicit appendix toggle (off by default).",
    severity: "med",
  },
  {
    scenario: "Asset chip inserted as 'code only' vs 'code + name'",
    expected: "Metadata 'Linked machines' resolves the name from the id regardless of the chip's label mode.",
    severity: "low",
  },
  {
    scenario: "Reference chip points at a now-deleted document",
    expected: "Metadata + references table degrade gracefully (show the code, mark 'missing') rather than crash.",
    severity: "med",
  },
  {
    scenario: "Library image picked, then the underlying image deleted",
    expected: "Same id-resolution path as today's data-image-id; broken image shows the existing fallback.",
    severity: "low",
  },
  {
    scenario: "Machine icon change vs the read view + mobile",
    expected: "TiptapReadOnly reuses the same node view, so it updates for free. Verify mobile reader too.",
    severity: "low",
  },
]

function EdgeCases() {
  return (
    <Section title="Edge cases" description="Where 'looks done' and 'is done' diverge.">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="w-16 text-right">Sev</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((r) => (
                <TableRow key={r.scenario}>
                  <TableCell className="align-top text-xs font-medium">{r.scenario}</TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{r.expected}</TableCell>
                  <TableCell className="align-top text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.severity === "high" && "border-destructive/40 text-destructive",
                        r.severity === "med" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {r.severity}
                    </Badge>
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

// ---------------------------------------------------------------------------

function CrossImpacts() {
  return (
    <Section
      title="Cross-impacts & things not on your list"
      description="What these changes touch, and gaps you didn't mention."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm leading-relaxed">
          <Impact
            title="The asset/references 'bug' is mostly an unsaved-state trap"
            body="Once you Save, the persisted version carries the chips and documentAssets is recomputed, so the asset list + references DO render. The real fix is making export reflect what you see: pass the live editor body when exporting from the edit page, or block export behind a save. This also fixes 'my latest body text isn't in the PDF', which you'd hit next."
          />
          <Impact
            title="Embedding a PDF into a PDF — and the imported-doc trap"
            body="A stored PDF can't be dropped into the HTML print window. Options: (a) rasterise each page to an image via pdfjs at export time — faithful but heavy/async; (b) an 'Attached: filename (N pages)' appendix note; (c) merge server-side with pdf-lib. Important: when the PDF IS the document (e.g. the Eddy Current import), an appendix note is a regression — the export becomes a near-empty page. So split it: PDF-imported docs rasterise (a); supplementary attachments inside an authored doc can use the note (b). The page-count estimate in the dialog also needs updating once pages can land in the export."
          />
          <Impact
            title="Terminology: 'machine' vs 'asset'"
            body="You say 'machine'; the product/schema say 'asset'. The icon should be a machine, but decide whether the labels (toolbar tooltip, metadata heading, picker title) switch to 'Machine' or stay 'Asset'. Mixed wording is worse than either. Proposed: label it 'Machine' in author-facing UI, keep 'asset' in code/schema."
          />
          <Impact
            title="Reference docs have no metadata list yet — and no DB link"
            body="References live only as body chips; there's no documentReferences table the way documentAssets exists. The metadata list can be derived from the body (no schema change). Flag for later: if you ever want 'what references this doc', you'd need a persisted link table."
          />
          <Impact
            title="Image-library tab needs thumbnails + alt reuse"
            body="api.images.list returns rows; urlsFor resolves signed URLs. The picked image already has alt text in the library — reuse it instead of re-prompting. Watch the existing image grid perf if the library is large (lazy-load)."
          />
          <Impact
            title="Read view + mobile inherit the chip icon for free"
            body="Both render via the same LinkedAssetNode node view, so the machine icon propagates. But the PDF glyph (printStyles ◇ + buildPrintDoc) is a separate code path — change it there too or the export will disagree with the screen."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Impact({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border-l-2 border-primary/40 bg-muted/30 py-2 pl-3 pr-2">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{body}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Grill({ q, a }: { q: string; a: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <div className="font-medium">Q. {q}</div>
      <div className="mt-1 text-muted-foreground">A. {a}</div>
    </div>
  )
}

function SelfGrilling() {
  return (
    <Section title="Self-grilling" description="The uncomfortable questions.">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Grill
            q="You're confident the asset/references 'bug' is just unsaved state. What if it isn't?"
            a="The screenshot evidence is strong: the edit header reads v1 with chips present, and saveContent only bumps + persists on Save, so v1's stored body predates the chips. The PDF preview reads that stored v1 → no chips → '—'. The falsifier: save the doc, reopen Publish-to-PDF, and confirm the asset list + references now render. If they still don't with chips persisted, there's a second bug in collectReferences / documentAssets sync and I'm wrong. That test is step 0 of implementation."
          />
          <Grill
            q="Rasterising PDF pages into the export — is that worth it, or gold-plating?"
            a="It's the riskiest item by far (async pdfjs render, memory, pagination, print timing). For a showcase, option (b) — an 'Attached PDF: filename (N pages)' appendix note — delivers 80% of the value at 10% of the risk and is honest. I'd ship (b) now and treat full rasterisation as a separate, opt-in follow-up. Pretending we'll cleanly inline a 6-page scanned PDF into a print window on the first pass is how this slips."
          />
          <Grill
            q="Making header/footer always-on removes user control. Is that right?"
            a="For controlled documents, a recurring header (doc id/version) and footer (page X of Y, effective date) are compliance furniture — turning them off produces a worse document, never a better one. Always-on is the correct default. If someone genuinely needs them off, that's an edge we can add later; defaulting to 'fiddle every time' is the wrong trade for an 'AI-friendly' (low-decision) dialog."
          />
          <Grill
            q="'Machine' vs 'asset' — are you sure renaming author-facing labels won't confuse?"
            a="Risk: the sidebar nav says 'Assets' (now 'Site Assets'), so calling the chip 'Machine' introduces two words for one concept. Counter: the user consistently says 'machine', and on the floor that's the language. Safest middle: machine icon everywhere, but keep the word 'asset' in labels to match the nav — OR rename consistently to 'machine' including the nav. This is a decision to lock, not guess. Surfaced in Decisions."
          />
          <Grill
            q="Did the user miss anything that will bite during implementation?"
            a="Yes, three: (1) exporting unsaved body text (not just chips) — same root, broader symptom; (2) the PDF glyph in print is a separate code path from the on-screen icon; (3) reference chips have no persisted link table, so 'documents that reference this one' isn't answerable without one — fine to defer, but say so now."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

interface PlanStep {
  phase: string
  steps: string[]
}

const PLAN: PlanStep[] = [
  {
    phase: "Step 0 — Confirm the root cause",
    steps: [
      "Save the doc with chips, reopen Publish-to-PDF, verify asset list + references now render.",
      "If yes: the 'bug' is unsaved state — proceed with the export-live-body fix (step 2).",
      "If no: STOP. Drop steps 2/3 as written and diagnose syncDocumentAssetsFromBody / collectReferences before continuing.",
    ],
  },
  {
    phase: "1 — Machine chip + icon (small)",
    steps: [
      "Swap Hash → Factory (or chosen machine icon) in LinkedAssetBlock node view + picker.",
      "Swap the toolbar asset button + slash-menu icon in DocumentEditor.",
      "Update the PDF glyph: buildPrintDoc renderLinkedAsset + printStyles [data-linked-asset]::before.",
      "Apply the terminology decision to labels (Machine vs Asset).",
    ],
  },
  {
    phase: "2 — Export reflects what you see",
    steps: [
      "On the edit page, hand the live editor body (+ derived assets/refs) to PublishToPdfDialog instead of relying on the persisted query; read page keeps using persisted.",
      "Or, minimum: detect unsaved changes and require Save before export.",
    ],
  },
  {
    phase: "3 — Embedded PDF in export",
    steps: [
      "Add a pdfAttachment case to buildPrintDoc: render an 'Attached PDF: filename (N pages)' appendix block (option b).",
      "Optional follow-up: 'Embed PDF pages' appendix toggle that rasterises pages via pdfjs (default off, page-capped).",
    ],
  },
  {
    phase: "4 — Publish dialog redesign",
    steps: [
      "Make recurring header/footer + controlled stamp always-on (drop from PdfExportOptions or force true).",
      "Group remaining options: Cover & structure / Appendices (asset list, references, PDF) / Watermark.",
      "Tighten copy + estimate line.",
    ],
  },
  {
    phase: "5 — Metadata panel",
    steps: [
      "Linked machines: render machine icon + code + name (name already available in derivedAssets).",
      "Add a derived Reference documents list (walk body for referenceDoc, resolve titles).",
      "Condense the panel: tighter spacing, grouped sections, smaller type.",
    ],
  },
  {
    phase: "6 — Image library tab",
    steps: [
      "Add a Library tab to InsertImageDialog: grid from api.images.list, thumbnails via urlsFor, insert by id reusing stored alt text.",
    ],
  },
  {
    phase: "Verify",
    steps: ["npx tsc -b && npx vite build both 0; deploy convex; click through edit → save → PDF."],
  },
]

function ImplementationPlan() {
  return (
    <Section title="Implementation plan" description="Step 0 first — it decides the shape of step 2/3.">
      <Card>
        <CardContent className="space-y-4 pt-6">
          {PLAN.map((p) => (
            <div key={p.phase}>
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4 text-primary" />
                {p.phase}
              </div>
              <ol className="ml-6 list-decimal space-y-1 text-xs text-muted-foreground">
                {p.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Decision({ q, a }: { q: string; a: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <div className="flex items-center gap-1.5 font-medium">
        <CircleDot className="h-3.5 w-3.5 text-amber-500" />
        {q}
      </div>
      <div className="ml-5 mt-0.5 text-muted-foreground">{a}</div>
    </div>
  )
}

function Decisions() {
  return (
    <Section title="Open decisions" description="Lock these before I implement.">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Decision
            q="Terminology — 'Machine' or 'Asset' in author-facing labels?"
            a="Recommend: machine icon everywhere; rename author-facing labels to 'Machine' (chip tooltip, metadata heading, AND the picker dialog title which currently reads 'Insert linked asset'), but keep the sidebar 'Site Assets' and code/schema as 'asset'. Confirm, or keep the word 'Asset' throughout."
          />
          <Decision
            q="Embedded PDF in export — what about PDF-imported docs?"
            a="Recommend a split: PDF-imported docs (the PDF IS the document) rasterise their pages into the export; supplementary PDFs inside an authored doc get an 'Attached: filename (N pages)' note. An appendix note alone would make an imported-PDF export nearly empty — a regression. Confirm the split, or pick one approach for all."
          />
          <Decision
            q="Export source — live editor body, or require Save first?"
            a="Recommend: export the live editor body from the edit page (read page stays persisted). Alternative: simpler 'save before export' guard. Confirm preference."
          />
          <Decision
            q="Header/footer/stamp always-on — acceptable to remove the toggles?"
            a="Recommend: yes, always-on for controlled documents. Confirm."
          />
        </CardContent>
      </Card>
      <Alert className="border-primary/30">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Next</AlertTitle>
        <AlertDescription className="text-sm">
          Review the root-cause table (especially the unsaved-state finding) and
          the four decisions. Tell me the calls and I'll run Step 0, then
          implement in order. Nothing in the feature code changes until you sign
          off.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------

export function PdfAndAuthoringPolishAnalysis() {
  return (
    <AnalysisLayout
      title="PDF export + authoring polish"
      subtitle="Machine chip & icon, missing PDF export sections (embedded PDF, asset list, references), a grouped AI-friendly publish dialog, a condensed metadata panel with machine names + reference documents, and inserting images from the library. Full review with root causes, cross-impacts, grilling, and a sequenced plan — before any code changes."
      date="2026-05-21"
      scopes={["desktop", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemStatement />
      <ScopeOverview />
      <Evidence />
      <RootCause />
      <ProposedUx />
      <EdgeCases />
      <CrossImpacts />
      <SelfGrilling />
      {/* <Results /> — fill in after the fix ships */}
      <ImplementationPlan />
      <Decisions />
    </AnalysisLayout>
  )
}
