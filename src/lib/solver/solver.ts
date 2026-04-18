import type { Grid } from '../types';
import type { SolveStep, SolveTrace, StrategyId } from './types';
import { STRATEGY_META } from './types';
import { computeCandidates } from './candidates';
import { STRATEGIES } from './strategies';

function emptyStrategyCounts(): Record<StrategyId, number> {
  const out = {} as Record<StrategyId, number>;
  for (const id of Object.keys(STRATEGY_META) as StrategyId[]) {
    out[id] = 0;
  }
  return out;
}

function countGivens(grid: Grid): number {
  let count = 0;
  for (let i = 0; i < 81; i++) if (grid[i] !== 0) count++;
  return count;
}

function isSolved(grid: Grid): boolean {
  for (let i = 0; i < 81; i++) if (grid[i] === 0) return false;
  return true;
}

/**
 * Run logical strategies on a Sudoku puzzle, recording every deduction.
 * Never guesses. The input puzzle is not mutated.
 */
export function solve(puzzle: Grid): SolveTrace {
  const grid: Grid = puzzle.slice();
  const cand = computeCandidates(grid);

  const steps: SolveStep[] = [];
  const strategyCounts = emptyStrategyCounts();
  const givens = countGivens(puzzle);
  let round = 0;

  // Each time a strategy fires, it opens a new round. Rounds measure the number
  // of distinct strategy applications needed to solve — per Stuart, low round
  // counts mean many parallel opportunities (easier); high rounds = bottlenecks.
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let s = 0; s < STRATEGIES.length; s++) {
      const strategy = STRATEGIES[s];
      const step = strategy.fn(grid, cand);
      if (!step) continue;

      round++;
      const stamped: SolveStep = { ...step, round };
      steps.push(stamped);
      strategyCounts[step.strategy] = (strategyCounts[step.strategy] ?? 0) + 1;

      if (isSolved(grid)) {
        return {
          steps,
          solved: true,
          finalGrid: grid,
          strategyCounts,
          roundCount: round,
          totalSolvedCells: 81 - givens,
        };
      }
      progressed = true;
      break; // restart from easiest strategy
    }
  }

  return {
    steps,
    solved: isSolved(grid),
    finalGrid: grid,
    strategyCounts,
    roundCount: round,
    totalSolvedCells: 81 - givens,
  };
}

/** Returns true iff logical strategies alone fully solve the puzzle. */
export function quickSolveCheck(puzzle: Grid): boolean {
  const grid: Grid = puzzle.slice();
  const cand = computeCandidates(grid);

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let s = 0; s < STRATEGIES.length; s++) {
      const step = STRATEGIES[s].fn(grid, cand);
      if (step) {
        progressed = true;
        if (isSolved(grid)) return true;
        break;
      }
    }
  }
  return isSolved(grid);
}
