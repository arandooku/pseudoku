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
      className="flex flex-col flex-1 min-h-0 px-4 py-3 gap-3 overflow-y-auto"
    >
      <header className="flex items-end justify-between gap-2 flex-shrink-0">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-accent-glow-c">
            <Sparkles size={10} /> daily logic
          </div>
          <motion.h1
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, letterSpacing: '-0.02em' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl font-semibold leading-none"
          >
            Pseud<span className="text-accent-c">ō</span>ku
          </motion.h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-c flex-shrink-0">
          <span className="flex items-center gap-1"><Trophy size={11} />{totalSolved}</span>
          <span className="flex items-center gap-1"><Flame size={11} />{stats.streakDays}d</span>
          <span className="flex items-center gap-1"><Award size={11} />{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>
      </header>

      {canResume && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={resume}
          className="btn-press relative overflow-hidden glass rounded-2xl px-4 py-3 text-left halo-pulse flex items-center justify-between flex-shrink-0"
          style={{ minHeight: '64px' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}
            >
              <Play size={16} fill="currentColor" className="text-white ml-0.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-accent-glow-c">Continue</div>
              <div className="font-display text-xl leading-tight">{resumeGradeLabel}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="digit text-base text-white tabular-nums">{fmt(save!.elapsedMs)}</div>
            <div className="text-[10px] text-muted-c">{save!.mistakes}✕</div>
          </div>
        </motion.button>
      )}

      <section className="grid grid-cols-2 gap-2 flex-shrink-0">
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
              className="relative overflow-hidden rounded-2xl px-3 py-3 text-left glass btn-press group"
              style={{ minHeight: '64px' }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.accent} opacity-20 group-active:opacity-35 transition-opacity`} />
              <div className="relative flex items-center gap-2">
                <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-black/25 flex items-center justify-center">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[15px] sm:text-lg leading-tight truncate">{GRADE_LABEL[g.id]}</div>
                  <div className="text-[10px] text-muted-c tabular-nums">best {fmt(stats.bestMs[diff])}</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </section>

      <ThemeSwitcher />

      <div className="mt-auto flex items-center gap-2 flex-shrink-0 pt-1">
        <button
          onClick={() => setScreen('achievements')}
          className="btn-press flex-1 glass rounded-xl py-3 text-[11px] uppercase tracking-widest flex items-center justify-center gap-1.5 tap-target"
        >
          <Award size={14} /> Badges
        </button>
        {confirmPurge ? (
          <>
            <button
              onClick={() => { purgeAll(); setConfirmPurge(false); }}
              className="btn-press text-[11px] px-4 py-3 rounded-xl text-white uppercase tracking-widest tap-target"
              style={{ background: 'var(--danger-c)' }}
            >
              Purge
            </button>
            <button
              onClick={() => setConfirmPurge(false)}
              className="btn-press text-[11px] px-4 py-3 rounded-xl bg-black/30 uppercase tracking-widest tap-target"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmPurge(true)}
            className="btn-press glass rounded-xl py-3 px-4 text-[11px] uppercase tracking-widest text-muted-c hover:text-red-400 transition flex items-center gap-1.5 tap-target"
            aria-label="Purge all data"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
