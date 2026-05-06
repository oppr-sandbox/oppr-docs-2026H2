-- Oppr DOCS v1.0 showcase — SQLite schema
-- Loaded by sql.js on first boot. Mirrors src/types/index.ts.

-- Free-form key/value table for engine metadata. Currently stores
-- `seed_version` so the app can warn the operator when their persisted
-- IndexedDB blob predates a seed change.
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('engineer','operator','manager'))
);

CREATE TABLE IF NOT EXISTS assets (
  id                     TEXT PRIMARY KEY,
  code                   TEXT NOT NULL UNIQUE,
  name                   TEXT NOT NULL,
  site                   TEXT NOT NULL,
  location               TEXT,
  qr_token               TEXT NOT NULL UNIQUE,
  created_at             TEXT NOT NULL,
  description            TEXT,
  level                  INTEGER NOT NULL DEFAULT 1,
  floorplan              TEXT,
  is_linked              INTEGER NOT NULL DEFAULT 0,
  linked_log_code        TEXT,
  linked_log_name        TEXT,
  linked_log_description TEXT,
  pin_number             INTEGER,
  pin_x                  REAL,  -- floorplan x as percent 0-100
  pin_y                  REAL   -- floorplan y as percent 0-100
);

-- Logs that reference an asset. The Oppr LOGS module owns the log records;
-- in DOCS we only store enough metadata to list/click them. Each row maps an
-- operator log naming code to the asset it documents.
CREATE TABLE IF NOT EXISTS asset_logs (
  asset_id    TEXT NOT NULL,
  code        TEXT NOT NULL,  -- e.g. "HOL-OPS-LOG-0001"
  name        TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (asset_id, code),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id              TEXT PRIMARY KEY,
  naming_code     TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('sop','manual','work_instruction','lmra')),
  status          TEXT NOT NULL CHECK (status IN ('draft','in_review','published','archived')),
  current_version INTEGER NOT NULL DEFAULT 0,
  owner_id        TEXT NOT NULL,
  tags_json       TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS document_versions (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL,
  version       INTEGER NOT NULL,
  body_kind     TEXT NOT NULL CHECK (body_kind IN ('tiptap','pdf')),
  body_json     TEXT,           -- TipTap doc JSON serialized
  pdf_blob_id   TEXT,
  published_at  TEXT NOT NULL,
  UNIQUE (document_id, version),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (pdf_blob_id) REFERENCES pdf_blobs(id)
);

CREATE TABLE IF NOT EXISTS document_assets (
  document_id TEXT NOT NULL,
  asset_id    TEXT NOT NULL,
  PRIMARY KEY (document_id, asset_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id)    REFERENCES assets(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pdf_blobs (
  id          TEXT PRIMARY KEY,
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  bytes       BLOB NOT NULL,
  page_count  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS logs (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  type  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_log_refs (
  document_id TEXT NOT NULL,
  version     INTEGER NOT NULL,
  log_id      TEXT NOT NULL,
  anchor_id   TEXT NOT NULL,
  PRIMARY KEY (document_id, version, log_id, anchor_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (log_id)      REFERENCES logs(id)      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chunks (
  id              TEXT PRIMARY KEY,
  document_id     TEXT NOT NULL,
  version         INTEGER NOT NULL,
  seq             INTEGER NOT NULL,
  text            TEXT NOT NULL,
  page_or_section TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chunks_doc_version ON chunks(document_id, version);

CREATE TABLE IF NOT EXISTS embeddings (
  chunk_id    TEXT PRIMARY KEY,
  vector_json TEXT NOT NULL,  -- JSON-serialized float array
  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS qa_sessions (
  id          TEXT PRIMARY KEY,
  scope_kind  TEXT NOT NULL CHECK (scope_kind IN ('doc','asset','library')),
  -- For library sessions, scope_id is the literal string 'library'.
  scope_id    TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS qa_messages (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
  text            TEXT NOT NULL,
  citations_json  TEXT,  -- JSON Citation[]
  created_at      TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES qa_sessions(id) ON DELETE CASCADE
);
