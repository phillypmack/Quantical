import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "dist", "assets");
// Os episódios não entram no build (são dezenas de MB); em produção o nginx os
// serve de /var/www/quantical-audio num bloco /audio/ próprio. Aqui o servidor
// local espelha isso — senão o player só quebraria depois de publicado, que é
// exatamente o erro que já custou caro no roteamento.
const audioRoot = resolve(process.cwd(), "media", "audio");
const portArgument = process.argv.findIndex((argument) => argument === "-p" || argument === "--port");
const port = Number(portArgument >= 0 ? process.argv[portArgument + 1] : process.env.PORT ?? 3000);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
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
  const candidates =
    pathname.startsWith("/audio/") && pathname.endsWith(".mp3")
      ? [resolve(audioRoot, relative.slice("audio/".length))]
      : [
          resolve(root, relative),
          resolve(root, `${relative}.html`),
          resolve(root, relative, "index.html"),
        ];
  const permitidos = [`${root}${sep}`, `${audioRoot}${sep}`];
  let file = candidates.find(
    (candidate) =>
      permitidos.some((base) => candidate.startsWith(base)) &&
      existsSync(candidate) &&
      statSync(candidate).isFile(),
  );
  let status = 200;

  if (!file) {
    file = resolve(root, "404.html");
    status = 404;
  }

  const tipo = mimeTypes[extname(file)] ?? "application/octet-stream";
  const cache = extname(file) === ".html" ? "no-cache" : "public, max-age=31536000, immutable";
  const tamanho = statSync(file).size;

  // Requisição parcial. Sem isto o navegador não consegue posicionar o áudio:
  // com preload="metadata" quase nada está em buffer, e arrastar a barra ou
  // clicar numa fala da transcrição simplesmente não faz nada. O nginx de
  // produção anuncia Accept-Ranges no bloco /audio/, então o servidor local
  // precisa fazer o mesmo — senão o player só quebraria depois de publicado.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? "");
  if (range && status === 200) {
    const inicio = range[1] ? Number(range[1]) : 0;
    const fim = range[2] ? Math.min(Number(range[2]), tamanho - 1) : tamanho - 1;
    if (inicio >= tamanho || inicio > fim) {
      response.writeHead(416, { "Content-Range": `bytes */${tamanho}` });
      response.end();
      return;
    }
    response.writeHead(206, {
      "Content-Type": tipo,
      "Content-Length": fim - inicio + 1,
      "Content-Range": `bytes ${inicio}-${fim}/${tamanho}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": cache,
    });
    createReadStream(file, { start: inicio, end: fim }).pipe(response);
    return;
  }

  response.writeHead(status, {
    "Content-Type": tipo,
    "Content-Length": tamanho,
    "Accept-Ranges": "bytes",
    "Cache-Control": cache,
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`Quantical disponível em http://127.0.0.1:${port}\n`);
});
