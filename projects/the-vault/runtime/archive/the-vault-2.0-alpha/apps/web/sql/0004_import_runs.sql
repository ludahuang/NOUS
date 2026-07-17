CREATE TABLE IF NOT EXISTS import_runs (
  id UUID PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'succeeded',
  import_name TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS import_runs_vault_id_created_at_idx
  ON import_runs (vault_id, created_at DESC);

CREATE INDEX IF NOT EXISTS import_runs_requested_by_user_id_idx
  ON import_runs (requested_by_user_id, created_at DESC);
