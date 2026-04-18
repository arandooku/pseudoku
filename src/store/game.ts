import { create } from 'zustand';
import { generate, findConflicts, isComplete, candidates as calcCandidates } from '../lib/sudoku';
import { evaluate } from '../lib/achievements';
import type { Difficulty, SaveState, Stats } from '../lib/types';
import { DIFFICULTY_MAX_MISTAKES } from '../lib/types';
import { sfx, setMuted } from '../lib/sound';
import { haptic } from '../lib/haptic';

const SAVE_KEY = 'pseudoku:save';
const STATS_KEY = 'pseudoku:stats';
const ACH_KEY = 'pseudoku:achievements';

const defaultStats: Stats = {
  solved: { easy: 0, medium: 0, hard: 0 },
  bestMs: { easy: null, medium: null, hard: null },
  streakDays: 0,
  lastPlayedDate: null,
  noMistakeRun: 0,
  totalMsPlayed: 0,
  hardWinsFlawless: 0,
};

type Screen = 'home' | 'play' | 'achievements';

interface GameStore {
  screen: Screen;
  save: SaveState | null;
  stats: Stats;
  unlocked: string[];
  selectedCell: number | null;
  noteMode: boolean;
  failed: boolean;
  lastUnlock: string | null;
  muted: boolean;

  newGame: (difficulty: Difficulty) => void;
  resume: () => boolean;
  setScreen: (s: Screen) => void;
  selectCell: (i: number | null) => void;
  placeDigit: (d: number) => void;
  clearCell: () => void;
  toggleNote: () => void;
  hint: () => void;
  tick: (deltaMs: number) => void;
  dismissToast: () => void;
  toggleMute: () => void;
  purgeAll: () => void;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / 86_400_000);
}

function isValidSave(v: unknown): v is SaveState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  const diffs = ['easy', 'medium', 'hard'];
  return (
    Array.isArray(s.puzzle) && s.puzzle.length === 81 &&
    Array.isArray(s.solution) && s.solution.length === 81 &&
    Array.isArray(s.given) && s.given.length === 81 &&
    Array.isArray(s.user) && s.user.length === 81 &&
    Array.isArray(s.notes) && s.notes.length === 81 &&
    typeof s.mistakes === 'number' && Number.isFinite(s.mistakes) &&
    typeof s.elapsedMs === 'number' && Number.isFinite(s.elapsedMs) &&
    typeof s.difficulty === 'string' && diffs.includes(s.difficulty) &&
    typeof s.seed === 'number' &&
    typeof s.startedAt === 'string' &&
    typeof s.completed === 'boolean' &&
    typeof s.hintsUsed === 'number' && Number.isFinite(s.hintsUsed)
  );
}

function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSave(parsed)) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}
function writeSave(s: SaveState | null) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(SAVE_KEY);
  } catch { /* quota */ }
}
function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const solved = (p.solved as Record<string, unknown>) ?? {};
    const bestMs = (p.bestMs as Record<string, unknown>) ?? {};
    return {
      solved: {
        easy: num(solved.easy, 0),
        medium: num(solved.medium, 0),
        hard: num(solved.hard, 0),
      },
      bestMs: {
        easy: numOrNull(bestMs.easy),
        medium: numOrNull(bestMs.medium),
        hard: numOrNull(bestMs.hard),
      },
      streakDays: num(p.streakDays, 0),
      lastPlayedDate: typeof p.lastPlayedDate === 'string' ? p.lastPlayedDate : null,
      noMistakeRun: num(p.noMistakeRun, 0),
      totalMsPlayed: num(p.totalMsPlayed, 0),
      hardWinsFlawless: num(p.hardWinsFlawless, 0),
    };
  } catch { return defaultStats; }
}
function writeStats(s: Stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* quota */ }
}
function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.unlocked) ? parsed.unlocked : [];
  } catch { return []; }
}
function writeUnlocked(u: string[]) {
  try { localStorage.setItem(ACH_KEY, JSON.stringify({ unlocked: u })); } catch { /* quota */ }
}

export const useGame = create<GameStore>((set, get) => ({
  screen: 'home',
  save: loadSave(),
  stats: loadStats(),
  unlocked: loadUnlocked(),
  selectedCell: null,
  noteMode: false,
  failed: false,
  lastUnlock: null,
  muted: false,

  newGame: (difficulty) => {
    const { puzzle, solution, given, seed } = generate(difficulty);
    const save: SaveState = {
      puzzle,
      solution,
      given,
      user: puzzle.slice(),
      notes: new Array(81).fill(0),
      mistakes: 0,
      elapsedMs: 0,
      difficulty,
      seed,
      startedAt: new Date().toISOString(),
      completed: false,
      hintsUsed: 0,
    };
    writeSave(save);
    set({ save, screen: 'play', selectedCell: null, noteMode: false, failed: false });
  },

  resume: () => {
    const s = loadSave();
    if (!s || s.completed) return false;
    set({ save: s, screen: 'play', selectedCell: null, failed: false });
    return true;
  },

  setScreen: (screen) => set({ screen }),

  selectCell: (i) => { sfx.tap(); haptic.tap(); set({ selectedCell: i }); },

  toggleNote: () => set((st) => ({ noteMode: !st.noteMode })),

  toggleMute: () => {
    const m = !get().muted;
    setMuted(m);
    set({ muted: m });
  },

  placeDigit: (d) => {
    const st = get();
    const { save, selectedCell, noteMode } = st;
    if (!save || selectedCell === null || save.completed || st.failed) return;
    if (save.given[selectedCell]) return;

    if (noteMode) {
      const notes = save.notes.slice();
      notes[selectedCell] ^= 1 << d;
      const user = save.user.slice();
      user[selectedCell] = 0;
      const ns = { ...save, notes, user };
      writeSave(ns);
      set({ save: ns });
      sfx.tap(); haptic.tap();
      return;
    }

    const user = save.user.slice();
    user[selectedCell] = d;
    const notes = save.notes.slice();
    notes[selectedCell] = 0;
    const r = Math.floor(selectedCell / 9), c = selectedCell % 9;
    const mask = ~(1 << d);
    for (let k = 0; k < 9; k++) { notes[r * 9 + k] &= mask; notes[k * 9 + c] &= mask; }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) notes[rr * 9 + cc] &= mask;

    const correct = save.solution[selectedCell] === d;
    const nextSave: SaveState = {
      ...save,
      user,
      notes,
      mistakes: save.mistakes + (correct ? 0 : 1),
    };

    if (correct) { sfx.place(); haptic.soft(); }
    else { sfx.wrong(); haptic.wrong(); }

    const maxMistakes = DIFFICULTY_MAX_MISTAKES[save.difficulty];
    const failed = nextSave.mistakes >= maxMistakes;

    if (isComplete(user, save.solution)) {
      nextSave.completed = true;
      const today = todayISO();
      const stats = get().stats;
      const elapsed = nextSave.elapsedMs;
      const diff = nextSave.difficulty;
      const prevBest = stats.bestMs[diff];
      const newStats: Stats = {
        ...stats,
        solved: { ...stats.solved, [diff]: stats.solved[diff] + 1 },
        bestMs: { ...stats.bestMs, [diff]: prevBest === null ? elapsed : Math.min(prevBest, elapsed) },
        totalMsPlayed: stats.totalMsPlayed + elapsed,
        noMistakeRun: nextSave.mistakes === 0 ? stats.noMistakeRun + 1 : 0,
        hardWinsFlawless: stats.hardWinsFlawless + (diff === 'hard' && nextSave.mistakes === 0 ? 1 : 0),
        lastPlayedDate: today,
        streakDays: (() => {
          if (!stats.lastPlayedDate) return 1;
          const dd = daysDiff(stats.lastPlayedDate, today);
          if (dd === 0) return Math.max(1, stats.streakDays);
          if (dd === 1) return stats.streakDays + 1;
          return 1;
        })(),
      };
      writeStats(newStats);
      writeSave(nextSave);
      const newly = evaluate(get().unlocked, newStats, nextSave);
      const unlocked = [...get().unlocked, ...newly];
      if (newly.length) writeUnlocked(unlocked);
      sfx.win(); haptic.win();
      set({ save: nextSave, stats: newStats, unlocked, lastUnlock: newly[0] ?? null, failed: false });
      return;
    }

    writeSave(nextSave);
    if (failed) { sfx.fail(); haptic.wrong(); }
    set({ save: nextSave, failed });
  },

  clearCell: () => {
    const { save, selectedCell } = get();
    if (!save || selectedCell === null || save.given[selectedCell]) return;
    const user = save.user.slice();
    const notes = save.notes.slice();
    user[selectedCell] = 0;
    notes[selectedCell] = 0;
    const ns = { ...save, user, notes };
    writeSave(ns);
    set({ save: ns });
    sfx.tap();
  },

  hint: () => {
    const { save, selectedCell } = get();
    if (!save || save.completed) return;
    let target = selectedCell;
    if (target === null || save.given[target] || save.user[target] === save.solution[target]) {
      for (let i = 0; i < 81; i++) {
        if (!save.given[i] && save.user[i] !== save.solution[i]) { target = i; break; }
      }
    }
    if (target === null) return;
    const user = save.user.slice();
    user[target] = save.solution[target];
    const given = save.given.slice();
    given[target] = true;
    const ns = { ...save, user, given, hintsUsed: save.hintsUsed + 1 };
    writeSave(ns);
    set({ save: ns, selectedCell: target });
    sfx.correct(); haptic.soft();
  },

  tick: (delta) => {
    const st = get();
    if (!st.save || st.save.completed || st.failed) return;
    const ns = { ...st.save, elapsedMs: st.save.elapsedMs + delta };
    if (Math.floor(ns.elapsedMs / 5000) !== Math.floor(st.save.elapsedMs / 5000)) writeSave(ns);
    set({ save: ns });
  },

  dismissToast: () => set({ lastUnlock: null }),

  purgeAll: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(ACH_KEY);
    } catch { /* ignore */ }
    set({
      save: null,
      stats: defaultStats,
      unlocked: [],
      selectedCell: null,
      noteMode: false,
      failed: false,
      lastUnlock: null,
      screen: 'home',
    });
  },
}));

export function computeConflicts(save: SaveState | null): Set<number> {
  if (!save) return new Set();
  return findConflicts(save.user);
}

export function computeCandidatesFor(save: SaveState | null, i: number): number[] {
  if (!save) return [];
  return calcCandidates(save.user, i);
}
