import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { useMutation, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "../../../convex/_generated/api"
import { useDb } from "@/db/DbProvider"
import { toast } from "sonner"
import { buildSeedPayload } from "@/admin/buildSeedPayload"
import {
  CHAT_MODEL,
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
  embed,
  embedMissingChunks,
  generate,
  hasApiKey,
} from "@/ai"
import { clearAllEmbeddings } from "@/db/repositories/embeddings"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

const KEY_STORAGE = "oppr-docs:gemini-key"

interface EmbedResult {
  text: string
  vector: number[]
  dim: number
  latencyMs: number
}

interface GenResult {
  prompt: string
  output: string
  latencyMs: number
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { reset, db } = useDb()
  const { signOut } = useAuthActions()
  const seedStatus = useQuery(api.seed.status)
  const runSeed = useMutation(api.seed.seedDemoData)
  const [seeding, setSeeding] = useState(false)

  async function handleConvexSeed() {
    setSeeding(true)
    const toastId = toast.loading("Building seed payload…")
    try {
      const payload = buildSeedPayload()
      toast.loading(
        `Pushing ${payload.documents.length} documents, ${payload.assets.length} assets…`,
        { id: toastId },
      )
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
  const [key, setKey] = useState(
    () =>
      localStorage.getItem(KEY_STORAGE) ??
      import.meta.env.VITE_GEMINI_API_KEY ??
      "",
  )
  const [embedding, setEmbedding] = useState(false)

  // Embedding test state
  const [embedInput, setEmbedInput] = useState(
    "Operators must wear hearing protection within 3 meters of the calciner.",
  )
  const [embedRunning, setEmbedRunning] = useState(false)
  const [embedResult, setEmbedResult] = useState<EmbedResult | null>(null)
  const [embedError, setEmbedError] = useState<string | null>(null)
  const [showFullVector, setShowFullVector] = useState(false)

  // Generative test state
  const [genInput, setGenInput] = useState(
    "In one sentence, what is a calciner used for in pigment production?",
  )
  const [genRunning, setGenRunning] = useState(false)
  const [genResult, setGenResult] = useState<GenResult | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  function saveKey() {
    localStorage.setItem(KEY_STORAGE, key.trim())
    toast.success("Gemini API key saved")
  }

  async function handleReset() {
    await reset()
    toast.success("Demo reset to seed state")
  }

  async function runEmbed() {
    if (!embedInput.trim()) {
      toast.error("Enter some text to embed")
      return
    }
    setEmbedRunning(true)
    setEmbedError(null)
    setEmbedResult(null)
    setShowFullVector(false)
    const t0 = performance.now()
    try {
      const vector = await embed(embedInput)
      setEmbedResult({
        text: embedInput,
        vector,
        dim: vector.length,
        latencyMs: Math.round(performance.now() - t0),
      })
      toast.success(`Embedding OK (${vector.length}-dim)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setEmbedError(msg)
      toast.error(msg)
    } finally {
      setEmbedRunning(false)
    }
  }

  async function runGenerate() {
    if (!genInput.trim()) {
      toast.error("Enter a prompt")
      return
    }
    setGenRunning(true)
    setGenError(null)
    setGenResult(null)
    const t0 = performance.now()
    try {
      const output = await generate(genInput)
      setGenResult({
        prompt: genInput,
        output,
        latencyMs: Math.round(performance.now() - t0),
      })
      toast.success("Generation OK")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setGenError(msg)
      toast.error(msg)
    } finally {
      setGenRunning(false)
    }
  }

  async function handleEmbedAll() {
    if (!db) {
      toast.error("Database not ready yet")
      return
    }
    setEmbedding(true)
    const toastId = toast.loading("Embedding chunks…")
    try {
      const result = await embedMissingChunks(db, (p) => {
        toast.loading(`Embedding ${p.done}/${p.total}…`, { id: toastId })
      })
      if (result.embedded === 0) {
        toast.success("All chunks already embedded", { id: toastId })
      } else {
        toast.success(`Embedded ${result.embedded} chunks`, { id: toastId })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err), { id: toastId })
    } finally {
      setEmbedding(false)
    }
  }

  async function handleReembedAll() {
    if (!db) {
      toast.error("Database not ready yet")
      return
    }
    if (
      !confirm(
        "Clear every chunk embedding and re-embed from scratch using the current model? This may take a minute.",
      )
    ) {
      return
    }
    setEmbedding(true)
    const toastId = toast.loading("Clearing embeddings…")
    try {
      const cleared = clearAllEmbeddings(db)
      toast.loading(`Cleared ${cleared} vectors. Re-embedding…`, { id: toastId })
      const result = await embedMissingChunks(db, (p) => {
        toast.loading(`Embedding ${p.done}/${p.total}…`, { id: toastId })
      })
      toast.success(`Re-embedded ${result.embedded} chunks`, { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err), { id: toastId })
    } finally {
      setEmbedding(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-base font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Demo controls and integrations
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Toggle light and dark mode</CardDescription>
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
        <CardHeader>
          <CardTitle className="text-base">AI configuration</CardTitle>
          <CardDescription>
            Models in use. Change in <code>src/ai/gemini.ts</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ConfigRow label="Embedding model" value={EMBEDDING_MODEL} />
          <ConfigRow label="Embedding dim" value={String(EMBEDDING_DIM)} />
          <ConfigRow label="Generative model" value={CHAT_MODEL} />
          <ConfigRow
            label="API key"
            value={hasApiKey() ? "Configured" : "Missing"}
            ok={hasApiKey()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Google Gemini API key</CardTitle>
          <CardDescription>
            Required for embedding and Q&A. Stored in localStorage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">API key</Label>
            <Input
              id="gemini-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={saveKey}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Test embedding model{" "}
            <Badge variant="outline" className="ml-1 font-mono text-[10px]">
              {EMBEDDING_MODEL}
            </Badge>
          </CardTitle>
          <CardDescription>
            Sends one string to <code>embedContent</code>. Verifies the API
            key, model name, and output dimension.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={embedInput}
            onChange={(e) => setEmbedInput(e.target.value)}
            rows={3}
            placeholder="Text to embed"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={runEmbed} disabled={embedRunning}>
              {embedRunning ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Running…
                </>
              ) : (
                "Run embedding"
              )}
            </Button>
            {embedResult && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                OK · {embedResult.dim} dim · {embedResult.latencyMs} ms
              </span>
            )}
            {embedError && (
              <span className="inline-flex items-center gap-1 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                Failed
              </span>
            )}
          </div>

          {embedError && (
            <pre className="overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {embedError}
            </pre>
          )}

          {embedResult && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">Dim:</strong>{" "}
                  {embedResult.dim}
                </span>
                <span>
                  <strong className="text-foreground">Latency:</strong>{" "}
                  {embedResult.latencyMs} ms
                </span>
                <span>
                  <strong className="text-foreground">Norm:</strong>{" "}
                  {l2Norm(embedResult.vector).toFixed(4)}
                </span>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Vector preview{" "}
                    {showFullVector
                      ? `(all ${embedResult.dim})`
                      : "(first 8)"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setShowFullVector((v) => !v)}
                  >
                    {showFullVector ? "Show less" : "Show all"}
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto rounded-md bg-background p-2 font-mono text-[11px] leading-tight">
                  {formatVector(
                    embedResult.vector,
                    showFullVector ? embedResult.vector.length : 8,
                  )}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Test generative model{" "}
            <Badge variant="outline" className="ml-1 font-mono text-[10px]">
              {CHAT_MODEL}
            </Badge>
          </CardTitle>
          <CardDescription>
            Sends one prompt to <code>generateContent</code>. Verifies chat
            completion independent of the RAG retrieval pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={genInput}
            onChange={(e) => setGenInput(e.target.value)}
            rows={3}
            placeholder="Prompt"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={runGenerate} disabled={genRunning}>
              {genRunning ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                "Run generation"
              )}
            </Button>
            {genResult && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                OK · {genResult.latencyMs} ms · {genResult.output.length} chars
              </span>
            )}
            {genError && (
              <span className="inline-flex items-center gap-1 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                Failed
              </span>
            )}
          </div>

          {genError && (
            <pre className="overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {genError}
            </pre>
          )}

          {genResult && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Response
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {genResult.output}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chunk embeddings</CardTitle>
          <CardDescription>
            Backfill or rebuild the vectors used by Ask IDA's retrieval.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEmbedAll}
            disabled={embedding}
          >
            {embedding ? "Working…" : "Embed missing chunks"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReembedAll}
            disabled={embedding}
          >
            Re-embed all (clear + rebuild)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convex backend</CardTitle>
          <CardDescription>
            Server-side data on the dev deployment. Seed once, then user-created
            documents persist across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5 text-sm">
            <ConfigRow
              label="Seed version"
              value={
                seedStatus === undefined
                  ? "…"
                  : seedStatus.seedVersion === null
                    ? "Not seeded"
                    : String(seedStatus.seedVersion)
              }
              ok={
                seedStatus === undefined
                  ? undefined
                  : seedStatus.seedVersion !== null
              }
            />
            <ConfigRow
              label="Has documents"
              value={
                seedStatus === undefined
                  ? "…"
                  : seedStatus.hasDocs
                    ? "Yes"
                    : "No"
              }
              ok={
                seedStatus === undefined ? undefined : seedStatus.hasDocs
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleConvexSeed}
              disabled={seeding}
            >
              {seeding ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Seeding…
                </>
              ) : (
                "Seed demo data to Convex"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo data (legacy sql.js)</CardTitle>
          <CardDescription>
            Reset the local sql.js seed. All in-browser edits are lost. Does not
            touch the Convex backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" onClick={handleReset}>
            Reset local demo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ConfigRow({
  label,
  value,
  ok,
}: {
  label: string
  value: string
  ok?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          ok === false
            ? "font-mono text-xs text-destructive"
            : ok === true
              ? "font-mono text-xs text-emerald-600"
              : "font-mono text-xs"
        }
      >
        {value}
      </span>
    </div>
  )
}

function l2Norm(v: number[]): number {
  let s = 0
  for (const x of v) s += x * x
  return Math.sqrt(s)
}

function formatVector(v: number[], n: number): string {
  const slice = v.slice(0, n).map((x) => x.toFixed(6))
  const truncated = n < v.length
  return `[\n  ${slice.join(",\n  ")}${truncated ? `,\n  … (${v.length - n} more)` : ""}\n]`
}
