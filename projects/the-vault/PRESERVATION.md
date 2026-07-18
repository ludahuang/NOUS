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

## Remote Branch Verification

Verified again on 2026-07-18 from a clean detached worktree created directly
from `origin/codex/nous-root-architecture` at commit `69b2e56`.

Source-tree comparison against `origin/agent`:

- source files: 95;
- imported runtime files: 95;
- missing files: 0;
- unexpected files: 0;
- unexpected changed files: 0;
- intentional documentation link repairs: 3.

The clean remote checkout passed:

- catalog validation: 9 records, 9 unique IDs, 33 local Markdown links;
- Agent smoke with Playwright `1.58.2`;
- full stability smoke with Playwright `1.58.2`;
- local note creation, Agent bridge creation, export, and reset;
- default reset state: 43 Wikipedia pages and 0 retained smoke notes.

The subtree merge commit `87ec6c2` has `fa5d23e` as its second parent. The
remote `agent` branch and `the-vault/v2-agentic` tag both resolve to that same
reviewed baseline.

## Preservation Rule

Do not delete duplicated releases or the archived alpha until:

1. the active imported app passes both smoke suites; **verified 2026-07-17**
2. the packaged release is byte- or behavior-verified;
3. deployment works from the new root workflow;
4. release tags and durable downloadable artifacts exist;
5. an explicit cleanup commit records every removed path.
