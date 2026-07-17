# Catalog

The catalog is the canonical registry of entities in the NOUS world.

It describes what exists without requiring every entity to live in this
repository.

## Entity Types

- `person`
- `organization`
- `space`
- `exhibition`
- `agent`
- `project`
- `collection`
- `work`
- `source`
- `event`

Catalog entries should validate conceptually against
`schemas/nous-entity.schema.json`.

Implementation code belongs in `projects/`, agent runtime definitions belong in
`agents/`, and historical source packages belong in `archive/`.
