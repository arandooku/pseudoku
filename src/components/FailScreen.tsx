import { motion } from 'framer-motion';
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
      className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-ink-950/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="relative glass rounded-3xl p-8 w-full max-w-sm text-center"
      >
        <div className="text-5xl mb-2">💔</div>
        <h2 className="font-display text-3xl">Out of lives.</h2>
        <p className="text-ink-400 text-sm mt-2">
          {DIFFICULTY_LABEL[save.difficulty]} runs demand precision. Steady breath, try again.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => newGame(save.difficulty)}
            className="btn-press flex-1 py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-medium"
          >
            Retry
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
