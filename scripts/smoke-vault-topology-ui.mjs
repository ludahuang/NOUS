import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { installWikipediaMock } from "./agent-wikipedia-mock.mjs";

async function main() {
  const url =
    process.env.THE_VAULT_URL ||
    "http://127.0.0.1:8765/index.html?refresh=1&e2e=1";
  const vaultPath = fileURLToPath(
    new URL("../vaults/Psychology_Genealogy_Atlas/", import.meta.url),
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 980 },
    deviceScaleFactor: 2,
  });
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
    const rendererSizing = await page.evaluate(() => {
      const viewport = document.getElementById("graph-viewport")?.getBoundingClientRect();
      const canvas = document.querySelector("#graph-viewport canvas")?.getBoundingClientRect();
      const header = document.querySelector(".stage-header")?.getBoundingClientRect();
      const sidebar = document.querySelector(".vault-sidebar")?.getBoundingClientRect();
      const notePane = document.querySelector(".note-pane")?.getBoundingClientRect();
      return {
        viewportLeft: viewport?.left || 0,
        viewportTop: viewport?.top || 0,
        viewportRight: viewport?.right || 0,
        viewportWidth: viewport?.width || 0,
        viewportHeight: viewport?.height || 0,
        canvasWidth: canvas?.width || 0,
        canvasHeight: canvas?.height || 0,
        headerBottom: header?.bottom || 0,
        sidebarRight: sidebar?.right || 0,
        notePaneLeft: notePane?.left || 0,
      };
    });
    if (
      Math.abs(rendererSizing.canvasWidth - rendererSizing.viewportWidth) > 1 ||
      Math.abs(rendererSizing.canvasHeight - rendererSizing.viewportHeight) > 1
    ) {
      throw new Error(
        `Renderer CSS size drifted from its viewport: ${JSON.stringify(rendererSizing)}`,
      );
    }
    if (
      rendererSizing.viewportTop < rendererSizing.headerBottom ||
      rendererSizing.viewportLeft < rendererSizing.sidebarRight ||
      rendererSizing.viewportRight > rendererSizing.notePaneLeft
    ) {
      throw new Error(
        `Renderer overlapped a workspace panel: ${JSON.stringify(rendererSizing)}`,
      );
    }

    await page.click("#menu-obsidian");
    await page.locator("#vault-input").setInputFiles(vaultPath);
    await page.waitForFunction(
      () => /Imported "Psychology_Genealogy_Atlas"/.test(
        document.getElementById("graph-status")?.textContent || "",
      ),
    );
    await page.waitForFunction(
      () =>
        window.__THE_VAULT_E2E__ &&
        !window.__THE_VAULT_E2E__.getCameraAlignmentSnapshot().cameraAnimating,
    );

    const overviewAlignment = await page.evaluate(() =>
      window.__THE_VAULT_E2E__.getCameraAlignmentSnapshot(),
    );
    if (
      Math.abs(overviewAlignment.graphCenter?.x || 0) > 0.015 ||
      Math.abs(overviewAlignment.graphCenter?.y || 0) > 0.015 ||
      overviewAlignment.maxGraphX > 0.94 ||
      overviewAlignment.maxGraphY > 0.94
    ) {
      throw new Error(
        `Imported graph was not centered and framed: ${JSON.stringify(overviewAlignment)}`,
      );
    }

    const standardViewport = await page.evaluate(() => {
      const viewport = document.getElementById("graph-viewport").getBoundingClientRect();
      return {
        left: viewport.left,
        top: viewport.top,
        width: viewport.width,
        height: viewport.height,
      };
    });
    await page.mouse.click(
      standardViewport.left + 18,
      standardViewport.top + 18,
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".workspace-shell")?.dataset
          .connectomeImmersive === "true",
    );
    await page.waitForFunction(
      () =>
        !window.__THE_VAULT_E2E__
          .getCameraAlignmentSnapshot().cameraAnimating,
    );
    const immersiveState = await page.evaluate(() => {
      const viewport = document.getElementById("graph-viewport").getBoundingClientRect();
      const sidebar = getComputedStyle(document.querySelector(".vault-sidebar"));
      const notePane = getComputedStyle(document.querySelector(".note-pane"));
      const header = getComputedStyle(document.querySelector(".stage-header"));
      const overlays = [...document.querySelectorAll(".stage-overlay")].map(
        (overlay) => getComputedStyle(overlay).visibility,
      );
      const assistant = getComputedStyle(document.querySelector(".assistant-shell"));
      return {
        viewport: {
          left: viewport.left,
          top: viewport.top,
          width: viewport.width,
          height: viewport.height,
        },
        sidebarVisibility: sidebar.visibility,
        notePaneVisibility: notePane.visibility,
        headerVisibility: header.visibility,
        overlayVisibilities: overlays,
        assistantVisibility: assistant.visibility,
        alignment: window.__THE_VAULT_E2E__.getCameraAlignmentSnapshot(),
      };
    });
    if (
      immersiveState.viewport.left !== 0 ||
      immersiveState.viewport.top !== 0 ||
      immersiveState.viewport.width !== 1440 ||
      immersiveState.viewport.height !== 980 ||
      immersiveState.sidebarVisibility !== "hidden" ||
      immersiveState.notePaneVisibility !== "hidden" ||
      immersiveState.headerVisibility !== "hidden" ||
      immersiveState.overlayVisibilities.some(
        (visibility) => visibility !== "hidden",
      ) ||
      immersiveState.assistantVisibility !== "visible" ||
      Math.abs(immersiveState.alignment.graphCenter?.x || 0) > 0.015 ||
      Math.abs(immersiveState.alignment.graphCenter?.y || 0) > 0.015
    ) {
      throw new Error(
        `Immersive connectome state was invalid: ${JSON.stringify(immersiveState)}`,
      );
    }

    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () =>
        document.querySelector(".workspace-shell")?.dataset
          .connectomeImmersive === "false",
    );
    const restoredViewport = await page.evaluate(() => {
      const viewport = document.getElementById("graph-viewport").getBoundingClientRect();
      return {
        left: viewport.left,
        top: viewport.top,
        width: viewport.width,
        height: viewport.height,
      };
    });
    if (
      Math.abs(restoredViewport.left - standardViewport.left) > 1 ||
      Math.abs(restoredViewport.top - standardViewport.top) > 1 ||
      Math.abs(restoredViewport.width - standardViewport.width) > 1 ||
      Math.abs(restoredViewport.height - standardViewport.height) > 1
    ) {
      throw new Error(
        `Connectome viewport did not restore: ${JSON.stringify({
          standardViewport,
          restoredViewport,
        })}`,
      );
    }

    await page.locator("#toggle-motion").click({ force: true });
    await page.waitForTimeout(320);

    const labelTarget = await page.evaluate(() => {
      const targets = window.__THE_VAULT_E2E__.getTagClickTargets();
      const canvas = document.querySelector("#graph-viewport canvas");
      const rect = canvas.getBoundingClientRect();
      const candidates = targets
        .filter((target) => target.id !== window.__THE_VAULT_E2E__
          .getCameraAlignmentSnapshot().selectedPageId)
        .map((target) => {
          const clientX = rect.left + ((target.x + 1) * rect.width) / 2;
          const clientY = rect.top + ((1 - target.y) * rect.height) / 2;
          const nearestDistance = targets.reduce((nearest, other) => {
            if (other.id === target.id) {
              return nearest;
            }
            return Math.min(
              nearest,
              Math.hypot(other.x - target.x, other.y - target.y),
            );
          }, Infinity);

          return {
            ...target,
            clientX,
            clientY,
            nearestDistance,
            unobstructed: document.elementFromPoint(clientX, clientY) === canvas,
          };
        })
        .filter((target) => target.unobstructed)
        .sort((left, right) => right.nearestDistance - left.nearestDistance);

      return candidates[0] || null;
    });
    if (!labelTarget) {
      throw new Error("No unobstructed in-scene label was available for the click test.");
    }

    await page.mouse.click(labelTarget.clientX, labelTarget.clientY);
    await page.waitForFunction(
      (expectedPageId) => {
        const snapshot =
          window.__THE_VAULT_E2E__?.getCameraAlignmentSnapshot();
        return (
          snapshot &&
          snapshot.selectedPageId === expectedPageId &&
          !snapshot.cameraAnimating &&
          Math.abs(snapshot.selected?.x || 0) < 0.015 &&
          Math.abs(snapshot.selected?.y || 0) < 0.015
        );
      },
      labelTarget.id,
    );
    const clickedAlignment = await page.evaluate(() =>
      window.__THE_VAULT_E2E__.getCameraAlignmentSnapshot(),
    );

    await page.locator("#note-tree .tree-item", { hasText: "心理学思想史" }).first().click();
    await page.waitForFunction(
      () => {
        const snapshot =
          window.__THE_VAULT_E2E__?.getCameraAlignmentSnapshot();
        return (
          snapshot &&
          snapshot.selectedTitle === "心理学思想史" &&
          !snapshot.cameraAnimating &&
          Math.abs(snapshot.selected?.x || 0) < 0.015 &&
          Math.abs(snapshot.selected?.y || 0) < 0.015
        );
      },
    );
    const focusedAlignment = await page.evaluate(() =>
      window.__THE_VAULT_E2E__.getCameraAlignmentSnapshot(),
    );

    await page.locator("#note-tree .tree-item", { hasText: "心理学谱系总图" }).first().click();
    await page.waitForFunction(
      () => {
        const snapshot =
          window.__THE_VAULT_E2E__?.getCameraAlignmentSnapshot();
        return (
          snapshot &&
          snapshot.selectedTitle === "心理学谱系总图" &&
          !snapshot.cameraAnimating
        );
      },
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

    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobileConsoleErrors = [];
    mobilePage.on("console", (message) => {
      if (message.type() === "error") {
        mobileConsoleErrors.push(message.text());
      }
    });
    await installWikipediaMock(mobilePage);
    await mobilePage.goto(url, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForFunction(
      () => document.querySelectorAll("#note-tree .tree-item").length >= 12,
    );
    await mobilePage.locator("#mobile-panel-toggle").click();
    await mobilePage.waitForFunction(
      () =>
        document.querySelector(".workspace-shell")?.dataset
          .connectomeImmersive === "true",
    );
    await mobilePage.waitForTimeout(220);
    const mobileImmersiveState = await mobilePage.evaluate(() => {
      const viewport = document.getElementById("graph-viewport").getBoundingClientRect();
      const toggle = document.getElementById("mobile-panel-toggle");
      return {
        viewport: {
          left: viewport.left,
          top: viewport.top,
          width: viewport.width,
          height: viewport.height,
        },
        documentHeight: document.documentElement.scrollHeight,
        sidebarDisplay: getComputedStyle(
          document.querySelector(".vault-sidebar"),
        ).display,
        notePaneDisplay: getComputedStyle(
          document.querySelector(".note-pane"),
        ).display,
        headerVisibility: getComputedStyle(
          document.querySelector(".stage-header"),
        ).visibility,
        assistantVisibility: getComputedStyle(
          document.querySelector(".assistant-shell"),
        ).visibility,
        menuVisibility: getComputedStyle(toggle).visibility,
        menuExpanded: toggle.getAttribute("aria-expanded"),
      };
    });
    if (
      mobileImmersiveState.viewport.left !== 0 ||
      mobileImmersiveState.viewport.top !== 0 ||
      mobileImmersiveState.viewport.width !== 390 ||
      mobileImmersiveState.viewport.height !== 844 ||
      mobileImmersiveState.documentHeight !== 844 ||
      mobileImmersiveState.sidebarDisplay !== "none" ||
      mobileImmersiveState.notePaneDisplay !== "none" ||
      mobileImmersiveState.headerVisibility !== "hidden" ||
      mobileImmersiveState.assistantVisibility !== "visible" ||
      mobileImmersiveState.menuVisibility !== "visible" ||
      mobileImmersiveState.menuExpanded !== "false"
    ) {
      throw new Error(
        `Mobile menu did not enter immersive mode: ${JSON.stringify(
          mobileImmersiveState,
        )}`,
      );
    }

    await mobilePage.locator("#mobile-panel-toggle").click();
    await mobilePage.waitForFunction(
      () =>
        document.querySelector(".workspace-shell")?.dataset
          .connectomeImmersive === "false",
    );
    await mobilePage.waitForTimeout(220);
    const mobileRestoredState = await mobilePage.evaluate(() => {
      const toggle = document.getElementById("mobile-panel-toggle");
      return {
        sidebarDisplay: getComputedStyle(
          document.querySelector(".vault-sidebar"),
        ).display,
        notePaneDisplay: getComputedStyle(
          document.querySelector(".note-pane"),
        ).display,
        headerVisibility: getComputedStyle(
          document.querySelector(".stage-header"),
        ).visibility,
        menuExpanded: toggle.getAttribute("aria-expanded"),
      };
    });
    await mobilePage.close();
    if (
      mobileRestoredState.sidebarDisplay === "none" ||
      mobileRestoredState.notePaneDisplay === "none" ||
      mobileRestoredState.headerVisibility !== "visible" ||
      mobileRestoredState.menuExpanded !== "true" ||
      mobileConsoleErrors.length
    ) {
      throw new Error(
        `Mobile menu did not restore panels: ${JSON.stringify({
          mobileRestoredState,
          mobileConsoleErrors,
        })}`,
      );
    }

    if (consoleMessages.length) {
      throw new Error(`Unexpected browser console output:\n${consoleMessages.join("\n")}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          url,
          rendererSizing,
          overviewAlignment,
          immersiveState,
          restoredViewport,
          labelTarget,
          clickedAlignment,
          focusedAlignment,
          vaultState,
          fusionState,
          mobileImmersiveState,
          mobileRestoredState,
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
