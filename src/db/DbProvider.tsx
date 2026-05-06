// Real DB context provider, backed by sqlite.ts.
//
// Behavior:
// - On mount: triggers `getDb()`. While that promise resolves, `ready=false`.
// - When ready, exposes the live `Database` handle to consumers via `useDb()`.
// - Subscribes to a `BroadcastChannel('oppr-docs')` so when another tab persists,
//   this tab reloads its in-memory DB from IndexedDB and bumps `version` so
//   consumers using `useDbWatcher()` re-render with fresh data.
// - Posts to the same channel after every successful local persist so other
//   tabs (e.g. a desktop window when the mobile route is open) stay current.
// - `reset()` clears IndexedDB, reseeds, and broadcasts.
//
// Tradeoff: cross-tab reload drops any in-flight unsaved edits in the receiving
// tab. PRD §13 marks this as "reload-to-refresh is acceptable v1".

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Database } from "sql.js"
import { toast } from "sonner"
import {
  getDb,
  onPersisted,
  reloadFromStorage,
  reset as engineReset,
} from "./sqlite"
import { getStoredSeedVersion, SEED_VERSION } from "./seed"

const CHANNEL_NAME = "oppr-docs"
const REMOTE_PERSIST_EVENT = "remote-persist"
const LOCAL_PERSIST_EVENT = "local-persist"

type DbContextValue = {
  db: Database | null
  ready: boolean
  error: Error | null
  /** Bumps on every local mutation flush AND every remote-broadcast reload. */
  version: number
  reset: () => Promise<void>
}

const DbContext = createContext<DbContextValue>({
  db: null,
  ready: false,
  error: null,
  version: 0,
  reset: async () => {},
})

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const seedCheckRef = useRef(false)
  // Identifies our own broadcasts so we don't reload from our own writes.
  const tabIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()),
  )

  // Boot.
  useEffect(() => {
    let cancelled = false
    getDb()
      .then((database) => {
        if (cancelled) return
        setDb(database)
        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        const e = err instanceof Error ? err : new Error(String(err))
        console.error("[oppr-docs] DB boot failed:", e)
        setError(e)
        setReady(true) // unblock UI to show error state
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Stale-seed check: fires once per page load. A persisted IndexedDB blob
  // that predates the current seed (or has no version stamp at all) means
  // the user is looking at fixtures that no longer match what's in the
  // current source. Reset demo refreshes them.
  useEffect(() => {
    if (!db || seedCheckRef.current) return
    seedCheckRef.current = true
    const stored = getStoredSeedVersion(db)
    if (stored !== SEED_VERSION) {
      toast.warning("Demo data is out of date", {
        description:
          stored == null
            ? "Your local data was seeded before versioning was added. Settings → Reset demo to refresh."
            : `Seed v${stored} is loaded; v${SEED_VERSION} is available. Settings → Reset demo to refresh.`,
        duration: 9000,
      })
    }
  }, [db])

  // Local persists -> bump version + broadcast.
  useEffect(() => {
    const off = onPersisted(() => {
      setVersion((v) => v + 1)
      channelRef.current?.postMessage({ type: LOCAL_PERSIST_EVENT, tabId: tabIdRef.current })
    })
    return off
  }, [])

  // BroadcastChannel: listen for remote writes.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    channel.onmessage = async (ev) => {
      const data = ev.data as { type?: string; tabId?: string } | null
      if (!data || data.tabId === tabIdRef.current) return
      if (data.type === LOCAL_PERSIST_EVENT || data.type === REMOTE_PERSIST_EVENT) {
        try {
          const reloaded = await reloadFromStorage()
          if (reloaded) {
            setDb(reloaded)
            setVersion((v) => v + 1)
          }
        } catch (err) {
          console.warn("[oppr-docs] Cross-tab reload failed:", err)
        }
      }
    }
    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [])

  const reset = useCallback(async () => {
    try {
      const fresh = await engineReset()
      setDb(fresh)
      setError(null)
      setVersion((v) => v + 1)
      // Tell other tabs to reload too.
      channelRef.current?.postMessage({ type: REMOTE_PERSIST_EVENT, tabId: tabIdRef.current })
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      console.error("[oppr-docs] Reset failed:", e)
      setError(e)
      throw e
    }
  }, [])

  const value = useMemo<DbContextValue>(
    () => ({ db, ready, error, version, reset }),
    [db, ready, error, version, reset],
  )

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>
}

export function useDb(): DbContextValue {
  return useContext(DbContext)
}

/**
 * Returns a number that increments on every persisted mutation (local or remote).
 * Use as a useEffect/useMemo dependency to refresh derived data after writes.
 *
 * Example:
 *   const { db } = useDb()
 *   const watcher = useDbWatcher()
 *   const docs = useMemo(() => (db ? listDocuments(db) : []), [db, watcher])
 */
export function useDbWatcher(): number {
  return useDb().version
}
