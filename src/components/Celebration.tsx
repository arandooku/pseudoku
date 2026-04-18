import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useGame } from '../store/game';
import { DIFFICULTY_LABEL } from '../lib/types';

const COLORS = ['#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Celebration() {
  const save = useGame((s) => s.save);
  const stats = useGame((s) => s.stats);
  const newGame = useGame((s) => s.newGame);
  const setScreen = useGame((s) => s.setScreen);

  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        dur: 2 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
      })),
    [],
  );

  if (!save) return null;
  const best = stats.bestMs[save.difficulty] ?? save.elapsedMs;
  const isNewBest = save.elapsedMs === best;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-ink-950/80 backdrop-blur-md"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              transform: `rotate(${p.rot}deg)`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="relative glass rounded-3xl p-8 w-full max-w-sm text-center"
      >
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="font-display text-3xl">Solved.</h2>
        <p className="text-ink-400 text-sm mt-1">
          {DIFFICULTY_LABEL[save.difficulty]} · {save.mistakes === 0 ? 'flawless' : `${save.mistakes} mistakes`}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Time" value={fmt(save.elapsedMs)} glow={isNewBest} />
          <Stat label="Hints" value={String(save.hintsUsed)} />
          <Stat label="Streak" value={`${stats.streakDays}d`} />
        </div>

        {isNewBest && (
          <div className="mt-4 text-xs uppercase tracking-[0.3em] text-accent-glow animate-pulse">
            ✨ new personal best
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => newGame(save.difficulty)}
            className="btn-press flex-1 py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-medium"
          >
            Again
          </button>
          <button
            onClick={() => setScreen('home')}
            className="btn-press flex-1 py-3 rounded-xl bg-ink-700/60 hover:bg-ink-700 text-ink-100"
          >
            Home
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, glow }: { label: string; value: string; glow?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${glow ? 'bg-accent/25 ring-1 ring-accent-glow' : 'bg-ink-800/60'}`}>
      <div className="digit text-xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}
