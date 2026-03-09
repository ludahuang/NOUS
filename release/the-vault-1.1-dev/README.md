# The Vault 1.1-dev

The Vault 1.1-dev is the packaged release snapshot of the current build. It keeps Wikipedia as the original live source, layers imported Obsidian markdown into the same 3D connectome, and can export the current graph back out as an Obsidian-compatible vault.

## What 1.1-dev Includes

- Live Wikipedia search that can discover and rebuild a new topic graph
- A dense 3D connectome visualization with orbit, pan, zoom, and focus
- Foldered vault navigation derived from the active graph
- Obsidian markdown import merged into the current graph
- Local note drafting with Wikipedia fallback for duplicate titles
- A `Download Vault` export that packages the current graph as an Obsidian-ready zip
- A responsive dark workspace inspired by knowledge tools and connectome imagery

## Product Scope

- Wikipedia pages are the canonical live source notes
- Imported Obsidian markdown can merge into or extend the current neural network
- The vault sidebar organizes the active graph into folders
- The 3D view visualizes cross-links as a neural graph
- The note pane is used for source reading, local editing, and graph inspection

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

- Wikipedia requests are live, so graph discovery and expansion can take a few seconds
- Import overlap is merged by note title into the loaded Wikipedia graph and annotated in `Note.md`
- The app is browser-based and does not require a build step
- Vendor dependencies are bundled locally in `vendor/`
