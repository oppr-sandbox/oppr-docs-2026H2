// Reusable Q&A chat panel — wraps the AI/RAG layer with persisted sessions.
//
// The panel is the single chat surface across desktop and mobile. It owns:
//   • Scope chip header — switch between Library / Document / Asset live.
//   • Markdown-rendered messages with inline [N] citation anchors and
//     auto-linked entity codes (HOL-OPS-SOP-0001 / RMR-101 / HOL-OPS-LOG-0001).
//   • Citation pills with hover preview + "Open at this location" deep link.
//   • A "Related" rail under each assistant turn (other docs, assets, logs)
//     populated by pure DB joins from the cited document set.
//   • Per-message actions: Copy, Regenerate, Stop (during stream).
//   • Persisted sessions for every scope, including library.
//
// The askQuestion() generator is consumed with a per-stream AbortController
// so the user can cancel mid-response.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Link, useLocation } from "wouter"
import {
  Copy,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Square,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import type { Asset, AssetLog, Citation, Doc, QaMessage } from "@/types"
import { useDb, useDbWatcher } from "@/db/DbProvider"
import {
  addMessage,
  createSession,
  deleteMessages,
  getSession,
  listMessages,
  listSessions,
  popLastTurn,
  type SessionScope,
} from "@/db/repositories/qa"
import { listMissing } from "@/db/repositories/embeddings"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  askQuestion,
  buildRelatedRail,
  embedMissingChunks,
  hasApiKey,
  type RelatedRail as RelatedRailData,
} from "@/ai"
import { LogReferenceModal } from "@/components/docs/LogReferenceModal"
import { MessageContent } from "./MessageContent"
import { SourcesBlock } from "./SourcesBlock"
import { RelatedRail } from "./RelatedRail"
import { StarterPrompts } from "./StarterPrompts"
import { ScopeChip } from "./ScopeChip"
import { ClearChatDialog } from "./ClearChatDialog"

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionEvent {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

export type AskPanelScope =
  | { kind: "doc"; id: string }
  | { kind: "asset"; id: string }
  | { kind: "library" }

export interface AskPanelProps {
  scope: AskPanelScope
  /** When true, allow the user to swap scope from the chip. Default true. */
  allowScopeSwitch?: boolean
  /** Called when the user picks a different scope from the chip. */
  onScopeChange?: (next: AskPanelScope) => void
  compact?: boolean
  sessionId?: string
  /**
   * Called when a citation is opened. Hosts that already have the document
   * open (the reader page) can scroll-and-highlight; otherwise the panel
   * navigates to /docs/:id?page=N or /m/docs/:id?page=N.
   */
  onCitationClick?: (citation: Citation) => void
  className?: string
}

export function AskPanel({
  scope: scopeProp,
  allowScopeSwitch = true,
  onScopeChange,
  compact = false,
  sessionId: sessionIdProp,
  onCitationClick,
  className,
}: AskPanelProps) {
  const { db, ready } = useDb()
  const dbVersion = useDbWatcher()
  const [, navigate] = useLocation()

  // Local scope state so the chip can drive changes without a parent.
  const [scope, setScope] = useState<AskPanelScope>(scopeProp)
  useEffect(() => setScope(scopeProp), [scopeProp])

  const [sessionId, setSessionId] = useState<string | null>(sessionIdProp ?? null)
  const [messages, setMessages] = useState<QaMessage[]>([])
  const [clearOpen, setClearOpen] = useState(false)
  const [input, setInput] = useState("")
  const [pending, setPending] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [embedProgress, setEmbedProgress] = useState<{ done: number; total: number } | null>(null)
  const [activeLog, setActiveLog] = useState<AssetLog | null>(null)
  const apiKeyConfigured = hasApiKey()

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scopeKey =
    scope.kind === "library" ? "library" : `${scope.kind}:${scope.id}`

  // Resolve the existing session for the current scope, if any. We do NOT
  // create one here — that's deferred to the first `send()` so opening Ask
  // and bailing doesn't litter the DB with empty session rows.
  useEffect(() => {
    if (!db || !ready) return
    if (sessionIdProp) {
      const s = getSession(db, sessionIdProp)
      if (s) {
        setSessionId(s.id)
        setMessages(listMessages(db, s.id))
        return
      }
    }
    const filter =
      scope.kind === "library"
        ? { scope_kind: "library" as const, scope_id: "library" }
        : { scope_kind: scope.kind, scope_id: scope.id }
    const existing = listSessions(db, filter)
    if (existing.length) {
      setSessionId(existing[0].id)
      setMessages(listMessages(db, existing[0].id))
    } else {
      setSessionId(null)
      setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready, scopeKey, sessionIdProp])

  /** Lazy session creator. Returns the session id, creating the row if needed. */
  function ensureSession(): string | null {
    if (!db) return null
    if (sessionId) return sessionId
    const sessionScope: SessionScope =
      scope.kind === "library" ? { kind: "library" } : scope
    const created = createSession(db, sessionScope)
    setSessionId(created.id)
    return created.id
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streamingText, pending])

  const refreshMessages = useCallback(() => {
    if (!db || !sessionId) return
    setMessages(listMessages(db, sessionId))
  }, [db, sessionId])

  useEffect(() => {
    if (!pending) refreshMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbVersion])

  function handleScopeChange(next: AskPanelScope) {
    if (next.kind === scope.kind) {
      if (next.kind === "library") return
      if ("id" in next && "id" in scope && next.id === scope.id) return
    }
    // Cancel any in-flight stream so its tokens can't land in the new
    // session as if they belonged there. Without this, a slow library
    // answer could write into a doc-scoped chat after the operator
    // switches scope.
    abortRef.current?.abort()
    abortRef.current = null
    setStreamingText("")
    setPending(false)
    setScope(next)
    onScopeChange?.(next)
  }

  function handleClearChat() {
    // Empty session: skip the confirmation, just reset local state.
    if (!db || !sessionId || messages.length === 0) {
      abortRef.current?.abort()
      abortRef.current = null
      setStreamingText("")
      setPending(false)
      setMessages([])
      return
    }
    setClearOpen(true)
  }

  function handleClearConfirm() {
    if (!db || !sessionId) {
      setMessages([])
      setClearOpen(false)
      return
    }
    abortRef.current?.abort()
    abortRef.current = null
    setStreamingText("")
    setPending(false)
    deleteMessages(db, sessionId)
    setMessages([])
    setClearOpen(false)
  }

  // Default citation handler — navigate to the doc with optional page deep
  // link. Hosts can pass `onCitationClick` to override (e.g., the reader
  // page scrolls inside the open doc instead of navigating).
  const handleCitationOpen = useCallback(
    (citation: Citation, page: number | null) => {
      if (onCitationClick) {
        onCitationClick(citation)
        return
      }
      const isMobile =
        typeof window !== "undefined" && window.location.pathname.startsWith("/m")
      const base = isMobile ? `/m/docs/${citation.document_id}` : `/docs/${citation.document_id}`
      const qs = page != null ? `?page=${page}` : ""
      navigate(base + qs)
    },
    [navigate, onCitationClick],
  )

  function scrollToCitation(messageId: string, n: number) {
    const el = document.getElementById(`citation-${messageId}-${n}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    el.classList.add("ring-2", "ring-primary")
    setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1200)
  }

  async function send(question: string) {
    if (!db) return
    if (!question.trim() || pending) return
    if (!apiKeyConfigured) {
      toast.error("Add your Gemini API key in Settings first.")
      return
    }

    // Lazy-create the session row only when we actually have a question to
    // send. Capture the resolved id once so concurrent setSessionId calls
    // don't race the rest of this function.
    const activeSessionId = ensureSession()
    if (!activeSessionId) return

    setInput("")
    setPending(true)
    setStreamingText("")
    const ac = new AbortController()
    abortRef.current = ac

    addMessage(db, { session_id: activeSessionId, role: "user", text: question })
    refreshMessages()

    try {
      const missing = listMissing(db)
      if (missing.length > 0) {
        const toastId = toast.loading(`Computing embeddings for ${missing.length} excerpts…`)
        try {
          await embedMissingChunks(db, (p) => {
            setEmbedProgress(p)
            toast.loading(`Computing embeddings ${p.done}/${p.total}…`, { id: toastId })
          })
          toast.success("Embeddings ready", { id: toastId })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Embedding failed", { id: toastId })
          setPending(false)
          setEmbedProgress(null)
          return
        } finally {
          setEmbedProgress(null)
        }
      }

      // Replay history — exclude the user message we just persisted; the
      // generator adds it back as the final turn. Error/(stopped) turns are
      // additionally filtered inside askQuestion before they hit the model.
      const priorHistory = listMessages(db, activeSessionId).slice(0, -1)
      let accumulated = ""
      let finalCitations: Citation[] | null = null
      for await (const ev of askQuestion(
        db,
        scope,
        question,
        priorHistory,
        { signal: ac.signal },
      )) {
        if (ev.delta) {
          accumulated += ev.delta
          setStreamingText(accumulated)
        }
        if (ev.done) finalCitations = ev.citations ?? null
      }

      const stoppedMidStream = ac.signal.aborted

      // Don't persist a noisy turn if the user stopped before any text
      // arrived — clean cancel. Same for empty (no response) when the
      // backend yielded nothing useful.
      if (!accumulated && stoppedMidStream) {
        setStreamingText("")
        return
      }

      const text = accumulated || "(no response)"
      addMessage(db, {
        session_id: activeSessionId,
        role: "assistant",
        text,
        citations: finalCitations,
      })
      refreshMessages()
      setStreamingText("")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Q&A failed: ${msg}`)
      try {
        addMessage(db, {
          session_id: activeSessionId,
          role: "assistant",
          text: `Error: ${msg}`,
        })
      } catch {
        // best-effort
      }
      refreshMessages()
      setStreamingText("")
    } finally {
      setPending(false)
      // Only clear abortRef if it still points at the AC we made — a scope
      // change may have replaced it with null mid-flight.
      if (abortRef.current === ac) abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleRegenerate() {
    if (pending || !db || !sessionId) return
    // Pop the trailing user→assistant pair so send() can re-add the user
    // question once and produce a fresh assistant response — avoids
    // duplicate user turns stacking up after multiple regenerates.
    const previousQuestion = popLastTurn(db, sessionId)
    refreshMessages()
    if (!previousQuestion) return
    void send(previousQuestion)
  }

  // Voice input -----------------------------------------------------------

  const speechCtor: SpeechRecognitionCtor | undefined =
    typeof window === "undefined"
      ? undefined
      : (window as unknown as Record<string, SpeechRecognitionCtor | undefined>).SpeechRecognition ??
        (window as unknown as Record<string, SpeechRecognitionCtor | undefined>).webkitSpeechRecognition
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [listening, setListening] = useState(false)

  const handleMic = useCallback(() => {
    if (!speechCtor) {
      toast.message("Voice input is not supported in this browser.")
      return
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    const rec = new speechCtor()
    rec.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US"
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (event) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)
    }
    rec.onerror = (event) => {
      const code = event?.error ?? "error"
      if (code !== "aborted") toast.error(`Voice input failed: ${code}`)
    }
    rec.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    try {
      rec.start()
      recognitionRef.current = rec
      setListening(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Voice input failed")
    }
  }, [listening, speechCtor])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // already stopped
        }
      }
      abortRef.current?.abort()
    }
  }, [])

  // ----------------------------------------------------------------------

  const visibleMessages = useMemo(() => {
    if (!streamingText) return messages
    return [
      ...messages,
      {
        id: "__streaming__",
        session_id: sessionId ?? "",
        role: "assistant" as const,
        text: streamingText,
        citations: null,
        created_at: new Date().toISOString(),
      } satisfies QaMessage,
    ]
  }, [messages, sessionId, streamingText])

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-md border bg-card text-card-foreground",
        compact ? "" : "shadow-sm",
        className,
      )}
    >
      <header className="space-y-1.5 border-b px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Ask IDA</h2>
          <div className="flex items-center gap-2">
            {embedProgress && embedProgress.total > 0 && (
              <span className="text-[10px] text-muted-foreground">
                Indexing {embedProgress.done}/{embedProgress.total}
              </span>
            )}
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                onClick={handleClearChat}
                title="Clear conversation"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allowScopeSwitch ? (
            <ScopeChip scope={scope} onChange={handleScopeChange} />
          ) : (
            <ScopeChip scope={scope} onChange={() => {}} />
          )}
        </div>
      </header>

      {!apiKeyConfigured && (
        <div className="border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Add your Gemini API key in{" "}
          <Link
            href="/settings"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Settings
          </Link>{" "}
          to enable Q&A.
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3",
          compact ? "text-sm" : "text-sm",
        )}
      >
        {visibleMessages.length === 0 && !pending && (
          <StarterPrompts scope={scope} onPick={(p) => void send(p)} />
        )}
        {visibleMessages.map((m, i) => (
          <MessageBlock
            key={m.id}
            message={m}
            scope={scope}
            isLast={i === visibleMessages.length - 1}
            streaming={m.id === "__streaming__"}
            onCitationOpen={handleCitationOpen}
            onCitationAnchor={(n) => scrollToCitation(m.id, n)}
            onCodeNavigate={(entry) => {
              if (entry.kind === "log") {
                // We have asset id (entry.id) but need the full log row.
                // Cheapest path: synthesize from what we know.
                setActiveLog({
                  asset_id: entry.id,
                  code: entry.code,
                  name: entry.label,
                  description: null,
                })
                return
              }
              const path =
                entry.kind === "asset"
                  ? `/assets/${entry.id}`
                  : `/docs/${entry.id}`
              const isMobile =
                typeof window !== "undefined" && window.location.pathname.startsWith("/m")
              navigate(isMobile ? `/m${path}` : path)
            }}
            onAssetNavigate={(a) => {
              const isMobile =
                typeof window !== "undefined" && window.location.pathname.startsWith("/m")
              navigate(isMobile ? `/m/assets/${a.id}` : `/assets/${a.id}`)
            }}
            onDocNavigate={(d) => {
              const isMobile =
                typeof window !== "undefined" && window.location.pathname.startsWith("/m")
              navigate(isMobile ? `/m/docs/${d.id}` : `/docs/${d.id}`)
            }}
            onLogClick={(l) => setActiveLog(l)}
            onCopy={() => {
              navigator.clipboard
                .writeText(m.text)
                .then(() => toast.success("Copied"))
                .catch(() => toast.error("Copy failed"))
            }}
            onRegenerate={handleRegenerate}
            pending={pending}
          />
        ))}
        {pending && !streamingText && (
          <div className="text-xs italic text-muted-foreground">Thinking…</div>
        )}
      </div>

      <div className="border-t p-2">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send(input)
              }
            }}
            placeholder="Ask a question…"
            disabled={pending}
            className={cn("resize-none", compact ? "min-h-[48px]" : "min-h-[60px]")}
          />
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="icon"
              variant={listening ? "default" : "outline"}
              onClick={handleMic}
              disabled={pending}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              className={cn(listening && "animate-pulse")}
            >
              {listening ? <MicOff /> : <Mic />}
            </Button>
            {pending ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={handleStop}
                aria-label="Stop generating"
              >
                <Square />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={() => void send(input)}
                disabled={!input.trim()}
                aria-label="Send"
              >
                <Send />
              </Button>
            )}
          </div>
        </div>
      </div>

      <LogReferenceModal
        log={activeLog}
        open={!!activeLog}
        onOpenChange={(o) => !o && setActiveLog(null)}
      />

      <ClearChatDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        onConfirm={handleClearConfirm}
        scope={scope}
        messageCount={messages.length}
      />
    </div>
  )
}

// --- Per-message block ------------------------------------------------------

interface MessageBlockProps {
  message: QaMessage
  scope: AskPanelScope
  isLast: boolean
  streaming: boolean
  onCitationOpen: (c: Citation, page: number | null) => void
  onCitationAnchor: (n: number) => void
  onCodeNavigate: (entry: import("./useCodeIndex").CodeEntry) => void
  onAssetNavigate: (a: Asset) => void
  onDocNavigate: (d: Doc) => void
  onLogClick: (l: AssetLog) => void
  onCopy: () => void
  onRegenerate: () => void
  pending: boolean
}

function MessageBlock({
  message,
  scope,
  isLast,
  streaming,
  onCitationOpen,
  onCitationAnchor,
  onCodeNavigate,
  onAssetNavigate,
  onDocNavigate,
  onLogClick,
  onCopy,
  onRegenerate,
  pending,
}: MessageBlockProps) {
  const { db } = useDb()
  const dbVersion = useDbWatcher()
  const isUser = message.role === "user"

  // Build the related rail from the cited document set.
  const related: RelatedRailData = useMemo(() => {
    if (!db || !message.citations || message.citations.length === 0) {
      return { otherDocs: [], assets: [], logs: [] }
    }
    const ids = Array.from(new Set(message.citations.map((c) => c.document_id)))
    return buildRelatedRail(db, ids, scope)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, message.citations, scope, dbVersion])

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] space-y-2.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
        <MessageContent
          text={message.text}
          streaming={streaming}
          onCitationClick={onCitationAnchor}
          onCodeClick={onCodeNavigate}
          citationCount={message.citations?.length ?? 0}
        />

        {message.citations && message.citations.length > 0 && (
          <SourcesBlock
            citations={message.citations}
            domIdPrefix={`citation-${message.id}`}
            onOpen={onCitationOpen}
          />
        )}

        {!streaming &&
          message.citations &&
          message.citations.length > 0 && (
            <RelatedRail
              data={related}
              // Hide on doc/asset scope — the operator is already on the
              // entity, "more like this" feels like noise. In library
              // scope it's the only way to discover related docs.
              hidden={scope.kind !== "library"}
              onDocClick={onDocNavigate}
              onAssetClick={onAssetNavigate}
              onLogClick={onLogClick}
            />
          )}

        {!streaming && (
          <div className="flex items-center gap-1 pt-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={onCopy}
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
            {isLast && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-[11px]"
                onClick={onRegenerate}
                disabled={pending}
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
