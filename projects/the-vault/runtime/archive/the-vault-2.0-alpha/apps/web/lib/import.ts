import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { query, withTransaction } from "@/lib/db";
import { getJsonObject, putJsonObject } from "@/lib/storage";
import { getVaultForUser } from "@/lib/workspace";

type ImportFilePayload = {
  name: string;
  relativePath: string;
  markdown: string;
};

type ParsedImportDraft = {
  title: string;
  relativePath: string;
  folderPath: string;
  markdown: string;
  tags: string[];
  aliases: string[];
  excerpt: string;
};

type ExistingNoteRow = {
  id: string;
  title: string;
  relative_path: string;
  folder_path: string;
  markdown: string;
  tags: string[];
  aliases: string[];
  current_revision_number: number;
};

type ImportRunRow = {
  id: string;
  vault_id: string;
  requested_by_user_id: string;
  status: string;
  import_name: string;
  file_count: number;
  storage_key: string | null;
  metadata_json: Record<string, unknown> | null;
  error_message: string | null;
  created_at: Date;
};

type ImportProcessResult = {
  importName: string;
  fileCount: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  preferredNoteId: string;
  importedTitles: string[];
  addedTitles: string[];
  updatedTitles: string[];
  skippedTitles: string[];
};

export type ImportRunSummary = {
  id: string;
  status: string;
  importName: string;
  fileCount: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  createdAt: string;
  completedAt: string | null;
  importedTitles: string[];
  addedTitles: string[];
  updatedTitles: string[];
  skippedTitles: string[];
  preferredNoteId: string;
  errorMessage: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function toArray(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseFrontmatterScalar(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }

  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseFrontmatterBlock(block: string) {
  const data: Record<string, string | string[]> = {};
  let activeKey = "";

  block.split(/\r?\n/).forEach((line) => {
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && activeKey) {
      if (!Array.isArray(data[activeKey])) {
        data[activeKey] = [];
      }
      (data[activeKey] as string[]).push(
        listMatch[1].trim().replace(/^['"]|['"]$/g, ""),
      );
      return;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      activeKey = "";
      return;
    }

    const [, key, rawValue] = match;
    activeKey = key;
    data[key] = rawValue.trim() ? parseFrontmatterScalar(rawValue) : [];
  });

  return data;
}

function splitFrontmatter(markdown: string) {
  const normalized = String(markdown || "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    return {
      frontmatter: {} as Record<string, string | string[]>,
      body: normalized,
    };
  }

  return {
    frontmatter: parseFrontmatterBlock(match[1]),
    body: normalized.slice(match[0].length),
  };
}

function stripMarkdown(markdown: string) {
  return normalizeWhitespace(
    String(markdown || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_match, target, alias) => alias || target)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/\|/g, " ")
      .replace(/\n+/g, " "),
  );
}

function excerptText(value: string, maxLength = 220) {
  const plainText = normalizeWhitespace(stripMarkdown(value));

  if (!plainText) {
    return "";
  }

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength - 1).trimEnd()}…`;
}

function extractHashTags(markdown: string) {
  return uniqueValues(
    [...String(markdown || "").matchAll(/(^|\s)#([A-Za-z0-9/_-]+)/g)].map((match) =>
      normalizeWhitespace(match[2].replace(/\//g, ":")),
    ),
  );
}

function extractWikiLinks(markdown: string) {
  const links: string[] = [];
  const matches = String(markdown || "").matchAll(/\[\[([^\]]+)\]\]/g);

  for (const match of matches) {
    const normalized = normalizeWhitespace(
      match[1]
        .split("|")[0]
        .split("#")[0]
        .replace(/\.(md|markdown)$/i, ""),
    );

    if (normalized) {
      links.push(normalized);
    }
  }

  return uniqueValues(links);
}

function extractMarkdownNoteLinks(markdown: string) {
  const links: string[] = [];
  const matches = String(markdown || "").matchAll(/\[[^\]]*]\(([^)]+)\)/g);

  for (const match of matches) {
    const rawTarget = decodeURIComponent(match[1].trim().split("#")[0] || "");
    if (!/\.(md|markdown)$/i.test(rawTarget)) {
      continue;
    }

    const normalized = normalizeWhitespace(
      rawTarget
        .replace(/\\/g, "/")
        .split("/")
        .pop()
        ?.replace(/\.(md|markdown)$/i, "")
        .replace(/[_-]+/g, " ") || "",
    );

    if (normalized) {
      links.push(normalized);
    }
  }

  return uniqueValues(links);
}

function normalizeLookupKey(value: string) {
  return normalizeWhitespace(
    String(value || "")
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.(md|markdown)$/i, "")
      .replace(/[_-]+/g, " "),
  ).toLowerCase();
}

function normalizeRelativePath(value: string) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

function getCommonRootName(paths: string[]) {
  const rootedPaths = paths.filter((value) => value.includes("/"));

  if (!rootedPaths.length) {
    return "";
  }

  const root = rootedPaths[0].split("/")[0];
  return rootedPaths.every((value) => value.startsWith(`${root}/`)) ? root : "";
}

function parseImportedDraft(
  file: ImportFilePayload,
  index: number,
  rootName: string,
): ParsedImportDraft {
  const rawPath = normalizeRelativePath(file.relativePath || file.name);
  const relativePath =
    rootName && rawPath.startsWith(`${rootName}/`)
      ? rawPath.slice(rootName.length + 1)
      : rawPath;
  const pathParts = relativePath.split("/").filter(Boolean);
  const fileName = pathParts[pathParts.length - 1] || file.name;
  const baseName = fileName.replace(/\.(md|markdown)$/i, "");
  const folderPath = pathParts.slice(0, -1).join("/") || "Imported";
  const { frontmatter, body } = splitFrontmatter(file.markdown);
  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1] || "";
  const title = normalizeWhitespace(
    String(frontmatter.title || firstHeading || baseName.replace(/[_-]+/g, " ")),
  ) || `Untitled ${index + 1}`;
  const aliases = uniqueValues(
    toArray(frontmatter.aliases || frontmatter.alias).map((alias) =>
      normalizeWhitespace(String(alias)),
    ),
  );
  const tags = uniqueValues([
    ...toArray(frontmatter.tags).map((tag) =>
      normalizeWhitespace(String(tag).replace(/^#/, "")),
    ),
    ...extractHashTags(body),
  ]);
  const excerpt =
    excerptText(String(frontmatter.description || body), 320) ||
    `${title} imported from markdown.`;

  return {
    title,
    relativePath:
      normalizeRelativePath(relativePath) ||
      `${folderPath}/${slugify(title) || `untitled-${index + 1}`}.md`,
    folderPath,
    markdown: String(file.markdown || "").replace(/\r\n/g, "\n"),
    tags,
    aliases,
    excerpt,
  };
}

function pathsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item === right[index]);
}

function chooseAvailableRelativePath(
  proposedPath: string,
  usedPaths: Map<string, string>,
  noteId = "",
) {
  const normalizedBase = normalizeRelativePath(proposedPath) || "Imported/untitled.md";
  const extensionMatch = normalizedBase.match(/(\.[^.]+)$/);
  const extension = extensionMatch?.[1] || ".md";
  const basePath = extensionMatch
    ? normalizedBase.slice(0, -extension.length)
    : normalizedBase;
  let candidate = `${basePath}${extension}`;
  let counter = 2;

  while (true) {
    const ownerId = usedPaths.get(candidate.toLowerCase());
    if (!ownerId || ownerId === noteId) {
      return candidate;
    }

    candidate = `${basePath}-${counter}${extension}`;
    counter += 1;
  }
}

async function rebuildVaultEdges(client: PoolClient, vaultId: string) {
  const notesResult = await client.query<{
    id: string;
    title: string;
    relative_path: string;
    markdown: string;
  }>(
    `
      SELECT id, title, relative_path, markdown
      FROM notes
      WHERE vault_id = $1
    `,
    [vaultId],
  );

  const keyToId = new Map<string, string>();
  notesResult.rows.forEach((note) => {
    keyToId.set(normalizeLookupKey(note.title), note.id);
    keyToId.set(normalizeLookupKey(note.relative_path), note.id);
    const fileName = note.relative_path.split("/").pop() || "";
    if (fileName) {
      keyToId.set(normalizeLookupKey(fileName), note.id);
    }
  });

  const edgeKeys = new Map<string, { fromNoteId: string; toNoteId: string }>();
  notesResult.rows.forEach((note) => {
    const links = uniqueValues([
      ...extractWikiLinks(note.markdown),
      ...extractMarkdownNoteLinks(note.markdown),
    ]);

    links.forEach((link) => {
      const targetId = keyToId.get(normalizeLookupKey(link));
      if (!targetId || targetId === note.id) {
        return;
      }

      edgeKeys.set(`${note.id}:${targetId}`, {
        fromNoteId: note.id,
        toNoteId: targetId,
      });
    });
  });

  await client.query(
    `
      DELETE FROM edges
      WHERE vault_id = $1
    `,
    [vaultId],
  );

  for (const edge of edgeKeys.values()) {
    await client.query(
      `
        INSERT INTO edges (id, vault_id, from_note_id, to_note_id, edge_type, weight)
        VALUES ($1, $2, $3, $4, 'wikilink', 1)
      `,
      [randomUUID(), vaultId, edge.fromNoteId, edge.toNoteId],
    );
  }
}

async function applyImportDrafts(
  client: PoolClient,
  userId: string,
  vaultId: string,
  markdownFiles: ImportFilePayload[],
): Promise<ImportProcessResult> {
  const existingNotesResult = await client.query<ExistingNoteRow>(
    `
      SELECT
        id,
        title,
        relative_path,
        folder_path,
        markdown,
        tags,
        aliases,
        current_revision_number
      FROM notes
      WHERE vault_id = $1
    `,
    [vaultId],
  );

  const relativePathOwners = new Map<string, string>();
  const titleBuckets = new Map<string, string[]>();
  const noteState = new Map<string, ExistingNoteRow>();

  existingNotesResult.rows.forEach((note) => {
    noteState.set(note.id, note);
    relativePathOwners.set(note.relative_path.toLowerCase(), note.id);
    const key = normalizeLookupKey(note.title);
    titleBuckets.set(key, [...(titleBuckets.get(key) || []), note.id]);
  });

  const rootName = getCommonRootName(
    markdownFiles.map((file) => normalizeRelativePath(file.relativePath || file.name)),
  );
  const importName = rootName || "Imported Vault";
  const drafts = markdownFiles.map((file, index) =>
    parseImportedDraft(file, index, rootName),
  );

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let preferredNoteId = "";
  const importedTitles: string[] = [];
  const addedTitles: string[] = [];
  const updatedTitles: string[] = [];
  const skippedTitles: string[] = [];

  for (const draft of drafts) {
    const directPathMatch = relativePathOwners.get(draft.relativePath.toLowerCase()) || "";
    const titleMatchIds = titleBuckets.get(normalizeLookupKey(draft.title)) || [];
    const uniqueTitleMatchId = titleMatchIds.length === 1 ? titleMatchIds[0] : "";
    const matchedNoteId = directPathMatch || uniqueTitleMatchId;
    const existing = matchedNoteId ? noteState.get(matchedNoteId) || null : null;
    const relativePath = chooseAvailableRelativePath(
      draft.relativePath,
      relativePathOwners,
      existing?.id || "",
    );
    const slug =
      slugify(relativePath.replace(/\.(md|markdown)$/i, "").replace(/\//g, " ")) ||
      "untitled";

    if (existing) {
      const isUnchanged =
        existing.title === draft.title &&
        existing.relative_path === relativePath &&
        existing.folder_path === draft.folderPath &&
        existing.markdown === draft.markdown &&
        pathsEqual(existing.tags || [], draft.tags) &&
        pathsEqual(existing.aliases || [], draft.aliases);

      if (isUnchanged) {
        skippedCount += 1;
        skippedTitles.push(draft.title);
        continue;
      }

      const nextRevisionNumber = existing.current_revision_number + 1;

      await client.query(
        `
          UPDATE notes
          SET title = $2,
              slug = $3,
              relative_path = $4,
              folder_path = $5,
              markdown = $6,
              excerpt = $7,
              tags = $8::jsonb,
              aliases = $9::jsonb,
              current_revision_number = $10,
              last_edited_by_user_id = $11,
              updated_at = NOW()
          WHERE id = $1
        `,
        [
          existing.id,
          draft.title,
          slug,
          relativePath,
          draft.folderPath,
          draft.markdown,
          draft.excerpt,
          JSON.stringify(draft.tags),
          JSON.stringify(draft.aliases),
          nextRevisionNumber,
          userId,
        ],
      );

      await client.query(
        `
          INSERT INTO note_revisions (
            id,
            note_id,
            vault_id,
            editor_user_id,
            revision_number,
            title,
            relative_path,
            folder_path,
            markdown,
            excerpt,
            tags,
            aliases,
            edit_summary
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11::jsonb,
            $12::jsonb,
            $13
          )
        `,
        [
          randomUUID(),
          existing.id,
          vaultId,
          userId,
          nextRevisionNumber,
          draft.title,
          relativePath,
          draft.folderPath,
          draft.markdown,
          draft.excerpt,
          JSON.stringify(draft.tags),
          JSON.stringify(draft.aliases),
          "Imported markdown update",
        ],
      );

      relativePathOwners.delete(existing.relative_path.toLowerCase());
      relativePathOwners.set(relativePath.toLowerCase(), existing.id);
      noteState.set(existing.id, {
        ...existing,
        title: draft.title,
        relative_path: relativePath,
        folder_path: draft.folderPath,
        markdown: draft.markdown,
        tags: draft.tags,
        aliases: draft.aliases,
        current_revision_number: nextRevisionNumber,
      });
      preferredNoteId = preferredNoteId || existing.id;
      importedTitles.push(draft.title);
      updatedTitles.push(draft.title);
      updatedCount += 1;
      continue;
    }

    const noteId = randomUUID();

    await client.query(
      `
        INSERT INTO notes (
          id,
          vault_id,
          owner_user_id,
          slug,
          title,
          relative_path,
          folder_path,
          markdown,
          excerpt,
          tags,
          aliases,
          current_revision_number,
          last_edited_by_user_id
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10::jsonb,
          $11::jsonb,
          $12,
          $13
        )
      `,
      [
        noteId,
        vaultId,
        userId,
        slug,
        draft.title,
        relativePath,
        draft.folderPath,
        draft.markdown,
        draft.excerpt,
        JSON.stringify(draft.tags),
        JSON.stringify(draft.aliases),
        1,
        userId,
      ],
    );

    await client.query(
      `
        INSERT INTO note_revisions (
          id,
          note_id,
          vault_id,
          editor_user_id,
          revision_number,
          title,
          relative_path,
          folder_path,
          markdown,
          excerpt,
          tags,
          aliases,
          edit_summary
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          1,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10::jsonb,
          $11::jsonb,
          $12
        )
      `,
      [
        randomUUID(),
        noteId,
        vaultId,
        userId,
        draft.title,
        relativePath,
        draft.folderPath,
        draft.markdown,
        draft.excerpt,
        JSON.stringify(draft.tags),
        JSON.stringify(draft.aliases),
        "Imported markdown note",
      ],
    );

    noteState.set(noteId, {
      id: noteId,
      title: draft.title,
      relative_path: relativePath,
      folder_path: draft.folderPath,
      markdown: draft.markdown,
      tags: draft.tags,
      aliases: draft.aliases,
      current_revision_number: 1,
    });
    relativePathOwners.set(relativePath.toLowerCase(), noteId);
    const titleKey = normalizeLookupKey(draft.title);
    titleBuckets.set(titleKey, [...(titleBuckets.get(titleKey) || []), noteId]);
    preferredNoteId = preferredNoteId || noteId;
    importedTitles.push(draft.title);
    addedTitles.push(draft.title);
    addedCount += 1;
  }

  await rebuildVaultEdges(client, vaultId);

  return {
    importName,
    fileCount: markdownFiles.length,
    addedCount,
    updatedCount,
    skippedCount,
    preferredNoteId,
    importedTitles,
    addedTitles,
    updatedTitles,
    skippedTitles,
  };
}

export async function queueMarkdownImportForUser(
  userId: string,
  vaultId: string,
  files: ImportFilePayload[],
) {
  const vault = await getVaultForUser(userId, vaultId);

  if (!vault) {
    throw new Error("Vault not found.");
  }

  const markdownFiles = files.filter((file) => /\.(md|markdown)$/i.test(file.name));
  if (!markdownFiles.length) {
    throw new Error("No markdown files were found in the imported selection.");
  }

  const rootName = getCommonRootName(
    markdownFiles.map((file) => normalizeRelativePath(file.relativePath || file.name)),
  );
  const importName = rootName || vault.name || "Imported Vault";
  const importRunId = randomUUID();
  const storageKey = `imports/${vaultId}/${importRunId}/payload.json`;

  await putJsonObject(storageKey, {
    files: markdownFiles,
  });

  await query(
    `
      INSERT INTO import_runs (
        id,
        vault_id,
        requested_by_user_id,
        status,
        import_name,
        file_count,
        storage_key,
        metadata_json
      )
      VALUES (
        $1,
        $2,
        $3,
        'queued',
        $4,
        $5,
        $6,
        $7::jsonb
      )
    `,
    [
      importRunId,
      vaultId,
      userId,
      importName,
      markdownFiles.length,
      storageKey,
      JSON.stringify({
        rootName,
      }),
    ],
  );

  return {
    importRunId,
    importName,
    fileCount: markdownFiles.length,
  };
}

export async function processImportRun(importRunId: string) {
  const claimed = await query<ImportRunRow>(
    `
      UPDATE import_runs
      SET status = 'processing',
          started_at = NOW(),
          error_message = NULL
      WHERE id = $1
        AND status IN ('queued', 'failed')
      RETURNING *
    `,
    [importRunId],
  );

  if (!claimed.rows[0]) {
    const existing = await query<ImportRunRow>(
      `
        SELECT *
        FROM import_runs
        WHERE id = $1
        LIMIT 1
      `,
      [importRunId],
    );

    const row = existing.rows[0];
    if (!row) {
      throw new Error("Import run not found.");
    }

    if (row.status === "succeeded") {
      return getImportRunSummaryById(row.id);
    }

    return null;
  }

  const run = claimed.rows[0];

  try {
    const payload = await getJsonObject<{ files: ImportFilePayload[] }>(
      run.storage_key || "",
    );

    const result = await withTransaction(async (client) =>
      applyImportDrafts(client, run.requested_by_user_id, run.vault_id, payload.files || []),
    );

    await query(
      `
        UPDATE import_runs
        SET status = 'succeeded',
            import_name = $2,
            file_count = $3,
            added_count = $4,
            updated_count = $5,
            skipped_count = $6,
            metadata_json = $7::jsonb,
            completed_at = NOW(),
            error_message = NULL
        WHERE id = $1
      `,
      [
        run.id,
        result.importName,
        result.fileCount,
        result.addedCount,
        result.updatedCount,
        result.skippedCount,
        JSON.stringify({
          rootName: run.metadata_json?.rootName || "",
          importedTitles: result.importedTitles.slice(0, 12),
          addedTitles: result.addedTitles.slice(0, 12),
          updatedTitles: result.updatedTitles.slice(0, 12),
          skippedTitles: result.skippedTitles.slice(0, 12),
          preferredNoteId: result.preferredNoteId,
        }),
      ],
    );

    return getImportRunSummaryById(run.id);
  } catch (error) {
    await query(
      `
        UPDATE import_runs
        SET status = 'failed',
            error_message = $2,
            completed_at = NOW()
        WHERE id = $1
      `,
      [
        run.id,
        error instanceof Error ? error.message : "Import processing failed.",
      ],
    );

    throw error;
  }
}

async function getImportRunSummaryById(importRunId: string) {
  const result = await query<{
    id: string;
    status: string;
    import_name: string;
    file_count: number;
    added_count: number;
    updated_count: number;
    skipped_count: number;
    metadata_json: Record<string, unknown> | null;
    error_message: string | null;
    created_at: Date;
    completed_at: Date | null;
  }>(
    `
      SELECT
        id,
        status,
        import_name,
        file_count,
        added_count,
        updated_count,
        skipped_count,
        metadata_json,
        error_message,
        created_at,
        completed_at
      FROM import_runs
      WHERE id = $1
      LIMIT 1
    `,
    [importRunId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    importName: row.import_name,
    fileCount: row.file_count,
    addedCount: row.added_count,
    updatedCount: row.updated_count,
    skippedCount: row.skipped_count,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    importedTitles: Array.isArray(row.metadata_json?.importedTitles)
      ? row.metadata_json.importedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    addedTitles: Array.isArray(row.metadata_json?.addedTitles)
      ? row.metadata_json.addedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    updatedTitles: Array.isArray(row.metadata_json?.updatedTitles)
      ? row.metadata_json.updatedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    skippedTitles: Array.isArray(row.metadata_json?.skippedTitles)
      ? row.metadata_json.skippedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    preferredNoteId: normalizeWhitespace(String(row.metadata_json?.preferredNoteId || "")),
    errorMessage: row.error_message,
  } satisfies ImportRunSummary;
}

export async function getImportRunSummaryForUser(
  userId: string,
  vaultId: string,
  importRunId?: string | null,
): Promise<ImportRunSummary | null> {
  if (!importRunId) {
    return null;
  }

  const result = await query<{
    id: string;
    status: string;
    import_name: string;
    file_count: number;
    added_count: number;
    updated_count: number;
    skipped_count: number;
    metadata_json: Record<string, unknown> | null;
    error_message: string | null;
    created_at: Date;
    completed_at: Date | null;
  }>(
    `
      SELECT
        id,
        status,
        import_name,
        file_count,
        added_count,
        updated_count,
        skipped_count,
        metadata_json,
        error_message,
        created_at,
        completed_at
      FROM import_runs
      WHERE id = $1
        AND vault_id = $2
        AND requested_by_user_id = $3
      LIMIT 1
    `,
    [importRunId, vaultId, userId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    importName: row.import_name,
    fileCount: row.file_count,
    addedCount: row.added_count,
    updatedCount: row.updated_count,
    skippedCount: row.skipped_count,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    importedTitles: Array.isArray(row.metadata_json?.importedTitles)
      ? row.metadata_json.importedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    addedTitles: Array.isArray(row.metadata_json?.addedTitles)
      ? row.metadata_json.addedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    updatedTitles: Array.isArray(row.metadata_json?.updatedTitles)
      ? row.metadata_json.updatedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    skippedTitles: Array.isArray(row.metadata_json?.skippedTitles)
      ? row.metadata_json.skippedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    preferredNoteId: normalizeWhitespace(String(row.metadata_json?.preferredNoteId || "")),
    errorMessage: row.error_message,
  };
}

export async function listRecentImportRunsForUser(
  userId: string,
  vaultId: string,
  limit = 6,
): Promise<ImportRunSummary[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), 12)) : 6;
  const result = await query<{
    id: string;
    status: string;
    import_name: string;
    file_count: number;
    added_count: number;
    updated_count: number;
    skipped_count: number;
    metadata_json: Record<string, unknown> | null;
    error_message: string | null;
    created_at: Date;
    completed_at: Date | null;
  }>(
    `
      SELECT
        id,
        status,
        import_name,
        file_count,
        added_count,
        updated_count,
        skipped_count,
        metadata_json,
        error_message,
        created_at,
        completed_at
      FROM import_runs
      WHERE vault_id = $1
        AND requested_by_user_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `,
    [vaultId, userId, safeLimit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    status: row.status,
    importName: row.import_name,
    fileCount: row.file_count,
    addedCount: row.added_count,
    updatedCount: row.updated_count,
    skippedCount: row.skipped_count,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    importedTitles: Array.isArray(row.metadata_json?.importedTitles)
      ? row.metadata_json.importedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    addedTitles: Array.isArray(row.metadata_json?.addedTitles)
      ? row.metadata_json.addedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    updatedTitles: Array.isArray(row.metadata_json?.updatedTitles)
      ? row.metadata_json.updatedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    skippedTitles: Array.isArray(row.metadata_json?.skippedTitles)
      ? row.metadata_json.skippedTitles
          .map((title) => normalizeWhitespace(String(title)))
          .filter(Boolean)
      : [],
    preferredNoteId: normalizeWhitespace(String(row.metadata_json?.preferredNoteId || "")),
    errorMessage: row.error_message,
  }));
}

export async function getNextQueuedImportRunId() {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM import_runs
      WHERE status = 'queued'
      ORDER BY created_at ASC
      LIMIT 1
    `,
  );

  return result.rows[0]?.id || "";
}
