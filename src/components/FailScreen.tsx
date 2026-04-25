import { motion } from 'framer-motion';
import { Heart, RotateCcw, Home as HomeIcon } from 'lucide-react';
import { useGame } from '../store/game';
import { DIFFICULTY_LABEL } from '../lib/types';

export default function FailScreen() {
  const save = useGame((s) => s.save);
  const newGame = useGame((s) => s.newGame);
  const setScreen = useGame((s) => s.setScreen);

  if (!save) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md"
      style={{
        background: 'var(--overlay-tint)',
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="relative glass rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
          className="mx-auto mb-3 h-16 w-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.2)', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}
        >
          <Heart size={28} style={{ color: 'var(--danger-c)' }} fill="currentColor" />
        </motion.div>
        <h2 className="font-display text-3xl">Out of lives.</h2>
        <p className="text-muted-c text-sm mt-2">
          {DIFFICULTY_LABEL[save.difficulty]} runs demand precision. Steady breath, try again.
        </p>
        <div className="flex gap-2 sm:gap-3 mt-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => newGame(save.grade)}
            className="btn-press flex-1 py-3.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 tap-target"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))' }}
          >
            <RotateCcw size={16} /> Retry
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen('home')}
            className="btn-press flex-1 py-3.5 rounded-xl bg-black/30 flex items-center justify-center gap-2 tap-target"
          >
            <HomeIcon size={16} /> Home
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
