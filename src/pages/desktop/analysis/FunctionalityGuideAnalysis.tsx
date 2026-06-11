// Analysis page: a plain-language guide to how every part of Oppr DOCS works.
// Written so a new colleague can read it once and understand the whole tool.
// Static documentation — no live data.

import type { ReactNode } from "react"
import {
  Boxes,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Layers,
  Link2,
  Printer,
  QrCode,
  Settings,
  Sparkles,
  Tag,
  Upload,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AnalysisLayout, Section } from "./_AnalysisLayout"

export function FunctionalityGuideAnalysis() {
  return (
    <AnalysisLayout
      title="How Oppr DOCS works — the colleague's guide"
      subtitle="One read to understand the whole tool: what each feature does, where it lives in the code, and the rules that aren't obvious from the screen. Pair this with the 'Ask IDA scoping' page (which covers the chat in depth) and you have the full picture."
      date="2026-06-11"
      scopes={["desktop", "mobile", "data-model", "AI"]}
    >
      <MentalModelSection />
      <AuthoringSection />
      <NamingSection />
      <VersioningSection />
      <LinksSection />
      <ImporterSection />
      <PdfSection />
      <ImagesSection />
      <MobileSection />
      <TemplatesSection />
      <RegistriesSection />
      <WhereToLookSection />
    </AnalysisLayout>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText
  title: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </div>
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

function Where({ path }: { path: string }) {
  return (
    <div className="text-[11px] text-muted-foreground/80">
      <span className="font-semibold uppercase tracking-wide">Code · </span>
      <code>{path}</code>
    </div>
  )
}

// --- Mental model -------------------------------------------------------------

function MentalModelSection() {
  return (
    <Section
      title="The mental model"
      description="Everything else follows from these four facts."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <FeatureCard icon={Layers} title="One app, two shells, one backend">
          <p>
            The same Vite/React app serves desktop (<code>/</code>) and mobile
            (<code>/m/*</code>); a top-level route switch picks the shell. All
            data lives in Convex — components subscribe with{" "}
            <code>useQuery</code> and every open window live-updates on a write.
            There's no client store and no REST API.
          </p>
          <Where path="src/App.tsx · convex/*" />
        </FeatureCard>
        <FeatureCard icon={Settings} title="Functions are the only way in">
          <p>
            Reads and writes go through Convex functions in{" "}
            <code>convex/*.ts</code>; each one calls{" "}
            <code>requireUser</code>/<code>requireUserId</code>. The schema in{" "}
            <code>convex/schema.ts</code> is the source of truth — add a field
            there first, push, then update the functions that shape it.
          </p>
          <Where path="convex/lib/auth.ts · convex/schema.ts" />
        </FeatureCard>
        <FeatureCard icon={Tag} title="The naming code is identity">
          <p>
            Every document has a code{" "}
            <code>{"{LOCATION}-{DISCIPLINE}-{TYPE}-{NNNN}"}</code> minted
            server-side and never changed. Filing is parsed back out of the
            code. Changing filing means a brand-new document (refile).
          </p>
          <Where path="convex/naming.ts · src/lib/namingCode.ts" />
        </FeatureCard>
        <FeatureCard icon={GitBranch} title="Live vs working version">
          <p>
            <code>liveVersion</code> is what operators/QR/RAG see;{" "}
            <code>currentVersion</code> is what the editor works on. Saving never
            bumps. Publishing pins live. Editing a published doc forks a new
            working version; the old one stays live until you re-publish.
          </p>
          <Where path="convex/documents.ts" />
        </FeatureCard>
      </div>
    </Section>
  )
}

// --- Authoring ----------------------------------------------------------------

function AuthoringSection() {
  return (
    <Section
      title="Authoring"
      description="The editor is TipTap with custom nodes. The read view and PDF export must render the same node set or content gets silently stripped."
    >
      <FeatureCard icon={FileText} title="The editor and its custom blocks">
        <p>
          Beyond standard rich text, the editor adds custom nodes: safety{" "}
          <strong>Callouts</strong> (danger/warning/notice/tip with typed
          variants like LOTO, hot-work), <strong>PPE</strong> requirement
          bands, <strong>Diagrams</strong> (a built-in SVG builder with
          placeable background images), <strong>Step lists</strong>,{" "}
          <strong>Asset pills</strong> (link a machine), <strong>Reference
          doc</strong> chips (point at another SOP), and{" "}
          <strong>Launch-log</strong> references (point at the exact log a SOP
          standardizes). Indexable text from these nodes is pulled into chunks
          for RAG.
        </p>
        <p>
          The editor and the read-only view load the <em>same</em> extension
          array — if you add a node to one and not the other, stored content is
          dropped on the next render. Keep the PDF print builder in step too.
        </p>
        <Where path="src/components/docs/DocumentEditor.tsx · TiptapReadOnly.tsx · chunking.ts · src/lib/pdf-export/buildPrintDoc.ts" />
      </FeatureCard>
    </Section>
  )
}

// --- Naming -------------------------------------------------------------------

function NamingSection() {
  return (
    <Section
      title="Naming codes & filing"
      description="The code is metadata for humans; the Convex id is the real key."
    >
      <FeatureCard icon={Tag} title="How codes are allocated and locked">
        <p>
          The vocabulary (locations, disciplines, types) is managed at{" "}
          <code>/settings/naming</code>. When a draft is first committed, the
          server atomically increments a per-triplet counter
          (<code>namingCounters</code>) and mints the code. Once allocated it's
          immutable: the editor greys out the filing selectors. Need different
          filing? <code>documents.refile</code> mints a new document with a new
          code and optionally archives the old one. Older rows that predate the
          stored <code>location</code>/<code>discipline</code> fields are
          backfilled by parsing their code.
        </p>
        <Where path="convex/naming.ts · src/components/docs/RefileDocumentDialog.tsx" />
      </FeatureCard>
    </Section>
  )
}

// --- Versioning ---------------------------------------------------------------

function VersioningSection() {
  return (
    <Section
      title="Versioning & the publish lifecycle"
      description="A published SOP must stay live while its replacement is written."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>What happens</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <LifeRow
            a="Save a draft"
            b="Writes the working version's body + chunks. Never changes the version number or what operators see."
          />
          <LifeRow
            a="Advance status"
            b="pre_draft → draft → in_review → approved → published, with author/reviewer/approver sign-offs recorded per version."
          />
          <LifeRow
            a="Publish"
            b="Pins liveVersion to the current edition and schedules embeddings. From now on operators/QR/RAG read this version."
          />
          <LifeRow
            a="Edit a published doc"
            b="Forks a new working version (createNewVersion). The published version stays live and read-only until you publish the fork."
          />
          <LifeRow
            a="Open in the library / reader"
            b="The status + version show on one line with a fork chip; you can view the live version and the in-progress draft, and export a PDF of whichever you're viewing."
          />
          <LifeRow
            a="Archive"
            b="Drops the doc out of operator answers. Direct doc-scope questions still work; asset/library RAG excludes it."
          />
        </TableBody>
      </Table>
      <Where path="convex/documents.ts · src/components/docs/VersionHistoryDrawer.tsx · DocumentReadPage.tsx" />
    </Section>
  )
}

function LifeRow({ a, b }: { a: string; b: string }) {
  return (
    <TableRow>
      <TableCell className="align-top text-xs font-medium">{a}</TableCell>
      <TableCell className="align-top text-xs">{b}</TableCell>
    </TableRow>
  )
}

// --- Links --------------------------------------------------------------------

function LinksSection() {
  return (
    <Section
      title="How documents connect to assets and logs"
      description="Links are body-derived join rows, not embedded fields."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <FeatureCard icon={Boxes} title="Asset pills → documentAssets">
          <p>
            Dropping an asset pill into the body creates a row in{" "}
            <code>documentAssets</code> on save. That join is what asset-scoped
            RAG and the QR retrieval read.
          </p>
        </FeatureCard>
        <FeatureCard icon={Link2} title="Reference docs → cross-links">
          <p>
            A reference chip points one SOP at another. The metadata panel
            surfaces them; the importer flags candidates rather than
            auto-linking.
          </p>
        </FeatureCard>
        <FeatureCard icon={QrCode} title="Launch logs → documentLogRefs">
          <p>
            A launch-log reference ties a SOP to the exact log it standardizes
            (carrying the log code). The reader's right rail lists them; the PDF
            overview includes them.
          </p>
        </FeatureCard>
      </div>
      <Where path="convex/lib/imageWalker.ts · src/lib/bodyLogs.ts · convex/documents.ts (save recompute)" />
    </Section>
  )
}

// --- Importer -----------------------------------------------------------------

function ImporterSection() {
  return (
    <Section
      title="External document importer"
      description="Turn a customer's PDF into a native, editable Oppr document."
    >
      <FeatureCard icon={Upload} title="The pipeline">
        <p>
          At <code>/import</code> you upload a PDF. The browser extracts text
          and embedded images (pdfjs), a Gemini action maps the raw content into
          a typed <strong>StructuredDoc</strong> intermediate, candidate
          asset/reference links are resolved against the library, and the
          finalize step renders the StructuredDoc into TipTap and creates the
          document. Extracted figures come in small (35% width) so they can be
          enlarged deliberately rather than dominating the page. The whole run
          is tracked as an <code>importJobs</code> row so it survives reloads.
        </p>
        <Where path="convex/importer/* · src/lib/import/* · src/pages/desktop/ImportPage.tsx" />
      </FeatureCard>
    </Section>
  )
}

// --- PDF ----------------------------------------------------------------------

function PdfSection() {
  return (
    <Section
      title="PDF export"
      description="Client-side print pipeline that exports exactly the version you're viewing."
    >
      <FeatureCard icon={Printer} title="What the export produces">
        <p>
          Export builds a self-contained print document: a compact one-page
          title (with a prominent document ID and a draft watermark for
          unpublished editions), a <strong>Document overview</strong> front
          matter section (always-on linked machines + linked logs, rendered as
          coloured pills matching the in-app chips), then the body. Diagram
          backgrounds that reference Convex storage are pre-fetched and inlined
          as data URLs so the print document needs no network. A single
          <strong> PDF cover</strong> setup (company name, header/footer, logo,
          title size, page numbers, confidentiality, watermark, accent colour)
          is configured once on the Templates page and applied to every export
          — there's no per-document chooser.
        </p>
        <Where path="src/lib/pdf-export/* · src/components/docs/PublishToPdfDialog.tsx · CoverSettingsEditor.tsx" />
      </FeatureCard>
    </Section>
  )
}

// --- Images -------------------------------------------------------------------

function ImagesSection() {
  return (
    <Section
      title="Image & diagram library"
      description="Content-addressed storage with usage tracking."
    >
      <FeatureCard icon={ImageIcon} title="/images">
        <p>
          Images are stored content-addressed (sha256 dedup). On save the app
          recomputes which documents use which image (<code>imageUsages</code>),
          so the library can group by document, show each document's status, and
          only allow deleting truly orphaned images. Diagrams built in the
          editor surface in their own tab. Image nodes round-trip a width
          percentage and alignment; drag-to-move is handled by ProseMirror (the
          inner <code>&lt;img&gt;</code> stays non-draggable so the browser
          doesn't drop a duplicate).
        </p>
        <Where path="convex/images.ts · convex/lib/imageWalker.ts · src/components/docs/ImageWithRef.tsx · ImageLibraryPage.tsx" />
      </FeatureCard>
    </Section>
  )
}

// --- Mobile -------------------------------------------------------------------

function MobileSection() {
  return (
    <Section
      title="Mobile & QR retrieval"
      description="What the operator on the floor actually touches."
    >
      <FeatureCard icon={QrCode} title="/m/*">
        <p>
          The mobile shell is the operator surface. Scanning an asset's QR
          (<code>qrToken</code>) opens that asset and its linked documents;
          opening a document serves the live version. Ask IDA is available
          scoped to the asset or a document, with a text-size dial for floor
          readability. Recently-viewed and pinned items are kept in
          localStorage and fenced so stale ids from before a data wipe can't
          crash a Convex query.
        </p>
        <Where path="src/pages/mobile/* · src/components/mobile/use-mobile-prefs.ts" />
      </FeatureCard>
    </Section>
  )
}

// --- Templates ----------------------------------------------------------------

function TemplatesSection() {
  return (
    <Section
      title="Templates & PDF cover"
      description="DB-backed document templates plus the single PDF cover setup."
    >
      <FeatureCard icon={Sparkles} title="/templates">
        <p>
          Document templates live in the <code>templates</code> table and are
          created/edited/duplicated at <code>/templates</code>; a reference
          best-practice SOP template seeds the structure new authors start from.
          A second tab on the same page owns the one PDF cover configuration
          used by every export.
        </p>
        <Where path="convex/templates.ts · convex/coverSettings.ts · src/pages/desktop/TemplatesPage.tsx" />
      </FeatureCard>
    </Section>
  )
}

// --- Registries ---------------------------------------------------------------

function RegistriesSection() {
  return (
    <Section
      title="Assets & logs are shared registries"
      description="The one piece of architecture that isn't visible on screen."
    >
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="space-y-2 p-4 text-sm leading-relaxed">
          <p>
            In the full Oppr platform the <strong>asset registry</strong> and
            the <strong>log stream</strong> belong to the wider toolset
            (LOGS/IDA), not to DOCS. The same machine must resolve identically
            whether it's scanned in LOGS or opened in DOCS, and logs are
            imported from LOGS so a SOP can launch-reference the real capture.
          </p>
          <p>
            This showcase keeps its own copies to stay demoable, but treats them
            as borrowed: every access goes through <code>convex/assets.ts</code>{" "}
            / <code>convex/logs.ts</code> (no component reads the tables
            directly), and rows carry optional <code>source</code> /{" "}
            <code>externalId</code> provenance so imported platform records keep
            their identity. That makes the future swap to the real registry a
            server-side change. Documents always link by id, never by the
            human-readable code.
          </p>
          <Where path="docs/adr/0001-shared-asset-and-log-registries.md" />
        </CardContent>
      </Card>
    </Section>
  )
}

// --- Where to look ------------------------------------------------------------

function WhereToLookSection() {
  return (
    <Section
      title="Where to look when you start a task"
      description="The fastest path from a request to the right file."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">If you're changing…</TableHead>
            <TableHead>Start here</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <LookRow a="A data shape" b="convex/schema.ts → the mutation that writes it → the type in src/types + convex-adapters" />
          <LookRow a="The editor or a new block" b="src/components/docs/DocumentEditor.tsx + TiptapReadOnly.tsx (mirror both) + chunking.ts + buildPrintDoc.ts" />
          <LookRow a="The chat / RAG" b="convex/ai/ask.ts (retrieval + scope) and src/components/ai/AskPanel.tsx (UI)" />
          <LookRow a="PDF output" b="src/lib/pdf-export/* and PublishToPdfDialog.tsx" />
          <LookRow a="A new page" b="src/pages/desktop|mobile + wire into src/App.tsx + a nav entry in the shell" />
          <LookRow a="Naming / filing" b="convex/naming.ts and src/lib/namingCode.ts (mirror the parser)" />
          <LookRow a="Reset dev data" b="npx convex run seedMinimal:run" />
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Conventions, pitfalls, and copy-paste task recipes live in{" "}
        <code>CLAUDE.md</code>; the current build state (shipped features,
        routes, known issues) lives in <code>oppr-docs-status.md</code>.
      </p>
    </Section>
  )
}

function LookRow({ a, b }: { a: string; b: string }) {
  return (
    <TableRow>
      <TableCell className="align-top text-xs font-medium">{a}</TableCell>
      <TableCell className="align-top text-xs">{b}</TableCell>
    </TableRow>
  )
}
