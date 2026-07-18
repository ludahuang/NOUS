# The Vault

The current `agent` branch is marked as `v2-agentic`.

Its active app is still the static root connectome, now carrying the next-version agent prototype. The stable baseline remains `1.1-dev` in the release snapshot.

`2.0-alpha` is frozen and archived in [archive/the-vault-2.0-alpha](archive/the-vault-2.0-alpha). It is preserved for salvage, not active product work.

NOUS usage is documented in [docs/agent-use.md](docs/agent-use.md).

## Active Build

- Live Wikipedia discovery from `Find note`
- Dense 3D connectome with orbit, pan, zoom, and focus
- Obsidian markdown import merged into the current graph
- Local note drafting with Wikipedia fallback for duplicate titles
- `Download Vault` export as an Obsidian-compatible archive
- `v2-agentic`: a floating graph-native agent focused on revealing missing connections and drafting bridge notes

The root app files are:

```text
index.html
styles.css
script.js
vendor/
```

The packaged `v2-agentic` snapshot is [release/the-vault-2.0-agentic](release/the-vault-2.0-agentic). The earlier stable reference remains [release/the-vault-1.1-dev](release/the-vault-1.1-dev).

## Run Locally

From the repo root:

```bash
npm run serve
```

For the root agent smoke test:

```bash
npm run smoke:agent
```

For the full `v2-agentic` stabilization smoke:

```bash
npm run smoke:stability
```

To rebuild the curated Psychology Genealogy Atlas Obsidian vault:

```bash
npm run build:psychology-vault
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

## Curated Vaults

The runtime includes a source-backed Psychology Genealogy Atlas:

```text
resources/source-materials/Psychology_Genealogy_Atlas_Obsidian.md
scripts/build-psychology-genealogy-vault.mjs
vaults/Psychology_Genealogy_Atlas/
```

The generator validates duplicate titles, missing links, self-links, graph
connectivity, cross-cluster edges, and hub statistics before writing the vault.

## Run On GitHub

The history-preserving import includes the former branch-local workflow at
[deploy-v2-agentic.yml](.github/workflows/deploy-v2-agentic.yml). The canonical
mother-repository deployment now lives at
[deploy-the-vault.yml](../../../.github/workflows/deploy-the-vault.yml).

What it publishes:

```text
/NOUS/             -> site/
/NOUS/the-vault/   -> release/the-vault-2.0-agentic/
```

The mother-repository workflow runs on pushes to `master` and can also be run
manually. The former Agent-branch workflow is retained only as migration
history and should remain disabled.

## Releases

Release snapshots live in:

```text
release/the-vault-2.0-agentic/
release/the-vault-1.1-dev/
release/the-vault-1.0/
```

`the-vault-2.0-agentic` is the packaged agent-branch release. `the-vault-1.1-dev` preserves the earlier stable product surface, and `the-vault-1.0` preserves the original Wikipedia-first release.

## Archived 2.0-alpha

The frozen cloud shell and planning docs now live in:

```text
archive/the-vault-2.0-alpha/apps/web/
archive/the-vault-2.0-alpha/docs/
```

If that work is revisited later, the archive commands are:

```bash
npm run dev:alpha
npm run build:alpha
npm run db:init:alpha
npm run worker:alpha
npm run smoke:alpha
```

That archive is intentionally not the current UI direction.
