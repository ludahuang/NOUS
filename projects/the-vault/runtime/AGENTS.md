# AGENTS.md

Repository guidance for Codex and other coding agents working on **The Vault**.

## Product intent

The Vault 2.0-alpha is a **persistent, source-aware connectome workspace**.

This repo is **not** building a general platform in alpha. The priority is the smallest correct cloud leap from `1.1-dev`:

- user identity
- personal workspace creation
- multiple **private** vaults with **owner-only** access
- persistent notes and revisions
- durable Obsidian import/export continuity
- existing 3D connectome mounted inside a real app shell
- one narrow AI enhancement layer

## Hard constraints

### Protect these
- Keep the **3D connectome** as a first-class product surface.
- Keep **Markdown portability** and **Obsidian-compatible export** intact.
- Keep **PostgreSQL** as the canonical system of record.
- Keep **note** as the canonical editable entity.
- Keep **source provenance** visible and legible.
- Keep AI **reviewed, cited, and auditable**.

### Do not introduce in alpha unless explicitly requested
- collaborative editing
- billing or subscription logic
- multi-provider auth expansion beyond the first provider
- agent orchestration or autonomous background workflows
- broad adapter marketplace
- graph database migration
- vector-first product logic
- premature microservice decomposition

## Architecture defaults

- Web app: Next.js + TypeScript
- Auth: Auth.js (first provider: GitHub)
- Database: PostgreSQL
- Optional vector support: `pgvector`, but alpha must not depend on it
- Worker: background process for import, export, and AI jobs
- Object storage: S3-compatible bucket
- Redis: optional, only if queue pressure requires it

## Source of truth

Prefer this hierarchy when making implementation choices:

1. current task / issue instructions
2. `PLANS.md`
3. `the-vault-2.0-architecture.md`
4. `the-vault-2.0-prd.md`
5. existing code

If the code conflicts with the current plan, align the code with the plan unless that would break a proven feature.

## Domain model expectations

Core entities expected in alpha:

- `user`
- `user_identity`
- `workspace`
- `vault`
- `note`
- `note_revision`
- `source_document`
- `edge`
- `import_run`
- `export_run`
- `ai_run`

Notes:
- `workspace` is personal in alpha.
- one user may own multiple private vaults.
- `source_document` stores external grounding such as Wikipedia metadata.
- accepted AI output becomes normal `note_revision` history.

## AI rules

Only ship these AI actions in alpha unless explicitly expanded:

- note summary
- link suggestion

Every AI action must:
- show source inputs
- include citations
- require explicit user review before save
- create an `ai_run` audit record
- create normal revision history on acceptance

Do **not** implement open-ended “ask my vault”, autonomous agents, or orchestration flows by default.

## Import / export rules

Import and export are trust boundaries, not secondary utilities.

When modifying import/export logic:
- preserve markdown fidelity
- preserve frontmatter, tags, aliases, folders, and wikilinks
- keep overlap / merge behavior visible to the user
- keep exports Obsidian-compatible
- avoid hidden transformations that make round-tripping unreliable

## UI / product rules

- Do not reduce the app to CRUD screens with a graph attached.
- The connectome remains the main workspace surface.
- Support graph-native navigation first.
- Preserve mixed-source clarity between Wikipedia-backed notes and local notes.
- Keep the public or museum rail out of the alpha critical path, but do not make core decisions that block it later.

## Coding style

- prefer small, readable changes
- avoid speculative abstractions
- choose boring, operable defaults
- keep modules cohesive and easy to delete or replace
- document non-obvious decisions in code comments or follow-up notes
- do not add dependencies without a concrete need

## Before opening a PR

Verify, at minimum:
- app builds
- tests for touched logic pass, or add tests where appropriate
- auth flow still works for the first provider
- note persistence and revision history are not broken
- import/export round-trip remains intact
- AI outputs remain reviewed and cited
- connectome workflow is not conceptually regressed

## When uncertain

Choose the option that is:
- simpler
- more reversible
- more source-aware
- more export-safe
- less platform-like

