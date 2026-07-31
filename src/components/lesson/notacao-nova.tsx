import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { notacoes } from "@/data/notacao";

/**
 * "Antes de começar: como ler os símbolos desta aula."
 *
 * Vem do `estreia` de cada símbolo, não de um bloco escrito à mão em cada
 * aula. Isso importa por dois motivos: cobre as 18 aulas e os módulos que
 * ainda vão ser escritos sem custo de autoria nenhum, e não tem como ficar
 * desatualizado — a mesma trava de conteúdo que garante que um símbolo não
 * aparece antes da hora garante que este cartão aparece na hora certa.
 *
 * O defeito que ele conserta: a primeira aula prometia, entre os objetivos,
 * "Ler a notação |0⟩, |1⟩ e α|0⟩ + β|1⟩" — e usava a notação no terceiro
 * parágrafo sem nunca ter dito como se lê. Um aluno teve de sair da
 * plataforma e perguntar a outra ferramenta.
 */
export function NotacaoNova({ licaoId }: { licaoId: string }) {
  const novos = notacoes.filter((item) => item.estreia === licaoId);
  if (novos.length === 0) return null;

  return (
    <section className="notacao-nova" aria-label="Símbolos novos nesta aula">
      <header>
        <span>
          <BookOpen size={14} /> Antes de começar
        </span>
        <h2>
          {novos.length === 1
            ? "Um símbolo novo aparece nesta aula"
            : `${novos.length} símbolos novos aparecem nesta aula`}
        </h2>
        <p>
          Nenhum deles é conta. São formas de escrever — e cada uma tem um jeito de
          falar em voz alta.
        </p>
      </header>

      <dl>
        {novos.map((item) => (
          <div key={item.id}>
            <dt>
              <code>{item.simbolo}</code>
              {/* A leitura em voz alta é a informação que faltava. Vem antes
                  da explicação porque é o que destrava o resto. */}
              <span>lê-se “{item.leitura}”</span>
            </dt>
            <dd>{item.oQueE}</dd>
          </div>
        ))}
      </dl>

      <Link href="/notacao">
        Toda a notação, num lugar só <ArrowRight size={14} />
      </Link>
    </section>
  );
}
