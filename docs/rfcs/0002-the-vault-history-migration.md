# RFC 0002: The Vault History Migration

Status: proposed

Date: 2026-07-17

## Current State

- NOUS canonical history originates on `master`.
- The Vault implementation is on remote branch `agent`.
- The histories have different root commits and no shared Git ancestor.
- The Agent working tree may contain active, uncommitted research assets and
  must not be used as the migration source.

## Goal

Preserve The Vault's meaningful commit history while placing the project behind
a clear NOUS project boundary.

## Recommended Migration

1. verify and commit or intentionally exclude all current Agent working changes;
2. tag the reviewed Agent baseline as `the-vault/v2-agentic`;
3. create a clean temporary worktree from the remote Agent tag;
4. rewrite only the imported project paths under `projects/the-vault/`, or split
   The Vault into a dedicated repository and register it here;
5. preserve author, date, message, and original commit mapping;
6. validate the static app, smoke tests, import/export, and Pages deployment;
7. switch project deployment only after URL and artifact verification;
8. keep the old `agent` branch read-only until the new location is proven.

## Preferred Near-Term Choice

Keep The Vault in this repository under `projects/the-vault/` during the first
migration because it is currently small and closely coupled to the NOUS Agent
concept.

Reconsider a dedicated repository when it needs independent access control,
deployment cadence, security ownership, or a substantially different toolchain.

## Release Cleanup

The Agent branch currently keeps repeated full source snapshots under
`release/`. After preservation review:

- use tags for source versions;
- use GitHub Releases for distributable archives;
- keep preservation packages only where a born-digital work needs a frozen
  runtime, dependencies, screenshots, and checksums;
- do not delete existing snapshots until equivalence is verified.

## Non-Goals

- no force push to `agent`;
- no deletion of current releases;
- no default-branch switch during the architecture scaffold;
- no migration from a dirty working tree.
