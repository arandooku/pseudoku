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

  const bgStyle: React.CSSProperties = selected
    ? { background: 'var(--cell-bg-selected)' }
    : conflict || isWrong
      ? { background: 'rgba(239,68,68,0.2)' }
      : sameDigit
        ? { background: 'rgba(var(--glass-rgb),0.4)', boxShadow: 'inset 0 0 0 1px var(--accent)' }
        : peer
          ? { background: 'var(--cell-bg-peer)' }
          : { background: 'var(--cell-bg)' };

  const textStyle: React.CSSProperties = given
    ? { color: 'var(--text-color)' }
    : isWrong
      ? { color: 'var(--danger-c)' }
      : isRight
        ? { color: 'var(--accent-glow)' }
        : { color: 'var(--text-color)', opacity: 0.92 };

  return (
    <button
      onClick={() => selectCell(index)}
      style={bgStyle}
      className="relative flex items-center justify-center transition-colors duration-150 btn-press overflow-hidden"
      aria-label={label}
      aria-pressed={selected}
    >
      {value !== 0 ? (
        <motion.span
          key={value + (given ? 'g' : 'u')}
          initial={given ? false : { scale: 0.3, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 16 }}
          style={textStyle}
          className={`digit text-[min(5.5vw,2rem)] leading-none ${isWrong ? 'animate-shake' : ''}`}
        >
          {value}
        </motion.span>
      ) : notes ? (
        <div className="grid grid-cols-3 grid-rows-3 gap-px w-[85%] h-[85%] text-[min(2.2vw,0.7rem)] text-muted-c">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="flex items-center justify-center">
              {notes & (1 << (i + 1)) ? i + 1 : ''}
            </div>
          ))}
        </div>
      ) : null}
      {isRight && (
        <span key={`ring-${value}`} className="burst-ring" />
      )}
      {selected && (
        <span className="pointer-events-none absolute inset-0 rounded-sm" style={{ boxShadow: 'inset 0 0 0 2px var(--accent-glow)' }} />
      )}
    </button>
  );
}

export default memo(CellInner);
