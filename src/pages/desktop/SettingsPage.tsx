import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useAction, useMutation, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "../../../convex/_generated/api"
import { toast } from "sonner"
import { buildSeedPayload } from "@/admin/buildSeedPayload"
import { Loader2 } from "lucide-react"
import { TopBar } from "@/components/layout/TopBar"

const EMBEDDING_MODEL = "gemini-embedding-2"
const EMBEDDING_DIM = 768
const CHAT_MODEL = "gemini-3.1-flash-lite-preview"

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuthActions()

  const seedStatus = useQuery(api.seed.status)
  const runSeed = useMutation(api.seed.seedDemoData)
  const embedMissingAction = useAction(api.ai.embed.embedMissing)
  const reembedAllAction = useAction(api.ai.embed.reembedAll)

  const [seeding, setSeeding] = useState(false)
  const [embedding, setEmbedding] = useState(false)

  async function handleSeed() {
    setSeeding(true)
    const toastId = toast.loading("Pushing seed payload…")
    try {
      const payload = buildSeedPayload()
      const result = await runSeed({ payload })
      if (result.skipped) {
        toast.success(
          `Already at seed version ${result.currentVersion} — nothing to do.`,
          { id: toastId },
        )
      } else {
        toast.success(
          `Seeded ${result.counts.documents} docs, ${result.counts.assets} assets.`,
          { id: toastId },
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err), {
        id: toastId,
      })
    } finally {
      setSeeding(false)
    }
  }

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
        toast.success(
          `Embedded ${result.embedded}/${result.total} chunks`,
          { id: toastId },
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err), {
        id: toastId,
      })
    } finally {
      setEmbedding(false)
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar breadcrumb={[{ label: "Settings" }]} />
      <div className="space-y-4 p-6">
        <div>
          <h1 className="text-base font-semibold">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Theme, demo data, and AI controls.
          </p>
        </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Theme</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            Dark
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">AI</CardTitle>
          <CardDescription className="text-xs">
            Server-side via Convex actions. Embeddings auto-run on document
            publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 rounded-md bg-muted/40 p-3 font-mono text-[11px]">
            <Row label="Embedding model" value={`${EMBEDDING_MODEL} · ${EMBEDDING_DIM}d`} />
            <Row label="Chat model" value={CHAT_MODEL} />
            <Row
              label="Indexed chunks"
              value={
                seedStatus === undefined
                  ? "…"
                  : seedStatus.hasDocs
                    ? "see Convex AI dashboard"
                    : "none"
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleEmbed(false)}
              disabled={embedding}
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
              onClick={() => {
                if (
                  !confirm(
                    "Clear every chunk embedding and re-embed from scratch? Takes ~30 seconds.",
                  )
                )
                  return
                void handleEmbed(true)
              }}
              disabled={embedding}
            >
              Re-embed all
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Demo data</CardTitle>
          <CardDescription className="text-xs">
            Seed the Convex backend with the showcase library. Idempotent on
            seed version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 rounded-md bg-muted/40 p-3 font-mono text-[11px]">
            <Row
              label="Seed version"
              value={
                seedStatus === undefined
                  ? "…"
                  : seedStatus.seedVersion === null
                    ? "not seeded"
                    : String(seedStatus.seedVersion)
              }
            />
            <Row
              label="Documents"
              value={
                seedStatus === undefined
                  ? "…"
                  : seedStatus.hasDocs
                    ? "yes"
                    : "no"
              }
            />
          </div>
          <Button size="sm" onClick={() => void handleSeed()} disabled={seeding}>
            {seeding ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Seeding…
              </>
            ) : (
              "Seed demo data"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button size="sm" variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
