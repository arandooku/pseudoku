import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Lightbulb, Volume2, VolumeX, Home as HomeIcon, Wand2 } from 'lucide-react';
import { useGame } from '../store/game';

export default function Keypad() {
  const save = useGame((s) => s.save);
  const placeDigit = useGame((s) => s.placeDigit);
  const clearCell = useGame((s) => s.clearCell);
  const toggleNote = useGame((s) => s.toggleNote);
  const noteMode = useGame((s) => s.noteMode);
  const hint = useGame((s) => s.hint);
  const autoPencil = useGame((s) => s.autoPencil);
  const autoPencilOn = useGame((s) => s.autoPencilOn);
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
    if (!save) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') placeDigit(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') clearCell();
      else if (e.key === 'n' || e.key === 'N') toggleNote();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, placeDigit, clearCell, toggleNote]);

  if (!save) return null;

  return (
    <div className="flex flex-col gap-2 px-1 pb-2">
      <div className="grid grid-cols-6 gap-1.5">
        <ActionBtn onClick={() => toggleNote()} active={noteMode} icon={<Pencil size={16} />} label="Notes" sub={noteMode ? 'on' : 'off'} />
        <ActionBtn onClick={autoPencil} active={autoPencilOn} icon={<Wand2 size={16} />} label="Auto" sub={autoPencilOn ? 'on' : 'off'} />
        <ActionBtn onClick={clearCell} icon={<Eraser size={16} />} label="Erase" />
        <ActionBtn onClick={hint} icon={<Lightbulb size={16} />} label="Hint" sub={`used ${save.hintsUsed}`} />
        <ActionBtn onClick={toggleMute} icon={muted ? <VolumeX size={16} /> : <Volume2 size={16} />} label={muted ? 'Muted' : 'Sound'} />
        <ActionBtn onClick={() => setScreen('home')} icon={<HomeIcon size={16} />} label="Home" />
      </div>
      <div className="grid grid-cols-9 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => {
          const done = counts[d] >= 9;
          return (
            <motion.button
              key={d}
              whileTap={{ scale: 0.85, rotate: -4 }}
              whileHover={done ? {} : { scale: 1.05, y: -2 }}
              onClick={() => placeDigit(d)}
              disabled={done}
              className={`relative aspect-[3/4] rounded-xl glass btn-press flex flex-col items-center justify-center font-sans font-semibold text-2xl tabular-nums ${
                done ? 'opacity-30' : ''
              } ${noteMode ? 'ring-1 ring-accent-c' : ''}`}
              style={noteMode ? { boxShadow: '0 0 0 1px var(--accent)' } : undefined}
            >
              <span>{d}</span>
              <span className="absolute bottom-1 text-[10px] font-normal text-muted-c tabular-nums">{9 - counts[d]}</span>
              {done && <span className="absolute inset-0 rounded-xl bg-[var(--accent)]/20 pointer-events-none" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, sub, active }: { onClick: () => void; icon: React.ReactNode; label: string; sub?: string; active?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className={`glass btn-press rounded-xl py-2 flex flex-col items-center justify-center gap-0.5 ${
        active ? 'halo-pulse' : ''
      }`}
      style={active ? { background: 'rgba(var(--glass-rgb),0.8)', boxShadow: '0 0 0 1px var(--accent), 0 0 14px rgba(139,92,246,0.4)' } : undefined}
    >
      <span style={{ color: active ? 'var(--accent-glow)' : 'currentColor' }}>{icon}</span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
      {sub && <span className="text-[8px] uppercase tracking-widest text-muted-c">{sub}</span>}
    </motion.button>
  );
}
