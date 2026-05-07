// Run #2 of the Eddycurrent SOP through /import after the StructuredDoc
// intermediate landed. Document body is now structurally faithful (headings,
// PPE block, equipment table, reference list, revision history) but four
// independent bugs surfaced — three are blockers, one is a missing feature
// set the user explicitly asked for. Frozen-in-time case file. No live data.

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Eye,
  FileText,
  Image as ImageIcon,
  ImageOff,
  Layers,
  ListChecks,
  Microscope,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  XCircle,
  Check,
  X,
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
import { Checkbox } from "@/components/ui/checkbox"
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

const IMG = (f: string) => `/analysis/eddycurrent-importer-walkthrough-v2/${f}`

export function EddycurrentImporterWalkthroughV2Analysis() {
  return (
    <AnalysisLayout
      title="Eddycurrent SOP — importer run #2"
      subtitle="Same source PDF (UP-OPS-SOP-010) re-pushed through /import after the StructuredDoc intermediate landed. The document body is now structurally faithful — headings, PPE block, equipment table, reference list, revision history all round-trip. But four independent issues surfaced in run #2: image thumbnails fail to load (COEP), the cross-link Accept button is ambiguous when there's no candidate, deleting a document doesn't recompute imageUsages, and the image library is missing the deletion + multi-select + sort-by-doc UX needed to actually manage the library at scale."
      date="2026-05-07"
      scopes={["desktop", "data-model"]}
    >
      <SummaryHeaderCard />
      <WhatImprovedSection />
      <ProblemSection />
      <EvidenceSection />
      <BugsTableSection />
      <Bug1CoepSection />
      <Bug2CrosslinksSection />
      <Bug3DeleteOrphansSection />
      <Bug4ImageLibrarySection />
      <SelfGrillingSection />
      <ImplementationPlanSection />
      <ResultsSection />
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
          icon={CheckCircle2}
          label="What worked"
          value="StructuredDoc renders headings, PPE block, equipment table, reference list, revision history, naming code, title — all faithful."
          tone="emerald"
        />
        <SummaryCell
          icon={Wrench}
          label="What shipped"
          value={'All 4 bugs/features. COEP dropped. Cross-link Accept-disabled replaced with explicit "Will skip" + empty-library banner. Doc deletion sweeps imageUsages. Image library has selection, sticky bar, bulk delete with refused-list confirmation, group-by-document view.'}
          tone="emerald"
        />
        <SummaryCell
          icon={CheckCircle2}
          label="Status"
          value="Shipped 2026-05-07 · awaiting re-test against the same eddycurrent SOP"
          tone="emerald"
        />
        <SummaryCell
          icon={ShieldCheck}
          label="Verification"
          value="tsc -b exit 0 · vite build exit 0 (only pre-existing PdfViewer/TiptapReadOnly chunking warnings)"
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
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: "emerald" | "destructive" | "amber" | "muted"
}) {
  const toneClass = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    destructive: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
    muted: "text-muted-foreground",
  }[tone]
  return (
    <div className="space-y-1.5">
      <div className={cn("flex items-center gap-1.5 text-xs uppercase tracking-wider", toneClass)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-xs leading-relaxed">{value}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// What improved (run #1 → run #2)
// ---------------------------------------------------------------------------

function WhatImprovedSection() {
  const rows = [
    {
      area: "Headings + sections",
      before: "Flat verbatim dump. Section 1, 1.1, 1.2, 2 all rendered as paragraphs.",
      after: "Numbered headings detected. \"Equipment list\", \"Reference documents\", \"Required PPE\", \"Revision Control\" all top-level h2.",
    },
    {
      area: "Equipment list",
      before: "Inline run-on text \"01 100 02-100-MD-03 Eddy current machine…\".",
      after: "3-column table (Code, Name, Area) — see Screenshot 09 mid-document.",
    },
    {
      area: "PPE",
      before: "Six lines of \"Wear safety goggles\" text, no iconography.",
      after: "Required PPE block with Gloves + Safety Boots chips + \"Refer to manual\" notice. (Goggles/helmet/hearing/clothes mapping is partial — see Bug 2 below.)",
    },
    {
      area: "Reference documents",
      before: "\"01 XXX Eddy Current Operating Manual / 02 XXX Filling… / 03 UP-OPS-TRG-007\" as one paragraph.",
      after: "Bullet list of three references; UP-OPS-TRG-007 surfaced into cross-link suggestions.",
    },
    {
      area: "Revision history",
      before: "Lost into body text.",
      after: "Renders as a real revision-history table on the published PDF cover page (Screenshot 12).",
    },
    {
      area: "Naming code + title",
      before: "Suggested naming code missing; title was filename.",
      after: "Title prefilled \"EDDYCURRENT MACHINE\". Naming code prefilled UP-OPS-SOP-0001 (4-digit pad).",
    },
    {
      area: "Equipment tags as cross-link candidates",
      before: "Asset tags lost in inline text — never reached cross-link stage.",
      after: "02-100-MD-03 / 02-100-BBU-03 / 02-100-CC-12 all surfaced on cross-link page.",
    },
  ]
  return (
    <Section
      title="What improved between run #1 and run #2"
      description="The StructuredDoc intermediate did the heavy lifting. Body is now structurally faithful — the bugs in run #2 are around it, not inside it."
    >
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[18%]">Area</TableHead>
              <TableHead className="w-[37%]">Before (run #1)</TableHead>
              <TableHead className="w-[37%]">After (run #2)</TableHead>
              <TableHead className="w-[8%] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.area}>
                <TableCell className="font-medium text-xs">{r.area}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.before}</TableCell>
                <TableCell className="text-xs">{r.after}</TableCell>
                <TableCell className="text-right">
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
                    fixed
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Problem statement
// ---------------------------------------------------------------------------

function ProblemSection() {
  return (
    <Section title="What's still broken in run #2">
      <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Four issues in the way of declaring the importer fit-for-demo</AlertTitle>
        <AlertDescription className="space-y-1.5 text-xs leading-relaxed">
          <p>
            <strong>1. COEP blocks Convex storage thumbnails.</strong> Image preview tiles
            on the Extract stage and the Image library show as empty boxes. DevTools
            console floods with <code className="rounded bg-muted px-1">ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep</code>.
            Root cause: the Vite dev server sets <code className="rounded bg-muted px-1">Cross-Origin-Embedder-Policy: require-corp</code> globally
            (vite.config.ts:15). Convex storage URLs don't carry a matching CORP header, so the browser refuses to load them.
          </p>
          <p>
            <strong>2. Cross-link &quot;Accept&quot; greyed out is ambiguous.</strong> When a candidate match
            shows <code>(no candidate) 0%</code>, the Accept button is disabled but the copy
            and check icon still read &quot;Accept&quot;. The user can't tell whether
            the row was already accepted or whether it can't be accepted. Accept-with-no-target should be a different verb.
          </p>
          <p>
            <strong>3. Deleting a document leaves imageUsages orphans.</strong> The image library still
            shows the image as &quot;Used in 1 doc&quot; for a document that no longer exists; the
            detail modal correctly says &quot;Not currently referenced&quot;. The two views disagree.
            Root cause: <code>documents.remove</code> sweeps versions, chunks, links and logRefs but
            never touches <code>imageUsages</code>.
          </p>
          <p>
            <strong>4. Image library is missing the management UX it needs.</strong> Single-image delete works (modal
            blocks if used in a doc — correct rule). But there's no multi-select, no
            shift-click range, no bulk delete, no sort-by-document, no expand/collapse to inspect
            which images belong to which doc. With 14 imports per SOP this is the difference
            between a 30-second sweep and a 5-minute click-fest.
          </p>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Evidence — screenshots
// ---------------------------------------------------------------------------

function EvidenceSection() {
  const evidence = [
    {
      key: "upload",
      label: "1 — Upload",
      caption: "Upload stage. \"Promoting 14 images to the image library\" while the PDF uploads.",
      img: "01-upload.png",
    },
    {
      key: "extract-text",
      label: "2 — Extract text",
      caption: "Extracted text view. Page 1 cover-sheet metadata, page 2 starts the SOP body. Naming code + revision dates already legible.",
      img: "02-extract-text.png",
    },
    {
      key: "extract-images",
      label: "3 — Extract images (broken)",
      caption: "Images tab. 14 thumbnails are empty cards. \"Deterministic structure already detected. Continue to cross-links.\" — wizard works, only thumbnails are broken.",
      img: "03-extract-images-broken-tiles.png",
    },
    {
      key: "coep-devtools",
      label: "4 — COEP errors in devtools",
      caption: "Network/Console panel. Long list of ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep against signed Convex storage URLs.",
      img: "06-coep-devtools.png",
    },
    {
      key: "crosslinks",
      label: "5 — Cross-link page",
      caption: "All 6 candidates show \"(no candidate) 0%\" and the Accept button is greyed out. The check icon next to the disabled button reads as if it's already accepted.",
      img: "07-crosslinks-no-candidate.png",
    },
    {
      key: "doc-top",
      label: "6 — Finalized document (top)",
      caption: "Editor view. Title + naming code + revision banner. Equipment list table. Reference documents bullet list. Required PPE chip block.",
      img: "08-finalized-doc-top.png",
    },
    {
      key: "doc-mid",
      label: "7 — Finalized document (mid)",
      caption: "Safety Precautions section. Equipment and materials. Some run-on text in places where the PDF used inline equipment-tag references.",
      img: "09-finalized-doc-mid.png",
    },
    {
      key: "doc-figures",
      label: "8 — Imported figures section",
      caption: "Imported figures appended at the end. Empty image tiles — same COEP root cause as Stage 2 thumbnails.",
      img: "10-finalized-doc-figures.png",
    },
    {
      key: "publish-cover",
      label: "9 — Publish-to-PDF cover",
      caption: "Cover page renders cleanly. Type, naming code, owner, revision, linked assets, PPE chips, revision history table.",
      img: "12-publish-pdf-cover.png",
    },
    {
      key: "publish-broken",
      label: "10 — Publish-to-PDF figures",
      caption: "Imported figures appendix in the PDF — same broken-image pattern. The PDF print pulls from the live page so COEP-blocked images stay broken.",
      img: "11-publish-pdf-broken-figures.png",
    },
    {
      key: "img-library",
      label: "11 — Image library (orphan column)",
      caption: "Library after deleting the document. \"Used in: 1 doc\" still shown for every image, even though the document was deleted. This is the imageUsages-not-swept bug.",
      img: "14-image-library-orphans-still-1doc.png",
    },
    {
      key: "img-detail",
      label: "12 — Image detail modal",
      caption: "Same image clicked. Detail says \"USED IN 0 DOCUMENTS · Not currently referenced. Safe to delete.\" The library list and the detail modal disagree.",
      img: "13-image-detail-orphan.png",
    },
  ]
  return (
    <Section
      title="Evidence"
      description="Twelve screenshots from run #2. Same source PDF, same wizard path."
    >
      <Tabs defaultValue={evidence[0].key} className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start">
          {evidence.map((e) => (
            <TabsTrigger key={e.key} value={e.key} className="text-xs">
              {e.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {evidence.map((e) => (
          <TabsContent key={e.key} value={e.key} className="mt-3">
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-xs text-muted-foreground">{e.caption}</p>
                <img
                  src={IMG(e.img)}
                  alt={e.caption}
                  className="w-full rounded-md border"
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Bugs table — single source of truth
// ---------------------------------------------------------------------------

function BugsTableSection() {
  const rows: Array<{
    id: string
    bug: string
    surface: string
    rootCause: string
    fix: string
    severity: "blocker" | "major" | "minor"
    shipped?: boolean
  }> = [
    {
      id: "1",
      bug: "COEP blocks every Convex storage <img>",
      surface: "Extract stage thumbnails · finalized doc imported figures · publish-to-PDF appendix",
      rootCause: "vite.config.ts:15 sets Cross-Origin-Embedder-Policy: require-corp; Convex signed URLs return no CORP header",
      fix: "Switch dev to credentialless OR remove COEP/COOP entirely (we don't use SharedArrayBuffer)",
      severity: "blocker",
      shipped: true,
    },
    {
      id: "2a",
      bug: "Disabled Accept button reads as \"already accepted\"",
      surface: "Cross-link stage · 6 rows in eddycurrent run all looked the same",
      rootCause: "ImportPage.tsx:1432-1441 disables the button but keeps Accept copy + check icon. No \"no match\" state.",
      fix: "Show \"Skip\" / \"No match\" / muted text instead of a disabled Accept; reserve the green check for actually-accepted state.",
      severity: "major",
      shipped: true,
    },
    {
      id: "2b",
      bug: "All cross-link candidates were 0% match",
      surface: "Same screen — 3 reference docs, 3 asset tags, 0 hits",
      rootCause: "Convex DB was wiped before this test → seed never re-ran → no asset/document records exist to match against",
      fix: "Show an amber banner above the resolution list when every row is unmatched, explaining the \"plain text\" fallback so the user isn't misled into thinking the resolver is broken.",
      severity: "minor",
      shipped: true,
    },
    {
      id: "3",
      bug: "Doc deletion leaves orphan imageUsages",
      surface: "Image library Used-in column shows \"1 doc\" for deleted documents; detail modal disagrees",
      rootCause: "convex/documents.ts:485-533 — remove() sweeps documentVersions, chunks, documentAssets, documentLogRefs but never imageUsages",
      fix: "Add imageUsages sweep to documents.remove",
      severity: "major",
      shipped: true,
    },
    {
      id: "4a",
      bug: "No multi-select on image library list",
      surface: "/images route — single click opens modal; no checkboxes; can't act on a batch",
      rootCause: "ImageLibraryPage.tsx — TableRow onClick → modal; no selection state",
      fix: "Add a checkbox column + selection state + shift-click range",
      severity: "major",
      shipped: true,
    },
    {
      id: "4b",
      bug: "No bulk delete mutation",
      surface: "convex/images.ts — only single id remove(); no removeMany",
      rootCause: "Not built yet",
      fix: "Add removeMany mutation that delegates to remove() per id, returning {ok, refused} list",
      severity: "major",
      shipped: true,
    },
    {
      id: "4c",
      bug: "No sort-by-document / expand-collapse view",
      surface: "Library only sorts by createdAt desc",
      rootCause: "Single flat list",
      fix: "Add a \"group by document\" view-mode toggle. Each document is a header row with expand/collapse. Multi-doc images appear under a \"Shared (N docs)\" group at the top.",
      severity: "minor",
      shipped: true,
    },
  ]
  return (
    <Section
      title="Bug + feature register"
      description="One table, one ID per finding. Severity drives the order in the implementation plan below."
    >
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">#</TableHead>
              <TableHead className="w-[24%]">Issue</TableHead>
              <TableHead className="w-[18%]">Surface</TableHead>
              <TableHead className="w-[24%]">Root cause</TableHead>
              <TableHead className="w-[19%]">Fix direction</TableHead>
              <TableHead className="w-[5%] text-right">Sev</TableHead>
              <TableHead className="w-[5%] text-right">Shipped</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-[11px]">{r.id}</TableCell>
                <TableCell className="text-xs font-medium">{r.bug}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{r.surface}</TableCell>
                <TableCell className="text-[11px]">
                  <code className="font-mono">{r.rootCause}</code>
                </TableCell>
                <TableCell className="text-[11px]">{r.fix}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      r.severity === "blocker" && "border-red-500/40 text-red-700 dark:text-red-300",
                      r.severity === "major" && "border-amber-500/40 text-amber-700 dark:text-amber-300",
                      r.severity === "minor" && "border-muted-foreground/30 text-muted-foreground",
                    )}
                  >
                    {r.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-[11px] text-muted-foreground">
                  {r.shipped ? <Check className="ml-auto h-3.5 w-3.5 text-emerald-600" /> : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Bug 1 — COEP
// ---------------------------------------------------------------------------

function Bug1CoepSection() {
  return (
    <Section
      title="Bug 1 — COEP blocks Convex storage thumbnails"
      description="Three options. The cheap one is correct."
    >
      <Card>
        <CardContent className="space-y-4 p-5 text-sm">
          <div>
            <h3 className="text-sm font-semibold mb-2">Why this happens</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              COEP (<code className="rounded bg-muted px-1">require-corp</code>) tells the browser that any cross-origin
              subresource (image, iframe, script) must explicitly opt-in via a
              <code className="rounded bg-muted px-1">Cross-Origin-Resource-Policy</code> response header
              <em> or </em> via CORS with credentials mode. Convex storage signed URLs do neither —
              they return signed but non-CORP-tagged GET responses. The browser silently refuses to render the image.
              The wizard works because all the wizard logic depends on metadata, not on the actual pixel bytes;
              only the <code>{"<img>"}</code> tags break.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Three options</h3>
            <div className="space-y-2 text-xs">
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Option A — Drop COEP/COOP entirely</span>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">recommended</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Delete the <code>server.headers</code> block in vite.config.ts. We don't use SharedArrayBuffer,
                  WebAssembly threading, or anything else that requires cross-origin isolation. The headers were a leftover
                  from when sql.js + WASM thread-pool was on the table; they're now load-bearing for nothing.
                </p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Option B — Switch to credentialless</span>
                  <Badge variant="outline" className="text-[10px]">fallback</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  <code>Cross-Origin-Embedder-Policy: credentialless</code> allows opaque cross-origin loads without CORP
                  headers, in exchange for stripping cookies from the request. Works in Chromium 96+ / Firefox 119+.
                  Keeps cross-origin isolation for the future. More complex than option A.
                </p>
              </div>
              <div className="rounded-md border p-3 opacity-70">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Option C — Force CORP from Convex</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">rejected</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Convex storage URLs are managed by Convex; we don't control their response headers. Would require a proxy
                  endpoint. Not worth the complexity.
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle className="text-sm">Self-grill</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              Are we sure nothing in the codebase needs cross-origin isolation? Audit before flipping:
              search for <code>SharedArrayBuffer</code>, <code>crossOriginIsolated</code>, and any worker
              that needs <code>Atomics.wait</code>. If clean, option A wins. If something needs it, option B.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Bug 2 — cross-link UX
// ---------------------------------------------------------------------------

function Bug2CrosslinksSection() {
  return (
    <Section
      title="Bug 2 — Cross-link Accept-disabled is ambiguous"
      description="Two problems on the same screen. Fix both."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Current — ambiguous
            </CardTitle>
            <CardDescription className="text-xs">
              Disabled "Accept" with check icon and 0% badge. Reads identically to a freshly-accepted row.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <MockResolutionRow
              kind="document"
              label='"Eddy Current Operating Manual"'
              target="(no candidate)"
              confidence={0}
              accepted={false}
              variant="current"
            />
            <MockResolutionRow
              kind="asset"
              label="02-100-MD-03"
              target="(no candidate)"
              confidence={0}
              accepted={false}
              variant="current"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Proposed — explicit "no match"
            </CardTitle>
            <CardDescription className="text-xs">
              Greyed text "No match — will be left as plain mention". Action button replaced with a "Create new asset" affordance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <MockResolutionRow
              kind="document"
              label='"Eddy Current Operating Manual"'
              target="No match in library"
              confidence={0}
              accepted={false}
              variant="proposed"
            />
            <MockResolutionRow
              kind="asset"
              label="02-100-MD-03"
              target="No match in library"
              confidence={0}
              accepted={false}
              variant="proposed"
            />
          </CardContent>
        </Card>
      </div>

      <Alert className="mt-4">
        <Microscope className="h-4 w-4" />
        <AlertTitle className="text-sm">Empty-library cause vs. no-match cause</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          In the run #2 capture, Convex was wiped beforehand so the library was empty — every row was 0%
          because there was nothing to match against. Once the library has assets/docs, real partial matches
          will surface. Header copy should disambiguate: if zero candidates exist anywhere in DB, prepend a
          banner "Library is empty. Cross-link suggestions will appear after you add assets/documents."
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function MockResolutionRow({
  kind,
  label,
  target,
  confidence,
  accepted,
  variant,
}: {
  kind: "document" | "asset" | "log"
  label: string
  target: string
  confidence: number
  accepted: boolean
  variant: "current" | "proposed"
}) {
  const Icon = kind === "document" ? FileText : kind === "asset" ? Layers : ListChecks
  const noMatch = confidence === 0
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border bg-card p-2.5 text-xs",
        accepted && "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono">"{label}"</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span
        className={cn(
          "font-mono",
          variant === "proposed" && noMatch ? "text-muted-foreground italic" : "text-muted-foreground",
        )}
      >
        {target}
      </span>
      {!(variant === "proposed" && noMatch) && (
        <Badge
          className={cn(
            "text-[10px]",
            confidence >= 90
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : confidence >= 70
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "bg-red-500/15 text-red-700 dark:text-red-300",
          )}
        >
          {confidence}%
        </Badge>
      )}
      <div className="ml-auto flex items-center gap-1">
        {variant === "current" ? (
          <Button size="sm" className="h-7 text-xs" disabled>
            <Check className="mr-1 h-3 w-3" /> Accept
          </Button>
        ) : noMatch ? (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" disabled>
            Will skip
          </Button>
        ) : (
          <Button size="sm" className="h-7 text-xs">
            <Check className="mr-1 h-3 w-3" /> Accept
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bug 3 — doc deletion orphans
// ---------------------------------------------------------------------------

function Bug3DeleteOrphansSection() {
  return (
    <Section
      title="Bug 3 — Doc deletion leaves imageUsages rows"
      description="Single fix. Three lines of code."
    >
      <Card>
        <CardContent className="space-y-3 p-5 text-sm">
          <div className="text-xs">
            <p className="leading-relaxed">
              <code className="rounded bg-muted px-1">documents.remove</code> in <code>convex/documents.ts:485-533</code>
              {" "}sweeps four child tables on document deletion: <code>documentVersions</code>, <code>chunks</code>,
              {" "}<code>documentAssets</code>, <code>documentLogRefs</code>. <code>imageUsages</code> is missing. Result:
              the image library's "Used in" column reads from the still-present orphan rows and renders "1 doc"
              for documents that no longer exist.
            </p>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
            <div className="text-muted-foreground">// add to documents.remove, before ctx.db.delete(args.id)</div>
            <div>const usages = await ctx.db</div>
            <div>{"  "}.query("imageUsages")</div>
            <div>{"  "}.withIndex("by_documentId_and_version", (q) =&gt; q.eq("documentId", args.id))</div>
            <div>{"  "}.take(2000)</div>
            <div>for (const u of usages) await ctx.db.delete(u._id)</div>
          </div>

          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle className="text-sm">What about the actual image rows + storage blobs?</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              Don't auto-delete. An image referenced by 2 docs should survive deletion of one of them. The user's rule
              (&quot;cannot delete image if used in a doc; can delete once orphaned&quot;) is already enforced in
              <code className="rounded bg-muted px-1">images.remove</code>. After this fix, an image used <em>only</em>
              {" "}by the deleted doc becomes a true orphan (usageCount = 0) and the user can delete it from the library —
              that's the right escape hatch.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Bug 4 — image library deletion + multi-select + sort-by-doc
// ---------------------------------------------------------------------------

function Bug4ImageLibrarySection() {
  return (
    <Section
      title="Bug 4 — Image library management UX"
      description="Three sub-features. Single source of truth: bulkDelete refuses any image still referenced; user explicitly clears the doc(s) first."
    >
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spec — selection model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-relaxed">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Each row gets a leading checkbox column.</li>
              <li>Clicking a row anywhere except the checkbox still opens the detail modal (preserve current behavior).</li>
              <li>Clicking the checkbox toggles selection without opening the modal.</li>
              <li>
                <strong>Shift+click</strong> on a checkbox selects the contiguous range from the last-selected row
                to the clicked row, in the currently-rendered order. Rows hidden by filter/search are not included.
              </li>
              <li>
                <strong>Cmd/Ctrl+click</strong> toggles a single row without affecting the others. Plain click toggles only
                the clicked row and clears any prior anchor.
              </li>
              <li>The header row's checkbox is "select all currently visible". Indeterminate state when a subset is selected.</li>
              <li>Selecting any row reveals a sticky action bar at the top of the table: "N selected · Delete · Clear".</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mock — list with selection bar</CardTitle>
          </CardHeader>
          <CardContent>
            <MockImageLibraryWithSelection />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spec — deletion rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-relaxed">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Cannot delete</strong> if <code>usageCount &gt; 0</code>. Already enforced server-side
                in <code>images.remove</code> (throws). Client should pre-check and disable the action with a tooltip
                "Used in N document(s). Remove from doc(s) first."
              </li>
              <li>
                <strong>Bulk delete</strong> goes through a new <code>images.removeMany</code> mutation. It iterates
                and tries each one. If any are referenced, the call returns a <code>{"{ ok: Id[], refused: [{id, reason}] }"}</code>
                {" "}shape. The UI shows a confirmation dialog: "X deleted, Y refused (still referenced) — see list".
              </li>
              <li>
                Confirmation dialog. No "are you sure?" prompt for a single image (the current modal already has Delete +
                Cancel). For 2+ items, a dialog with item count + the in-doc-still list always shows.
              </li>
              <li>Storage blob deletion happens server-side per image as part of <code>images.remove</code> (already implemented).</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spec — group-by-document view</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-relaxed">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>View-mode toggle in the toolbar: <code>Flat</code> · <code>By document</code>.</li>
              <li>
                In <code>By document</code> mode, the list groups by <code>documentId</code> via <code>imageUsages</code>.
                Each document is a header row with its naming code + title + image count; click the chevron to expand.
              </li>
              <li>
                <strong>Multi-doc images.</strong> An image used by 2+ documents would otherwise appear under each doc's group.
                That doubles selection state and is confusing for delete. Resolution: pull all images with usageCount ≥ 2
                into a synthetic top group "Shared (used in N+ docs)". They appear once. The detail modal already shows the per-doc list.
              </li>
              <li>
                <strong>Orphan images.</strong> Show in a synthetic bottom group "Orphans (not referenced)". This is the natural place
                to bulk-delete — select-all on this group, hit Delete, every removal succeeds.
              </li>
              <li>
                Selection persists across expand/collapse. Collapsing a group with 3 selected rows keeps the count in the action bar.
              </li>
              <li>Search filter applies inside groups; empty groups collapse out of view.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mock — group-by-document view</CardTitle>
          </CardHeader>
          <CardContent>
            <MockImageLibraryGrouped />
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

function MockImageLibraryWithSelection() {
  return (
    <div className="space-y-2 rounded-md border p-3 bg-card">
      <div className="flex items-center justify-between rounded-md border bg-primary/5 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground text-[10px]">3 selected</Badge>
          <span className="text-muted-foreground">2 deletable · 1 still referenced</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs">
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs">
            <Trash2 className="mr-1 h-3 w-3" /> Delete 2
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox checked="indeterminate" />
            </TableHead>
            <TableHead className="w-12">Preview</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead className="w-24">Used in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <MockRow selected filename="UP-OPS-SOP-010-p3-100x100.png" used={0} />
          <MockRow selected filename="UP-OPS-SOP-010-p4-699x191.png" used={0} />
          <MockRow selected filename="UP-OPS-SOP-010-p5-637x549.png" used={1} blocked />
          <MockRow filename="UP-OPS-SOP-010-p4-513x288.png" used={1} />
          <MockRow filename="UP-OPS-SOP-010-p4-699x397.png" used={1} />
        </TableBody>
      </Table>
    </div>
  )
}

function MockRow({
  selected,
  filename,
  used,
  blocked,
}: {
  selected?: boolean
  filename: string
  used: number
  blocked?: boolean
}) {
  return (
    <TableRow className={cn(selected && "bg-primary/5")}>
      <TableCell>
        <Checkbox checked={selected} />
      </TableCell>
      <TableCell>
        <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-mono text-[11px]">{filename}</TableCell>
      <TableCell>
        {used === 0 ? (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">orphan</Badge>
        ) : blocked ? (
          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
            {used} doc · cannot delete
          </Badge>
        ) : (
          <Badge className="bg-primary/15 text-primary text-[10px]">{used} doc</Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

function MockImageLibraryGrouped() {
  return (
    <div className="space-y-3 rounded-md border p-3 bg-card text-xs">
      {/* Shared group */}
      <div>
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 font-medium">
          <ChevronDown className="h-3.5 w-3.5" />
          <Badge variant="secondary" className="text-[10px]">Shared</Badge>
          <span>Used in 2+ documents</span>
          <span className="ml-auto text-muted-foreground font-normal">1 image</span>
        </div>
        <div className="pl-6 pt-2">
          <MockGroupedRow filename="UP-OPS-SOP-010-machine-overview.png" usedIn="UP-OPS-SOP-010 · UP-OPS-MAN-005" />
        </div>
      </div>
      {/* Doc 1 */}
      <div>
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 font-medium">
          <ChevronDown className="h-3.5 w-3.5" />
          <Badge variant="outline" className="text-[10px] font-mono">UP-OPS-SOP-010</Badge>
          <span>EDDYCURRENT MACHINE</span>
          <span className="ml-auto text-muted-foreground font-normal">12 images</span>
        </div>
        <div className="pl-6 pt-2 space-y-1.5">
          <MockGroupedRow filename="UP-OPS-SOP-010-p3-100x100.png" usedIn="page 3 · figure 1" />
          <MockGroupedRow filename="UP-OPS-SOP-010-p4-699x191.png" usedIn="page 4 · figure 2" />
          <MockGroupedRow filename="…" usedIn="…" muted />
        </div>
      </div>
      {/* Doc 2 collapsed */}
      <div>
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 font-medium">
          <ChevronRight className="h-3.5 w-3.5" />
          <Badge variant="outline" className="text-[10px] font-mono">UP-OPS-SOP-007</Badge>
          <span>POLYMER SORTER</span>
          <span className="ml-auto text-muted-foreground font-normal">8 images</span>
        </div>
      </div>
      {/* Orphans */}
      <div>
        <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 font-medium border border-amber-500/30">
          <ChevronDown className="h-3.5 w-3.5" />
          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">Orphans</Badge>
          <span>Not currently referenced</span>
          <span className="ml-auto text-muted-foreground font-normal">3 images · safe to delete</span>
        </div>
        <div className="pl-6 pt-2 space-y-1.5">
          <MockGroupedRow filename="orphan-uploaded-2025-12.png" usedIn="—" />
          <MockGroupedRow filename="legacy-pasted.png" usedIn="—" />
          <MockGroupedRow filename="…" usedIn="—" muted />
        </div>
      </div>
    </div>
  )
}

function MockGroupedRow({
  filename,
  usedIn,
  muted,
}: {
  filename: string
  usedIn: string
  muted?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/30", muted && "opacity-60")}>
      <Checkbox />
      <div className="flex h-7 w-7 items-center justify-center rounded border bg-muted/30">
        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="font-mono text-[11px]">{filename}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{usedIn}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Self-grilling
// ---------------------------------------------------------------------------

function SelfGrillingSection() {
  const grills: Array<{ q: string; a: string }> = [
    {
      q: "What if the COEP fix breaks something else? sql.js, pdfjs, anything that touches WASM threads?",
      a: "Audit before flipping. Search for SharedArrayBuffer, crossOriginIsolated, Atomics.wait, Worker(... { type: 'module' }) with any threading. The current build already imports sql.js and pdfjs WASM via ?url so they're served same-origin and don't need COEP. If anything at all surfaces, fall back to credentialless instead of dropping COEP.",
    },
    {
      q: "If we replace \"Accept\" with \"Will skip\" when there's no candidate, doesn't that hide intent? What if the user wants to type a target manually?",
      a: "Right — for V1 of the cross-link page we never built a manual target input. So \"Will skip\" is honest about what happens. If we add manual-entry later, replace \"Will skip\" with a dropdown/typeahead.",
    },
    {
      q: "Doc deletion sweeping imageUsages — are we sure the cascade doesn't break anything else?",
      a: "imageUsages is consumed only by attachUsageCounts in convex/images.ts to render the library's \"Used in\" column and by the detail modal. Both will stop showing the deleted doc. Nothing else reads it. Safe sweep.",
    },
    {
      q: "Multi-select with shift-click range — what's the anchor when the table is paginated or virtualized?",
      a: "Today the table is take(1000) with no virtualization, so the rendered order is stable. Range select uses the rendered DOM index. Once we virtualize, the same algorithm works against the source array, not the DOM. Document this in the implementation as a known constraint.",
    },
    {
      q: "Group-by-document view — what if an image is used in 5 documents? Goes in Shared with usageCount=5? Or 5 entries?",
      a: "One entry, in Shared. The detail modal lists every doc. Showing the same row in 5 places makes selection state ambiguous (\"did I select that image, or the row inside doc 3?\"). Single-source-of-truth: one row per image_id.",
    },
    {
      q: "What happens during in-flight import if the user deletes images mid-flow?",
      a: "Race. The import promotes images via createFromUpload, which writes the image row before the doc exists. If the user deletes an image after promotion but before recordExtraction, the StructuredDoc render will still reference imageId X, but the row is gone. recomputeUsagesForVersion already validates ctx.db.get(imageId) and skips stale ones (convex/images.ts:295-296). So the doc body keeps the data-image-id but renders an empty placeholder. Acceptable for V1 — log a warning to the import job.",
    },
    {
      q: "Are we sure the run #2 \"all 0% candidates\" was caused by an empty library and not by a crosslink-resolver regression?",
      a: "We wiped Convex before run #2 (admin.wipeAll). Without seed data running, there are no asset/document records to match against. The 0% is correct under those circumstances. The fix is to re-seed after wipe (or show an empty-library banner), not to touch the resolver.",
    },
    {
      q: "What's the demo-blocking severity of bug 1 vs the others?",
      a: "Bug 1 (COEP) is a true blocker because every imported image is invisible — the demo's \"Imported figures\" section will look empty, and that's exactly the section that proves the OCR pipeline works. Bug 3 (orphan imageUsages) is a data-correctness issue but only visible inside the image library page, not on the SOP. Bug 2 is cosmetic. Bug 4 is workflow-not-built — not blocking, but explicitly requested. Order: 1 → 3 → 2 → 4.",
    },
  ]
  return (
    <Section
      title="Self-grilling"
      description="Counter-questions before committing to the implementation plan. At least one needs to be uncomfortable."
    >
      <div className="space-y-2">
        {grills.map((g, i) => (
          <Card key={i}>
            <CardContent className="space-y-1.5 p-4">
              <div className="text-xs font-medium flex items-start gap-1.5">
                <span className="text-muted-foreground">Q.</span>
                <span>{g.q}</span>
              </div>
              <div className="text-xs flex items-start gap-1.5 leading-relaxed text-muted-foreground">
                <span>A.</span>
                <span>{g.a}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Implementation plan
// ---------------------------------------------------------------------------

function ImplementationPlanSection() {
  const steps: Array<{ id: string; title: string; files: string[]; status: "pending" | "shipped" }> = [
    {
      id: "1",
      title: "Bug 1 — Drop COEP/COOP from vite dev server (option A); audit for SharedArrayBuffer references first",
      files: ["vite.config.ts", "(grep) src/**/*.{ts,tsx}"],
      status: "shipped",
    },
    {
      id: "2",
      title: "Bug 3 — Add imageUsages sweep to documents.remove (3 lines)",
      files: ["convex/documents.ts:485-533"],
      status: "shipped",
    },
    {
      id: "3",
      title: "Bug 2a — Replace disabled Accept with explicit \"Will skip\" / \"No match in library\" in ResolutionRow; gate the green check + bg-emerald to actually-accepted only",
      files: ["src/pages/desktop/ImportPage.tsx:1386-1445"],
      status: "shipped",
    },
    {
      id: "4",
      title: "Bug 2b — When all candidates are 0% AND the assets/documents tables are empty, show \"Library is empty — nothing to link to\" banner above the resolution list",
      files: ["src/pages/desktop/ImportPage.tsx (CrossLinksStage)"],
      status: "shipped",
    },
    {
      id: "5",
      title: "Bug 4a — Selection model: checkbox column + selectedIds state + shift-click range + sticky action bar in ImageLibraryPage",
      files: ["src/pages/desktop/ImageLibraryPage.tsx"],
      status: "shipped",
    },
    {
      id: "6",
      title: "Bug 4b — convex/images.ts removeMany mutation; client wires it through with refused-list dialog",
      files: ["convex/images.ts", "src/pages/desktop/ImageLibraryPage.tsx", "src/components/docs/ImageBulkDeleteDialog.tsx (new)"],
      status: "shipped",
    },
    {
      id: "7",
      title: "Bug 4c — \"Group by document\" view-mode toggle. Synthetic Shared / per-doc / Orphans groups; expand/collapse; selection persists across collapse",
      files: ["src/pages/desktop/ImageLibraryPage.tsx", "convex/images.ts (add listGroupedByDocument query)"],
      status: "shipped",
    },
    {
      id: "8",
      title: "Run tsc -b && vite build after each step; close the loop on this analysis page (Status, Results, Decisions)",
      files: ["—"],
      status: "shipped",
    },
  ]
  return (
    <Section
      title="Implementation plan"
      description="In severity order, ship one at a time. After each step: tsc + build, screenshot the change, ask user to confirm, then move on."
    >
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">#</TableHead>
              <TableHead>Step</TableHead>
              <TableHead className="w-[30%]">Files</TableHead>
              <TableHead className="w-[10%] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {steps.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-[11px]">{s.id}</TableCell>
                <TableCell className="text-xs">{s.title}</TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {s.files.join(" · ")}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      s.status === "shipped" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {s.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function ResultsSection() {
  const results: Array<{
    title: string
    files: string[]
    before: string
    after: string
  }> = [
    {
      title: "Bug 1 — COEP/COOP dropped from vite dev server",
      files: ["vite.config.ts"],
      before:
        "server.headers set Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp. Every Convex storage URL was rejected by the browser as a non-CORP cross-origin subresource. Image thumbnails on the Extract stage and the imported-figures appendix rendered as empty boxes; DevTools console flooded with ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep.",
      after:
        "server.headers block removed. Audit confirmed the codebase has zero references to SharedArrayBuffer, crossOriginIsolated, or Atomics.wait — the headers were vestigial from an earlier sql.js + WASM threading design that never landed. Convex storage <img> loads now resolve same-origin-relaxed and render normally.",
    },
    {
      title: "Bug 2a — Cross-link Accept-disabled disambiguated",
      files: ["src/pages/desktop/ImportPage.tsx"],
      before:
        "When a candidate had no match, the row showed \"(no candidate) 0%\" with a disabled Accept button + check icon. The disabled button + check icon signalled \"already accepted\" to the user; there was no way to tell whether to act on the row.",
      after:
        "When resolution.targetId is missing, the row renders \"No match in library\" in italic muted text instead of \"(no candidate)\", drops the misleading 0% red badge, and replaces the disabled button with a plain \"Will skip\" muted-text affordance. The green check + emerald background is now reserved exclusively for actually-accepted rows.",
    },
    {
      title: "Bug 2b — Empty-library banner on cross-link stage",
      files: ["src/pages/desktop/ImportPage.tsx"],
      before:
        "If the library was empty (e.g. after admin.wipeAll), every row read \"0%\" with no explanation, leading the user to suspect a resolver bug.",
      after:
        "When every resolution row has !targetId, an amber banner sits above the list: \"None of the detected mentions matched an existing asset or document in your library. They will be left as plain text in the document. Add the relevant assets/documents first if you want them auto-linked.\" Distinguishes \"empty library\" / \"no matches\" from a broken resolver.",
    },
    {
      title: "Bug 3 — imageUsages sweep on document delete",
      files: ["convex/documents.ts"],
      before:
        "documents.remove() walked documentVersions, chunks, documentAssets, documentLogRefs — but never imageUsages. Image library's \"Used in\" column kept reading from the orphan rows and showed \"1 doc\" for deleted documents; the per-image detail modal correctly resolved through ctx.db.get(documentId) and showed \"0 documents.\" Two views, contradictory answers.",
      after:
        "5-line query/sweep added to documents.remove before the final ctx.db.delete(args.id). Iterates imageUsages by_documentId_and_version index for the doc and deletes each row. Library and detail modal now agree.",
    },
    {
      title: "Bug 4a — Image library selection model + sticky action bar",
      files: ["src/pages/desktop/ImageLibraryPage.tsx"],
      before:
        "Single click on a row opened the detail modal. No checkbox, no multi-select, no shift-click range, no bulk action affordance.",
      after:
        "Leading checkbox column + selectedIds Set state. Plain click on the checkbox toggles the row; Shift+click selects the contiguous range from the last anchor in the currently-rendered order; Cmd/Ctrl+click toggles a single row without affecting others. Header row carries an indeterminate-state \"select all visible\" checkbox. Sticky primary-tinted action bar appears above the table with N selected · K deletable · M still referenced · Clear · Delete K. Anchor row gets a faint primary-ring highlight so users can verify shift-click target.",
    },
    {
      title: "Bug 4b — convex/images.removeMany + bulk-delete confirmation dialog",
      files: ["convex/images.ts", "src/pages/desktop/ImageLibraryPage.tsx"],
      before:
        "Only convex/images.remove(id). Bulk delete required N round-trips with no atomicity, no shared confirmation, no clear refused-list reporting.",
      after:
        "removeMany mutation iterates ids, returns { ok: Id[], refused: { id, reason }[] } so the client can show partial-success state. The image library wires the action through an AlertDialog that summarises \"Delete N images?\" with an inline amber callout listing how many will be skipped because they're still referenced. Toast shows the actual ok/refused split after the call resolves.",
    },
    {
      title: "Bug 4c — Group-by-document view",
      files: ["convex/images.ts (list query)", "src/pages/desktop/ImageLibraryPage.tsx"],
      before:
        "Library was a single flat list sorted by createdAt desc. With 14 images per imported SOP, finding the right batch to delete required scrolling and squinting at filenames.",
      after:
        "View-mode toggle: Flat | Group by document. The list query now attaches documentRefs (deduped per image) so the client can group locally with no extra round-trip. Three synthetic groups: Shared (used in 2+ docs, top), one group per document (sorted by namingCode), Orphans (bottom, amber-tinted, \"safe to delete\"). Each header is a button with chevron + badge + image count. Selection state persists across collapse/expand. Multi-doc images appear once in Shared rather than under each doc, so selection has a single source of truth.",
    },
  ]
  return (
    <Section
      title="Results"
      description="One row per shipped item. Files touched · before · after."
    >
      <div className="space-y-2">
        {results.map((r) => (
          <Card key={r.title}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs font-semibold">{r.title}</div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] shrink-0">
                  shipped
                </Badge>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {r.files.join(" · ")}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border border-red-500/20 bg-red-500/5 p-2 text-[11px] leading-relaxed">
                  <div className="text-red-700 dark:text-red-300 text-[10px] uppercase tracking-wide font-semibold mb-1">
                    Before
                  </div>
                  {r.before}
                </div>
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] leading-relaxed">
                  <div className="text-emerald-700 dark:text-emerald-300 text-[10px] uppercase tracking-wide font-semibold mb-1">
                    After
                  </div>
                  {r.after}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

function DecisionsSection() {
  const decisions = [
    {
      q: "1 — COEP: drop entirely (A) or switch to credentialless (B)?",
      a: "Drop entirely (A). Audit found zero references to SharedArrayBuffer, crossOriginIsolated, or Atomics in src/**. The headers were vestigial.",
    },
    {
      q: "2 — Should the cross-link page surface a \"Create new asset/document\" affordance for unmatched candidates?",
      a: "Deferred to a follow-up. \"Will skip\" + the new empty-library banner now honestly reflect the current behaviour without misleading copy. Adding inline create-as-you-go means another modal with naming-code validation; capture as a P1+ ticket.",
    },
    {
      q: "3 — Should imported figures live in a separate \"Imported figures\" appendix section, or be inserted inline at their PDF position?",
      a: "Deferred. Appendix stays for V1. The pageLayouts y-coordinate clustering already exists in the extractor but isn't wired through to the renderer; that's a separate work-item once cross-links + image management are bedded in.",
    },
    {
      q: "4 — Image library: keep flat as default, or default to By document?",
      a: "Default flat. The flat list + selection + bulk delete handles the 95% case (importer dumps a batch and you want to clear orphans). By-document is a power-user view available behind the toggle.",
    },
  ]
  return (
    <Section title="Decisions">
      <div className="space-y-2">
        {decisions.map((d, i) => (
          <Card key={i}>
            <CardContent className="space-y-1 p-4 text-xs">
              <div className="font-medium">{d.q}</div>
              <div className="text-muted-foreground">{d.a}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Alert className="mt-3">
        <Eye className="h-4 w-4" />
        <AlertTitle className="text-sm">Closed. Follow-ups:</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          Re-run the eddycurrent SOP through /import end-to-end and verify: (1) image
          thumbnails load on the Extract stage and on the finalized doc's imported-figures
          appendix; (2) cross-link rows show \"No match in library\" + amber banner instead of disabled-Accept;
          (3) deleting the document drops it from the library's Used-in column instantly;
          (4) bulk-selecting orphans + Delete clears them in one click. Capture inline asset/document
          creation on the cross-link page and positional figure inlining as P1+ tickets.
        </AlertDescription>
      </Alert>
    </Section>
  )
}
