import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useGame } from '../store/game';
import { ACHIEVEMENTS } from '../lib/achievements';
import { sfx } from '../lib/sound';

export default function AchievementToast() {
  const lastUnlock = useGame((s) => s.lastUnlock);
  const dismiss = useGame((s) => s.dismissToast);

  useEffect(() => {
    if (lastUnlock) {
      sfx.unlock();
      const id = window.setTimeout(dismiss, 4000);
      return () => window.clearTimeout(id);
    }
  }, [lastUnlock, dismiss]);

  const def = lastUnlock ? ACHIEVEMENTS.find((a) => a.id === lastUnlock) : null;

  return (
    <AnimatePresence>
      {def && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          style={{ top: 'max(env(safe-area-inset-top), 12px)' }}
        >
          <button
            onClick={dismiss}
            className="glass rounded-full pl-3 pr-4 py-2 flex items-center gap-3 shadow-xl shadow-accent/20 ring-1 ring-accent-glow/40"
          >
            <span className="text-xl">{def.emoji}</span>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-accent-glow">Achievement</div>
              <div className="text-sm font-medium">{def.title}</div>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
