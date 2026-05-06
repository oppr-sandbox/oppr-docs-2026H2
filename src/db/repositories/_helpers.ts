// Shared SQL helpers for repository implementations.
//
// sql.js exposes two query styles: prepared-statement iteration via
// `Statement#step()` (one row at a time, returns column objects) and `db.exec()`
// (returns full result sets). Repos prefer prepared statements with
// `getAsObject()` because it gives typed key/value rows and is cleaner to map.

import type { BindParams, Database } from "sql.js"

/** Run a SELECT, map every row through `mapper`, return the array. */
export function selectAll<T>(
  db: Database,
  sql: string,
  params: BindParams | undefined,
  mapper: (row: Record<string, unknown>) => T,
): T[] {
  const stmt = db.prepare(sql)
  try {
    if (params) stmt.bind(params)
    const out: T[] = []
    while (stmt.step()) out.push(mapper(stmt.getAsObject() as Record<string, unknown>))
    return out
  } finally {
    stmt.free()
  }
}

/** Run a SELECT and return the first mapped row, or null. */
export function selectOne<T>(
  db: Database,
  sql: string,
  params: BindParams | undefined,
  mapper: (row: Record<string, unknown>) => T,
): T | null {
  const stmt = db.prepare(sql)
  try {
    if (params) stmt.bind(params)
    if (stmt.step()) return mapper(stmt.getAsObject() as Record<string, unknown>)
    return null
  } finally {
    stmt.free()
  }
}

/** INSERT/UPDATE/DELETE with positional params. */
export function run(db: Database, sql: string, params?: BindParams): void {
  const stmt = db.prepare(sql)
  try {
    if (params) stmt.bind(params)
    stmt.step()
  } finally {
    stmt.free()
  }
}

// --- Row mappers ------------------------------------------------------------

export function asString(v: unknown): string {
  return v == null ? "" : String(v)
}
export function asNullableString(v: unknown): string | null {
  return v == null ? null : String(v)
}
export function asNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0)
}
export function asNullableNumber(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === "number") return v
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
export function parseJson<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string" || v.length === 0) return fallback
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

export function nowIso(): string {
  return new Date().toISOString()
}
