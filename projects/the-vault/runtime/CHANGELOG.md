# The Vault Changelog

## v2-agentic

- Packaged the current build as `release/the-vault-2.0-agentic/`
- Repointed GitHub Pages deployment to publish the packaged `release/the-vault-2.0-agentic/` snapshot
- Renamed the Pages workflow to `deploy-v2-agentic.yml`
- Removed the explicit Pages environment binding so the deploy job can run from the `agent` branch
- Replaced the old utility-style assistant with a personified graph-native agent
- Removed summary-first, optimization-first, and generic draft-note panel behavior
- Made `Reveal Connections` the primary action
- Kept chat as a secondary shell around missing-bridge discovery
- Added `Inspect` and `Draft bridge` actions for each revealed connection
- Updated the agent guide, screenshots, and smoke test to the new relation-first concept
- Added a full stabilization smoke that verifies discovery, note/inspector split, Obsidian new, in-shell bridge drafting, export, and reset

## Archive Reset

- Restored the repo root to the static `1.1-dev` app surface
- Archived the failed cloud shell under `archive/the-vault-2.0-alpha/`
- Moved the `2.0-alpha` PRD and architecture docs into that archive
- Retitled root scripts so `1.1-dev` is the default and `2.0-alpha` is explicitly opt-in
- Added a GitHub Pages workflow for publishing the static `v1.1-dev` root app

## 2.0-alpha (Archived)

- Built a Next.js shell with Auth.js, PostgreSQL persistence, import/export jobs, and reviewed AI summary/link suggestions
- Preserved that work as an engineering archive instead of the active product UI

## 1.1-dev

- Released The Vault as a live Wikipedia-first connectome workspace
- Added live topic discovery from `Find note`
- Added Obsidian import merged into the current graph
- Added `Download Vault` export for the current graph
- Tuned the 3D graph, folder legend, and two-tab `Note.md` / `Inspector` workspace

## 1.0.0

- Released The Vault 1.0 as a Wikipedia-first connectome explorer
