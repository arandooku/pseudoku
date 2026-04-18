import type { Grid } from '../types';

export type StrategyId =
  | 'naked_single'
  | 'hidden_single'
  | 'naked_pair'
  | 'hidden_pair'
  | 'naked_triple'
  | 'hidden_triple'
  | 'naked_quad'
  | 'hidden_quad'
  | 'pointing'
  | 'box_line'
  | 'x_wing'
  | 'y_wing'
  | 'swordfish'
  | 'xy_chain'
  | 'unique_rectangle';

export interface StrategyMeta {
  id: StrategyId;
  label: string;
  weight: number;
  complexity: number;
}

export const STRATEGY_META: Record<StrategyId, StrategyMeta> = {
  naked_single:      { id: 'naked_single',      label: 'Naked Single',      weight: 1,    complexity: 1 },
  hidden_single:     { id: 'hidden_single',     label: 'Hidden Single',     weight: 2,    complexity: 1 },
  naked_pair:        { id: 'naked_pair',        label: 'Naked Pair',        weight: 10,   complexity: 2 },
  hidden_pair:       { id: 'hidden_pair',       label: 'Hidden Pair',       weight: 12,   complexity: 2 },
  naked_triple:      { id: 'naked_triple',      label: 'Naked Triple',      weight: 20,   complexity: 3 },
  hidden_triple:     { id: 'hidden_triple',     label: 'Hidden Triple',     weight: 25,   complexity: 3 },
  naked_quad:        { id: 'naked_quad',        label: 'Naked Quad',        weight: 35,   complexity: 4 },
  hidden_quad:       { id: 'hidden_quad',       label: 'Hidden Quad',       weight: 40,   complexity: 4 },
  pointing:          { id: 'pointing',          label: 'Pointing Pair',     weight: 15,   complexity: 2 },
  box_line:          { id: 'box_line',          label: 'Box/Line Reduction',weight: 18,   complexity: 2 },
  x_wing:            { id: 'x_wing',            label: 'X-Wing',            weight: 50,   complexity: 5 },
  y_wing:            { id: 'y_wing',            label: 'Y-Wing',            weight: 60,   complexity: 5 },
  swordfish:         { id: 'swordfish',         label: 'Swordfish',         weight: 80,   complexity: 6 },
  xy_chain:          { id: 'xy_chain',          label: 'XY-Chain',          weight: 120,  complexity: 7 },
  unique_rectangle:  { id: 'unique_rectangle',  label: 'Unique Rectangle',  weight: 90,   complexity: 6 },
};

export type Grade = 'kids' | 'gentle' | 'moderate' | 'tough' | 'diabolical' | 'extreme';

export const GRADE_LABEL: Record<Grade, string> = {
  kids: 'Kids',
  gentle: 'Gentle',
  moderate: 'Moderate',
  tough: 'Tough',
  diabolical: 'Diabolical',
  extreme: 'Extreme',
};

export const GRADE_ORDER: Grade[] = ['kids', 'gentle', 'moderate', 'tough', 'diabolical', 'extreme'];

export const GRADE_THRESHOLDS: Array<{ grade: Grade; minScore: number }> = [
  { grade: 'kids',       minScore: 0 },
  { grade: 'gentle',     minScore: 40 },
  { grade: 'moderate',   minScore: 120 },
  { grade: 'tough',      minScore: 260 },
  { grade: 'diabolical', minScore: 500 },
  { grade: 'extreme',    minScore: 900 },
];

export interface SolveStep {
  strategy: StrategyId;
  solved: Array<{ cell: number; digit: number }>;
  eliminations: Array<{ cell: number; digit: number }>;
  description: string;
  round: number;
}

export interface SolveTrace {
  steps: SolveStep[];
  solved: boolean;
  finalGrid: Grid;
  strategyCounts: Record<StrategyId, number>;
  roundCount: number;
  totalSolvedCells: number;
}

export interface GradeResult {
  grade: Grade;
  score: number;
  opportunityRate: number;
  hardestStrategy: StrategyId;
  bottleneck: boolean;
  strategyCounts: Record<StrategyId, number>;
}
