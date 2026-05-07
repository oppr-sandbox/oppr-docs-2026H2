// Single source of truth for analysis pages. App.tsx renders one route per
// entry; AnalysisIndexPage renders the table. Add a new analysis: write the
// component, register it here.

import type { ComponentType } from "react"
import { IdaSourcesAnalysis } from "./IdaSourcesAnalysis"
import { TiptapEditorRevampAnalysis } from "./TiptapEditorRevampAnalysis"
import { GapAnalysis } from "./GapAnalysis"
import { EditorPublishFlowAnalysis } from "./EditorPublishFlowAnalysis"
import { FrontendToConvexMigrationAnalysis } from "./FrontendToConvexMigrationAnalysis"
import { PageHeaderSpecAnalysis } from "./PageHeaderSpecAnalysis"
import { ImageLibraryAnalysis } from "./ImageLibraryAnalysis"

export type AnalysisStatus = "done" | "in_progress" | "outstanding"

export type AnalysisArea =
  | "AI"
  | "Editor"
  | "Architecture"
  | "Strategy"
  | "Migration"
  | "IA"

export interface AnalysisMeta {
  slug: string
  title: string
  area: AnalysisArea
  status: AnalysisStatus
  updatedAt: string
  summary: string
  Component: ComponentType
}

export const ANALYSES: AnalysisMeta[] = [
  {
    slug: "page-header-spec",
    title: "Page header spec — TopBar, PageHeader, floating Ask IDA",
    area: "IA",
    status: "done",
    updatedAt: "2026-05-07",
    summary:
      "Two-tier header system: TopBar (breadcrumb + user menu only), per-page PageHeader for title + page actions, floating Ask IDA bottom-right with route-driven scope. Implemented across every desktop page.",
    Component: PageHeaderSpecAnalysis,
  },
  {
    slug: "image-library",
    title: "Image library — upload flow + repository",
    area: "Editor",
    status: "done",
    updatedAt: "2026-05-07",
    summary:
      "Upload + URL modal in the editor, content-addressed images table with sha256 dedup, save-side imageUsages recompute, /images repository with detail modal (preview, edit, used-in, download, delete-when-orphaned).",
    Component: ImageLibraryAnalysis,
  },
  {
    slug: "frontend-to-convex-migration",
    title: "Frontend → Convex migration",
    area: "Migration",
    status: "done",
    updatedAt: "2026-05-07",
    summary:
      "Five-phase plan to move the showcase off sql.js + IndexedDB onto Convex (auth, DB, file storage, vector search, server-side AI) and onto Vercel.",
    Component: FrontendToConvexMigrationAnalysis,
  },
  {
    slug: "gap-analysis",
    title: "Gap analysis — showcase vs full DOCS",
    area: "Strategy",
    status: "done",
    updatedAt: "2026-05-06",
    summary:
      "Capability matrix vs the v1.0 spec, per-stakeholder snapshot, and 33 net-new ideas grouped by persona with leverage/effort tags.",
    Component: GapAnalysis,
  },
  {
    slug: "editor-publish-flow",
    title: "Editor & Publish-to-PDF",
    area: "Editor",
    status: "done",
    updatedAt: "2026-04-30",
    summary:
      "Editor layout reorder (sticky strip, togglable metadata) plus the print-window pipeline that produces the publish-to-PDF artifact.",
    Component: EditorPublishFlowAnalysis,
  },
  {
    slug: "tiptap-editor-revamp",
    title: "TipTap editor revamp",
    area: "Editor",
    status: "done",
    updatedAt: "2026-04-22",
    summary:
      "Custom node design (callout, ppe, diagram, launchLog, linkedAsset, stepList) and how editor + read view extension lists must mirror.",
    Component: TiptapEditorRevampAnalysis,
  },
  {
    slug: "ida-sources-and-clear-modal",
    title: "IDA sources & clear modal",
    area: "AI",
    status: "done",
    updatedAt: "2026-04-15",
    summary:
      "Citation grouping, cross-link source badges, and the 'clear chat' modal as a single coherent surface for the Ask IDA sheet.",
    Component: IdaSourcesAnalysis,
  },
]

export function getAnalysisBySlug(slug: string): AnalysisMeta | undefined {
  return ANALYSES.find((a) => a.slug === slug)
}
