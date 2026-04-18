import { mulberry32, shuffled, randomSeed, type Rng } from './rng';
import type { Difficulty, Grid, PuzzleData } from './types';
import { DIFFICULTY_CLUES } from './types';

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

function makePuzzle(full: Grid, difficulty: Difficulty, rng: Rng): Grid {
  const [minClues, maxClues] = DIFFICULTY_CLUES[difficulty];
  const targetClues = Math.floor(minClues + rng() * (maxClues - minClues + 1));
  const puzzle = full.slice();
  const positions = shuffled(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );
  let clues = 81;
  for (const pos of positions) {
    if (clues <= targetClues) break;
    const mirror = 80 - pos;
    const savedA = puzzle[pos];
    const savedB = puzzle[mirror];
    if (savedA === 0) continue;
    puzzle[pos] = 0;
    const removingMirror = mirror !== pos && savedB !== 0;
    if (removingMirror) puzzle[mirror] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[pos] = savedA;
      if (removingMirror) puzzle[mirror] = savedB;
    } else {
      clues--;
      if (removingMirror) clues--;
    }
  }
  return puzzle;
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

export function generate(difficulty: Difficulty, seedIn?: number): PuzzleData {
  const seed = seedIn ?? randomSeed();
  const rng = mulberry32(seed);
  const full = emptyGrid();
  seedDiagonal(full, rng);
  if (!fillGrid(full, rng)) {
    const f2 = emptyGrid();
    fillGrid(f2, mulberry32((seed ^ 0x9e3779b9) >>> 0));
    for (let i = 0; i < 81; i++) full[i] = f2[i];
  }
  const puzzle = makePuzzle(full, difficulty, rng);
  const given = puzzle.map((v) => v !== 0);
  return { puzzle, solution: full, given, seed, difficulty };
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
