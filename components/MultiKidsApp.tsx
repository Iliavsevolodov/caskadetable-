"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TABLES,
  Question,
  Table,
  choicesFor,
  makeFamily,
  makeMatchSet,
  makeMemoryPairs,
  makeQuestion,
  multiplicationKey
} from "@/lib/math-engine";
import {
  factMastery,
  hardFacts,
  nextAdaptiveQuestion,
  overallMastery,
  recordAnswer,
  tableMastery
} from "@/lib/learning-engine";
import { emptyProgress, loadProgress, Progress, resetProgress, saveProgress } from "@/lib/storage";

const APP_NAME = "MULTIKIDS";
type Screen = "home" | "learn" | "train" | "hard" | "test" | "speed" | "daily" | "games" | "division" | "family";
type Game = "balloon" | "memory" | "rocket" | "tower" | "match";

const modeCards: { icon: string; title: string; text: string; screen: Screen; accent: string }[] = [
  { icon: "🎓", title: "Учить", text: "Понять на картинках", screen: "learn", accent: "from-violet-500 to-indigo-500" },
  { icon: "🎯", title: "Тренироваться", text: "Разные задания", screen: "train", accent: "from-blue-500 to-cyan-500" },
  { icon: "🎮", title: "Играть", text: "5 мини-игр", screen: "games", accent: "from-fuchsia-500 to-pink-500" },
  { icon: "🧠", title: "Сложные примеры", text: "Повторить ошибки", screen: "hard", accent: "from-orange-500 to-amber-500" },
  { icon: "⚡", title: "На скорость", text: "60 секунд", screen: "speed", accent: "from-yellow-400 to-orange-500" },
  { icon: "🏆", title: "Проверить себя", text: "10, 20 или 30 вопросов", screen: "test", accent: "from-emerald-500 to-teal-500" }
];

function pct(n: number) { return Math.round(n * 100); }
function starsFor(n: number) { return Math.round(n * 5); }
function tableFromKey(key: string): number | null {
  const [kind, a, b] = key.split(":");
  if (kind !== "m") return null;
  const aa = Number(a), bb = Number(b);
  return TABLES.includes(aa as Table) ? aa : TABLES.includes(bb as Table) ? bb : null;
}

function playTone(type: "tap" | "ok" | "bad" | "done", enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const map = { tap: 420, ok: 740, bad: 190, done: 920 };
    osc.frequency.setValueAtTime(map[type], ctx.currentTime);
    if (type === "ok" || type === "done") osc.frequency.exponentialRampToValueAtTime(map[type] * 1.25, ctx.currentTime + .12);
    gain.gain.setValueAtTime(.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18);
    osc.start(); osc.stop(ctx.currentTime + .2);
    osc.onended = () => ctx.close();
  } catch {}
}

export default function MultiKidsApp() {
  const [progress, setProgress] = useState<Progress>(emptyProgress());
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedTable, setSelectedTable] = useState<number | undefined>();
  const [game, setGame] = useState<Game | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setProgress(loadProgress()); setReady(true); }, []);
  useEffect(() => { if (ready) saveProgress(progress); }, [progress, ready]);

  const navigate = (next: Screen) => { playTone("tap", progress.sound); setScreen(next); setSelectedTable(undefined); setGame(null); };
  const toggleSound = () => setProgress((p) => ({ ...p, sound: !p.sound }));

  return (
    <main className="min-h-screen bg-grid bg-[#f7f8ff] pb-12">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f7f8ff]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <button onClick={() => navigate("home")} className="flex items-center gap-2 font-black tracking-tight text-slate-900">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-xl text-white shadow-lg shadow-violet-200">×</span>
            <span className="text-lg md:text-xl">{APP_NAME}</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-white px-3 py-2 text-sm font-black shadow-sm">⭐ {progress.stars}</div>
            <button aria-label="Звук" onClick={toggleSound} className="press grid h-10 w-10 place-items-center rounded-2xl bg-white text-xl shadow-sm">{progress.sound ? "🔊" : "🔇"}</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6 md:pt-8">
        {screen !== "home" && (
          <button onClick={() => navigate("home")} className="press mb-5 rounded-2xl bg-white px-4 py-2 font-bold shadow-sm">← На главную</button>
        )}

        {screen === "home" && <Home progress={progress} onMode={navigate} onTable={(t) => { setSelectedTable(t); setScreen("learn"); }} onReset={() => setConfirmReset(true)} />}
        {screen === "learn" && <LearnMode table={selectedTable} sound={progress.sound} onPick={setSelectedTable} />}
        {screen === "train" && <TrainMode progress={progress} setProgress={setProgress} table={selectedTable} setTable={setSelectedTable} />}
        {screen === "hard" && <HardMode progress={progress} setProgress={setProgress} />}
        {screen === "daily" && <Session title="🚀 Тренировка на 5 минут" count={18} progress={progress} setProgress={setProgress} adaptive allowDivision />}
        {screen === "division" && <DivisionMode progress={progress} setProgress={setProgress} table={selectedTable} setTable={setSelectedTable} />}
        {screen === "test" && <TestMode progress={progress} setProgress={setProgress} />}
        {screen === "speed" && <SpeedMode progress={progress} setProgress={setProgress} />}
        {screen === "family" && <FamilyMode sound={progress.sound} />}
        {screen === "games" && <GamesHub game={game} setGame={setGame} progress={progress} setProgress={setProgress} />}
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 text-center">
            <div className="text-5xl">🗑️</div>
            <h2 className="mt-3 text-2xl font-black">Сбросить весь прогресс?</h2>
            <p className="mt-2 text-slate-500">Звёзды, рекорды и изученные примеры удалятся только на этом устройстве.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmReset(false)} className="answer">Отмена</button>
              <button onClick={() => { resetProgress(); setProgress(emptyProgress()); setConfirmReset(false); }} className="answer !border-rose-100 !bg-rose-50 !text-rose-600">Сбросить</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Home({ progress, onMode, onTable, onReset }: { progress: Progress; onMode: (s: Screen) => void; onTable: (t: number) => void; onReset: () => void }) {
  const mastery = overallMastery(progress);
  const attempted = TABLES.reduce((sum, t) => sum + Array.from({ length: 10 }, (_, i) => i + 1).filter((b) => Boolean(progress.facts[multiplicationKey(t, b)])).length, 0);
  const total = progress.totalCorrect + progress.totalWrong;
  const accuracy = total ? Math.round(progress.totalCorrect / total * 100) : 0;
  const ranked = [...TABLES].map((t) => ({ t, m: tableMastery(progress, t) })).sort((a, b) => b.m - a.m);
  return (
    <>
      <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#7657ff] via-[#6958f5] to-[#4f7cf7] p-6 text-white shadow-[0_18px_55px_rgba(91,76,220,.28)] md:p-10">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute bottom-[-70px] left-[35%] h-48 w-48 rounded-full bg-cyan-300/15" />
        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-bold backdrop-blur">Математика без скуки ✨</div>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">УЧИМ ТАБЛИЦУ<br className="hidden sm:block" /> УМНОЖЕНИЯ 🚀</h1>
          <p className="mt-4 max-w-xl text-base font-medium text-white/85 md:text-lg">Понял → попробовал → поиграл → повторил → запомнил.</p>
          <button onClick={() => onMode("daily")} className="press mt-6 rounded-2xl bg-white px-6 py-4 text-lg font-black text-violet-700 shadow-xl">🚀 Тренировка на 5 минут</button>
        </div>
      </section>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modeCards.map((m) => (
          <button key={m.title} onClick={() => onMode(m.screen)} className="card press flex items-center gap-4 p-4 text-left md:p-5">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${m.accent} text-2xl shadow-md`}>{m.icon}</span>
            <span ><span className="block text-lg font-black">{m.title}</span><span className="text-sm font-medium text-slate-500">{m.text}</span></span>
          </button>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[.16em] text-violet-500">Выбери таблицу </p><h2 className="text-2xl font-black md:text-3xl">От ×2 до ×9</h2></div><span className="text-sm font-bold text-slate-400">Нажми, чтобы учить</span></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {TABLES.map((t) => {
            const m = tableMastery(progress, t), stars = starsFor(m);
            return <button key={t} onClick={() => onTable(t)} className="card press p-4 text-center"><div className="text-3xl font-black text-slate-900"> {t}</div><div className="mt-2 text-xs tracking-tight">{"⭐".repeat(stars)}{"☆".repeat(5 - stars)}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct(m)}%` }} /></div><div className="mt-1 text-xs font-bold text-slate-400">{pct(m)}%</div></button>;
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <div className="card p-5 md:p-7">
          <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[.16em] text-emerald-500">Твой прогресс</p><h2 className="mt-1 text-2xl font-black">Уже получается 💪</h2></div><div className="grid h-20 w-20 place