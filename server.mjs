import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.normalize(path.join(root, cleanPath));
  return filePath.startsWith(root) ? filePath : null;
}

createServer(async (request, response) => {
  try {
    const filePath = safePath(request.url || "/");
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    let resolvedPath = filePath;
    try {
      const fileStats = await stat(resolvedPath);
      if (fileStats.isDirectory()) {
        resolvedPath = path.join(resolvedPath, "index.html");
      }
    } catch {
      resolvedPath = path.join(root, "index.html");
    }

    const data = await readFile(resolvedPath);
    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(resolvedPath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(data);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Server error");
  }
}).listen(port, () => {
  console.log(`Broadcast Desk running at http://localhost:${port}`);
});
