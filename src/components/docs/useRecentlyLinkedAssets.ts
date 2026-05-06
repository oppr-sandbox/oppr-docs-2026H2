// useRecentlyLinkedAssets
//
// Tracks the last N asset IDs the author has linked, persisted in
// localStorage so picker rows stay useful across page reloads. Both the
// MetadataPanel multi-select and the inline LinkedAssetPicker push to this
// list when an asset is added — so frequently-used assets always surface
// at the top of the next pick.
//
// The list lives under one storage key (no per-doc scoping). Operators
// authoring on the pigment line keep seeing pigment-line assets first; if
// they switch domains, the list naturally drains.

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "oppr-docs:recently-linked-assets"
const MAX_ENTRIES = 8

function read(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

function write(ids: string[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)))
  } catch {
    /* ignore */
  }
}

export function useRecentlyLinkedAssets(): {
  recent: string[]
  push: (assetId: string) => void
  clear: () => void
} {
  const [recent, setRecent] = useState<string[]>(() => read())

  // Keep the in-memory list in sync if another surface bumps the storage
  // (e.g. inline picker + metadata picker both updating).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      setRecent(read())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const push = useCallback((assetId: string) => {
    setRecent((prev) => {
      const next = [assetId, ...prev.filter((id) => id !== assetId)].slice(0, MAX_ENTRIES)
      write(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    write([])
    setRecent([])
  }, [])

  return { recent, push, clear }
}
