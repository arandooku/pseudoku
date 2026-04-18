import type { Grid } from '../types';
import type { SolveStep, StrategyId } from './types';

const N_STRAT = 9;
function rowOf(i: number): number { return Math.floor(i / N_STRAT); }
function colOf(i: number): number { return i % N_STRAT; }
function boxOf(i: number): number {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
}
import {
  ALL_UNITS,
  BOXES,
  COLS,
  PEERS,
  ROWS,
  applyElimination,
  applySolved,
  arePeers,
  firstBit,
  maskToDigits,
  popcount,
} from './candidates';

type Unit = ReadonlyArray<number>;

interface StrategyEntry {
  id: StrategyId;
  fn: (grid: Grid, cand: Uint16Array) => SolveStep | null;
}

// ---------- helpers ----------

function cellName(i: number): string {
  return `R${rowOf(i) + 1}C${colOf(i) + 1}`;
}

function cellListName(cells: ReadonlyArray<number>): string {
  return cells.map(cellName).join(',');
}

function unitName(unit: Unit): string {
  const a = unit[0];
  const b = unit[1];
  if (rowOf(a) === rowOf(b)) return `row ${rowOf(a) + 1}`;
  if (colOf(a) === colOf(b)) return `col ${colOf(a) + 1}`;
  return `box ${boxOf(a) + 1}`;
}

/** Iterate every k-combination of indices 0..n-1. Emit returning true halts. */
function combinations(n: number, k: number, emit: (picks: number[]) => boolean | void): void {
  const idx = new Array<number>(k);
  function rec(start: number, depth: number): boolean {
    if (depth === k) {
      return emit(idx) === true;
    }
    for (let i = start; i <= n - (k - depth); i++) {
      idx[depth] = i;
      if (rec(i + 1, depth + 1)) return true;
    }
    return false;
  }
  rec(0, 0);
}

// ---------- naked single ----------

function nakedSingle(grid: Grid, cand: Uint16Array): SolveStep | null {
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const m = cand[i];
    if (popcount(m) === 1) {
      const digit = firstBit(m);
      grid[i] = digit;
      applySolved(cand, i, digit);
      return {
        strategy: 'naked_single',
        solved: [{ cell: i, digit }],
        eliminations: [],
        description: `Naked Single: ${cellName(i)} = ${digit}`,
        round: 0,
      };
    }
  }
  return null;
}

// ---------- hidden single ----------

function hiddenSingle(grid: Grid, cand: Uint16Array): SolveStep | null {
  for (let u = 0; u < ALL_UNITS.length; u++) {
    const unit = ALL_UNITS[u];
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      let foundCell = -1;
      let count = 0;
      let alreadyPlaced = false;
      for (let k = 0; k < unit.length; k++) {
        const c = unit[k];
        if (grid[c] === d) {
          alreadyPlaced = true;
          break;
        }
        if (grid[c] !== 0) continue;
        if (cand[c] & bit) {
          foundCell = c;
          count++;
          if (count > 1) break;
        }
      }
      if (alreadyPlaced) continue;
      if (count === 1 && foundCell !== -1) {
        grid[foundCell] = d;
        applySolved(cand, foundCell, d);
        return {
          strategy: 'hidden_single',
          solved: [{ cell: foundCell, digit: d }],
          eliminations: [],
          description: `Hidden Single: ${d} in ${unitName(unit)} only at ${cellName(foundCell)}`,
          round: 0,
        };
      }
    }
  }
  return null;
}

// ---------- naked subset (pair/triple/quad) ----------

function nakedSubset(
  grid: Grid,
  cand: Uint16Array,
  size: 2 | 3 | 4,
  strategyId: StrategyId,
  label: string,
): SolveStep | null {
  for (let u = 0; u < ALL_UNITS.length; u++) {
    const unit = ALL_UNITS[u];
    const emptyCells: number[] = [];
    for (let k = 0; k < unit.length; k++) {
      if (grid[unit[k]] === 0) emptyCells.push(unit[k]);
    }
    if (emptyCells.length <= size) continue;

    let found: SolveStep | null = null;
    combinations(emptyCells.length, size, (picks) => {
      let combined = 0;
      for (let p = 0; p < picks.length; p++) {
        combined |= cand[emptyCells[picks[p]]];
      }
      if (popcount(combined) !== size) return false;

      const pickedSet = new Set<number>();
      for (let p = 0; p < picks.length; p++) pickedSet.add(emptyCells[picks[p]]);

      const eliminations: Array<{ cell: number; digit: number }> = [];
      const digits = maskToDigits(combined);
      for (let k = 0; k < emptyCells.length; k++) {
        const c = emptyCells[k];
        if (pickedSet.has(c)) continue;
        for (const d of digits) {
          if (cand[c] & (1 << d)) {
            eliminations.push({ cell: c, digit: d });
          }
        }
      }
      if (eliminations.length === 0) return false;

      for (const elim of eliminations) {
        applyElimination(cand, elim.cell, elim.digit);
      }
      const pickedCells = picks.map((p) => emptyCells[p]);
      found = {
        strategy: strategyId,
        solved: [],
        eliminations,
        description: `${label}: {${digits.join(',')}} in ${unitName(unit)} at ${cellListName(pickedCells)}`,
        round: 0,
      };
      return true;
    });
    if (found) return found;
  }
  return null;
}

function nakedPair(grid: Grid, cand: Uint16Array): SolveStep | null {
  return nakedSubset(grid, cand, 2, 'naked_pair', 'Naked Pair');
}

function nakedTriple(grid: Grid, cand: Uint16Array): SolveStep | null {
  return nakedSubset(grid, cand, 3, 'naked_triple', 'Naked Triple');
}

function nakedQuad(grid: Grid, cand: Uint16Array): SolveStep | null {
  return nakedSubset(grid, cand, 4, 'naked_quad', 'Naked Quad');
}

// ---------- hidden subset (pair/triple/quad) ----------

function hiddenSubset(
  grid: Grid,
  cand: Uint16Array,
  size: 2 | 3 | 4,
  strategyId: StrategyId,
  label: string,
): SolveStep | null {
  for (let u = 0; u < ALL_UNITS.length; u++) {
    const unit = ALL_UNITS[u];
    const digitPositions: number[] = new Array(10).fill(0);
    const presentDigits: number[] = [];
    for (let d = 1; d <= 9; d++) {
      let mask = 0;
      let placed = false;
      for (let k = 0; k < unit.length; k++) {
        const c = unit[k];
        if (grid[c] === d) {
          placed = true;
          break;
        }
        if (grid[c] === 0 && cand[c] & (1 << d)) {
          mask |= 1 << k;
        }
      }
      if (placed || mask === 0) continue;
      digitPositions[d] = mask;
      presentDigits.push(d);
    }
    if (presentDigits.length < size) continue;

    let found: SolveStep | null = null;
    combinations(presentDigits.length, size, (picks) => {
      let combined = 0;
      for (let p = 0; p < picks.length; p++) {
        combined |= digitPositions[presentDigits[picks[p]]];
      }
      if (popcount(combined) !== size) return false;

      const pickedDigits = picks.map((p) => presentDigits[p]);
      const pickedDigitMask = pickedDigits.reduce((acc, d) => acc | (1 << d), 0);

      const eliminations: Array<{ cell: number; digit: number }> = [];
      for (let k = 0; k < unit.length; k++) {
        if ((combined & (1 << k)) === 0) continue;
        const c = unit[k];
        const extra = cand[c] & ~pickedDigitMask;
        if (extra === 0) continue;
        for (const d of maskToDigits(extra)) {
          eliminations.push({ cell: c, digit: d });
        }
      }
      if (eliminations.length === 0) return false;

      for (const elim of eliminations) {
        applyElimination(cand, elim.cell, elim.digit);
      }
      const pickedCells: number[] = [];
      for (let k = 0; k < unit.length; k++) {
        if (combined & (1 << k)) pickedCells.push(unit[k]);
      }
      found = {
        strategy: strategyId,
        solved: [],
        eliminations,
        description: `${label}: {${pickedDigits.join(',')}} in ${unitName(unit)} at ${cellListName(pickedCells)}`,
        round: 0,
      };
      return true;
    });
    if (found) return found;
  }
  return null;
}

function hiddenPair(grid: Grid, cand: Uint16Array): SolveStep | null {
  return hiddenSubset(grid, cand, 2, 'hidden_pair', 'Hidden Pair');
}

function hiddenTriple(grid: Grid, cand: Uint16Array): SolveStep | null {
  return hiddenSubset(grid, cand, 3, 'hidden_triple', 'Hidden Triple');
}

function hiddenQuad(grid: Grid, cand: Uint16Array): SolveStep | null {
  return hiddenSubset(grid, cand, 4, 'hidden_quad', 'Hidden Quad');
}

// ---------- pointing (box -> line) ----------

function pointing(grid: Grid, cand: Uint16Array): SolveStep | null {
  for (let b = 0; b < 9; b++) {
    const box = BOXES[b];
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      let placed = false;
      const cellsWithDigit: number[] = [];
      for (let k = 0; k < box.length; k++) {
        const c = box[k];
        if (grid[c] === d) {
          placed = true;
          break;
        }
        if (grid[c] === 0 && cand[c] & bit) cellsWithDigit.push(c);
      }
      if (placed || cellsWithDigit.length < 2) continue;

      const r0 = rowOf(cellsWithDigit[0]);
      const c0 = colOf(cellsWithDigit[0]);
      let sameRow = true;
      let sameCol = true;
      for (let k = 1; k < cellsWithDigit.length; k++) {
        if (rowOf(cellsWithDigit[k]) !== r0) sameRow = false;
        if (colOf(cellsWithDigit[k]) !== c0) sameCol = false;
      }

      if (sameRow) {
        const eliminations: Array<{ cell: number; digit: number }> = [];
        const row = ROWS[r0];
        for (let k = 0; k < row.length; k++) {
          const c = row[k];
          if (boxOf(c) === b) continue;
          if (grid[c] === 0 && cand[c] & bit) {
            eliminations.push({ cell: c, digit: d });
          }
        }
        if (eliminations.length > 0) {
          for (const e of eliminations) applyElimination(cand, e.cell, e.digit);
          return {
            strategy: 'pointing',
            solved: [],
            eliminations,
            description: `Pointing: ${d} in box ${b + 1} locked to row ${r0 + 1}`,
            round: 0,
          };
        }
      }
      if (sameCol) {
        const eliminations: Array<{ cell: number; digit: number }> = [];
        const col = COLS[c0];
        for (let k = 0; k < col.length; k++) {
          const c = col[k];
          if (boxOf(c) === b) continue;
          if (grid[c] === 0 && cand[c] & bit) {
            eliminations.push({ cell: c, digit: d });
          }
        }
        if (eliminations.length > 0) {
          for (const e of eliminations) applyElimination(cand, e.cell, e.digit);
          return {
            strategy: 'pointing',
            solved: [],
            eliminations,
            description: `Pointing: ${d} in box ${b + 1} locked to col ${c0 + 1}`,
            round: 0,
          };
        }
      }
    }
  }
  return null;
}

// ---------- box/line reduction (line -> box) ----------

function boxLineReduction(grid: Grid, cand: Uint16Array): SolveStep | null {
  const lines: Array<{ unit: Unit; kind: 'row' | 'col' }> = [];
  for (const r of ROWS) lines.push({ unit: r, kind: 'row' });
  for (const c of COLS) lines.push({ unit: c, kind: 'col' });

  for (const line of lines) {
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      let placed = false;
      const cellsWithDigit: number[] = [];
      for (let k = 0; k < line.unit.length; k++) {
        const c = line.unit[k];
        if (grid[c] === d) {
          placed = true;
          break;
        }
        if (grid[c] === 0 && cand[c] & bit) cellsWithDigit.push(c);
      }
      if (placed || cellsWithDigit.length < 2) continue;

      const b0 = boxOf(cellsWithDigit[0]);
      let sameBox = true;
      for (let k = 1; k < cellsWithDigit.length; k++) {
        if (boxOf(cellsWithDigit[k]) !== b0) {
          sameBox = false;
          break;
        }
      }
      if (!sameBox) continue;

      const box = BOXES[b0];
      const eliminations: Array<{ cell: number; digit: number }> = [];
      for (let k = 0; k < box.length; k++) {
        const c = box[k];
        if (line.kind === 'row' && rowOf(c) === rowOf(cellsWithDigit[0])) continue;
        if (line.kind === 'col' && colOf(c) === colOf(cellsWithDigit[0])) continue;
        if (grid[c] === 0 && cand[c] & bit) {
          eliminations.push({ cell: c, digit: d });
        }
      }
      if (eliminations.length === 0) continue;
      for (const e of eliminations) applyElimination(cand, e.cell, e.digit);
      const lineLabel =
        line.kind === 'row'
          ? `row ${rowOf(cellsWithDigit[0]) + 1}`
          : `col ${colOf(cellsWithDigit[0]) + 1}`;
      return {
        strategy: 'box_line',
        solved: [],
        eliminations,
        description: `Box/Line Reduction: ${d} in ${lineLabel} locked to box ${b0 + 1}`,
        round: 0,
      };
    }
  }
  return null;
}

// ---------- fish (X-Wing, Swordfish) ----------

function fish(
  grid: Grid,
  cand: Uint16Array,
  size: 2 | 3,
  strategyId: StrategyId,
  label: string,
): SolveStep | null {
  for (let orient = 0; orient < 2; orient++) {
    const base = orient === 0 ? ROWS : COLS;
    const cover = orient === 0 ? COLS : ROWS;
    const getCrossIndex = (cell: number): number => (orient === 0 ? colOf(cell) : rowOf(cell));

    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      const baseMasks: Array<{ lineIdx: number; mask: number }> = [];
      for (let li = 0; li < base.length; li++) {
        const line = base[li];
        let placed = false;
        let mask = 0;
        for (let k = 0; k < line.length; k++) {
          const c = line[k];
          if (grid[c] === d) {
            placed = true;
            break;
          }
          if (grid[c] === 0 && cand[c] & bit) {
            mask |= 1 << getCrossIndex(c);
          }
        }
        if (placed) continue;
        const cnt = popcount(mask);
        if (cnt >= 2 && cnt <= size) {
          baseMasks.push({ lineIdx: li, mask });
        }
      }
      if (baseMasks.length < size) continue;

      let found: SolveStep | null = null;
      combinations(baseMasks.length, size, (picks) => {
        let combined = 0;
        for (let p = 0; p < picks.length; p++) combined |= baseMasks[picks[p]].mask;
        if (popcount(combined) !== size) return false;

        const baseLineSet = new Set<number>();
        for (let p = 0; p < picks.length; p++) baseLineSet.add(baseMasks[picks[p]].lineIdx);

        const coverIndices: number[] = [];
        for (let i = 0; i < 9; i++) if (combined & (1 << i)) coverIndices.push(i);

        const eliminations: Array<{ cell: number; digit: number }> = [];
        for (const ci of coverIndices) {
          const coverLine = cover[ci];
          for (let k = 0; k < coverLine.length; k++) {
            const c = coverLine[k];
            const baseIdx = orient === 0 ? rowOf(c) : colOf(c);
            if (baseLineSet.has(baseIdx)) continue;
            if (grid[c] === 0 && cand[c] & bit) {
              eliminations.push({ cell: c, digit: d });
            }
          }
        }
        if (eliminations.length === 0) return false;
        for (const e of eliminations) applyElimination(cand, e.cell, e.digit);
        const baseKind = orient === 0 ? 'rows' : 'cols';
        const baseList = picks.map((p) => baseMasks[p].lineIdx + 1).join(',');
        found = {
          strategy: strategyId,
          solved: [],
          eliminations,
          description: `${label}: digit ${d} in ${baseKind} ${baseList}`,
          round: 0,
        };
        return true;
      });
      if (found) return found;
    }
  }
  return null;
}

function xWing(grid: Grid, cand: Uint16Array): SolveStep | null {
  return fish(grid, cand, 2, 'x_wing', 'X-Wing');
}

function swordfish(grid: Grid, cand: Uint16Array): SolveStep | null {
  return fish(grid, cand, 3, 'swordfish', 'Swordfish');
}

// ---------- Y-Wing ----------

function yWing(grid: Grid, cand: Uint16Array): SolveStep | null {
  const bivalue: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0 && popcount(cand[i]) === 2) bivalue.push(i);
  }
  if (bivalue.length < 3) return null;

  for (const pivot of bivalue) {
    const pivotMask = cand[pivot];
    const pivotDigits = maskToDigits(pivotMask);
    const X = pivotDigits[0];
    const Y = pivotDigits[1];

    const wingsX: number[] = [];
    const wingsY: number[] = [];
    for (const w of bivalue) {
      if (w === pivot) continue;
      if (!arePeers(pivot, w)) continue;
      const wm = cand[w];
      if (popcount(wm) !== 2) continue;
      if ((wm & pivotMask) === 1 << X) wingsX.push(w);
      else if ((wm & pivotMask) === 1 << Y) wingsY.push(w);
    }
    if (wingsX.length === 0 || wingsY.length === 0) continue;

    for (const wx of wingsX) {
      const zMaskX = cand[wx] & ~(1 << X);
      for (const wy of wingsY) {
        const zMaskY = cand[wy] & ~(1 << Y);
        if (zMaskX !== zMaskY) continue;
        const Z = firstBit(zMaskX);
        if (Z === X || Z === Y || Z === 0) continue;
        const eliminations: Array<{ cell: number; digit: number }> = [];
        const wxPeers = PEERS[wx];
        for (let k = 0; k < wxPeers.length; k++) {
          const c = wxPeers[k];
          if (c === pivot || c === wy) continue;
          if (grid[c] !== 0) continue;
          if (!arePeers(c, wy)) continue;
          if (cand[c] & (1 << Z)) {
            eliminations.push({ cell: c, digit: Z });
          }
        }
        if (eliminations.length === 0) continue;
        for (const e of eliminations) applyElimination(cand, e.cell, e.digit);
        return {
          strategy: 'y_wing',
          solved: [],
          eliminations,
          description: `Y-Wing: pivot ${cellName(pivot)}{${X},${Y}}, wings ${cellName(wx)}{${X},${Z}} and ${cellName(wy)}{${Y},${Z}} eliminate ${Z}`,
          round: 0,
        };
      }
    }
  }
  return null;
}

// ---------- Unique Rectangle (Type 1) ----------

function uniqueRectangle(grid: Grid, cand: Uint16Array): SolveStep | null {
  const byMask = new Map<number, number[]>();
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0 && popcount(cand[i]) === 2) {
      const m = cand[i];
      const arr = byMask.get(m);
      if (arr) arr.push(i);
      else byMask.set(m, [i]);
    }
  }

  for (const [mask, cells] of byMask) {
    if (cells.length < 3) continue;
    for (let a = 0; a < cells.length; a++) {
      for (let b = a + 1; b < cells.length; b++) {
        const ca = cells[a];
        const cb = cells[b];
        if (rowOf(ca) !== rowOf(cb) && colOf(ca) !== colOf(cb)) continue;
        for (let c = b + 1; c < cells.length; c++) {
          const cc = cells[c];
          const trios: Array<[number, number, number]> = [
            [ca, cb, cc],
            [ca, cc, cb],
            [cb, cc, ca],
          ];
          for (const [p1, p2, p3] of trios) {
            if (rowOf(p1) !== rowOf(p2) && colOf(p1) !== colOf(p2)) continue;
            let fourthRow: number;
            let fourthCol: number;
            if (rowOf(p1) === rowOf(p2)) {
              if (colOf(p3) === colOf(p1)) {
                fourthRow = rowOf(p3);
                fourthCol = colOf(p2);
              } else if (colOf(p3) === colOf(p2)) {
                fourthRow = rowOf(p3);
                fourthCol = colOf(p1);
              } else continue;
            } else {
              if (rowOf(p3) === rowOf(p1)) {
                fourthCol = colOf(p3);
                fourthRow = rowOf(p2);
              } else if (rowOf(p3) === rowOf(p2)) {
                fourthCol = colOf(p3);
                fourthRow = rowOf(p1);
              } else continue;
            }
            const fourth = fourthRow * 9 + fourthCol;
            if (fourth === p1 || fourth === p2 || fourth === p3) continue;
            if (grid[fourth] !== 0) continue;

            const boxSet = new Set<number>([boxOf(p1), boxOf(p2), boxOf(p3), boxOf(fourth)]);
            if (boxSet.size !== 2) continue;

            const fm = cand[fourth];
            if ((fm & mask) !== mask) continue;
            const extras = fm & ~mask;
            if (extras === 0) continue;

            const eliminations: Array<{ cell: number; digit: number }> = [];
            for (const d of maskToDigits(mask)) {
              eliminations.push({ cell: fourth, digit: d });
            }
            for (const e of eliminations) applyElimination(cand, e.cell, e.digit);
            const digits = maskToDigits(mask);
            return {
              strategy: 'unique_rectangle',
              solved: [],
              eliminations,
              description: `Unique Rectangle (Type 1): {${digits.join(',')}} in ${cellListName([p1, p2, p3])} forces removal from ${cellName(fourth)}`,
              round: 0,
            };
          }
        }
      }
    }
  }
  return null;
}

// ---------- strategy registry (easiest -> hardest) ----------

export const STRATEGIES: ReadonlyArray<StrategyEntry> = [
  { id: 'naked_single', fn: nakedSingle },
  { id: 'hidden_single', fn: hiddenSingle },
  { id: 'naked_pair', fn: nakedPair },
  { id: 'hidden_pair', fn: hiddenPair },
  { id: 'pointing', fn: pointing },
  { id: 'box_line', fn: boxLineReduction },
  { id: 'naked_triple', fn: nakedTriple },
  { id: 'hidden_triple', fn: hiddenTriple },
  { id: 'naked_quad', fn: nakedQuad },
  { id: 'hidden_quad', fn: hiddenQuad },
  { id: 'x_wing', fn: xWing },
  { id: 'y_wing', fn: yWing },
  { id: 'swordfish', fn: swordfish },
  { id: 'unique_rectangle', fn: uniqueRectangle },
];

export {
  nakedSingle,
  hiddenSingle,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  nakedQuad,
  hiddenQuad,
  pointing,
  boxLineReduction,
  xWing,
  yWing,
  swordfish,
  uniqueRectangle,
};
