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
    <div className="flex flex-col gap-1.5 sm:gap-2 px-0.5 sm:px-1 pb-1">
      <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
        <ActionBtn onClick={() => toggleNote()} active={noteMode} icon={<Pencil size={18} />} label="Notes" />
        <ActionBtn onClick={autoPencil} active={autoPencilOn} icon={<Wand2 size={18} />} label="Auto" />
        <ActionBtn onClick={clearCell} icon={<Eraser size={18} />} label="Erase" />
        <ActionBtn onClick={hint} icon={<Lightbulb size={18} />} label="Hint" badge={save.hintsUsed > 0 ? String(save.hintsUsed) : undefined} />
        <ActionBtn onClick={toggleMute} icon={muted ? <VolumeX size={18} /> : <Volume2 size={18} />} label={muted ? 'Muted' : 'Sound'} />
        <ActionBtn onClick={() => setScreen('home')} icon={<HomeIcon size={18} />} label="Home" />
      </div>
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => {
          const done = counts[d] >= 9;
          const remaining = Math.max(0, 9 - counts[d]);
          return (
            <motion.button
              key={d}
              whileTap={{ scale: 0.88, rotate: -3 }}
              onClick={() => placeDigit(d)}
              disabled={done}
              aria-label={`Place ${d}`}
              className={`relative rounded-xl glass btn-press flex flex-col items-center justify-center font-sans font-semibold tabular-nums ${
                done ? 'opacity-30' : ''
              } ${noteMode ? 'ring-1 ring-accent-c' : ''}`}
              style={{
                minHeight: 'clamp(56px, 13vw, 76px)',
                boxShadow: noteMode ? '0 0 0 1px var(--accent)' : undefined,
              }}
            >
              <span className="text-[clamp(1.25rem,5.5vw,1.75rem)] leading-none">{d}</span>
              {!done && (
                <span className="absolute bottom-1 text-[9px] tabular-nums text-muted-c opacity-70">
                  {remaining}
                </span>
              )}
              {done && <span className="absolute inset-0 rounded-xl bg-[var(--accent)]/20 pointer-events-none" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, badge, active }: { onClick: () => void; icon: React.ReactNode; label: string; badge?: string; active?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className="glass btn-press rounded-xl flex flex-col items-center justify-center gap-0.5 relative"
      style={{
        minHeight: '52px',
        background: active ? 'rgba(var(--glass-rgb),0.85)' : undefined,
        boxShadow: active ? '0 0 0 1px var(--accent), 0 0 12px rgba(139,92,246,0.35)' : undefined,
      }}
    >
      <span style={{ color: active ? 'var(--accent-glow)' : 'currentColor' }}>{icon}</span>
      <span className="text-[10px] font-medium leading-none tracking-wide">{label}</span>
      {badge && (
        <span
          className="absolute top-1 right-1 text-[9px] tabular-nums px-1 rounded-full"
          style={{ background: 'var(--accent)', color: 'white', minWidth: '14px', textAlign: 'center', lineHeight: '14px' }}
        >
          {badge}
        </span>
      )}
      {active && <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full" style={{ background: 'var(--accent-glow)' }} />}
    </motion.button>
  );
}
