/**
 * Avaliador de expressões aritméticas para ângulos.
 *
 * Substitui o `Function("return (" + expr + ")")` da versão anterior. Dois
 * ganhos concretos:
 *
 * 1. Um CSP com `script-src 'self'` passa a ser possível — o construtor
 *    Function exigiria 'unsafe-eval'.
 * 2. A normalização antiga fazia `.replaceAll("pi", "3.14159…")` no texto
 *    cru, então qualquer identificador contendo "pi" era corrompido:
 *    `spin` virava `s3.14159…n`.
 *
 * Aceita: números, pi/np.pi/math.pi, variáveis definidas pelo aluno,
 * + - * / **, parênteses, unário, e sqrt/sin/cos/tan/abs/exp/log.
 */

export class ExpressionError extends Error {
  constructor(message: string, readonly column?: number) {
    super(message);
    this.name = "ExpressionError";
  }
}

type Token =
  | { kind: "number"; value: number; at: number }
  | { kind: "name"; value: string; at: number }
  | { kind: "op"; value: string; at: number };

const FUNCTIONS: Record<string, (value: number) => number> = {
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
  exp: Math.exp,
  log: Math.log,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  "np.pi": Math.PI,
  "math.pi": Math.PI,
  e: Math.E,
  "np.e": Math.E,
  "math.e": Math.E,
};

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const match = /^\d*\.?\d+(?:[eE][+-]?\d+)?/.exec(source.slice(index));
      if (!match) throw new ExpressionError(`Número inválido em “${source.slice(index)}”.`, index);
      tokens.push({ kind: "number", value: Number(match[0]), at: index });
      index += match[0].length;
      continue;
    }

    // Identificador, com ponto para aceitar np.pi / math.pi.
    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(source.slice(index))!;
      tokens.push({ kind: "name", value: match[0], at: index });
      index += match[0].length;
      continue;
    }

    if (source.startsWith("**", index)) {
      tokens.push({ kind: "op", value: "**", at: index });
      index += 2;
      continue;
    }

    if ("+-*/()".includes(char)) {
      tokens.push({ kind: "op", value: char, at: index });
      index += 1;
      continue;
    }

    throw new ExpressionError(`Caractere inesperado “${char}”.`, index);
  }

  return tokens;
}

export function evaluateExpression(
  source: string,
  variables: Readonly<Record<string, number>> = {},
): number {
  const tokens = tokenize(source);
  let position = 0;

  const peek = () => tokens[position];
  const eat = (value: string) => {
    const token = peek();
    if (token && token.kind === "op" && token.value === value) {
      position += 1;
      return true;
    }
    return false;
  };

  function parsePrimary(): number {
    const token = peek();
    if (!token) throw new ExpressionError("Expressão incompleta.");

    if (token.kind === "number") {
      position += 1;
      return token.value;
    }

    if (token.kind === "name") {
      position += 1;
      const name = token.value;

      if (eat("(")) {
        const fn = FUNCTIONS[name.replace(/^(np|math)\./, "")];
        if (!fn) throw new ExpressionError(`Função “${name}” não é reconhecida.`, token.at);
        const argument = parseExpression();
        if (!eat(")")) throw new ExpressionError(`Falta fechar o parêntese de ${name}(.`, token.at);
        return fn(argument);
      }

      if (name in CONSTANTS) return CONSTANTS[name];
      if (name in variables) return variables[name];
      throw new ExpressionError(`Não conheço o valor de “${name}”.`, token.at);
    }

    if (eat("(")) {
      const value = parseExpression();
      if (!eat(")")) throw new ExpressionError("Falta fechar um parêntese.", token.at);
      return value;
    }

    throw new ExpressionError(`Não esperava “${token.value}” aqui.`, token.at);
  }

  function parseUnary(): number {
    if (eat("-")) return -parseUnary();
    if (eat("+")) return parseUnary();
    return parsePower();
  }

  function parsePower(): number {
    const base = parsePrimary();
    // ** associa à direita: 2**3**2 = 2**9.
    if (eat("**")) return base ** parseUnary();
    return base;
  }

  function parseTerm(): number {
    let value = parseUnary();
    for (;;) {
      if (eat("*")) value *= parseUnary();
      else if (eat("/")) {
        const divisor = parseUnary();
        if (divisor === 0) throw new ExpressionError("Divisão por zero.");
        value /= divisor;
      } else return value;
    }
  }

  function parseExpression(): number {
    let value = parseTerm();
    for (;;) {
      if (eat("+")) value += parseTerm();
      else if (eat("-")) value -= parseTerm();
      else return value;
    }
  }

  const result = parseExpression();
  if (position < tokens.length) {
    const token = tokens[position];
    throw new ExpressionError(`Sobrou “${token.value}” no fim da expressão.`, token.at);
  }
  if (!Number.isFinite(result)) throw new ExpressionError("O resultado não é um número finito.");
  return result;
}
