import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createWelfareApi } from "./api.mjs";
const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const api = createWelfareApi();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  void api(req, res, async () => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = path.resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!file.startsWith(`${root}${path.sep}`)) {
        res.statusCode = 403;
        res.end();
        return;
      }
      const bytes = await readFile(file);
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] ?? "application/octet-stream",
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.end(bytes);
    } catch {
      res.statusCode = 404;
      res.end("페이지를 찾을 수 없습니다. 먼저 npm run build를 실행해주세요.");
    }
  });
});
server.listen(Number(process.env.PORT ?? 4173), "127.0.0.1", () =>
  console.log(`복지로AI: http://127.0.0.1:${server.address().port}`),
);
