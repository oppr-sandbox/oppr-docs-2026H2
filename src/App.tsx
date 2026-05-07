import { Route, Switch, useLocation, useRoute } from "wouter"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { DesktopShell } from "@/components/layout/DesktopShell"
import { MobileShell } from "@/components/mobile/MobileShell"
import { DashboardPage } from "@/pages/desktop/DashboardPage"
import { LibraryPage } from "@/pages/desktop/LibraryPage"
import { AssetsPage } from "@/pages/desktop/AssetsPage"
import { AssetDetailPage } from "@/pages/desktop/AssetDetailPage"
import { DocumentReadPage } from "@/pages/desktop/DocumentReadPage"
import { DocumentEditPage } from "@/pages/desktop/DocumentEditPage"
import { DocumentNewPage } from "@/pages/desktop/DocumentNewPage"
import { SettingsPage } from "@/pages/desktop/SettingsPage"
import { ImageLibraryPage } from "@/pages/desktop/ImageLibraryPage"
import { AnalysisIndexPage } from "@/pages/desktop/AnalysisIndexPage"
import { getAnalysisBySlug } from "@/pages/desktop/analysis/registry"
import { MobileHomePage } from "@/pages/mobile/MobileHomePage"
import { MobileScanPage } from "@/pages/mobile/MobileScanPage"
import { MobileAssetsPage } from "@/pages/mobile/MobileAssetsPage"
import { MobileAssetPage } from "@/pages/mobile/MobileAssetPage"
import { MobileDocsPage } from "@/pages/mobile/MobileDocsPage"
import { MobileDocPage } from "@/pages/mobile/MobileDocPage"
import { MobileAskPage } from "@/pages/mobile/MobileAskPage"
import { MobileFloorplanPage } from "@/pages/mobile/MobileFloorplanPage"
import { AuthGate } from "@/auth/AuthGate"

function AnalysisRoute() {
  const [, params] = useRoute<{ slug: string }>("/analysis/:slug")
  const meta = params ? getAnalysisBySlug(params.slug) : undefined
  if (!meta) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Analysis not found</h1>
      </div>
    )
  }
  const Component = meta.Component
  return <Component />
}

function App() {
  const [location] = useLocation()
  const isMobile = location.startsWith("/m")

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthGate>
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
              <Route path="/" component={DashboardPage} />
              <Route path="/library" component={LibraryPage} />
              <Route path="/assets" component={AssetsPage} />
              <Route path="/assets/:id" component={AssetDetailPage} />
              <Route path="/docs/new" component={DocumentNewPage} />
              <Route path="/docs/:id/edit" component={DocumentEditPage} />
              <Route path="/docs/:id" component={DocumentReadPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/images" component={ImageLibraryPage} />
              <Route path="/analysis" component={AnalysisIndexPage} />
              <Route path="/analysis/:slug" component={AnalysisRoute} />
              <Route>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Not found</h1>
                </div>
              </Route>
            </Switch>
          </DesktopShell>
        )}
      </AuthGate>
    </ThemeProvider>
  )
}

export default App
