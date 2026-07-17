# Source and Provenance Policy

## Source Levels

### Primary source

Material published by the creator, project, venue, or responsible organization.

### Preserved source

A verified local preservation package, export, database snapshot, or media file
with known origin and capture date.

### Curatorial interpretation

A later summary, classification, relation, or argument created from one or more
sources.

### Generated interpretation

Material produced with an AI model or automated transformation. It must name
the tool or agent, input sources, date, and human review status.

## Web Source Handling

- record canonical URL, access date, title, content type, and modification date;
- prefer public APIs and sitemaps for inventory;
- do not assume that public accessibility grants permission to republish media;
- do not silently normalize historical wording;
- store summaries separately from captured source material;
- use `NOASSERTION` when rights are unknown.

## Minimum Provenance Record

```yaml
source:
  url: https://example.org/item
  accessed: 2026-07-17
  modified: 2025-01-01
activity:
  type: curatorial-summary
  agent: nous:agent:weme-creative-agent
  reviewed_by: nous:person:lu-dahuang
rights: NOASSERTION
```
