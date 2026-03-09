# The Vault

The current `agent` branch is marked as `v1.2-agent`.

Its active app is still the static root connectome, now carrying the next-version agent prototype. The stable baseline remains `1.1-dev` in the release snapshot.

`2.0-alpha` is frozen and archived in [archive/the-vault-2.0-alpha](/Users/mini/Documents/New%20project/archive/the-vault-2.0-alpha). It is preserved for salvage, not active product work.

## Active Build

- Live Wikipedia discovery from `Find note`
- Dense 3D connectome with orbit, pan, zoom, and focus
- Obsidian markdown import merged into the current graph
- Local note drafting with Wikipedia fallback for duplicate titles
- `Download Vault` export as an Obsidian-compatible archive
- Floating agent bubble for graph-aware summary, structure guidance, link opportunities, and Obsidian draft notes

The root app files are:

```text
index.html
styles.css
script.js
vendor/
```

The stable reference snapshot is still [release/the-vault-1.1-dev](/Users/mini/Documents/New%20project/release/the-vault-1.1-dev).

## Run Locally

From the repo root:

```bash
npm run serve
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

## Run On GitHub

`v1.1-dev` is now wired for GitHub Pages through [deploy-v1-1-dev.yml](/Users/mini/Documents/New%20project/.github/workflows/deploy-v1-1-dev.yml).

What it publishes:

```text
index.html
styles.css
script.js
vendor/
```

What still needs to happen outside this repo:

1. Push this repo to GitHub.
2. In the GitHub repo settings, set Pages to deploy from GitHub Actions.
3. Push to `main` or run the workflow manually.

The published URL will be the normal GitHub Pages address for your repo.

## Releases

Release snapshots live in:

```text
release/the-vault-1.1-dev/
release/the-vault-1.0/
```

`the-vault-1.1-dev` is the current product surface. `the-vault-1.0` preserves the earlier Wikipedia-first release.

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
