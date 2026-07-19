import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultRoot = path.join(repoRoot, "vaults", "Psychology_Genealogy_Atlas");

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed.replace(/^['"]|['"]$/g, "");
  }
}

function parseFrontmatter(markdown) {
  const match = String(markdown || "").match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { aliases: [] };
  }

  const lines = match[1].split(/\r?\n/);
  const result = { aliases: [] };
  let activeList = "";

  for (const line of lines) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) {
      activeList = field[1];
      if (field[2]) {
        result[field[1]] = parseScalar(field[2]);
      }
      continue;
    }

    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && activeList === "aliases") {
      result.aliases.push(parseScalar(item[1]));
    }
  }

  return result;
}

async function findMarkdownFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".")) {
        files.push(...await findMarkdownFiles(target));
      }
    } else if (/\.md$/i.test(entry.name)) {
      files.push(target);
    }
  }
  return files;
}

function normalizeLookup(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .trim();
}

const files = await findMarkdownFiles(vaultRoot);
const notes = [];

for (const file of files) {
  const markdown = await fs.readFile(file, "utf8");
  const frontmatter = parseFrontmatter(markdown);
  const title = String(frontmatter.title || "").trim();
  const fileStem = path.basename(file, path.extname(file));
  notes.push({
    file,
    relativePath: path.relative(vaultRoot, file),
    fileStem,
    title,
    aliases: frontmatter.aliases,
    body: markdown.replace(/^---\n[\s\S]*?\n---\n?/, "").trim(),
    links: [...markdown.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)]
      .map((match) => match[1].trim())
      .filter(Boolean),
  });
}

const lookup = new Map();
for (const note of notes) {
  for (const label of [note.fileStem, ...note.aliases]) {
    const key = normalizeLookup(label);
    if (!lookup.has(key)) {
      lookup.set(key, []);
    }
    lookup.get(key).push(note.relativePath);
  }
}

const missingTitles = notes.filter((note) => !note.title);
const anonymousFiles = notes.filter((note) => /^node-[0-9a-f]+$/i.test(note.fileStem));
const anonymousFolders = notes.filter((note) =>
  note.relativePath.split(path.sep).includes("展开节点"),
);
const emptyNotes = notes.filter((note) => {
  const contentWithoutHeading = note.body
    .replace(/^#\s+.+$/m, "")
    .replace(/^##\s+.+$/gm, "")
    .replace(/\[\[[^\]]+\]\]/g, "")
    .replace(/[-\s]/g, "");
  return !contentWithoutHeading;
});
const contextlessStructuralTitles = new Set([
  "难以标准化",
  "可重复",
  "可量化",
  "可能丢失体验意义",
  "行为",
  "生理",
  "神经",
  "环境",
  "实验室",
]);
const contextlessStructuralNotes = notes.filter((note) =>
  contextlessStructuralTitles.has(note.title),
);
const unresolvedTitleFiles = notes.filter(
  (note) =>
    note.fileStem !== note.title &&
    !note.aliases.some((alias) => normalizeLookup(alias) === normalizeLookup(note.title)),
);
const unresolvedLinks = [];
const ambiguousLinks = [];

for (const note of notes) {
  for (const link of note.links) {
    const targets = lookup.get(normalizeLookup(link)) || [];
    if (!targets.length) {
      unresolvedLinks.push(`${note.relativePath} -> ${link}`);
    } else if (targets.length > 1) {
      ambiguousLinks.push(`${note.relativePath} -> ${link}: ${targets.join(", ")}`);
    }
  }
}

const manifest = JSON.parse(
  await fs.readFile(path.join(vaultRoot, "vault-manifest.json"), "utf8"),
);
const failures = {
  missingTitles,
  anonymousFiles,
  anonymousFolders,
  emptyNotes,
  contextlessStructuralNotes,
  unresolvedTitleFiles,
  unresolvedLinks,
  ambiguousLinks,
};

if (Object.values(failures).some((entries) => entries.length)) {
  throw new Error(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(failures).map(([key, entries]) => [key, entries.slice(0, 20)]),
      ),
      null,
      2,
    ),
  );
}

if (notes.length !== manifest.design.notes) {
  throw new Error(
    `Manifest declares ${manifest.design.notes} notes but ${notes.length} Markdown files exist.`,
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      notes: notes.length,
      wikilinks: notes.reduce((sum, note) => sum + note.links.length, 0),
      exactTitleFilenames: notes.filter((note) => note.fileStem === note.title).length,
      aliasResolvedFilenames: notes.filter((note) => note.fileStem !== note.title).length,
      anonymousFiles: anonymousFiles.length,
      anonymousFolders: anonymousFolders.length,
      emptyNotes: emptyNotes.length,
      contextlessStructuralNotes: contextlessStructuralNotes.length,
      unresolvedLinks: unresolvedLinks.length,
      ambiguousLinks: ambiguousLinks.length,
    },
    null,
    2,
  ),
);
