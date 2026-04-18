import { motion } from 'framer-motion';
import { useState } from 'react';
import { Play, Trophy, Flame, Award, Leaf, Waves, Swords, Trash2, Sparkles, Baby, Flame as FlameIcon, Skull } from 'lucide-react';
import { useGame } from '../store/game';
import { ACHIEVEMENTS } from '../lib/achievements';
import type { Grade } from '../lib/types';
import { GRADE_LABEL, gradeToDifficulty } from '../lib/types';
import ThemeSwitcher from './ThemeSwitcher';

interface GradeTile {
  id: Grade;
  accent: string;
  Icon: typeof Leaf;
}

const GRADES: GradeTile[] = [
  { id: 'kids',       accent: 'from-lime-300/80 to-emerald-400/70',   Icon: Baby },
  { id: 'gentle',     accent: 'from-emerald-400/80 to-teal-500/70',   Icon: Leaf },
  { id: 'moderate',   accent: 'from-sky-400/80 to-blue-500/70',       Icon: Waves },
  { id: 'tough',      accent: 'from-violet-400/80 to-fuchsia-500/70', Icon: Swords },
  { id: 'diabolical', accent: 'from-rose-400/80 to-orange-500/70',    Icon: FlameIcon },
  { id: 'extreme',    accent: 'from-fuchsia-500/80 to-red-600/70',    Icon: Skull },
];

function fmt(ms: number | null) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Home() {
  const save = useGame((s) => s.save);
  const stats = useGame((s) => s.stats);
  const unlocked = useGame((s) => s.unlocked);
  const newGame = useGame((s) => s.newGame);
  const resume = useGame((s) => s.resume);
  const setScreen = useGame((s) => s.setScreen);
  const purgeAll = useGame((s) => s.purgeAll);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const canResume = save && !save.completed;
  const totalSolved = stats.solved.easy + stats.solved.medium + stats.solved.hard;
  const resumeGradeLabel = save ? GRADE_LABEL[save.grade] : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1 px-4 py-3 gap-3 overflow-hidden"
    >
      <header className="flex items-end justify-between gap-2">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-accent-glow-c">
            <Sparkles size={10} /> daily logic
          </div>
          <motion.h1
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, letterSpacing: '-0.02em' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl font-semibold leading-none"
          >
            Pseud<span className="text-accent-c">ō</span>ku
          </motion.h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-c">
          <span className="flex items-center gap-1"><Trophy size={11} />{totalSolved}</span>
          <span className="flex items-center gap-1"><Flame size={11} />{stats.streakDays}d</span>
          <span className="flex items-center gap-1"><Award size={11} />{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>
      </header>

      {canResume && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={resume}
          className="btn-press relative overflow-hidden glass rounded-xl px-3 py-2 text-left halo-pulse flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Play size={14} fill="currentColor" className="text-accent-glow-c" />
            <div>
              <div className="text-[9px] uppercase tracking-widest text-accent-glow-c">Continue</div>
              <div className="font-display text-lg leading-none">{resumeGradeLabel}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-c tabular-nums">{fmt(save!.elapsedMs)}</div>
            <div className="text-[10px] text-muted-c">{save!.mistakes}✕</div>
          </div>
        </motion.button>
      )}

      <section className="grid grid-cols-2 gap-2">
        {GRADES.map((g, idx) => {
          const Icon = g.Icon;
          const diff = gradeToDifficulty(g.id);
          return (
            <motion.button
              key={g.id}
              onClick={() => newGame(g.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + idx * 0.04 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-xl px-3 py-2.5 text-left glass btn-press group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.accent} opacity-15 group-hover:opacity-25 transition-opacity`} />
              <div className="relative flex items-center gap-2">
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-black/20 flex items-center justify-center">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base leading-tight truncate">{GRADE_LABEL[g.id]}</div>
                  <div className="text-[10px] text-muted-c tabular-nums">best {fmt(stats.bestMs[diff])}</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </section>

      <ThemeSwitcher />

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={() => setScreen('achievements')}
          className="btn-press flex-1 glass rounded-lg py-2 text-[11px] uppercase tracking-widest flex items-center justify-center gap-1.5"
        >
          <Award size={12} /> Badges
        </button>
        {confirmPurge ? (
          <>
            <button
              onClick={() => { purgeAll(); setConfirmPurge(false); }}
              className="btn-press text-[11px] px-3 py-2 rounded-lg text-white uppercase tracking-widest"
              style={{ background: 'var(--danger-c)' }}
            >
              Purge
            </button>
            <button
              onClick={() => setConfirmPurge(false)}
              className="btn-press text-[11px] px-3 py-2 rounded-lg bg-black/30 uppercase tracking-widest"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmPurge(true)}
            className="btn-press glass rounded-lg py-2 px-3 text-[11px] uppercase tracking-widest text-muted-c hover:text-red-400 transition flex items-center gap-1.5"
            aria-label="Purge all data"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
