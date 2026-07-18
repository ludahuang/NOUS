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

## Current Runtime

The reviewed `agent` branch was imported with its commit history under:

```text
projects/the-vault/runtime/
```

The import was made from commit:

```text
fa5d23ebe91ff1e73fae5e3f6782bf2ecf5dcbe8
```

The current uncommitted files in the separate Agent worktree were not included.

Migration and preservation are governed by:

- `catalog/projects/the-vault.yaml`;
- `docs/rfcs/0002-the-vault-history-migration.md`.
- `projects/the-vault/PRESERVATION.md`.

## Run

From `projects/the-vault/runtime/`:

```bash
npm run serve
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

The root `deploy-the-vault.yml` workflow is intentionally manual. Automatic
Pages deployment is reserved for the future NOUS Atlas so a project release
cannot replace the mother repository's public identity.
