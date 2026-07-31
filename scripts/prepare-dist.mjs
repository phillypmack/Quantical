import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const workspace = resolve(process.cwd());
const source = resolve(workspace, "out");
const target = resolve(workspace, "dist");

if (!target.startsWith(`${workspace}${sep}`)) {
  throw new Error("Destino de build fora do workspace.");
}
if (!existsSync(source)) {
  throw new Error("A exportação estática do Next.js não foi encontrada em out/.");
}

rmSync(target, { recursive: true, force: true });
mkdirSync(resolve(target, "server"), { recursive: true });
mkdirSync(resolve(target, ".openai"), { recursive: true });
cpSync(source, resolve(target, "assets"), { recursive: true });
cpSync(
  resolve(workspace, ".openai", "hosting.json"),
  resolve(target, ".openai", "hosting.json"),
);

writeFileSync(
  resolve(target, "server", "index.js"),
  `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.split("/").at(-1)?.includes(".")) {
      // A exportação estática grava cada rota como <rota>.html; o diretório
      // <rota>/ existe mas contém apenas payloads RSC, sem index.html.
      // Por isso .html vem primeiro.
      const base = url.pathname.replace(/\\/$/, "");
      for (const candidate of [\`\${base}.html\`, \`\${base}/index.html\`]) {
        const fallback = new URL(url);
        fallback.pathname = candidate;
        response = await env.ASSETS.fetch(new Request(fallback, request));
        if (response.status !== 404) break;
      }
    }
    return response;
  },
};
`,
);
