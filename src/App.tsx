import { Route, Switch, useLocation } from "wouter"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { DesktopShell } from "@/components/layout/DesktopShell"
import { MobileShell } from "@/components/mobile/MobileShell"
import { LibraryPage } from "@/pages/desktop/LibraryPage"
import { AssetsPage } from "@/pages/desktop/AssetsPage"
import { AssetDetailPage } from "@/pages/desktop/AssetDetailPage"
import { DocumentReadPage } from "@/pages/desktop/DocumentReadPage"
import { DocumentEditPage } from "@/pages/desktop/DocumentEditPage"
import { DocumentNewPage } from "@/pages/desktop/DocumentNewPage"
import { SettingsPage } from "@/pages/desktop/SettingsPage"
import { IdaSourcesAnalysis } from "@/pages/desktop/analysis/IdaSourcesAnalysis"
import { TiptapEditorRevampAnalysis } from "@/pages/desktop/analysis/TiptapEditorRevampAnalysis"
import { GapAnalysis } from "@/pages/desktop/analysis/GapAnalysis"
import { EditorPublishFlowAnalysis } from "@/pages/desktop/analysis/EditorPublishFlowAnalysis"
import { FrontendToConvexMigrationAnalysis } from "@/pages/desktop/analysis/FrontendToConvexMigrationAnalysis"
import { MobileHomePage } from "@/pages/mobile/MobileHomePage"
import { MobileScanPage } from "@/pages/mobile/MobileScanPage"
import { MobileAssetsPage } from "@/pages/mobile/MobileAssetsPage"
import { MobileAssetPage } from "@/pages/mobile/MobileAssetPage"
import { MobileDocsPage } from "@/pages/mobile/MobileDocsPage"
import { MobileDocPage } from "@/pages/mobile/MobileDocPage"
import { MobileAskPage } from "@/pages/mobile/MobileAskPage"
import { MobileFloorplanPage } from "@/pages/mobile/MobileFloorplanPage"
import { DbProvider } from "@/db/DbProvider"

function App() {
  const [location] = useLocation()
  const isMobile = location.startsWith("/m")

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <DbProvider>
        <Toaster richColors position="top-right" />
        {isMobile ? (
          <MobileShell>
            <Switch>
              <Route path="/m" component={MobileHomePage} />
              <Route path="/m/scan" component={MobileScanPage} />
              <Route path="/m/floorplan" component={MobileFloorplanPage} />
              <Route path="/m/assets" component={MobileAssetsPage} />
              <Route path="/m/assets/:id" component={MobileAssetPage} />
              <Route path="/m/docs" component={MobileDocsPage} />
              <Route path="/m/docs/:id" component={MobileDocPage} />
              <Route path="/m/ask" component={MobileAskPage} />
            </Switch>
          </MobileShell>
        ) : (
          <DesktopShell>
            <Switch>
              <Route path="/" component={LibraryPage} />
              <Route path="/assets" component={AssetsPage} />
              <Route path="/assets/:id" component={AssetDetailPage} />
              <Route path="/docs/new" component={DocumentNewPage} />
              <Route path="/docs/:id/edit" component={DocumentEditPage} />
              <Route path="/docs/:id" component={DocumentReadPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route
                path="/analysis/ida-sources-and-clear-modal"
                component={IdaSourcesAnalysis}
              />
              <Route
                path="/analysis/tiptap-editor-revamp"
                component={TiptapEditorRevampAnalysis}
              />
              <Route
                path="/analysis/gap-analysis"
                component={GapAnalysis}
              />
              <Route
                path="/analysis/editor-publish-flow"
                component={EditorPublishFlowAnalysis}
              />
              <Route
                path="/analysis/frontend-to-convex-migration"
                component={FrontendToConvexMigrationAnalysis}
              />
              <Route>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Not found</h1>
                </div>
              </Route>
            </Switch>
          </DesktopShell>
        )}
      </DbProvider>
    </ThemeProvider>
  )
}

export default App
