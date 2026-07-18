# The Vault

Status: history imported, runtime validation in progress

The Vault is a graph-native knowledge environment and the first active
Agent-era project being integrated into the NOUS mother repository.

## Protected Product Ideas

- the connectome is a primary workspace, not decorative visualization;
- notes and relationships remain portable;
- source provenance remains visible;
- agent behavior reveals missing relations and drafts bridges;
- generated output requires review before becoming durable knowledge.
- curated source material can be deterministically rebuilt into portable vaults.

## Current Runtime

The reviewed `agent` branch was imported with its commit history under:

```text
projects/the-vault/runtime/
```

The import was made from commit:

```text
fa5d23ebe91ff1e73fae5e3f6782bf2ecf5dcbe8
```

The initial subtree import excluded uncommitted files in the separate Agent
worktree. The later-reviewed Psychology Genealogy Atlas assets are migrated in
a separate follow-up change:

```text
runtime/resources/source-materials/Psychology_Genealogy_Atlas_Obsidian.md
runtime/scripts/build-psychology-genealogy-vault.mjs
runtime/vaults/Psychology_Genealogy_Atlas/
```

Migration and preservation are governed by:

- `catalog/projects/the-vault.yaml`;
- `docs/rfcs/0002-the-vault-history-migration.md`.
- `projects/the-vault/PRESERVATION.md`.

## Run

From `projects/the-vault/runtime/`:

```bash
npm run serve
npm run build:psychology-vault
npm run smoke:agent
npm run smoke:stability
```

## Intended Project Shape

```text
projects/the-vault/
├── PROJECT.md
├── PRESERVATION.md
├── runtime/            # history-preserving import of the Agent branch
├── apps/               # future normalized application boundary
├── packages/           # future proven shared modules
└── preservation/       # future frozen runtime packages and checksums
```

The `runtime/` directory remains intact until tests, deployment, and release
equivalence are proven. Normalization into `apps/`, `packages/`, and
`preservation/` is a later reversible step.

The root `deploy-the-vault.yml` workflow publishes one composed Pages artifact:

```text
/NOUS/             -> NOUS Atlas
/NOUS/the-vault/   -> The Vault v2-agentic release
```

The project release is always copied below `the-vault/` and cannot replace the
mother repository's public identity.
