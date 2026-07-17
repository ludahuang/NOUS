# The Vault

Status: migration scaffold

The Vault is a graph-native knowledge environment and the first active
Agent-era project being integrated into the NOUS mother repository.

## Protected Product Ideas

- the connectome is a primary workspace, not decorative visualization;
- notes and relationships remain portable;
- source provenance remains visible;
- agent behavior reveals missing relations and drafts bridges;
- generated output requires review before becoming durable knowledge.

## Current Source

The active historical implementation remains on the remote `agent` branch.
It is not copied into this directory yet.

Migration is governed by:

- `catalog/projects/the-vault.yaml`;
- `docs/rfcs/0002-the-vault-history-migration.md`.

## Intended Project Shape

```text
projects/the-vault/
├── PROJECT.md
├── apps/web/
├── packages/graph/
├── docs/
├── tests/
├── fixtures/
└── preservation/
```
