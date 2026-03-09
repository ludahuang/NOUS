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

    const beforeHover = await bubble.boundingBox();
    await bubble.hover();
    await page.waitForTimeout(180);
    const afterHover = await bubble.boundingBox();
    if (!beforeHover || !afterHover || afterHover.width <= beforeHover.width) {
      throw new Error("Agent bubble did not expand on hover.");
    }

    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error("Viewport size unavailable.");
    }

    if (afterHover.x < viewport.width * 0.6 || afterHover.y < viewport.height * 0.65) {
      throw new Error(`Agent bubble is not in the bottom-right region. x=${afterHover.x} y=${afterHover.y}`);
    }

    const panel = page.locator("#agent-panel");
    if (!(await panel.evaluate((node) => node.hidden))) {
      throw new Error("Agent chamber should start hidden.");
    }

    await page.locator("#note-tree .tree-item").filter({ hasText: "Connectome" }).first().click();
    await page.waitForTimeout(250);
    await bubble.click();
    await panel.waitFor({ state: "visible" });

    const revealButton = page.locator("#agent-action-reveal");
    await revealButton.click({ force: true });
    await page.waitForFunction(
      () => document.querySelectorAll("#agent-link-list .agent-bridge-card").length >= 1,
      undefined,
      { timeout: 5000 },
    );

    const suggestionCount = await page.locator("#agent-link-list .agent-bridge-card").count();
    if (suggestionCount < 1 || suggestionCount > 3) {
      throw new Error(`Unexpected number of bridge suggestions: ${suggestionCount}`);
    }

    const revealSummary = await page.locator("#agent-summary").textContent();
    if (!/bridge/i.test(revealSummary || "")) {
      throw new Error(`Unexpected reveal summary: ${revealSummary}`);
    }

    const firstSuggestionTitle = await page
      .locator("#agent-link-list .agent-bridge-card strong")
      .first()
      .textContent();
    if (!firstSuggestionTitle?.includes("↔")) {
      throw new Error(`Unexpected bridge title: ${firstSuggestionTitle}`);
    }

    const drafted = await page.evaluate(() => {
      const button = document.querySelector("#agent-link-list [data-agent-draft-index]");
      if (!button) {
        return false;
      }
      button.click();
      return true;
    });
    if (!drafted) {
      throw new Error("Draft bridge button could not be clicked.");
    }
    await page.waitForTimeout(300);

    const editorPanel = page.locator("#editor-panel");
    if (!(await editorPanel.isVisible())) {
      throw new Error("Draft bridge did not open the editor.");
    }

    const draftTitle = await page.locator("#editor-title").inputValue();
    if (!draftTitle.trim()) {
      throw new Error("Draft bridge title is empty.");
    }

    await page.evaluate(() => {
      document.getElementById("cancel-editor")?.click();
    });
    await page.waitForTimeout(250);
    if (await panel.evaluate((node) => node.hidden)) {
      await bubble.click();
      await panel.waitFor({ state: "visible" });
    }
    await revealButton.click({ force: true });
    await page.waitForFunction(
      () => document.querySelectorAll("#agent-link-list .agent-bridge-card").length >= 1,
      undefined,
      { timeout: 5000 },
    );

    const messageCountBeforeInspect = await page.locator("#agent-chat-log .agent-message").count();
    const inspected = await page.evaluate(() => {
      const button = document.querySelector("#agent-link-list [data-agent-inspect-index]");
      if (!button) {
        return false;
      }
      button.click();
      return true;
    });
    if (!inspected) {
      throw new Error("Inspect button could not be clicked.");
    }
    await page.waitForTimeout(300);
    const messageCountAfterInspect = await page.locator("#agent-chat-log .agent-message").count();
    if (messageCountAfterInspect <= messageCountBeforeInspect) {
      throw new Error("Inspect did not produce an agent response.");
    }

    await page.fill("#agent-chat-input", "show me the missing bridge around hippocampus");
    await page.press("#agent-chat-input", "Enter");
    await page.waitForTimeout(400);

    const messageCountAfterChat = await page.locator("#agent-chat-log .agent-message").count();
    if (messageCountAfterChat <= messageCountAfterInspect) {
      throw new Error("Chat did not produce a secondary relation response.");
    }

    const chatText = await page.locator("#agent-chat-log").textContent();
    if (!/bridge|hippocampus/i.test(chatText || "")) {
      throw new Error(`Unexpected chat response: ${chatText}`);
    }

    await page.click("#agent-close");
    await page.waitForTimeout(150);
    if (!(await panel.evaluate((node) => node.hidden))) {
      throw new Error("Agent chamber did not close.");
    }

    if (consoleMessages.length) {
      throw new Error(`Unexpected browser console output:\n${consoleMessages.join("\n")}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          url,
          bubble: {
            beforeHover,
            afterHover,
          },
          suggestionCount,
          revealSummary,
          draftTitle,
          messageCountAfterChat,
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
