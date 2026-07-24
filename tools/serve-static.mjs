import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();
const root = resolve(process.env.STATIC_ROOT ?? join(cwd, "dist"));
const indexPath = join(root, "index.html");
const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3000");

const contentTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function isInsideRoot(filePath) {
  const relative = filePath.slice(root.length);
  return filePath === root || relative.startsWith(sep);
}

function toFilePath(requestUrl) {
  const parsed = new URL(requestUrl ?? "/", "http://localhost");
  const pathname = decodeURIComponent(parsed.pathname);
  const requested = resolve(root, `.${pathname}`);
  return isInsideRoot(requested) ? requested : indexPath;
}

async function resolveStaticFile(requestUrl) {
  const requested = toFilePath(requestUrl);

  if (existsSync(requested)) {
    const info = await stat(requested);
    if (info.isFile()) {
      return requested;
    }
    if (info.isDirectory()) {
      const nestedIndex = join(requested, "index.html");
      if (existsSync(nestedIndex)) {
        return nestedIndex;
      }
    }
  }

  return indexPath;
}

function cacheControlFor(filePath) {
  if (filePath === indexPath) {
    return "no-cache";
  }

  return "public, max-age=31536000, immutable";
}

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  try {
    const filePath = await resolveStaticFile(request.url);
    const type = contentTypes.get(extname(filePath)) ?? "application/octet-stream";

    response.writeHead(200, {
      "Cache-Control": cacheControlFor(filePath),
      "Content-Type": type,
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Unable to serve static app.");
    console.error(error);
  }
});

if (!existsSync(indexPath)) {
  console.error(`Missing static app entrypoint: ${fileURLToPath(new URL(indexPath, "file://"))}`);
  process.exit(1);
}

server.listen(port, host, () => {
  console.log(`Serving ${root} on http://${host}:${port}`);
});
