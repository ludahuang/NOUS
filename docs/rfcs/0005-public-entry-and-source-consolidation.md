# RFC 0005: Public Entry and Source Consolidation

Status: accepted

Date: 2026-07-23

## Context

The first public Atlas established NOUS as a symbiotic curatorial organism:
space, experience, network, data curation, knowledge base, and intelligent
agent operate together. It introduced The Vault as a situated case and made
historical sources visible.

That entry was explanatory. A visitor could read the system but could not take
a real question into it, generate a working structure, or understand how
historical materials become available to future action.

## Decision

The Atlas is now a public instrument as well as an explanation. Its first
action is the local-browser **NOUS Seed Composer**.

A seed is a visitor-created, provisional curatorial structure containing:

- a question;
- possible interfaces;
- participating subjects;
- a distribution of the six NOUS functions;
- records to preserve;
- a possible reactivation path.

The generated seed is not an application, registered project, archive record,
or evidence of acceptance by NOUS. It remains in the visitor's browser unless
the visitor copies or downloads it.

## Local Generation and Privacy

Seed generation is entirely client side. It may save a draft in the current
browser's local storage. It does not send questions, names, selections, or
generated material to a NOUS server.

Generated material carries:

```text
type: nous-seed
status: generated
source_status: generated
generated_by: local-browser-seed-composer
```

This prevents a locally generated interpretation from being confused with
historical source material or a cataloged NOUS entity.

## Symbiote Geometry

The Seed Composer exposes low, medium, and high weights for the five outer
facets and the central intelligent agent. Changing a weight mutates the
public Atlas symbiote geometry in real time.

The geometry therefore models a system claim from RFC 0004: projects are
different distributions of the same six functions, rather than different
brands or product tiers. The intelligent agent remains structurally central
at every weight.

The visual remains progressive enhancement. The composer, export, and local
draft workflows do not depend on Three.js or WebGL.

## The Vault Boundary

The Vault remains a NOUS case, not a public identity parallel to NOUS.

Before opening `/the-vault/`, the Atlas provides a case prelude explaining:

- why the runtime belongs to NOUS;
- the human curator's authority;
- the intelligent agent's reviewed actions;
- what a visitor can do inside the runtime.

The prelude is owned by the public Atlas. It does not alter The Vault's
runtime, independent history, or project boundary under
`projects/the-vault/`.

## Source Consolidation

The public Atlas no longer presents four historical domains as parallel brand
entries. It uses one public **Memory** entry and keeps the domains inside a
disclosed source network.

`nous.we-media.net` remains the primary historical corpus for NOUS spaces,
exhibitions, and distributed events. `we-media.net`, `weme.im`, and
`rebui1t.com` remain necessary source nodes:

- `we-media.net`: organizational and action-subject memory;
- `weme.im`: procedural memory of brand, web, and delivery practice;
- `rebui1t.com`: experimental memory for AI, generated work, and research.

The current Memory page displays only registered entities and verified source
nodes. It does not claim that every historical project has been migrated.
Project-level extraction must preserve original URLs, source status, rights,
and unresolved questions before a record is presented as history.

## Consequences

- `/` becomes an actionable curatorial entry point;
- `/memory/` becomes the public common-memory surface;
- the root site remains static HTML, CSS, JavaScript, and Three.js;
- no server, framework, build dependency, account, or agent orchestration is
  added;
- the GitHub Pages publication boundary remains:

```text
/                 NOUS Atlas
/memory/          NOUS common memory
/the-vault/       The Vault case runtime
```

## Follow-up

The first corpus is intentionally small. Before publishing a historical
project record, verify:

1. a stable identifier;
2. an original source URL;
3. a source or explicit source status;
4. rights information;
5. a clear distinction between historical fact and current interpretation.

Potential future cases such as WEME Creative Agent, EvoGen Field, Sonic Field,
and Meteorite Atlas remain absent from the public case list until their
project records, provenance, rights status, and public scope are complete.
