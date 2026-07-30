import { cpSync, existsSync, rmSync } from "node:fs";
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
cpSync(source, target, { recursive: true });
