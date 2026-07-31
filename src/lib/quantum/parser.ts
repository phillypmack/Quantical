import { ExpressionError, evaluateExpression } from "./expr";
import { GATE_ARITY } from "./simulator";
import { MAX_QUBITS, type Circuit, type GateName, type Operation } from "./types";

export type ParseIssue = {
  line: number;
  column?: number;
  message: string;
  suggestion?: string;
};

export class ParseError extends Error {
  constructor(readonly issues: ParseIssue[]) {
    super(issues[0]?.message ?? "Não foi possível interpretar o circuito.");
    this.name = "ParseError";
  }
}

/** Formato: [porta, quantidade de controles, quantidade de parâmetros]. */
const gateMap: Record<string, GateName> = {
  id: "I", i: "I",
  h: "H", x: "X", y: "Y", z: "Z",
  s: "S", sdg: "SDG", t: "T", tdg: "TDG",
  sx: "SX", sxdg: "SXDG",
  p: "P", u: "U", u3: "U", u1: "P",
  rx: "RX", ry: "RY", rz: "RZ",
  cx: "CNOT", cnot: "CNOT", cy: "CY", cz: "CZ", ch: "CH",
  cp: "CP", cu1: "CP", crx: "CRX", cry: "CRY", crz: "CRZ",
  ccx: "CCX", toffoli: "CCX", ccz: "CCZ",
  mcx: "MCX", mcz: "MCZ",
  swap: "SWAP", iswap: "ISWAP", cswap: "CSWAP", fredkin: "CSWAP",
  barrier: "BARRIER",
  measure_all: "MEASURE", measure: "MEASURE",
};

/** Quantos CONTROLES cada porta exige (-1 = um ou mais). */
const CONTROL_COUNT: Partial<Record<GateName, number>> = {
  CNOT: 1, CY: 1, CZ: 1, CH: 1, CP: 1, CRX: 1, CRY: 1, CRZ: 1,
  CCX: 2, CCZ: 2, CSWAP: 1, MCX: -1, MCZ: -1,
};

/** Quantos ALVOS cada porta exige. */
const TARGET_COUNT: Partial<Record<GateName, number>> = { SWAP: 2, ISWAP: 2, CSWAP: 2 };

function levenshtein(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = temp;
    }
  }
  return previous[b.length];
}

function suggestGate(method: string): string | undefined {
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const candidate of Object.keys(gateMap)) {
    const distance = levenshtein(method, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return bestDistance <= 2 ? best : undefined;
}

/** Divide argumentos no nível superior, respeitando parênteses. */
function splitArguments(source: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of source) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/** Remove comentários sem cortar `#` dentro de string. */
function stripComment(line: string) {
  let inSingle = false;
  let inDouble = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "'" && !inDouble) inSingle = !inSingle;
    else if (char === '"' && !inSingle) inDouble = !inDouble;
    else if (char === "#" && !inSingle && !inDouble) return line.slice(0, index);
  }
  return line;
}

const IGNORED_CALLS = /^(print|display|draw|qc\.draw|circuit\.draw)\s*\(/;
const CALL = /^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*;?$/;
const ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/;

export function parseQiskit(code: string, defaultShots = 1024): Circuit {
  const issues: ParseIssue[] = [];
  const lines = code.split(/\r?\n/);

  const constructor = code.match(/QuantumCircuit\s*\(\s*(\d+)/);
  if (!constructor) {
    throw new ParseError([
      {
        line: 1,
        message: "Crie um circuito com QuantumCircuit(n), onde n é o número de qubits.",
      },
    ]);
  }

  const qubits = Number(constructor[1]);
  if (qubits < 1 || qubits > MAX_QUBITS) {
    throw new ParseError([
      { line: 1, message: `O laboratório aceita de 1 a ${MAX_QUBITS} qubits.` },
    ]);
  }

  const operations: Operation[] = [];
  // Tabela de símbolos: a versão anterior fazia `if (line.includes("=")) continue`,
  // então `theta = pi/2` era descartado em silêncio e a linha SEGUINTE,
  // `qc.rz(theta, 0)`, falhava com um erro confuso sobre um valor desconhecido.
  const variables: Record<string, number> = {};
  let shots: number | undefined;

  const evaluate = (expression: string, line: number): number => {
    try {
      return evaluateExpression(expression, variables);
    } catch (error) {
      issues.push({
        line,
        message:
          error instanceof ExpressionError
            ? `Não entendi “${expression}”: ${error.message}`
            : `Não entendi o valor “${expression}”.`,
        suggestion: "Use números, pi, variáveis já definidas ou contas como pi / 2.",
      });
      return Number.NaN;
    }
  };

  const integer = (expression: string, line: number, what: string): number => {
    const value = evaluate(expression, line);
    if (Number.isNaN(value)) return Number.NaN;
    if (!Number.isInteger(value)) {
      issues.push({ line, message: `${what} precisa ser um número inteiro, mas veio ${value}.` });
      return Number.NaN;
    }
    if (value < 0 || value >= qubits) {
      issues.push({
        line,
        message: `O qubit ${value} não existe: este circuito tem ${qubits}.`,
        suggestion: `Use um índice entre 0 e ${qubits - 1}.`,
      });
      return Number.NaN;
    }
    return value;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = stripComment(lines[index]).trim();

    if (!line || line.startsWith("from ") || line.startsWith("import ")) continue;
    if (IGNORED_CALLS.test(line)) continue;

    const call = CALL.exec(line);

    if (!call) {
      const assignment = ASSIGNMENT.exec(line);
      if (assignment) {
        const [, name, expression] = assignment;
        if (expression.includes("QuantumCircuit(")) continue;
        if (name === "shots") {
          const value = evaluate(expression, lineNumber);
          if (Number.isFinite(value)) shots = Math.round(value);
          continue;
        }
        // Guarda a variável em vez de descartar a linha.
        const value = evaluate(expression, lineNumber);
        if (Number.isFinite(value)) variables[name] = value;
        continue;
      }
      if (line.includes("QuantumCircuit(")) continue;
      issues.push({
        line: lineNumber,
        message: `Não reconheci “${line}”.`,
        suggestion: "Use chamadas como qc.h(0), qc.cx(0, 1) ou defina valores como theta = pi / 2.",
      });
      continue;
    }

    const [, receiver, rawMethod, rawArgs] = call;
    // Aceita qualquer receptor plausível (qc, circuit, circuito, meu_circuito…).
    if (!/^(qc|circ|circuit|circuito)/i.test(receiver)) {
      issues.push({
        line: lineNumber,
        message: `Não sei o que é “${receiver}”.`,
        suggestion: "O circuito criado com QuantumCircuit costuma se chamar qc.",
      });
      continue;
    }

    const method = rawMethod.toLowerCase();
    const gate = gateMap[method];
    if (!gate) {
      const suggestion = suggestGate(method);
      issues.push({
        line: lineNumber,
        message: `A operação “${method}” ainda não é suportada.`,
        suggestion: suggestion ? `Você quis dizer “${suggestion}”?` : undefined,
      });
      continue;
    }

    const args = splitArguments(rawArgs);
    const position = operations.length;
    const id = `op-${position}`;

    if (gate === "MEASURE") {
      operations.push({
        id,
        gate,
        targets: Array.from({ length: qubits }, (_, qubit) => qubit),
        position,
      });
      continue;
    }

    if (gate === "BARRIER") {
      operations.push({
        id,
        gate,
        targets: args.length
          ? args.map((argument) => integer(argument, lineNumber, "O qubit"))
          : Array.from({ length: qubits }, (_, qubit) => qubit),
        position,
      });
      continue;
    }

    const paramCount = GATE_ARITY[gate] ?? 0;
    const controlCount = CONTROL_COUNT[gate] ?? 0;
    const targetCount = TARGET_COUNT[gate] ?? 1;
    const fixedArity = controlCount >= 0 ? paramCount + controlCount + targetCount : -1;

    if (fixedArity >= 0 && args.length !== fixedArity) {
      const parts: string[] = [];
      if (paramCount === 1) parts.push("um ângulo");
      else if (paramCount > 1) parts.push(`${paramCount} parâmetros`);
      if (controlCount === 1) parts.push("um controle");
      else if (controlCount > 1) parts.push(`${controlCount} controles`);
      parts.push(targetCount === 1 ? "um alvo" : `${targetCount} alvos`);
      issues.push({
        line: lineNumber,
        message: `${method} espera ${parts.join(", ")} — recebeu ${args.length} argumento(s).`,
      });
      continue;
    }

    if (fixedArity < 0 && args.length < 2) {
      issues.push({
        line: lineNumber,
        message: `${method} espera ao menos um controle e um alvo.`,
      });
      continue;
    }

    let cursor = 0;
    const params = Array.from({ length: paramCount }, () =>
      evaluate(args[cursor++], lineNumber),
    );
    const controlTotal = controlCount >= 0 ? controlCount : args.length - cursor - targetCount;
    const controls = Array.from({ length: controlTotal }, () =>
      integer(args[cursor++], lineNumber, "O controle"),
    );
    const targets = Array.from({ length: targetCount }, () =>
      integer(args[cursor++], lineNumber, "O alvo"),
    );

    if ([...params, ...controls, ...targets].some(Number.isNaN)) continue;

    operations.push({
      id,
      gate,
      targets,
      ...(controls.length ? { controls } : {}),
      ...(params.length ? { params } : {}),
      position,
    });
  }

  // Diferente da versão anterior, que lançava no PRIMEIRO problema, aqui o
  // aluno recebe a lista inteira de uma vez.
  if (issues.length > 0) throw new ParseError(issues);

  return { qubits, operations, shots: shots ?? defaultShots };
}
