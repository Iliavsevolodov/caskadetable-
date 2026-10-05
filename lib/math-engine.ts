export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Table = (typeof TABLES)[number];
export type QuestionKind = "choice" | "input" | "missing" | "truefalse" | "division" | "word";

export type Question = {
  id: string;
  kind: QuestionKind;
  a: number;
  b: number;
  answer: number | boolean;
  prompt: string;
  choices?: number[];
  factKey: string;
  explanation?: string;
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export function multiplicationKey(a: number, b: number) {
  const [x, y] = a <= b ? [a, b] : [b, a];
  return `m:${x}:${y}`;
}

export function divisionKey(product: number, divisor: number) {
  return `d:${product}:${divisor}`;
}

export function choicesFor(correct: number, count = 4) {
  const values = new Set<number>([correct]);
  const offsets = shuffle([-16, -12, -10, -9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16]);
  for (const off of offsets) {
    const v = correct + off;
    if (v > 0 && v <= 100) values.add(v);
    if (values.size >= count) break;
  }
  let n = 1;
  while (values.size < count) {
    if (n !== correct) values.add(n);
    n += 1;
  }
  return shuffle([...values]).slice(0, count);
}

export function makeQuestion(opts: { table?: number; b?: number; kind?: QuestionKind; allowDivision?: boolean; harder?: boolean }): Question {
  const table = opts.table ?? pick([...TABLES]);
  const b = opts.b ?? (Math.floor(Math.random() * 10) + 1);
  const a = table;
  let kind = opts.kind ?? pick<QuestionKind>(opts.allowDivision ? ["choice", "input", "missing", "truefalse", "division", "word"] : ["choice", "input", "missing", "truefalse", "word"]);
  if (opts.harder && kind === "choice" && Math.random() > 0.3) kind = "input";

  if (kind === "division") {
    const product = a * b;
    return {
      id: crypto.randomUUID(), kind, a: product, b: a, answer: b,
      prompt: `${product} ÷ ${a} = ?`, choices: choicesFor(b), factKey: divisionKey(product, a),
      explanation: `${a} × ${b} = ${product}, значит ${product} ÷ ${a} = ${b}`
    };
  }

  if (kind === "missing") {
    const missingFirst = Math.random() > 0.5;
    return {
      id: crypto.randomUUID(), kind, a, b, answer: missingFirst ? a : b,
      prompt: missingFirst ? `? × ${b} = ${a * b}` : `${a} × ? = ${a * b}`,
      choices: choicesFor(missingFirst ? a : b, 3), factKey: multiplicationKey(a, b),
      explanation: `${a} × ${b} = ${a * b}`
    };
  }

  if (kind === "truefalse") {
    const isTrue = Math.random() > 0.45;
    const shown = isTrue ? a * b : pick(choicesFor(a * b).filter((x) => x !== a * b));
    return {
      id: crypto.randomUUID(), kind, a, b, answer: isTrue,
      prompt: `${a} × ${b} = ${shown}`, factKey: multiplicationKey(a, b),
      explanation: `${a} × ${b} = ${a * b}`
    };
  }

  if (kind === "word") {
    const themes = [
      [`У Маши ${a} коробок. В каждой по ${b} карандашей. Сколько карандашей всего?`, `${a} × ${b} = ${a * b}`],
      [`На ${a} тарелках лежит по ${b} печений. Сколько печений всего?`, `${a} × ${b} = ${a * b}`],
      [`В ${a} рядах стоит по ${b} кубиков. Сколько кубиков всего?`, `${a} × ${b} = ${a * b}`]
    ];
    const [prompt, explanation] = pick(themes);
    return { id: crypto.randomUUID(), kind, a, b, answer: a * b, prompt, choices: choicesFor(a * b), factKey: multiplicationKey(a, b), explanation };
  }

  return {
    id: crypto.randomUUID(), kind, a, b, answer: a * b,
    prompt: `${a} × ${b} = ?`, choices: kind === "choice" ? choicesFor(a * b) : undefined,
    factKey: multiplicationKey(a, b), explanation: `${a} × ${b} = ${a * b}`
  };
}

export function makeFactQuestion(a: number, b: number, kind: QuestionKind = "input"): Question {
  return makeQuestion({ table: a, b, kind, allowDivision: kind === "division" });
}

export function makeMatchSet(table?: number) {
  const usedAnswers = new Set<number>();
  const rows: { id: string; a: number; b: number; answer: number; label: string }[] = [];
  while (rows.length < 4) {
    const a = table ?? pick([...TABLES]);
    const b = Math.floor(Math.random() * 8) + 2;
    const answer = a * b;
    if (usedAnswers.has(answer)) continue;
    usedAnswers.add(answer);
    rows.push({ id: crypto.randomUUID(), a, b, answer, label: `${a} × ${b}` });
  }
  return { rows, answers: shuffle(rows.map((r) => r.answer)) };
}

export function makeMemoryPairs(table?: number) {
  const set = makeMatchSet(table);
  return shuffle(set.rows.flatMap((r) => [
    { id: `${r.id}-q`, pair: r.id, label: r.label },
    { id: `${r.id}-a`, pair: r.id, label: String(r.answer) }
  ]));
}

export function makeFamily(table?: number) {
  const a = table ?? pick([...TABLES]);
  const candidates = [2,3,4,5,6,7,8,9,10].filter((n) => n !== a);
  const b = pick(candidates);
  const p = a * b;
  const correct = [`${a} × ${b} = ${p}`, `${b} × ${a} = ${p}`, `${p} ÷ ${a} = ${b}`, `${p} ÷ ${b} = ${a}`];
  const wrong = [`${a} + ${b} = ${p}`, `${p} ÷ ${a} = ${a}`, `${a} × ${a} = ${p}`, `${p} - ${b} = ${a}`];
  return { a, b, p, correct, options: shuffle([...correct, ...shuffle(wrong).slice(0, 2)]) };
}
