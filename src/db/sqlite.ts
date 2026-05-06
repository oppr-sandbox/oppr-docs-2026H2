// SQLite engine wrapper (sql.js + IndexedDB persistence).
//
// Boot strategy:
//   1. Try to load a serialized DB blob from IndexedDB under key `oppr-docs-db`.
//   2. If absent, create a fresh in-memory DB, apply schema.sql + seed, then persist.
//   3. Always run `PRAGMA foreign_keys = ON` after opening (sql.js defaults it OFF;
//      our schema relies on ON DELETE CASCADE).
//
// WASM file:
//   We use `import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'` so Vite serves the
//   wasm same-origin (the dev server sets Cross-Origin-Embedder-Policy: require-corp
//   which would block a cross-origin CDN fetch). This keeps everything inside src/db/
//   and benefits from Vite's hashed asset URLs in production.
//
// Mutation tracking:
//   Repository mutations call `markDirty()` after every write. `markDirty` schedules
//   a debounced (500ms) persist. Persist serializes the DB to bytes and writes it to
//   IndexedDB. Consumers can `await persist()` to force a flush (e.g. for tests).

import initSqlJs, { type Database, type SqlJsStatic } from "sql.js"
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url"
import { runMigrations } from "./migrations"
import { seed } from "./seed"

const IDB_NAME = "oppr-docs"
const IDB_STORE = "kv"
const IDB_KEY = "oppr-docs-db"
const PERSIST_DEBOUNCE_MS = 500

// --- IndexedDB helpers (no external deps) -----------------------------------

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"))
  })
}

async function idbGet(key: string): Promise<Uint8Array | null> {
  const db = await openIdb()
  try {
    return await new Promise<Uint8Array | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly")
      const store = tx.objectStore(IDB_STORE)
      const req = store.get(key)
      req.onsuccess = () => {
        const value = req.result
        if (value == null) {
          resolve(null)
        } else if (value instanceof Uint8Array) {
          resolve(value)
        } else if (value instanceof ArrayBuffer) {
          resolve(new Uint8Array(value))
        } else {
          resolve(null)
        }
      }
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function idbSet(key: string, value: Uint8Array): Promise<void> {
  const db = await openIdb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite")
      const store = tx.objectStore(IDB_STORE)
      // Cloning into a fresh Uint8Array detaches it from the WASM heap so the
      // structured-clone algorithm doesn't reach into memory that might be
      // realloc'd during the transaction.
      const copy = new Uint8Array(value.byteLength)
      copy.set(value)
      store.put(copy, key)
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

async function idbDelete(key: string): Promise<void> {
  const db = await openIdb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite")
      tx.objectStore(IDB_STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

// --- Engine state -----------------------------------------------------------

let SQL: SqlJsStatic | null = null
let dbInstance: Database | null = null
let initPromise: Promise<Database> | null = null

let dirty = false
let persistTimer: ReturnType<typeof setTimeout> | null = null
let persistInflight: Promise<void> | null = null

type PersistListener = () => void
const persistListeners = new Set<PersistListener>()

export function onPersisted(listener: PersistListener): () => void {
  persistListeners.add(listener)
  return () => persistListeners.delete(listener)
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL
  SQL = await initSqlJs({ locateFile: () => wasmUrl as string })
  return SQL
}

async function bootstrap(): Promise<Database> {
  const SQLLib = await loadSqlJs()
  const stored = await idbGet(IDB_KEY)
  let db: Database
  let isFresh = false
  if (stored && stored.byteLength > 0) {
    try {
      db = new SQLLib.Database(stored)
    } catch (err) {
      console.warn("[oppr-docs] Failed to open stored DB, reseeding:", err)
      db = new SQLLib.Database()
      isFresh = true
    }
  } else {
    db = new SQLLib.Database()
    isFresh = true
  }

  // Always-on FKs (sql.js defaults OFF; schema relies on ON DELETE CASCADE).
  db.run("PRAGMA foreign_keys = ON;")

  // Migrations are idempotent (CREATE IF NOT EXISTS + conditional ADD COLUMN),
  // so we run them on every boot — not just fresh ones — to pick up new
  // columns added since this user's IndexedDB blob was first persisted.
  runMigrations(db)

  if (isFresh) {
    await seed(db)
    dirty = true
    // Persist immediately so a hard refresh during boot doesn't reseed.
    await flushPersist(db)
  } else {
    // If the migration step added new columns we need to flush them so a
    // hard refresh doesn't lose the schema upgrade.
    dirty = true
    await flushPersist(db)
  }

  return db
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance
  if (!initPromise) {
    initPromise = bootstrap().then((db) => {
      dbInstance = db
      return db
    })
  }
  return initPromise
}

/** Mark the DB as dirty and schedule a debounced persist. */
export function markDirty(): void {
  dirty = true
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    void persist()
  }, PERSIST_DEBOUNCE_MS)
}

async function flushPersist(db: Database): Promise<void> {
  const bytes = db.export()
  await idbSet(IDB_KEY, bytes)
  dirty = false
  for (const listener of persistListeners) {
    try {
      listener()
    } catch (err) {
      console.error("[oppr-docs] persist listener threw:", err)
    }
  }
}

/** Force-flush any pending writes. Safe to call repeatedly. */
export async function persist(): Promise<void> {
  if (persistInflight) {
    await persistInflight
    if (!dirty) return
  }
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  const db = dbInstance
  if (!db) return
  if (!dirty) return
  persistInflight = flushPersist(db).finally(() => {
    persistInflight = null
  })
  return persistInflight
}

let resetInflight: Promise<Database> | null = null

/** Drop the persisted DB, rebuild from schema + seed, persist, return new DB. */
export async function reset(): Promise<Database> {
  // Coalesce concurrent reset() calls (e.g. user double-clicks the button).
  if (resetInflight) return resetInflight
  resetInflight = (async () => {
    try {
      if (persistTimer) {
        clearTimeout(persistTimer)
        persistTimer = null
      }
      if (persistInflight) {
        try {
          await persistInflight
        } catch {
          /* ignore */
        }
      }
      if (dbInstance) {
        try {
          dbInstance.close()
        } catch {
          /* ignore */
        }
        dbInstance = null
      }
      initPromise = null
      await idbDelete(IDB_KEY)

      const SQLLib = await loadSqlJs()
      const db = new SQLLib.Database()
      db.run("PRAGMA foreign_keys = ON;")
      runMigrations(db)
      await seed(db)
      dirty = true
      await flushPersist(db)
      dbInstance = db
      initPromise = Promise.resolve(db)
      return db
    } finally {
      resetInflight = null
    }
  })()
  return resetInflight
}

/** For DbProvider's BroadcastChannel: rebuild the in-memory DB from IndexedDB. */
export async function reloadFromStorage(): Promise<Database | null> {
  const stored = await idbGet(IDB_KEY)
  if (!stored || stored.byteLength === 0) return null
  const SQLLib = await loadSqlJs()
  if (dbInstance) {
    try {
      dbInstance.close()
    } catch {
      /* ignore */
    }
  }
  const db = new SQLLib.Database(stored)
  db.run("PRAGMA foreign_keys = ON;")
  dbInstance = db
  initPromise = Promise.resolve(db)
  dirty = false
  return db
}
