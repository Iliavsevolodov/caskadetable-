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
        