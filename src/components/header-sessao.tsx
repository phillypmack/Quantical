"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { clearLocalUser, readLocalUser, type LocalUser } from "@/lib/local-user";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * O canto do cabeçalho que mostra quem está usando o site.
 *
 * Antes ele dizia "Entrar" para sempre: depois de criar um perfil local ou de
 * fazer login, o cabeçalho continuava idêntico e não havia como sair de lugar
 * nenhum — `signOut` não aparecia uma vez sequer no projeto. O comentário em
 * `local-user.ts` chegava a afirmar que o cabeçalho consumia o perfil, e não
 * consumia.
 *
 * Renderiza "Entrar" até hidratar, que é exatamente o que o HTML estático
 * traz — assim não há divergência de hidratação.
 */
export function HeaderSessao() {
  const [local, setLocal] = useState<LocalUser | null>(null);
  const [remoto, setRemoto] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const ler = () => setLocal(readLocalUser());
    ler();
    // `writeLocalUser` emite este evento — sem ouvi-lo, entrar numa aba não
    // atualizaria o cabeçalho até um reload.
    window.addEventListener("quantical:local-user-changed", ler);
    window.addEventListener("storage", ler);
    return () => {
      window.removeEventListener("quantical:local-user-changed", ler);
      window.removeEventListener("storage", ler);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelado = false;
    let desinscrever: (() => void) | undefined;

    void (async () => {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase || cancelado) return;
      const { data } = await supabase.auth.getSession();
      if (!cancelado) setRemoto(data.session?.user.email ?? null);

      const { data: ouvinte } = supabase.auth.onAuthStateChange((_evento, sessao) => {
        setRemoto(sessao?.user.email ?? null);
      });
      desinscrever = () => ouvinte.subscription.unsubscribe();
    })();

    return () => {
      cancelado = true;
      desinscrever?.();
    };
  }, []);

  const sair = useCallback(async () => {
    clearLocalUser();
    setAberto(false);
    if (isSupabaseConfigured()) {
      const supabase = await getSupabaseBrowserClient();
      // O evento SIGNED_OUT já era escutado pelo provider e nunca podia
      // chegar, porque nada chamava signOut.
      await supabase?.auth.signOut();
    }
  }, []);

  const nome = local?.name ?? remoto;
  if (!nome) {
    return (
      <Link className="text-link header-login" href="/entrar">
        Entrar
      </Link>
    );
  }

  const primeiro = nome.split(/[\s@]/)[0];

  return (
    <div className="header-sessao">
      <button
        aria-expanded={aberto}
        className="header-sessao-gatilho"
        onClick={() => setAberto((valor) => !valor)}
        type="button"
      >
        <span aria-hidden="true">{primeiro.slice(0, 1).toUpperCase()}</span>
        {primeiro}
      </button>
      {aberto && (
        <div className="header-sessao-menu">
          <Link href="/progresso" onClick={() => setAberto(false)}>
            Meu progresso
          </Link>
          <Link href="/projetos" onClick={() => setAberto(false)}>
            Meus projetos
          </Link>
          <button onClick={() => void sair()} type="button">
            <LogOut size={14} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
