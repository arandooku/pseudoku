import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGame, computeConflicts } from '../store/game';
import Cell from './Cell';

export default function Board() {
  const save = useGame((s) => s.save);
  const selected = useGame((s) => s.selectedCell);
  const conflicts = useMemo(() => computeConflicts(save), [save]);

  if (!save) return null;

  const selectedValue = selected !== null ? save.user[selected] : 0;
  const selR = selected !== null ? Math.floor(selected / 9) : -1;
  const selC = selected !== null ? selected % 9 : -1;
  const selB = selected !== null ? Math.floor(selR / 3) * 3 + Math.floor(selC / 3) : -1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative aspect-square w-full mx-auto select-none board-fit"
      style={{ maxWidth: 'min(100%, calc(100dvh - 230px))' }}
    >
      <div className="absolute inset-0 rounded-2xl glass p-1 sm:p-1.5" data-board>
        <div className="grid grid-cols-9 grid-rows-9 gap-[1px] w-full h-full rounded-xl overflow-hidden" style={{ background: 'rgba(148,163,184,0.18)' }}>
          {Array.from({ length: 81 }, (_, i) => {
            const r = Math.floor(i / 9), c = i % 9;
            const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
            const v = save.user[i];
            const highlightPeer = selected !== null && (r === selR || c === selC || b === selB);
            const highlightSame = selectedValue !== 0 && v === selectedValue;
            return (
              <Cell
                key={i}
                index={i}
                value={v}
                given={save.given[i]}
                notes={save.notes[i]}
                selected={selected === i}
                peer={highlightPeer}
                sameDigit={highlightSame}
                conflict={conflicts.has(i)}
                solution={save.solution[i]}
              />
            );
          })}
        </div>
        <BoxBorders />
      </div>
    </motion.div>
  );
}

function BoxBorders() {
  return (
    <div className="pointer-events-none absolute inset-1.5 rounded-xl">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{ borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)' }} />
        ))}
      </div>
    </div>
  );
}
