import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { installWikipediaMock } from "./agent-wikipedia-mock.mjs";

async function main() {
  const url = process.env.THE_VAULT_URL || "http://127.0.0.1:8765/index.html?refresh=1";
  const vaultPath = fileURLToPath(
    new URL("../vaults/Psychology_Genealogy_Atlas/", import.meta.url),
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  page.setDefaultTimeout(10000);

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

    await page.click("#menu-obsidian");
    await page.locator("#vault-input").setInputFiles(vaultPath);
    await page.waitForFunction(
      () => /Imported "Psychology_Genealogy_Atlas"/.test(
        document.getElementById("graph-status")?.textContent || "",
      ),
    );

    const fusionState = await page.evaluate(() => ({
      pages: document.getElementById("stat-neurons")?.textContent?.trim() || "",
      links: document.getElementById("stat-synapses")?.textContent?.trim() || "",
      folders: document.getElementById("stat-regions")?.textContent?.trim() || "",
      status: document.getElementById("graph-status")?.textContent?.trim() || "",
      switchHidden: document.getElementById("graph-view-switch")?.hidden,
      activeMode: document.querySelector("#graph-view-switch .active")?.dataset.graphView || "",
      selectedTitle: document.getElementById("article-title")?.textContent?.trim() || "",
      clusters: Array.from(document.querySelectorAll("#legend .legend-chip")).map((node) =>
        node.textContent?.trim(),
      ),
    }));

    await page.click('[data-graph-view="vault"]');
    await page.waitForFunction(
      () => document.querySelector("#graph-view-switch .active")?.dataset.graphView === "vault",
    );

    const vaultState = await page.evaluate(() => ({
      pages: document.getElementById("stat-neurons")?.textContent?.trim() || "",
      links: document.getElementById("stat-synapses")?.textContent?.trim() || "",
      folders: document.getElementById("stat-regions")?.textContent?.trim() || "",
      activeMode: document.querySelector("#graph-view-switch .active")?.dataset.graphView || "",
    }));

    if (
      vaultState.pages !== "344" ||
      vaultState.links !== "572" ||
      vaultState.folders !== "6" ||
      vaultState.activeMode !== "vault"
    ) {
      throw new Error(
        `Vault-only topology was not preserved: ${JSON.stringify({ vaultState, fusionState })}`,
      );
    }

    if (
      Number(fusionState.pages.replace(/,/g, "")) <= Number(vaultState.pages) ||
      Number(fusionState.links.replace(/,/g, "")) <= Number(vaultState.links.replace(/,/g, "")) ||
      fusionState.folders !== "6"
    ) {
      throw new Error(
        `Fusion topology did not extend the private vault: ${JSON.stringify({ vaultState, fusionState })}`,
      );
    }
    if (fusionState.switchHidden || fusionState.activeMode !== "fusion") {
      throw new Error(`Fusion topology did not become the active import view: ${JSON.stringify(fusionState)}`);
    }
    if (fusionState.selectedTitle !== "心理学谱系总图") {
      throw new Error(`Global hub was not selected after import: ${fusionState.selectedTitle}`);
    }
    if (
      fusionState.clusters.length !== 6 ||
      fusionState.clusters.some((cluster) => /Cortical Systems|Wikipedia/i.test(cluster))
    ) {
      throw new Error(`Fusion topology contains unexpected source clusters: ${fusionState.clusters.join(", ")}`);
    }

    await page.click('[data-graph-view="fusion"]');
    await page.waitForFunction(
      (expectedPages) =>
        document.querySelector("#graph-view-switch .active")?.dataset.graphView === "fusion" &&
        document.getElementById("stat-neurons")?.textContent?.trim() === expectedPages,
      fusionState.pages,
    );

    if (consoleMessages.length) {
      throw new Error(`Unexpected browser console output:\n${consoleMessages.join("\n")}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          url,
          vaultState,
          fusionState,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
