import type { Grade } from './solver/types';

export { GRADE_LABEL, GRADE_ORDER } from './solver/types';
export type { Grade, StrategyId } from './solver/types';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Grid = number[]; // length 81, 0 = empty

export interface PuzzleData {
  puzzle: Grid;
  solution: Grid;
  given: boolean[];
  seed: number;
  difficulty: Difficulty;
  grade: Grade;
}

export interface SaveState {
  puzzle: Grid;
  solution: Grid;
  given: boolean[];
  user: Grid;
  notes: number[];
  mistakes: number;
  elapsedMs: number;
  difficulty: Difficulty;
  grade: Grade;
  seed: number;
  startedAt: string;
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

export function gradeToDifficulty(g: Grade): Difficulty {
  if (g === 'kids' || g === 'gentle') return 'easy';
  if (g === 'moderate' || g === 'tough') return 'medium';
  return 'hard';
}

export const GRADE_MAX_MISTAKES: Record<Grade, number> = {
  kids: Infinity,
  gentle: Infinity,
  moderate: 5,
  tough: 4,
  diabolical: 3,
  extreme: 3,
};
