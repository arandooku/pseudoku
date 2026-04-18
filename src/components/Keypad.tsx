import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store/game';

export default function Keypad() {
  const save = useGame((s) => s.save);
  const placeDigit = useGame((s) => s.placeDigit);
  const clearCell = useGame((s) => s.clearCell);
  const toggleNote = useGame((s) => s.toggleNote);
  const noteMode = useGame((s) => s.noteMode);
  const hint = useGame((s) => s.hint);
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const setScreen = useGame((s) => s.setScreen);

  const counts = useMemo(() => {
    const c = new Array(10).fill(0);
    if (!save) return c;
    for (let i = 0; i < 81; i++) c[save.user[i]]++;
    return c;
  }, [save]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') placeDigit(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') clearCell();
      else if (e.key === 'n' || e.key === 'N') toggleNote();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placeDigit, clearCell, toggleNote]);

  if (!save) return null;

  return (
    <div className="flex flex-col gap-2 px-1 pb-2">
      <div className="grid grid-cols-5 gap-2">
        <ActionBtn onClick={() => toggleNote()} active={noteMode} label="Notes" sub={noteMode ? 'on' : 'off'} />
        <ActionBtn onClick={clearCell} label="Erase" />
        <ActionBtn onClick={hint} label="Hint" sub={`used ${save.hintsUsed}`} />
        <ActionBtn onClick={toggleMute} label={muted ? 'Muted' : 'Sound'} />
        <ActionBtn onClick={() => setScreen('home')} label="Home" />
      </div>
      <div className="grid grid-cols-9 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => {
          const done = counts[d] >= 9;
          return (
            <motion.button
              key={d}
              whileTap={{ scale: 0.9 }}
              onClick={() => placeDigit(d)}
              disabled={done}
              className={`relative aspect-[3/4] rounded-xl glass btn-press flex flex-col items-center justify-center digit text-2xl ${
                done ? 'opacity-30' : 'hover:bg-ink-800/70'
              } ${noteMode ? 'ring-1 ring-accent/40' : ''}`}
            >
              <span>{d}</span>
              <span className="absolute bottom-1 text-[10px] text-ink-400 digit">{9 - counts[d]}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, label, sub, active }: { onClick: () => void; label: string; sub?: string; active?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`glass btn-press rounded-xl py-2 flex flex-col items-center justify-center gap-0.5 ${
        active ? 'bg-accent/25 ring-1 ring-accent' : ''
      }`}
    >
      <span className="text-xs font-medium">{label}</span>
      {sub && <span className="text-[9px] uppercase tracking-widest text-ink-400">{sub}</span>}
    </motion.button>
  );
}
