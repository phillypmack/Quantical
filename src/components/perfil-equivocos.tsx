"use client";

import Link from "next/link";
import { ArrowRight, Check, Lightbulb } from "lucide-react";

import { fracaoSuperada, hrefDaDemolicao, perfilDeEquivocos } from "@/lib/revisao/perfil";
import { useProgress } from "./progress-provider";

/**
 * O que a plataforma sabe dizer e quase nenhuma outra diz.
 *
 * "Você acertou 60%" é uma nota; não indica o que fazer com ela. Aqui o painel
 * nomeia o pensamento por trás do erro — na primeira pessoa, para o aluno se
 * reconhecer — e oferece o experimento que já foi escrito para derrubá-lo.
 *
 * Nada disso exigiu conteúdo novo: cada módulo foi construído em torno de uma
 * intuição que quebra, e a taxonomia só nomeia o que já estava lá.
 */
export function PerfilEquivocos() {
  const { hydrated, tentativas, revisao } = useProgress();
  if (!hydrated) return null;

  const perfil = perfilDeEquivocos(tentativas, revisao);
  if (perfil.length === 0) return null;

  const superados = perfil.filter((item) => item.superado).length;
  const progresso = Math.round(fracaoSuperada(perfil) * 100);

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div>
          <span>Diagnóstico</span>
          <h2>Como sua intuição erra</h2>
        </div>
        {superados > 0 && (
          <p className="equivocos-placar">
            {superados} de {perfil.length} superado{superados === 1 ? "" : "s"} · {progresso}%
          </p>
        )}
      </div>

      <div className="equivoco-grid">
        {perfil.map(({ equivoco, vezes, superado }) => (
          <article className={superado ? "is-superado" : ""} key={equivoco.id}>
            <header>
              {superado ? <Check size={16} /> : <Lightbulb size={16} />}
              <h3>{equivoco.nome}</h3>
            </header>
            <p>{equivoco.explicacao}</p>
            <footer>
              <span>
                {superado
                  ? "Você já não pensa assim — os conceitos ficaram firmes."
                  : `Apareceu ${vezes} ${vezes === 1 ? "vez" : "vezes"}.`}
              </span>
              {/* O link vale mesmo depois de superado: reencontrar o
                  experimento é a melhor forma de manter firme. */}
              <Link href={hrefDaDemolicao(equivoco)}>
                {superado ? "Rever o experimento" : "Refazer o experimento que derruba"}
                <ArrowRight size={14} />
              </Link>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
