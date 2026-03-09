# The Vault 1.0

The Vault 1.0 is the original Wikipedia-first structured knowledge viewer with a 3D connectome interface.

## What 1.0 Includes

- Live Wikipedia search that can spawn a new topic graph
- A dense 3D connectome visualization with orbit, pan, zoom, and focus
- Foldered vault navigation derived from the active graph
- Real Wikipedia note reading in the right-side pane
- Graph diagnostics in the Inspector tab
- A responsive dark workspace inspired by knowledge tools and connectome imagery

## Product Scope

The Vault 1.0 is intentionally focused on Wikipedia as the original source layer.

- Wikipedia pages are the source notes
- The vault sidebar organizes the active graph into folders
- The 3D view visualizes cross-links as a neural graph
- The note pane is used for source reading and inspection

## Run Locally

From this folder:

```bash
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

## Interaction Model

- Type in `Find note` to filter the current graph and fetch live Wikipedia suggestions
- Press `Enter` to build a new live graph from the most relevant result
- Click a suggestion to build a graph from that page directly
- Drag empty space to pan
- Right-drag to orbit
- Use the mouse wheel or trackpad scroll to zoom
- Click sparks or note labels to focus a page

## Notes

- Wikipedia requests are live, so first-load graph expansion can take a few seconds
- The app is browser-based and does not require a build step
- Vendor dependencies are bundled locally in `vendor/`
