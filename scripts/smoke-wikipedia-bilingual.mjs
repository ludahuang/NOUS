import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultRoot = path.join(repoRoot, "vaults", "Psychology_Genealogy_Atlas");
const manifestPath = path.join(vaultRoot, "the-vault.wikipedia.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const records = manifest.records || [];
const englishRecords = records.filter((record) => record.language === "en");
const chineseRecords = records.filter((record) => record.language === "zh");
const ids = new Set();
const titles = new Set();
const duplicateIds = [];
const duplicateTitles = [];
const invalidChineseRecords = [];
const missingAnchorPaths = [];
const anonymousAnchorPaths = [];

for (const record of records) {
  if (ids.has(record.id)) {
    duplicateIds.push(record.id);
  }
  ids.add(record.id);

  const normalizedTitle = String(record.title || "").normalize("NFKC").toLowerCase();
  if (titles.has(normalizedTitle)) {
    duplicateTitles.push(record.title);
  }
  titles.add(normalizedTitle);

  if (
    record.language === "zh" &&
    (
      record.sourceLabel !== "中文维基百科" ||
      !String(record.url || "").startsWith("https://zh.wikipedia.org/")
    )
  ) {
    invalidChineseRecords.push(record.title);
  }

  for (const anchorPath of record.anchorPaths || []) {
    if (
      anchorPath.split("/").includes("展开节点") ||
      /(?:^|\/)node-[0-9a-f]+\.md$/i.test(anchorPath)
    ) {
      anonymousAnchorPaths.push(anchorPath);
    }
    try {
      await fs.access(path.join(vaultRoot, anchorPath));
    } catch {
      missingAnchorPaths.push(anchorPath);
    }
  }
}

const chineseTitles = new Set(chineseRecords.map((record) => record.title));
const englishTitles = new Set(englishRecords.map((record) => record.title));
const englishToChineseEdges = englishRecords.reduce(
  (sum, record) =>
    sum + (record.links || []).filter((title) => chineseTitles.has(title)).length,
  0,
);
const chineseToEnglishEdges = chineseRecords.reduce(
  (sum, record) =>
    sum + (record.links || []).filter((title) => englishTitles.has(title)).length,
  0,
);

const failures = {
  duplicateIds,
  duplicateTitles,
  invalidChineseRecords,
  missingAnchorPaths,
  anonymousAnchorPaths,
};

if (Object.values(failures).some((entries) => entries.length)) {
  throw new Error(JSON.stringify(failures, null, 2));
}

if (
  manifest.source !== "Wikipedia" ||
  englishRecords.length < 200 ||
  chineseRecords.length < 100 ||
  englishToChineseEdges < 100 ||
  chineseToEnglishEdges < 100
) {
  throw new Error(
    JSON.stringify(
      {
        source: manifest.source,
        englishRecords: englishRecords.length,
        chineseRecords: chineseRecords.length,
        englishToChineseEdges,
        chineseToEnglishEdges,
      },
      null,
      2,
    ),
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      publicRecords: records.length,
      englishRecords: englishRecords.length,
      chineseRecords: chineseRecords.length,
      englishToChineseEdges,
      chineseToEnglishEdges,
      missingAnchorPaths: missingAnchorPaths.length,
      anonymousAnchorPaths: anonymousAnchorPaths.length,
    },
    null,
    2,
  ),
);
