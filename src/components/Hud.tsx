import { Heart, Clock, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/game';
import { DIFFICULTY_LABEL, DIFFICULTY_MAX_MISTAKES } from '../lib/types';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Hud() {
  const save = useGame((s) => s.save);
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

  if (!save) return null;
  const max = DIFFICULTY_MAX_MISTAKES[save.difficulty];
  const lives = max === Infinity ? null : Math.max(0, max - save.mistakes);

  return (
    <div className="flex items-center justify-between px-3 py-2 glass rounded-xl gap-3">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-c flex items-center gap-1">
          <Zap size={10} /> {DIFFICULTY_LABEL[save.difficulty]}
        </span>
        <span className={`digit text-base ${pulse ? 'num-tick' : ''}`}>{score.toLocaleString()}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-c flex items-center gap-1">
          <Clock size={10} /> Time
        </span>
        <span className="digit text-lg">{fmt(save.elapsedMs)}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-c flex items-center gap-1">
          <Heart size={10} /> Lives
        </span>
        {lives === null ? (
          <span className="text-lg leading-none opacity-70">∞</span>
        ) : (
          <div className="flex gap-1 mt-0.5">
            {Array.from({ length: max as number }).map((_, i) => (
              <Heart
                key={i}
                size={14}
                className="transition-all"
                fill={i < lives ? 'currentColor' : 'none'}
                style={{ color: i < lives ? 'var(--danger-c)' : 'rgba(148,163,184,0.25)', filter: i < lives ? 'drop-shadow(0 0 6px var(--danger-c))' : 'none' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
