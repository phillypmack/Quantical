// Verifica que TODA rota gerada pela exportação estática responde 200 no
// servidor apontado por argv[2].
//
// Existe por causa de um bug real: a exportação grava cada rota como
// <rota>.html e ainda cria um diretório <rota>/ com apenas payloads RSC.
// A config antiga do nginx (`try_files $uri $uri/ $uri.html`) parava no
// diretório vazio e devolvia 403 em 61 das 62 rotas — e nenhum teste pegava,
// porque a suíte local usa scripts/serve-static.mjs, não o nginx.
//
// Uso: node scripts/check-routes.mjs http://localhost:8080
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const baseUrl = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const root = resolve(process.cwd(), "out");

function collectRoutes(dir, prefix, routes = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectRoutes(full, `${prefix}/${entry.name}`, routes);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;
    if (entry.name === "404.html" || entry.name.startsWith("_")) continue;
    routes.push(entry.name === "index.html" ? `${prefix}/` : `${prefix}/${entry.name.replace(/\.html$/, "")}`);
  }
  return routes;
}

const routes = collectRoutes(root, "").sort();
if (routes.length === 0) {
  console.error("Nenhuma rota encontrada em out/. Rode npm run build antes.");
  process.exit(1);
}

const failures = [];
for (const route of routes) {
  const url = `${baseUrl}${route}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    if (response.status !== 200) failures.push(`${route} -> ${response.status}`);
  } catch (error) {
    failures.push(`${route} -> ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} de ${routes.length} rotas falharam:\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("\nProvável causa: ordem do try_files em deploy/nginx.quantical.conf.");
  console.error("O .html precisa ser testado ANTES de qualquer sonda de diretório.\n");
  process.exit(1);
}

console.log(`${routes.length} rotas responderam 200 em ${baseUrl}`);
