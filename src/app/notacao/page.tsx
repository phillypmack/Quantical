import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getAllLessons } from "@/data/curriculum";
import { notacoes } from "@/data/notacao";
import { SOCIAL_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Como ler a notação quântica",
  description:
    "|0⟩ lê-se “ket zero”. Cada símbolo da computação quântica, como se fala em voz alta, o que significa em português comum e por que ele existe.",
  alternates: { canonical: "/notacao" },
  openGraph: {
    title: "Como ler a notação quântica",
    description:
      "|0⟩ lê-se “ket zero”. Cada símbolo, como se fala, o que significa e por que existe.",
    url: "/notacao",
    type: "article",
    locale: "pt_BR",
    images: [SOCIAL_IMAGE],
  },
};

/**
 * A página que não existia, e cuja falta fez um aluno sair da plataforma para
 * perguntar a outra ferramenta como se lê |0⟩.
 *
 * É conteúdo real em português sobre um assunto onde quase não existe — e
 * portanto também é uma das poucas páginas do site com chance de ser
 * encontrada por quem procura exatamente isto num buscador.
 */
export default function NotacaoPage() {
  const ordem = getAllLessons();
  const tituloDaAula = (licaoId?: string) =>
    licaoId ? ordem.find((item) => item.id === licaoId) : undefined;

  return (
    <div className="notacao-pagina">
      <header>
        <p className="eyebrow">Referência</p>
        <h1>
          Como ler a<br />
          notação quântica
        </h1>
        <p className="lead">
          Nada aqui é conta. São formas de escrever, e a primeira coisa que falta a
          quase todo material é dizer <strong>como se fala</strong> — porque ninguém
          consegue pensar sobre um símbolo que não sabe pronunciar.
        </p>
      </header>

      <ol className="notacao-lista">
        {notacoes.map((item) => {
          const aula = tituloDaAula(item.estreia);
          return (
            <li id={item.id} key={item.id}>
              <div className="notacao-simbolo">
                <code>{item.simbolo}</code>
                <strong>lê-se “{item.leitura}”</strong>
              </div>
              <div className="notacao-corpo">
                <p>{item.oQueE}</p>
                <p className="notacao-porque">
                  <span>Por que essa notação existe</span>
                  {item.porQue}
                </p>
                {aula ? (
                  <Link className="notacao-aula" href={aula.href}>
                    Aparece pela primeira vez em {aula.module.title} · {aula.label}
                    <ArrowRight size={13} />
                  </Link>
                ) : (
                  <span className="notacao-aula notacao-aula--fora">
                    Ainda não aparece nas aulas — está aqui para quando você encontrar
                    esse símbolo em outro lugar.
                  </span>
                )}
                {item.vejaTambem?.length ? (
                  <p className="notacao-veja">
                    Veja também{" "}
                    {item.vejaTambem.map((outro, indice) => {
                      const alvo = notacoes.find((n) => n.id === outro);
                      if (!alvo) return null;
                      return (
                        <span key={outro}>
                          {indice > 0 ? ", " : ""}
                          <a href={`#${outro}`}>{alvo.simbolo}</a>
                        </span>
                      );
                    })}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="notacao-rodape">
        <p>
          Os <strong>termos</strong> — superposição, emaranhamento, amplitude — ficam no{" "}
          <Link href="/glossario">glossário</Link>. Aqui estão só os{" "}
          <strong>símbolos</strong>.
        </p>
      </footer>
    </div>
  );
}
