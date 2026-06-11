import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAction, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useTheme } from "next-themes"
import { api } from "../../../convex/_generated/api"
import {
  CHAT_MODEL,
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
} from "../../../convex/ai/constants"
import { toast } from "sonner"
import { Link } from "wouter"
import {
  FileText,
  Hash,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  User as UserIcon,
} from "lucide-react"
import { TopBar } from "@/components/layout/TopBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { cn } from "@/lib/utils"

const ROLE = "Author"

export function SettingsPage() {
  const { signOut } = useAuthActions()
  const me = useQuery(api.users.me)

  const embedStatus = useQuery(api.ai.embed.embedStatus)
  const embedMissingAction = useAction(api.ai.embed.embedMissing)
  const reembedAllAction = useAction(api.ai.embed.reembedAll)

  const [embedding, setEmbedding] = useState(false)
  const [reembedDialogOpen, setReembedDialogOpen] = useState(false)

  async function handleEmbed(reembed: boolean) {
    setEmbedding(true)
    const toastId = toast.loading(
      reembed ? "Clearing + re-embedding…" : "Embedding chunks…",
    )
    try {
      const result = reembed
        ? await reembedAllAction({})
        : await embedMissingAction({})
      if ("cleared" in result) {
        toast.success(
          `Cleared ${result.cleared}, re-embedded ${result.embedded}/${result.total}`,
          { id: toastId },
        )
      } else if (result.total === 0) {
        toast.success("All chunks already embedded.", { id: toastId })
      } else {
        toast.success(`Embedded ${result.embedded}/${result.total} chunks`, {
          id: toastId,
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err), {
        id: toastId,
      })
    } finally {
      setEmbedding(false)
    }
  }

  const outstanding = embedStatus?.outstanding ?? 0
  const email = me?.email ?? ""
  const name = me?.name ?? null

  return (
    <div className="flex flex-col">
      <TopBar breadcrumb={[{ label: "Settings" }]} />
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Your profile, document configuration, and app preferences."
      />
      <div className="p-6">
        <Tabs defaultValue="user" className="space-y-4">
          <TabsList>
            <TabsTrigger value="user" className="gap-1.5 text-xs">
              <UserIcon className="h-3.5 w-3.5" /> User settings
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Document settings
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-1.5 text-xs">
              <SettingsIcon className="h-3.5 w-3.5" /> General
            </TabsTrigger>
          </TabsList>

          {/* ---- User settings ---- */}
          <TabsContent value="user" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Profile</CardTitle>
                <CardDescription className="text-xs">
                  Your account in Oppr DOCS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {(email.slice(0, 1) || "?").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {name ?? email ?? "Signed in"}
                    </div>
                    {name && email && (
                      <div className="truncate text-xs text-muted-foreground">
                        {email}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1 rounded-md bg-muted/40 p-3 text-[11px]">
                  <Row label="Email" value={email || "—"} />
                  <Row label="Role" value={ROLE} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Account</CardTitle>
                <CardDescription className="text-xs">
                  Sign out of this device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- Document settings ---- */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Manage the building blocks new documents draw from.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link href="/settings/naming">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    Naming acronyms
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Safety icons &amp; templates
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI retrieval (Ask IDA)</CardTitle>
                <CardDescription className="text-xs">
                  Ask IDA answers operator questions by retrieving the most
                  relevant passages from your published documents. On publish,
                  each document is split into text chunks and converted into
                  embedding vectors; a question is matched against those vectors
                  to find supporting passages. Keep coverage complete so answers
                  stay grounded — every chunk should be indexed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 rounded-md bg-muted/40 p-3 font-mono text-[11px]">
                  <Row
                    label="Embedding model"
                    value={`${EMBEDDING_MODEL} · ${EMBEDDING_DIM}d`}
                  />
                  <Row label="Chat model" value={CHAT_MODEL} />
                  <Row
                    label="Last embedding"
                    value={
                      embedStatus === undefined
                        ? "…"
                        : embedStatus.lastEmbeddedAt
                          ? formatWhen(embedStatus.lastEmbeddedAt)
                          : "never"
                    }
                  />
                  <Row
                    label="Indexed chunks"
                    value={
                      embedStatus === undefined
                        ? "…"
                        : `${embedStatus.embedded} / ${embedStatus.total}`
                    }
                  />
                  <Row
                    label="Outstanding"
                    value={
                      embedStatus === undefined
                        ? "…"
                        : outstanding === 0
                          ? "0 — all indexed"
                          : `${outstanding} to embed`
                    }
                    highlight={outstanding > 0}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleEmbed(false)}
                    disabled={embedding || outstanding === 0}
                  >
                    {embedding ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Working…
                      </>
                    ) : (
                      "Embed missing chunks"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReembedDialogOpen(true)}
                    disabled={embedding}
                  >
                    Re-embed all
                  </Button>
                  <AlertDialog
                    open={reembedDialogOpen}
                    onOpenChange={setReembedDialogOpen}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                          <RefreshCw className="h-5 w-5" />
                        </div>
                        <AlertDialogTitle className="text-center">
                          Re-embed all chunks?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                          Every existing chunk embedding will be cleared and
                          rebuilt from scratch. Ask IDA answers may be degraded
                          until the re-embed finishes — takes roughly 30 seconds.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleEmbed(true)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Clear and re-embed
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- General ---- */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Appearance</CardTitle>
                <CardDescription className="text-xs">
                  How Oppr DOCS looks on this device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeToggle />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 rounded-md bg-muted/40 p-3 text-[11px]">
                  <Row label="Product" value="Oppr DOCS" />
                  <Row label="Release" value="v1.0 showcase" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const current = theme === "dark" ? "dark" : "light"
  return (
    <div className="flex items-center overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
          current === "light"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted",
        )}
      >
        <Sun className="h-3.5 w-3.5" /> Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
          current === "dark"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted",
        )}
      >
        <Moon className="h-3.5 w-3.5" /> Dark
      </button>
    </div>
  )
}

function formatWhen(ts: number): string {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-amber-600" : undefined}>
        {value}
      </span>
    </div>
  )
}
