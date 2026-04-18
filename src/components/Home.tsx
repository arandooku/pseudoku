import { motion } from 'framer-motion';
import { useState } from 'react';
import { useGame } from '../store/game';
import { ACHIEVEMENTS } from '../lib/achievements';
import type { Difficulty } from '../lib/types';
import { DIFFICULTY_LABEL, DIFFICULTY_MAX_MISTAKES } from '../lib/types';

const DIFFS: { id: Difficulty; sub: string; accent: string }[] = [
  { id: 'easy', sub: 'unlimited mistakes · chill solve', accent: 'from-emerald-400/80 to-teal-500/70' },
  { id: 'medium', sub: '5 mistakes · steady pace', accent: 'from-violet-400/80 to-fuchsia-500/70' },
  { id: 'hard', sub: '3 mistakes · high stakes', accent: 'from-rose-400/80 to-orange-500/70' },
];

function fmt(ms: number | null) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Home() {
  const save = useGame((s) => s.save);
  const stats = useGame((s) => s.stats);
  const unlocked = useGame((s) => s.unlocked);
  const newGame = useGame((s) => s.newGame);
  const resume = useGame((s) => s.resume);
  const setScreen = useGame((s) => s.setScreen);
  const purgeAll = useGame((s) => s.purgeAll);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const canResume = save && !save.completed;
  const totalSolved = stats.solved.easy + stats.solved.medium + stats.solved.hard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1 px-5 py-6 gap-6"
    >
      <header className="flex flex-col items-start gap-1 mt-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-glow/80">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-glow animate-pulse" /> daily logic
        </div>
        <h1 className="font-display text-5xl font-semibold leading-none">
          Pseud<span className="text-accent">ō</span>ku
        </h1>
        <p className="text-ink-400 text-sm mt-1">Quiet the noise. Fill the grid.</p>
      </header>

      {canResume && (
        <button
          onClick={resume}
          className="btn-press group relative overflow-hidden glass rounded-2xl p-4 text-left"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-widest text-accent-glow">Continue</span>
            <span className="text-xs text-ink-400">{fmt(save!.elapsedMs)}</span>
          </div>
          <div className="mt-1 font-display text-2xl">{DIFFICULTY_LABEL[save!.difficulty]}</div>
          <div className="text-xs text-ink-400 mt-1">
            {save!.user.filter((v, i) => v !== 0 && !save!.given[i]).length} placed · {save!.mistakes} mistakes
          </div>
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 group-hover:animate-shine rounded-2xl pointer-events-none" />
        </button>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-ink-400">Start fresh</h2>
        {DIFFS.map((d, idx) => (
          <motion.button
            key={d.id}
            onClick={() => newGame(d.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + idx * 0.05 }}
            whileTap={{ scale: 0.97 }}
            className="relative overflow-hidden rounded-2xl p-5 text-left glass btn-press"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${d.accent} opacity-15`} />
            <div className="relative flex items-baseline justify-between">
              <span className="font-display text-2xl">{DIFFICULTY_LABEL[d.id]}</span>
              <span className="text-xs text-ink-400 digit">
                best {fmt(stats.bestMs[d.id])}
              </span>
            </div>
            <p className="relative text-sm text-ink-300 mt-1">{d.sub}</p>
            <div className="relative mt-2 text-[11px] uppercase tracking-widest text-ink-400">
              {DIFFICULTY_MAX_MISTAKES[d.id] === Infinity
                ? '∞ lives'
                : `${DIFFICULTY_MAX_MISTAKES[d.id]} lives`} · {stats.solved[d.id]} solved
            </div>
          </motion.button>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Solved" value={totalSolved} />
        <Stat label="Streak" value={`${stats.streakDays}d`} />
        <Stat label="Badges" value={`${unlocked.length}/${ACHIEVEMENTS.length}`} />
      </section>

      <button
        onClick={() => setScreen('achievements')}
        className="btn-press glass rounded-xl py-3 text-sm tracking-wide hover:bg-ink-800/60 transition"
      >
        View achievements →
      </button>

      <div className="mt-auto pt-4 flex flex-col gap-2">
        {confirmPurge ? (
          <div className="glass rounded-xl p-3 flex items-center gap-2">
            <span className="text-xs text-ink-300 flex-1">Erase all saves, stats &amp; badges?</span>
            <button
              onClick={() => { purgeAll(); setConfirmPurge(false); }}
              className="btn-press text-xs px-3 py-1.5 rounded-lg bg-danger/80 hover:bg-danger text-white"
            >
              Purge
            </button>
            <button
              onClick={() => setConfirmPurge(false)}
              className="btn-press text-xs px-3 py-1.5 rounded-lg bg-ink-700/60 text-ink-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmPurge(true)}
            className="btn-press text-[11px] uppercase tracking-[0.25em] text-ink-500 hover:text-danger transition py-2"
          >
            Purge all data
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="digit text-2xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}
