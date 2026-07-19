import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultRoot = path.join(repoRoot, "vaults", "Psychology_Genealogy_Atlas");
const outputPath = path.join(vaultRoot, "the-vault.wikipedia.json");
const API_URLS = {
  en: "https://en.wikipedia.org/w/api.php",
  zh: "https://zh.wikipedia.org/w/api.php",
};
const BATCH_SIZE = 20;
const MAX_EXTERNAL_BRANCHES = 72;
const MAX_ZH_EXTERNAL_BRANCHES = 72;
const MAX_LINKS_PER_SEED = 18;
const USER_AGENT = "TheVaultPsychologyAtlas/0.1 (local research workspace)";

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseScalar(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function parseFrontmatter(markdown) {
  const match = String(markdown || "").match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const result = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field?.[2]) {
      result[field[1]] = parseScalar(field[2]);
    }
  });
  return result;
}

async function findMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".obsidian") {
          return [];
        }
        return findMarkdownFiles(target);
      }
      return /\.(md|markdown)$/i.test(entry.name) ? [target] : [];
    }),
  );
  return nested.flat();
}

async function fetchJson(apiUrl, params, retries = 5) {
  const url = new URL(apiUrl);
  Object.entries({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    ...params,
  }).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  let lastError = null;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (response.ok) {
      return response.json();
    }

    lastError = new Error(`Wikipedia API returned HTTP ${response.status}`);
    if (response.status !== 429 && response.status < 500) {
      throw lastError;
    }

    const retryAfter = Number(response.headers.get("retry-after") || "0");
    await delay(Math.max(retryAfter * 1000, 1800 * (attempt + 1)));
  }

  throw lastError;
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function mergePage(target, page) {
  return {
    ...target,
    ...page,
    links: unique([
      ...(target?.links || []).map((entry) => entry.title || entry),
      ...(page.links || []).map((entry) => entry.title || entry),
    ]).map((title) => ({ title })),
    langlinks: unique([
      ...(target?.langlinks || []).map((entry) => `${entry.lang}:${entry.title}`),
      ...(page.langlinks || []).map((entry) => `${entry.lang}:${entry.title}`),
    ]).map((entry) => {
      const separator = entry.indexOf(":");
      return {
        lang: entry.slice(0, separator),
        title: entry.slice(separator + 1),
      };
    }),
  };
}

async function fetchDetailedPages(titles, apiUrl, includeChineseLanglinks = false) {
  const pageMap = new Map();
  const resolvedTitleMap = new Map(titles.map((title) => [normalize(title), title]));
  let continuation = {};
  let rounds = 0;

  do {
    const data = await fetchJson(apiUrl, {
      titles: titles.join("|"),
      prop: includeChineseLanglinks ? "extracts|info|links|langlinks" : "extracts|info|links",
      redirects: "1",
      converttitles: "1",
      exintro: "1",
      explaintext: "1",
      exchars: "720",
      inprop: "url",
      plnamespace: "0",
      pllimit: "max",
      ...(includeChineseLanglinks
        ? {
          lllang: "zh",
          lllimit: "max",
        }
        : {}),
      ...continuation,
    });

    (data.query?.normalized || []).forEach((entry) => {
      resolvedTitleMap.set(normalize(entry.from), entry.to);
    });
    (data.query?.redirects || []).forEach((entry) => {
      resolvedTitleMap.set(normalize(entry.from), entry.to);
    });
    (data.query?.pages || []).forEach((page) => {
      if (page.missing) {
        return;
      }
      pageMap.set(page.title, mergePage(pageMap.get(page.title), page));
    });

    continuation = data.continue || {};
    rounds += 1;
  } while (continuation.continue && rounds < 4);

  return { pageMap, resolvedTitleMap };
}

async function fetchSummaryPages(titles, apiUrl) {
  const pageMap = new Map();
  for (const titleBatch of chunk(titles, 40)) {
    const data = await fetchJson(apiUrl, {
      titles: titleBatch.join("|"),
      prop: "extracts|info",
      redirects: "1",
      converttitles: "1",
      exintro: "1",
      explaintext: "1",
      exchars: "520",
      inprop: "url",
    });
    (data.query?.pages || []).forEach((page) => {
      if (!page.missing) {
        pageMap.set(page.title, page);
      }
    });
  }
  return pageMap;
}

function isUsefulBranchTitle(title) {
  const normalized = normalize(title);
  return (
    normalized.length >= 3 &&
    normalized.length <= 72 &&
    !/^\d{3,4}$/.test(normalized) &&
    !/^(list|outline|index|glossary|timeline|bibliography) of\b/.test(normalized) &&
    !/\b(disambiguation|journal|magazine|newspaper|isbn|doi)\b/.test(normalized)
  );
}

function getPageUrl(page, language = "en") {
  return (
    page.fullurl ||
    `https://${language}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`
  );
}

const markdownFiles = await findMarkdownFiles(vaultRoot);
const localSeeds = [];

for (const file of markdownFiles) {
  const frontmatter = parseFrontmatter(await fs.readFile(file, "utf8"));
  if (!frontmatter.title || !frontmatter.wikipedia) {
    continue;
  }
  localSeeds.push({
    localTitle: frontmatter.title,
    wikipediaTitle: frontmatter.wikipedia,
    relativePath: path.relative(vaultRoot, file),
  });
}

const requestedTitles = unique(localSeeds.map((seed) => seed.wikipediaTitle));
const detailedPageMap = new Map();
const resolvedTitleMap = new Map();
const existingManifest = await fs
  .readFile(outputPath, "utf8")
  .then((content) => JSON.parse(content))
  .catch((error) => {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  });

let completedBatches = 0;
for (const titleBatch of chunk(requestedTitles, BATCH_SIZE)) {
  const result = await fetchDetailedPages(titleBatch, API_URLS.en, true);
  result.pageMap.forEach((page, title) => detailedPageMap.set(title, page));
  result.resolvedTitleMap.forEach((title, requested) => resolvedTitleMap.set(requested, title));
  completedBatches += 1;
  console.log(`English Wikipedia seed batches ${completedBatches}/${Math.ceil(requestedTitles.length / BATCH_SIZE)}`);
  await delay(900);
}

const canonicalByRequested = new Map();
for (const requestedTitle of requestedTitles) {
  const redirected = resolvedTitleMap.get(normalize(requestedTitle)) || requestedTitle;
  const page =
    detailedPageMap.get(redirected) ||
    detailedPageMap.get(requestedTitle) ||
    [...detailedPageMap.values()].find(
      (candidate) => normalize(candidate.title) === normalize(redirected),
    );
  if (page) {
    canonicalByRequested.set(requestedTitle, page.title);
  }
}

const anchorsByWikipediaTitle = new Map();
for (const seed of localSeeds) {
  const wikipediaTitle = canonicalByRequested.get(seed.wikipediaTitle);
  if (!wikipediaTitle) {
    continue;
  }
  if (!anchorsByWikipediaTitle.has(wikipediaTitle)) {
    anchorsByWikipediaTitle.set(wikipediaTitle, []);
  }
  anchorsByWikipediaTitle.get(wikipediaTitle).push({
    title: seed.localTitle,
    relativePath: seed.relativePath,
  });
}

const seedTitles = new Set(anchorsByWikipediaTitle.keys());
const externalFrequency = new Map();
const externalParents = new Map();

for (const seedTitle of seedTitles) {
  const page = detailedPageMap.get(seedTitle);
  const links = unique((page?.links || []).map((entry) => entry.title))
    .filter(isUsefulBranchTitle)
    .slice(0, MAX_LINKS_PER_SEED);

  links.forEach((linkedTitle) => {
    if (seedTitles.has(linkedTitle)) {
      return;
    }
    externalFrequency.set(linkedTitle, (externalFrequency.get(linkedTitle) || 0) + 1);
    if (!externalParents.has(linkedTitle)) {
      externalParents.set(linkedTitle, new Set());
    }
    externalParents.get(linkedTitle).add(seedTitle);
  });
}

const externalTitles = [...externalFrequency.entries()]
  .sort(
    (left, right) =>
      right[1] - left[1] ||
      left[0].localeCompare(right[0]),
  )
  .slice(0, MAX_EXTERNAL_BRANCHES)
  .map(([title]) => title);
const externalPageMap = await fetchSummaryPages(externalTitles, API_URLS.en);
const includedTitles = new Set([...seedTitles, ...externalPageMap.keys()]);

const generatedEnglishRecords = [];
for (const seedTitle of seedTitles) {
  const page = detailedPageMap.get(seedTitle);
  if (!page) {
    continue;
  }
  const linkedTitles = unique((page.links || []).map((entry) => entry.title))
    .filter((title) => includedTitles.has(title));
  generatedEnglishRecords.push({
    id: `wiki-${page.pageid}`,
    title: page.title,
    language: "en",
    sourceLabel: "English Wikipedia",
    description: "English Wikipedia article",
    extract: page.extract || "",
    url: getPageUrl(page, "en"),
    links: linkedTitles,
    anchorTitles: anchorsByWikipediaTitle.get(seedTitle).map((anchor) => anchor.title),
    anchorPaths: anchorsByWikipediaTitle.get(seedTitle).map((anchor) => anchor.relativePath),
    expansionDepth: 0,
  });
}

for (const [title, page] of externalPageMap) {
  generatedEnglishRecords.push({
    id: `wiki-${page.pageid}`,
    title,
    language: "en",
    sourceLabel: "English Wikipedia",
    description: "English Wikipedia related branch",
    extract: page.extract || "",
    url: getPageUrl(page, "en"),
    links: [...(externalParents.get(title) || [])].filter((parent) => seedTitles.has(parent)),
    anchorTitles: [],
    anchorPaths: [],
    expansionDepth: 1,
  });
}

const localPathByTitle = new Map(
  localSeeds.map((seed) => [seed.localTitle, seed.relativePath]),
);
const preservedEnglishRecords = (existingManifest?.records || []).filter(
  (record) =>
    record.language !== "zh" &&
    !String(record.sourceLabel || "").includes("中文"),
);
const englishRecords = (
  preservedEnglishRecords.length ? preservedEnglishRecords : generatedEnglishRecords
).map((record) => {
  const currentAnchors = anchorsByWikipediaTitle.get(record.title);
  const anchorTitles = currentAnchors?.length
    ? currentAnchors.map((anchor) => anchor.title)
    : record.anchorTitles || [];

  return {
    ...record,
    language: "en",
    sourceLabel: "English Wikipedia",
    anchorTitles,
    anchorPaths: anchorTitles
      .map((title) => localPathByTitle.get(title))
      .filter(Boolean),
  };
});

const requestedZhByEnglish = new Map();
for (const seedTitle of seedTitles) {
  const zhTitle = detailedPageMap
    .get(seedTitle)
    ?.langlinks
    ?.find((entry) => entry.lang === "zh")
    ?.title;
  if (zhTitle) {
    requestedZhByEnglish.set(seedTitle, zhTitle);
  }
}

const requestedZhTitles = unique([...requestedZhByEnglish.values()]);
const zhDetailedPageMap = new Map();
const zhResolvedTitleMap = new Map();
let completedZhBatches = 0;

for (const titleBatch of chunk(requestedZhTitles, BATCH_SIZE)) {
  const result = await fetchDetailedPages(titleBatch, API_URLS.zh);
  result.pageMap.forEach((page, title) => zhDetailedPageMap.set(title, page));
  result.resolvedTitleMap.forEach((title, requested) => zhResolvedTitleMap.set(requested, title));
  completedZhBatches += 1;
  console.log(`中文维基百科种子批次 ${completedZhBatches}/${Math.ceil(requestedZhTitles.length / BATCH_SIZE)}`);
  await delay(900);
}

const canonicalZhByRequested = new Map();
for (const requestedTitle of requestedZhTitles) {
  const redirected = zhResolvedTitleMap.get(normalize(requestedTitle)) || requestedTitle;
  const page =
    zhDetailedPageMap.get(redirected) ||
    zhDetailedPageMap.get(requestedTitle) ||
    [...zhDetailedPageMap.values()].find(
      (candidate) => normalize(candidate.title) === normalize(redirected),
    );
  if (page) {
    canonicalZhByRequested.set(requestedTitle, page.title);
  }
}

const zhTitleByEnglish = new Map();
const anchorsByZhTitle = new Map();
for (const [englishTitle, requestedZhTitle] of requestedZhByEnglish) {
  const zhTitle = canonicalZhByRequested.get(requestedZhTitle);
  if (!zhTitle) {
    continue;
  }
  zhTitleByEnglish.set(englishTitle, zhTitle);
  anchorsByZhTitle.set(zhTitle, anchorsByWikipediaTitle.get(englishTitle) || []);
}

const zhSeedTitles = new Set(anchorsByZhTitle.keys());
const zhExternalFrequency = new Map();
const zhExternalParents = new Map();

for (const seedTitle of zhSeedTitles) {
  const page = zhDetailedPageMap.get(seedTitle);
  const links = unique((page?.links || []).map((entry) => entry.title))
    .filter(isUsefulBranchTitle)
    .slice(0, MAX_LINKS_PER_SEED);

  links.forEach((linkedTitle) => {
    if (zhSeedTitles.has(linkedTitle)) {
      return;
    }
    zhExternalFrequency.set(linkedTitle, (zhExternalFrequency.get(linkedTitle) || 0) + 1);
    if (!zhExternalParents.has(linkedTitle)) {
      zhExternalParents.set(linkedTitle, new Set());
    }
    zhExternalParents.get(linkedTitle).add(seedTitle);
  });
}

const zhExternalTitles = [...zhExternalFrequency.entries()]
  .sort(
    (left, right) =>
      right[1] - left[1] ||
      left[0].localeCompare(right[0], "zh-CN"),
  )
  .slice(0, MAX_ZH_EXTERNAL_BRANCHES)
  .map(([title]) => title);
const zhExternalPageMap = await fetchSummaryPages(zhExternalTitles, API_URLS.zh);
const includedZhTitles = new Set([...zhSeedTitles, ...zhExternalPageMap.keys()]);
const chineseRecords = [];

for (const seedTitle of zhSeedTitles) {
  const page = zhDetailedPageMap.get(seedTitle);
  if (!page) {
    continue;
  }
  chineseRecords.push({
    id: `wiki-zh-${page.pageid}`,
    title: page.title,
    language: "zh",
    sourceLabel: "中文维基百科",
    description: "中文维基百科词条",
    extract: page.extract || "",
    url: getPageUrl(page, "zh"),
    links: unique((page.links || []).map((entry) => entry.title))
      .filter((title) => includedZhTitles.has(title)),
    anchorTitles: anchorsByZhTitle.get(seedTitle).map((anchor) => anchor.title),
    anchorPaths: anchorsByZhTitle.get(seedTitle).map((anchor) => anchor.relativePath),
    expansionDepth: 0,
  });
}

for (const [title, page] of zhExternalPageMap) {
  chineseRecords.push({
    id: `wiki-zh-${page.pageid}`,
    title,
    language: "zh",
    sourceLabel: "中文维基百科",
    description: "中文维基百科关联分枝",
    extract: page.extract || "",
    url: getPageUrl(page, "zh"),
    links: [...(zhExternalParents.get(title) || [])]
      .filter((parent) => zhSeedTitles.has(parent)),
    anchorTitles: [],
    anchorPaths: [],
    expansionDepth: 1,
  });
}

function mergeDuplicateLanguageRecords(records) {
  const merged = new Map();

  records.forEach((record) => {
    const language = record.language || "en";
    const key = `${language}:${record.id || normalize(record.title)}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...record });
      return;
    }

    merged.set(key, {
      ...existing,
      ...record,
      expansionDepth: Math.min(
        Number(existing.expansionDepth || 0),
        Number(record.expansionDepth || 0),
      ),
      links: unique([...(existing.links || []), ...(record.links || [])]),
      anchorTitles: unique([
        ...(existing.anchorTitles || []),
        ...(record.anchorTitles || []),
      ]),
      anchorPaths: unique([
        ...(existing.anchorPaths || []),
        ...(record.anchorPaths || []),
      ]),
    });
  });

  return [...merged.values()];
}

function finalizeMultilingualRecords(english, chinese, counterpartByEnglish) {
  const staged = [...english, ...chinese].map((record) => ({
    ...record,
    rawTitle: record.title,
    language: record.language || "en",
  }));
  const usedTitles = new Set();
  const displayTitleByLanguage = new Map();

  staged.forEach((record) => {
    const rawTitle = record.rawTitle;
    let displayTitle = rawTitle;
    const normalizedTitle = normalize(displayTitle);
    if (usedTitles.has(normalizedTitle)) {
      displayTitle = `${rawTitle}${record.language === "zh" ? "（中文维基）" : " (English Wikipedia)"}`;
    }
    usedTitles.add(normalize(displayTitle));
    displayTitleByLanguage.set(
      `${record.language}:${normalize(rawTitle)}`,
      displayTitle,
    );
    record.title = displayTitle;
    record.aliases = unique([
      ...(record.aliases || []),
      displayTitle !== rawTitle ? rawTitle : "",
    ]);
  });

  const englishByChinese = new Map(
    [...counterpartByEnglish].map(([englishTitle, zhTitle]) => [zhTitle, englishTitle]),
  );

  return staged.map((record) => {
    const sameLanguageLinks = (record.links || [])
      .map((title) =>
        displayTitleByLanguage.get(`${record.language}:${normalize(title)}`),
      )
      .filter(Boolean);
    const counterpartRawTitle =
      record.language === "zh"
        ? englishByChinese.get(record.rawTitle)
        : counterpartByEnglish.get(record.rawTitle);
    const counterpartLanguage = record.language === "zh" ? "en" : "zh";
    const counterpartTitle = counterpartRawTitle
      ? displayTitleByLanguage.get(
        `${counterpartLanguage}:${normalize(counterpartRawTitle)}`,
      )
      : "";

    return {
      ...record,
      links: unique([...sameLanguageLinks, counterpartTitle]),
    };
  });
}

const canonicalEnglishRecords = mergeDuplicateLanguageRecords(englishRecords);
const canonicalChineseRecords = mergeDuplicateLanguageRecords(chineseRecords);
const records = finalizeMultilingualRecords(
  canonicalEnglishRecords,
  canonicalChineseRecords,
  zhTitleByEnglish,
);
const manifest = {
  schema: "the-vault.wikipedia-graph/v1",
  source: "Wikipedia",
  generatedAt: "2026-07-19",
  provenance: {
    apis: API_URLS,
    localVault: "Psychology_Genealogy_Atlas",
    selection:
      "Preserved English Wikipedia graph plus Chinese language counterparts and high-frequency one-hop Chinese article links.",
  },
  metrics: {
    localSeeds: localSeeds.length,
    requestedTitles: requestedTitles.length,
    matchedSeedPages: seedTitles.size,
    englishRecords: canonicalEnglishRecords.length,
    chineseSeedPages: zhSeedTitles.size,
    chineseExternalBranches: zhExternalPageMap.size,
    chineseRecords: canonicalChineseRecords.length,
    publicRecords: records.length,
  },
  records,
};

await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest.metrics, null, 2));
