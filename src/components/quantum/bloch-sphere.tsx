"use client";

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

export function BlochSphere({ vector, qubit }: { vector: BlochVector; qubit: number }) {
  const tip = project(vector.x, vector.y, vector.z);
  const entangled = vector.length < 0.95;
  const description = describeState(vector);

  const axes = [
    { key: "x", end: project(1, 0, 0), label: "x" },
    { key: "y", end: project(0, 1, 0), label: "y" },
    { key: "z", end: project(0, 0, 1), label: "z" },
  ];

  return (
    <figure className="bloch-figure">
      <svg
        aria-label={`Qubit ${qubit}: ${description}. Vetor x ${vector.x.toFixed(2)}, y ${vector.y.toFixed(2)}, z ${vector.z.toFixed(2)}, comprimento ${vector.length.toFixed(2)}.`}
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

        {/* Sombra no plano equatorial: mostra para onde o vetor aponta em x–y. */}
        {!entangled && (
          <line
            className="bloch-shadow"
            x1={CENTER}
            x2={project(vector.x, vector.y, 0).left}
            y1={CENTER}
            y2={project(vector.x, vector.y, 0).top}
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
      </figcaption>
    </figure>
  );
}
