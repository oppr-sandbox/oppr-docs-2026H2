// Mobile-only client preferences (recently viewed, pinned, online, chat-size).
// All persisted in localStorage so it carries across reloads but never leaves
// the browser.

import { useCallback, useEffect, useState } from "react"

const RECENT_KEY = "oppr-docs:m:recent"
const PINNED_KEY = "oppr-docs:m:pinned"
const CHAT_SIZE_KEY = "oppr-docs:m:chat-size"
const RECENT_LIMIT = 5

export type EntityKind = "doc" | "asset"
export interface RecentEntry {
  kind: EntityKind
  id: string
  label: string // human-readable name shown on cards
  sublabel?: string // naming code, location, etc.
  visited_at: string
}

// Convex IDs are opaque 20+ char strings of [a-z0-9]. The legacy showcase used
// human-readable ids like "doc-1" which crash Convex's v.id() validator on
// every read. Filter at the boundary so stale localStorage from before the
// Convex migration can never reach a server query.
export function looksLikeConvexId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9]{20,}$/i.test(id)
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota / private mode — ignore
  }
}

// --- Recently viewed --------------------------------------------------------

export function useRecentlyViewed(): {
  recent: RecentEntry[]
  pushRecent: (entry: Omit<RecentEntry, "visited_at">) => void
  clearRecent: () => void
  removeRecent: (kind: EntityKind, id: string) => void
} {
  const [recent, setRecent] = useState<RecentEntry[]>(() => {
    const raw = readJson<RecentEntry[]>(RECENT_KEY, [])
    const clean = raw.filter((r) => looksLikeConvexId(r.id))
    if (clean.length !== raw.length) writeJson(RECENT_KEY, clean)
    return clean
  })

  // Re-read when storage changes in another tab.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === RECENT_KEY) {
        const raw = readJson<RecentEntry[]>(RECENT_KEY, [])
        setRecent(raw.filter((r) => looksLikeConvexId(r.id)))
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const pushRecent = useCallback(
    (entry: Omit<RecentEntry, "visited_at">) => {
      if (!looksLikeConvexId(entry.id)) return
      setRecent((prev) => {
        const next: RecentEntry[] = [
          { ...entry, visited_at: new Date().toISOString() },
          ...prev.filter((r) => !(r.kind === entry.kind && r.id === entry.id)),
        ].slice(0, RECENT_LIMIT)
        writeJson(RECENT_KEY, next)
        return next
      })
    },
    [],
  )

  const clearRecent = useCallback(() => {
    writeJson(RECENT_KEY, [])
    setRecent([])
  }, [])

  const removeRecent = useCallback((kind: EntityKind, id: string) => {
    setRecent((prev) => {
      const next = prev.filter((r) => !(r.kind === kind && r.id === id))
      writeJson(RECENT_KEY, next)
      return next
    })
  }, [])

  return { recent, pushRecent, clearRecent, removeRecent }
}

// --- Pinned -----------------------------------------------------------------

export interface PinnedEntry {
  kind: EntityKind
  id: string
  label: string
  sublabel?: string
}

export function usePinned(): {
  pinned: PinnedEntry[]
  isPinned: (kind: EntityKind, id: string) => boolean
  togglePin: (entry: PinnedEntry) => void
  removePin: (kind: EntityKind, id: string) => void
} {
  const [pinned, setPinned] = useState<PinnedEntry[]>(() => {
    const raw = readJson<PinnedEntry[]>(PINNED_KEY, [])
    const clean = raw.filter((p) => looksLikeConvexId(p.id))
    if (clean.length !== raw.length) writeJson(PINNED_KEY, clean)
    return clean
  })

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === PINNED_KEY) {
        const raw = readJson<PinnedEntry[]>(PINNED_KEY, [])
        setPinned(raw.filter((p) => looksLikeConvexId(p.id)))
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const isPinned = useCallback(
    (kind: EntityKind, id: string) =>
      pinned.some((p) => p.kind === kind && p.id === id),
    [pinned],
  )

  const togglePin = useCallback((entry: PinnedEntry) => {
    if (!looksLikeConvexId(entry.id)) return
    setPinned((prev) => {
      const exists = prev.some(
        (p) => p.kind === entry.kind && p.id === entry.id,
      )
      const next = exists
        ? prev.filter((p) => !(p.kind === entry.kind && p.id === entry.id))
        : [...prev, entry]
      writeJson(PINNED_KEY, next)
      return next
    })
  }, [])

  const removePin = useCallback((kind: EntityKind, id: string) => {
    setPinned((prev) => {
      const next = prev.filter((p) => !(p.kind === kind && p.id === id))
      writeJson(PINNED_KEY, next)
      return next
    })
  }, [])

  return { pinned, isPinned, togglePin, removePin }
}

// --- Chat font size --------------------------------------------------------

export type ChatSize = "sm" | "md" | "lg"

const CHAT_SIZE_DEFAULT: ChatSize = "sm"

function readChatSize(): ChatSize {
  if (typeof window === "undefined") return CHAT_SIZE_DEFAULT
  const v = window.localStorage.getItem(CHAT_SIZE_KEY)
  if (v === "sm" || v === "md" || v === "lg") return v
  return CHAT_SIZE_DEFAULT
}

export function useChatSize(): {
  size: ChatSize
  setSize: (s: ChatSize) => void
} {
  const [size, setSizeState] = useState<ChatSize>(() => readChatSize())
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === CHAT_SIZE_KEY) setSizeState(readChatSize())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])
  const setSize = useCallback((s: ChatSize) => {
    setSizeState(s)
    if (typeof window !== "undefined")
      window.localStorage.setItem(CHAT_SIZE_KEY, s)
  }, [])
  return { size, setSize }
}

// --- Online status ----------------------------------------------------------

export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  )
  useEffect(() => {
    function up() {
      setOnline(true)
    }
    function down() {
      setOnline(false)
    }
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])
  return online
}
