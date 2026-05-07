// End-to-end importer walkthrough on a real customer SOP (UP-OPS-SOP-010,
// Eddycurrent Machine, Urban Mining Corp). Documents what the current
// pdfjs → Gemini → TipTap pipeline produces stage-by-stage, names every
// gap surfaced by the run, and proposes a StructuredDoc JSON intermediate
// + renderer pipeline so SOP → Editor → PDF roundtrips become reliable.
//
// Frozen presentation. No live data. Reasoning artifact written before
// any fix lands so the case file persists.

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Code,
  FileCog,
  FileText,
  ImageIcon,
  ImageOff,
  Layers,
  Link as LinkIcon,
  ListChecks,
  Microscope,
  Paintbrush,
  Pencil,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
  Wrench,
  XCircle,
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
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

const IMG = (f: string) => `/analysis/eddycurrent-importer-walkthrough/${f}`

export function EddycurrentImporterWalkthroughAnalysis() {
  return (
    <AnalysisLayout
      title="Eddycurrent SOP — full importer walkthrough"
      subtitle="Real customer PDF (UP-OPS-SOP-010, 6 pages, 14 embedded screenshots, three equipment tags, two cross-doc references) pushed through the /import pipeline. The pipeline produced a document, but the document is a flat verbatim text dump with no headings, no images, no PPE block, no tables, no asset/log/cross-doc links. This page maps every stage of what happened, names every gap, and proposes a StructuredDoc JSON intermediate so we stop trying to roundtrip a PDF through Gemini's free-form JSON output."
      date="2026-05-07"
      scopes={["desktop", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <SourceDocSection />
      <ProblemSection />
      <PipelineMapSection />
      <EvidenceSection />
      <GapsTableSection />
      <RootCauseSection />
      <ProposedSchemaSection />
      <ToolingChainSection />
      <RendererPipelineSection />
      <MilestonesSection />
      <SelfGrillingSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

// ---------------------------------------------------------------------------
// Summary header
// ---------------------------------------------------------------------------

function SummaryHeaderCard() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={AlertTriangle}
          label="Issue"
          value="End-to-end run produced a document, but lost ~all structure (headings, PPE, tables, images, links)."
          tone="destructive"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="V1 shipped · awaiting re-test"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="StructuredDoc schema · first-pass detectors · TipTap renderer · wizard wired · cheap UX bugs fixed"
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b · vite build green. Manual re-test on UP-OPS-SOP-010 pending."
          tone="default"
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

// ---------------------------------------------------------------------------
// Source document
// ---------------------------------------------------------------------------

function SourceDocSection() {
  return (
    <Section
      title="Source document"
      description="What we expect a faithful import to preserve."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Naming code" value="UP-OPS-SOP-010" />
            <Meta label="Title" value="Eddycurrent Machine" />
            <Meta label="Type" value="SOP · Rev 02 · 05/12/2023" />
            <Meta label="Pages" value="6 · digital PDF · en" />
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="font-semibold">Structural elements present</div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <Li icon={FileText}>
                Document control header (number, title, type, revision history
                table)
              </Li>
              <Li icon={TableIcon}>
                <span>
                  <span className="font-mono">Equipment list</span> table — 3
                  tagged assets:{" "}
                  <code className="font-mono">02-100-MD-03</code>,{" "}
                  <code className="font-mono">02-100-BBU-03</code>,{" "}
                  <code className="font-mono">02-100-CC-12</code>
                </span>
              </Li>
              <Li icon={LinkIcon}>
                <span>
                  Reference docs — three cross-doc links including{" "}
                  <code className="font-mono">UP-OPS-TRG-007</code> and one
                  named "Eddy Current Operating Manual"
                </span>
              </Li>
              <Li icon={ShieldCheck}>
                Safety precautions section (before/during operation bullet
                lists)
              </Li>
              <Li icon={ImageIcon}>
                <span>
                  PPE iconography block — <strong>6 pictograms</strong> (safety
                  goggles, gloves, helmet, ear protection, safety clothes,
                  safety boots) plus a "refer to manual" badge
                </span>
              </Li>
              <Li icon={ListChecks}>
                <span>
                  Work instruction table — numbered steps{" "}
                  <span className="font-mono">01-13</span>, each with a
                  description column AND a Photo/Screenshot column. Steps
                  04-11 are present in the source, even though the layout
                  collapsed them in the linear text extraction
                </span>
              </Li>
              <Li icon={Pencil}>
                Revision control table (Rev no, Updated by, Description)
              </Li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-xs">{value}</div>
    </div>
  )
}

function Li({
  icon: Icon,
  children,
}: {
  icon: typeof AlertTriangle
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div>{children}</div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Problem statement
// ---------------------------------------------------------------------------

function ProblemSection() {
  return (
    <Section
      title="Problem"
      description="What the run actually produced vs what we needed."
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          Importer ran end-to-end, but the output document is structurally
          empty.
        </AlertTitle>
        <AlertDescription>
          <ul className="ml-4 mt-2 list-disc space-y-1 text-xs">
            <li>
              <strong>Stage 2 — Extract:</strong> 14 PNGs were uploaded to the
              image library, but every tile in the wizard's image grid renders
              as a broken image.
            </li>
            <li>
              <strong>Stage 3 — AI map:</strong> Gemini returned a non-empty
              response (a title), but no body blocks. Wizard surfaced{" "}
              <em>"No mapping output. Re-run AI mapping?"</em>. Re-running did
              not help.
            </li>
            <li>
              <strong>Stage 4 — Cross-links:</strong> All 6 candidates
              (3 docs, 3 equipment tags) surfaced at <code>(no candidate)</code>{" "}
              0%. Expected — DB was wiped — so the candidates themselves are
              correct, but there is no UX path to <em>create</em> the missing
              asset/doc rows from the candidate list.
            </li>
            <li>
              <strong>Stage 5 — Review:</strong> "Title and naming code are
              required" toast fired even with both fields filled. Naming-code
              format error fires correctly but with a cryptic example.
            </li>
            <li>
              <strong>Final document:</strong> Six headings <code>Page 1…</code>{" "}
              <code>Page 6</code> followed by raw verbatim text per page. No
              PPE block. No tables. No images inline. No asset chips. No
              cross-doc links. No revision-history block. The "Publish to PDF"
              output is the same flat text dump.
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Pipeline map
// ---------------------------------------------------------------------------

const PIPELINE_STAGES: {
  step: string
  title: string
  what: string
  outputShape: string
  file: string
  status: "ok" | "partial" | "broken"
}[] = [
  {
    step: "0",
    title: "Upload",
    what: "User picks PDF + target template + verbatim/improve mode.",
    outputShape: "importJobs row · stage:'uploaded' · sourceStorageId blob",
    file: "src/pages/desktop/ImportPage.tsx · convex/importer/jobs.ts:createJob",
    status: "ok",
  },
  {
    step: "1",
    title: "Extract (browser-side, pdfjs)",
    what: "pdfjs renders each page → captures text via getTextContent + walks operator list for paintImageXObject ops → uploads each image to Convex via api.images.upload → assembles per-page markdown.",
    outputShape:
      "extractedMarkdown · extractedPages[] · extractedImageIds[] · classification · extractStats",
    file: "src/lib/import/extractPdf.ts · convex/importer/jobs.ts:recordExtraction",
    status: "partial",
  },
  {
    step: "2",
    title: "AI map (Gemini server-side)",
    what: "Sends extractedMarkdown to Gemini with the per-template system prompt (TipTap-shape rules + worked example). Parses JSON response.",
    outputShape:
      "mappedBody (TipTap doc-shape JSON) · suggestedTitle · suggestedNamingCode · detectedAssets[] · detectedDocs[]",
    file: "convex/importer/map.ts · convex/importer/templates.ts",
    status: "broken",
  },
  {
    step: "3",
    title: "Resolve cross-links",
    what: "Walks mappedBody for asset/doc/log mentions → fuzzy-matches against existing rows in the DB → returns linkResolutions[] with candidates + confidence scores.",
    outputShape: "linkResolutions[] · suggestedAssetIds[]",
    file: "convex/importer/jobs.ts:resolveLinks",
    status: "partial",
  },
  {
    step: "4",
    title: "Finalise (Review → create)",
    what: "Sanitises mappedBody via extractBodyContent → sanitizeNodes. If sanitised is empty, calls buildFallbackBody to produce a per-page verbatim block with a Notice callout. Inserts a documents + documentVersions row, dedupes chunks, links assets.",
    outputShape: "documents row · documentVersions(v1) · documentAssets[]",
    file: "src/lib/import/sanitizeTiptap.ts · convex/importer/jobs.ts:finalize",
    status: "partial",
  },
]

function PipelineMapSection() {
  return (
    <Section
      title="Current pipeline shape"
      description="Five stages from upload to finalised document. Each stage's success criterion is whether its output JSON is well-formed enough for the next stage to consume."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {PIPELINE_STAGES.map((s) => (
            <div
              key={s.step}
              className={cn(
                "rounded-md border p-3 text-xs",
                s.status === "broken" &&
                  "border-destructive/40 bg-destructive/5",
                s.status === "partial" &&
                  "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {s.step}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{s.title}</span>
                    <StatusPill status={s.status} />
                  </div>
                  <p className="mt-1 text-muted-foreground">{s.what}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                      out: {s.outputShape}
                    </span>
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-muted-foreground">
                      {s.file}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

function StatusPill({ status }: { status: "ok" | "partial" | "broken" }) {
  if (status === "ok") {
    return (
      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" />
        ok
      </Badge>
    )
  }
  if (status === "partial") {
    return (
      <Badge className="gap-0.5 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300">
        partial
      </Badge>
    )
  }
  return (
    <Badge className="gap-0.5 bg-destructive/15 text-destructive hover:bg-destructive/25">
      <XCircle className="h-2.5 w-2.5" />
      broken
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Evidence — tabs grouped by stage
// ---------------------------------------------------------------------------

function EvidenceSection() {
  return (
    <Section
      title="Evidence — stage by stage"
      description="Every wizard step from this run, with a one-line read of what it tells us."
    >
      <Tabs defaultValue="upload">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="upload">1 · Upload</TabsTrigger>
          <TabsTrigger value="extract">2 · Extract</TabsTrigger>
          <TabsTrigger value="map">3 · AI map</TabsTrigger>
          <TabsTrigger value="links">4 · Cross-links</TabsTrigger>
          <TabsTrigger value="review">5 · Review</TabsTrigger>
          <TabsTrigger value="doc">6 · Final doc</TabsTrigger>
          <TabsTrigger value="pdf">7 · PDF</TabsTrigger>
          <TabsTrigger value="library">8 · Library / images</TabsTrigger>
          <TabsTrigger value="mobile">9 · Mobile</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3 pt-3">
          <EvidenceCard
            caption="Empty Upload step. Auto-detect template + Verbatim mode are the defaults."
            src={IMG("01-upload-empty.png")}
          />
          <EvidenceCard
            caption="File selected. Start import is now active. Note: there's no preview of the chosen PDF."
            src={IMG("02-upload-filled.png")}
          />
          <EvidenceCard
            caption="Stage transition: 'Promoting 14 images to the image library'. The deduped storage write happens server-side via api.images.upload."
            src={IMG("03-promoting-images.png")}
          />
        </TabsContent>

        <TabsContent value="extract" className="space-y-3 pt-3">
          <EvidenceCard
            caption="Extracted: 6 pages, 14 images detected · 14 extracted (0 JPEG / 14 PNG). digitalPdf classification, en. Per-page text is shown — page 1 dumps the document control header as raw lines because layout extraction does not group cells."
            src={IMG("04-extract-text-tab.png")}
          />
          <EvidenceCard
            caption="Images tab: 14 broken-tile placeholders. Image promote step succeeded (see Library tab below) so the storage write worked, but the wizard's grid (ImagesGrid → useQuery(api.images.urlsFor)) renders broken <img> elements. The signed URL either 404'd or was not yet ready when the grid first painted."
            src={IMG("05-extract-images-broken.png")}
          />
          <EvidenceCard
            caption="Raw markdown tab. Per-page chunks delimited by '<!-- page N -->'. Notice how the document control table on page 1 is flattened — column boundaries are lost, '02 05/12/2023 Release for use Wesley FW NT' becomes a single line."
            src={IMG("06-extract-raw-markdown.png")}
          />
        </TabsContent>

        <TabsContent value="map" className="space-y-3 pt-3">
          <EvidenceCard
            caption="'AI mapping complete' toast fires green. Suggested title is 'EDDYCURRENT MACHINE'. But the body section says 'No mapping output. Re-run AI mapping?' and the suggested naming code is empty. Gemini returned the title field but mappedBody arrived as either null, a string, or a malformed structure."
            src={IMG("07-aimap-no-output.png")}
          />
          <EvidenceCard
            caption="Same state, fullscreen — confirms the wizard cannot recover. The 'Re-run AI mapping' button is offered but did not produce a different shape on the second pass."
            src={IMG("08-aimap-no-output-fullscreen.png")}
          />
        </TabsContent>

        <TabsContent value="links" className="space-y-3 pt-3">
          <EvidenceCard
            caption="Six candidate cross-links surfaced — 3 docs (UP-OPS-SOP-010, Eddy Current Operating Manual, UP-OPS-TRG-007) and 3 equipment tags (02-100-MD-03, BBU-03, CC-12). Every row reads (no candidate) 0%. This is correct behaviour given the wiped DB — but the UX surfaces no path to create the asset / doc rows from the candidate list."
            src={IMG("09-crosslinks-all-zero.png")}
          />
        </TabsContent>

        <TabsContent value="review" className="space-y-3 pt-3">
          <EvidenceCard
            caption="'Title and naming code are required' toast fires even though both fields look filled. Likely cause: title state was 'EDDYCURRENT MACHINE' but namingCode was the default placeholder 'HOL-OPS-SOP-0001' which matched the regex but was somehow blank in state (placeholder vs value confusion in MappedStage)."
            src={IMG("10-error-title-naming-required.png")}
          />
          <EvidenceCard
            caption="User retypes naming code as 'HOL-OPS-TOR-004' to test."
            src={IMG("11-naming-tor-edit.png")}
          />
          <EvidenceCard
            caption="'Naming code must be like HOL-OPS-SOP-0001'. Validation fires correctly — '004' is 3 digits, the regex requires {4}. But the example HOL-OPS-SOP-0001 is misleading because the SITE 'HOL' is hard-coded, not derived from the source. The source PDF says 'UP'."
            src={IMG("12-error-naming-format.png")}
          />
          <EvidenceCard
            caption="Final accepted naming code: HOL-OPS-SOP-0004. Title: EDDYCURRENT MACHINE. Linked assets: none. The user resigned to all the wrong defaults to get past the gate."
            src={IMG("13-naming-valid.png")}
          />
        </TabsContent>

        <TabsContent value="doc" className="space-y-3 pt-3">
          <EvidenceCard
            caption="Document opens in the editor. Notice callout: 'AI structural mapping returned no usable blocks for this import. The verbatim per-page text below is a deterministic fallback…'. This is buildFallbackBody firing in src/lib/import/sanitizeTiptap.ts:322. The body is one H1 per page and one paragraph per source line."
            src={IMG("14-editor-fallback-page1.png")}
          />
          <EvidenceCard
            caption="Editor scrolled to Page 5. The work instruction table got serialised into bare prose. Steps 12 and 13 are run-on paragraphs. Step numbers, columns, photos — all gone."
            src={IMG("15-editor-fallback-page5.png")}
          />
          <EvidenceCard
            caption="Read view (DocumentReadPage). Same fallback, plus 'On this page' navigator that lists Page 1…6. No real section TOC because there are no real sections."
            src={IMG("16-read-view-fallback.png")}
          />
        </TabsContent>

        <TabsContent value="pdf" className="space-y-3 pt-3">
          <EvidenceCard
            caption="Publish to PDF dialog. Cover page + revision block + recurring header + linked assets options."
            src={IMG("17-publish-modal.png")}
            orientation="portrait"
          />
          <EvidenceCard
            caption="Generated PDF, cover page. Owner field is '—' (unassigned). Linked assets '—' because none survived. Revision history table only has v1 because we threw away the source's revision history during extract."
            src={IMG("18-pdf-cover.png")}
            orientation="portrait"
          />
          <EvidenceCard
            caption="Generated PDF, body. Page 1, Page 2 headings followed by verbatim text. The 'Page N' headings are an artifact of buildFallbackBody, not the source document."
            src={IMG("19-pdf-body.png")}
            orientation="portrait"
          />
        </TabsContent>

        <TabsContent value="library" className="space-y-3 pt-3">
          <EvidenceCard
            caption="Library list — one document, type=SOP, status=Draft, Linked assets = 0."
            src={IMG("20-library-list.png")}
          />
          <EvidenceCard
            caption="Image library — all 14 PNGs present with correct alt text 'Image extracted from UP-OPS-SOP-010 …'. So the storage layer worked. The Stage 2 broken tiles are a wizard-only render issue, not a data loss issue."
            src={IMG("21-image-library.png")}
            orientation="portrait"
          />
          <EvidenceCard
            caption="Assets page — empty. The three equipment tags (02-100-MD-03, etc.) were detected by the importer (see Cross-links) but never created as Asset rows."
            src={IMG("22-assets-empty.png")}
          />
        </TabsContent>

        <TabsContent value="mobile" className="space-y-3 pt-3">
          <EvidenceCard
            caption="Mobile docs list. The imported doc is visible — but with the meaningless naming code HOL-OPS-SOP-0004."
            src={IMG("23-mobile-docs-list.png")}
            orientation="portrait"
          />
          <EvidenceCard
            caption="Mobile doc page 1. The fallback notice is shown — operators should never see this. They are getting raw page text with no structure to scan."
            src={IMG("24-mobile-doc-page1.png")}
            orientation="portrait"
          />
          <EvidenceCard
            caption="Mobile doc page 2. Same pattern — verbatim text without sections, PPE, or step numbering."
            src={IMG("25-mobile-doc-page2.png")}
            orientation="portrait"
          />
        </TabsContent>
      </Tabs>
    </Section>
  )
}

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
              orientation === "landscape"
                ? "h-auto w-full"
                : "h-auto max-h-[640px] w-auto",
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Gaps — what survived vs what didn't
// ---------------------------------------------------------------------------

interface GapRow {
  element: string
  source: string
  current: string
  expected: string
  severity: "high" | "med" | "low"
}

const GAPS: GapRow[] = [
  {
    element: "Document title",
    source: "EDDYCURRENT MACHINE (page 1 control header)",
    current: "Captured · 'EDDYCURRENT MACHINE'",
    expected: "Captured (good)",
    severity: "low",
  },
  {
    element: "Naming code",
    source: "UP-OPS-SOP-010",
    current: "Suggested code is empty. User typed HOL-OPS-SOP-0004 manually.",
    expected:
      "Detected from page 1 header → 'UP-OPS-SOP-010' offered as default; auto-pad to UP-OPS-SOP-0010.",
    severity: "high",
  },
  {
    element: "Document control header",
    source: "Type · Title · Number · Revision history table",
    current: "Flattened into raw lines; no metadata fields populated.",
    expected:
      "Parsed into StructuredDoc.metadata { type, title, number, owner, revisions[] }. Revisions populate documents.history.",
    severity: "high",
  },
  {
    element: "Equipment list table",
    source:
      "3 rows: 02-100-MD-03, 02-100-BBU-03, 02-100-CC-12 with description + area",
    current:
      "Recognised as cross-link candidates with 0% confidence (no DB row exists). No path to create the rows from the wizard.",
    expected:
      "If asset row missing, offer 'Create asset 02-100-MD-03 from this row' inline. On accept, insert the row and link it as a documentAsset.",
    severity: "high",
  },
  {
    element: "Reference docs table",
    source: "3 rows including UP-OPS-TRG-007",
    current:
      "Recognised as cross-doc candidates with 0% confidence. Wizard offers no 'create-as-stub' affordance.",
    expected:
      "Offer 'Create stub document UP-OPS-TRG-007' so internal links work even before the referenced doc is imported.",
    severity: "med",
  },
  {
    element: "PPE pictogram block",
    source:
      "6 icons: goggles, gloves, helmet, ear protection, safety clothes, boots + 'refer to manual'",
    current:
      "Lost. PPE column on document landed at N/A. Source PNGs sitting in the image library, not bound to the doc.",
    expected:
      "PPE recognised at extract-time (icon dimensions / OCR / position) → emitted as { type: 'ppe', attrs: { items: [...] } }. The 7-item enum already exists in DocumentEditor.",
    severity: "high",
  },
  {
    element: "Inline images on procedure steps",
    source: "Photo/Screenshot column for steps 01-13",
    current:
      "Images uploaded to library but not bound to any block in the body.",
    expected:
      "Each step in the work instruction list has an image ref → renders as { type: 'image', attrs: { src, alt, imageId } } below the step paragraph.",
    severity: "high",
  },
  {
    element: "Procedure steps 04-11",
    source:
      "Numbered steps in the work instruction table; the linear text extractor jumped from 03 to 12.",
    current:
      "Steps 04-11 missing from extracted text — the right-column screenshots dominate that vertical space and break getTextContent's reading order.",
    expected:
      "Per-page text + per-image positional layout → reconstruct row order via y-coordinate clustering instead of pure left-to-right reading.",
    severity: "high",
  },
  {
    element: "Section structure (Purpose, Safety, Equipment, etc.)",
    source: "H1/H2 numbered headings (1, 1.1, 2, 2.1, etc.)",
    current: "All content lives under 'Page N' headings. No semantic sections.",
    expected:
      "Section detector recognises numbered-heading patterns → emits headings at level 2/3 in the output body.",
    severity: "high",
  },
  {
    element: "Image grid in extract wizard",
    source: "n/a",
    current: "All 14 tiles render as broken-image icons.",
    expected:
      "ImagesGrid (ImportPage.tsx:704) should refetch URLs after promote completes, or show a loader until urlsFor returns. The library page renders the same images correctly.",
    severity: "med",
  },
  {
    element: "Title-and-naming-code validation toast",
    source: "n/a",
    current:
      "Fires 'Title and naming code are required' even with both fields visibly filled.",
    expected:
      "Trace the empty case — likely state vs placeholder confusion when suggestedNamingCode is null.",
    severity: "med",
  },
  {
    element: "Naming code default site",
    source: "Source = UP. Suggestion forces HOL.",
    current:
      "Naming code suggestion hard-coded to HOL-OPS-SOP-NNNN regardless of what the source PDF starts with.",
    expected:
      "Detect site prefix from source header → default to UP-OPS-SOP-0010 with the user-correctable site dropdown still available.",
    severity: "med",
  },
]

function GapsTableSection() {
  return (
    <Section
      title="Gaps — what survived, what didn't"
      description="Element-by-element from the source document. 'Severity' is operator-cost, not engineer-cost."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Element</TableHead>
                <TableHead className="w-[250px]">Source</TableHead>
                <TableHead className="w-[280px]">Current behaviour</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="w-[80px] text-right">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GAPS.map((g) => (
                <TableRow key={g.element}>
                  <TableCell className="align-top text-xs font-medium">
                    {g.element}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {g.source}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    {g.current}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    {g.expected}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <SeverityBadge severity={g.severity} />
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

function SeverityBadge({ severity }: { severity: "high" | "med" | "low" }) {
  if (severity === "high") {
    return (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/25">
        high
      </Badge>
    )
  }
  if (severity === "med") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300">
        med
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[10px]">
      low
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Root cause
// ---------------------------------------------------------------------------

function RootCauseSection() {
  return (
    <Section
      title="Root cause — why structure dies"
      description="Three independent failure modes stack up to produce the flat output we saw."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <CauseRow
            n={1}
            title="Linear-reading extract loses 2D layout"
            file="src/lib/import/extractPdf.ts:106 (page.getTextContent)"
            body="pdfjs returns text items in document-order, not visual order. For a two-column table (description | screenshot), the right-column captions interleave with the left-column rows, the table loses its column boundaries, and per-row pairing is destroyed. This is why steps 04-11 went missing and why the equipment list became a flat run-on."
          />
          <CauseRow
            n={2}
            title="LLM is asked to be both extractor and structurer"
            file="convex/importer/templates.ts (TipTap rules + WORKED EXAMPLE)"
            body="The system prompt asks Gemini to (a) read the markdown, (b) recognise sections, (c) emit strict TipTap node JSON in one shot. The schema is large (10+ node types, attribute rules, content/leaf distinction). Even with a worked example, the model returns either malformed shape or — as on this run — only the easy fields (title) and skips the body. We have no schema validator that can repair, only a sanitizer that drops bad nodes. When sanitised==[] we fall back to the page-dump."
          />
          <CauseRow
            n={3}
            title="Image data flows on a parallel rail with no anchor back to text"
            file="src/lib/import/extractPdf.ts (paintImageXObject loop) · convex/importer/jobs.ts:recordExtraction"
            body="Extract collects (a) per-page text and (b) a flat list of image blobs. The page number is the only metadata associating an image with its location. There's no rectangle, no preceding-text link, no row-anchor. So even if the LLM produces a step list, it has no way to know which image belongs under which step."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function CauseRow({
  n,
  title,
  file,
  body,
}: {
  n: number
  title: string
  file: string
  body: string
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start gap-3">
        <Badge variant="outline" className="font-mono text-[10px]">
          {n}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {file}
          </div>
          <p className="mt-2 text-xs leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proposed schema — StructuredDoc JSON intermediate
// ---------------------------------------------------------------------------

const STRUCTURED_DOC_EXAMPLE = `{
  "schemaVersion": 1,
  "source": {
    "filename": "UP-OPS-SOP-010 - [100] Eddycurrent machine r.02.pdf",
    "sha256": "…",
    "pageCount": 6,
    "language": "en"
  },
  "metadata": {
    "namingCode": "UP-OPS-SOP-010",
    "title": "EDDYCURRENT MACHINE",
    "type": "sop",
    "site": "UP",
    "department": "OPS",
    "documentNumber": "010",
    "currentRevision": "02",
    "currentRevisionDate": "2023-12-05",
    "owner": null,
    "preparedBy": "Wesley",
    "reviewedBy": "FW",
    "approvedBy": "NT"
  },
  "history": [
    { "rev": "02", "date": "2023-12-05", "summary": "Release for use" },
    { "rev": "01", "date": "2023-08-24", "summary": "Issued for first review" }
  ],
  "linkedAssets": [
    { "code": "02-100-MD-03", "name": "Eddy current machine (Bakker Magnetics)", "area": "100" },
    { "code": "02-100-BBU-03", "name": "Bigbag filling station for non-ferro offspec", "area": "100" },
    { "code": "02-100-CC-12", "name": "Chain conveyor under eddy current", "area": "100" }
  ],
  "linkedDocs": [
    { "code": "UP-OPS-TRG-007", "title": "TRAINING - Eddy Current Machine" },
    { "code": null, "title": "Eddy Current Operating Manual" },
    { "code": null, "title": "Filling of bigbags and use of forklift" }
  ],
  "ppe": {
    "items": ["goggles", "gloves", "helmet", "hearing", "clothes", "boots"],
    "referToManual": true
  },
  "loto": { "required": false, "notes": null },
  "sections": [
    {
      "id": "purpose",
      "heading": "Purpose",
      "level": 2,
      "blocks": [
        { "kind": "paragraph", "text": "The purpose of this document is to describe the operating procedure of the eddy current machines used to remove non-ferro particles from the feedstock stream." }
      ]
    },
    {
      "id": "safety",
      "heading": "Safety precautions",
      "level": 2,
      "blocks": [
        { "kind": "paragraph", "text": "Utilizing an eddy current machine to extract metal particles from a PET flake feedstock stream demands strict adherence to safety protocols…" },
        { "kind": "callout", "tone": "warning", "title": "Before operation", "text": "Inspect for damage; equip PPE; keep metallic objects clear; check the e-stop." },
        { "kind": "list", "ordered": false, "items": ["Inspect for damage…", "Equip PPE…", "Keep metallic objects clear…"] }
      ]
    },
    {
      "id": "procedure",
      "heading": "Work instruction",
      "level": 2,
      "blocks": [
        {
          "kind": "stepList",
          "steps": [
            {
              "n": 1,
              "title": "Turning on Eddy Current Machine",
              "text": "Go to the Main Panel of section 100. Switch Eddy Current from Disabled to Enabled.",
              "imageRef": { "imageId": "kg7…", "page": 4, "boundingBox": [320, 80, 580, 200] }
            },
            { "n": 2, "title": "Wait for 3200/min", "text": "…", "imageRef": { "imageId": "kg8…", "page": 4 } }
          ]
        }
      ]
    }
  ],
  "extractWarnings": [
    { "kind": "missingSteps", "detail": "Steps 04–11 not surfaced by linear text extractor; image rows present on page 4." }
  ]
}`

function ProposedSchemaSection() {
  return (
    <Section
      title="Proposal — StructuredDoc JSON intermediate"
      description="Stop using TipTap as the importer's first-class output. Introduce a typed intermediate the extractor and the LLM both target. Renderers (TipTap, PDF, mobile) consume it. Roundtrips become deterministic."
    >
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Why a separate schema</div>
            <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Decouples authoring tool from import format.</strong>{" "}
                TipTap is shaped for the editor; SOPs need explicit metadata,
                linked-asset arrays, PPE enums, history tables, step+image
                pairs. Forcing it through TipTap loses every domain field.
              </li>
              <li>
                <strong>Validates with zod.</strong> A sanitiser can only drop
                bad blocks. A typed schema lets us reject malformed AI output
                and request a re-map automatically.
              </li>
              <li>
                <strong>Three renderers, one source.</strong> StructuredDoc →
                TipTap (editor), → printable HTML (PDF), → log spec (LOGS
                configurator), → mobile read view. Add a new surface without
                touching the importer.
              </li>
              <li>
                <strong>Diffable across versions.</strong> When v3 of the SOP
                is imported, a JSON-aware diff highlights which steps changed
                — TipTap doc-shape diffs are noise.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Schema sketch (v1)</div>
            <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed">
              <code>{STRUCTURED_DOC_EXAMPLE}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Block kinds (v1 set)</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "paragraph",
                "list",
                "stepList",
                "callout",
                "ppe",
                "table",
                "image",
                "horizontalRule",
                "metadataBlock",
                "signOff",
                "loto",
                "revisionHistory",
                "linkRef",
              ].map((k) => (
                <code
                  key={k}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                >
                  {k}
                </code>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Each kind has a small, fixed attribute set. No nested
              free-form content arrays. The schema is intentionally narrower
              than TipTap.
            </p>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Tooling chain — proposed
// ---------------------------------------------------------------------------

const CHAIN: {
  step: string
  name: string
  who: string
  inputs: string
  outputs: string
  detail: string
}[] = [
  {
    step: "1",
    name: "Layout-aware text + image extract",
    who: "browser · pdfjs",
    inputs: "PDF File",
    outputs:
      "PageLayout[] = { pageNumber, blocks: TextBlock | ImageBlock with x,y,w,h, fontSize, isBold }",
    detail:
      "Same pdfjs we already use, but capture the transform matrix on every text item and image XObject. Cluster items by y-coordinate to recover row order. Output is positional, not linear.",
  },
  {
    step: "2",
    name: "Deterministic table & header detection",
    who: "browser · pure TS",
    inputs: "PageLayout[]",
    outputs:
      "FirstPassDoc = StructuredDoc with metadata + linkedAssets + linkedDocs + tables already populated; sections still loose paragraphs",
    detail:
      "Heuristic passes: regex naming codes (e.g. /\\b[A-Z]{2,4}-[A-Z]{2,4}-[A-Z]{2,4}-\\d+\\b/), recognise page-1 control headers, parse multi-column tables by detecting consistent column-x positions across rows. PPE detected via image-position + small dimensions in a row.",
  },
  {
    step: "3",
    name: "LLM section + step mapper (narrow scope)",
    who: "Convex action · Gemini",
    inputs:
      "FirstPassDoc.sections (only the loose paragraphs not yet classified) + extractWarnings",
    outputs:
      "Section[] with proper headings, stepList items annotated with imageRef",
    detail:
      "LLM only sees content that the deterministic pass couldn't classify. System prompt is short — pick the heading, group paragraphs, attach images by page+y proximity. No more 'emit strict TipTap'. Output validates against zod; on failure we re-prompt with the validation error.",
  },
  {
    step: "4",
    name: "Cross-link resolver (existing)",
    who: "Convex mutation",
    inputs: "StructuredDoc.linkedAssets/linkedDocs",
    outputs: "linkResolutions[] with candidates + 'create stub' affordance",
    detail:
      "Same logic as today, but with the affordance to create a missing asset/doc row inline. linkRef blocks then resolve to real ids on finalize.",
  },
  {
    step: "5",
    name: "Renderers",
    who: "browser · pure TS",
    inputs: "StructuredDoc",
    outputs:
      "TipTap doc · printable HTML · log spec · mobile read tree (whichever the surface needs)",
    detail:
      "Each renderer is a switch over block.kind. Can be unit-tested with fixture StructuredDocs. No AI in the render path.",
  },
  {
    step: "6",
    name: "Persist",
    who: "Convex mutation",
    inputs: "StructuredDoc",
    outputs:
      "documents row · documentVersions(v1) with bodyJson = TipTap render · originalImport JSON kept as-is for audit & re-render",
    detail:
      "We keep both: the canonical StructuredDoc (for re-rendering / re-importing as a new version) AND the TipTap render (so the editor doesn't need to know about StructuredDoc). On edit save, TipTap → updated StructuredDoc via a back-renderer. Round-trip drift is bounded because the schema is small.",
  },
]

function ToolingChainSection() {
  return (
    <Section
      title="Proposed tooling chain"
      description="Six numbered steps. Steps 1, 2, 4, 5, 6 are deterministic TS — testable, unit-testable, no LLM. Step 3 is the only AI call, with a narrow scope."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {CHAIN.map((s) => (
            <div key={s.step} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {s.step}
                </Badge>
                <span className="text-sm font-semibold">{s.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {s.who}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">{s.detail}</p>
              <div className="mt-2 grid gap-2 text-[10px] sm:grid-cols-2">
                <div className="rounded bg-muted/40 p-2">
                  <div className="font-semibold uppercase tracking-wider text-muted-foreground">
                    in
                  </div>
                  <div className="font-mono">{s.inputs}</div>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <div className="font-semibold uppercase tracking-wider text-muted-foreground">
                    out
                  </div>
                  <div className="font-mono">{s.outputs}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Renderers + intermediate testing
// ---------------------------------------------------------------------------

function RendererPipelineSection() {
  return (
    <Section
      title="Renderers and intermediate testing"
      description="Once StructuredDoc exists, every render path becomes a pure function we can test in isolation. This is also where the wizard gets its preview."
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 lg:grid-cols-3">
            <RendererCard
              icon={Pencil}
              name="StructuredDoc → TipTap"
              consumers={["DocumentEditor", "DocumentReadPage"]}
              detail="Switch over block.kind → emits the existing TipTap node set (heading, paragraph, orderedList, callout, ppe, image, etc.). Tables become tableNode. stepList expands into orderedList + image children."
            />
            <RendererCard
              icon={Printer}
              name="StructuredDoc → printable HTML"
              consumers={["Publish to PDF window"]}
              detail="Same switch, different CSS. Emits a print-ready DOM with the cover page, recurring header, controlled-copy watermark. Doesn't go through TipTap at all — bypasses the editor's print-CSS quirks."
            />
            <RendererCard
              icon={ListChecks}
              name="StructuredDoc → log spec"
              consumers={["LOGS configurator (Work Instruction → Log)"]}
              detail="When the import target is workInstructionLog, the same StructuredDoc with stepList[] becomes a primitives[] log spec. Existing AI-mapping logspec path becomes a deterministic mapping."
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-semibold">Where we test</div>
            <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Fixture-driven unit tests.</strong> A folder of
                StructuredDoc JSON fixtures (eddycurrent SOP, a workInstruction
                log, an LMRA, a manual). Renderers must produce stable output.
              </li>
              <li>
                <strong>Wizard preview pane.</strong> Stage 3 (AI map) renders
                the StructuredDoc → TipTap on the right of the wizard so the
                user sees what they're about to commit. No more "blind accept".
              </li>
              <li>
                <strong>Round-trip test.</strong> StructuredDoc → TipTap →
                back to StructuredDoc must be a fixed point for every block
                kind, otherwise we lose data on every edit-save cycle.
              </li>
              <li>
                <strong>Importer regression suite.</strong> Each customer PDF
                (eddycurrent today, more later) has a "golden" StructuredDoc
                checked in. Re-running the importer produces the same
                StructuredDoc within a fuzzy diff.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function RendererCard({
  icon: Icon,
  name,
  consumers,
  detail,
}: {
  icon: typeof AlertTriangle
  name: string
  consumers: string[]
  detail: string
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{name}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {consumers.map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">
                {c}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {detail}
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

interface Milestone {
  m: string
  title: string
  why: string
  scope: string[]
  ships: string
  exit: string
}

const MILESTONES: Milestone[] = [
  {
    m: "M1",
    title: "Define StructuredDoc + zod schema + golden fixture",
    why: "Make the contract explicit before changing any pipeline code. The eddycurrent SOP is the first golden fixture.",
    scope: [
      "src/lib/import/structuredDoc.ts (zod schema)",
      "src/lib/import/fixtures/eddycurrent.json (hand-authored ideal)",
      "vitest config",
    ],
    ships:
      "Schema + 1 fixture. Tests pass. Nothing wired into the live pipeline yet.",
    exit:
      "Reviewers can read the JSON and immediately see what the importer should produce.",
  },
  {
    m: "M2",
    title: "TipTap renderer + read-back",
    why: "Prove the schema round-trips through the editor before sinking time into extraction.",
    scope: [
      "src/lib/import/render/toTiptap.ts",
      "src/lib/import/render/fromTiptap.ts",
      "round-trip test on the fixture",
    ],
    ships:
      "fixture → TipTap → back to StructuredDoc; equal modulo whitespace.",
    exit: "Editing in the editor doesn't drop StructuredDoc fields.",
  },
  {
    m: "M3",
    title: "Layout-aware extractor",
    why: "Recover 2D positional info so the downstream pipeline can group rows correctly.",
    scope: [
      "src/lib/import/extractPdf.ts (rewrite to PageLayout[])",
      "src/lib/import/layout/cluster.ts (y-axis row clustering)",
    ],
    ships:
      "Eddycurrent extracts return PageLayout with all 14 image positions and the equipment-list table column-x's recoverable.",
    exit:
      "Steps 04-11 surface in the right pageLayout y-band; equipment table columns are detected.",
  },
  {
    m: "M4",
    title: "Deterministic FirstPassDoc",
    why: "Pull every regex-detectable field out of the LLM's job. Header parsing, naming code, revision table, asset table, doc table, PPE icons.",
    scope: [
      "src/lib/import/firstPass/header.ts",
      "src/lib/import/firstPass/tables.ts",
      "src/lib/import/firstPass/ppe.ts",
    ],
    ships:
      "Eddycurrent produces a FirstPassDoc with metadata, linkedAssets, linkedDocs, history, ppe, loto already filled. Sections are still loose paragraphs.",
    exit:
      "Naming-code suggestion = 'UP-OPS-SOP-010'. PPE column on the doc record = 6 items. linkedAssets = 3.",
  },
  {
    m: "M5",
    title: "Narrow-scope LLM section mapper",
    why: "Replace the all-in-one Gemini prompt with a smaller one that only fills sections+stepList from the loose paragraphs FirstPass left behind.",
    scope: [
      "convex/importer/map.ts (rewrite)",
      "convex/importer/templates.ts (new prompt)",
      "validation + auto-retry on zod failure",
    ],
    ships:
      "Eddycurrent run produces a StructuredDoc with sections=[Purpose, Safety, Equipment, LOTO, Procedure (stepList of 13), Revision].",
    exit: "Stage 3 wizard shows the StructuredDoc → TipTap preview on the right. No more 'no usable blocks' fallback on a digital PDF.",
  },
  {
    m: "M6",
    title: "Inline 'create asset / create stub doc' affordance",
    why: "Make Stage 4 useful when the DB is empty — most customer PDFs reference assets that don't exist yet in Oppr.",
    scope: ["src/pages/desktop/ImportPage.tsx (CrossLinks step)"],
    ships:
      "User can click 'Create asset 02-100-MD-03' inline; document binds the new id.",
    exit: "Eddycurrent run finalises with all 3 assets created and linked.",
  },
  {
    m: "M7",
    title: "PDF renderer from StructuredDoc",
    why: "Stop reusing the editor print path; produce a clean controlled-copy PDF directly.",
    scope: [
      "src/lib/import/render/toPrintHtml.ts",
      "src/components/docs/PrintPreview.tsx (replace existing publish path)",
    ],
    ships:
      "Eddycurrent → PDF that recreates the source's layout: sections, PPE block, equipment table, step list with images. Watermark + revision history block.",
    exit: "PDF is recognisably the same SOP an inspector would accept.",
  },
  {
    m: "M8",
    title: "Importer regression suite",
    why: "Lock in the gains. Every customer PDF added later runs through the same golden harness.",
    scope: [
      "src/lib/import/__tests__/regression.test.ts",
      "src/lib/import/fixtures/<each-customer-pdf>.json",
    ],
    ships:
      "CI runs the importer on every fixture PDF, diffs against golden StructuredDoc.",
    exit: "Regressions are caught before merge.",
  },
]

function MilestonesSection() {
  return (
    <Section
      title="Implementation milestones"
      description="Eight steps; each one is independently shippable and demoable. The eddycurrent SOP is the running benchmark for every milestone."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {MILESTONES.map((m) => (
            <div key={m.m} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start gap-3">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {m.m}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{m.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{m.why}</p>
                  <div className="mt-2 grid gap-2 text-[10px] sm:grid-cols-3">
                    <KV
                      label="scope"
                      value={
                        <div className="space-y-0.5">
                          {m.scope.map((s) => (
                            <code
                              key={s}
                              className="block rounded bg-muted px-1 py-0.5 font-mono"
                            >
                              {s}
                            </code>
                          ))}
                        </div>
                      }
                    />
                    <KV label="ships" value={m.ships} />
                    <KV label="exit" value={m.exit} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

function KV({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded bg-muted/40 p-2">
      <div className="font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5">{value}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Self-grilling
// ---------------------------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling — uncomfortable counter-hypotheses"
      description="The proposal looks neat. Here is what would falsify it."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-xs leading-relaxed">
          <Grill
            q="Isn't this just markdown? Why not extract to GitHub-flavored markdown and let the editor parse that?"
            a="Markdown can't represent PPE icons, asset/log refs, callout tones, image-imageId binding, or revision history tables without a sea of HTML extensions. By the time you're embedding <ppe items='helmet|gloves|hivis'/> tags inside markdown you've reinvented a worse JSON schema. Markdown is good as a human-readable preview (we already render extractedMarkdown for review) — but as the canonical intermediate, structured JSON wins because it validates."
          />
          <Grill
            q="A typed schema means every new field requires a code change. Doesn't that slow you down vs free-form?"
            a="Yes — and that's the point. The previous run silently dropped PPE because the prompt example didn't cover it. A typed schema would have made that a build-time error. The pace of new fields is bounded (we add maybe 1-2 block kinds per quarter). The pace of unknown LLM regressions is unbounded."
          />
          <Grill
            q="Could we just throw a bigger model + a longer prompt at the existing pipeline? Gemini 2.5 Pro lands soon."
            a="It would help with the broken JSON in this run. It wouldn't help with the layout-loss on page 4 (steps 04-11) — that's a pdfjs reading-order problem upstream of the LLM. And it wouldn't help with the linked-asset auto-create flow, which is a UX problem, not an AI problem. The LLM is doing two jobs (extract + structure); splitting them gives both jobs better tools."
          />
          <Grill
            q="The current sanitizer + per-page fallback IS forgiving. Aren't you over-engineering by replacing it?"
            a="The fallback shipped this document with zero structure. An operator on the floor following 'EDDYCURRENT MACHINE / Page 4 / 12 Very important thing is if the Eddy Current (02-100-MD-03)…' has an objectively worse safety document than the source PDF. 'Forgiving' here means 'silently degrading'. That is the worst class of bug."
          />
          <Grill
            q="What if the PDF has weird layout we didn't anticipate (rotated text, scanned pages mixed in, multi-column body)? StructuredDoc.extractWarnings is just lipstick on a fallback."
            a="Honest answer: M3-M5 will not handle every PDF. The harness lets us see exactly which fixtures fail — and decide whether to add a deterministic rule, prompt the LLM differently, or punt to a Python service (markitdown/Adobe Extract) for the hard cases. That decision is informed because the schema is the same across all paths. Today we have no harness — every customer PDF is a roll of the dice."
          />
          <Grill
            q="The DB was wiped before this test run, so 'all 6 cross-link candidates 0%' is partly a setup artifact. Are you double-counting that as a bug?"
            a="Yes — the 0% match is correct given empty DB. The bug there is purely UX (no inline create-asset/stub-doc affordance). The structure loss (PPE, tables, steps 04-11, sections) is independent of DB state. When this same PDF is run against a populated DB, the cross-link step would resolve 3 of 6 candidates — but the document body is still empty."
          />
          <Grill
            q="Is the 'Title and naming code are required' false-fire really a bug worth chasing, or just user error?"
            a="Worth chasing. The screenshot shows both fields visibly populated. The likely cause is suggestedTitle/suggestedNamingCode being null on the record while the input shows the placeholder value, and on submit the state read returns the empty string. That's a 5-minute fix in MappedStage and lands in M6 alongside the cross-link UX."
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

// ---------------------------------------------------------------------------
// Open questions / decisions
// ---------------------------------------------------------------------------

function DecisionsSection() {
  return (
    <Section
      title="Decisions made (2026-05-07)"
      description="Calls taken before V1 implementation; each is implemented or explicitly deferred."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-xs">
          <D
            q="Where does the back-renderer (TipTap → StructuredDoc) live?"
            choice="(1a) bodyJson is canonical; StructuredDoc is the import-time snapshot only."
            outcome="Implemented. StructuredDoc lives on importJobs.structuredDoc. Once finalize runs, documentVersions.bodyJson is the source of truth. No fromTiptap renderer was built. If we ever need to re-render to PDF or re-import as a new version, we'll either rebuild the StructuredDoc from the source PDF or write the back-renderer then."
          />
          <D
            q="Does the LLM ever see images, or only text?"
            choice="(2a) Text-only. PPE detection is purely deterministic at extract (keyword + image-dimension)."
            outcome="Implemented in firstPass.ts:parsePpe. PPE keywords cover EN + NL. We can revisit if a future fixture requires icon-only PPE rows."
          />
          <D
            q="Do we keep markitdown / Adobe Extract on the table for v2?"
            choice="(3a) Yes — schema is JSON-only, no browser-only types. A Python service can populate the same StructuredDoc directly."
            outcome="Implemented. StructuredDoc has no Blob, File, or DOM types — pure JSON. A future scanned-PDF path can land here without re-spec."
          />
          <D
            q="Versioning — re-import rev 03 of the same SOP?"
            choice="(4a) Match-by-naming-code in principle; not yet wired."
            outcome="Deferred. Today every import creates a new document. The StructuredDoc.metadata.namingCode + currentRevision are captured so the future matcher has the data. Add when a customer hits the case."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function D({
  q,
  choice,
  outcome,
}: {
  q: string
  choice: string
  outcome: string
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Question
      </div>
      <div className="font-medium">{q}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Decision
      </div>
      <div className="font-mono text-[11px]">{choice}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Outcome
      </div>
      <div className="text-muted-foreground">{outcome}</div>
    </div>
  )
}

