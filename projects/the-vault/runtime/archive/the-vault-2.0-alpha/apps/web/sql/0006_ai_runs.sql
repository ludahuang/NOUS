CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  review_status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  prompt_text TEXT NOT NULL DEFAULT '',
  input_markdown TEXT NOT NULL DEFAULT '',
  output_markdown TEXT NOT NULL DEFAULT '',
  citations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  accepted_revision_id UUID REFERENCES note_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_runs_vault_id_created_at_idx
  ON ai_runs (vault_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_runs_note_id_created_at_idx
  ON ai_runs (note_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_runs_requested_by_user_id_created_at_idx
  ON ai_runs (requested_by_user_id, created_at DESC);
