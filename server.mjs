import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"]
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (url.pathname === "/favicon.ico") {
      send(response, 204, "image/x-icon", "");
      return;
    }

    if (url.pathname === "/api/health") {
      sendJson(response, { ok: true, service: "schoolfit", timestamp: new Date().toISOString() });
      return;
    }

    if (url.pathname === "/api/candidates") {
      const payload = await readFile(join(root, "data", "candidates.json"), "utf8");
      send(response, 200, "application/json; charset=utf-8", payload, "no-store");
      return;
    }

    const filePath = resolveStaticPath(url.pathname);
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      send(response, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }

    const contentType = mimeTypes.get(extname(filePath)) ?? "application/octet-stream";
    const body = await readFile(filePath);
    send(response, 200, contentType, body, "no-cache");
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    send(response, status, "text/plain; charset=utf-8", status === 404 ? "Not found" : "Server error");
  }
});

server.listen(port, host, () => {
  console.log(`SchoolFit running at http://localhost:${port}`);
});

function resolveStaticPath(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const decoded = decodeURIComponent(requested);
  const safePath = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const resolved = resolve(root, `.${safePath}`);

  if (!resolved.startsWith(root)) {
    return join(root, "index.html");
  }

  return resolved;
}

function sendJson(response, payload) {
  send(response, 200, "application/json; charset=utf-8", JSON.stringify(payload), "no-store");
}

function send(response, status, contentType, body, cacheControl = "no-cache") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}
