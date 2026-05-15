import { cp, mkdir, rm } from "node:fs/promises";

const outDir = "_site";

await rm(outDir, { recursive: true, force: true });
await mkdir(`${outDir}/data`, { recursive: true });
await mkdir(`${outDir}/assets`, { recursive: true });

await cp("index.html", `${outDir}/index.html`);
await cp("styles.css", `${outDir}/styles.css`);
await cp("app.js", `${outDir}/app.js`);
await cp("data/candidates.json", `${outDir}/data/candidates.json`);
await cp("assets/schoolfit-logo.png", `${outDir}/assets/schoolfit-logo.png`);
await cp("assets/schoolfit-logo-source.png", `${outDir}/assets/schoolfit-logo-source.png`);

console.log(`Built static SchoolFit site in ${outDir}`);
