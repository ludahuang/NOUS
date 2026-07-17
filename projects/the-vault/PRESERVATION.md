# The Vault Preservation Record

## Imported Baseline

- source repository: `ludahuang/NOUS`
- source branch: `agent`
- source commit: `fa5d23ebe91ff1e73fae5e3f6782bf2ecf5dcbe8`
- import method: Git subtree without squash
- destination: `projects/the-vault/runtime/`
- import date: 2026-07-17

The subtree merge keeps the original Agent commits as a second parent history.

## Excluded Working Material

The separate Agent worktree contained uncommitted paths at migration time:

```text
scripts/build-psychology-genealogy-vault.mjs
vaults/
```

They were intentionally excluded because a preservation import must use a
reviewed commit rather than a dirty working tree.

## Runtime Contents

The imported runtime includes:

- the active static connectome app;
- agent and stabilization smoke tests;
- packaged The Vault releases;
- the archived 2.0-alpha cloud experiment;
- project documentation and screenshots;
- the historical Pages workflow.

## Verification

Verified locally on 2026-07-17 with:

- Node.js `24.14.0`;
- Playwright `1.58.2`, matching `package-lock.json`;
- Chromium / headless shell revision `1208`;
- `npm run smoke:agent` equivalent through pnpm;
- `npm run smoke:stability` equivalent through pnpm.

Results:

- Agent smoke: passed;
- full stability smoke: passed;
- bridge discovery returned three suggestions;
- manual and Agent-authored notes were saved into the graph;
- Obsidian-compatible export completed;
- reset restored the default 43-page graph with no retained smoke notes.

## Preservation Rule

Do not delete duplicated releases or the archived alpha until:

1. the active imported app passes both smoke suites; **verified 2026-07-17**
2. the packaged release is byte- or behavior-verified;
3. deployment works from the new root workflow;
4. release tags and durable downloadable artifacts exist;
5. an explicit cleanup commit records every removed path.
