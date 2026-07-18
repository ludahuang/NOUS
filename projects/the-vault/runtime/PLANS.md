# PLANS.md

## The Vault 2.0-alpha execution plan

Status: active  
Goal: ship the smallest correct cloud leap from `1.1-dev` without diluting the connectome thesis.

## Definition of success

A user can:

1. sign in
2. enter a personal workspace
3. create or open a private vault
4. import or create notes that persist
5. explore the persistent 3D connectome
6. review one narrow AI action
7. export an Obsidian-compatible vault

If that loop works durably, alpha is successful.

## Scope boundary

### In scope
- GitHub sign-in
- personal workspace auto-creation
- multiple private vaults per user
- owner-only authorization
- PostgreSQL-backed notes, revisions, sources, and edges
- object-storage-backed import/export artifacts
- worker-based import and export jobs
- persistent graph hydration from canonical data
- AI note summary
- AI link suggestion
- auditable AI review flow

### Out of scope
- collaboration
- public editing
- billing
- provider expansion beyond the first auth provider
- autonomous agents
- broad ask-my-vault mode
- adapter expansion beyond current source model
- native apps

## Build order

### Phase 1 — app shell and identity

Deliver:
- Next.js app shell
- Auth.js setup
- GitHub provider
- `user`, `user_identity`, `workspace` tables
- first-login workspace bootstrap
- authenticated routes

Exit criteria:
- new user can sign in and land in a personal workspace
- returning user restores session and workspace cleanly

### Phase 2 — vault ownership and persistence

Deliver:
- `vault` model
- create / list / open private vaults
- owner-only authorization checks
- `note`, `note_revision`, `source_document`, `edge` tables
- persistent reads and writes from PostgreSQL

Exit criteria:
- a user can manage multiple private vaults
- notes and graph state survive across sessions
- revision history exists for direct edits

### Phase 3 — import / export trust loop

Deliver:
- raw upload storage in object storage
- `import_run` and `export_run`
- worker process for import/export jobs
- markdown parsing for `.md`, `.markdown`, YAML frontmatter, tags, aliases, folders, and `[[wikilinks]]`
- overlap / merge visibility
- Obsidian-compatible export archive generation

Exit criteria:
- import completes through a worker
- overlap and merge behavior is visible
- export round-trip succeeds without obvious fidelity loss

### Phase 4 — connectome persistence

Deliver:
- mount current 3D connectome into app shell
- hydrate graph from canonical PostgreSQL data
- persist enough workspace state to restore useful sessions
- preserve search, focus, orbit, zoom, and inspector workflows

Exit criteria:
- connectome remains the main workspace surface
- graph is reconstructed from canonical note/source/edge data
- no conceptual regression to graph-as-decoration

### Phase 5 — narrow AI layer

Deliver:
- `ai_run` model
- provider gateway abstraction
- note summary action
- link suggestion action
- review UI with citations and accept / reject actions
- accepted AI output stored as normal revision history

Exit criteria:
- every AI output shows inputs and citations
- every AI output requires explicit review before save
- accepted output creates auditable records and revisions

## Data model priority

Create these first:
- `user`
- `user_identity`
- `workspace`
- `vault`
- `note`
- `note_revision`

Create these next:
- `source_document`
- `edge`
- `import_run`
- `export_run`
- `ai_run`

Defer unless needed:
- `note_embedding`
- `public_snapshot`

## Engineering rules during execution

- keep PostgreSQL canonical
- keep object storage for raw uploads and export archives
- keep Redis optional until queue pressure proves the need
- do not block alpha on `pgvector`
- prefer reversible schema and service decisions
- avoid abstractions for future collaboration
- do not expand AI scope during infra work

## Key risks to watch

### Risk 1: platform creep
Signal:
- adding billing, roles, orgs, or multiple auth providers during alpha

Response:
- reject unless required for the current success loop

### Risk 2: graph regression
Signal:
- UI drifts toward a conventional note app with a secondary graph view

Response:
- restore connectome-first navigation and screen hierarchy

### Risk 3: import/export trust erosion
Signal:
- round-tripping to Obsidian becomes lossy or opaque

Response:
- treat as a release blocker

### Risk 4: AI overreach
Signal:
- broad chat, agent, or orchestration work begins before narrow AI review flow is stable

Response:
- cut back to summary and link suggestion only

### Risk 5: infra vanity
Signal:
- adding services before operational pressure exists

Response:
- collapse to app + worker + postgres + object storage

## Recommended first implementation slice

Build this vertical slice first:
- GitHub sign-in
- personal workspace bootstrap
- create a private vault
- create/edit a note
- save revision history
- render the persistent connectome from stored notes/edges
- export the vault

Only after that slice is stable, add workerized import and narrow AI.

## Done means

Alpha is done when a solo user can reliably trust The Vault with real knowledge work across sessions, not when the architecture looks impressive.

