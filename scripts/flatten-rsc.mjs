// Gera os payloads RSC com o nome que o Next realmente pede.
//
// A exportação estática grava os arquivos de segmento numa árvore de
// diretórios:
//
//   out/aprender/__next.aprender/__PAGE__.txt
//
// mas o cliente os requisita com PONTOS no lugar das barras:
//
//   /aprender/__next.aprender.__PAGE__.txt
//
// Na Vercel a plataforma resolve isso na borda. Em nginx, ou em qualquer host
// estático comum, dá 404 — e cada navegação client-side cai para recarregar a
// página inteira, além de encher o console de erro.
//
// Criar as cópias achatadas no build deixa o artefato autossuficiente em
// qualquer host, sem regra especial de servidor.
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";

const root = resolve(process.cwd(), process.argv[2] ?? "out");

if (!existsSync(root)) {
  throw new Error(`Diretório não encontrado: ${root}. Rode o build antes.`);
}

/** Caminhos de todos os arquivos dentro de diretórios __next.* */
function collect(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, found);
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

let created = 0;

for (const file of collect(root)) {
  const relative = file.slice(root.length + 1);
  // Só interessam arquivos que estão DENTRO de um diretório __next.<algo>/
  const marker = `${sep}__next.`;
  const at = relative.indexOf(marker);
  if (at < 0) continue;

  const base = relative.slice(0, at); // pasta da rota
  const rest = relative.slice(at + marker.length); // caminho dentro do __next.*
  if (!rest.includes(sep)) continue; // já é plano

  const flattened = `__next.${rest.split(sep).join(".")}`;
  const target = join(root, base, flattened);
  if (existsSync(target) && statSync(target).size === statSync(file).size) continue;

  copyFileSync(file, target);
  created += 1;
}

process.stdout.write(`RSC: ${created} payload(s) achatado(s) em ${root}\n`);
