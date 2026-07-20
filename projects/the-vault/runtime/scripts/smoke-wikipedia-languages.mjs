import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";
import { installWikipediaMock } from "./agent-wikipedia-mock.mjs";

const languageCases = [
  {
    language: "zh",
    query: "心理学",
    title: "心理学",
    sourceLabel: "中文维基百科",
  },
  {
    language: "fr",
    query: "Psychologie",
    title: "Psychologie",
    sourceLabel: "Wikipédia en français",
  },
  {
    language: "de",
    query: "Psychologie",
    title: "Psychologie",
    sourceLabel: "Deutschsprachige Wikipedia",
  },
  {
    language: "es",
    query: "Psicología",
    title: "Psicología",
    sourceLabel: "Wikipedia en español",
  },
];

async function runSearchCase(page, testCase) {
  await page.selectOption("#wikipedia-language", testCase.language);
  await page.fill("#search-input", testCase.query);
  await page.press("#search-input", "Enter");
  await page.waitForFunction(
    (expectedTitle) =>
      document.getElementById("article-title")?.textContent?.trim() === expectedTitle,
    testCase.title,
  );
  await page.waitForTimeout(250);

  const result = await page.evaluate(() => ({
    title: document.getElementById("article-title")?.textContent?.trim() || "",
    sourceLabel: document.getElementById("source-link")?.textContent?.trim() || "",
    sourceUrl: document.getElementById("source-link")?.href || "",
    languageMeta:
      document.getElementById("wikipedia-language-meta")?.textContent?.trim() || "",
    treeCount: document.querySelectorAll("#note-tree .tree-item").length,
  }));

  if (result.title !== testCase.title) {
    throw new Error(`${testCase.language}: expected "${testCase.title}", got "${result.title}".`);
  }
  if (result.sourceLabel !== testCase.sourceLabel) {
    throw new Error(
      `${testCase.language}: expected source "${testCase.sourceLabel}", got "${result.sourceLabel}".`,
    );
  }
  if (!result.sourceUrl.startsWith(`https://${testCase.language}.wikipedia.org/`)) {
    throw new Error(`${testCase.language}: unexpected source URL "${result.sourceUrl}".`);
  }
  if (!result.languageMeta.includes(testCase.sourceLabel)) {
    throw new Error(
      `${testCase.language}: language status did not name "${testCase.sourceLabel}".`,
    );
  }
  if (result.treeCount < 6) {
    throw new Error(`${testCase.language}: graph was too small. Count=${result.treeCount}`);
  }

  return result;
}

async function main() {
  const url =
    process.env.THE_VAULT_URL ||
    "http://127.0.0.1:8765/index.html?refresh=1";
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  page.setDefaultTimeout(10000);
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "the-vault-language-smoke-"));
  const obsidianVaultPath = path.join(temporaryRoot, "中文知识库");
  const englishVaultPath = path.join(temporaryRoot, "English Knowledge Base");
  await fs.mkdir(obsidianVaultPath);
  await fs.mkdir(englishVaultPath);
  await Promise.all([
    fs.writeFile(
      path.join(obsidianVaultPath, "中文心理学.md"),
      "# 中文心理学\n\n这是一个使用中文撰写的心理学知识库，讨论认知、行为、发展与社会关系。\n",
    ),
    fs.writeFile(
      path.join(obsidianVaultPath, "研究方法.md"),
      "# 研究方法\n\n观察、实验、访谈和统计分析共同构成心理学研究的方法体系。\n",
    ),
    fs.writeFile(
      path.join(englishVaultPath, "Cognitive psychology.md"),
      "# Cognitive psychology\n\nThis vault studies the mind, memory, attention, and the way people learn from experience.\n",
    ),
    fs.writeFile(
      path.join(englishVaultPath, "Research methods.md"),
      "# Research methods\n\nObservation and experiments are used to test ideas with evidence and careful analysis.\n",
    ),
  ]);

  const consoleMessages = [];
  page.on("console", (message) => {
    const text = message.text();
    if (!/GL Driver Message|CONTEXT_LOST_WEBGL|Context Lost|Context Restored/.test(text)) {
      consoleMessages.push(`console:${message.type()}:${text}`);
    }
  });
  page.on("pageerror", (error) => {
    consoleMessages.push(`pageerror:${error.message}`);
  });

  try {
    await installWikipediaMock(page);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => document.querySelectorAll("#note-tree .tree-item").length >= 12,
    );

    const explicitResults = [];
    for (const testCase of languageCases) {
      explicitResults.push({
        language: testCase.language,
        ...(await runSearchCase(page, testCase)),
      });
    }

    await page.selectOption("#wikipedia-language", "auto");
    await page.fill("#search-input", "心理学");
    await page.press("#search-input", "Enter");
    await page.waitForFunction(
      () => document.getElementById("source-link")?.textContent?.trim() === "中文维基百科",
    );
    const autoChinese = await page.evaluate(() => ({
      title: document.getElementById("article-title")?.textContent?.trim() || "",
      sourceLabel: document.getElementById("source-link")?.textContent?.trim() || "",
      sourceUrl: document.getElementById("source-link")?.href || "",
    }));

    const vaultInput = page.locator("#vault-input");
    await vaultInput.setInputFiles(obsidianVaultPath);
    await page.waitForFunction(
      () => /Imported "中文知识库"/.test(
        document.getElementById("graph-status")?.textContent || "",
      ),
    );
    const vaultLanguageMeta = await page
      .locator("#wikipedia-language-meta")
      .textContent();
    if (!vaultLanguageMeta?.includes("中文维基百科")) {
      throw new Error(`Obsidian language was not inferred as Chinese: "${vaultLanguageMeta}".`);
    }

    await page.fill("#search-input", "CBT");
    await page.press("#search-input", "Enter");
    await page.waitForFunction(
      () =>
        document.getElementById("article-title")?.textContent?.trim() === "CBT" &&
        document.getElementById("source-link")?.textContent?.trim() === "中文维基百科",
    );
    const obsidianAdaptation = await page.evaluate(() => ({
      title: document.getElementById("article-title")?.textContent?.trim() || "",
      sourceLabel: document.getElementById("source-link")?.textContent?.trim() || "",
      sourceUrl: document.getElementById("source-link")?.href || "",
      languageMeta:
        document.getElementById("wikipedia-language-meta")?.textContent?.trim() || "",
    }));

    await vaultInput.setInputFiles(englishVaultPath);
    await page.waitForFunction(
      () => /Imported "English Knowledge Base"/.test(
        document.getElementById("graph-status")?.textContent || "",
      ),
    );
    const englishVaultLanguageMeta = await page
      .locator("#wikipedia-language-meta")
      .textContent();
    if (!englishVaultLanguageMeta?.includes("English Wikipedia")) {
      throw new Error(
        `Obsidian language did not switch back to English: "${englishVaultLanguageMeta}".`,
      );
    }

    await page.fill("#search-input", "Memory");
    await page.press("#search-input", "Enter");
    await page.waitForFunction(
      () =>
        document.getElementById("article-title")?.textContent?.trim() === "Memory" &&
        document.getElementById("source-link")?.textContent?.trim() === "English Wikipedia",
    );
    const englishObsidianAdaptation = await page.evaluate(() => ({
      title: document.getElementById("article-title")?.textContent?.trim() || "",
      sourceLabel: document.getElementById("source-link")?.textContent?.trim() || "",
      sourceUrl: document.getElementById("source-link")?.href || "",
      languageMeta:
        document.getElementById("wikipedia-language-meta")?.textContent?.trim() || "",
    }));

    if (consoleMessages.length) {
      throw new Error(`Unexpected browser console output:\n${consoleMessages.join("\n")}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          url,
          explicitResults,
          autoChinese,
          obsidianAdaptation,
          englishObsidianAdaptation,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
