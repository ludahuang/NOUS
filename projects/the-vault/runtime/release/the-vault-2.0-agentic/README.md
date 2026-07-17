# The Vault 2.0-Agentic

The Vault 2.0-Agentic is the packaged release snapshot of the current `agent` branch.

It keeps the live Wikipedia-first connectome workflow, Obsidian import/export continuity, and adds `NOUS`: a graph-native assistant focused on revealing missing connections and drafting bridge notes inside its own chamber.

## What 2.0-Agentic Includes

- Live Wikipedia discovery from `Find note`
- Dense 3D connectome navigation with orbit, pan, zoom, and focus
- Foldered vault navigation derived from the current graph
- Obsidian markdown import merged into the active connectome
- Local note drafting with Wikipedia fallback for duplicate titles
- `Download Vault` export as an Obsidian-compatible archive
- `NOUS`, a graph-native assistant for missing-bridge discovery and in-shell bridge drafting

## Product Scope

- Wikipedia pages remain the canonical live source notes
- Imported Obsidian markdown can merge into or extend the current connectome
- The vault sidebar organizes the active graph into folders
- The 3D surface remains the main workspace
- `NOUS` reveals missing connections and drafts bridge notes without replacing normal note authoring

## Release Contents

```text
index.html
styles.css
script.js
vendor/
docs/agent-use.md
docs/images/
```

## Run Locally

From this folder:

```bash
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

## Notes

- Wikipedia requests are live, so discovery and graph rebuilding can take a few seconds
- Import overlap is merged by title into the current Wikipedia graph and reflected in `Note.md`
- `NOUS` bridge drafts open inside the assistant chamber, not behind it in `Note.md`
- Vendor dependencies are bundled locally in `vendor/`
