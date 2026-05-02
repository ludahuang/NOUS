import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { installWikipediaMock } from "./agent-wikipedia-mock.mjs";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  const outputDir = new URL("../docs/images/", import.meta.url);
  const outputDirPath = fileURLToPath(outputDir);

  await mkdir(outputDirPath, { recursive: true });
  await installWikipediaMock(page);

  await page.goto("http://127.0.0.1:8765/index.html?refresh=1", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll("#note-tree .tree-item").length >= 12);
  await page.locator("#note-tree .tree-item").filter({ hasText: "Connectome" }).first().click();
  await page.waitForTimeout(300);

  await page.screenshot({
    path: fileURLToPath(new URL("agent-bubble-home.png", outputDir)),
    fullPage: false,
  });

  await page.click("#agent-launcher");
  await page.locator("#agent-panel").waitFor({ state: "visible" });
  await page.locator("#agent-action-reveal").click({ force: true });
  await page.waitForTimeout(350);
  await page.screenshot({
    path: fileURLToPath(new URL("agent-panel-open.png", outputDir)),
    fullPage: false,
  });

  await page.locator("#agent-link-list [data-agent-draft-index]").first().click({ force: true });
  await page.waitForTimeout(350);
  await page.screenshot({
    path: fileURLToPath(new URL("agent-draft-editor.png", outputDir)),
    fullPage: false,
  });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
