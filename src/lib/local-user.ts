/**
 * Perfil local, para quem escolhe usar a Quantical sem criar conta.
 *
 * A versão anterior gravava esta chave no localStorage e NADA no app a lia
 * jamais — o "perfil local" não tinha nenhum efeito visível. Aqui ela ganha
 * leitura e é consumida pelo cabeçalho.
 */
const KEY = "quantical:local-user";

export type LocalUser = { name: string; email: string };

export function readLocalUser(): LocalUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { name, email } = parsed as Record<string, unknown>;
    if (typeof name !== "string" || typeof email !== "string") return null;
    return { name, email };
  } catch {
    return null;
  }
}

export function writeLocalUser(user: LocalUser) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("quantical:local-user-changed"));
  } catch {
    /* storage indisponível: segue em memória */
  }
}

export function clearLocalUser() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("quantical:local-user-changed"));
  } catch {
    /* ignora */
  }
}
