import {
  STRATEGY_META,
  GRADE_THRESHOLDS,
  type Grade,
  type GradeResult,
  type SolveTrace,
  type StrategyId,
} from './solver/types';

const OPPORTUNITY_SCALE = 1.6;
const OPPORTUNITY_MIN = 0.6;
const OPPORTUNITY_MAX = 1.8;

const BOTTLENECK_HARD_COMPLEXITY = 5;
const BOTTLENECK_HARD_STEP_LIMIT = 2;
const BOTTLENECK_EASY_COMPLEXITY = 2;
const BOTTLENECK_EASY_SOLVE_RATIO = 0.7;

const FALLBACK_HARDEST: StrategyId = 'naked_single';

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function computeOpportunityMultiplier(roundCount: number, totalSolvedCells: number): number {
  if (totalSolvedCells <= 0 || roundCount <= 0) {
    return OPPORTUNITY_MIN;
  }
  const raw = (roundCount / totalSolvedCells) * OPPORTUNITY_SCALE;
  return clamp(raw, OPPORTUNITY_MIN, OPPORTUNITY_MAX);
}

function computeBaseScore(strategyCounts: Record<StrategyId, number>): number {
  let total = 0;
  for (const id of Object.keys(strategyCounts) as StrategyId[]) {
    const count = strategyCounts[id];
    if (!count) continue;
    const meta = STRATEGY_META[id];
    total += meta.weight * count;
  }
  return total;
}

function pickHardestStrategy(strategyCounts: Record<StrategyId, number>): StrategyId {
  let hardest: StrategyId | null = null;
  let bestComplexity = -1;
  let bestWeight = -1;
  for (const id of Object.keys(strategyCounts) as StrategyId[]) {
    const count = strategyCounts[id];
    if (!count) continue;
    const meta = STRATEGY_META[id];
    if (
      meta.complexity > bestComplexity ||
      (meta.complexity === bestComplexity && meta.weight > bestWeight)
    ) {
      hardest = meta.id;
      bestComplexity = meta.complexity;
      bestWeight = meta.weight;
    }
  }
  return hardest ?? FALLBACK_HARDEST;
}

function gradeForScore(score: number): Grade {
  let selected: Grade = GRADE_THRESHOLDS[0].grade;
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.minScore) {
      selected = threshold.grade;
    }
  }
  return selected;
}

function detectBottleneck(trace: SolveTrace): boolean {
  let hardStepCount = 0;
  let easySolveCount = 0;
  for (const step of trace.steps) {
    const meta = STRATEGY_META[step.strategy];
    const solvedHere = step.solved.length;
    if (meta.complexity >= BOTTLENECK_HARD_COMPLEXITY) {
      hardStepCount += 1;
    }
    if (meta.complexity <= BOTTLENECK_EASY_COMPLEXITY) {
      easySolveCount += solvedHere;
    }
  }

  if (hardStepCount === 0 || hardStepCount > BOTTLENECK_HARD_STEP_LIMIT) {
    return false;
  }
  if (trace.totalSolvedCells <= 0) {
    return false;
  }

  const easyRatio = easySolveCount / trace.totalSolvedCells;
  return easyRatio > BOTTLENECK_EASY_SOLVE_RATIO;
}

export function grade(trace: SolveTrace): GradeResult {
  if (!trace.solved) {
    return {
      grade: 'extreme',
      score: 0,
      opportunityRate: 0,
      hardestStrategy: pickHardestStrategy(trace.strategyCounts),
      bottleneck: true,
      strategyCounts: trace.strategyCounts,
    };
  }

  const multiplier = computeOpportunityMultiplier(trace.roundCount, trace.totalSolvedCells);
  const baseScore = computeBaseScore(trace.strategyCounts);
  const score = baseScore * multiplier;

  const opportunityRate =
    trace.roundCount > 0 ? trace.totalSolvedCells / trace.roundCount : 0;

  return {
    grade: gradeForScore(score),
    score,
    opportunityRate,
    hardestStrategy: pickHardestStrategy(trace.strategyCounts),
    bottleneck: detectBottleneck(trace),
    strategyCounts: trace.strategyCounts,
  };
}

interface GradeDescriptor {
  label: string;
  blurb: string;
  color: string;
}

const GRADE_DESCRIPTORS: Record<Grade, GradeDescriptor> = {
  kids: {
    label: 'Kids',
    blurb: 'A gentle warm-up - spot the lonely singles and cruise.',
    color: 'from-lime-300 to-emerald-400',
  },
  gentle: {
    label: 'Gentle',
    blurb: 'Relaxed solve - singles with a dash of pair-spotting.',
    color: 'from-emerald-400 to-teal-500',
  },
  moderate: {
    label: 'Moderate',
    blurb: 'A steady workout - pairs, triples, and locked candidates.',
    color: 'from-sky-400 to-blue-500',
  },
  tough: {
    label: 'Tough',
    blurb: 'Stretch your logic - expect quads and intersections.',
    color: 'from-indigo-500 to-violet-600',
  },
  diabolical: {
    label: 'Diabolical',
    blurb: 'Serious territory - X-Wings and Y-Wings await.',
    color: 'from-fuchsia-500 to-pink-600',
  },
  extreme: {
    label: 'Extreme',
    blurb: 'Only the bravest - Swordfish, chains, and unique rectangles.',
    color: 'from-rose-500 to-red-600',
  },
};

export function describeGrade(g: Grade): { label: string; blurb: string; color: string } {
  return GRADE_DESCRIPTORS[g];
}

export function isSatisfyingPuzzle(trace: SolveTrace): boolean {
  const result = grade(trace);
  return !result.bottleneck && trace.solved;
}
