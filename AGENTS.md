# AGENTS.md

Repository guidance for coding and research agents working on NOUS.

## Repository Intent

This is the NOUS mother repository. It contains identity, catalog records,
curatorial protocols, research, active project boundaries, agent definitions,
and preservation information.

Do not turn the root into a single product application.

## Protect

- the historical continuity from space to exhibition to agent;
- stable entity identifiers and source provenance;
- the distinction between active projects and archives;
- the distinction between source material and new interpretation;
- explicit rights and license status;
- human review for external publishing and irreversible actions.

## Working Rules

- prefer additive, reversible changes;
- cite historical claims to a source record;
- do not copy media from historical sites without confirmed rights;
- do not rewrite the `agent` branch or other historical branches;
- place runnable product code under `projects/`;
- place agent identity and policy under `agents/`;
- place reusable technical modules under `packages/`;
- place frozen historical material under `archive/`;
- use RFCs for structural or migration decisions.

## Catalog Rules

Every catalog entity must have:

- a stable `id`;
- a `type`;
- a human-readable `name`;
- a `status`;
- at least one source or an explicit `source_status`;
- rights information or `NOASSERTION`;
- relationships expressed as stable references.

## Generated Material

Generated summaries, classifications, images, and code must not be represented
as historical source material. Record the generating agent or tool and the date
when the output becomes part of the catalog.
