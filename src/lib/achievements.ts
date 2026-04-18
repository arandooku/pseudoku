import type { AchievementDef } from './types';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    desc: 'Solve your first puzzle',
    emoji: '🌱',
    check: (s) => s.solved.easy + s.solved.medium + s.solved.hard >= 1,
  },
  {
    id: 'zen_five',
    title: 'Zen Garden',
    desc: 'Win 5 Zen puzzles',
    emoji: '🍃',
    check: (s) => s.solved.easy >= 5,
  },
  {
    id: 'flow_state',
    title: 'Flow State',
    desc: 'Win 3 Flow puzzles',
    emoji: '🌊',
    check: (s) => s.solved.medium >= 3,
  },
  {
    id: 'crucible_forged',
    title: 'Forged in Fire',
    desc: 'Survive 1 Crucible',
    emoji: '🔥',
    check: (s) => s.solved.hard >= 1,
  },
  {
    id: 'flawless',
    title: 'Flawless',
    desc: 'Solve without mistakes',
    emoji: '💎',
    check: (_s, save) => !!save?.completed && save.mistakes === 0,
  },
  {
    id: 'no_help',
    title: 'Pure Mind',
    desc: 'Solve without hints',
    emoji: '🧠',
    check: (_s, save) => !!save?.completed && save.hintsUsed === 0,
  },
  {
    id: 'speed_easy',
    title: 'Quicksilver',
    desc: 'Finish Zen under 5 min',
    emoji: '⚡',
    check: (s) => (s.bestMs.easy ?? Infinity) <= 5 * 60_000,
  },
  {
    id: 'speed_hard',
    title: 'Crucible Sprinter',
    desc: 'Finish Crucible under 20 min',
    emoji: '🏆',
    check: (s) => (s.bestMs.hard ?? Infinity) <= 20 * 60_000,
  },
  {
    id: 'streak_3',
    title: 'Kindling',
    desc: '3-day streak',
    emoji: '🔥',
    check: (s) => s.streakDays >= 3,
  },
  {
    id: 'streak_7',
    title: 'Ablaze',
    desc: '7-day streak',
    emoji: '⚡',
    check: (s) => s.streakDays >= 7,
  },
  {
    id: 'hard_flawless',
    title: 'Iron Will',
    desc: 'Flawless Crucible win',
    emoji: '🛡️',
    check: (s) => s.hardWinsFlawless >= 1,
  },
  {
    id: 'marathon',
    title: 'Marathon',
    desc: 'Play 1 hour total',
    emoji: '⏱️',
    check: (s) => s.totalMsPlayed >= 60 * 60_000,
  },
  {
    id: 'combo_9',
    title: 'In The Zone',
    desc: 'Hit a 9× combo',
    emoji: '🎯',
    check: (s) => s.bestCombo >= 9,
  },
  {
    id: 'score_5000',
    title: 'Score Lord',
    desc: 'Break 5,000 in one run',
    emoji: '👑',
    check: (s) => Math.max(s.bestScore.easy, s.bestScore.medium, s.bestScore.hard) >= 5000,
  },
];

export function evaluate(
  unlocked: string[],
  stats: Parameters<AchievementDef['check']>[0],
  save: Parameters<AchievementDef['check']>[1],
): string[] {
  const newly: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.includes(a.id)) continue;
    if (a.check(stats, save)) newly.push(a.id);
  }
  return newly;
}
