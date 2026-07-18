# RFC 0002: The Vault History Migration

Status: stage 1 implemented

Date: 2026-07-17

## Initial State

- NOUS canonical history originates on `master`.
- The Vault implementation is on remote branch `agent`.
- The histories have different root commits and no shared Git ancestor.
- The Agent working tree may contain active, uncommitted research assets and
  must not be used as the migration source.

## Goal

Preserve The Vault's meaningful commit history while placing the project behind
a clear NOUS project boundary.

## Implemented Stage 1

1. the dirty Agent worktree was inspected and its uncommitted paths were excluded;
2. the reviewed remote baseline was fixed at `fa5d23e`;
3. `git subtree` imported the unsquashed Agent history under
   `projects/the-vault/runtime/`;
4. the subtree merge preserved the original Agent commits as a second parent;
5. project and preservation records were added outside the imported runtime;
6. a manual root-level Pages workflow was added for project verification
   without claiming the NOUS public root.

## Remaining Stages

1. create and push the `the-vault/v2-agentic` tag;
2. run the Agent and stabilization smoke suites from the imported path;
   **completed 2026-07-17 with Playwright 1.58.2**
3. verify the packaged release and manually triggered Pages workflow;
4. keep the old `agent` branch read-only during the verification period;
5. normalize the runtime into `apps/`, `packages/`, and `preservation/` only
   after behavior equivalence is proven;
6. decide later whether independent ownership or deployment justifies a
   dedicated repository.

## Preferred Near-Term Choice

Keep The Vault in this repository under `projects/the-vault/` during the first
migration because it is currently small and closely coupled to the NOUS Agent
concept.

Reconsider a dedicated repository when it needs independent access control,
deployment cadence, security ownership, or a substantially different toolchain.

## Release Cleanup

The Agent branch currently keeps repeated full source snapshots under
`release/`. After preservation review:

- use tags for source versions;
- use GitHub Releases for distributable archives;
- keep preservation packages only where a born-digital work needs a frozen
  runtime, dependencies, screenshots, and checksums;
- do not delete existing snapshots until equivalence is verified.

## Non-Goals

- no force push to `agent`;
- no deletion of current releases;
- no default-branch switch during the architecture branch;
- no inclusion of uncommitted Agent worktree material;
- no release cleanup before preservation verification.

## Verification Evidence

Both imported runtime test suites passed:

```text
smoke:agent      ok
smoke:stability  ok
```

The test covered graph initialization, Wikipedia discovery, Note/Inspector
separation, local note creation, Agent bridge drafting, vault export, and reset.

On 2026-07-18, the same checks were repeated from a clean worktree created from
the pushed remote architecture branch. The imported runtime contained all 95
source files from `origin/agent`, with no missing or unexpected paths. Only
three documented Markdown-link repairs differed from the source branch.

## Follow-Up Untracked Assets

After the mother-repository merge, the Agent worktree still contained a
previously untracked Psychology Genealogy Atlas source, generator, and vault.

These files are handled in a separate migration branch rather than being
silently added to the original subtree import. The migration preserves the
original local files, compares all copied files by SHA-256, runs the generator,
and requires exact vault-output equivalence before remote merge.
