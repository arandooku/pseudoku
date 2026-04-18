import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store/game';

interface Props {
  index: number;
  value: number;
  given: boolean;
  notes: number;
  selected: boolean;
  peer: boolean;
  sameDigit: boolean;
  conflict: boolean;
  solution: number;
}

function CellInner({ index, value, given, notes, selected, peer, sameDigit, conflict, solution }: Props) {
  const selectCell = useGame((s) => s.selectCell);
  const isWrong = value !== 0 && value !== solution && !given;
  const isRight = value !== 0 && value === solution && !given;
  const r = Math.floor(index / 9) + 1;
  const c = (index % 9) + 1;
  const label = `Row ${r} column ${c}${given ? `, given ${value}` : value ? `, ${value}` : ', empty'}`;

  const bg = selected
    ? 'bg-accent/30'
    : conflict || isWrong
      ? 'bg-danger/20'
      : sameDigit
        ? 'bg-accent/15'
        : peer
          ? 'bg-ink-800/80'
          : 'bg-ink-900/70';

  const textColor = given
    ? 'text-ink-100'
    : isWrong
      ? 'text-danger'
      : isRight
        ? 'text-accent-glow'
        : 'text-ink-200';

  return (
    <button
      onClick={() => selectCell(index)}
      className={`relative flex items-center justify-center transition-colors duration-150 btn-press ${bg}`}
      aria-label={label}
      aria-pressed={selected}
    >
      {value !== 0 ? (
        <motion.span
          key={value + (given ? 'g' : 'u')}
          initial={given ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className={`digit text-[min(5.5vw,2rem)] leading-none ${textColor} ${isWrong ? 'animate-shake' : ''}`}
        >
          {value}
        </motion.span>
      ) : notes ? (
        <div className="grid grid-cols-3 grid-rows-3 gap-px w-[85%] h-[85%] text-[min(2.2vw,0.7rem)] text-ink-400">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="flex items-center justify-center">
              {notes & (1 << (i + 1)) ? i + 1 : ''}
            </div>
          ))}
        </div>
      ) : null}
      {selected && (
        <span className="pointer-events-none absolute inset-0 rounded-sm ring-2 ring-accent-glow/80" />
      )}
    </button>
  );
}

export default memo(CellInner);
