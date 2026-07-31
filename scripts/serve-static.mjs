import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "dist", "assets");
const portArgument = process.argv.findIndex((argument) => argument === "-p" || argument === "--port");
const port = Number(portArgument >= 0 ? process.argv[portArgument + 1] : process.env.PORT ?? 3000);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

if (!existsSync(root)) {
  throw new Error("Execute npm run build antes de iniciar o servidor estático.");
}

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  const relative = pathname.replace(/^\/+/, "");
  // Mesma precedência do deploy/nginx.quantical.conf: arquivo exato, depois
  // .html, e só então o índice de diretório. Manter as duas ordens iguais faz
  // uma quebra de roteamento aparecer nos testes locais em vez de só em produção.
  const candidates = [
    resolve(root, relative),
    resolve(root, `${relative}.html`),
    resolve(root, relative, "index.html"),
  ];
  let file = candidates.find(
    (candidate) =>
      candidate.startsWith(`${root}${sep}`) &&
      existsSync(candidate) &&
      statSync(candidate).isFile(),
  );
  let status = 200;

  if (!file) {
    file = resolve(root, "404.html");
    status = 404;
  }

  response.writeHead(status, {
    "Content-Type": mimeTypes[extname(file)] ?? "application/octet-stream",
    "Cache-Control": extname(file) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`Quantical disponível em http://127.0.0.1:${port}\n`);
});
