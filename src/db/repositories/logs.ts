// Logs repository.

import type { Database } from "sql.js"
import type { Log } from "@/types"
import { asString, selectAll, selectOne } from "./_helpers"

function mapLog(row: Record<string, unknown>): Log {
  return {
    id: asString(row.id),
    name: asString(row.name),
    type: asString(row.type),
  }
}

export function listLogs(db: Database): Log[] {
  return selectAll(db, "SELECT id, name, type FROM logs ORDER BY name", undefined, mapLog)
}

export function getLog(db: Database, id: string): Log | null {
  return selectOne(db, "SELECT id, name, type FROM logs WHERE id = ?", [id], mapLog)
}
