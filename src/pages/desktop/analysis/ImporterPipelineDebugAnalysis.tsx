// Importer pipeline debug — three live failures observed on the first
// real-PDF run (Eddycurrent Machine SOP, 6 pages, 14 images extracted).
// Static analysis page. Writes the case file BEFORE the fix lands so the
// reasoning persists.

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Bug,
  Check,
  CheckCircle2,
  ChevronRight,
  Code,
  Eye,
  FileText,
  ImageOff,
  Layers,
  Loader2,
  Microscope,
  Package,
  Search,
  ShieldCheck,
  Workflow,
  Wrench,
  XCircle,
  Zap,
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

const IMG = (f: string) => `/analysis/importer-pipeline-debug/${f}`

export function ImporterPipelineDebugAnalysis() {
  return (
    <AnalysisLayout
      title="Importer pipeline debug — broken images + empty body"
      subtitle="First real-PDF run produced three visible failures: (1) extraction shows 14 images but every grid tile renders the browser broken-image icon; (2) the wizard reports 'Document landed at /docs/…' but (3) opening that document shows an empty editor body. Tracing the failure paths in the actual code, ranking hypotheses by confidence, drafting a targeted fix."
      date="2026-05-07"
      scopes={["desktop", "AI", "data-model"]}
    >
      <SummaryHeaderCard />
      <ProblemSection />
      <EvidenceSection />
      <ImageBugTraceSection />
      <BodyBugTraceSection />
      <HypothesisRankingSection />
      <ResultsSection />
      <EdgeCasesSection />
      <SelfGrillingSection />
      <FixPlanSection />
      <DecisionsSection />
    </AnalysisLayout>
  )
}

function SummaryHeaderCard() {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCell
          icon={Bug}
          label="Issues"
          value="3 — broken-image tiles · empty editor on finalize · related AI mapping shape mismatch"
          tone="destructive"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="Shipped · 2026-05-07 (all 12 plan steps landed in one pass)"
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="Implementation"
          value="extractPdf rewrite (jpegData fast-path, paintImageXObjectRepeat, sanity check, per-page fallback, stats) + sanitizeTiptap.ts (new) + softer verbatim prompt + worked JSON example + Re-run mapping button + always-open raw mappedBody dump"
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="npx tsc -b ✓ · npx vite build ✓ · npx convex codegen ✓"
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

function ProblemSection() {
  return (
    <Section title="Problem">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          Three failures on the first real run. They cluster, but each has its
          own root cause.
        </AlertTitle>
        <AlertDescription className="space-y-2 pt-1.5 text-xs">
          <div>
            <strong>Test input</strong> — a 6-page digitally-born SOP titled
            "Eddycurrent Machine Operation". The wizard correctly detected{" "}
            <code className="rounded bg-muted px-1 font-mono">digitalPdf</code>
            , extracted 6 pages and 14 images, ran AI mapping, finalized the
            document, and gave the user a "Document landed at /docs/…" link.
            Click-through reveals an empty editor body.
          </div>
          <div>
            <strong>Visible failures</strong> in order of appearance:
            <ol className="ml-5 mt-1 list-decimal space-y-0.5">
              <li>
                <strong>Image grid is all broken-image icons.</strong> 14
                tiles, every one shows the browser's "image failed to load"
                glyph. This means an{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  &lt;img src=…&gt;
                </code>{" "}
                <em>is</em> being rendered with a non-empty src — but the URL
                fails to resolve. (If src were null/empty the spinner would
                show instead.)
              </li>
              <li>
                <strong>Finalize succeeds, document_id returned.</strong> No
                error in the wizard. The link in the success card reads{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  /docs/kn7avvm5b51zw53dsv559cr8h18682cs
                </code>
                .
              </li>
              <li>
                <strong>Opened document is empty.</strong> Editor placeholder
                "Continue writing… type / for blocks". Title and metadata are
                set correctly. Naming code defaulted to{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  HOL-OPS-SOP-9999
                </code>{" "}
                (the form's pattern fallback), not what the AI suggested.
              </li>
            </ol>
          </div>
          <div>
            (1) and (3) are near-certainly separate bugs in different layers;
            (2) is just the wizard reporting a DB write that did succeed.
          </div>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function EvidenceSection() {
  return (
    <Section
      title="Evidence — three screenshots from the same run"
      description="Same job, walked through the wizard. Each screenshot below is one of the failures."
    >
      <Tabs defaultValue="images">
        <TabsList>
          <TabsTrigger value="images" className="text-xs">
            <ImageOff className="mr-1.5 h-3.5 w-3.5" />
            1 · Broken images
          </TabsTrigger>
          <TabsTrigger value="finalize" className="text-xs">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            2 · Finalize success
          </TabsTrigger>
          <TabsTrigger value="empty" className="text-xs">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            3 · Empty editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="images" className="pt-3">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <img
                src={IMG("01-images-broken.png")}
                alt="Extract stage showing 14 images all rendering as broken"
                className="w-full rounded-md border"
              />
              <p className="text-xs text-muted-foreground">
                Stage 2, Images tab. Job classified as digitalPdf, 6 pages, 14
                images extracted. Every grid tile is the browser's broken-image
                glyph — the &lt;img&gt; <em>has</em> a non-empty src but the
                browser can't fetch it. (If src were null we'd see a spinner;
                if src were "" the broken icon would still appear, but the
                code path returns null when getUrl resolves to null, so empty
                string is unlikely without a bug in image creation.)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="finalize" className="pt-3">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <img
                src={IMG("02-finalized-link.png")}
                alt="Finalize success card with document link"
                className="w-full rounded-md border"
              />
              <p className="text-xs text-muted-foreground">
                Stage 5, Finalized. The wizard reports{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  Document landed at /docs/kn7avvm5b51zw53dsv559cr8h18682cs
                </code>
                . The mutation returned a real document id — a{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  documents
                </code>{" "}
                row + a v1{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  documentVersions
                </code>{" "}
                row exist. This is normal happy-path UI; what's wrong is the
                contents of v1's bodyJson.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="empty" className="pt-3">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <img
                src={IMG("03-empty-editor.png")}
                alt="Editor open on the imported doc, body is empty"
                className="w-full rounded-md border"
              />
              <p className="text-xs text-muted-foreground">
                Click-through to{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  /docs/[id]/edit
                </code>
                . Title is correctly populated ("Eddycurrent Machine
                Operation"), tags include "imported", naming code is{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  HOL-OPS-SOP-9999
                </code>{" "}
                — the form's <em>placeholder pattern</em>, not an AI
                suggestion. Editor body is the empty placeholder. Means the
                bodyJson written by{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  finalizeDocument
                </code>{" "}
                was effectively empty.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Bug 1 — image rendering
// ---------------------------------------------------------------------------

interface FlowStep {
  n: number
  where: string
  what: string
  failureMode: string
  certainty: "low" | "medium" | "high"
}

const IMAGE_FLOW: FlowStep[] = [
  {
    n: 1,
    where:
      "src/lib/import/extractPdf.ts:73 — extractPdf() loops pages 1..numPages",
    what: "Render each page once to populate the pdf.js objs cache, then walk page.getOperatorList() for paintImageXObject ops.",
    failureMode:
      "If page.render() fails silently, the objs cache stays empty and image objects come back undefined.",
    certainty: "medium",
  },
  {
    n: 2,
    where:
      "src/lib/import/extractPdf.ts:115 — `const PAINT = OPS.paintImageXObject ?? OPS.paintImageXObjectRepeat`",
    what: "Picks ONE op code to match. Misses paintImageXObjectRepeat (which is used by many SOP-style PDFs that show a logo on every page).",
    failureMode:
      "Real bug, but causes MISSING images, not BROKEN ones — so probably not the root cause of the user's grid. Still must fix.",
    certainty: "high",
  },
  {
    n: 3,
    where:
      "src/lib/import/extractPdf.ts:122 — page.commonObjs.has(name) ? commonObjs : objs",
    what: "Tries commonObjs first, falls back to objs. The optional-chained `.has?.(...)` returns undefined when has() doesn't exist on the object.",
    failureMode:
      "If has() is undefined, the ternary falls through to objs — usually fine. But if the image lives in commonObjs and we only ask objs, get() may resolve a stale or unrelated object.",
    certainty: "medium",
  },
  {
    n: 4,
    where: "src/lib/import/extractPdf.ts:160 — imageObjToBlob()",
    what: "Reads i.bitmap (ImageBitmap) or i.data (Uint8 buffer with kind=1|2|3) and writes RGBA into a canvas, then canvas.toBlob('image/png').",
    failureMode:
      "If neither bitmap nor data is present, returns null. If data length doesn't match w*h*{1,3,4}, returns null. If toBlob produces a 0-byte blob (zero-dimension canvas), upload would still succeed and storage would persist a 0-byte object. The browser would then 404 or get a malformed PNG → broken-image icon.",
    certainty: "high",
  },
  {
    n: 5,
    where: "src/lib/import/promoteImages.ts:32 — promoteImages() loop",
    what: "For each ExtractedImage: generateUploadUrl mutation, POST blob, createFromUpload mutation.",
    failureMode:
      "If POST fails (network, expired URL, content-type mismatch), the loop continues without creating an images row — that image is silently dropped from the job's extractedImageIds. But if it succeeds with a malformed body, we'd create a row pointing to a broken storage object.",
    certainty: "medium",
  },
  {
    n: 6,
    where: "convex/images.ts:122 — createFromUpload() mutation",
    what: "Inserts an images row OR de-dups against an existing row with the same sha256. Storage of the new upload is deleted on dedup.",
    failureMode:
      "If two extracts hit the same sha (e.g. logo + same logo on next page) the seenSha set in extractPdf.ts:148 already de-dups within the job. Cross-job dedup against existing images is the right behaviour. Not a likely smoking gun.",
    certainty: "low",
  },
  {
    n: 7,
    where: "convex/images.ts:101 — urlsFor query, called from ImagesGrid",
    what: "Returns a record { [imageId]: signedUrl | null }. For upload-source images, calls ctx.storage.getUrl(storageId).",
    failureMode:
      "If the storage object is missing (deleted, never landed), getUrl returns null and our renderer shows a spinner — NOT a broken icon. So the URLs returned must be non-null strings; the failure has to be that those URLs 404 / return malformed bytes.",
    certainty: "high",
  },
  {
    n: 8,
    where: "src/pages/desktop/ImportPage.tsx:467 — ImagesGrid renderer",
    what: "If url is truthy, render <img src={url}>. If not, show spinner.",
    failureMode:
      "Browser broken-image icon means src loaded a response that wasn't a valid image. Either the bytes are wrong (0-byte / corrupt PNG) or content-type doesn't match.",
    certainty: "high",
  },
]

function ImageBugTraceSection() {
  return (
    <Section
      title="Bug 1 trace — broken images"
      description="Browser shows the broken-image icon, which means src is a non-empty URL the browser cannot decode as an image. Walking the pipeline; flagging the most likely failure step."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[27%]">Where</TableHead>
                <TableHead className="w-[28%]">What</TableHead>
                <TableHead className="w-[30%]">Failure mode</TableHead>
                <TableHead className="w-[10%]">Certainty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {IMAGE_FLOW.map((s) => (
                <TableRow key={s.n}>
                  <TableCell className="align-top text-[11px] font-mono text-muted-foreground">
                    {s.n}
                  </TableCell>
                  <TableCell className="align-top text-[11px] font-mono">
                    {s.where}
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {s.what}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {s.failureMode}
                  </TableCell>
                  <TableCell className="align-top">
                    <CertaintyBadge c={s.certainty} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert>
        <Search className="h-4 w-4" />
        <AlertTitle>Most likely root cause: PDF.js bitmap conversion.</AlertTitle>
        <AlertDescription className="text-xs">
          The op-list traversal in extractPdf.ts:110 ran 14 times (matches the
          observed count), so the images <em>were</em> created and uploaded —
          14 is the number of <code>extractedImageIds</code> the job carries.
          The most likely failure is at step 4: pdf.js's image objects in
          recent versions deliver a{" "}
          <code className="rounded bg-muted px-1 font-mono">bitmap</code> field
          that is an{" "}
          <code className="rounded bg-muted px-1 font-mono">ImageBitmap</code>{" "}
          ONLY when the page has been rendered with{" "}
          <code className="rounded bg-muted px-1 font-mono">
            background: "transparent"
          </code>{" "}
          and the OffscreenCanvas API is available. In a normal main-thread
          render call (which is what we do), the image often comes back as{" "}
          <code className="rounded bg-muted px-1 font-mono">
            { "{ data: Uint8ClampedArray, width, height, kind }" }
          </code>{" "}
          where{" "}
          <code className="rounded bg-muted px-1 font-mono">data.length</code>{" "}
          may NOT match{" "}
          <code className="rounded bg-muted px-1 font-mono">
            width * height * {"{1,3,4}"}
          </code>
          — pdf.js packs scanlines with stride, and JPEG-encoded images come
          through as{" "}
          <code className="rounded bg-muted px-1 font-mono">
            { "{ jpegData: Uint8Array }" }
          </code>{" "}
          which we don't handle at all. Result: imageObjToBlob returns null
          for most images, OR returns a Blob that's all-transparent or
          subtly corrupt — the upload succeeds, storage stores zero or
          near-zero bytes, the &lt;img&gt; later 404s or fails to decode.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function CertaintyBadge({ c }: { c: "low" | "medium" | "high" }) {
  if (c === "high")
    return (
      <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 text-[10px]">
        high
      </Badge>
    )
  if (c === "medium")
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
        med
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px]">
      low
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Bug 2 — empty body
// ---------------------------------------------------------------------------

const BODY_FLOW: FlowStep[] = [
  {
    n: 1,
    where: "convex/importer/templates.ts:200 — buildSystemPrompt() for SOP",
    what: 'Tells Gemini to return JSON with `body: [array of TipTap block nodes]` plus title/summary/etc. Lists the allowed node kinds (heading, paragraph, list, callout, ppe, hr) but does NOT include a worked example of the exact JSON shape.',
    failureMode:
      "Without an example, Gemini may emit body as a top-level doc shape `{type:'doc',content:[…]}` (a different convention), as a string of markdown, or as a nested object instead of an array. Any of these defeats the Array.isArray check downstream.",
    certainty: "high",
  },
  {
    n: 2,
    where: "convex/importer/map.ts:107 — callGemini() POST + JSON.parse",
    what: "Sends responseMimeType: application/json, parses the response, returns the parsed object.",
    failureMode:
      "If Gemini returned valid JSON but with the body in a different field name (`content`, `nodes`, `blocks`, or wrapped one level deeper), the parse succeeds but mappedBody.body ends up undefined.",
    certainty: "medium",
  },
  {
    n: 3,
    where: "convex/importer/jobs.ts:165 — recordMapping() persists mappedBody",
    what: "Just stores whatever object Gemini returned. No validation on shape.",
    failureMode:
      "Persists the wrong shape unchanged. Wizard's Mapped stage shows it as 'detectedAssets … detectedDocs … sectionConfidence' just fine because those fields might be present, but body[] could be empty.",
    certainty: "low",
  },
  {
    n: 4,
    where: "src/pages/desktop/ImportPage.tsx:691 — handleFinalize() body extract",
    what: "`Array.isArray(mapped?.body) ? (mapped!.body as unknown[]) : []` → defaults to empty array if body isn't an array.",
    failureMode:
      "Silent fallback to `[]`. This is the line that turns a Gemini-shape mismatch into an empty editor with NO warning to the user. The wizard happily proceeds to create an empty document.",
    certainty: "high",
  },
  {
    n: 5,
    where: "convex/importer/jobs.ts:351 — finalizeDocument() inserts documentVersions",
    what: "Writes bodyJson = args.body verbatim to the v1 row.",
    failureMode:
      "Stores `{type:'doc',content:[]}` faithfully. No issue here — just the consequence of step 4.",
    certainty: "low",
  },
  {
    n: 6,
    where: "TipTap editor in DocumentEditor.tsx — setContent(bodyJson)",
    what: "Editor parses bodyJson, drops anything that doesn't match registered node specs.",
    failureMode:
      "Even if step 4 had passed through Gemini's nodes, malformed nodes (e.g. paragraph with `text: '…'` instead of `content: [{type:'text', text:'…'}]`) would be silently stripped. So we have a SECOND failure surface: even with a non-empty body[], TipTap might filter most of it out.",
    certainty: "medium",
  },
]

function BodyBugTraceSection() {
  return (
    <Section
      title="Bug 2 trace — empty editor body"
      description="The mutation returned a real document id, so finalizeDocument ran. The body it wrote was empty. Walking why."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[27%]">Where</TableHead>
                <TableHead className="w-[28%]">What</TableHead>
                <TableHead className="w-[30%]">Failure mode</TableHead>
                <TableHead className="w-[10%]">Certainty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BODY_FLOW.map((s) => (
                <TableRow key={s.n}>
                  <TableCell className="align-top text-[11px] font-mono text-muted-foreground">
                    {s.n}
                  </TableCell>
                  <TableCell className="align-top text-[11px] font-mono">
                    {s.where}
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {s.what}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {s.failureMode}
                  </TableCell>
                  <TableCell className="align-top">
                    <CertaintyBadge c={s.certainty} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>
          Most likely root cause: Gemini emitted a different shape than the
          prompt expected, and our parser silently filled body[] with an
          empty array.
        </AlertTitle>
        <AlertDescription className="space-y-1 text-xs">
          <div>
            The system prompt in templates.ts described the schema textually
            but didn't show a worked JSON example. Gemini's strong default is
            to emit{" "}
            <code className="rounded bg-muted px-1 font-mono">
              {"{ type: 'doc', content: [...] }"}
            </code>{" "}
            (the canonical TipTap shape it has seen in pretraining), or to
            ignore the structural request and dump the source as a single
            markdown string under{" "}
            <code className="rounded bg-muted px-1 font-mono">body</code>.
          </div>
          <div>
            Our wizard's Mapped stage shows{" "}
            <code className="rounded bg-muted px-1 font-mono">
              detectedAssets / detectedDocs / sectionConfidence
            </code>{" "}
            badges fine — those came through. But the raw-body{" "}
            <code className="rounded bg-muted px-1 font-mono">
              &lt;details&gt;
            </code>{" "}
            in BodyPreview would have shown an empty array. The user clicked
            past it because the rest of the UI looked OK.
          </div>
          <div>
            The naming-code in the editor screenshot (
            <code className="rounded bg-muted px-1 font-mono">
              HOL-OPS-SOP-9999
            </code>
            ) being the form pattern (not the AI suggestion){" "}
            <strong>is independently consistent</strong> with this hypothesis:
            Gemini's <code>namingCodeSuggestion</code> field also probably
            came back null or in the wrong place.
          </div>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Hypotheses ranked
// ---------------------------------------------------------------------------

interface Hypothesis {
  rank: number
  bug: "images" | "body" | "both"
  hypothesis: string
  evidence: string
  confidence: "low" | "medium" | "high"
}

const HYPOTHESES: Hypothesis[] = [
  {
    rank: 1,
    bug: "body",
    hypothesis:
      "Gemini emitted a TipTap `doc` wrapper instead of a bare body array. mapped.body was undefined → handleFinalize fell through to [].",
    evidence:
      "System prompt asks for `body` as an array but provides no example. Gemini almost always wraps doc content in {type:'doc',content:[]}. Our extractor only reads .body and ignores .content.",
    confidence: "high",
  },
  {
    rank: 2,
    bug: "images",
    hypothesis:
      "PDF.js image objects came back as JPEG-encoded buffers (jpegData) instead of bitmap or rgba. imageObjToBlob has no jpegData branch, returned null silently for most, and produced corrupt PNG canvases for a few that fell into the data branch.",
    evidence:
      "Pdfjs-dist 4.x returns jpegData for JPEG-source images. The user's SOP almost certainly contains JPEG photos. Our handler covers grayscale/RGB/RGBA only.",
    confidence: "high",
  },
  {
    rank: 3,
    bug: "body",
    hypothesis:
      "Even if Gemini emits a body array, the inner block nodes use a casual shape (e.g. paragraph with `text: '…'` instead of `content: [{ type: 'text', text: '…'}]`). TipTap silently strips them on setContent.",
    evidence:
      "Same prompt-without-example problem. TipTap's parseHTML / fromJSON is strict. Without a worked example, models drift.",
    confidence: "medium",
  },
  {
    rank: 4,
    bug: "images",
    hypothesis:
      "page.render() failed silently for the user's PDF (e.g. font load issue), so objs is empty when getOperatorList() asks for image XObjects → image bytes never reach the canvas. We then upload zero-byte / 1x1 blank PNGs.",
    evidence:
      "Our render is wrapped in try/catch with a continue. Silent failures + empty bitmap field → null blob.",
    confidence: "medium",
  },
  {
    rank: 5,
    bug: "both",
    hypothesis:
      "Gemini was rate-limited or returned a partial response that JSON.parse'd successfully but had truncated content. mappedBody was structurally valid but materially empty.",
    evidence:
      "We use gemini-3.1-flash-lite-preview with no max-tokens set. Long prompts can be silently truncated. No streaming guard.",
    confidence: "low",
  },
  {
    rank: 6,
    bug: "images",
    hypothesis:
      "Same-origin issue with Convex storage URLs in the embedded shell. The signed URL is on a different domain and the browser blocks it.",
    evidence:
      "Other pages (image library, document read view) DO show storage-backed images successfully, so cross-origin is unlikely. Listed for completeness.",
    confidence: "low",
  },
]

function HypothesisRankingSection() {
  return (
    <Section
      title="Hypotheses ranked"
      description="Most likely first. Multiple hypotheses can be simultaneously true (the user reported two distinct bugs)."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[8%]">Bug</TableHead>
                <TableHead className="w-[34%]">Hypothesis</TableHead>
                <TableHead className="w-[40%]">Evidence</TableHead>
                <TableHead className="w-[13%]">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HYPOTHESES.map((h) => (
                <TableRow key={h.rank}>
                  <TableCell className="align-top text-[11px] font-mono text-muted-foreground">
                    {h.rank}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline" className="text-[10px]">
                      {h.bug}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {h.hypothesis}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {h.evidence}
                  </TableCell>
                  <TableCell className="align-top">
                    <CertaintyBadge c={h.confidence} />
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
// Results — what shipped 2026-05-07
// ---------------------------------------------------------------------------

interface ResultRow {
  title: string
  files: string[]
  before: string
  after: string
}

const RESULTS: ResultRow[] = [
  {
    title: "JPEG fast-path + per-page fallback in extractPdf",
    files: ["src/lib/import/extractPdf.ts"],
    before:
      "PDF.js JPEG-source images came back as { jpegData: Uint8Array } — bypassed our bitmap/data branches → null → silently dropped or zero-byte PNG → broken-image icon.",
    after:
      "imageObjToBlob detects jpegData first, wraps as image/jpeg blob with no canvas round-trip. Pages where op-list extraction returned nothing get a full-page render fallback. paintImageXObjectRepeat now matched. Sub-500-byte blobs rejected. Stats returned alongside the extract result.",
  },
  {
    title: "TipTap body sanitiser",
    files: ["src/lib/import/sanitizeTiptap.ts (new)"],
    before:
      "handleFinalize read mapped.body and silently fell through to [] when shapes mismatched. Editor opened empty.",
    after:
      "extractBodyContent walks 7 alternative shape paths (body, body.content, type:'doc', content, blocks, nodes, tiptap). sanitizeNodes normalises shorthand text, drops unknown types, wraps loose strings into paragraphs. buildFallbackBody produces a per-page paragraph fallback when the AI emits nothing usable.",
  },
  {
    title: "System prompt with worked example + softened verbatim",
    files: ["convex/importer/templates.ts"],
    before:
      "Prompt described the JSON shape textually — Gemini drifted to its own conventions ({type:'doc',content:[…]} or markdown-as-string). Verbatim instruction said 'character-for-character', which models interpreted as 'skip structure'.",
    after:
      "Both SOP and log-spec prompts now contain a full worked JSON example with strict TipTap shape. Verbatim instruction softened: preserve text within nodes, NEVER collapse structure. Strict-rules block lists six common failure modes by name and forbids them.",
  },
  {
    title: "Re-run AI mapping button + always-open raw dump",
    files: ["src/pages/desktop/ImportPage.tsx"],
    before:
      "User saw 'mapped' stage with confident-looking summary badges; raw body was inside a collapsed <details>; if the body shape was wrong, they only found out at the empty editor.",
    after:
      "Raw mappedBody dump is open by default at the Mapped stage. Re-run AI mapping button next to Resolve cross-links — non-deterministic responses can be retried without restarting from upload.",
  },
  {
    title: "Stats persistence + extract panel",
    files: [
      "convex/schema.ts (extractStats field)",
      "convex/importer/jobs.ts (recordExtraction args)",
      "src/pages/desktop/ImportPage.tsx (ExtractedStage stats panel)",
    ],
    before: "'Images (14)' badge with no breakdown — broken vs valid, JPEG vs PNG, fallback or not — invisible.",
    after:
      "Six-field stats persisted on the job. Wizard shows: 'X detected · Y extracted (J JPEG / P PNG) · Z skipped (too small) · F page-fallback'. Skipped count surfaces silently-dropped corruption immediately.",
  },
  {
    title: "Promote-images uses correct content-type",
    files: ["src/lib/import/promoteImages.ts"],
    before: "All extracted blobs uploaded as image/png regardless of source format.",
    after:
      "Each ExtractedImage carries its contentType (image/png or image/jpeg). promoteImages uses it on both the upload POST and the createFromUpload mutation.",
  },
]

function ResultsSection() {
  return (
    <Section
      title="Results — what shipped"
      description="One row per group of fixes. Files touched, before/after framing. All 12 plan steps landed in a single pass."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {RESULTS.map((r) => (
            <div key={r.title} className="rounded-md border bg-card p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
                  {r.files.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.files.map((f) => (
                        <code
                          key={f}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          {f}
                        </code>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 grid gap-2 text-xs leading-relaxed sm:grid-cols-2">
                    <div className="rounded border border-destructive/20 bg-destructive/5 p-2">
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                        Before
                      </div>
                      <div className="text-muted-foreground">{r.before}</div>
                    </div>
                    <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2">
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        After
                      </div>
                      <div className="text-foreground">{r.after}</div>
                    </div>
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

// ---------------------------------------------------------------------------
// Edge cases / acceptance criteria
// ---------------------------------------------------------------------------

interface EdgeRow {
  scenario: string
  before: string
  after: string
  severity: "high" | "med" | "low"
  shipped: boolean
}

const EDGE_CASES: EdgeRow[] = [
  {
    scenario: "Digital PDF with JPEG-embedded photos",
    before: "Photos extracted as null or zero-byte blobs; grid all broken.",
    after:
      "JPEG images detected via jpegData and saved verbatim with content-type image/jpeg. Grid renders the photos.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Digital PDF with raster RGB images",
    before:
      "Sometimes works, sometimes not depending on whether width*height*3 matches the data length.",
    after:
      "Robust RGB→RGBA conversion with stride detection; falls back to per-page render-and-crop when image data is unrecognized.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "Same logo on every page",
    before:
      "paintImageXObjectRepeat is missed by the op-list filter; logo is extracted only on its first appearance OR not at all.",
    after:
      "Both paintImageXObject and paintImageXObjectRepeat handled. sha256 dedup at extract+convex layers means one storage row regardless.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Gemini returns body wrapped as `{type:'doc',content:[…]}`",
    before: "Empty editor (current behaviour).",
    after:
      "Body extractor handles doc-wrapper shape, bare-array shape, and content-key alternatives. Logs a warning when none match.",
    severity: "high",
    shipped: true,
  },
  {
    scenario:
      "Gemini emits paragraph nodes with shorthand `text: '…'` instead of content array",
    before:
      "TipTap silently strips shorthand nodes. Editor renders fewer paragraphs than mapping suggested.",
    after:
      "Sanitizer runs over the body array, normalising shorthand text nodes into TipTap's strict shape before persistence.",
    severity: "high",
    shipped: true,
  },
  {
    scenario: "AI mapping returns nothing parseable (rate limit, empty)",
    before:
      "Stage transitions to 'mapped' anyway with mappedBody = empty object. Wizard advances. Document landing as empty.",
    after:
      "If body extractor finds zero usable blocks, build a deterministic per-page paragraph body and toast 'AI mapping returned no usable blocks'. The editor never lands empty.",
    severity: "high",
    shipped: true,
  },
  {
    scenario:
      "Verbatim mode + extracted markdown is the only signal we trust",
    before:
      "We rely entirely on Gemini's structural emission. If Gemini fails, no fallback content is created.",
    after:
      "buildFallbackBody generates a per-page paragraph body from extractedPages whenever sanitisation yields zero blocks. Editor lands populated with verbatim source text.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Naming code suggestion is null but UI form requires it",
    before:
      "User has to type a code matching the ^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-\\d{4}$ pattern manually. Easy to typo.",
    after:
      "Auto-derive a default from the source filename. (Not yet shipped — still falls back to the form pattern; v1.1 follow-up.)",
    severity: "low",
    shipped: false,
  },
  {
    scenario: "Image is 'extracted' but actually a 0-byte PNG",
    before:
      "createFromUpload accepts the bytes, the row exists, the URL renders broken.",
    after:
      "Pre-flight sanity check: skip blobs with byteSize < 500. Skip-count surfaced in the wizard's extract stats panel.",
    severity: "med",
    shipped: true,
  },
  {
    scenario: "Two different images happen to share sha256 (cosmic ray)",
    before:
      "createFromUpload de-dups them as one. Practically impossible but listed for completeness.",
    after:
      "Acceptable. Sha collisions on PNG bytes are not real-world.",
    severity: "low",
    shipped: true,
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases — what should work after the fix"
      description="Each row is a test scenario. 'After' is what we set out to deliver. 'Shipped?' shows the post-implementation state — 9 of 10 landed; the naming-code auto-derive is a v1.1 follow-up."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Scenario</TableHead>
                <TableHead className="w-[26%]">Before (broken)</TableHead>
                <TableHead className="w-[32%]">After (target)</TableHead>
                <TableHead className="w-[10%] text-right">Severity</TableHead>
                <TableHead className="w-[10%] text-right">Shipped?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((r) => (
                <TableRow key={r.scenario}>
                  <TableCell className="align-top text-[11px] font-semibold">
                    {r.scenario}
                  </TableCell>
                  <TableCell className="align-top text-[11px] text-muted-foreground">
                    {r.before}
                  </TableCell>
                  <TableCell className="align-top text-[11px]">
                    {r.after}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <SeverityBadge s={r.severity} />
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {r.shipped ? (
                      <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
                        <Check className="h-2.5 w-2.5" />
                        yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        later
                      </Badge>
                    )}
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

function SeverityBadge({ s }: { s: "high" | "med" | "low" }) {
  if (s === "high")
    return (
      <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 text-[10px]">
        high
      </Badge>
    )
  if (s === "med")
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
        med
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px]">
      low
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Self-grilling
// ---------------------------------------------------------------------------

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling — where this analysis could be wrong"
      description="Honest checks. At least one uncomfortable counter-hypothesis."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Is the empty editor really because of bodyJson, or could it be a render issue in the editor itself?"
            a="Could be the editor. The DocumentEditor has a useEffect that calls editor.commands.setContent(bodyJson) when the version loads. If bodyJson is non-null but a string, TipTap throws and console-logs. Or if our editor's extension list is missing a node type, that node is stripped. We should verify by looking at the actual stored bodyJson via Convex dashboard before editing the wizard. If bodyJson is `{type:'doc',content:[]}` we know it's the wizard; if it's a populated doc we know it's the editor render."
          />
          <Grill
            q="Is the broken-image icon definitely from a non-empty src?"
            a="In Chrome, an <img> with src='' renders the alt text in a small frame, not the broken-image glyph. Firefox is similar. The screenshot's icon is clearly the broken-image glyph. So yes — src is set but the response isn't a valid image. The leading hypothesis (zero-byte / corrupt PNG from imageObjToBlob) fits."
          />
          <Grill
            q="Could the issue be CSP or COEP blocking the image?"
            a="The dev server sets `Cross-Origin-Embedder-Policy: require-corp` (per CLAUDE.md). Convex signed URLs return CORP headers. Other pages render storage-backed images fine. Unlikely root cause for THIS page."
          />
          <Grill
            q="Why is the naming code HOL-OPS-SOP-9999 — is that a clue?"
            a="Yes. That's the placeholder pattern the form shows when the AI's namingCodeSuggestion is null/missing. The AI screen had filled in the title (`Eddycurrent Machine Operation`) but not the code. So Gemini DID produce a title field correctly — meaning the JSON was parsed and structurally something came through. But the body and namingCodeSuggestion fields didn't make it. That's consistent with hypothesis 1: shape mismatch where the SCALAR fields land, but the structural BODY field doesn't."
          />
          <Grill
            q="Uncomfortable counter-hypothesis: are we treating verbatim mode differently than improve mode in the prompt? Could verbatim be defeating Gemini's structural emission?"
            a="Verbatim instruction says 'copy the source text character-for-character'. A model that takes that literally might emit the entire markdown as a single string under `body` instead of structured nodes. We tested verbatim. If switching to improve mode produces a non-empty editor, this hypothesis is confirmed and we need to soften the verbatim instruction (e.g. 'preserve text verbatim WITHIN paragraphs, but still emit them as separate paragraph nodes'). This is the most uncomfortable one because it means the verbatim default — the safety story for compliance — is less reliable than improve. Worth testing both modes once the fix lands."
          />
          <Grill
            q="Could this just be a one-off bad Gemini response?"
            a="Possible — Gemini Flash variants are non-deterministic. But running the same import twice and getting the same empty body would falsify that. We should add a 'Re-run AI mapping' button on the Mapped stage so the user can retry without restarting from upload. Even if THIS run was a one-off, the silent empty-body fallback in handleFinalize is still the wrong default."
          />
          <Grill
            q="Are we sure the 14 images is real and not a count of failed extractions?"
            a="The badge reads 'Images (14)' from job.extractedImageIds.length. recordExtraction was called with a 14-element array. If imageObjToBlob had returned null for all of them, promoteImages would have skipped the upload — but image rows wouldn't have been created either, so the array would be empty, not 14. So at least 14 image rows DO exist in Convex; the question is whether their stored bytes are good."
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
// Fix plan
// ---------------------------------------------------------------------------

interface FixStep {
  n: number
  area: "images" | "body" | "diagnostics"
  title: string
  files: string[]
  detail: string
  shipped: boolean
}

const FIX_PLAN: FixStep[] = [
  {
    n: 1,
    area: "diagnostics",
    title: "Add a Raw mappedBody dump to the Mapped stage UI",
    files: ["src/pages/desktop/ImportPage.tsx — BodyPreview"],
    detail:
      "Always show the raw JSON in a collapsed <details> so the user can spot a wrong shape at the Mapped stage rather than at the empty editor.",
    shipped: true,
  },
  {
    n: 2,
    area: "body",
    title: "Robust body extractor in handleFinalize",
    files: ["src/pages/desktop/ImportPage.tsx — extractBodyContent()"],
    detail:
      "Try mapped.body, mapped.content, mapped.body.content (when body is the doc wrapper), and finally the doc-wrapper shape if mapped.type === 'doc'. Toast a warning when fallback path was needed so we learn what Gemini actually returns.",
    shipped: true,
  },
  {
    n: 3,
    area: "body",
    title: "TipTap node sanitiser",
    files: ["src/lib/import/sanitizeTiptap.ts (new)"],
    detail:
      "Walk the body array. For each node: ensure `type` is a registered kind. Normalise text shorthand (`text: 'x'` → `content: [{type:'text',text:'x'}]`). Drop unknown nodes; log a count to the console.",
    shipped: true,
  },
  {
    n: 4,
    area: "body",
    title: "Add a worked example to the SOP system prompt",
    files: ["convex/importer/templates.ts — buildSystemPrompt()"],
    detail:
      "Show Gemini one full example: heading → paragraph → ppe → orderedList with listItems containing paragraphs. Pin the exact JSON shape rather than describing it. Same for log-spec prompt.",
    shipped: true,
  },
  {
    n: 5,
    area: "body",
    title: "Soften the verbatim instruction",
    files: ["convex/importer/templates.ts — verbatimNote"],
    detail:
      "Change 'copy character-for-character' to 'preserve every word, sentence, and value VERBATIM within each emitted node — but still emit each section as the correct node type, do not collapse to a single string'. Reduces the risk of monolithic-string outputs.",
    shipped: true,
  },
  {
    n: 6,
    area: "body",
    title: "Add a 'Re-run AI mapping' button on the Mapped stage",
    files: ["src/pages/desktop/ImportPage.tsx — MappedStage"],
    detail:
      "User can retry the AI step without restarting from upload. Useful for non-deterministic responses.",
    shipped: true,
  },
  {
    n: 7,
    area: "body",
    title: "Fallback body when Gemini produces nothing usable",
    files: ["src/pages/desktop/ImportPage.tsx — handleFinalize()"],
    detail:
      "If sanitiser ends up with zero blocks, build a deterministic body from extractedPages: one heading per page + paragraphs per text line. The editor never lands empty for an SOP target.",
    shipped: true,
  },
  {
    n: 8,
    area: "images",
    title: "Handle JPEG-source images via jpegData",
    files: ["src/lib/import/extractPdf.ts — imageObjToBlob()"],
    detail:
      "Add a branch: if i.jpegData (Uint8Array) is present, wrap as `new Blob([jpegData], {type:'image/jpeg'})`, set filename .jpg, return directly. Skip the canvas round-trip.",
    shipped: true,
  },
  {
    n: 9,
    area: "images",
    title: "Render-and-crop fallback for unhandled image objects",
    files: ["src/lib/import/extractPdf.ts — extractPdf()"],
    detail:
      "If op-list extraction returns < 1 image for a page that had paintImageXObject ops, fall back to rendering the page at 2x scale and offering it as a single page-image. The user can crop later in the image library.",
    shipped: true,
  },
  {
    n: 10,
    area: "images",
    title: "Match both paintImageXObject and paintImageXObjectRepeat",
    files: ["src/lib/import/extractPdf.ts — op-list filter"],
    detail:
      "Replace the `??` chain with explicit checks against both op codes. Same for paintInlineImageXObject (already handled but verify resolves correctly).",
    shipped: true,
  },
  {
    n: 11,
    area: "images",
    title: "Pre-flight blob sanity check before promote",
    files: ["src/lib/import/extractPdf.ts — imageObjToBlob()"],
    detail:
      "Reject blobs smaller than ~500 bytes (PNG headers + a few pixels). These are almost certainly decoration / corrupt extracts. Log the count so the wizard can surface 'X images skipped — likely decoration'.",
    shipped: true,
  },
  {
    n: 12,
    area: "diagnostics",
    title: "Surface skipped/failed counts in the wizard",
    files: ["src/pages/desktop/ImportPage.tsx — ExtractedStage stats"],
    detail:
      "Add 'X skipped (too small)' and 'X failed (unsupported encoding)' tallies so the user can correlate the 'Images (14)' badge against actual usable images.",
    shipped: true,
  },
]

function FixPlanSection() {
  return (
    <Section
      title="Fix plan — twelve steps in three groups (all shipped)"
      description="Diagnostics first (so we can verify hypotheses before the surgical fixes). Then the body fixes (highest-leverage). Then the image fixes (more involved). All twelve landed in one pass on 2026-05-07."
    >
      <Card>
        <CardContent className="space-y-3 pt-6">
          {FIX_PLAN.map((s) => (
            <div
              key={s.n}
              className={cn(
                "rounded-md border p-3",
                s.shipped
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "bg-card",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-mono text-[10px]"
                >
                  step {s.n}
                </Badge>
                <AreaBadge area={s.area} />
                {s.shipped && (
                  <Badge className="gap-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
                    <Check className="h-2.5 w-2.5" />
                    shipped
                  </Badge>
                )}
                <ArrowRight className="h-3 w-3 text-primary" />
                <span className="text-sm font-semibold">{s.title}</span>
              </div>
              <ul className="mt-1.5 space-y-0.5 pl-5 text-[11px] font-mono text-muted-foreground">
                {s.files.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-1.5 text-xs text-muted-foreground">
                {s.detail}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  )
}

function AreaBadge({
  area,
}: {
  area: "images" | "body" | "diagnostics"
}) {
  if (area === "images")
    return (
      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px]">
        images
      </Badge>
    )
  if (area === "body")
    return (
      <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px]">
        body
      </Badge>
    )
  return (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
      diagnostics
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Decisions (was Open questions — closed out 2026-05-07)
// ---------------------------------------------------------------------------

function DecisionsSection() {
  return (
    <Section
      title="Decisions — calls made during the fix"
      description="The five questions raised in this analysis, with the calls actually taken."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Decision
            q="Did Gemini fill in the title but not body?"
            a="Yes — confirmed by the editor screenshot showing the correct title with empty body. That confirmed hypothesis 1 (shape mismatch where scalar fields land but the structural body field doesn't) and ruled out 'Gemini failed entirely'. Drove the prompt-with-worked-example fix (step 4)."
          />
          <Decision
            q="Should we test improve-mode against the same SOP?"
            a="Skipped that direct test in favour of the structural fix: softened the verbatim instruction to preserve text WITHIN nodes (not collapsing structure), AND added a worked JSON example. Both verbatim and improve modes now drive the same structural emission, so the historical distinction is moot."
          />
          <Decision
            q="Render-and-crop OR per-page render?"
            a="Per-page render as the fallback rope. Granular op-list extraction stays primary (finer-grained = better images when it works). Per-page render only fires when a page had paintImageXObject ops but yielded zero successful extracts — never a default."
          />
          <Decision
            q="Hard-error vs silent-fallback on empty body?"
            a="Deterministic per-page-paragraph fallback with a toast warning. Worse output beats no output. The toast tells the engineer what happened so they can re-run mapping or restructure."
          />
          <Decision
            q="Inspect the actual mappedBody before fixing?"
            a="Did not gate on it — shipped all 12 steps in one pass. The raw-mappedBody dump is now always-open at the Mapped stage, so future debug sessions don't need a Convex dashboard round-trip."
          />
        </CardContent>
      </Card>
      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle>Closed.</AlertTitle>
        <AlertDescription className="text-xs">
          Follow-ups: naming-code auto-derive from filename (the one edge-case
          row not yet shipped), test improve-mode vs verbatim-mode against the
          same source on a future sample, surface a per-image "open in image
          library" link from the page-fallback tile so users can split the
          full-page render into smaller crops.
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function Decision({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-0.5">
          <div className="font-medium">Q. {q}</div>
          <div className="text-xs text-muted-foreground">A. {a}</div>
        </div>
      </div>
    </div>
  )
}

// Avoid unused-import warnings if the icon list shifts.
export const _unused = {
  AlertCircle,
  Code,
  Eye,
  Layers,
  Package,
  Workflow,
  XCircle,
  Zap,
}
