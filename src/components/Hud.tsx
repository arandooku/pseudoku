import { Heart, Clock, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../store/game';
import { GRADE_LABEL, GRADE_MAX_MISTAKES } from '../lib/types';
import { describeGrade } from '../lib/grader';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Hud() {
  const save = useGame((s) => s.save);
  const hintMessage = useGame((s) => s.hintMessage);
  const dismissHint = useGame((s) => s.dismissHint);
  const score = save?.score ?? 0;
  const [pulse, setPulse] = useState(false);
  const prevScore = useRef(score);
  useEffect(() => {
    if (score !== prevScore.current) {
      setPulse(true);
      prevScore.current = score;
      const id = window.setTimeout(() => setPulse(false), 300);
      return () => window.clearTimeout(id);
    }
  }, [score]);

  useEffect(() => {
    if (!hintMessage) return;
    const id = window.setTimeout(() => dismissHint(), 3200);
    return () => window.clearTimeout(id);
  }, [hintMessage, dismissHint]);

  if (!save) return null;
  const max = GRADE_MAX_MISTAKES[save.grade];
  const lives = max === Infinity ? null : Math.max(0, max - save.mistakes);
  const gradeInfo = describeGrade(save.grade);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 items-center px-3 py-2 glass rounded-xl gap-2">
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[9px] uppercase tracking-[0.25em] text-muted-c flex items-center gap-1 truncate">
            <Zap size={10} className="flex-shrink-0" /> {GRADE_LABEL[save.grade]}
          </span>
          <span className={`digit text-base sm:text-lg ${pulse ? 'num-tick' : ''}`}>{score.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-[0.25em] text-muted-c flex items-center gap-1">
            <Clock size={10} /> Time
          </span>
          <span className="digit text-lg sm:text-xl tabular-nums">{fmt(save.elapsedMs)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-[0.25em] text-muted-c flex items-center gap-1">
            <Heart size={10} /> Lives
          </span>
          {lives === null ? (
            <span className="text-lg leading-none opacity-70">∞</span>
          ) : (
            <div className="flex gap-0.5 sm:gap-1 mt-0.5">
              {Array.from({ length: max as number }).map((_, i) => (
                <Heart
                  key={i}
                  size={13}
                  className="transition-all"
                  fill={i < lives ? 'currentColor' : 'none'}
                  style={{ color: i < lives ? 'var(--danger-c)' : 'rgba(148,163,184,0.25)', filter: i < lives ? 'drop-shadow(0 0 6px var(--danger-c))' : 'none' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {hintMessage && (
          <motion.div
            key={hintMessage}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={dismissHint}
            className={`glass rounded-xl px-3 py-2 text-xs tracking-wide flex items-center gap-2 cursor-pointer bg-gradient-to-r ${gradeInfo.color} text-white/95`}
          >
            <span className="font-semibold uppercase tracking-widest text-[10px] opacity-80">Hint</span>
            <span className="digit">{hintMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
