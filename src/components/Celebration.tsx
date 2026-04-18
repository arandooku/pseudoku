import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Trophy, Clock, Lightbulb, Flame, Zap, RotateCcw, Home as HomeIcon } from 'lucide-react';
import { useGame } from '../store/game';
import { DIFFICULTY_LABEL } from '../lib/types';

const COLORS = ['#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function useRamp(target: number, durationMs = 1400): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const pct = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - pct, 3);
      setV(Math.floor(target * eased));
      if (pct < 1) raf = requestAnimationFrame(step);
      else setV(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return v;
}

export default function Celebration() {
  const save = useGame((s) => s.save);
  const stats = useGame((s) => s.stats);
  const newGame = useGame((s) => s.newGame);
  const setScreen = useGame((s) => s.setScreen);

  const pieces = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 2.5,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
      })),
    [],
  );

  const targetScore = save?.score ?? 0;
  const rampedScore = useRamp(targetScore);

  if (!save) return null;
  const best = stats.bestMs[save.difficulty] ?? save.elapsedMs;
  const isNewBest = save.elapsedMs === best;
  const isNewHighScore = targetScore > 0 && targetScore === stats.bestScore[save.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-md"
      style={{ background: 'var(--overlay-tint)' }}
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
        initial={{ scale: 0.7, y: 40, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="relative glass rounded-3xl p-8 w-full max-w-sm text-center halo-pulse"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.2 }}
          className="mx-auto mb-2 h-16 w-16 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))', boxShadow: '0 0 40px var(--accent-glow)' }}
        >
          <Trophy size={32} className="text-white" />
        </motion.div>
        <h2 className="font-display text-4xl">Solved.</h2>
        <p className="text-muted-c text-sm mt-1">
          {DIFFICULTY_LABEL[save.difficulty]} · {save.mistakes === 0 ? 'flawless' : `${save.mistakes} mistake${save.mistakes > 1 ? 's' : ''}`}
        </p>

        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-c">Score</div>
          <div className="digit text-5xl font-semibold" style={{ color: isNewHighScore ? 'var(--accent-glow)' : 'var(--text-color)', textShadow: isNewHighScore ? '0 0 20px var(--accent-glow)' : 'none' }}>
            {rampedScore.toLocaleString()}
          </div>
          {isNewHighScore && (
            <div className="text-xs uppercase tracking-[0.3em] text-accent-glow-c animate-pulse mt-1">
              🏅 new high score
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-5">
          <Stat icon={<Clock size={12} />} label="Time" value={fmt(save.elapsedMs)} glow={isNewBest} />
          <Stat icon={<Zap size={12} />} label="Combo" value={`${save.bestCombo}x`} />
          <Stat icon={<Lightbulb size={12} />} label="Hints" value={String(save.hintsUsed)} />
          <Stat icon={<Flame size={12} />} label="Streak" value={`${stats.streakDays}d`} />
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => newGame(save.grade)}
            className="btn-press flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}
          >
            <RotateCcw size={16} /> Again
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen('home')}
            className="btn-press flex-1 py-3 rounded-xl bg-black/30 flex items-center justify-center gap-2"
          >
            <HomeIcon size={16} /> Home
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ icon, label, value, glow }: { icon: React.ReactNode; label: string; value: string; glow?: boolean }) {
  return (
    <div
      className="rounded-xl p-2"
      style={glow ? { background: 'rgba(var(--glass-rgb),0.5)', boxShadow: '0 0 0 1px var(--accent-glow)' } : { background: 'rgba(var(--glass-rgb),0.4)' }}
    >
      <div className="digit text-lg">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-c mt-0.5 flex items-center justify-center gap-1">
        {icon}{label}
      </div>
    </div>
  );
}
