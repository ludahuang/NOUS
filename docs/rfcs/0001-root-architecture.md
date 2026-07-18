# RFC 0001: NOUS Root Architecture

Status: proposed implementation

Date: 2026-07-17

## Decision

The default branch becomes the canonical NOUS atlas and operating protocol.
No single product application occupies the repository root.

## Drivers

- NOUS has existed as identity, space, exhibition mechanism, network, data
  curation practice, knowledge environment, and creative agent.
- The historical `master` branch contained the NOUS narrative but no structure.
- The current `agent` branch contains The Vault as an unrelated Git history.
- Historical web sources remain distributed across multiple active domains.
- Product code, cultural records, and agent definitions have different
  lifecycles and rights.

## Top-Level Boundaries

- `catalog/` - entity registry;
- `protocols/` - operating mechanisms;
- `research/` - sourced investigation and interpretation;
- `projects/` - runnable products and works;
- `agents/` - agent identities and policies;
- `packages/` - proven shared technical modules;
- `archive/` - frozen historical forms;
- `site/` - public atlas;
- `schemas/` - machine-readable contracts;
- `LICENSES/` - rights decisions and notices.

## Consequences

- The Vault moves under a project boundary or into a dedicated repository.
- WEME Creative Agent receives an inspectable definition independent of any UI.
- public site deployment is separated from product deployment;
- historical branches remain protected until migrated;
- source inventories can grow without copying unlicensed media.

## Rejected Options

### Keep The Vault at root

Rejected because it makes one project stand for the full NOUS history.

### Use permanent branches for Space, Agent, and Archive

Rejected because branches hide relationships and cannot provide a coherent
catalog or public atlas.

### Copy every historical website into Git

Rejected because rights, scale, dynamic behavior, and preservation requirements
must be evaluated before capture.
