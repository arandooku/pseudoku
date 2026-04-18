import { useGame } from '../store/game';
import { DIFFICULTY_LABEL, DIFFICULTY_MAX_MISTAKES } from '../lib/types';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Hud() {
  const save = useGame((s) => s.save);
  if (!save) return null;
  const max = DIFFICULTY_MAX_MISTAKES[save.difficulty];
  const lives = max === Infinity ? null : Math.max(0, max - save.mistakes);

  return (
    <div className="flex items-center justify-between px-3 py-2 glass rounded-xl">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.25em] text-ink-400">Mode</span>
        <span className="font-display text-base">{DIFFICULTY_LABEL[save.difficulty]}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.25em] text-ink-400">Time</span>
        <span className="digit text-lg">{fmt(save.elapsedMs)}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-[0.25em] text-ink-400">Lives</span>
        {lives === null ? (
          <span className="text-ink-300 text-lg leading-none">∞</span>
        ) : (
          <div className="flex gap-1 mt-0.5">
            {Array.from({ length: max as number }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i < lives ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-ink-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
