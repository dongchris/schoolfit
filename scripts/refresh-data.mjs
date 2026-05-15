import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "..");
const dataPath = join(root, "data", "candidates.json");
const now = process.env.SCHOOLFIT_NOW ? new Date(process.env.SCHOOLFIT_NOW) : new Date();

const payload = JSON.parse(await readFile(dataPath, "utf8"));

payload.metadata = {
  ...payload.metadata,
  generatedAt: now.toISOString(),
  statusText:
    "Market data refreshed. Days on market were recalculated from listing dates."
};

payload.candidates = payload.candidates.map((candidate) => {
  const listedAt = candidate.listedAt ? new Date(`${candidate.listedAt}T00:00:00`) : null;
  const daysOnMarket = listedAt && !Number.isNaN(listedAt.valueOf())
    ? Math.max(0, Math.floor((startOfDay(now) - startOfDay(listedAt)) / 86400000))
    : candidate.daysOnMarket;

  return {
    ...candidate,
    daysOnMarket
  };
});

await writeFile(dataPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Refreshed ${payload.candidates.length} candidates at ${payload.metadata.generatedAt}`);

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
