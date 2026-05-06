// Mobile-only client preferences (recently viewed, pinned, online).
// All persisted in localStorage so it carries across reloads but never leaves
// the browser.

import { useCallback, useEffect, useState } from "react"

const RECENT_KEY = "oppr-docs:m:recent"
const PINNED_KEY = "oppr-docs:m:pinned"
const RECENT_LIMIT = 5

export type EntityKind = "doc" | "asset"
export interface RecentEntry {
  kind: EntityKind
  id: string
  label: string // human-readable name shown on cards
  sublabel?: string // naming code, location, etc.
  visited_at: string
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
} {
  const [recent, setRecent] = useState<RecentEntry[]>(() =>
    readJson<RecentEntry[]>(RECENT_KEY, []),
  )

  // Re-read when storage changes in another tab.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === RECENT_KEY) {
        setRecent(readJson<RecentEntry[]>(RECENT_KEY, []))
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const pushRecent = useCallback(
    (entry: Omit<RecentEntry, "visited_at">) => {
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

  return { recent, pushRecent, clearRecent }
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
} {
  const [pinned, setPinned] = useState<PinnedEntry[]>(() =>
    readJson<PinnedEntry[]>(PINNED_KEY, []),
  )

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === PINNED_KEY) {
        setPinned(readJson<PinnedEntry[]>(PINNED_KEY, []))
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

  return { pinned, isPinned, togglePin }
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
