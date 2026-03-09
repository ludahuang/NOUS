import { randomUUID } from "node:crypto";

import type { PoolClient, QueryResultRow } from "pg";

import { query, withTransaction } from "@/lib/db";

export type VaultNoteSummary = {
  id: string;
  title: string;
  slug: string;
  relativePath: string;
  folderPath: string;
  excerpt: string;
  sourceLabel: string;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type VaultNoteRevision = {
  id: string;
  revisionNumber: number;
  editSummary: string | null;
  createdAt: string;
};

export type VaultNoteDetail = VaultNoteSummary & {
  markdown: string;
  tags: string[];
  aliases: string[];
  sourceDocument: {
    sourceType: string;
    sourceUrl: string | null;
    title: string;
  } | null;
  revisions: VaultNoteRevision[];
};

export type VaultGraphRecord = {
  id: string;
  title: string;
  description: string;
  extract: string;
  markdown: string;
  links: string[];
  rawLinks: string[];
  sourceType: "obsidian" | "wikipedia";
  sourceLabel: string;
  relativePath: string;
  folderPath: string;
  folderName: string;
  tags: string[];
  aliases: string[];
  url: string;
};

export type VaultGraphSnapshot = {
  vaultId: string;
  vaultName: string;
  selectedNoteId: string;
  noteCount: number;
  edgeCount: number;
  records: VaultGraphRecord[];
};

export type VaultNotesScreenData = {
  vault: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    workspaceName: string;
  };
  notes: VaultNoteSummary[];
  selectedNote: VaultNoteDetail | null;
  graph: {
    noteCount: number;
    edgeCount: number;
    revisionCount: number;
    latestUpdatedAt: string | null;
  };
};

type SaveVaultNoteInput = {
  vaultId: string;
  noteId?: string | null;
  title: string;
  folderPath?: string | null;
  markdown: string;
  editSummary?: string | null;
};

type VaultRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  workspace_name: string;
};

type NoteRow = {
  id: string;
  title: string;
  slug: string;
  relative_path: string;
  folder_path: string;
  markdown: string;
  excerpt: string;
  tags: string[];
  aliases: string[];
  current_revision_number: number;
  created_at: Date;
  updated_at: Date;
  source_type: string | null;
  source_url: string | null;
  source_title: string | null;
};

type Queryable = {
  query<T extends QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<{
    rows: T[];
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
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

function normalizeFolderPath(value: string) {
  const normalized = value
    .split("/")
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean)
    .join("/");

  return normalized || "Notes";
}

function stripMarkdown(value: string) {
  return value
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|([^[\]]+))?\]\]/g, "$2$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function deriveTitle(explicitTitle: string, markdown: string) {
  const fromHeading = markdown.match(/^#\s+(.+)$/m)?.[1] || "";
  return normalizeWhitespace(explicitTitle || fromHeading || "Untitled note");
}

function extractHashTags(markdown: string) {
  return uniqueValues(
    [...markdown.matchAll(/(^|\s)#([a-z0-9/_-]+)/gi)]
      .map((match) => normalizeWhitespace(match[2].replace(/\//g, " "))),
  );
}

function extractWikiLinks(markdown: string) {
  return uniqueValues(
    [...markdown.matchAll(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|[^[\]]+)?\]\]/g)]
      .map((match) => normalizeWhitespace(match[1])),
  );
}

function extractMarkdownNoteLinks(markdown: string) {
  return uniqueValues(
    [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
      .map((match) => match[1])
      .filter((href) => !/^[a-z]+:/i.test(href) && !href.startsWith("#"))
      .map((href) => {
        const withoutFragment = href.replace(/#.*$/, "").replace(/\.(md|markdown)$/i, "");
        const lastSegment = withoutFragment.split("/").filter(Boolean).pop() || withoutFragment;
        return normalizeWhitespace(lastSegment.replace(/[_-]+/g, " "));
      }),
  );
}

function normalizeLookupKey(value: string) {
  return normalizeWhitespace(
    value
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.(md|markdown)$/i, "")
      .replace(/[_-]+/g, " "),
  ).toLowerCase();
}

function createNoteSkeleton(title: string) {
  return `# ${title}\n\n`;
}

async function getOwnedVault(
  client: Queryable,
  userId: string,
  vaultId: string,
) {
  const result = await client.query<VaultRow>(
    `
      SELECT
        vaults.id,
        vaults.name,
        vaults.slug,
        vaults.description,
        workspaces.name AS workspace_name
      FROM vaults
      INNER JOIN workspaces
        ON workspaces.id = vaults.workspace_id
      WHERE vaults.id = $1
        AND vaults.owner_user_id = $2
      LIMIT 1
    `,
    [vaultId, userId],
  );

  return result.rows[0] || null;
}

async function ensureUniqueRelativePath(
  client: PoolClient,
  vaultId: string,
  proposedPath: string,
  excludedNoteId?: string | null,
) {
  const cleanedPath = proposedPath.replace(/^\/+|\/+$/g, "") || "Notes/untitled.md";
  const extensionMatch = cleanedPath.match(/(\.[^.]+)$/);
  const extension = extensionMatch?.[1] || ".md";
  const basePath = extensionMatch ? cleanedPath.slice(0, -extension.length) : cleanedPath;
  let candidate = `${basePath}${extension}`;
  let counter = 2;

  while (true) {
    const result = await client.query<{ id: string }>(
      `
        SELECT id
        FROM notes
        WHERE vault_id = $1
          AND relative_path = $2
          AND ($3::uuid IS NULL OR id <> $3::uuid)
        LIMIT 1
      `,
      [vaultId, candidate, excludedNoteId || null],
    );

    if (!result.rows.length) {
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

    const filename = note.relative_path.split("/").pop() || "";
    if (filename) {
      keyToId.set(normalizeLookupKey(filename), note.id);
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

      const key = `${note.id}:${targetId}`;
      edgeKeys.set(key, {
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

function mapNoteSummary(row: NoteRow): VaultNoteSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    relativePath: row.relative_path,
    folderPath: row.folder_path,
    excerpt: row.excerpt,
    sourceLabel: row.source_type ? row.source_title || row.source_type : "Private vault note",
    revisionCount: row.current_revision_number,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function getVaultNotesRows(
  client: Queryable,
  vaultId: string,
) {
  const result = await client.query<NoteRow>(
    `
      SELECT
        notes.id,
        notes.title,
        notes.slug,
        notes.relative_path,
        notes.folder_path,
        notes.markdown,
        notes.excerpt,
        notes.tags,
        notes.aliases,
        notes.current_revision_number,
        notes.created_at,
        notes.updated_at,
        source_documents.source_type,
        source_documents.source_url,
        source_documents.title AS source_title
      FROM notes
      LEFT JOIN source_documents
        ON source_documents.id = notes.source_document_id
      WHERE notes.vault_id = $1
      ORDER BY notes.updated_at DESC, notes.created_at DESC
    `,
    [vaultId],
  );

  return result.rows;
}

async function getNoteDetail(
  client: Queryable,
  vaultId: string,
  noteId: string,
) {
  const notes = await getVaultNotesRows(client, vaultId);
  const row = notes.find((note) => note.id === noteId);
  if (!row) {
    return null;
  }

  const revisionsResult = await client.query<{
    id: string;
    revision_number: number;
    edit_summary: string | null;
    created_at: Date;
  }>(
    `
      SELECT id, revision_number, edit_summary, created_at
      FROM note_revisions
      WHERE note_id = $1
      ORDER BY revision_number DESC
      LIMIT 8
    `,
    [noteId],
  );

  return {
    ...mapNoteSummary(row),
    markdown: row.markdown,
    tags: row.tags || [],
    aliases: row.aliases || [],
    sourceDocument: row.source_type
      ? {
          sourceType: row.source_type,
          sourceUrl: row.source_url,
          title: row.source_title || row.title,
        }
      : null,
    revisions: revisionsResult.rows.map((revision) => ({
      id: revision.id,
      revisionNumber: revision.revision_number,
      editSummary: revision.edit_summary,
      createdAt: revision.created_at.toISOString(),
    })),
  } satisfies VaultNoteDetail;
}

export async function getVaultNotesScreenData(
  userId: string,
  vaultId: string,
  selectedNoteId?: string | null,
): Promise<VaultNotesScreenData | null> {
  const db: Queryable = { query };

  const vaultResult = await query<VaultRow>(
    `
      SELECT
        vaults.id,
        vaults.name,
        vaults.slug,
        vaults.description,
        workspaces.name AS workspace_name
      FROM vaults
      INNER JOIN workspaces
        ON workspaces.id = vaults.workspace_id
      WHERE vaults.id = $1
        AND vaults.owner_user_id = $2
      LIMIT 1
    `,
    [vaultId, userId],
  );

  const vault = vaultResult.rows[0];
  if (!vault) {
    return null;
  }

  const noteRows = await getVaultNotesRows(db, vaultId);

  const effectiveSelectedNoteId =
    selectedNoteId && noteRows.some((note) => note.id === selectedNoteId)
      ? selectedNoteId
      : noteRows[0]?.id || null;

  const selectedNote = effectiveSelectedNoteId
    ? await getNoteDetail(db, vaultId, effectiveSelectedNoteId)
    : null;

  const edgeResult = await query<{ edge_count: string }>(
    `
      SELECT COUNT(*)::text AS edge_count
      FROM edges
      WHERE vault_id = $1
    `,
    [vaultId],
  );

  const revisionResult = await query<{ revision_count: string }>(
    `
      SELECT COUNT(*)::text AS revision_count
      FROM note_revisions
      WHERE vault_id = $1
    `,
    [vaultId],
  );

  return {
    vault: {
      id: vault.id,
      name: vault.name,
      slug: vault.slug,
      description: vault.description,
      workspaceName: vault.workspace_name,
    },
    notes: noteRows.map(mapNoteSummary),
    selectedNote,
    graph: {
      noteCount: noteRows.length,
      edgeCount: Number(edgeResult.rows[0]?.edge_count || 0),
      revisionCount: Number(revisionResult.rows[0]?.revision_count || 0),
      latestUpdatedAt: noteRows[0]?.updated_at.toISOString() || null,
    },
  };
}

export async function saveVaultNoteForUser(
  userId: string,
  input: SaveVaultNoteInput,
) {
  return withTransaction(async (client) => {
    const vault = await getOwnedVault(client, userId, input.vaultId);
    if (!vault) {
      throw new Error("Vault not found.");
    }

    const normalizedMarkdown = input.markdown.trim() || createNoteSkeleton(input.title || "Untitled note");
    const { frontmatter, body } = splitFrontmatter(normalizedMarkdown);
    const title = normalizeWhitespace(
      String(frontmatter.title || deriveTitle(input.title, body || normalizedMarkdown)),
    ) || "Untitled note";
    const folderPath = normalizeFolderPath(input.folderPath || "");
    const rawRelativePath = `${folderPath}/${slugify(title) || "untitled"}.md`;
    const relativePath = await ensureUniqueRelativePath(
      client,
      input.vaultId,
      rawRelativePath,
      input.noteId || null,
    );
    const slug =
      slugify(relativePath.replace(/\.(md|markdown)$/i, "").replace(/\//g, " ")) ||
      "untitled";
    const tags = uniqueValues([
      ...toArray(frontmatter.tags).map((tag) =>
        normalizeWhitespace(String(tag).replace(/^#/, "")),
      ),
      ...extractHashTags(body),
    ]);
    const aliases = uniqueValues(
      toArray(frontmatter.aliases || frontmatter.alias).map((alias) =>
        normalizeWhitespace(String(alias)),
      ),
    );
    const excerpt =
      excerptText(String(frontmatter.description || body || normalizedMarkdown)) ||
      "Private vault note";

    const existing = input.noteId
      ? await client.query<{ id: string; current_revision_number: number }>(
          `
            SELECT id, current_revision_number
            FROM notes
            WHERE id = $1
              AND vault_id = $2
              AND owner_user_id = $3
            LIMIT 1
          `,
          [input.noteId, input.vaultId, userId],
        )
      : null;

    if (input.noteId && !existing?.rows[0]) {
      throw new Error("Note not found.");
    }

    const noteId = existing?.rows[0]?.id || randomUUID();
    const nextRevisionNumber = (existing?.rows[0]?.current_revision_number || 0) + 1;

    if (existing?.rows[0]) {
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
          noteId,
          title,
          slug,
          relativePath,
          folderPath,
          normalizedMarkdown,
          excerpt,
          JSON.stringify(tags),
          JSON.stringify(aliases),
          nextRevisionNumber,
          userId,
        ],
      );
    } else {
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
          input.vaultId,
          userId,
          slug,
          title,
          relativePath,
          folderPath,
          normalizedMarkdown,
          excerpt,
          JSON.stringify(tags),
          JSON.stringify(aliases),
          nextRevisionNumber,
          userId,
        ],
      );
    }

    const revisionId = randomUUID();

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
        revisionId,
        noteId,
        input.vaultId,
        userId,
        nextRevisionNumber,
        title,
        relativePath,
        folderPath,
        normalizedMarkdown,
        excerpt,
        JSON.stringify(tags),
        JSON.stringify(aliases),
        input.editSummary?.trim() || null,
      ],
    );

    await rebuildVaultEdges(client, input.vaultId);

    return {
      noteId,
      title,
      revisionId,
      revisionNumber: nextRevisionNumber,
    };
  });
}

export async function getVaultGraphSnapshotForUser(
  userId: string,
  vaultId: string,
  selectedNoteId = "",
): Promise<VaultGraphSnapshot | null> {
  const vaultResult = await query<VaultRow>(
    `
      SELECT
        vaults.id,
        vaults.name,
        vaults.slug,
        vaults.description,
        workspaces.name AS workspace_name
      FROM vaults
      INNER JOIN workspaces
        ON workspaces.id = vaults.workspace_id
      WHERE vaults.id = $1
        AND vaults.owner_user_id = $2
      LIMIT 1
    `,
    [vaultId, userId],
  );

  const vault = vaultResult.rows[0];
  if (!vault) {
    return null;
  }

  const noteRows = await query<NoteRow>(
    `
      SELECT
        notes.id,
        notes.title,
        notes.slug,
        notes.relative_path,
        notes.folder_path,
        notes.markdown,
        notes.excerpt,
        notes.tags,
        notes.aliases,
        notes.current_revision_number,
        notes.created_at,
        notes.updated_at,
        source_documents.source_type,
        source_documents.source_url,
        source_documents.title AS source_title
      FROM notes
      LEFT JOIN source_documents
        ON source_documents.id = notes.source_document_id
      WHERE notes.vault_id = $1
      ORDER BY notes.updated_at DESC
    `,
    [vaultId],
  );

  const edgeRows = await query<{
    from_note_id: string;
    to_note_id: string;
    target_title: string;
  }>(
    `
      SELECT
        edges.from_note_id,
        edges.to_note_id,
        target.title AS target_title
      FROM edges
      INNER JOIN notes AS target
        ON target.id = edges.to_note_id
      WHERE edges.vault_id = $1
    `,
    [vaultId],
  );

  const outgoingTitles = new Map<string, string[]>();
  edgeRows.rows.forEach((edge) => {
    const current = outgoingTitles.get(edge.from_note_id) || [];
    current.push(edge.target_title);
    outgoingTitles.set(edge.from_note_id, current);
  });

  const safeSelectedNoteId = noteRows.rows.some((note) => note.id === selectedNoteId)
    ? selectedNoteId
    : noteRows.rows[0]?.id || "";

  return {
    vaultId: vault.id,
    vaultName: vault.name,
    selectedNoteId: safeSelectedNoteId,
    noteCount: noteRows.rows.length,
    edgeCount: edgeRows.rows.length,
    records: noteRows.rows.map((note) => ({
      id: note.id,
      title: note.title,
      description: note.source_type ? `${note.source_title || note.source_type} source` : "Private vault note",
      extract: note.excerpt,
      markdown: note.markdown,
      links: uniqueValues(outgoingTitles.get(note.id) || []),
      rawLinks: uniqueValues(outgoingTitles.get(note.id) || []),
      sourceType: note.source_type ? "wikipedia" : "obsidian",
      sourceLabel: note.source_type ? note.source_title || note.source_type : "Private vault note",
      relativePath: note.relative_path,
      folderPath: note.folder_path,
      folderName: note.folder_path.split("/").pop() || note.folder_path,
      tags: note.tags || [],
      aliases: note.aliases || [],
      url: note.source_url || "",
    })),
  };
}
