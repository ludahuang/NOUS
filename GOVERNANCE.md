# NOUS Governance

## Purpose

Governance protects the continuity of NOUS while allowing projects, spaces,
exhibitions, and agents to remain experimental.

## Repository Roles

- **Maintainer**: approves changes to root identity, schemas, governance, and releases.
- **Curator**: proposes entities, relationships, programs, and interpretive text.
- **Project owner**: maintains a runnable project and its release history.
- **Archivist**: records provenance, preservation state, and rights.
- **Agent**: performs only the actions allowed by its authority policy.

One person may hold multiple roles, but the role used for a decision should be
clear in the record.

## Change Classes

### Editorial

Typos, links, translations, and non-semantic metadata corrections may be merged
through normal review.

### Curatorial

New interpretations, relationships, selections, and project status changes
should cite their source or identify themselves as a new curatorial statement.

### Structural

Changes to schemas, identifiers, governance, licensing, or migration strategy
require an RFC under `docs/rfcs/`.

### Irreversible

Deletion, publication under a new license, history rewriting, domain changes,
or removal of a preservation package require explicit maintainer approval and
a recorded decision.

## Agent Rules

Agents may draft, classify, compare, suggest links, and prepare preservation
records. They may not silently overwrite source material, grant rights, publish
externally, or erase history.

All agent-generated catalog changes must identify:

- the agent;
- the source inputs;
- the generation or transformation activity;
- the human review state.

## Branches

- the default branch is the canonical NOUS atlas;
- short-lived branches are used for implementation and review;
- products and historical periods are represented by directories, manifests,
  tags, and releases, not permanent branch names;
- existing historical branches remain protected until their migration is
  complete and verified.
