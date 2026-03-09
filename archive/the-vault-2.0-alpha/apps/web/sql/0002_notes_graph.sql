CREATE TABLE IF NOT EXISTS source_documents (
  id UUID PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_key TEXT NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT,
  summary TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vault_id, source_type, source_key)
);

CREATE INDEX IF NOT EXISTS source_documents_vault_id_idx
  ON source_documents (vault_id);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES source_documents(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  folder_path TEXT NOT NULL DEFAULT 'Notes',
  markdown TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_revision_number INTEGER NOT NULL DEFAULT 0,
  last_edited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vault_id, slug),
  UNIQUE (vault_id, relative_path)
);

CREATE INDEX IF NOT EXISTS notes_vault_id_updated_at_idx
  ON notes (vault_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS notes_owner_user_id_idx
  ON notes (owner_user_id);

CREATE TABLE IF NOT EXISTS note_revisions (
  id UUID PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  editor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  revision_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  markdown TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  edit_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (note_id, revision_number)
);

CREATE INDEX IF NOT EXISTS note_revisions_note_id_created_at_idx
  ON note_revisions (note_id, created_at DESC);

CREATE TABLE IF NOT EXISTS edges (
  id UUID PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  from_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  to_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'wikilink',
  weight INTEGER NOT NULL DEFAULT 1,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_note_id <> to_note_id),
  UNIQUE (vault_id, from_note_id, to_note_id, edge_type)
);

CREATE INDEX IF NOT EXISTS edges_vault_id_idx
  ON edges (vault_id);

CREATE INDEX IF NOT EXISTS edges_to_note_id_idx
  ON edges (to_note_id);
