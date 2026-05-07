// Image library analysis — proposes a real upload flow, a content-addressed
// images table, and a /images repository surface so authors can see every
// uploaded image and where it's used. Static React doc — no feature code.

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Image as ImageIcon,
  Link as LinkIcon,
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

export function ImageLibraryAnalysis() {
  return (
    <AnalysisLayout
      title="Image library — upload flow + repository surface"
      subtitle="Today the editor's 'Image' menu opens a window.prompt asking for a URL. No upload, no repo, no usage tracking. This proposes a real upload+URL modal, a content-addressed images table backed by Convex storage, and a /images page where authors can see every image and where it's referenced."
      date="2026-05-07"
      scopes={["desktop", "data-model"]}
    >
      <ProblemSection />
      <CurrentBehaviorSection />
      <DataModelSection />
      <ProposedUploadFlowSection />
      <ProposedRepositorySection />
      <EdgeCasesSection />
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
        <AlertTitle>
          The editor cannot accept images from the user's machine.
        </AlertTitle>
        <AlertDescription className="space-y-1.5 pt-1.5 text-xs">
          <div>
            <code>insertImage()</code> in <code>DocumentEditor.tsx:575</code>{" "}
            calls <code>window.prompt("Image URL")</code>. The TipTap Image
            extension stores whatever string the user paste as a raw{" "}
            <code>img.src</code>. There is no upload path, no preview, no
            validation, no de-dup, and no record of which images live in which
            documents.
          </div>
          <div>
            Three downstream consequences: (1) authors with a screenshot on
            their disk can't use it without first hosting it somewhere; (2) we
            have no way to ask "where is this picture used?" before someone
            edits or replaces it; (3) the URL the user pastes can rot
            (CDN expires, repo moves) and the doc silently degrades.
          </div>
        </AlertDescription>
      </Alert>
    </Section>
  )
}

function CurrentBehaviorSection() {
  return (
    <Section
      title="Current behavior"
      description="What happens today, by the numbers."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              Upload from disk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <div>Not implemented.</div>
            <div className="font-mono">
              window.prompt &rarr; user types URL &rarr; img.src = URL
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              Image library / repo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <div>None.</div>
            <div>No DB record per image. No usage rollup.</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              External URL embedding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <div>Works — but with no validation.</div>
            <div>Any URL goes in. CORS errors at render are silent.</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Print + PDF export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <div>External URLs may not load in print due to CSP/CORS.</div>
            <div>Convex-hosted images would print reliably.</div>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}

interface SchemaField {
  field: string
  type: string
  notes: string
}

const IMAGES_TABLE: SchemaField[] = [
  { field: "_id", type: "Id<'images'>", notes: "Convex-generated" },
  { field: "storageId", type: "Id<'_storage'> | null", notes: "Null when source = 'url'" },
  { field: "source", type: "'upload' | 'url'", notes: "Discriminator" },
  { field: "externalUrl", type: "string | null", notes: "Set when source = 'url'" },
  { field: "filename", type: "string", notes: "Original or last-segment of URL" },
  { field: "contentType", type: "string", notes: "image/png, image/jpeg, image/svg+xml…" },
  { field: "byteSize", type: "number", notes: "Bytes, null until known for URL source" },
  { field: "width", type: "number | null", notes: "Probed on upload; null for URL until first render" },
  { field: "height", type: "number | null", notes: "Same" },
  { field: "sha256", type: "string | null", notes: "For dedup of uploads only" },
  { field: "altText", type: "string", notes: "Author-supplied; required on upload" },
  { field: "uploadedBy", type: "Id<'users'> | null", notes: "Who added it" },
  { field: "createdAt", type: "number", notes: "Date.now() on insert" },
]

const IMAGE_USAGES_TABLE: SchemaField[] = [
  { field: "_id", type: "Id<'imageUsages'>", notes: "Convex-generated" },
  { field: "imageId", type: "Id<'images'>", notes: "Indexed" },
  { field: "documentId", type: "Id<'documents'>", notes: "Indexed" },
  { field: "documentVersionId", type: "Id<'documentVersions'> | null", notes: "Per-version snapshot" },
  { field: "context", type: "'body' | 'thumbnail' | 'asset'", notes: "Where in the doc" },
  { field: "createdAt", type: "number", notes: "" },
]

function DataModelSection() {
  return (
    <Section
      title="Proposed data model"
      description="Two new tables — images is the canonical record per image, imageUsages is the join we recompute on every doc save so the repo page always knows where each image lives."
    >
      <Tabs defaultValue="images">
        <TabsList>
          <TabsTrigger value="images">images</TabsTrigger>
          <TabsTrigger value="usages">imageUsages</TabsTrigger>
          <TabsTrigger value="flow">Save-side flow</TabsTrigger>
        </TabsList>
        <TabsContent value="images">
          <SchemaTable rows={IMAGES_TABLE} />
        </TabsContent>
        <TabsContent value="usages">
          <SchemaTable rows={IMAGE_USAGES_TABLE} />
        </TabsContent>
        <TabsContent value="flow">
          <Card>
            <CardContent className="space-y-2 pt-6 text-sm">
              <p>
                On every document save (draft / publish), the server walks the
                TipTap body, collects every <code>img</code> node's{" "}
                <code>data-image-id</code>, diffs against existing{" "}
                <code>imageUsages</code> rows for that document, and inserts /
                deletes the rows. Idempotent. No client-side bookkeeping.
              </p>
              <p>
                External URLs (no <code>data-image-id</code>) get a synthetic{" "}
                <code>images</code> row created on first save with{" "}
                <code>source = 'url'</code> so the repo can list them too. Same
                walk emits a <code>imageUsages</code> row.
              </p>
              <p>
                Removal of an image from a doc body produces a deletion of the{" "}
                <code>imageUsages</code> row, but{" "}
                <strong>never deletes the images row</strong>. We orphan-collect
                in a daily cron once usage = 0 for &gt;30 days.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Section>
  )
}

function SchemaTable({ rows }: { rows: SchemaField[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">Field</TableHead>
              <TableHead className="w-[28%]">Type</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.field}>
                <TableCell className="align-top font-mono text-xs">{r.field}</TableCell>
                <TableCell className="align-top font-mono text-xs text-muted-foreground">
                  {r.type}
                </TableCell>
                <TableCell className="align-top text-xs">{r.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ProposedUploadFlowSection() {
  return (
    <Section
      title="Proposed upload modal"
      description="Two-tab dialog opened from the editor's Image menu and from the /images page. Real-component mock below."
    >
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload" className="gap-1">
                <Upload className="h-3.5 w-3.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-1">
                <LinkIcon className="h-3.5 w-3.5" />
                Paste URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <UploadTabMock />
            </TabsContent>
            <TabsContent value="url">
              <UrlTabMock />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Backend pipeline (upload tab)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs text-muted-foreground">
          <div>1. Client calls <code>files.generateUploadUrl()</code>.</div>
          <div>2. PUT the file blob to the signed URL.</div>
          <div>3. Client probes width/height + computes sha256.</div>
          <div>
            4. <code>images.create</code> mutation: insert row, idempotent on
            sha256 (returns existing imageId if the file was already uploaded by
            this user).
          </div>
          <div>
            5. Editor inserts{" "}
            <code>{`<img data-image-id="..." alt="..." />`}</code>. On render the
            client resolves <code>storageId &rarr; signed URL</code> via
            existing <code>files.getUrl</code>.
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function UploadTabMock() {
  return (
    <div className="space-y-3">
      <div className="rounded-md border-2 border-dashed bg-muted/20 p-6 text-center">
        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
        <div className="mt-2 text-sm font-medium">
          Drop an image, or click to browse
        </div>
        <div className="text-xs text-muted-foreground">
          PNG, JPEG, GIF, SVG up to 10 MB
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Alt text (required)</label>
        <input
          className="w-full rounded-md border bg-card px-2 py-1 text-sm"
          placeholder="e.g. Mixer feedstock photo, top view"
        />
        <p className="text-[11px] text-muted-foreground">
          Displayed by screen readers and shown when the image fails to load.
          Required for accessibility.
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-[11px] text-muted-foreground">
          De-duped by content hash. Same file twice = one record.
        </span>
        <Button size="sm">Insert</Button>
      </div>
    </div>
  )
}

function UrlTabMock() {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Image URL</label>
        <input
          className="w-full rounded-md border bg-card px-2 py-1 text-sm"
          placeholder="https://…"
        />
        <p className="text-[11px] text-muted-foreground">
          Must end in .png, .jpg, .jpeg, .gif, .webp, or .svg. We probe the URL
          before insert and warn on CORS / 404.
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Alt text (required)</label>
        <input
          className="w-full rounded-md border bg-card px-2 py-1 text-sm"
          placeholder="Describe the image"
        />
      </div>
      <Alert>
        <CircleAlert className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Heads-up: external URLs can rot. Where possible, prefer the Upload
          tab so the image lives in our storage. URL embeds are still tracked
          in the image library.
        </AlertDescription>
      </Alert>
      <div className="flex justify-end gap-2 border-t pt-3">
        <Button size="sm">Insert</Button>
      </div>
    </div>
  )
}

function ProposedRepositorySection() {
  return (
    <Section
      title="Proposed image library page (/images)"
      description="One row per images record. Click a row to see exactly which docs reference it, jump into them, and replace if needed."
    >
      <RepositoryMock />
      <Card className="mt-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Capabilities (v1)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-xs">
            <Capability label="List, sort, filter (by source, by uploader, by orphan-status, by content-type)" />
            <Capability label="Click a row → side panel with full preview + every doc that uses it (linked to /docs/:id)" />
            <Capability label="Bulk upload (drag-multiple to the page)" />
            <Capability label="Delete only when usage count = 0; otherwise show 'used in N docs' and require unlinking first" />
            <Capability label="Re-name alt text inline (writes back to the images row, not to the doc bodies — alt is image-level)" />
            <Capability label="Copy URL: produces a signed Convex URL for uploads, the original URL for url-source rows" />
          </ul>
        </CardContent>
      </Card>
    </Section>
  )
}

function Capability({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span>{label}</span>
    </li>
  )
}

function RepositoryMock() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[8%]">Preview</TableHead>
              <TableHead className="w-[24%]">Filename</TableHead>
              <TableHead className="w-[12%]">Source</TableHead>
              <TableHead className="w-[10%]">Size</TableHead>
              <TableHead className="w-[14%]">Used in</TableHead>
              <TableHead className="w-[14%]">Uploaded</TableHead>
              <TableHead className="w-[18%]">Alt text</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <ImageRow
              filename="mixer-feedstock-top.png"
              source="upload"
              size="412 KB"
              usedIn={3}
              uploaded="2 days ago by Floris"
              alt="Mixer feedstock photo, top view"
            />
            <ImageRow
              filename="hot-work-permit-template.jpg"
              source="upload"
              size="221 KB"
              usedIn={1}
              uploaded="yesterday by Floris"
              alt="Hot-work permit template"
            />
            <ImageRow
              filename="grafana-rmr-101.png"
              source="url"
              size="—"
              usedIn={2}
              uploaded="2026-04-22 by Floris"
              alt="RMR-101 throughput dashboard"
            />
            <ImageRow
              filename="floorplan-pigment.svg"
              source="upload"
              size="68 KB"
              usedIn={0}
              uploaded="2026-04-15 by Floris"
              alt="Pigment Calcination floorplan"
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ImageRow({
  filename,
  source,
  size,
  usedIn,
  uploaded,
  alt,
}: {
  filename: string
  source: "upload" | "url"
  size: string
  usedIn: number
  uploaded: string
  alt: string
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">{filename}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            source === "url" && "border-amber-400/50 text-amber-700 dark:text-amber-300",
          )}
        >
          {source}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{size}</TableCell>
      <TableCell>
        {usedIn === 0 ? (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            orphan
          </Badge>
        ) : (
          <Badge className="bg-primary/15 text-primary text-[10px]">
            {usedIn} doc{usedIn === 1 ? "" : "s"}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{uploaded}</TableCell>
      <TableCell className="truncate text-xs">{alt}</TableCell>
    </TableRow>
  )
}

interface EdgeCase {
  scenario: string
  current: string
  proposed: string
  severity: "high" | "med" | "low"
}

const EDGE_CASES: EdgeCase[] = [
  {
    scenario: "Author drops a 14 MB JPG",
    current: "Whatever browser does — typically passes through; doc body inflates",
    proposed: "Hard cap at 10 MB. Friendly error in the modal. Server enforces too.",
    severity: "high",
  },
  {
    scenario: "Author pastes an SVG with embedded <script>",
    current: "img.src accepts the URL. If served by us via storage, browser blocks the script. If externalUrl, browser blocks too because img can't run JS. Still: never accept raw SVG paste into the editor.",
    proposed: "Server rejects content-type 'image/svg+xml' on upload unless it passes a strict sanitizer (DOMPurify). URL-source SVGs are accepted but flagged in the repo with an 'external SVG' warning.",
    severity: "high",
  },
  {
    scenario: "Same file uploaded twice by the same user",
    current: "Two separate img URLs. Two separate rows.",
    proposed: "sha256 dedup at images.create. Returns the existing imageId. One row, two usages.",
    severity: "med",
  },
  {
    scenario: "Image used in 3 published docs, author wants to delete from the library",
    current: "No library. Delete impossible — image is a string in 3 doc bodies.",
    proposed: "Repo shows 'used in 3 docs'. Delete button disabled. Click on the count → side panel with the 3 doc links so the author can edit each one and remove the image, then come back to delete.",
    severity: "high",
  },
  {
    scenario: "External URL goes 404 a year later",
    current: "Image silently broken in every doc that referenced it.",
    proposed: "Daily background probe of url-source rows. On 404, mark the image broken in the repo and fire a sonner.warning the next time the doc owner opens the doc.",
    severity: "med",
  },
  {
    scenario: "Author drags 12 images from a folder onto the editor",
    current: "Browser default: multiple images dropped one after another, each prompts. Painful.",
    proposed: "Drag-multiple on the editor body opens the upload modal pre-populated with all 12. Per-file alt-text required before insert.",
    severity: "low",
  },
  {
    scenario: "Old doc in IndexedDB has an image with no data-image-id",
    current: "Render works (it's still <img src=URL>). Repo shows nothing because there's no record.",
    proposed: "Migration on doc save: any <img> without a data-image-id gets an images row created (source='url' if external src; source='upload' is impossible without re-uploading). The doc body is patched in-place with data-image-id on next save. Idempotent.",
    severity: "med",
  },
  {
    scenario: "PDF export needs the image to print reliably",
    current: "External URLs print only if loaded before window.print(). Often blank.",
    proposed: "Print pipeline waits for img.complete on every <img>. Convex-hosted images use a longer cache header so reprints don't re-fetch.",
    severity: "low",
  },
]

function EdgeCasesSection() {
  return (
    <Section
      title="Edge cases"
      description="Each row is a scenario this proposal must handle. Ranked by severity."
    >
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Scenario</TableHead>
                <TableHead className="w-[28%]">Current</TableHead>
                <TableHead className="w-[40%]">Proposed</TableHead>
                <TableHead className="w-[10%]">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EDGE_CASES.map((e) => (
                <TableRow key={e.scenario}>
                  <TableCell className="align-top text-xs font-medium">
                    {e.scenario}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {e.current}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    {e.proposed}
                  </TableCell>
                  <TableCell className="align-top">
                    <SeverityBadge sev={e.severity} />
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

function SelfGrillingSection() {
  return (
    <Section
      title="Self-grilling"
      description="Where this could be wrong."
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <Grill
            q="Why two tables (images + imageUsages) instead of just storing image IDs in the doc body and computing usage on the fly?"
            a="Computing usage on the fly is fine for one or two docs but the repo page wants to render counts for the whole library. That means scanning every doc body on every render, which doesn't scale. The imageUsages table is a denormalized view recomputed on document save — same pattern as document_assets in the existing schema. Trades a little write cost for fast reads."
          />
          <Grill
            q="Is sha256 dedup actually useful?"
            a="Maybe. If three authors all upload the same logo, you get three records for one logo. If we dedup, you get one record with three usages, which makes the orphan rule cleaner (delete the logo from one doc → still 2 usages → image stays). Dedup is per-tenant, not global. Cost: a 256-bit hash per upload, computed in the browser before the mutation call."
          />
          <Grill
            q="What about images attached to assets (the asset thumbnail / floorplan)?"
            a="Out of scope for v1. Asset images live in their own asset record fields today, not in the editor. Optional follow-up: route asset images through the same images table so the repo page shows them too. For v1, only TipTap-body images are tracked."
          />
          <Grill
            q="Hardest one: what happens to the 'old doc with no data-image-id' migration when someone opens an archived doc that won't be saved?"
            a="If we only patch on save, the archived doc stays unmigrated forever. Two options: (a) lazy migration on read — write a usages row but don't patch the body until the doc is edited; (b) one-time backfill action that walks every doc body and creates rows + patches bodies. Lean: (b) — clean, predictable, runs once after the schema change ships. Same pattern as the qa_sessions migration in the Convex move."
          />
          <Grill
            q="Should images be public or auth-gated?"
            a="Auth-gated. Convex storage URLs are signed and expire. The editor + repo + read view fetch fresh URLs via files.getUrl on render. That means the URL you see in the browser dev tools is short-lived, which is fine — and means screenshots-of-a-screenshot don't accidentally leak permanent links."
          />
          <Grill
            q="What about a v1 corner-cut: support upload only, drop URL embedding entirely?"
            a="Tempting and cleaner. But: existing docs already contain external URLs (Grafana screenshots in the demo set, for example). Cutting URL support orphans those instantly. Better to keep URL as a second-class option and gently nudge authors toward upload."
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
      description="In dependency order. Each step is one commit. Verify at each: npx tsc -b && npx vite build."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <Step
            n={1}
            title="Schema + repos"
            files={[
              "convex/schema.ts — add `images` and `imageUsages` tables with indexes (by_sha256, by_documentId, by_imageId)",
              "convex/images.ts — list / get / create / update / remove queries + mutations",
              "convex/imageUsages.ts — internal helpers used by document save",
            ]}
            notes="No client changes yet. Validate via the Convex dashboard."
          />
          <Step
            n={2}
            title="Save-side recompute"
            files={[
              "convex/documents.ts — savePublish + create-on-save: walk body for img tags, diff usages",
              "convex/lib/imageWalker.ts — TipTap body walker, returns {imageId, externalUrl}[]",
            ]}
            notes="Idempotent, server-side. Existing flows keep working."
          />
          <Step
            n={3}
            title="Upload modal in the editor"
            files={[
              "src/components/docs/InsertImageDialog.tsx — new (Upload tab + URL tab)",
              "src/components/docs/DocumentEditor.tsx — replace insertImage prompt with the dialog",
            ]}
            notes="Uses files.generateUploadUrl + images.create mutation. Inserts <img data-image-id>."
          />
          <Step
            n={4}
            title="Resolve data-image-id at render time"
            files={[
              "src/components/docs/TiptapReadOnly.tsx — register Image extension override that reads data-image-id and resolves storageId via files.getUrl",
              "src/components/docs/DocumentEditor.tsx — same override for live editing",
            ]}
            notes="Existing <img src=URL> nodes still render unchanged."
          />
          <Step
            n={5}
            title="Image library page"
            files={[
              "src/pages/desktop/ImageLibraryPage.tsx — new (list + filter + side panel)",
              "src/App.tsx — add /images route",
              "src/components/layout/DesktopShell.tsx — sub-link under Library, or top-level depending on the page-header-spec outcome",
            ]}
            notes="Reads from images + imageUsages joins."
          />
          <Step
            n={6}
            title="Backfill action"
            files={[
              "convex/images.ts — backfillFromExistingDocs internal action",
              "src/pages/desktop/SettingsPage.tsx — admin button to run the backfill once",
            ]}
            notes="Walks every doc, creates images rows for raw <img> URLs, patches bodies with data-image-id."
          />
          <Step
            n={7}
            title="Drag-multiple + paste-from-clipboard"
            files={[
              "src/components/docs/DocumentEditor.tsx — handle paste / drop events with multiple image files",
            ]}
            notes="Lower priority; ship after the rest is stable."
          />
        </CardContent>
      </Card>
    </Section>
  )
}

function Step({
  n,
  title,
  files,
  notes,
}: {
  n: number
  title: string
  files: string[]
  notes?: string
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ArrowRight className="h-3.5 w-3.5 text-primary" />
        Step {n} — {title}
      </div>
      <ul className="mt-1.5 space-y-0.5 pl-5">
        {files.map((f) => (
          <li key={f} className="font-mono text-xs text-muted-foreground">
            {f}
          </li>
        ))}
      </ul>
      {notes && (
        <div className="mt-1.5 text-xs italic text-muted-foreground">
          {notes}
        </div>
      )}
    </div>
  )
}

function OpenQuestionsSection() {
  return (
    <Section
      title="Open questions for the user"
      description="Decisions that need your call before we touch the schema."
    >
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <Q>
            <strong>Where does /images live?</strong> Top-level sidebar item
            ("Image library"), under Library as a sub-tab, or under Settings
            as an admin surface? The page-header-spec analysis ties into this
            — different placements imply different breadcrumbs.
          </Q>
          <Q>
            <strong>Hard size cap.</strong> 10 MB is the proposal. Is that
            right for screenshots from photos? What about 50 MB for occasional
            high-res asset photos?
          </Q>
          <Q>
            <strong>URL embedding — keep or drop?</strong> Self-grilling
            argues keep. Dropping it simplifies everything but breaks every
            external Grafana / SaaS-hosted image already in the corpus. Your
            call.
          </Q>
          <Q>
            <strong>SVG handling.</strong> Allow with sanitizer, or reject
            entirely? Rejecting means the floorplan SVG demo case doesn't
            work via upload (it would have to be a curated diagram preset
            instead, like today).
          </Q>
          <Q>
            <strong>Permissions.</strong> Currently every signed-in user can
            upload and delete. With the role stub from the IA work, do we
            limit delete to Admin role once that role is real?
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
