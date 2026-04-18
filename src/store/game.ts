import { create } from 'zustand';
import { generate, findConflicts, isComplete, candidates as calcCandidates } from '../lib/sudoku';
import { evaluate } from '../lib/achievements';
import type { Difficulty, Grade, SaveState, Stats } from '../lib/types';
import { GRADE_MAX_MISTAKES, gradeToDifficulty } from '../lib/types';
import { solve } from '../lib/solver/solver';
import { STRATEGY_META } from '../lib/solver/types';
import { sfx, setMuted } from '../lib/sound';
import { haptic } from '../lib/haptic';

const SAVE_KEY = 'pseudoku:save';
const STATS_KEY = 'pseudoku:stats';
const ACH_KEY = 'pseudoku:achievements';

const defaultStats: Stats = {
  solved: { easy: 0, medium: 0, hard: 0 },
  bestMs: { easy: null, medium: null, hard: null },
  bestScore: { easy: 0, medium: 0, hard: 0 },
  streakDays: 0,
  lastPlayedDate: null,
  noMistakeRun: 0,
  totalMsPlayed: 0,
  hardWinsFlawless: 0,
  bestCombo: 0,
};

type Screen = 'home' | 'play' | 'achievements';

export interface FxEvent {
  id: number;
  kind: 'unit' | 'burst' | 'shake' | 'combo' | 'flash';
  cells?: number[];
  cell?: number;
  combo?: number;
  tone?: 'good' | 'bad' | 'great';
}

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
  fx: FxEvent[];
  hintMessage: string | null;

  newGame: (grade: Grade) => void;
  resume: () => boolean;
  setScreen: (s: Screen) => void;
  selectCell: (i: number | null) => void;
  placeDigit: (d: number) => void;
  clearCell: () => void;
  toggleNote: () => void;
  hint: () => void;
  autoPencil: () => void;
  tick: (deltaMs: number) => void;
  dismissToast: () => void;
  dismissHint: () => void;
  toggleMute: () => void;
  purgeAll: () => void;
  consumeFx: (id: number) => void;
}

let fxCounter = 0;
function emitFx(existing: FxEvent[], ev: Omit<FxEvent, 'id'>): FxEvent[] {
  return [...existing, { ...ev, id: ++fxCounter }];
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

const VALID_GRADES: Grade[] = ['kids', 'gentle', 'moderate', 'tough', 'diabolical', 'extreme'];

function difficultyToGrade(d: Difficulty): Grade {
  if (d === 'easy') return 'gentle';
  if (d === 'medium') return 'tough';
  return 'diabolical';
}

function migrateSave(s: SaveState): SaveState {
  const rawGrade = (s as unknown as { grade: unknown }).grade;
  const grade: Grade = typeof rawGrade === 'string' && (VALID_GRADES as string[]).includes(rawGrade)
    ? (rawGrade as Grade)
    : difficultyToGrade(s.difficulty);
  return {
    ...s,
    grade,
    score: typeof (s as unknown as { score: unknown }).score === 'number' ? s.score : 0,
    combo: typeof (s as unknown as { combo: unknown }).combo === 'number' ? s.combo : 0,
    bestCombo: typeof (s as unknown as { bestCombo: unknown }).bestCombo === 'number' ? s.bestCombo : 0,
  };
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
    return migrateSave(parsed);
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
      bestCombo: num(p.bestCombo, 0),
      bestScore: (() => {
        const bs = (p.bestScore as Record<string, unknown>) ?? {};
        return { easy: num(bs.easy, 0), medium: num(bs.medium, 0), hard: num(bs.hard, 0) };
      })(),
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
  fx: [],
  hintMessage: null,

  newGame: (grade) => {
    const { puzzle, solution, given, seed } = generate(grade);
    const difficulty = gradeToDifficulty(grade);
    const save: SaveState = {
      puzzle,
      solution,
      given,
      user: puzzle.slice(),
      notes: new Array(81).fill(0),
      mistakes: 0,
      elapsedMs: 0,
      difficulty,
      grade,
      seed,
      startedAt: new Date().toISOString(),
      completed: false,
      hintsUsed: 0,
      score: 0,
      combo: 0,
      bestCombo: 0,
    };
    writeSave(save);
    set({ save, screen: 'play', selectedCell: null, noteMode: false, failed: false, fx: [], hintMessage: null });
  },

  consumeFx: (id) => set((st) => ({ fx: st.fx.filter((e) => e.id !== id) })),

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
    let fx = get().fx;

    let combo = save.combo;
    let bestCombo = save.bestCombo;
    let score = save.score;

    if (correct) {
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      const base = 20;
      const comboBonus = Math.min(combo, 9) * 5;
      score += base + comboBonus;
      sfx.place(); haptic.soft();
      fx = emitFx(fx, { kind: 'burst', cell: selectedCell, tone: combo >= 3 ? 'great' : 'good' });
      if (combo >= 3) fx = emitFx(fx, { kind: 'combo', combo });
    } else {
      combo = 0;
      score = Math.max(0, score - 25);
      sfx.wrong(); haptic.wrong();
      fx = emitFx(fx, { kind: 'shake', cell: selectedCell });
      fx = emitFx(fx, { kind: 'flash', tone: 'bad' });
    }

    // Detect completed units (row/col/box) AFTER placing correct digit.
    if (correct) {
      const r = Math.floor(selectedCell / 9), c = selectedCell % 9;
      const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      const check = (cells: number[]): number[] | null => {
        const vals = cells.map((i) => user[i]);
        if (vals.every((v) => v !== 0)) {
          const set = new Set(vals);
          if (set.size === 9) return cells;
        }
        return null;
      };
      const rowCells = Array.from({ length: 9 }, (_, k) => r * 9 + k);
      const colCells = Array.from({ length: 9 }, (_, k) => k * 9 + c);
      const boxCells: number[] = [];
      for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) boxCells.push(rr * 9 + cc);

      let bonus = 0;
      const completed = [check(rowCells), check(colCells), check(boxCells)].filter(Boolean) as number[][];
      for (const unit of completed) {
        fx = emitFx(fx, { kind: 'unit', cells: unit });
        bonus += 150;
      }
      score += bonus;
    }

    const nextSave: SaveState = {
      ...save,
      user,
      notes,
      mistakes: save.mistakes + (correct ? 0 : 1),
      score,
      combo,
      bestCombo,
    };

    const maxMistakes = GRADE_MAX_MISTAKES[save.grade];
    const failed = nextSave.mistakes >= maxMistakes;

    if (isComplete(user, save.solution)) {
      nextSave.completed = true;
      // Final score bonus: difficulty multiplier + speed + flawless + no-hints
      const diffMul = save.difficulty === 'hard' ? 3 : save.difficulty === 'medium' ? 2 : 1;
      const elapsedSec = nextSave.elapsedMs / 1000;
      const speedBonus = Math.max(0, 1000 - Math.floor(elapsedSec * 2)) * diffMul;
      const flawless = nextSave.mistakes === 0 ? 500 * diffMul : 0;
      const noHints = nextSave.hintsUsed === 0 ? 300 * diffMul : 0;
      nextSave.score = nextSave.score + speedBonus + flawless + noHints;

      const today = todayISO();
      const stats = get().stats;
      const elapsed = nextSave.elapsedMs;
      const diff = nextSave.difficulty;
      const prevBest = stats.bestMs[diff];
      const newStats: Stats = {
        ...stats,
        solved: { ...stats.solved, [diff]: stats.solved[diff] + 1 },
        bestMs: { ...stats.bestMs, [diff]: prevBest === null ? elapsed : Math.min(prevBest, elapsed) },
        bestScore: { ...stats.bestScore, [diff]: Math.max(stats.bestScore[diff], nextSave.score) },
        bestCombo: Math.max(stats.bestCombo, nextSave.bestCombo),
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
      fx = emitFx(fx, { kind: 'flash', tone: 'great' });
      set({ save: nextSave, stats: newStats, unlocked, lastUnlock: newly[0] ?? null, failed: false, fx });
      return;
    }

    writeSave(nextSave);
    if (failed) { sfx.fail(); haptic.wrong(); }
    set({ save: nextSave, failed, fx });
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
    const { save } = get();
    if (!save || save.completed) return;

    // Build a working grid from current user entries, but only where the user entry
    // matches the solution (so solver doesn't get stuck on user's wrong guesses).
    const working = save.puzzle.slice();
    for (let i = 0; i < 81; i++) {
      if (!save.given[i] && save.user[i] !== 0 && save.user[i] === save.solution[i]) {
        working[i] = save.user[i];
      }
    }

    const trace = solve(working);
    const firstSolve = trace.steps.find((step) => step.solved.length > 0);

    let target: number | null = null;
    let digit = 0;
    let strategyLabel = '';

    if (firstSolve) {
      target = firstSolve.solved[0].cell;
      digit = firstSolve.solved[0].digit;
      strategyLabel = STRATEGY_META[firstSolve.strategy].label;
    } else {
      // Fallback: solver couldn't deduce more — find any mistake and reveal solution.
      for (let i = 0; i < 81; i++) {
        if (!save.given[i] && save.user[i] !== save.solution[i]) {
          target = i;
          digit = save.solution[i];
          strategyLabel = 'Reveal';
          break;
        }
      }
    }

    if (target === null) return;

    const user = save.user.slice();
    user[target] = digit;
    const notes = save.notes.slice();
    notes[target] = 0;
    const r = Math.floor(target / 9), c = target % 9;
    const mask = ~(1 << digit);
    for (let k = 0; k < 9; k++) { notes[r * 9 + k] &= mask; notes[k * 9 + c] &= mask; }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) notes[rr * 9 + cc] &= mask;

    const given = save.given.slice();
    given[target] = true;
    const ns: SaveState = { ...save, user, notes, given, hintsUsed: save.hintsUsed + 1 };
    writeSave(ns);
    const row = Math.floor(target / 9) + 1;
    const col = (target % 9) + 1;
    set({
      save: ns,
      selectedCell: target,
      hintMessage: `${strategyLabel} · R${row}C${col} = ${digit}`,
    });
    sfx.correct(); haptic.soft();
  },

  autoPencil: () => {
    const { save } = get();
    if (!save || save.completed) return;
    const notes = new Array(81).fill(0);
    for (let i = 0; i < 81; i++) {
      if (save.given[i] || save.user[i] !== 0) continue;
      const cands = calcCandidates(save.user, i);
      let mask = 0;
      for (const d of cands) mask |= 1 << d;
      notes[i] = mask;
    }
    const ns: SaveState = { ...save, notes };
    writeSave(ns);
    set({ save: ns });
    sfx.tap(); haptic.soft();
  },

  dismissHint: () => set({ hintMessage: null }),

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
