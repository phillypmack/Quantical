"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Check, CalendarClock, RotateCcw } from "lucide-react";

import { getGlossaryEntry } from "@/data/glossary";
import { diasAte, vencidos } from "@/lib/revisao/agenda";
import { montarRevisao } from "@/lib/revisao/montar";
import { studyDate } from "@/lib/progress/state";
import type { ProgressState } from "@/lib/progress/types";
import { Quiz } from "./lesson/quiz";
import { ExerciseWorkbench } from "./quantum/exercise-workbench";
import { GuidedExperiment } from "./quantum/guided-experiment";
import { useProgress } from "./progress-provider";

/**
 * Revisão espaçada — a parte que muda o aprendizado de verdade.
 *
 * Até aqui, uma aula concluída nunca mais voltava. Quem passou por
 * superposição em maio e não tocou mais no assunto tinha o mesmo "100%" de
 * quem estudou ontem, e o painel não sabia distinguir os dois.
 *
 * Nada aqui é conteúdo novo: a revisão remonta a pergunta que você errou, o
 * passo do experimento em que sua previsão furou e o exercício cuja asserção
 * falhou. É por isso que ela não custou uma segunda biblioteca de material.
 */
export function RevisaoSessao() {
  const progresso = useProgress();

  // A sessão precisa ser congelada: responder um item reagenda o conceito na
  // hora, e uma lista derivada do estado vivo faria o item sumir da tela no
  // instante em que o aluno o respondesse. Montar só depois de hidratar, num
  // componente separado, deixa a inicialização preguiçosa do useState fazer
  // esse congelamento — sem efeito, sem ref e sem setState durante o render.
  if (!progresso.hydrated) {
    return (
      <div className="revisao">
        <p className="revisao-carregando">Montando sua revisão…</p>
      </div>
    );
  }

  return <SessaoHidratada estado={progresso} />;
}

function SessaoHidratada({ estado }: { estado: ProgressState }) {
  const [sessao] = useState(() => montarRevisao(estado));
  const [indice, setIndice] = useState(0);
  const [respondido, setRespondido] = useState(false);

  const proximaData = useMemo(() => {
    const hoje = studyDate();
    return Object.values(estado.revisao)
      .map((item) => item.proximaEm)
      .sort()
      .find((data) => data > hoje);
  }, [estado.revisao]);

  if (sessao.length === 0) {
    const atrasados = vencidos(estado.revisao).length;
    return (
      <div className="revisao">
        <header className="revisao-header">
          <span className="eyebrow">Revisão</span>
          <h1>Nada vencido por hoje.</h1>
        </header>
        <div className="revisao-vazio">
          <CalendarClock size={22} />
          {Object.keys(estado.revisao).length === 0 ? (
            <p>
              A revisão nasce dos seus erros. Responda um quiz ou aposte num experimento guiado, e
              os conceitos que escaparem voltam aqui sozinhos, no espaçamento certo.
            </p>
          ) : proximaData ? (
            <p>
              Seu próximo conceito volta em{" "}
              <strong>{new Date(`${proximaData}T12:00:00Z`).toLocaleDateString("pt-BR")}</strong>.
              Revisar antes da hora não firma mais nada — firma menos.
            </p>
          ) : (
            <p>Você está em dia com tudo que já estudou.</p>
          )}
          {/* Um conceito pode vencer sem item que o represente: a aula foi
              reescrita e a pergunta mudou de id. Melhor dizer isso do que
              anunciar uma fila que não abre. */}
          {atrasados > 0 && (
            <small>
              {atrasados} conceito{atrasados === 1 ? "" : "s"} venceu, mas o item original mudou
              desde então. Ele volta quando você reencontrar o assunto numa aula.
            </small>
          )}
          <Link className="button button--dark" href="/aprender">
            Ir para o currículo <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  if (indice >= sessao.length) {
    return (
      <div className="revisao">
        <header className="revisao-header">
          <span className="eyebrow">Revisão</span>
          <h1>Sessão concluída.</h1>
        </header>
        <div className="revisao-vazio">
          <Check size={22} />
          <p>
            {sessao.length} conceito{sessao.length === 1 ? "" : "s"} revisado
            {sessao.length === 1 ? "" : "s"}. Os que você acertou voltam mais espaçados; os que
            ainda escaparam, amanhã.
          </p>
          <Link className="button button--dark" href="/progresso">
            Ver meu progresso <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const item = sessao[indice];
  const termo = getGlossaryEntry(item.conceitoId);
  const agenda = estado.revisao[item.conceitoId];
  const atraso = agenda ? -diasAte(agenda) : 0;

  return (
    <div className="revisao">
      <header className="revisao-header">
        <span className="eyebrow">Revisão</span>
        <h1>{termo?.term ?? item.conceitoId}</h1>
        <p>
          {atraso > 0 ? `Venceu há ${atraso} dia${atraso === 1 ? "" : "s"}.` : "Vence hoje."} Você
          tropeçou nisto em <Link href={`/curso/${item.licaoId}`}>{item.licaoTitulo}</Link>.
        </p>
        <ol className="revisao-progresso" aria-label={`Item ${indice + 1} de ${sessao.length}`}>
          {sessao.map((outro, posicao) => (
            <li
              className={posicao < indice ? "is-done" : posicao === indice ? "is-current" : ""}
              key={`${outro.tipo}:${outro.licaoId}:${outro.conceitoId}`}
            />
          ))}
        </ol>
      </header>

      {termo && <p className="revisao-definicao">{termo.definition}</p>}

      {/* Cada tipo reusa a mecânica original inteira — inclusive o registro da
          tentativa, que reagenda o conceito sem nenhum código a mais aqui.
          A `key` força remontagem entre itens: sem ela, o Quiz manteria as
          respostas do item anterior. */}
      <div className="revisao-item" key={`${item.tipo}:${item.licaoId}:${item.conceitoId}`}>
        {item.tipo === "quiz" && (
          <Quiz
            conceitos={[item.conceitoId]}
            lessonId={item.licaoId}
            onPass={() => setRespondido(true)}
            questions={[item.questao]}
          />
        )}

        {item.tipo === "previsao" && (
          <GuidedExperiment
            conceitos={[item.conceitoId]}
            licaoId={item.licaoId}
            onComplete={() => setRespondido(true)}
            steps={[item.passo]}
            title={item.roteiro}
          />
        )}

        {item.tipo === "exercicio" && (
          <ExerciseWorkbench
            conceitos={[item.conceitoId]}
            exercise={item.exercicio}
            licaoId={item.licaoId}
            onSolved={() => setRespondido(true)}
          />
        )}
      </div>

      <footer className="revisao-acoes">
        <button
          className="button button--dark"
          onClick={() => {
            setIndice((valor) => valor + 1);
            setRespondido(false);
          }}
          type="button"
        >
          {indice + 1 === sessao.length ? "Encerrar revisão" : "Próximo conceito"}
          <ArrowRight size={15} />
        </button>
        {/* Pular é permitido e não conta como erro: forçar a resposta faria o
            aluno chutar para escapar, e chute vira dado sujo na agenda. */}
        {!respondido && <span className="revisao-pular">Pular não conta como erro.</span>}
      </footer>
    </div>
  );
}

/**
 * Contador para a home e o painel.
 *
 * Sai da sessão montada, não de `vencidos()`: prometer "3 para revisar" e
 * abrir uma tela com 2 é pior do que não prometer nada.
 */
export function useContagemDeRevisao() {
  const progresso = useProgress();
  const { hydrated, revisao, tentativas } = progresso;
  return useMemo(
    () => (hydrated ? montarRevisao(progresso).length : 0),
    // Recontar quando a agenda ou as tentativas mudarem é justamente o que se
    // quer aqui: este número acompanha o estado vivo, ao contrário da sessão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, revisao, tentativas],
  );
}

export function AvisoDeRevisao() {
  const total = useContagemDeRevisao();
  if (total === 0) return null;

  return (
    <Link className="revisao-aviso" href="/revisar">
      <BrainCircuit size={16} />
      <strong>
        {total} conceito{total === 1 ? "" : "s"} para revisar
      </strong>
      <span>
        <RotateCcw size={13} /> começar
      </span>
    </Link>
  );
}
