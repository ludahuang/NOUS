import fs from "node:fs";

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const CHROME_EXECUTABLE_PATH =
  process.env.CHROME_EXECUTABLE_PATH ||
  (fs.existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCookie(setCookie) {
  const [pair, ...attrs] = setCookie.split(";").map((part) => part.trim());
  const [name, ...valueParts] = pair.split("=");
  const value = valueParts.join("=");
  const cookie = {
    name,
    value,
    path: "/",
    domain: new URL(BASE_URL).hostname,
  };

  for (const attr of attrs) {
    const [rawKey, ...rawValueParts] = attr.split("=");
    const key = rawKey.toLowerCase();
    const attrValue = rawValueParts.join("=");

    if (key === "path") cookie.path = attrValue;
    if (key === "domain") cookie.domain = attrValue.replace(/^\./, "");
    if (key === "httponly") cookie.httpOnly = true;
    if (key === "secure") cookie.secure = true;
    if (key === "samesite") {
      cookie.sameSite =
        attrValue === "None" ? "None" : attrValue === "Strict" ? "Strict" : "Lax";
    }
  }

  return cookie;
}

async function getDevAuthCookies() {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  assert(csrfRes.ok, `CSRF bootstrap failed with ${csrfRes.status}`);

  const csrfBody = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie().map(parseCookie);
  const cookieHeader = csrfCookies
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const form = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    callbackUrl: BASE_URL,
    json: "true",
  });

  const callbackRes = await fetch(`${BASE_URL}/api/auth/callback/dev-local`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader,
    },
    body: form.toString(),
    redirect: "manual",
  });

  assert(callbackRes.ok, `Dev auth callback failed with ${callbackRes.status}`);
  const callbackCookies = callbackRes.headers.getSetCookie().map(parseCookie);
  const sessionCookie = callbackCookies.find((cookie) =>
    cookie.name.includes("session-token"),
  );

  assert(sessionCookie, "Dev auth did not issue a session token");
  return [...csrfCookies, ...callbackCookies];
}

async function main() {
  const health = await fetch(BASE_URL);
  assert(health.ok, `App is not reachable at ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_EXECUTABLE_PATH,
  });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
  });
  const consoleIssues = [];
  context.on("page", (page) => {
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !message.text().includes("favicon") &&
        !message.text().includes("404")
      ) {
        consoleIssues.push({ type: message.type(), text: message.text() });
      }
    });
    page.on("pageerror", (error) => {
      consoleIssues.push({ type: "pageerror", text: error.message });
    });
  });

  await context.addCookies(await getDevAuthCookies());

  const page = await context.newPage();
  await page.goto(`${BASE_URL}/workspace`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  assert(
    /\/workspace\/[^/]+$/.test(page.url()),
    `Expected workspace redirect, got ${page.url()}`,
  );

  await page.locator(".workspace-shell-restored").waitFor();
  await page.locator("text=Live neural graph of structured knowledge.").waitFor();
  await page.getByRole("link", { name: /The Vault/i }).waitFor();

  const iframeElement = page.locator('iframe[src*="/legacy/index.html"]');
  await iframeElement.waitFor();
  const frame = page.frames().find((candidate) =>
    candidate.url().includes("/legacy/index.html"),
  );

  assert(frame, "Legacy connectome frame not found");
  await frame.locator("canvas").waitFor();
  await frame.locator("button").first().waitFor({ state: "attached", timeout: 15000 });

  const graphButtons = await frame.locator("button").evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim()).filter(Boolean),
  );
  assert(
    graphButtons.includes("Wikipedia") && graphButtons.includes("Obsidian"),
    `Expected graph controls for Wikipedia and Obsidian, got: ${graphButtons.join(", ")}`,
  );

  const graphButtonCount = graphButtons.length;
  assert(graphButtonCount >= 6, `Expected graph controls/labels, got ${graphButtonCount}`);

  const workspaceUrl = page.url();
  const backendUrl = workspaceUrl.replace(/\/workspace\/([^/?#]+).*/, "/workspace/$1/backend");
  await page.goto(backendUrl, { waitUntil: "networkidle" });
  await page.getByText("Backend dashboard", { exact: true }).waitFor();
  await page.getByText("Import and export", { exact: true }).waitFor();
  await page.getByText("Trust log", { exact: true }).waitFor();
  await page.getByText("AI audit", { exact: true }).waitFor();

  await browser.close();

  assert(
    consoleIssues.length === 0,
    `Browser console reported errors:\n${consoleIssues
      .map((issue) => `- ${issue.type}: ${issue.text}`)
      .join("\n")}`,
  );

  console.log("The Vault smoke check passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
