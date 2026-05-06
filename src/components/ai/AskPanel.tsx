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
import { useLocation } from "wouter"
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
import { useMutation, useQuery } from "convex/react"
import { useAuthToken } from "@convex-dev/auth/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import {
  toLegacyCitation,
  toLegacyQaMessage,
} from "@/lib/convex-adapters"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { LogReferenceModal } from "@/components/docs/LogReferenceModal"
import { MessageContent } from "./MessageContent"
import { SourcesBlock } from "./SourcesBlock"
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
  const [, navigate] = useLocation()

  const [scope, setScope] = useState<AskPanelScope>(scopeProp)
  useEffect(() => setScope(scopeProp), [scopeProp])

  const [clearOpen, setClearOpen] = useState(false)
  const [input, setInput] = useState("")
  const [pending, setPending] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [activeLog, setActiveLog] = useState<AssetLog | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const authToken = useAuthToken()

  const scopeKindArg = scope.kind
  const scopeIdArg = scope.kind === "library" ? "library" : scope.id

  const sessionsList = useQuery(api.qa.listSessions, {
    scopeKind: scopeKindArg,
    scopeId: scopeIdArg,
  })
  const sessionId =
    sessionIdProp ?? sessionsList?.[0]?._id ?? null

  const messagesRaw = useQuery(
    api.qa.listMessages,
    sessionId ? { sessionId: sessionId as Id<"qaSessions"> } : "skip",
  )
  const messages: QaMessage[] = useMemo(
    () => (messagesRaw ? messagesRaw.map(toLegacyQaMessage) : []),
    [messagesRaw],
  )

  const ensureSession = useMutation(api.qa.ensureSession)
  const addMessage = useMutation(api.qa.addMessage)
  const deleteMessages = useMutation(api.qa.deleteMessages)
  const popLastTurn = useMutation(api.qa.popLastTurn)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending, streamingText])

  function handleScopeChange(next: AskPanelScope) {
    if (next.kind === scope.kind) {
      if (next.kind === "library") return
      if ("id" in next && "id" in scope && next.id === scope.id) return
    }
    abortRef.current?.abort()
    abortRef.current = null
    setStreamingText("")
    setPending(false)
    setScope(next)
    onScopeChange?.(next)
  }

  function handleClearChat() {
    if (!sessionId || messages.length === 0) {
      abortRef.current?.abort()
      abortRef.current = null
      setStreamingText("")
      setPending(false)
      return
    }
    setClearOpen(true)
  }

  async function handleClearConfirm() {
    if (sessionId) {
      try {
        await deleteMessages({ sessionId: sessionId as Id<"qaSessions"> })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to clear chat",
        )
      }
    }
    abortRef.current?.abort()
    abortRef.current = null
    setStreamingText("")
    setPending(false)
    setClearOpen(false)
  }

  function handleStop() {
    abortRef.current?.abort()
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
    if (!question.trim() || pending) return
    if (!authToken) {
      toast.error("Not signed in.")
      return
    }
    const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL as
      | string
      | undefined
    if (!siteUrl) {
      toast.error("VITE_CONVEX_SITE_URL is not configured.")
      return
    }

    setInput("")
    setPending(true)
    setStreamingText("")

    const ac = new AbortController()
    abortRef.current = ac

    let activeSessionId: Id<"qaSessions">
    try {
      activeSessionId = await ensureSession({
        scopeKind: scopeKindArg,
        scopeId: scopeIdArg,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start chat")
      setPending(false)
      return
    }

    try {
      await addMessage({
        sessionId: activeSessionId,
        role: "user",
        text: question,
        citations: null,
      })

      const history = messages.map((m) => ({ role: m.role, text: m.text }))
      const askScope =
        scope.kind === "library"
          ? { kind: "library" as const }
          : scope.kind === "doc"
            ? { kind: "doc" as const, id: scope.id }
            : { kind: "asset" as const, id: scope.id }

      const res = await fetch(`${siteUrl}/ai/askStream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ scope: askScope, question, history }),
        signal: ac.signal,
      })
      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => "")
        throw new Error(`Stream failed: ${res.status} ${body.slice(0, 200)}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulated = ""
      let finalCitations: Citation[] | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let nl: number
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          if (!line) continue
          let event: { type: string; text?: string; citations?: unknown[]; message?: string }
          try {
            event = JSON.parse(line)
          } catch {
            continue
          }
          if (event.type === "delta" && typeof event.text === "string") {
            accumulated += event.text
            setStreamingText(accumulated)
          } else if (event.type === "done") {
            const raw = (event.citations ?? []) as Array<{
              documentId: string
              documentTitle: string
              chunkId: string
              pageOrSection: string | null
              excerpt: string
              origin: "asset-link" | "cross-link" | "log"
            }>
            finalCitations = raw.map(toLegacyCitation)
          } else if (event.type === "error") {
            throw new Error(event.message ?? "Stream error")
          }
        }
      }

      const stopped = ac.signal.aborted
      if (!accumulated && stopped) {
        setStreamingText("")
        return
      }

      const text = accumulated || "(no response)"
      const citationsForStorage = (finalCitations ?? []).map((c) => ({
        documentId: c.document_id as Id<"documents">,
        documentTitle: c.document_title,
        chunkId: c.chunk_id as Id<"chunks">,
        pageOrSection: c.page_or_section,
        excerpt: c.excerpt,
        origin: c.origin,
      }))
      await addMessage({
        sessionId: activeSessionId,
        role: "assistant",
        text,
        citations: citationsForStorage.length ? citationsForStorage : null,
      })
      setStreamingText("")
    } catch (err) {
      if (ac.signal.aborted) {
        setStreamingText("")
        return
      }
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Q&A failed: ${msg}`)
      try {
        await addMessage({
          sessionId: activeSessionId,
          role: "assistant",
          text: `Error: ${msg}`,
          citations: null,
        })
      } catch {
        // best-effort
      }
      setStreamingText("")
    } finally {
      setPending(false)
      if (abortRef.current === ac) abortRef.current = null
    }
  }

  function handleRegenerate() {
    if (pending || !sessionId) return
    void (async () => {
      const previous = await popLastTurn({
        sessionId: sessionId as Id<"qaSessions">,
      })
      if (!previous) return
      void send(previous)
    })()
  }

  // Suppress unused-warning for legacy adapter (citations reused in messages)
  void toLegacyCitation

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

  const visibleMessages = useMemo<QaMessage[]>(() => {
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
      },
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
  isLast,
  streaming,
  onCitationOpen,
  onCitationAnchor,
  onCodeNavigate,
  onCopy,
  onRegenerate,
  pending,
}: MessageBlockProps) {
  const isUser = message.role === "user"

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
