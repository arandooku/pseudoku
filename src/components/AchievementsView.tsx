import { motion } from 'framer-motion';
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
      className="flex flex-col flex-1 px-5 py-6 gap-4"
    >
      <button onClick={() => setScreen('home')} className="text-sm text-ink-400 self-start">
        ← back
      </button>
      <header>
        <h2 className="font-display text-4xl">Badges</h2>
        <p className="text-ink-400 text-sm mt-1">
          {progress} unlocked · {stats.solved.easy + stats.solved.medium + stats.solved.hard} puzzles solved
        </p>
      </header>

      <div className="flex flex-col gap-2">
        {ACHIEVEMENTS.map((a, i) => {
          const has = unlocked.includes(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass rounded-xl p-3 flex items-center gap-3 ${has ? '' : 'opacity-50'}`}
            >
              <div className={`text-2xl ${has ? '' : 'grayscale'}`}>{has ? a.emoji : '🔒'}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-ink-400">{a.desc}</div>
              </div>
              {has && (
                <span className="text-[10px] uppercase tracking-widest text-accent-glow">Unlocked</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
