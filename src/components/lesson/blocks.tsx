"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Lightbulb, Play, Sparkles } from "lucide-react";

import type { Block } from "@/data/lessons";
import { glossary, type GlossaryEntry } from "@/data/glossary";
import { notacoes, type Notacao } from "@/data/notacao";
import { cn } from "@/lib/cn";
import { runSync } from "@/lib/quantum/simulator-client";
import { CircuitDiagram } from "@/components/quantum/circuit-diagram";
import { Histogram } from "@/components/quantum/histogram";
import { BlochSphere } from "@/components/quantum/bloch-sphere";

/** Termos e sinônimos, do mais longo para o mais curto (evita casar prefixo). */
const TERMS = glossary
  .flatMap((entry) => [entry.term, ...(entry.aliases ?? [])].map((label) => ({ entry, label })))
  .sort((a, b) => b.label.length - a.label.length)
  .map(({ entry, label }) => ({
    entry,
    pattern: new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
  }));

/**
 * Símbolos, do mais longo para o mais curto.
 *
 * `|ψ⟩` tem de ser tentado antes de `ψ`, senão a letra sozinha casaria dentro
 * do ket e o aluno receberia a explicação errada. É a mesma precaução que o
 * glossário toma com sinônimos.
 */
const SIMBOLOS = [...notacoes]
  .sort((a, b) => b.simbolo.length - a.simbolo.length)
  .map((nota) => ({ nota, pattern: new RegExp(nota.padrao.source, "u") }));

type Segment =
  | string
  | { entry: GlossaryEntry; text: string }
  | { nota: Notacao; text: string };

/**
 * Marca a primeira ocorrência de cada termo do glossário ao longo da aula.
 *
 * Função PURA: recebe os blocos e o conjunto de termos já usados, e devolve
 * segmentos novos. A versão anterior mutava um Set durante o render e ainda
 * escrevia num campo do próprio objeto do glossário (dado de módulo) — o que
 * produzia marcação diferente entre servidor e cliente e gerava erro de
 * hidratação do React em produção.
 *
 * Primeira-ocorrência-apenas evita o modo de falha "todo parágrafo azul" e
 * dispensa o autor de marcar termo a termo nas aulas.
 */
function markParagraph(text: string, used: Set<string>): Segment[] {
  let segments: Segment[] = [text];

  // Símbolos primeiro: `|0⟩` precisa virar um pedaço próprio antes de o
  // marcador de termos poder partir o texto em volta dele.
  for (const { nota, pattern } of SIMBOLOS) {
    if (used.has(nota.id)) continue;

    const index = segments.findIndex((part) => typeof part === "string" && pattern.test(part));
    if (index < 0) continue;

    const source = segments[index] as string;
    const match = pattern.exec(source);
    if (!match) continue;

    used.add(nota.id);
    segments = [
      ...segments.slice(0, index),
      source.slice(0, match.index),
      { nota, text: match[0] },
      source.slice(match.index + match[0].length),
      ...segments.slice(index + 1),
    ];
  }

  for (const { entry, pattern } of TERMS) {
    if (used.has(entry.id)) continue;

    const index = segments.findIndex((part) => typeof part === "string" && pattern.test(part));
    if (index < 0) continue;

    const source = segments[index] as string;
    const match = pattern.exec(source);
    if (!match) continue;

    used.add(entry.id);
    segments = [
      ...segments.slice(0, index),
      source.slice(0, match.index),
      { entry, text: match[0] },
      source.slice(match.index + match[0].length),
      ...segments.slice(index + 1),
    ];
  }

  return segments.filter((part) => part !== "");
}

function markBlocks(blocks: Block[]): Map<number, Segment[]> {
  const used = new Set<string>();
  const marked = new Map<number, Segment[]>();
  blocks.forEach((block, index) => {
    if (block.kind !== "p") return;
    marked.set(index, markParagraph(block.text, used));
  });
  return marked;
}

function Prose({ segments }: { segments: Segment[] }) {
  return (
    <p>
      {segments.map((part, index) => {
        if (typeof part === "string") return part;

        if ("nota" in part) {
          return (
            <button className="notacao-termo" key={`${part.nota.id}-${index}`} type="button">
              {part.text}
              <span className="glossary-popover notacao-popover" role="tooltip">
                {/* A leitura vem PRIMEIRO e em destaque: sem saber pronunciar,
                    o aluno não consegue nem pensar sobre o símbolo. */}
                <strong>lê-se “{part.nota.leitura}”</strong>
                {part.nota.oQueE}
              </span>
            </button>
          );
        }

        return (
          <button className="glossary-term" key={`${part.entry.id}-${index}`} type="button">
            {part.text}
            <span className="glossary-popover" role="tooltip">
              <strong>{part.entry.term}</strong>
              {part.entry.definition}
            </span>
          </button>
        );
      })}
    </p>
  );
}

/** Metáfora + o circuito que a derruba. A quebra é executável, não uma alegação. */
function MetaphorBlock({ block }: { block: Extract<Block, { kind: "metaphor" }> }) {
  const [result, setResult] = useState<ReturnType<typeof runSync> | null>(null);

  return (
    <div className="metaphor-card">
      <div className="metaphor-image">
        <span>
          <Sparkles size={14} /> A imagem que costumam usar
        </span>
        <p>{block.image}</p>
        <figure className="metaphor-illustration">
          <picture>
            <source srcSet={block.ilustracao.webp} type="image/webp" />
            <img
              src={block.ilustracao.src}
              alt={block.ilustracao.alt}
              className="metaphor-visual"
              decoding="async"
              height={1024}
              loading="lazy"
              width={1536}
            />
          </picture>
        </figure>
      </div>
      <div className="metaphor-break">
        <span>
          <AlertTriangle size={14} /> Onde ela quebra
        </span>
        <p>{block.breaks}</p>
        <CircuitDiagram circuit={block.circuit} />
        <button
          className="button button--light button--small"
          onClick={() => setResult(runSync({ ...block.circuit, captureSteps: false }))}
          type="button"
        >
          <Play size={14} /> {result ? "Rodar de novo" : "Ver por si mesmo"}
        </button>
        {result && (
          <Histogram probabilities={result.probabilities} qubits={block.circuit.qubits} />
        )}
        <small>{block.caption}</small>
      </div>
    </div>
  );
}

function FigureBlock({ block }: { block: Extract<Block, { kind: "figure" }> }) {
  const result = useMemo(
    () => runSync({ ...block.circuit, captureSteps: false }),
    [block.circuit],
  );

  return (
    <figure className="lesson-figure">
      {block.view === "circuit" && <CircuitDiagram circuit={block.circuit} />}
      {block.view === "histogram" && (
        <Histogram probabilities={result.probabilities} qubits={block.circuit.qubits} />
      )}
      {block.view === "bloch" && (
        <div className="bloch-grid">
          {result.blochVectors.map((vector, qubit) => (
            <BlochSphere key={qubit} qubit={qubit} vector={vector} />
          ))}
        </div>
      )}
      <figcaption>{block.caption}</figcaption>
    </figure>
  );
}

const CALLOUT_ICON = {
  ideia: Lightbulb,
  atencao: AlertTriangle,
  curiosidade: Sparkles,
};

export function LessonBlocks({ blocks }: { blocks: Block[] }) {
  const marked = useMemo(() => markBlocks(blocks), [blocks]);

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "h":
            return <h2 key={index}>{block.text}</h2>;

          case "p":
            return <Prose key={index} segments={marked.get(index) ?? [block.text]} />;

          case "list":
            return block.ordered ? (
              <ol className="lesson-list" key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul className="lesson-list" key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );

          case "callout": {
            const Icon = CALLOUT_ICON[block.variant];
            return (
              <div className={cn("concept-card", `is-${block.variant}`)} key={index}>
                <div className="concept-card-label">
                  <Icon size={16} /> {block.title ?? "Ideia-chave"}
                </div>
                <p>{block.text}</p>
              </div>
            );
          }

          case "formula":
            return (
              <div className="concept-card" key={index}>
                <div className="state-notation">{block.latex}</div>
                {block.caption && <small>{block.caption}</small>}
              </div>
            );

          case "code":
            return (
              <figure className="lesson-code" key={index}>
                <pre>
                  <code>{block.code}</code>
                </pre>
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );

          case "metaphor":
            return <MetaphorBlock block={block} key={index} />;

          case "figure":
            return <FigureBlock block={block} key={index} />;
        }
      })}
    </>
  );
}
