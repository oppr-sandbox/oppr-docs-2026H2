// Users repository.
//
// For the showcase there is no real auth: `getCurrentUser()` returns the seeded
// engineer so authoring/edit screens have an owner to attribute changes to.

import type { Database } from "sql.js"
import type { User, UserRole } from "@/types"
import { asString, selectAll, selectOne } from "./_helpers"

function mapUser(row: Record<string, unknown>): User {
  return {
    id: asString(row.id),
    name: asString(row.name),
    role: asString(row.role) as UserRole,
  }
}

export function listUsers(db: Database): User[] {
  return selectAll(db, "SELECT id, name, role FROM users ORDER BY name", undefined, mapUser)
}

export function getUser(db: Database, id: string): User | null {
  return selectOne(db, "SELECT id, name, role FROM users WHERE id = ?", [id], mapUser)
}

/** Showcase: always returns the engineer. Real auth is out of scope for v1.0. */
export function getCurrentUser(db: Database): User | null {
  const u = selectOne(
    db,
    "SELECT id, name, role FROM users WHERE role = 'engineer' LIMIT 1",
    undefined,
    mapUser,
  )
  if (u) return u
  // Fallback: any user.
  return selectOne(db, "SELECT id, name, role FROM users LIMIT 1", undefined, mapUser)
}
