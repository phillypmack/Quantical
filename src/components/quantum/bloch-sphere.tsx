"use client";

import { useEffect, useRef, useState } from "react";

import type { BlochVector } from "@/lib/quantum/types";

/**
 * Esfera de Bloch com as TRÊS componentes.
 *
 * A versão anterior desenhava só uma projeção x–z, nunca usava `y` (ele
 * aparecia apenas como texto) e normalizava o comprimento do vetor. O efeito
 * colateral era grave: um qubit emaranhado, cujo vetor reduzido tem
 * comprimento zero, virava uma seta de tamanho zero sem nenhuma explicação —
 * o app ensinava algo falso justamente no conceito mais difícil.
 */

const SIZE = 190;
const CENTER = SIZE / 2;
const RADIUS = 66;

// Projeção oblíqua: z para cima, x descendo à direita, y subindo à direita.
const AXIS = {
  x: { sx: 0.92, sy: 0.34 },
  y: { sx: 0.62, sy: -0.32 },
  z: { sx: 0, sy: -1 },
};

function project(x: number, y: number, z: number) {
  return {
    left: CENTER + RADIUS * (x * AXIS.x.sx + y * AXIS.y.sx + z * AXIS.z.sx),
    top: CENTER + RADIUS * (x * AXIS.x.sy + y * AXIS.y.sy + z * AXIS.z.sy),
  };
}

/** Distância entre dois pontos na esfera. É o "quanto falta" do exercício. */
export function distanciaDeBloch(a: BlochVector, b: BlochVector) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Dentro disto o estado conta como alcançado — é a tolerância do validador. */
const TOLERANCIA_ALVO = 0.02;

const DURACAO_MS = 320;

/**
 * Interpola o vetor entre um resultado e o seguinte.
 *
 * Sem isto a seta TELEPORTA: ao arrastar o cursor de passos, o estado do
 * qubit salta de uma posição para outra e o aluno não vê rotação nenhuma —
 * justamente o que a esfera existe para mostrar. Não havia `transition` em
 * `.bloch-vector` nem um `requestAnimationFrame` em lugar nenhum do projeto.
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos movimento recebe o
 * salto direto, que é o comportamento antigo.
 */
function useVetorAnimado(alvo: BlochVector): BlochVector {
  const [atual, setAtual] = useState(alvo);
  // Espelho do que está pintado na tela. É daqui que a próxima animação parte,
  // para uma interrupção no meio do caminho não fazer a seta saltar.
  const pintadoRef = useRef(alvo);
  const quadroRef = useRef<number>(undefined);

  const { x: ax, y: ay, z: az } = alvo;

  useEffect(() => {
    const aplicar = (vetor: BlochVector) => {
      pintadoRef.current = vetor;
      setAtual(vetor);
    };

    const reduzido =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduzido) {
      aplicar({ x: ax, y: ay, z: az, length: Math.hypot(ax, ay, az) });
      return;
    }

    const origem = pintadoRef.current;
    const inicio = performance.now();

    const passo = (agora: number) => {
      // easeOutCubic: sai rápido e assenta devagar, como uma rotação freando.
      const bruto = Math.min(1, (agora - inicio) / DURACAO_MS);
      const t = 1 - (1 - bruto) ** 3;

      const x = origem.x + (ax - origem.x) * t;
      const y = origem.y + (ay - origem.y) * t;
      const z = origem.z + (az - origem.z) * t;
      aplicar({ x, y, z, length: Math.hypot(x, y, z) });

      if (bruto < 1) quadroRef.current = requestAnimationFrame(passo);
    };

    quadroRef.current = requestAnimationFrame(passo);
    return () => {
      if (quadroRef.current !== undefined) cancelAnimationFrame(quadroRef.current);
    };
  }, [ax, ay, az]);

  return atual;
}

function describeState(vector: BlochVector) {
  if (vector.length < 0.05) return "Emaranhado — este qubit não tem estado próprio";
  if (vector.length < 0.95) return "Parcialmente emaranhado";
  if (vector.z > 0.98) return "Estado |0⟩";
  if (vector.z < -0.98) return "Estado |1⟩";
  if (vector.x > 0.98) return "Estado |+⟩";
  if (vector.x < -0.98) return "Estado |−⟩";
  if (vector.y > 0.98) return "Estado |+i⟩";
  if (vector.y < -0.98) return "Estado |−i⟩";
  return "Superposição";
}

export function BlochSphere({
  vector,
  qubit,
  alvo,
}: {
  vector: BlochVector;
  qubit: number;
  /**
   * Onde o estado precisa chegar.
   *
   * O exercício descrevia o destino em palavras ("prepare |−⟩") e o aluno
   * conferia por aprovado/reprovado. Com a seta-fantasma ele vê a distância
   * encolher — vira "chegue aqui" em vez de "acertou/errou".
   */
  alvo?: BlochVector;
}) {
  const animado = useVetorAnimado(vector);
  const tip = project(animado.x, animado.y, animado.z);
  const entangled = vector.length < 0.95;
  const description = describeState(vector);

  const pontaAlvo = alvo ? project(alvo.x, alvo.y, alvo.z) : null;
  // A distância é medida contra o resultado real, não contra o quadro da
  // animação: um número que oscila enquanto a seta se move não informa nada.
  const distancia = alvo ? distanciaDeBloch(vector, alvo) : null;
  const chegou = distancia !== null && distancia <= TOLERANCIA_ALVO;

  const axes = [
    { key: "x", end: project(1, 0, 0), label: "x" },
    { key: "y", end: project(0, 1, 0), label: "y" },
    { key: "z", end: project(0, 0, 1), label: "z" },
  ];

  return (
    <figure className="bloch-figure">
      <svg
        aria-label={
          `Qubit ${qubit}: ${description}. Vetor x ${vector.x.toFixed(2)}, y ${vector.y.toFixed(2)}, z ${vector.z.toFixed(2)}, comprimento ${vector.length.toFixed(2)}.` +
          // A distância também precisa existir em texto: a seta-fantasma não
          // diz nada para quem usa leitor de tela.
          (distancia === null
            ? ""
            : chegou
              ? " No alvo."
              : ` Distância até o alvo: ${distancia.toFixed(2)}.`)
        }
        height={SIZE}
        role="img"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
      >
        <circle className="bloch-globe" cx={CENTER} cy={CENTER} r={RADIUS} />
        {/* Equador: dá a noção de profundidade e ancora o eixo y. */}
        <ellipse
          className="bloch-equator"
          cx={CENTER}
          cy={CENTER}
          rx={RADIUS}
          ry={RADIUS * 0.33}
        />
        <ellipse
          className="bloch-equator bloch-equator--meridian"
          cx={CENTER}
          cy={CENTER}
          rx={RADIUS * 0.33}
          ry={RADIUS}
        />

        {axes.map((axis) => (
          <g key={axis.key}>
            <line
              className="bloch-axis"
              x1={CENTER - (axis.end.left - CENTER)}
              x2={axis.end.left}
              y1={CENTER - (axis.end.top - CENTER)}
              y2={axis.end.top}
            />
            <text className="bloch-axis-label" x={axis.end.left} y={axis.end.top}>
              {axis.label}
            </text>
          </g>
        ))}

        {/* Alvo primeiro, para a seta real ficar por cima dele. */}
        {pontaAlvo && !chegou && (
          <g className="bloch-alvo">
            <line x1={CENTER} x2={pontaAlvo.left} y1={CENTER} y2={pontaAlvo.top} />
            <circle cx={pontaAlvo.left} cy={pontaAlvo.top} r={6} />
          </g>
        )}

        {/* Sombra no plano equatorial: mostra para onde o vetor aponta em x–y. */}
        {!entangled && (
          <line
            className="bloch-shadow"
            x1={CENTER}
            x2={project(animado.x, animado.y, 0).left}
            y1={CENTER}
            y2={project(animado.x, animado.y, 0).top}
          />
        )}

        {entangled ? (
          <circle
            className="bloch-mixed"
            cx={CENTER}
            cy={CENTER}
            // O raio acompanha o comprimento: emaranhamento total = ponto central.
            r={Math.max(4, RADIUS * (1 - vector.length))}
          />
        ) : null}

        {/* Comprimento REAL, não normalizado. */}
        <line className="bloch-vector" x1={CENTER} x2={tip.left} y1={CENTER} y2={tip.top} />
        <circle className="bloch-tip" cx={tip.left} cy={tip.top} r={5} />
      </svg>

      <figcaption>
        <strong>q{qubit}</strong>
        <span className={entangled ? "bloch-note bloch-note--entangled" : "bloch-note"}>
          {description}
        </span>
        <small>
          x {vector.x.toFixed(2)} · y {vector.y.toFixed(2)} · z {vector.z.toFixed(2)}
          {entangled ? ` · |r| ${vector.length.toFixed(2)}` : null}
        </small>
        {distancia !== null && (
          <span className={chegou ? "bloch-distancia is-chegou" : "bloch-distancia"}>
            {chegou ? "No alvo" : `Falta ${distancia.toFixed(2)} para o alvo`}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
