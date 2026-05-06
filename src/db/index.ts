// Barrel export for the DB layer.
//
// Consumers can do:
//   import { useDb, listDocuments, getCurrentVersion } from "@/db"
// And from a console smoke-test:
//   const m = await import("@/db")
//   const db = await m.getDb()
//   m.listDocuments(db)

export { DbProvider, useDb, useDbWatcher } from "./DbProvider"
export {
  getDb,
  persist,
  reset,
  markDirty,
  reloadFromStorage,
  onPersisted,
} from "./sqlite"
export { runMigrations } from "./migrations"
export { seed } from "./seed"

export * from "./repositories/users"
export * from "./repositories/assets"
export * from "./repositories/documents"
export * from "./repositories/logs"
export * from "./repositories/chunks"
export * from "./repositories/embeddings"
export * from "./repositories/qa"
export * from "./repositories/pdfs"
