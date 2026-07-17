# The Vault Changelog

## 1.1-dev

- Packaged the current build into `release/the-vault-1.1-dev/`
- Unified product naming, metadata, and docs under `The Vault`
- Added Obsidian vault import from local markdown folders
- Parsed imported frontmatter, tags, paths, and `[[wikilinks]]` into the shared 3D graph engine
- Added fresh Wikipedia graph discovery from `Find note`
- Added blank-canvas fallback to `Obsidian > New` when Wikipedia has no relevant result
- Added Wikipedia reuse when a new local note title already exists upstream
- Merged overlapping Obsidian imports into matching Wikipedia notes and annotated those merged sources in `Note.md`
- Added `Download Vault` export for the current graph as an Obsidian-compatible vault archive

## 1.0.0

- Released The Vault 1.0 as a Wikipedia-first connectome explorer
- Added live Wikipedia search suggestions and topic-based graph rebuilding
- Added responsive folder, legend, and inspector updates from the active graph
- Added a two-tab right pane with real `Note.md` and `Inspector` views
- Tuned camera pan/orbit/focus behavior for graph navigation
- Moved the legend into the upper-middle information panel for readability
