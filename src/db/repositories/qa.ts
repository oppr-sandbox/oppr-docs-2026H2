// Q&A sessions + messages repository.

import type { Database } from "sql.js"
import type { Citation, QaMessage, QaSession } from "@/types"
import { markDirty } from "../sqlite"
import {
  asNullableString,
  asString,
  nowIso,
  parseJson,
  run,
  selectAll,
  selectOne,
} from "./_helpers"

function mapSession(row: Record<string, unknown>): QaSession {
  return {
    id: asString(row.id),
    scope_kind: asString(row.scope_kind) as QaSession["scope_kind"],
    scope_id: asString(row.scope_id),
    created_at: asString(row.created_at),
  }
}

function mapMessage(row: Record<string, unknown>): QaMessage {
  const citations = asNullableString(row.citations_json)
  return {
    id: asString(row.id),
    session_id: asString(row.session_id),
    role: asString(row.role) as QaMessage["role"],
    text: asString(row.text),
    citations: citations ? parseJson<Citation[]>(citations, []) : null,
    created_at: asString(row.created_at),
  }
}

export type SessionScope =
  | { kind: "doc" | "asset"; id: string }
  | { kind: "library" }

export function createSession(db: Database, scope: SessionScope): QaSession {
  const id = crypto.randomUUID()
  const created_at = nowIso()
  const scope_id = scope.kind === "library" ? "library" : scope.id
  run(
    db,
    "INSERT INTO qa_sessions (id, scope_kind, scope_id, created_at) VALUES (?, ?, ?, ?);",
    [id, scope.kind, scope_id, created_at],
  )
  markDirty()
  return { id, scope_kind: scope.kind, scope_id, created_at }
}

export function getSession(db: Database, id: string): QaSession | null {
  return selectOne(
    db,
    "SELECT id, scope_kind, scope_id, created_at FROM qa_sessions WHERE id = ?",
    [id],
    mapSession,
  )
}

export function listSessions(
  db: Database,
  filter?: { scope_kind?: QaSession["scope_kind"]; scope_id?: string },
): QaSession[] {
  const where: string[] = []
  const params: string[] = []
  if (filter?.scope_kind) {
    where.push("scope_kind = ?")
    params.push(filter.scope_kind)
  }
  if (filter?.scope_id) {
    where.push("scope_id = ?")
    params.push(filter.scope_id)
  }
  const sql =
    "SELECT id, scope_kind, scope_id, created_at FROM qa_sessions" +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY created_at DESC"
  return selectAll(db, sql, params.length ? params : undefined, mapSession)
}

export function addMessage(
  db: Database,
  input: {
    session_id: string
    role: "user" | "assistant"
    text: string
    citations?: Citation[] | null
  },
): QaMessage {
  const id = crypto.randomUUID()
  const created_at = nowIso()
  const citationsJson = input.citations ? JSON.stringify(input.citations) : null
  run(
    db,
    `INSERT INTO qa_messages (id, session_id, role, text, citations_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.session_id, input.role, input.text, citationsJson, created_at],
  )
  markDirty()
  return {
    id,
    session_id: input.session_id,
    role: input.role,
    text: input.text,
    citations: input.citations ?? null,
    created_at,
  }
}

export function listMessages(db: Database, sessionId: string): QaMessage[] {
  return selectAll(
    db,
    `SELECT id, session_id, role, text, citations_json, created_at
       FROM qa_messages WHERE session_id = ? ORDER BY created_at ASC`,
    [sessionId],
    mapMessage,
  )
}

/** Remove every message for a session — keeps the session row so the
 *  scope mapping is preserved. Used by the "Clear chat" button. */
export function deleteMessages(db: Database, sessionId: string): void {
  run(db, "DELETE FROM qa_messages WHERE session_id = ?;", [sessionId])
  markDirty()
}

/** Pop the trailing user→assistant pair (or just the trailing user, if no
 *  assistant followed) so the caller can re-run the prior question without
 *  stacking duplicates. Returns the user question text that was popped,
 *  or null if there was no user turn at the tail. */
export function popLastTurn(
  db: Database,
  sessionId: string,
): string | null {
  const tail = selectAll(
    db,
    `SELECT id, role, text FROM qa_messages
       WHERE session_id = ? ORDER BY created_at DESC LIMIT 2`,
    [sessionId],
    (r) => ({
      id: asString(r.id),
      role: asString(r.role),
      text: asString(r.text),
    }),
  )
  if (tail.length === 0) return null

  let userText: string | null = null
  // tail is newest-first. Drop assistant if it's there, then drop user.
  for (const m of tail) {
    if (m.role === "assistant") {
      run(db, "DELETE FROM qa_messages WHERE id = ?;", [m.id])
      continue
    }
    if (m.role === "user") {
      userText = m.text
      run(db, "DELETE FROM qa_messages WHERE id = ?;", [m.id])
      break
    }
  }
  if (userText != null) markDirty()
  return userText
}
