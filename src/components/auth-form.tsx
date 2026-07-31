"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, Github, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { writeLocalUser } from "@/lib/local-user";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(undefined);
    const supabase = await getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/progresso`,
        },
      });
      setLoading(false);
      setMessage(error ? error.message : "Enviamos um link seguro para o seu e-mail.");
      return;
    }

    writeLocalUser({ name: name || email.split("@")[0], email });
    setLoading(false);
    router.push("/progresso");
  }

  async function socialLogin(provider: "google" | "github") {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Conecte o Supabase para ativar provedores sociais. Você ainda pode usar a conta local abaixo.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/progresso` },
    });
  }

  return (
    <div className="auth-shell">
      <section className="auth-story">
        <div className="auth-orbit" aria-hidden="true"><i /><i /><b /></div>
        <div>
          <p className="eyebrow">Seu progresso em superposição</p>
          <h1>Aprenda aqui.<br />Continue em qualquer lugar.</h1>
          <p>Uma conta sincroniza aulas, projetos e conquistas. Explorar sem cadastro continua sempre possível.</p>
          <ul>
            <li><Check size={15} /> Sincronização entre dispositivos</li>
            <li><Check size={15} /> Projetos e circuitos salvos</li>
            <li><Check size={15} /> Conquistas e sequência de estudos</li>
          </ul>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="auth-icon"><Sparkles size={19} /></span>
          <h2>Entre na Quantical</h2>
          <p>{configured ? "Use seu e-mail ou uma conta conectada." : "Crie um perfil local para começar agora."}</p>
          <div className="social-buttons">
            <button onClick={() => socialLogin("google")} type="button"><span>G</span> Continuar com Google</button>
            <button onClick={() => socialLogin("github")} type="button"><Github size={16} /> Continuar com GitHub</button>
          </div>
          <div className="auth-divider"><span>ou use seu e-mail</span></div>
          <form onSubmit={submit}>
            <label>
              Como podemos chamar você?
              <input onChange={(event) => setName(event.target.value)} placeholder="Seu nome" value={name} />
            </label>
            <label>
              E-mail
              <div className="input-with-icon"><Mail size={16} /><input onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" required type="email" value={email} /></div>
            </label>
            <button className="button button--dark button--wide" disabled={loading} type="submit">
              {loading ? "Preparando…" : configured ? "Enviar link de acesso" : "Criar perfil local"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p aria-live="polite" className="auth-message" role="status">
            {message}
          </p>
          <div className="auth-security"><ShieldCheck size={14} /><span>Sem senha. Sem spam. Seus dados continuam seus.</span></div>
          <Link href="/aprender">Continuar sem conta</Link>
        </div>
      </section>
    </div>
  );
}
