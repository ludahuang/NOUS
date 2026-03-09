import { chromium } from "playwright";
import { installWikipediaMock } from "./agent-wikipedia-mock.mjs";

async function main() {
  const url = process.env.THE_VAULT_URL || "http://127.0.0.1:8765/index.html?refresh=1";
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  page.setDefaultTimeout(7000);

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

    const bubble = page.locator("#agent-launcher");
    await bubble.waitFor({ state: "visible" });
    const bubbleBox = await bubble.boundingBox();
    if (!bubbleBox) {
      throw new Error("Agent bubble did not render.");
    }

    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error("Viewport size unavailable.");
    }

    if (bubbleBox.x < viewport.width * 0.65 || bubbleBox.y < viewport.height * 0.65) {
      throw new Error(
        `Agent bubble is not in the bottom-right region. x=${bubbleBox.x} y=${bubbleBox.y}`,
      );
    }

    const panel = page.locator("#agent-panel");
    if (!(await panel.evaluate((node) => node.hidden))) {
      throw new Error("Agent panel should start hidden.");
    }

    await page.locator("#note-tree .tree-item").filter({ hasText: "Connectome" }).first().click();
    await page.waitForTimeout(250);
    await bubble.click();
    await panel.waitFor({ state: "visible" });

    const digestCount = await page.locator("#agent-digest .agent-card").count();
    if (digestCount < 1) {
      throw new Error("Agent digest did not render.");
    }

    const initialMessageCount = await page.locator("#agent-chat-log .agent-message").count();
    await page.locator("#agent-action-summary").click({ force: true });
    await page.waitForFunction(
      (count) => document.querySelectorAll("#agent-chat-log .agent-message").length > count,
      initialMessageCount,
      { timeout: 5000 },
    );

    const summaryMessageCount = await page.locator("#agent-chat-log .agent-message").count();
    await page.locator("#agent-action-structure").click({ force: true });
    await page.waitForFunction(
      (count) => document.querySelectorAll("#agent-chat-log .agent-message").length > count,
      summaryMessageCount,
      { timeout: 5000 },
    );

    const structureSummary = await page.locator("#agent-summary").textContent();
    if (!/structural move/i.test(structureSummary || "")) {
      throw new Error(`Unexpected structure summary: ${structureSummary}`);
    }

    const linkCards = await page.locator("#agent-link-list .agent-card").count();
    if (linkCards < 1) {
      throw new Error("No agent link opportunities rendered.");
    }

    const bridgeButtons = page.locator("#agent-link-list [data-agent-bridge-left]");
    const bridgeCount = await bridgeButtons.count();
    if (bridgeCount < 1) {
      throw new Error("No bridge-draft button rendered in link opportunities.");
    }
    const bridgeClicked = await page.evaluate(() => {
      const button = document.querySelector("#agent-link-list [data-agent-bridge-left]");
      if (!button) {
        return false;
      }
      button.scrollIntoView({ block: "center" });
      button.click();
      return true;
    });
    if (!bridgeClicked) {
      throw new Error("Bridge-draft button could not be clicked.");
    }
    await page.waitForTimeout(250);

    const editorPanel = page.locator("#editor-panel");
    if (!(await editorPanel.isVisible())) {
      throw new Error("Bridge draft did not open the editor.");
    }

    const bridgeTitle = await page.locator("#editor-title").inputValue();
    if (!/bridge/i.test(bridgeTitle)) {
      throw new Error(`Bridge draft title is incorrect: ${bridgeTitle}`);
    }

    await page.click("#cancel-editor");
    await page.waitForTimeout(250);
    if (await panel.evaluate((node) => node.hidden)) {
      await bubble.click();
      await panel.waitFor({ state: "visible" });
    }

    await page.evaluate(() => {
      document.getElementById("agent-chat-input")?.scrollIntoView({ block: "center" });
    });
    await page.fill("#agent-chat-input", "draft a note about hippocampus");
    await page.press("#agent-chat-input", "Enter");
    await page.waitForTimeout(250);

    const draftButtons = await page.locator("#agent-draft-list [data-agent-draft-index]").count();
    if (draftButtons < 1) {
      throw new Error("Chat-driven draft suggestions did not render.");
    }

    await page.locator("#agent-draft-list [data-agent-draft-index]").first().click();
    await page.waitForTimeout(250);

    const requestedTitle = await page.locator("#editor-title").inputValue();
    if (requestedTitle.trim().toLowerCase() !== "hippocampus") {
      throw new Error(`Requested draft title was not preserved: ${requestedTitle}`);
    }

    await page.click("#agent-close");
    await page.waitForTimeout(150);
    if (!(await panel.evaluate((node) => node.hidden))) {
      throw new Error("Agent panel did not close.");
    }

    if (consoleMessages.length) {
      throw new Error(`Unexpected browser console output:\n${consoleMessages.join("\n")}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          url,
          bubbleBox,
          digestCount,
          linkCards,
          structureSummary,
          requestedTitle,
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
