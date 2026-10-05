export type FactStat = {
  attempts: number;
  correct: number;
  wrong: number;
  totalMs: number;
  lastSeen: number;
  streak: number;
};

export type Progress = {
  version: 1;
  stars: number;
  totalCorrect: number;
  totalWrong: number;
  streak: number;
  maxStreak: number;
  speedRecord: number;
  facts: Record<string, FactStat>;
  achievements: string[];
  sound: boolean;
};

export const STORAGE_KEY = "multikids-progress-v1";

export const emptyProgress = (): Progress => ({
  version: 1,
  stars: 0,
  totalCorrect: 0,
  totalWrong: 0,
  streak: 0,
  maxStreak: 0,
  speedRecord: 0,
  facts: {},
  achievements: [],
  sound: true
});

export function loadProgress(): Progress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return { ...emptyProgress(), ...JSON.parse(raw) } as Progress;
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: Progress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
