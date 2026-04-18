export type Difficulty = 'easy' | 'medium' | 'hard';

export type Grid = number[]; // length 81, 0 = empty

export interface PuzzleData {
  puzzle: Grid;
  solution: Grid;
  given: boolean[]; // true if cell was pre-filled (uneditable)
  seed: number;
  difficulty: Difficulty;
}

export interface SaveState {
  puzzle: Grid;
  solution: Grid;
  given: boolean[];
  user: Grid;            // current user entries (0 if empty)
  notes: number[];       // bitmask per cell, bit n = pencil n+1
  mistakes: number;
  elapsedMs: number;
  difficulty: Difficulty;
  seed: number;
  startedAt: string;     // ISO
  completed: boolean;
  hintsUsed: number;
  score: number;
  combo: number;
  bestCombo: number;
}

export interface Stats {
  solved: { easy: number; medium: number; hard: number };
  bestMs: { easy: number | null; medium: number | null; hard: number | null };
  bestScore: { easy: number; medium: number; hard: number };
  streakDays: number;
  lastPlayedDate: string | null; // YYYY-MM-DD
  noMistakeRun: number;
  totalMsPlayed: number;
  hardWinsFlawless: number;
  bestCombo: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  check: (stats: Stats, save: SaveState | null) => boolean;
}

export interface AchievementState {
  unlocked: string[];
}

export const DIFFICULTY_MAX_MISTAKES: Record<Difficulty, number> = {
  easy: Infinity,
  medium: 5,
  hard: 3,
};

export const DIFFICULTY_CLUES: Record<Difficulty, [number, number]> = {
  easy: [40, 45],
  medium: [30, 35],
  hard: [24, 28],
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Zen',
  medium: 'Flow',
  hard: 'Crucible',
};
