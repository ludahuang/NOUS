# RFC 0003: Public Atlas and Project Paths

Status: accepted

Date: 2026-07-18

## Decision

GitHub Pages publishes one composed artifact from the NOUS mother repository:

```text
https://ludahuang.github.io/NOUS/
  -> NOUS Atlas

https://ludahuang.github.io/NOUS/the-vault/
  -> The Vault
```

The root public path represents NOUS itself: identity, curatorial protocols,
project genealogy, agents, and historical sources. A project runtime is
published only below its registered project path.

## Build Boundary

The Pages workflow assembles, without rewriting source directories:

```text
site/                                                       -> dist/
projects/the-vault/runtime/release/the-vault-2.0-agentic/   -> dist/the-vault/
```

This preserves three separate boundaries:

1. repository identity at the root;
2. project ownership under `projects/the-vault/`;
3. immutable release material under the runtime release directory.

## Deployment Rule

The composed workflow is the only active Pages publisher. Historical
Agent-branch Pages workflows remain part of the preserved history but are
disabled so they cannot replace the NOUS Atlas at the public root.

Future public projects must receive their own subordinate path and must not
publish directly to the Pages root.
