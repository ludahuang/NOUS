import Link from "next/link";
import { notFound } from "next/navigation";

import {
  acceptLinkSuggestionAction,
  acceptNoteSummaryAction,
  createVaultAction,
  queueVaultExportAction,
  rejectLinkSuggestionAction,
  rejectNoteSummaryAction,
  requestLinkSuggestionAction,
  requestNoteSummaryAction,
} from "@/app/workspace/actions";
import { SignOutButton } from "@/components/auth-buttons";
import { ImportVaultForm } from "@/components/import-vault-form";
import {
  getLinkSuggestionRunForUser,
  getSummaryRunForUser,
  listRecentAiRunsForUser,
} from "@/lib/ai";
import {
  getExportRunSummaryForUser,
  listRecentExportRunsForUser,
} from "@/lib/export";
import {
  getImportRunSummaryForUser,
  listRecentImportRunsForUser,
} from "@/lib/import";
import { getVaultNotesScreenData } from "@/lib/notes";
import { requireUserSession } from "@/lib/session";
import { getWorkspaceOverviewForUser } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type BackendQueryParams = {
  aiRunId?: string;
  exportRunId?: string;
  importRunId?: string;
  linkRunId?: string;
  noteId?: string;
};

type BackendPageProps = {
  params: Promise<{
    vaultId: string;
  }>;
  searchParams: Promise<BackendQueryParams>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "No revisions yet";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAiAction(action: string) {
  return action === "link_suggestion" ? "Link suggestion" : "Note summary";
}

function buildWorkspaceHref(
  vaultId: string,
  currentParams: BackendQueryParams,
  overrides: Record<string, string | null | undefined>,
) {
  const nextParams = new URLSearchParams();
  const merged = {
    ...currentParams,
    ...overrides,
  };

  Object.entries(merged).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();
  return query ? `/workspace/${vaultId}?${query}` : `/workspace/${vaultId}`;
}

function buildBackendHref(
  vaultId: string,
  currentParams: BackendQueryParams,
  overrides: Record<string, string | null | undefined>,
) {
  const nextParams = new URLSearchParams();
  const merged = {
    ...currentParams,
    ...overrides,
  };

  Object.entries(merged).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();
  return query ? `/workspace/${vaultId}/backend?${query}` : `/workspace/${vaultId}/backend`;
}

export default async function WorkspaceBackendPage({
  params,
  searchParams,
}: BackendPageProps) {
  const [{ vaultId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await requireUserSession();
  const requestedNoteId = resolvedSearchParams.noteId || "";
  const requestedAiRunId = resolvedSearchParams.aiRunId || "";
  const requestedLinkRunId = resolvedSearchParams.linkRunId || "";
  const requestedExportRunId = resolvedSearchParams.exportRunId || "";
  const requestedImportRunId = resolvedSearchParams.importRunId || "";

  const [
    overview,
    screenData,
    exportRun,
    importRun,
    recentExportRuns,
    recentImportRuns,
    recentAiRuns,
  ] = await Promise.all([
    getWorkspaceOverviewForUser(session.user.id),
    getVaultNotesScreenData(session.user.id, vaultId, requestedNoteId || null),
    getExportRunSummaryForUser(session.user.id, vaultId, requestedExportRunId),
    getImportRunSummaryForUser(session.user.id, vaultId, requestedImportRunId),
    listRecentExportRunsForUser(session.user.id, vaultId),
    listRecentImportRunsForUser(session.user.id, vaultId),
    listRecentAiRunsForUser(session.user.id, vaultId),
  ]);

  if (!overview || !screenData) {
    notFound();
  }

  const selectedNote = screenData.selectedNote;
  const summaryRun = selectedNote
    ? await getSummaryRunForUser(
        session.user.id,
        vaultId,
        selectedNote.id,
        requestedAiRunId,
      )
    : null;
  const linkSuggestionRun = selectedNote
    ? await getLinkSuggestionRunForUser(
        session.user.id,
        vaultId,
        selectedNote.id,
        requestedLinkRunId,
      )
    : null;
  const trustHistory = [
    ...recentImportRuns
      .filter((run) => run.id !== importRun?.id)
      .map((run) => ({ kind: "import" as const, run })),
    ...recentExportRuns
      .filter((run) => run.id !== exportRun?.id)
      .map((run) => ({ kind: "export" as const, run })),
  ]
    .sort(
      (left, right) =>
        new Date(right.run.createdAt).getTime() - new Date(left.run.createdAt).getTime(),
    )
    .slice(0, 8);

  const backToWorkspaceHref = buildWorkspaceHref(vaultId, resolvedSearchParams, {
    noteId: selectedNote?.id || null,
    aiRunId: null,
    linkRunId: null,
  });

  return (
    <main className="backend-shell">
      <section className="backend-panel">
        <header className="backend-header">
          <div className="backend-header-copy">
            <p className="eyebrow">Backend dashboard</p>
            <h1>{screenData.vault.name}</h1>
            <p className="lede">
              Development-facing workspace controls live here so the main connectome
              surface can stay focused on graph navigation.
            </p>
          </div>
          <div className="backend-header-actions">
            <Link className="ghost-button" href={backToWorkspaceHref}>
              Back to graph
            </Link>
            <SignOutButton />
          </div>
        </header>

        <div className="backend-grid">
          <div className="backend-stack">
            <article className="info-card backend-card">
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Workspace management</p>
                  <h2>{screenData.vault.workspaceName}</h2>
                </div>
                <span className="status-pill">{overview.vaults.length} vaults</span>
              </div>

              <div className="provenance-grid">
                <div>
                  <span>Signed-in user</span>
                  <strong>{session.user.email || "Signed-in user"}</strong>
                </div>
                <div>
                  <span>Current vault</span>
                  <strong>{screenData.vault.name}</strong>
                </div>
                <div>
                  <span>Notes</span>
                  <strong>{screenData.graph.noteCount}</strong>
                </div>
                <div>
                  <span>Links</span>
                  <strong>{screenData.graph.edgeCount}</strong>
                </div>
              </div>

              <div className="backend-section">
                <strong>Private vaults</strong>
                <div className="backend-chip-list">
                  {overview.vaults.map((item) => (
                    <Link
                      className={`backend-chip ${item.id === screenData.vault.id ? "active" : ""}`}
                      href={buildBackendHref(item.id, resolvedSearchParams, {
                        aiRunId: null,
                        exportRunId: null,
                        importRunId: null,
                        linkRunId: null,
                        noteId: null,
                      })}
                      key={item.id}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <form action={createVaultAction} className="backend-inline-form">
                <input
                  aria-label="New vault name"
                  name="name"
                  placeholder="New private vault"
                  type="text"
                />
                <button className="ghost-button" type="submit">
                  Create vault
                </button>
              </form>

              <div className="backend-section">
                <strong>Import and export</strong>
                <ImportVaultForm compact vaultId={vaultId} />
                <form action={queueVaultExportAction}>
                  <input name="vaultId" type="hidden" value={vaultId} />
                  <input name="noteId" type="hidden" value={selectedNote?.id || ""} />
                  <button className="ghost-button" type="submit">
                    Export current vault
                  </button>
                </form>
              </div>
            </article>

            <div className="import-run-card backend-card">
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Latest import</p>
                  <h3>{importRun?.importName || "No import run yet"}</h3>
                </div>
                {importRun ? <span className="status-pill">{importRun.status}</span> : null}
              </div>
              <p className="import-run-copy">
                {importRun
                  ? importRun.status === "queued"
                    ? `${importRun.fileCount} file${importRun.fileCount === 1 ? "" : "s"} queued for canonical import.`
                    : importRun.status === "processing"
                      ? `${importRun.fileCount} file${importRun.fileCount === 1 ? "" : "s"} are being merged into canonical notes.`
                      : importRun.status === "failed"
                        ? importRun.errorMessage || "The import failed."
                        : `${importRun.fileCount} file${importRun.fileCount === 1 ? "" : "s"} processed: ${importRun.addedCount} added, ${importRun.updatedCount} merged, ${importRun.skippedCount} unchanged.`
                  : "Import markdown or an Obsidian folder here to start building the canonical vault history."}
              </p>
            </div>

            <div className="import-run-card backend-card">
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Latest export</p>
                  <h3>{exportRun?.archiveName || "No export run yet"}</h3>
                </div>
                {exportRun ? <span className="status-pill">{exportRun.status}</span> : null}
              </div>
              <p className="import-run-copy">
                {exportRun
                  ? exportRun.status === "queued"
                    ? "Export queued for packaging."
                    : exportRun.status === "processing"
                      ? "Export is building a stored archive from the current vault."
                      : exportRun.status === "failed"
                        ? exportRun.errorMessage || "The export failed."
                        : `${exportRun.noteCount} note${exportRun.noteCount === 1 ? "" : "s"} packaged into ${exportRun.fileCount} file${exportRun.fileCount === 1 ? "" : "s"}.`
                  : "Run an export here when you want an Obsidian-ready archive of the current vault."}
              </p>
              {exportRun?.status === "succeeded" ? (
                <div className="panel-action-row">
                  <a className="ghost-button" href={exportRun.downloadHref}>
                    Download archive
                  </a>
                </div>
              ) : null}
            </div>

            <section className="run-history-panel backend-card">
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Trust log</p>
                  <h3>Recent import and export runs</h3>
                </div>
                <span>{trustHistory.length} shown</span>
              </div>
              {trustHistory.length ? (
                <div className="run-history-list">
                  {trustHistory.map((entry) => (
                    <article className="run-history-card" key={`${entry.kind}-${entry.run.id}`}>
                      <div className="panel-headline">
                        <div>
                          <p className="eyebrow">
                            {entry.kind === "import" ? "Import run" : "Export run"}
                          </p>
                          <strong>
                            {entry.kind === "import"
                              ? entry.run.importName
                              : entry.run.archiveName}
                          </strong>
                        </div>
                        <span className="status-pill">{entry.run.status}</span>
                      </div>
                      <p className="import-run-copy">
                        {entry.kind === "import"
                          ? `${entry.run.fileCount} file${entry.run.fileCount === 1 ? "" : "s"}: ${entry.run.addedCount} added, ${entry.run.updatedCount} merged, ${entry.run.skippedCount} unchanged.`
                          : `${entry.run.noteCount} note${entry.run.noteCount === 1 ? "" : "s"} packaged into ${entry.run.fileCount} file${entry.run.fileCount === 1 ? "" : "s"}.`}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="note-empty-state">
                  <p>No import or export runs have been recorded for this vault yet.</p>
                </div>
              )}
            </section>
          </div>

          <div className="backend-stack">
            <article className="info-card backend-card">
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">Selected note</p>
                  <h2>{selectedNote?.title || "Choose a note"}</h2>
                </div>
                <span className="status-pill">{screenData.notes.length} notes</span>
              </div>

              <div className="backend-note-list">
                {screenData.notes.length ? (
                  screenData.notes.map((note) => (
                    <Link
                      className={`backend-note-link ${selectedNote?.id === note.id ? "active" : ""}`}
                      href={buildBackendHref(vaultId, resolvedSearchParams, {
                        aiRunId: null,
                        linkRunId: null,
                        noteId: note.id,
                      })}
                      key={note.id}
                    >
                      <strong>{note.title}</strong>
                      <span>{note.sourceLabel} • r{note.revisionCount}</span>
                    </Link>
                  ))
                ) : (
                  <div className="note-empty-state">
                    <p>No notes exist in this vault yet.</p>
                    <p>Import markdown or create notes in the graph workspace first.</p>
                  </div>
                )}
              </div>
            </article>

            {selectedNote ? (
              <>
                <div className="source-callout backend-card">
                  <strong>Selected note provenance</strong>
                  <div className="provenance-grid">
                    <div>
                      <span>Source</span>
                      <strong>{selectedNote.sourceLabel}</strong>
                    </div>
                    <div>
                      <span>Path</span>
                      <strong>{selectedNote.relativePath}</strong>
                    </div>
                    <div>
                      <span>Folder</span>
                      <strong>{selectedNote.folderPath}</strong>
                    </div>
                    <div>
                      <span>Updated</span>
                      <strong>{formatDate(selectedNote.updatedAt)}</strong>
                    </div>
                  </div>
                </div>

                <div className="source-callout ai-review-card backend-card">
                  <div className="panel-headline">
                    <div>
                      <strong>AI summary review</strong>
                      <p>Generate a reviewed summary for the active note.</p>
                    </div>
                    {summaryRun ? <span className="status-pill">{summaryRun.status}</span> : null}
                  </div>

                  <div className="panel-action-row">
                    <form action={requestNoteSummaryAction}>
                      <input name="vaultId" type="hidden" value={vaultId} />
                      <input name="noteId" type="hidden" value={selectedNote.id} />
                      <button className="ghost-button" type="submit">
                        Generate
                      </button>
                    </form>
                  </div>

                  {summaryRun ? (
                    <>
                      <p className="import-run-copy">
                        {summaryRun.status === "queued"
                          ? "Summary queued for processing."
                          : summaryRun.status === "processing"
                            ? "Summary is being generated from the canonical note."
                            : summaryRun.status === "failed"
                              ? summaryRun.errorMessage || "Summary generation failed."
                              : summaryRun.reviewStatus === "accepted"
                                ? "Summary was accepted into canonical revision history."
                                : "Review the generated summary and decide whether to save it into the note."}
                      </p>
                      <p className="import-run-copy">
                        Provider: {summaryRun.provider || "pending"}
                        {summaryRun.model ? ` • ${summaryRun.model}` : ""}
                      </p>
                      {summaryRun.outputMarkdown ? (
                        <pre className="ai-summary-preview">{summaryRun.outputMarkdown}</pre>
                      ) : null}
                      {summaryRun.status === "succeeded" &&
                      summaryRun.reviewStatus === "pending" ? (
                        <div className="panel-action-row">
                          <form action={acceptNoteSummaryAction}>
                            <input name="vaultId" type="hidden" value={vaultId} />
                            <input name="aiRunId" type="hidden" value={summaryRun.id} />
                            <button className="primary-button" type="submit">
                              Accept
                            </button>
                          </form>
                          <form action={rejectNoteSummaryAction}>
                            <input name="vaultId" type="hidden" value={vaultId} />
                            <input name="noteId" type="hidden" value={selectedNote.id} />
                            <input name="aiRunId" type="hidden" value={summaryRun.id} />
                            <button className="ghost-button" type="submit">
                              Reject
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <div className="source-callout ai-review-card backend-card">
                  <div className="panel-headline">
                    <div>
                      <strong>AI link review</strong>
                      <p>Suggest reviewed wikilinks for the active note.</p>
                    </div>
                    {linkSuggestionRun ? (
                      <span className="status-pill">{linkSuggestionRun.status}</span>
                    ) : null}
                  </div>

                  <div className="panel-action-row">
                    <form action={requestLinkSuggestionAction}>
                      <input name="vaultId" type="hidden" value={vaultId} />
                      <input name="noteId" type="hidden" value={selectedNote.id} />
                      <button className="ghost-button" type="submit">
                        Suggest
                      </button>
                    </form>
                  </div>

                  {linkSuggestionRun ? (
                    <>
                      <p className="import-run-copy">
                        {linkSuggestionRun.status === "queued"
                          ? "Link suggestions queued for processing."
                          : linkSuggestionRun.status === "processing"
                            ? "Link suggestions are being prepared from the current vault graph."
                            : linkSuggestionRun.status === "failed"
                              ? linkSuggestionRun.errorMessage || "Link suggestion failed."
                              : linkSuggestionRun.reviewStatus === "accepted"
                                ? "Suggested links were accepted into canonical markdown and edge history."
                                : "Review the suggested wikilinks and decide whether to merge them into the note."}
                      </p>
                      <p className="import-run-copy">
                        Provider: {linkSuggestionRun.provider || "pending"}
                        {linkSuggestionRun.model ? ` • ${linkSuggestionRun.model}` : ""}
                      </p>
                      {linkSuggestionRun.outputMarkdown ? (
                        <pre className="ai-summary-preview">{linkSuggestionRun.outputMarkdown}</pre>
                      ) : null}
                      {linkSuggestionRun.status === "succeeded" &&
                      linkSuggestionRun.reviewStatus === "pending" ? (
                        <div className="panel-action-row">
                          <form action={acceptLinkSuggestionAction}>
                            <input name="vaultId" type="hidden" value={vaultId} />
                            <input name="aiRunId" type="hidden" value={linkSuggestionRun.id} />
                            <button className="primary-button" type="submit">
                              Accept
                            </button>
                          </form>
                          <form action={rejectLinkSuggestionAction}>
                            <input name="vaultId" type="hidden" value={vaultId} />
                            <input name="noteId" type="hidden" value={selectedNote.id} />
                            <input name="aiRunId" type="hidden" value={linkSuggestionRun.id} />
                            <button className="ghost-button" type="submit">
                              Reject
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>

                {selectedNote.revisions.length ? (
                  <section className="revision-panel backend-card">
                    <div className="panel-headline">
                      <div>
                        <p className="eyebrow">Recent revisions</p>
                        <h3>{selectedNote.title}</h3>
                      </div>
                      <span>{selectedNote.revisions.length} shown</span>
                    </div>
                    <div className="revision-list">
                      {selectedNote.revisions.map((revision) => (
                        <article className="revision-card" key={revision.id}>
                          <strong>r{revision.revisionNumber}</strong>
                          <span>{formatDate(revision.createdAt)}</span>
                          <p>{revision.editSummary || "Saved without an edit summary."}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <div className="note-empty-state backend-card">
                <p>Select a note to inspect AI review state, revisions, and provenance.</p>
              </div>
            )}

            <section className="run-history-panel backend-card">
              <div className="panel-headline">
                <div>
                  <p className="eyebrow">AI audit</p>
                  <h3>Recent reviewed runs</h3>
                </div>
                <span>{recentAiRuns.length} shown</span>
              </div>
              {recentAiRuns.length ? (
                <div className="run-history-list">
                  {recentAiRuns.map((run) => (
                    <article className="run-history-card" key={`ai-${run.id}`}>
                      <div className="panel-headline">
                        <div>
                          <p className="eyebrow">{formatAiAction(run.action)}</p>
                          <strong>{run.noteTitle}</strong>
                        </div>
                        <span className="status-pill">
                          {run.status}/{run.reviewStatus}
                        </span>
                      </div>
                      <p className="import-run-copy">
                        Provider: {run.provider || "pending"}
                        {run.model ? ` • ${run.model}` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="note-empty-state">
                  <p>No AI review runs have been recorded for this vault yet.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
