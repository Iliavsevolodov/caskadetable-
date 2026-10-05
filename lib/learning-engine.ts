import { Progress, FactStat } from "./storage";
import { Question, TABLES, makeQuestion, multiplicationKey } from "./math-engine";

const blankStat = (): FactStat => ({ attempts: 0, correct: 0, wrong: 0, totalMs: 0, lastSeen: 0, streak: 0 });

export function recordAnswer(progress: Progress, question: Question, correct: boolean, elapsedMs: number): Progress {
  const stat = progress.facts[question.factKey] ?? blankStat();
  const nextStat: FactStat = {
    attempts: stat.attempts + 1,
    correct: stat.correct + (correct ? 1 : 0),
    wrong: stat.wrong + (correct ? 0 : 1),
    totalMs: stat.totalMs + elapsedMs,
    lastSeen: Date.now(),
    streak: correct ? stat.streak + 1 : 0
  };
  const streak = correct ? progress.streak + 1 : 0;
  const achievements = new Set(progress.achievements);
  const totalCorrect = progress.totalCorrect + (correct ? 1 : 0);
  if (streak >= 10) achievements.add("🔥 10 правильных подряд");
  if (totalCorrect >= 50) achievements.add("🏅 50 правильных ответов");
  if (totalCorrect >= 100) achievements.add("🏅 100 правильных ответов");
  const next: Progress = {
    ...progress,
    stars: progress.stars + (correct ? 1 : 0),
    totalCorrect,
    totalWrong: progress.totalWrong + (correct ? 0 : 1),
    streak,
    maxStreak: Math.max(progress.maxStreak, streak),
    facts: { ...progress.facts, [question.factKey]: nextStat },
    achievements: [...achievements]
  };
  TABLES.forEach((table) => {
    if (tableMastery(next, table) >= 0.9) achievements.add(`🏅 Выучил ×${table}`);
  });
  next.achievements = [...achievements];
  if (overallMastery(next) >= 0.9) next.achievements = [...new Set([...next.achievements, "🏆 Таблица умножения освоена"] )];
  return next;
}

export function factMastery(stat?: FactStat) {
  if (!stat || stat.attempts === 0) return 0;
  const accuracy = stat.correct / stat.attempts;
  const avg = stat.totalMs / stat.attempts;
  const speed = avg <= 3500 ? 1 : avg <= 6500 ? 0.8 : avg <= 10000 ? 0.6 : 0.4;
  const repetition = Math.min(1, stat.attempts / 4);
  return Math.max(0, Math.min(1, accuracy * 0.65 + speed * 0.2 + repetition * 0.15));
}

export function tableMastery(progress: Progress, table: number) {
  let sum = 0;
  for (let b = 1; b <= 10; b += 1) sum += factMastery(progress.facts[multiplicationKey(table, b)]);
  return sum / 10;
}

export function overallMastery(progress: Progress) {
  return TABLES.reduce((s, t) => s + tableMastery(progress, t), 0) / TABLES.length;
}

export function hardFacts(progress: Progress) {
  return Object.entries(progress.facts)
    .filter(([, s]) => s.attempts >= 1 && (s.wrong > 0 || factMastery(s) < 0.6))
    .sort(([, a], [, b]) => factMastery(a) - factMastery(b));
}

function parseMultiplicationKey(key: string) {
  const [type, a, b] = key.split(":");
  return type === "m" ? [Number(a), Number(b)] as const : null;
}

export function nextAdaptiveQuestion(progress: Progress, table?: number, allowDivision = true): Question {
  const now = Date.now();
  const candidates: { a: number; b: number; weight: number }[] = [];
  const tables = table ? [table] : [...TABLES];

  for (const a of tables) {
    for (let b = 1; b <= 10; b += 1) {
      const stat = progress.facts[multiplicationKey(a, b)];
      let weight = 2; // новые примеры тоже регулярно появляются
      if (stat) {
        const accuracy = stat.correct / Math.max(1, stat.attempts);
        const avg = stat.totalMs / Math.max(1, stat.attempts);
        weight = 1 + stat.wrong * 2.5 + (1 - accuracy) * 5 + (avg > 7000 ? 3 : avg > 4500 ? 1.5 : 0);
        if (now - stat.lastSeen > 1000 * 60 * 60 * 24) weight += 2.5;
        if (now - stat.lastSeen < 12000) weight *= 0.12; // не долбим ошибку сразу подряд
        weight += (1 - factMastery(stat)) * 3;
      } else {
        weight = 2.4;
      }
      candidates.push({ a, b, weight: Math.max(.15, weight) });
    }
  }

  const total = candidates.reduce((s, x) => s + x.weight, 0);
  let roll = Math.random() * total;
  let chosen = candidates[0];
  for (const item of candidates) {
    roll -= item.weight;
    if (roll <= 0) { chosen = item; break; }
  }

  const stat = progress.facts[multiplicationKey(chosen.a, chosen.b)];
  const mastery = factMastery(stat);
  const kinds = allowDivision
    ? (mastery > .72 ? ["input", "missing", "division", "truefalse"] : ["choice", "input", "missing"])
    : (mastery > .72 ? ["input", "missing", "truefalse", "word"] : ["choice", "input", "missing", "word"]);
  const kind = kinds[Math.floor(Math.random() * kinds.length)] as Question["kind"];
  return makeQuestion({ table: chosen.a, b: chosen.b, kind, allowDivision, harder: progress.streak >= 4 });
}
