import { MAX_QUBITS, type Circuit, type GateName, type Operation } from "./types";

/**
 * Serializa um circuito para o FRAGMENTO da URL: /laboratorio#c=<base64url>
 *
 * Fragmento, e não query string, por três motivos:
 *  - nunca chega ao servidor, então funciona igual no nginx, no Sites e na Vercel;
 *  - não polui log de acesso;
 *  - não cria um espaço combinatório de URLs para o crawler indexar.
 *
 * Serve a dois propósitos de uma vez: é o link compartilhável ("um professor
 * cola um estado de Bell no grupo do WhatsApp") e é como a aula entrega o
 * circuito preparado ao laboratório — o botão "Experimentar" apontava para
 * /laboratorio sem nenhum parâmetro e caía numa tela em branco.
 */

/** Ordem estável: acrescente no FIM, nunca reordene, ou links antigos quebram. */
const GATE_CODES: GateName[] = [
  "I", "H", "X", "Y", "Z", "S", "SDG", "T", "TDG", "SX", "SXDG", "P", "U",
  "RX", "RY", "RZ", "CNOT", "CY", "CZ", "CH", "CP", "CRX", "CRY", "CRZ",
  "CCX", "CCZ", "MCX", "MCZ", "SWAP", "ISWAP", "CSWAP", "BARRIER", "MEASURE",
];

type Packed = {
  q: number;
  s?: number;
  o: [number, number[], number[]?, number[]?][];
};

function toBase64Url(value: string) {
  const base64 = typeof btoa === "function"
    ? btoa(value)
    : Buffer.from(value, "binary").toString("base64");
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  return typeof atob === "function"
    ? atob(padded)
    : Buffer.from(padded, "base64").toString("binary");
}

export function encodeCircuit(circuit: Circuit): string {
  const packed: Packed = {
    q: circuit.qubits,
    ...(circuit.shots && circuit.shots !== 1024 ? { s: circuit.shots } : {}),
    o: [...circuit.operations]
      .sort((a, b) => a.position - b.position)
      .map((operation) => {
        const code = GATE_CODES.indexOf(operation.gate);
        const entry: [number, number[], number[]?, number[]?] = [code, operation.targets];
        if (operation.controls?.length) entry[2] = operation.controls;
        if (operation.params?.length) {
          entry[2] ??= [];
          // Arredonda para manter a URL curta sem perder precisão útil.
          entry[3] = operation.params.map((value) => Number(value.toPrecision(9)));
        }
        return entry;
      }),
  };
  return toBase64Url(JSON.stringify(packed));
}

export function decodeCircuit(encoded: string): Circuit | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));
    if (typeof parsed !== "object" || parsed === null) return null;

    const { q, s, o } = parsed as Partial<Packed>;
    if (!Number.isInteger(q) || q! < 1 || q! > MAX_QUBITS) return null;
    if (!Array.isArray(o)) return null;

    const operations: Operation[] = [];
    o.forEach((entry, index) => {
      if (!Array.isArray(entry)) return;
      const [code, targets, controls, params] = entry;
      const gate = GATE_CODES[code as number];
      if (!gate || !Array.isArray(targets)) return;
      operations.push({
        id: `op-${index}`,
        gate,
        targets: targets.filter((value): value is number => Number.isInteger(value)),
        ...(Array.isArray(controls) && controls.length ? { controls } : {}),
        ...(Array.isArray(params) && params.length ? { params } : {}),
        position: index,
      });
    });

    return {
      qubits: q!,
      operations,
      shots: typeof s === "number" ? s : 1024,
    };
  } catch {
    return null;
  }
}

/** Lê o circuito do fragmento atual da janela, se houver. */
export function readCircuitFromHash(hash: string): Circuit | null {
  const match = /[#&]c=([A-Za-z0-9_-]+)/.exec(hash);
  return match ? decodeCircuit(match[1]) : null;
}

export function circuitHref(circuit: Circuit, base = "/laboratorio") {
  return `${base}#c=${encodeCircuit(circuit)}`;
}
