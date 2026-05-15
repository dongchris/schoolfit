import { access, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const { chromium } = await loadPlaywright();

const url = process.env.SCHOOLFIT_URL ?? "http://127.0.0.1:4173";
const executablePath = await findBrowserExecutable();
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".candidate-row", { timeout: 10000 });
await page.waitForFunction(
  () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  { timeout: 20000 }
);

const rowCount = await page.locator(".candidate-row").count();
const heading = await page.locator("h2").innerText();
const selectedHome = await page.locator(".inspector h3").innerText();
const minBaths = await page.locator("#minBaths").inputValue();
const hasExpandedCity = await page.locator(".candidate-row", { hasText: "San Mateo" }).count();
const offMarketRows = await page.locator(".candidate-row", { hasText: "Off market" }).count();
const sourceFilterCount = await page.locator("#sourceFilter").count();
const sortDirectionCount = await page.locator("[data-sort-key][data-sort-direction]").count();
const firstRowScoreRows = await page.locator(".candidate-row").first().locator(".score-mini").count();
const defaultHorizontalOverflow = await hasHorizontalOverflow(page);

await page.locator("#sidebarToggleButton").click();
const sidebarHidden = await page.locator("#appShell.sidebar-hidden").count();
await page.locator("#sidebarToggleButton").click();

await mkdir("tmp", { recursive: true });
await page.screenshot({ path: "tmp/schoolfit-home.png", fullPage: true });

await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForSelector(".candidate-row", { timeout: 10000 });
const compactHorizontalOverflow = await hasHorizontalOverflow(page);
const compactSidebarOverflow = await hasSidebarOverflow(page);
const compactSidebarInViewport = await isSidebarInViewport(page);
await page.screenshot({ path: "tmp/schoolfit-home-compact.png", fullPage: true });

await page.locator("#onlyEligible").check();
await page.waitForFunction(() => document.querySelectorAll(".candidate-row").length < 35);
const eligibleRowCount = await page.locator(".candidate-row").count();
await browser.close();

if (rowCount !== 34) {
  throw new Error(`Expected 34 clearly active for-sale candidates by default, got ${rowCount} rows.`);
}

if (minBaths !== "2") {
  throw new Error(`Expected default min baths to be 2, got ${minBaths}.`);
}

if (offMarketRows !== 0) {
  throw new Error(`Expected off-market candidates to be hidden, found ${offMarketRows}.`);
}

if (sourceFilterCount !== 0) {
  throw new Error("Expected source filtering to be removed from the sidebar.");
}

if (sortDirectionCount !== 6) {
  throw new Error(`Expected six sort direction controls, got ${sortDirectionCount}.`);
}

if (firstRowScoreRows !== 3) {
  throw new Error(`Expected three separate school score rows, got ${firstRowScoreRows}.`);
}

if (defaultHorizontalOverflow || compactHorizontalOverflow) {
  throw new Error("Expected SchoolFit to fit the viewport without horizontal overflow.");
}

if (compactSidebarOverflow) {
  throw new Error("Expected sidebar controls to fit without scrolling in a compact desktop viewport.");
}

if (!compactSidebarInViewport) {
  throw new Error("Expected the sidebar to remain fully inside the viewport.");
}

if (sidebarHidden !== 1) {
  throw new Error("Expected the sidebar toggle to hide the filters panel.");
}

if (hasExpandedCity < 1) {
  throw new Error("Expected at least one expanded San Mateo candidate row.");
}

if (eligibleRowCount < 1 || eligibleRowCount >= rowCount) {
  throw new Error(`Expected the eligible-only filter to reduce the row count, got ${eligibleRowCount} from ${rowCount}.`);
}

if (consoleErrors.length) {
  throw new Error(`Console errors found:\n${consoleErrors.join("\n")}`);
}

console.log(`Smoke OK: ${rowCount} expanded rows, ${eligibleRowCount} eligible rows. ${heading} Selected: ${selectedHome}`);

async function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next installed browser.
    }
  }

  return undefined;
}

async function loadPlaywright() {
  const projectRequire = createRequire(import.meta.url);

  try {
    return projectRequire("playwright");
  } catch {
    const fallbackRequire = createRequire(
      "/Users/chrisdong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json"
    );
    return fallbackRequire("playwright");
  }
}

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const rootOverflow = root.scrollWidth - root.clientWidth;
    const bodyOverflow = body.scrollWidth - body.clientWidth;
    return rootOverflow > 1 || bodyOverflow > 1;
  });
}

async function hasSidebarOverflow(page) {
  return page.evaluate(() => {
    const sidebar = document.querySelector(".sidebar");
    return Boolean(sidebar && sidebar.scrollHeight - sidebar.clientHeight > 1);
  });
}

async function isSidebarInViewport(page) {
  return page.evaluate(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return false;
    const rect = sidebar.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= document.documentElement.clientWidth;
  });
}
