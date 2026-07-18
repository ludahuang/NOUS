import Link from "next/link";
import { notFound } from "next/navigation";

import {
  saveVaultNoteAction,
} from "@/app/workspace/actions";
import { SignOutButton } from "@/components/auth-buttons";
import { ImportVaultForm } from "@/components/import-vault-form";
import { RandomNoteButton } from "@/components/random-note-button";
import {
  getExportRunSummaryForUser,
} from "@/lib/export";
import {
  getImportRunSummaryForUser,
} from "@/lib/import";
import { getVaultNotesScreenData, type VaultNoteSummary } from "@/lib/notes";
import { requireUserSession } from "@/lib/session";
import { getVaultForUser } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const LEGEND_SWATCH_COLORS = [
  "#7ba2ff",
  "#7ee4ff",
  "#c691ff",
  "#f4d26d",
  "#83efcf",
  "#ff9e7a",
  "#8fd6d2",
  "#77b1ff",
];

type WorkspaceQueryParams = {
  aiRunId?: string;
  discover?: string;
  exportRunId?: string;
  folder?: string;
  importRunId?: string;
  linkRunId?: string;
  mode?: string;
  noteId?: string;
  panel?: string;
  q?: string;
  source?: string;
};

type WorkspaceVaultPageProps = {
  params: Promise<{
    vaultId: string;
  }>;
  searchParams: Promise<WorkspaceQueryParams>;
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

function groupNotesByFolder(notes: VaultNoteSummary[]) {
  const grouped = new Map<string, VaultNoteSummary[]>();

  notes.forEach((note) => {
    const key = note.folderPath || "Notes";
    const existing = grouped.get(key) || [];
    existing.push(note);
    grouped.set(key, existing);
  });

  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function buildWorkspaceHref(
  vaultId: string,
  currentParams: WorkspaceQueryParams,
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
  currentParams: WorkspaceQueryParams,
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

function buildStageStatus({
  exportRun,
  importRun,
  noteCount,
  selectedTitle,
}: {
  exportRun: Awaited<ReturnType<typeof getExportRunSummaryForUser>>;
  importRun: Awaited<ReturnType<typeof getImportRunSummaryForUser>>;
  noteCount: number;
  selectedTitle: string;
}) {
  if (importRun) {
    if (importRun.status === "queued") {
      return `${importRun.fileCount} file${importRun.fileCount === 1 ? "" : "s"} queued for canonical import.`;
    }

    if (importRun.status === "processing") {
      return `Import is merging ${importRun.fileCount} file${importRun.fileCount === 1 ? "" : "s"} into the vault graph.`;
    }

    if (importRun.status === "failed") {
      return importRun.errorMessage || "The latest import failed.";
    }

    return `${importRun.addedCount} added, ${importRun.updatedCount} merged, ${importRun.skippedCount} unchanged in the latest import.`;
  }

  if (exportRun) {
    if (exportRun.status === "queued") {
      return "An Obsidian export archive is queued from the current canonical graph.";
    }

    if (exportRun.status === "processing") {
      return "Export is packaging the current vault into an Obsidian archive.";
    }

    if (exportRun.status === "failed") {
      return exportRun.errorMessage || "The latest export failed.";
    }

    return `${exportRun.noteCount} note${exportRun.noteCount === 1 ? "" : "s"} were packaged into the latest export archive.`;
  }

  if (selectedTitle) {
    return `Focused on "${selectedTitle}" inside a persisted graph of ${noteCount} note${noteCount === 1 ? "" : "s"}.`;
  }

  return `Persistent vault graph ready with ${noteCount} canonical note${noteCount === 1 ? "" : "s"}.`;
}

export default async function WorkspaceVaultPage({
  params,
  searchParams,
}: WorkspaceVaultPageProps) {
  const [{ vaultId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await requireUserSession();
  const mode =
    resolvedSearchParams.mode === "new"
      ? "new"
      : resolvedSearchParams.mode === "edit"
        ? "edit"
        : "view";
  const panel = resolvedSearchParams.panel === "inspector" ? "inspector" : "note";
  const sourcePanel = resolvedSearchParams.source === "obsidian" ? "obsidian" : "wikipedia";
  const requestedNoteId = resolvedSearchParams.noteId || "";
  const requestedExportRunId = resolvedSearchParams.exportRunId || "";
  const requestedImportRunId = resolvedSearchParams.importRunId || "";
  const discoverQuery = String(resolvedSearchParams.discover || resolvedSearchParams.q || "").trim();
  const folderFilter = String(resolvedSearchParams.folder || "all").trim() || "all";

  const [vault, screenData, exportRun, importRun] = await Promise.all([
    getVaultForUser(session.user.id, vaultId),
    getVaultNotesScreenData(
      session.user.id,
      vaultId,
      mode === "new" ? null : requestedNoteId,
    ),
    getExportRunSummaryForUser(session.user.id, vaultId, requestedExportRunId),
    getImportRunSummaryForUser(session.user.id, vaultId, requestedImportRunId),
  ]);

  if (!vault || !screenData) {
    notFound();
  }

  const selectedNote = mode === "new" ? null : screenData.selectedNote;
  const currentGraphFocusNoteId = selectedNote?.id || screenData.selectedNote?.id || "";

  const iframeParams = new URLSearchParams({
    embed: "graph",
    vaultDataUrl: `/api/vaults/${screenData.vault.id}/graph`,
  });

  if (currentGraphFocusNoteId) {
    iframeParams.set("selectedNoteId", currentGraphFocusNoteId);
  }
  if (discoverQuery) {
    iframeParams.set("discoverQuery", discoverQuery);
  }

  const folderOptions = [...new Set(screenData.notes.map((note) => note.folderPath))].sort(
    (left, right) => left.localeCompare(right),
  );
  const visibleNotes = screenData.notes.filter((note) =>
    folderFilter === "all" ? true : note.folderPath === folderFilter,
  );
  const groupedNotes = groupNotesByFolder(visibleNotes);
  const legendFolders = groupNotesByFolder(screenData.notes).map(([folderName, notes]) => ({
    folderName,
    count: notes.length,
  }));
  const randomNoteHrefs = visibleNotes.map((note) =>
    buildWorkspaceHref(vaultId, resolvedSearchParams, {
      aiRunId: null,
      discover: null,
      linkRunId: null,
      mode: null,
      noteId: note.id,
      q: null,
    }),
  );
  const stageStatus = buildStageStatus({
    exportRun,
    importRun,
    noteCount: screenData.graph.noteCount,
    selectedTitle: selectedNote?.title || screenData.selectedNote?.title || "",
  });
  const noteTabHref = buildWorkspaceHref(vaultId, resolvedSearchParams, {
    panel: "note",
  });
  const inspectorTabHref = buildWorkspaceHref(vaultId, resolvedSearchParams, {
    panel: "inspector",
  });
  const defaultReturnHref = buildWorkspaceHref(vaultId, resolvedSearchParams, {
    mode: null,
    panel: "note",
    noteId: screenData.selectedNote?.id || null,
  });
  const homeHref = buildWorkspaceHref(vaultId, resolvedSearchParams, {
    aiRunId: null,
    discover: null,
    exportRunId: null,
    folder: null,
    importRunId: null,
    linkRunId: null,
    mode: null,
    noteId: null,
    panel: "note",
    q: null,
    source: "wikipedia",
  });
  const backendHref = buildBackendHref(vaultId, resolvedSearchParams, {
    mode: null,
    noteId: selectedNote?.id || null,
  });
  const directExportHref = `/api/vaults/${vaultId}/export`;

  return (
    <main className="workspace-shell workspace-shell-restored">
      <div className="workspace-primary-layer">
        <aside className="vault-sidebar">
          <div className="sidebar-stack">
            <div className="sidebar-head">
              <Link className="sidebar-home-link" href={homeHref}>
                <div className="headline-row">
                  <p className="eyebrow">The Vault</p>
                  <span className="version-chip">2.0-alpha</span>
                </div>
                <h1>The Vault</h1>
                <p className="lede">Explore the connectome of knowledge.</p>
              </Link>
            </div>

            <details className="sidebar-panel control-panel sidebar-slider-panel" open>
              <summary className="sidebar-slider-summary">
                <span className="sidebar-slider-copy">
                  <span className="eyebrow">Explorer</span>
                  <strong>Search and source flow</strong>
                </span>
                <span className="sidebar-slider-meta">Live</span>
                <span className="sidebar-slider-caret" aria-hidden="true" />
              </summary>

              <div className="sidebar-slider-content">
                <div className="control-group">
                  <span>Find note</span>
                  <form className="sidebar-search-form" method="get">
                    <input
                      defaultValue={discoverQuery}
                      name="discover"
                      placeholder="Search title or topic"
                      type="search"
                    />
                    {folderFilter !== "all" ? (
                      <input name="folder" type="hidden" value={folderFilter} />
                    ) : null}
                    {panel !== "note" ? <input name="panel" type="hidden" value={panel} /> : null}
                    <input name="source" type="hidden" value="wikipedia" />
                    <button className="ghost-button" type="submit">
                      Find
                    </button>
                  </form>
                  <p className="search-meta">
                    Press Enter to clear the current canvas and build a fresh connectome from
                    the most relevant Wikipedia entry.
                  </p>
                </div>

                <div className="source-accordion" aria-label="Data sources">
                  <section
                    className={`source-accordion-item ${sourcePanel === "wikipedia" ? "active" : ""}`}
                    id="source-card-wikipedia"
                  >
                    <Link
                      aria-controls="menu-panel-wikipedia"
                      aria-expanded={sourcePanel === "wikipedia" ? "true" : "false"}
                      className={`source-accordion-trigger ${sourcePanel === "wikipedia" ? "active" : ""}`}
                      href={buildWorkspaceHref(vaultId, resolvedSearchParams, {
                        source: "wikipedia",
                      })}
                      id="menu-wikipedia"
                    >
                      Wikipedia
                    </Link>

                    <div
                      aria-hidden={sourcePanel === "wikipedia" ? "false" : "true"}
                      className="source-accordion-panel"
                      id="menu-panel-wikipedia"
                    >
                      <div className="source-accordion-panel-inner">
                        <p className="search-meta">
                          Use the active vault as a persistent source-aware atlas, jump to a
                          random note, or reset back to the current vault root.
                        </p>
                        <div className="button-row button-row-stack">
                          <RandomNoteButton className="ghost-button" hrefs={randomNoteHrefs} />
                          <Link
                            className="ghost-button"
                            href={buildWorkspaceHref(vaultId, resolvedSearchParams, {
                              aiRunId: null,
                              discover: null,
                              exportRunId: null,
                              folder: null,
                              importRunId: null,
                              linkRunId: null,
                              mode: null,
                              noteId: null,
                              panel: "note",
                              q: null,
                            })}
                          >
                            Reset
                          </Link>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section
                    className={`source-accordion-item ${sourcePanel === "obsidian" ? "active" : ""}`}
                    id="source-card-obsidian"
                  >
                    <Link
                      aria-controls="menu-panel-obsidian"
                      aria-expanded={sourcePanel === "obsidian" ? "true" : "false"}
                      className={`source-accordion-trigger ${sourcePanel === "obsidian" ? "active" : ""}`}
                      href={buildWorkspaceHref(vaultId, resolvedSearchParams, {
                        source: "obsidian",
                      })}
                      id="menu-obsidian"
                    >
                      Obsidian
                    </Link>

                    <div
                      aria-hidden={sourcePanel === "obsidian" ? "false" : "true"}
                      className="source-accordion-panel"
                      id="menu-panel-obsidian"
                    >
                      <div className="source-accordion-panel-inner">
                        <p className="search-meta">
                          Import adds markdown notes into the current neural network. New opens
                          a clean canvas for local note drafting.
                        </p>
                        <div className="button-row button-row-stack">
                          <ImportVaultForm compact vaultId={vaultId} />
                          <Link
                            className="ghost-button"
                            href={buildWorkspaceHref(vaultId, resolvedSearchParams, {
                              aiRunId: null,
                              linkRunId: null,
                              mode: "new",
                              noteId: null,
                              panel: "note",
                              source: "obsidian",
                            })}
                          >
                            New
                          </Link>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="control-group">
                  <span>Filter folder</span>
                  <form className="sidebar-filter-form" method="get">
                    {discoverQuery ? (
                      <input name="discover" type="hidden" value={discoverQuery} />
                    ) : null}
                    {panel !== "note" ? <input name="panel" type="hidden" value={panel} /> : null}
                    {sourcePanel !== "wikipedia" ? (
                      <input name="source" type="hidden" value={sourcePanel} />
                    ) : null}
                    <select defaultValue={folderFilter} name="folder">
                      <option value="all">All folders</option>
                      {folderOptions.map((folderName) => (
                        <option key={folderName} value={folderName}>
                          {folderName}
                        </option>
                      ))}
                    </select>
                    <button className="ghost-button" type="submit">
                      Apply
                    </button>
                  </form>
                </div>
              </div>
            </details>

            <details
              className="sidebar-panel tree-panel sidebar-slider-panel"
              open={visibleNotes.length <= 12}
            >
              <summary className="sidebar-slider-summary">
                <span className="sidebar-slider-copy">
                  <span className="eyebrow">Vault</span>
                  <strong>{visibleNotes.length} notes</strong>
                </span>
                <span className="sidebar-slider-meta">{groupedNotes.length} folders</span>
                <span className="sidebar-slider-caret" aria-hidden="true" />
              </summary>

              <div className="sidebar-slider-content sidebar-slider-tree">
                <div className="note-tree" aria-label="Vault notes">
                  {groupedNotes.length ? (
                    groupedNotes.map(([folderName, notes]) => (
                      <section className="note-tree-group" key={folderName}>
                        <div className="tree-folder-row">
                          <strong>{folderName}</strong>
                          <span>{notes.length}</span>
                        </div>

                        <div className="note-tree-items">
                          {notes.map((note) => (
                            <Link
                              className={`note-tree-link ${selectedNote?.id === note.id ? "active" : ""}`}
                              href={buildWorkspaceHref(vaultId, resolvedSearchParams, {
                                aiRunId: null,
                                linkRunId: null,
                                mode: null,
                                noteId: note.id,
                              })}
                              key={note.id}
                            >
                              <span className="note-tree-link-title">{note.title}</span>
                              <span className="note-tree-link-meta">
                                {note.sourceLabel} • r{note.revisionCount}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))
                  ) : (
                    <div className="note-empty-state">
                      <p>No notes match the current folder filter.</p>
                      <p>Reset the folder filter or create a new note.</p>
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        </aside>

        <section className="stage-pane">
          <section className="stage-shell">
            <header className="stage-header">
              <div className="stage-headline">
                <p className="eyebrow">3D Connectome</p>
                <h2>Live neural graph of structured knowledge.</h2>
                <p className="stage-copy">
                  Orbit, pan, zoom, and inspect pages through in-scene spark markers.
                </p>
              </div>

              <div className="stage-meta">
                <details className="stage-workspace-menu">
                  <summary className="stage-workspace-summary">
                    <span>Workspace</span>
                    <span className="stage-workspace-caret" aria-hidden="true" />
                  </summary>

                  <div className="stage-workspace-menu-panel">
                    <div className="workspace-user-meta">
                      <span>Current vault</span>
                      <strong>{vault.name}</strong>
                    </div>
                    <div className="workspace-user-meta">
                      <span>Signed-in user</span>
                      <strong>{session.user.email || "Signed-in user"}</strong>
                    </div>
                    <div className="stage-workspace-status">
                      <span>Workspace status</span>
                      <p>{stageStatus}</p>
                    </div>
                    <Link className="ghost-button" href={backendHref}>
                      Backend dashboard
                    </Link>
                    <SignOutButton />
                  </div>
                </details>

                <div className="stat-strip">
                  <div>
                    <span className="stat-label">Pages</span>
                    <strong>{screenData.graph.noteCount}</strong>
                  </div>
                  <div>
                    <span className="stat-label">Links</span>
                    <strong>{screenData.graph.edgeCount}</strong>
                  </div>
                  <div>
                    <span className="stat-label">Folders</span>
                    <strong>{folderOptions.length}</strong>
                  </div>
                </div>

                <a className="stage-action-button" href={directExportHref}>
                  Download Vault
                </a>
              </div>

              <div className="legend">
                {legendFolders.slice(0, 8).map((folder, index) => (
                  <span className="legend-chip" key={folder.folderName}>
                    <span
                      className="legend-swatch"
                      style={{
                        backgroundColor:
                          LEGEND_SWATCH_COLORS[index % LEGEND_SWATCH_COLORS.length],
                      }}
                    />
                    {folder.folderName}
                    <strong>{folder.count}</strong>
                  </span>
                ))}
              </div>
            </header>

            <div className="graph-frame">
              <iframe
                src={`/legacy/index.html?${iframeParams.toString()}`}
                title="The Vault persistent connectome bridge"
              />
            </div>
          </section>
        </section>

        <aside className="note-pane">
        <div className="tab-bar">
          <Link
            aria-selected={panel === "note" ? "true" : "false"}
            className={`tab ${panel === "note" ? "active" : ""}`}
            href={noteTabHref}
          >
            Note.md
          </Link>
          <Link
            aria-selected={panel === "inspector" ? "true" : "false"}
            className={`tab ${panel === "inspector" ? "active" : ""}`}
            href={inspectorTabHref}
          >
            Inspector
          </Link>
        </div>

        {panel === "note" ? (
          <article className="note-card note-panel note-pane-scroll">
            <div className="note-header">
              <p className="article-kicker">
                {mode === "new"
                  ? "Clean Canvas"
                  : selectedNote?.sourceLabel || "The Vault Note"}
              </p>
              <h3>
                {mode === "new"
                  ? "Draft a new note"
                  : selectedNote?.title || "Select a note from the vault"}
              </h3>

              <div className="note-header-actions">
                {selectedNote?.sourceDocument?.sourceUrl ? (
                  <a
                    className="source-link"
                    href={selectedNote.sourceDocument.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open source
                  </a>
                ) : null}
                {selectedNote && mode === "view" ? (
                  <Link
                    className="ghost-button source-link"
                    href={buildWorkspaceHref(vaultId, resolvedSearchParams, {
                      mode: "edit",
                      panel: "note",
                    })}
                  >
                    Edit note
                  </Link>
                ) : null}
                {mode !== "view" ? (
                  <Link className="ghost-button source-link" href={defaultReturnHref}>
                    Close
                  </Link>
                ) : null}
              </div>
            </div>

            {mode === "view" && selectedNote ? (
              <>
                <p className="article-summary">
                  {selectedNote.excerpt ||
                    "This note is stored canonically in PostgreSQL and rendered directly into the persistent connectome."}
                </p>

                <div className="article-body note-markdown-preview">
                  {selectedNote.markdown}
                </div>
              </>
            ) : null}

            {mode !== "view" ? (
              <section className="editor-panel restored-editor-panel">
                <div className="panel-head">
                  <p className="eyebrow">{selectedNote ? "Revision Canvas" : "Clean Canvas"}</p>
                </div>

                <p className="editor-copy">
                  Markdown is canonical here. Preserve structure, add `[[wikilinks]]`, and
                  every save writes a new revision before edges rebuild.
                </p>

                <form action={saveVaultNoteAction} className="note-editor-form">
                  <input name="vaultId" type="hidden" value={vaultId} />
                  <input name="noteId" type="hidden" value={selectedNote?.id || ""} />

                  <label className="editor-field">
                    <span>Title</span>
                    <input
                      defaultValue={selectedNote?.title || ""}
                      name="title"
                      placeholder="Connectome note title"
                      type="text"
                    />
                  </label>

                  <label className="editor-field">
                    <span>Folder</span>
                    <input
                      defaultValue={selectedNote?.folderPath || "Notes"}
                      name="folderPath"
                      placeholder="Research/Connectomics"
                      type="text"
                    />
                  </label>

                  <label className="editor-field">
                    <span>Edit summary</span>
                    <input
                      defaultValue=""
                      name="editSummary"
                      placeholder={selectedNote ? "What changed in this revision?" : "Initial capture"}
                      type="text"
                    />
                  </label>

                  <label className="editor-field editor-field-markdown">
                    <span>Markdown</span>
                    <textarea
                      defaultValue={
                        selectedNote?.markdown ||
                        "# Untitled note\n\nUse [[wikilinks]] to connect notes in the graph.\n"
                      }
                      name="markdown"
                    />
                  </label>

                  <div className="editor-actions">
                    <button className="primary-button" type="submit">
                      {selectedNote ? "Save revision" : "Create note"}
                    </button>
                    <Link className="ghost-button" href={defaultReturnHref}>
                      Close
                    </Link>
                  </div>
                </form>
              </section>
            ) : null}
          </article>
        ) : (
          <article className="note-card note-panel note-pane-scroll">
            <div className="note-header">
              <p className="article-kicker">Graph diagnostics</p>
              <h3>{selectedNote?.title || screenData.vault.name}</h3>
            </div>

            <div className="source-callout">
              <strong>Persistent workspace</strong>
              <div className="provenance-grid">
                <div>
                  <span>Workspace</span>
                  <strong>{screenData.vault.workspaceName}</strong>
                </div>
                <div>
                  <span>Vault</span>
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
                <div>
                  <span>Revisions</span>
                  <strong>{screenData.graph.revisionCount}</strong>
                </div>
                <div>
                  <span>Folders</span>
                  <strong>{folderOptions.length}</strong>
                </div>
              </div>
            </div>

            {selectedNote ? (
              <div className="source-callout">
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
                {selectedNote.tags.length ? (
                  <div className="run-title-group">
                    <span className="run-title-label">Tags</span>
                    <div className="import-chip-row">
                      {selectedNote.tags.map((tag) => (
                        <span className="import-chip" key={`tag-${tag}`}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedNote.aliases.length ? (
                  <div className="run-title-group">
                    <span className="run-title-label">Aliases</span>
                    <div className="import-chip-row">
                      {selectedNote.aliases.map((alias) => (
                        <span className="import-chip" key={`alias-${alias}`}>
                          {alias}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        )}
        </aside>
      </div>
    </main>
  );
}
