// Schema migration.
//
// Strategy:
// 1. Apply schema.sql verbatim (CREATE TABLE IF NOT EXISTS + indexes are idempotent).
// 2. For columns added after the initial v1.0 schema we run ALTER TABLE … ADD COLUMN
//    only when the column is missing, so existing IndexedDB-persisted databases
//    pick up the new fields without a forced demo reset.

import type { Database } from "sql.js"
import schema from "./schema.sql?raw"

interface ColumnSpec {
  table: string
  column: string
  ddl: string
}

// Columns added after the original schema shipped. Keep in chronological order.
const POST_V1_COLUMNS: ColumnSpec[] = [
  { table: "assets", column: "description", ddl: "TEXT" },
  { table: "assets", column: "level", ddl: "INTEGER NOT NULL DEFAULT 1" },
  { table: "assets", column: "floorplan", ddl: "TEXT" },
  { table: "assets", column: "is_linked", ddl: "INTEGER NOT NULL DEFAULT 0" },
  { table: "assets", column: "linked_log_code", ddl: "TEXT" },
  { table: "assets", column: "linked_log_name", ddl: "TEXT" },
  { table: "assets", column: "linked_log_description", ddl: "TEXT" },
  { table: "assets", column: "pin_number", ddl: "INTEGER" },
  { table: "assets", column: "pin_x", ddl: "REAL" },
  { table: "assets", column: "pin_y", ddl: "REAL" },
]

function listColumns(db: Database, table: string): Set<string> {
  const stmt = db.prepare(`PRAGMA table_info(${table});`)
  const cols = new Set<string>()
  try {
    while (stmt.step()) {
      const row = stmt.getAsObject() as { name?: string }
      if (row.name) cols.add(row.name)
    }
  } finally {
    stmt.free()
  }
  return cols
}

export function runMigrations(db: Database): void {
  db.exec(schema as string)

  // Group by table so we only run PRAGMA once per table.
  const byTable = new Map<string, ColumnSpec[]>()
  for (const spec of POST_V1_COLUMNS) {
    const list = byTable.get(spec.table) ?? []
    list.push(spec)
    byTable.set(spec.table, list)
  }
  for (const [table, specs] of byTable) {
    const existing = listColumns(db, table)
    for (const s of specs) {
      if (!existing.has(s.column)) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${s.column} ${s.ddl};`)
      }
    }
  }

  // SQLite has no ALTER for CHECK constraints. Older blobs were created with
  // `CHECK (scope_kind IN ('doc','asset'))` — we now allow 'library' as well
  // so library Q&A threads can persist. Detect the old shape via
  // sqlite_master and rebuild the table preserving rows.
  rebuildQaSessionsIfStaleCheck(db)
}

function rebuildQaSessionsIfStaleCheck(db: Database): void {
  const stmt = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='qa_sessions'",
  )
  let sql = ""
  try {
    if (stmt.step()) {
      const row = stmt.getAsObject() as { sql?: string }
      sql = row.sql ?? ""
    }
  } finally {
    stmt.free()
  }
  if (!sql) return // table not yet created — fresh DB, schema.sql already ran
  if (sql.includes("'library'")) return // already migrated

  db.exec(`
    BEGIN;
    CREATE TABLE qa_sessions__new (
      id          TEXT PRIMARY KEY,
      scope_kind  TEXT NOT NULL CHECK (scope_kind IN ('doc','asset','library')),
      scope_id    TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );
    INSERT INTO qa_sessions__new (id, scope_kind, scope_id, created_at)
      SELECT id, scope_kind, scope_id, created_at FROM qa_sessions;
    DROP TABLE qa_sessions;
    ALTER TABLE qa_sessions__new RENAME TO qa_sessions;
    COMMIT;
  `)
}
