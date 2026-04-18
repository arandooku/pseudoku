import type { Grid } from '../types';

const N = 9;
function rc(r: number, c: number): number { return r * N + c; }
function rowOf(i: number): number { return Math.floor(i / N); }
function colOf(i: number): number { return i % N; }
function boxOf(i: number): number {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
}

/**
 * Bitmask layout: bit d (for d in 1..9) represents digit d.
 * Bit 0 is unused so digits map directly to their bit index.
 */
export const ALL_DIGITS_MASK = 0x3fe; // bits 1..9

/** Cached peer sets. peersOf[i] = array of 20 peer cell indices for cell i. */
export const PEERS: ReadonlyArray<ReadonlyArray<number>> = (() => {
  const out: number[][] = [];
  for (let i = 0; i < 81; i++) {
    const r = rowOf(i);
    const c = colOf(i);
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    const set = new Set<number>();
    for (let k = 0; k < 9; k++) {
      set.add(rc(r, k));
      set.add(rc(k, c));
    }
    for (let rr = br; rr < br + 3; rr++) {
      for (let cc = bc; cc < bc + 3; cc++) {
        set.add(rc(rr, cc));
      }
    }
    set.delete(i);
    out.push(Array.from(set).sort((a, b) => a - b));
  }
  return out;
})();

/** Units (rows, cols, boxes). Each is an array of 9 cell indices. 27 units total. */
export const ROWS: ReadonlyArray<ReadonlyArray<number>> = (() => {
  const out: number[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: number[] = [];
    for (let c = 0; c < 9; c++) row.push(rc(r, c));
    out.push(row);
  }
  return out;
})();

export const COLS: ReadonlyArray<ReadonlyArray<number>> = (() => {
  const out: number[][] = [];
  for (let c = 0; c < 9; c++) {
    const col: number[] = [];
    for (let r = 0; r < 9; r++) col.push(rc(r, c));
    out.push(col);
  }
  return out;
})();

export const BOXES: ReadonlyArray<ReadonlyArray<number>> = (() => {
  const out: number[][] = [];
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    const box: number[] = [];
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) box.push(rc(r, c));
    }
    out.push(box);
  }
  return out;
})();

export const ALL_UNITS: ReadonlyArray<ReadonlyArray<number>> = [...ROWS, ...COLS, ...BOXES];

/** Number of set bits in a 16-bit mask. */
export function popcount(mask: number): number {
  let m = mask & 0xffff;
  let count = 0;
  while (m) {
    m &= m - 1;
    count++;
  }
  return count;
}

/** Returns the digit (1..9) of the lowest set bit, or 0 if mask is empty. */
export function firstBit(mask: number): number {
  if (mask === 0) return 0;
  let d = 0;
  let m = mask;
  while ((m & 1) === 0) {
    m >>>= 1;
    d++;
  }
  return d;
}

/** Returns array of digits present in the mask (1..9). */
export function maskToDigits(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (mask & (1 << d)) out.push(d);
  }
  return out;
}

/** Returns true if cells a and b are peers (share row, col, or box). */
export function arePeers(a: number, b: number): boolean {
  if (a === b) return false;
  return rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b);
}

/**
 * Compute candidate bitmasks for every cell.
 * Solved cells get mask 0.
 */
export function computeCandidates(grid: Grid): Uint16Array {
  const cand = new Uint16Array(81);
  const rowUsed = new Uint16Array(9);
  const colUsed = new Uint16Array(9);
  const boxUsed = new Uint16Array(9);

  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v !== 0) {
      const bit = 1 << v;
      rowUsed[rowOf(i)] |= bit;
      colUsed[colOf(i)] |= bit;
      boxUsed[boxOf(i)] |= bit;
    }
  }

  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) {
      cand[i] = 0;
      continue;
    }
    const used = rowUsed[rowOf(i)] | colUsed[colOf(i)] | boxUsed[boxOf(i)];
    cand[i] = (~used) & ALL_DIGITS_MASK;
  }

  return cand;
}

/**
 * Mark a cell solved by removing the digit from peers' candidate masks.
 * Zeroes the solved cell's own mask.
 */
export function applySolved(cand: Uint16Array, cell: number, digit: number): void {
  const bitInv = ~(1 << digit);
  cand[cell] = 0;
  const peers = PEERS[cell];
  for (let k = 0; k < peers.length; k++) {
    cand[peers[k]] &= bitInv;
  }
}

/**
 * Remove a single digit from a single cell's candidates.
 * Returns true if the candidate set actually changed.
 */
export function applyElimination(cand: Uint16Array, cell: number, digit: number): boolean {
  const bit = 1 << digit;
  if ((cand[cell] & bit) === 0) return false;
  cand[cell] &= ~bit;
  return true;
}
