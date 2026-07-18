import { chromium } from "playwright";
import { installWikipediaMock } from "./agent-wikipedia-mock.mjs";

async function main() {
  const url = process.env.THE_VAULT_URL || "http://127.0.0.1:8765/index.html?refresh=1";
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  page.setDefaultTimeout(8000);

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
      undefined,
      { timeout: 10000 },
    );

    await page.locator("#note-tree .tree-item").filter({ hasText: "Connectome" }).first().click();
    await page.waitForTimeout(250);

    const initialState = await page.evaluate(() => ({
      title: document.getElementById("article-title")?.textContent?.trim() || "",
      summary: document.getElementById("article-summary")?.textContent?.trim() || "",
      sourceLabel: document.getElementById("source-link")?.textContent?.trim() || "",
      legendCount: document.querySelectorAll("#legend .legend-chip .swatch").length,
      hasArticleBody: Boolean(document.getElementById("article-body")),
    }));

    if (initialState.title !== "Connectome") {
      throw new Error(`Expected default note to be Connectome, got "${initialState.title}".`);
    }
    if (initialState.sourceLabel !== "Wikipedia") {
      throw new Error(`Expected source badge to read Wikipedia, got "${initialState.sourceLabel}".`);
    }
    if (initialState.legendCount < 3) {
      throw new Error(`Legend did not render enough folders. Count=${initialState.legendCount}`);
    }
    if (initialState.hasArticleBody) {
      throw new Error("Article body node should not exist in Note.md.");
    }

    await page.click("#tab-inspector");
    await page.waitForTimeout(150);

    const inspectorState = await page.evaluate(() => ({
      wikiHidden: document.getElementById("note-panel-wiki")?.hidden,
      inspectorHidden: document.getElementById("note-panel-inspector")?.hidden,
      diagnosticsTitle: document.getElementById("diagnostics-title")?.textContent?.trim() || "",
    }));

    if (!inspectorState.wikiHidden || inspectorState.inspectorHidden) {
      throw new Error("Note.md and Inspector tabs did not switch correctly.");
    }
    if (inspectorState.diagnosticsTitle !== "Connectome") {
      throw new Error(`Inspector did not follow the selected note. Got "${inspectorState.diagnosticsTitle}".`);
    }

    await page.click("#tab-wiki");
    await page.fill("#search-input", "Hippocampus");
    await page.press("#search-input", "Enter");
    await page.waitForFunction(
      () => /Hippocampus/i.test(document.getElementById("article-title")?.textContent || ""),
      undefined,
      { timeout: 10000 },
    );
    await page.waitForTimeout(350);

    const discoveryState = await page.evaluate(() => ({
      title: document.getElementById("article-title")?.textContent?.trim() || "",
      search: document.getElementById("search-input")?.value || "",
      treeCount: document.querySelectorAll("#note-tree .tree-item").length,
      status: document.getElementById("graph-status")?.textContent?.trim() || "",
    }));

    if (discoveryState.title !== "Hippocampus") {
      throw new Error(`Find note did not rebuild around Hippocampus. Got "${discoveryState.title}".`);
    }
    if (discoveryState.search !== "") {
      throw new Error("Find note should clear the search field after discovery.");
    }
    if (discoveryState.treeCount < 6) {
      throw new Error(`Fresh discovery graph looks too small. Count=${discoveryState.treeCount}`);
    }

    await page.click("#menu-obsidian");
    await page.click("#new-note");
    await page.waitForSelector("#editor-panel:not([hidden])");
    await page.fill("#editor-title", "Smoke Manual Note");
    await page.fill("#editor-folder", "Scratchpad/Test");
    await page.fill("#editor-body-input", "# Smoke Manual Note\n\nLinks to [[Hippocampus]].");
    await page.click("#save-note");
    await page.waitForFunction(
      () =>
        /Saved local note|Used existing Wikipedia entry|Built a new neural network/.test(
          document.getElementById("graph-status")?.textContent || "",
        ),
      undefined,
      { timeout: 10000 },
    );
    await page.waitForTimeout(350);

    const manualNoteState = await page.evaluate(() => ({
      editorHidden: document.getElementById("editor-panel")?.hidden,
      treeHasNote: Boolean(
        Array.from(document.querySelectorAll("#note-tree .tree-item")).find((node) =>
          node.textContent?.includes("Smoke Manual Note"),
        ),
      ),
      status: document.getElementById("graph-status")?.textContent?.trim() || "",
    }));

    if (!manualNoteState.editorHidden || !manualNoteState.treeHasNote) {
      throw new Error("Obsidian > New did not save the manual note into the live graph.");
    }

    await page.locator("#note-tree .tree-item").filter({ hasText: "Hippocampus" }).first().click();
    await page.waitForTimeout(200);
    await page.click("#agent-launcher", { force: true });
    await page.locator("#agent-panel").waitFor({ state: "visible" });
    await page.click("#agent-action-reveal", { force: true });
    await page.waitForFunction(
      () => document.querySelectorAll("#agent-link-list .agent-bridge-card").length >= 1,
      undefined,
      { timeout: 5000 },
    );
    const openedDraft = await page.evaluate(() => {
      const button = document.querySelector("#agent-link-list [data-agent-draft-index]");
      if (!button) {
        return false;
      }
      button.click();
      return true;
    });
    if (!openedDraft) {
      throw new Error("Agent bridge draft button could not be clicked.");
    }
    await page.waitForSelector("#agent-draft-panel:not([hidden])");

    const assistantDraftState = await page.evaluate(() => ({
      draftVisible: !document.getElementById("agent-draft-panel")?.hidden,
      editorVisible: !document.getElementById("editor-panel")?.hidden,
      title: document.getElementById("agent-draft-title")?.value || "",
    }));

    if (!assistantDraftState.draftVisible || assistantDraftState.editorVisible) {
      throw new Error("Agent bridge draft should stay inside the assistant shell.");
    }
    if (!assistantDraftState.title.trim()) {
      throw new Error("Agent bridge draft title is empty.");
    }

    await page.fill("#agent-draft-title", "Smoke Agent Bridge");
    await page.fill(
      "#agent-draft-body",
      "# Smoke Agent Bridge\n\nLinks [[Hippocampus]] to [[Amygdala]].",
    );
    await page.click("#agent-draft-save");
    await page.waitForFunction(
      () =>
        /Saved bridge note|Used existing Wikipedia entry|Built a new neural network/.test(
          document.getElementById("graph-status")?.textContent || "",
        ),
      undefined,
      { timeout: 10000 },
    );
    await page.waitForTimeout(350);

    const savedBridgeState = await page.evaluate(() => ({
      draftHidden: document.getElementById("agent-draft-panel")?.hidden,
      treeHasBridge: Boolean(
        Array.from(document.querySelectorAll("#note-tree .tree-item")).find((node) =>
          node.textContent?.includes("Smoke Agent Bridge"),
        ),
      ),
      status: document.getElementById("graph-status")?.textContent?.trim() || "",
    }));

    if (!savedBridgeState.draftHidden || !savedBridgeState.treeHasBridge) {
      throw new Error("Agent bridge draft did not save back into the vault graph.");
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.click("#download-vault");
    const download = await downloadPromise;
    const downloadName = await download.suggestedFilename();

    if (!/^the-vault-.*\.zip$/i.test(downloadName)) {
      throw new Error(`Unexpected vault download filename "${downloadName}".`);
    }

    await page.click("#menu-wikipedia");
    await page.click("#reset-view");
    await page.waitForFunction(
      () => /Connectome/i.test(document.getElementById("article-title")?.textContent || ""),
      undefined,
      { timeout: 10000 },
    );
    await page.waitForTimeout(350);

    const resetState = await page.evaluate(() => ({
      title: document.getElementById("article-title")?.textContent?.trim() || "",
      search: document.getElementById("search-input")?.value || "",
      hasManualNote: Boolean(
        Array.from(document.querySelectorAll("#note-tree .tree-item")).find((node) =>
          node.textContent?.includes("Smoke Manual Note"),
        ),
      ),
      hasBridgeNote: Boolean(
        Array.from(document.querySelectorAll("#note-tree .tree-item")).find((node) =>
          node.textContent?.includes("Smoke Agent Bridge"),
        ),
      ),
      status: document.getElementById("graph-status")?.textContent?.trim() || "",
    }));

    if (resetState.title !== "Connectome") {
      throw new Error(`Reset did not restore the default vault. Got "${resetState.title}".`);
    }
    if (resetState.search !== "") {
      throw new Error("Reset should clear the search field.");
    }
    if (resetState.hasManualNote || resetState.hasBridgeNote) {
      throw new Error("Reset should clear local Obsidian and agent-added notes.");
    }

    if (consoleMessages.length) {
      throw new Error(`Unexpected browser console output:\n${consoleMessages.join("\n")}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          url,
          initialState,
          inspectorState,
          discoveryState,
          manualNoteState,
          assistantDraftState,
          savedBridgeState,
          downloadName,
          resetState,
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
