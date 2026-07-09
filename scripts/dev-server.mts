import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import configHandler from "../api/config.ts";
import quotesHandler from "../api/quotes.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const frontendDir = join(rootDir, "frontend");
const port = Number(process.env.PORT ?? 3000);

loadDotEnv(join(rootDir, ".env"));

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

const apiRoutes: Record<string, (req: VercelRequest, res: VercelResponse) => unknown> = {
  "/api/config": configHandler,
  "/api/quotes": quotesHandler,
};

function loadDotEnv(path: string): void {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function wrapRequest(req: IncomingMessage, url: URL): VercelRequest {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams) {
    const current = query[key];
    if (current === undefined) query[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else query[key] = [current, value];
  }
  return Object.assign(req, {
    query,
    method: req.method ?? "GET",
    headers: req.headers,
  }) as VercelRequest;
}

function wrapResponse(res: ServerResponse): VercelResponse {
  const api = {
    status(code: number) {
      res.statusCode = code;
      return api;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      res.setHeader(name, value);
      return api;
    },
    json(body: unknown) {
      if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(body));
      return api;
    },
  };
  return api as unknown as VercelResponse;
}

async function serveStatic(pathname: string, res: ServerResponse): Promise<boolean> {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(frontendDir, rel));
  if (!filePath.startsWith(frontendDir)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return true;
  }
  if (!existsSync(filePath)) return false;

  const body = await readFile(filePath);
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[extname(filePath)] ?? "application/octet-stream");
  res.end(body);
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const handler = apiRoutes[url.pathname];

  if (handler) {
    try {
      await handler(wrapRequest(req, url), wrapResponse(res));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  const served = await serveStatic(url.pathname, res);
  if (!served) {
    res.statusCode = 404;
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Dev server: http://localhost:${port} (frontend + /api/config, /api/quotes)`);
});
