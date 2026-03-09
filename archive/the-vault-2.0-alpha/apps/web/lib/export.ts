import { randomUUID } from "node:crypto";

import { query } from "@/lib/db";
import { getObjectBuffer, putObject } from "@/lib/storage";
import { getVaultForUser } from "@/lib/workspace";

type ExportNoteRow = {
  id: string;
  title: string;
  relative_path: string;
  folder_path: string;
  markdown: string;
  excerpt: string;
  tags: string[];
  aliases: string[];
  source_type: string | null;
  source_url: string | null;
  source_title: string | null;
};

type ExportEdgeRow = {
  from_note_id: string;
  target_title: string;
};

type ExportRunRow = {
  id: string;
  vault_id: string;
  requested_by_user_id: string;
  status: string;
  archive_name: string;
  note_count: number;
  file_count: number;
  storage_key: string | null;
  metadata_json: Record<string, unknown> | null;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
};

type BuiltExportArchive = {
  archiveName: string;
  buffer: Buffer;
  noteCount: number;
  fileCount: number;
  rootFolderName: string;
  exportedAt: string;
};

export type ExportRunSummary = {
  id: string;
  status: string;
  archiveName: string;
  noteCount: number;
  fileCount: number;
  createdAt: string;
  completedAt: string | null;
  storageKey: string;
  errorMessage: string | null;
  downloadHref: string;
};

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sanitizePathSegment(value: string, fallback = "Untitled") {
  const cleaned = normalizeWhitespace(
    String(value || "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/^\.+|\.+$/g, "")
      .replace(/\s+/g, " "),
  );

  return cleaned || fallback;
}

function ensureMarkdownFileName(value: string, fallback = "Untitled") {
  const baseName = sanitizePathSegment(
    String(value || "").replace(/\.(md|markdown)$/i, ""),
    fallback,
  );

  return `${baseName}.md`;
}

function yamlScalar(value: string | number | boolean) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return JSON.stringify(String(value));
}

function buildYamlFrontmatter(fields: Record<string, unknown>) {
  const lines = ["---"];

  Object.entries(fields).forEach(([key, value]) => {
    if (
      value == null ||
      value === "" ||
      (Array.isArray(value) && !value.length)
    ) {
      return;
    }

    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach((item) => {
        lines.push(`  - ${yamlScalar(item as string | number | boolean)}`);
      });
      return;
    }

    lines.push(`${key}: ${yamlScalar(value as string | number | boolean)}`);
  });

  lines.push("---", "");
  return lines.join("\n");
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);

  return {
    date: dosDate,
    time: dosTime,
  };
}

function computeCrc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function buildStoredZipArchive(files: Array<{ path: string; content: string | Uint8Array }>) {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  const stamp = getDosDateTime();
  let localOffset = 0;
  let centralSize = 0;

  files.forEach((file) => {
    const pathBytes = encoder.encode(file.path.replace(/\\/g, "/"));
    const contentBytes =
      file.content instanceof Uint8Array
        ? file.content
        : encoder.encode(String(file.content || ""));
    const crc32 = computeCrc32(contentBytes);
    const localHeader = new Uint8Array(30 + pathBytes.length + contentBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, stamp.time, true);
    localView.setUint16(12, stamp.date, true);
    localView.setUint32(14, crc32, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, pathBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(pathBytes, 30);
    localHeader.set(contentBytes, 30 + pathBytes.length);
    localChunks.push(localHeader);

    const centralHeader = new Uint8Array(46 + pathBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, stamp.time, true);
    centralView.setUint16(14, stamp.date, true);
    centralView.setUint32(16, crc32, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, pathBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(pathBytes, 46);
    centralChunks.push(centralHeader);

    localOffset += localHeader.length;
    centralSize += centralHeader.length;
  });

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  endView.setUint16(20, 0, true);

  return Buffer.concat(
    [...localChunks, ...centralChunks, endRecord].map((chunk) => Buffer.from(chunk)),
  );
}

function buildExportReadme(
  vaultName: string,
  exportedAt: string,
  notes: ExportNoteRow[],
  edgeCount: number,
) {
  const folderCounts = new Map<string, number>();

  notes.forEach((note) => {
    const key = note.folder_path || "Notes";
    folderCounts.set(key, (folderCounts.get(key) || 0) + 1);
  });

  const folderLines = [...folderCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([folder, count]) => `- ${folder}: ${count} note${count === 1 ? "" : "s"}`);

  return [
    `# ${vaultName}`,
    "",
    `Exported from The Vault on ${exportedAt}.`,
    "",
    `- Notes: ${notes.length}`,
    `- Links: ${edgeCount}`,
    `- Folders: ${folderCounts.size}`,
    "",
    "## Folders",
    ...(folderLines.length ? folderLines : ["- No folders in this vault yet."]),
    "",
    "## Notes",
    ...notes
      .map((note) => `- [[${note.title}]]`)
      .sort((left, right) => left.localeCompare(right)),
    "",
  ].join("\n");
}

function buildExportRelativePath(note: ExportNoteRow, usedPaths: Set<string>) {
  const normalizedBasePath = note.relative_path
    ? note.relative_path
        .split("/")
        .filter(Boolean)
        .map((part, index, parts) =>
          index === parts.length - 1
            ? ensureMarkdownFileName(part, note.title || "Untitled")
            : sanitizePathSegment(part, `Folder ${index + 1}`),
        )
        .join("/")
    : `${sanitizePathSegment(note.folder_path || "Notes", "Notes")}/${ensureMarkdownFileName(note.title, "Untitled")}`;

  let candidatePath = normalizedBasePath;
  let suffix = 2;

  while (usedPaths.has(candidatePath.toLowerCase())) {
    candidatePath = normalizedBasePath.replace(/\.md$/i, ` ${suffix}.md`);
    suffix += 1;
  }

  usedPaths.add(candidatePath.toLowerCase());
  return candidatePath;
}

function buildExportMetadata(note: ExportNoteRow, exportedAt: string, neighborTitles: string[]) {
  return {
    title: note.title,
    source: note.source_title ? [note.source_title] : ["Private vault note"],
    source_type: note.source_type || "obsidian",
    folder: note.folder_path || "Notes",
    exported_at: exportedAt,
    source_url: note.source_url || "",
    relative_path: note.relative_path || "",
    aliases: note.aliases || [],
    tags: note.tags || [],
    linked_notes: neighborTitles.length,
  };
}

function buildExportBody(note: ExportNoteRow, neighborTitles: string[]) {
  const body = note.markdown?.trim() || `# ${note.title}\n\n${note.excerpt || ""}\n`;
  const sections = [body];

  sections.push(
    "",
    "## Graph Snapshot",
    `- Folder: ${note.folder_path || "Notes"}`,
    `- Source: ${note.source_title || note.source_type || "Private vault note"}`,
    `- Connected notes: ${neighborTitles.length}`,
  );

  if (note.source_url) {
    sections.push(`- Source URL: ${note.source_url}`);
  }

  if (neighborTitles.length) {
    sections.push("", "## Connected Notes", ...neighborTitles.map((title) => `- [[${title}]]`));
  }

  return `${sections.join("\n").trim()}\n`;
}

async function loadExportInputs(vaultId: string) {
  const [noteResult, edgeResult] = await Promise.all([
    query<ExportNoteRow>(
      `
        SELECT
          notes.id,
          notes.title,
          notes.relative_path,
          notes.folder_path,
          notes.markdown,
          notes.excerpt,
          notes.tags,
          notes.aliases,
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
    ),
    query<ExportEdgeRow>(
      `
        SELECT
          edges.from_note_id,
          target.title AS target_title
        FROM edges
        INNER JOIN notes AS target
          ON target.id = edges.to_note_id
        WHERE edges.vault_id = $1
      `,
      [vaultId],
    ),
  ]);

  return {
    notes: noteResult.rows,
    edges: edgeResult.rows,
  };
}

async function buildVaultExportArchive(vaultId: string, vaultName: string, vaultSlug: string) {
  const { notes, edges } = await loadExportInputs(vaultId);
  const edgeCount = edges.length;
  const exportedAt = new Date().toISOString();
  const exportDay = exportedAt.slice(0, 10);
  const rootFolderName = `The Vault ${sanitizePathSegment(vaultName, "Vault")} ${exportDay}`;
  const archiveName = `the-vault-${slugify(vaultSlug || vaultName) || "vault"}-${exportDay}.zip`;
  const usedPaths = new Set<string>();
  const neighborMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    const current = neighborMap.get(edge.from_note_id) || [];
    current.push(edge.target_title);
    neighborMap.set(edge.from_note_id, current);
  });

  const files: Array<{ path: string; content: string | Uint8Array }> = [
    {
      path: `${rootFolderName}/README.md`,
      content: buildExportReadme(vaultName, exportedAt, notes, edgeCount),
    },
    {
      path: `${rootFolderName}/.obsidian/app.json`,
      content: "{\n  \"legacyEditor\": false\n}\n",
    },
  ];

  notes.forEach((note) => {
    const neighborTitles = [...new Set(neighborMap.get(note.id) || [])].sort((left, right) =>
      left.localeCompare(right),
    );
    const metadata = buildExportMetadata(note, exportedAt, neighborTitles);
    const body = buildExportBody(note, neighborTitles);
    const relativePath = buildExportRelativePath(note, usedPaths);

    files.push({
      path: `${rootFolderName}/${relativePath}`,
      content: `${buildYamlFrontmatter(metadata)}${body}`,
    });
  });

  return {
    archiveName,
    buffer: buildStoredZipArchive(files),
    noteCount: notes.length,
    fileCount: files.length,
    rootFolderName,
    exportedAt,
  } satisfies BuiltExportArchive;
}

function buildArtifactDownloadHref(vaultId: string, exportRunId: string) {
  return `/api/vaults/${vaultId}/exports/${exportRunId}/download`;
}

function mapExportRunSummary(row: ExportRunRow): ExportRunSummary {
  return {
    id: row.id,
    status: row.status,
    archiveName: row.archive_name,
    noteCount: row.note_count,
    fileCount: row.file_count,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    storageKey: row.storage_key || "",
    errorMessage: row.error_message,
    downloadHref: buildArtifactDownloadHref(row.vault_id, row.id),
  };
}

export async function createVaultExportArchiveForUser(userId: string, vaultId: string) {
  const vault = await getVaultForUser(userId, vaultId);

  if (!vault) {
    throw new Error("Vault not found.");
  }

  const artifact = await buildVaultExportArchive(vaultId, vault.name, vault.slug);
  const exportRunId = randomUUID();
  const storageKey = `exports/${vaultId}/${exportRunId}/${artifact.archiveName}`;

  await query(
    `
      INSERT INTO export_runs (
        id,
        vault_id,
        requested_by_user_id,
        status,
        archive_name,
        note_count,
        file_count,
        started_at,
        metadata_json
      )
      VALUES (
        $1,
        $2,
        $3,
        'processing',
        $4,
        $5,
        $6,
        NOW(),
        $7::jsonb
      )
    `,
    [
      exportRunId,
      vaultId,
      userId,
      artifact.archiveName,
      artifact.noteCount,
      artifact.fileCount,
      JSON.stringify({
        rootFolderName: artifact.rootFolderName,
        exportedAt: artifact.exportedAt,
      }),
    ],
  );

  try {
    await putObject(storageKey, artifact.buffer);

    await query(
      `
        UPDATE export_runs
        SET status = 'succeeded',
            storage_key = $2,
            completed_at = NOW(),
            error_message = NULL
        WHERE id = $1
      `,
      [exportRunId, storageKey],
    );
  } catch (error) {
    await query(
      `
        UPDATE export_runs
        SET status = 'failed',
            error_message = $2,
            completed_at = NOW()
        WHERE id = $1
      `,
      [
        exportRunId,
        error instanceof Error ? error.message : "Export failed.",
      ],
    );

    throw error;
  }

  return {
    archiveName: artifact.archiveName,
    buffer: artifact.buffer,
    noteCount: artifact.noteCount,
    fileCount: artifact.fileCount,
    exportRunId,
    storageKey,
  };
}

export async function queueVaultExportForUser(userId: string, vaultId: string) {
  const vault = await getVaultForUser(userId, vaultId);

  if (!vault) {
    throw new Error("Vault not found.");
  }

  const exportRunId = randomUUID();
  const exportedAt = new Date().toISOString();
  const archiveName = `the-vault-${slugify(vault.slug || vault.name) || "vault"}-${exportedAt.slice(0, 10)}.zip`;

  await query(
    `
      INSERT INTO export_runs (
        id,
        vault_id,
        requested_by_user_id,
        status,
        archive_name,
        started_at,
        metadata_json
      )
      VALUES (
        $1,
        $2,
        $3,
        'queued',
        $4,
        NOW(),
        $5::jsonb
      )
    `,
    [
      exportRunId,
      vaultId,
      userId,
      archiveName,
      JSON.stringify({
        exportedAt,
      }),
    ],
  );

  return {
    exportRunId,
    archiveName,
  };
}

export async function processExportRun(exportRunId: string) {
  const claimed = await query<ExportRunRow>(
    `
      UPDATE export_runs
      SET status = 'processing',
          started_at = NOW(),
          error_message = NULL
      WHERE id = $1
        AND status IN ('queued', 'failed')
      RETURNING *
    `,
    [exportRunId],
  );

  if (!claimed.rows[0]) {
    const existing = await query<ExportRunRow>(
      `
        SELECT *
        FROM export_runs
        WHERE id = $1
        LIMIT 1
      `,
      [exportRunId],
    );

    const row = existing.rows[0];
    if (!row) {
      throw new Error("Export run not found.");
    }

    if (row.status === "succeeded") {
      return mapExportRunSummary(row);
    }

    return null;
  }

  const run = claimed.rows[0];
  const vault = await query<{
    name: string;
    slug: string;
  }>(
    `
      SELECT name, slug
      FROM vaults
      WHERE id = $1
      LIMIT 1
    `,
    [run.vault_id],
  );

  const vaultRow = vault.rows[0];
  if (!vaultRow) {
    throw new Error("Vault not found.");
  }

  try {
    const artifact = await buildVaultExportArchive(run.vault_id, vaultRow.name, vaultRow.slug);
    const storageKey = `exports/${run.vault_id}/${run.id}/${artifact.archiveName}`;

    await putObject(storageKey, artifact.buffer);

    const updated = await query<ExportRunRow>(
      `
        UPDATE export_runs
        SET status = 'succeeded',
            archive_name = $2,
            note_count = $3,
            file_count = $4,
            storage_key = $5,
            metadata_json = $6::jsonb,
            completed_at = NOW(),
            error_message = NULL
        WHERE id = $1
        RETURNING *
      `,
      [
        run.id,
        artifact.archiveName,
        artifact.noteCount,
        artifact.fileCount,
        storageKey,
        JSON.stringify({
          rootFolderName: artifact.rootFolderName,
          exportedAt: artifact.exportedAt,
        }),
      ],
    );

    return updated.rows[0] ? mapExportRunSummary(updated.rows[0]) : null;
  } catch (error) {
    await query(
      `
        UPDATE export_runs
        SET status = 'failed',
            error_message = $2,
            completed_at = NOW()
        WHERE id = $1
      `,
      [
        run.id,
        error instanceof Error ? error.message : "Export failed.",
      ],
    );

    throw error;
  }
}

export async function getExportRunSummaryForUser(
  userId: string,
  vaultId: string,
  exportRunId?: string | null,
): Promise<ExportRunSummary | null> {
  if (!exportRunId) {
    return null;
  }

  const result = await query<ExportRunRow>(
    `
      SELECT *
      FROM export_runs
      WHERE id = $1
        AND vault_id = $2
        AND requested_by_user_id = $3
      LIMIT 1
    `,
    [exportRunId, vaultId, userId],
  );

  return result.rows[0] ? mapExportRunSummary(result.rows[0]) : null;
}

export async function listRecentExportRunsForUser(
  userId: string,
  vaultId: string,
  limit = 6,
): Promise<ExportRunSummary[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), 12)) : 6;
  const result = await query<ExportRunRow>(
    `
      SELECT *
      FROM export_runs
      WHERE vault_id = $1
        AND requested_by_user_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `,
    [vaultId, userId, safeLimit],
  );

  return result.rows.map(mapExportRunSummary);
}

export async function getExportArtifactForUser(
  userId: string,
  vaultId: string,
  exportRunId: string,
) {
  const result = await query<ExportRunRow>(
    `
      SELECT *
      FROM export_runs
      WHERE id = $1
        AND vault_id = $2
        AND requested_by_user_id = $3
        AND status = 'succeeded'
      LIMIT 1
    `,
    [exportRunId, vaultId, userId],
  );

  const row = result.rows[0];
  if (!row || !row.storage_key) {
    return null;
  }

  const buffer = await getObjectBuffer(row.storage_key);

  return {
    archiveName: row.archive_name,
    buffer,
    storageKey: row.storage_key,
  };
}

export async function getNextQueuedExportRunId() {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM export_runs
      WHERE status = 'queued'
      ORDER BY created_at ASC
      LIMIT 1
    `,
  );

  return result.rows[0]?.id || "";
}
