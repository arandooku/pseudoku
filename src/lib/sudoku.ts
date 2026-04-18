import { mulberry32, shuffled, randomSeed, type Rng } from './rng';
import type { Difficulty, Grid, PuzzleData } from './types';
import type { Grade, SolveTrace, GradeResult } from './solver/types';
import { GRADE_ORDER } from './solver/types';
import { solve } from './solver/solver';
import { grade as gradeTrace, isSatisfyingPuzzle } from './grader';

const N = 9;

export function rc(r: number, c: number) { return r * N + c; }
export function rowOf(i: number) { return Math.floor(i / N); }
export function colOf(i: number) { return i % N; }
export function boxOf(i: number) {
  const r = rowOf(i), c = colOf(i);
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

export function emptyGrid(): Grid { return new Array(81).fill(0); }
export function clone(g: Grid): Grid { return g.slice(); }

function computeMasks(g: Grid) {
  const row = new Uint16Array(9), col = new Uint16Array(9), box = new Uint16Array(9);
  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (v !== 0) {
      const bit = 1 << v;
      row[rowOf(i)] |= bit;
      col[colOf(i)] |= bit;
      box[boxOf(i)] |= bit;
    }
  }
  return { row, col, box };
}

export function isValidMove(g: Grid, i: number, v: number): boolean {
  if (v < 1 || v > 9) return false;
  const r = rowOf(i), c = colOf(i);
  for (let k = 0; k < 9; k++) {
    if (g[rc(r, k)] === v && k !== c) return false;
    if (g[rc(k, c)] === v && k !== r) return false;
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++)
    for (let cc = bc; cc < bc + 3; cc++)
      if (g[rc(rr, cc)] === v && !(rr === r && cc === c)) return false;
  return true;
}

function fillGrid(g: Grid, rng: Rng): boolean {
  const { row, col, box } = computeMasks(g);
  function rec(): boolean {
    let idx = -1, minCount = 10, minMask = 0;
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const used = row[rowOf(i)] | col[colOf(i)] | box[boxOf(i)];
      const avail = (~used) & 0x3fe;
      let count = 0, m = avail;
      while (m) { m &= m - 1; count++; }
      if (count === 0) return false;
      if (count < minCount) { minCount = count; idx = i; minMask = avail; if (count === 1) break; }
    }
    if (idx === -1) return true;
    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) if (minMask & (1 << d)) digits.push(d);
    const order = shuffled(digits, rng);
    const r = rowOf(idx), c = colOf(idx), b = boxOf(idx);
    for (const d of order) {
      const bit = 1 << d;
      g[idx] = d;
      row[r] |= bit; col[c] |= bit; box[b] |= bit;
      if (rec()) return true;
      row[r] &= ~bit; col[c] &= ~bit; box[b] &= ~bit;
      g[idx] = 0;
    }
    return false;
  }
  return rec();
}

export function countSolutions(input: Grid, limit = 2): number {
  const g = input.slice();
  const { row, col, box } = computeMasks(g);
  let count = 0;
  function rec(): void {
    if (count >= limit) return;
    let idx = -1, minCount = 10, minMask = 0;
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const used = row[rowOf(i)] | col[colOf(i)] | box[boxOf(i)];
      const avail = (~used) & 0x3fe;
      let cnt = 0, m = avail;
      while (m) { m &= m - 1; cnt++; }
      if (cnt === 0) return;
      if (cnt < minCount) { minCount = cnt; idx = i; minMask = avail; if (cnt === 1) break; }
    }
    if (idx === -1) { count++; return; }
    const r = rowOf(idx), c = colOf(idx), b = boxOf(idx);
    for (let d = 1; d <= 9; d++) {
      if (!(minMask & (1 << d))) continue;
      const bit = 1 << d;
      g[idx] = d;
      row[r] |= bit; col[c] |= bit; box[b] |= bit;
      rec();
      row[r] &= ~bit; col[c] &= ~bit; box[b] &= ~bit;
      g[idx] = 0;
      if (count >= limit) return;
    }
  }
  rec();
  return count;
}

const GRADE_CLUE_RANGE: Record<Grade, [number, number]> = {
  kids: [32, 40],
  gentle: [32, 40],
  moderate: [28, 32],
  tough: [25, 28],
  diabolical: [22, 25],
  extreme: [22, 25],
};

const MIN_CLUES = 20;
const MAX_CLUES = 30;
const BELL_CENTER = 27;
const MAX_GENERATE_ATTEMPTS = 40;

function clampToBell(lo: number, hi: number, rng: Rng): number {
  // Gaussian-ish draw centered on BELL_CENTER, clamped to [max(lo, MIN_CLUES), min(hi, MAX_CLUES)].
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const raw = BELL_CENTER + z * 3; // sigma ~3
  const actualLo = Math.max(lo, MIN_CLUES);
  const actualHi = Math.min(hi, MAX_CLUES);
  const safeLo = Math.min(actualLo, actualHi);
  const safeHi = Math.max(actualLo, actualHi);
  const clamped = Math.max(safeLo, Math.min(safeHi, Math.round(raw)));
  return clamped;
}

function gradeDistance(a: Grade, b: Grade): number {
  return Math.abs(GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b));
}

function attemptMakePuzzle(
  full: Grid,
  targetClues: number,
  rng: Rng,
): Grid | null {
  const puzzle = full.slice();
  // Build a symmetric position order: pair (pos, 80 - pos), center cell (40) alone.
  const pairs: Array<[number, number]> = [];
  const singles: number[] = [];
  const seen = new Uint8Array(81);
  const order = shuffled(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );
  for (const pos of order) {
    if (seen[pos]) continue;
    const mirror = 80 - pos;
    seen[pos] = 1;
    if (mirror === pos) {
      singles.push(pos);
    } else if (!seen[mirror]) {
      seen[mirror] = 1;
      pairs.push([pos, mirror]);
    }
  }

  let clues = 81;

  // Phase 1: try to remove in symmetric pairs.
  for (const [a, b] of pairs) {
    if (clues <= targetClues) break;
    const savedA = puzzle[a];
    const savedB = puzzle[b];
    if (savedA === 0 && savedB === 0) continue;
    puzzle[a] = 0;
    puzzle[b] = 0;
    const removed = (savedA !== 0 ? 1 : 0) + (savedB !== 0 ? 1 : 0);
    if (clues - removed < targetClues) {
      puzzle[a] = savedA;
      puzzle[b] = savedB;
      continue;
    }
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[a] = savedA;
      puzzle[b] = savedB;
    } else {
      clues -= removed;
    }
  }

  // Phase 2: handle the central cell as a single if needed.
  if (clues > targetClues) {
    for (const pos of singles) {
      if (clues <= targetClues) break;
      const saved = puzzle[pos];
      if (saved === 0) continue;
      puzzle[pos] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[pos] = saved;
      } else {
        clues--;
      }
    }
  }

  // Phase 3: fall back to asymmetric single removals if still above target.
  if (clues > targetClues) {
    const fallback = shuffled(
      Array.from({ length: 81 }, (_, i) => i),
      rng,
    );
    for (const pos of fallback) {
      if (clues <= targetClues) break;
      const saved = puzzle[pos];
      if (saved === 0) continue;
      puzzle[pos] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[pos] = saved;
      } else {
        clues--;
      }
    }
  }

  if (clues > targetClues) {
    // Couldn't reach target without breaking uniqueness.
    return null;
  }
  return puzzle;
}

interface GradedPuzzle {
  puzzle: Grid;
  trace: SolveTrace;
  result: GradeResult;
}

function makePuzzleForGrade(
  full: Grid,
  targetGrade: Grade,
  rng: Rng,
): GradedPuzzle | null {
  const [minClues, maxClues] = GRADE_CLUE_RANGE[targetGrade];
  let best: GradedPuzzle | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
    const targetClues = clampToBell(minClues, maxClues, rng);
    const candidate = attemptMakePuzzle(full, targetClues, rng);
    if (!candidate) continue;

    const trace = solve(candidate);
    if (!trace.solved) continue;

    const result = gradeTrace(trace);
    if (!isSatisfyingPuzzle(trace)) continue;

    const distance = gradeDistance(result.grade, targetGrade);
    if (distance === 0) {
      return { puzzle: candidate, trace, result };
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { puzzle: candidate, trace, result };
      if (distance <= 1) {
        // Close enough — accept early but keep searching a little for perfect.
        if (attempt >= MAX_GENERATE_ATTEMPTS / 2) {
          return best;
        }
      }
    }
  }

  return best;
}

function seedDiagonal(g: Grid, rng: Rng) {
  for (let b = 0; b < 3; b++) {
    const nums = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    let k = 0;
    const br = b * 3, bc = b * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        g[rc(r, c)] = nums[k++];
  }
}

function gradeToLegacyDifficulty(g: Grade): Difficulty {
  switch (g) {
    case 'kids':
    case 'gentle':
      return 'easy';
    case 'moderate':
      return 'medium';
    case 'tough':
    case 'diabolical':
    case 'extreme':
      return 'hard';
    default:
      return 'medium';
  }
}

export function generate(grade: Grade, seedIn?: number): PuzzleData {
  const seed = seedIn ?? randomSeed();
  const rng = mulberry32(seed);
  const full = emptyGrid();
  seedDiagonal(full, rng);
  if (!fillGrid(full, rng)) {
    const f2 = emptyGrid();
    fillGrid(f2, mulberry32((seed ^ 0x9e3779b9) >>> 0));
    for (let i = 0; i < 81; i++) full[i] = f2[i];
  }

  const graded = makePuzzleForGrade(full, grade, rng);
  const resolvedGrade: Grade = graded?.result.grade ?? grade;
  const puzzle: Grid = graded?.puzzle ?? (() => {
    // Last-resort fallback: a very permissive single-removal pass on a copy.
    const p = full.slice();
    const [minClues, maxClues] = GRADE_CLUE_RANGE[grade];
    const target = Math.max(MIN_CLUES, Math.min(MAX_CLUES, Math.floor((minClues + maxClues) / 2)));
    const fb = attemptMakePuzzle(full, target, rng);
    if (fb) for (let i = 0; i < 81; i++) p[i] = fb[i];
    return p;
  })();
  const given = puzzle.map((v) => v !== 0);
  return {
    puzzle,
    solution: full,
    given,
    seed,
    difficulty: gradeToLegacyDifficulty(resolvedGrade),
    grade: resolvedGrade,
  };
}

export function findConflicts(user: Grid): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const v = user[i];
    if (v === 0) continue;
    const r = rowOf(i), c = colOf(i);
    for (let k = 0; k < 9; k++) {
      if (k !== c && user[rc(r, k)] === v) { set.add(i); set.add(rc(r, k)); }
      if (k !== r && user[rc(k, c)] === v) { set.add(i); set.add(rc(k, c)); }
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++)
      for (let cc = bc; cc < bc + 3; cc++) {
        const j = rc(rr, cc);
        if (j !== i && user[j] === v) { set.add(i); set.add(j); }
      }
  }
  return set;
}

export function isComplete(user: Grid, solution: Grid): boolean {
  for (let i = 0; i < 81; i++) if (user[i] !== solution[i]) return false;
  return true;
}

export function candidates(g: Grid, i: number): number[] {
  if (g[i] !== 0) return [];
  const r = rowOf(i), c = colOf(i);
  const used = new Set<number>();
  for (let k = 0; k < 9; k++) {
    used.add(g[rc(r, k)]);
    used.add(g[rc(k, c)]);
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++)
    for (let cc = bc; cc < bc + 3; cc++)
      used.add(g[rc(rr, cc)]);
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (!used.has(d)) out.push(d);
  return out;
}
