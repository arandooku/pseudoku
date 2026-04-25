import { motion } from 'framer-motion';
import { ChevronLeft, Lock } from 'lucide-react';
import { useGame } from '../store/game';
import { ACHIEVEMENTS } from '../lib/achievements';

export default function AchievementsView() {
  const unlocked = useGame((s) => s.unlocked);
  const setScreen = useGame((s) => s.setScreen);
  const stats = useGame((s) => s.stats);

  const progress = `${unlocked.length}/${ACHIEVEMENTS.length}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-1 min-h-0 px-4 py-4 gap-3 overflow-y-auto"
    >
      <button
        onClick={() => setScreen('home')}
        className="btn-press text-sm text-muted-c self-start flex items-center gap-1 hover:text-white transition tap-target rounded-lg px-2 -ml-2"
      >
        <ChevronLeft size={18} /> Back
      </button>
      <header className="flex-shrink-0">
        <h2 className="font-display text-4xl">Badges</h2>
        <p className="text-muted-c text-sm mt-1">
          {progress} unlocked · {stats.solved.easy + stats.solved.medium + stats.solved.hard} puzzles solved
        </p>
      </header>

      <div className="flex flex-col gap-2 pb-2">
        {ACHIEVEMENTS.map((a, i) => {
          const has = unlocked.includes(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass rounded-xl p-3 flex items-center gap-3 transition-all ${has ? 'halo-pulse' : 'opacity-55'}`}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={has
                  ? { background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))', boxShadow: '0 0 14px rgba(139,92,246,0.5)' }
                  : { background: 'rgba(148,163,184,0.15)' }}
              >
                {has ? a.emoji : <Lock size={18} />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-c">{a.desc}</div>
              </div>
              {has && (
                <span className="text-[10px] uppercase tracking-widest text-accent-glow-c">Unlocked</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
