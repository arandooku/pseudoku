import { motion } from 'framer-motion';
import { useState } from 'react';
import { Play, Trophy, Flame, Award, Leaf, Waves, Swords, Trash2, ChevronRight, Sparkles, Baby, Flame as FlameIcon, Skull } from 'lucide-react';
import { useGame } from '../store/game';
import { ACHIEVEMENTS } from '../lib/achievements';
import type { Grade } from '../lib/types';
import { GRADE_LABEL, GRADE_MAX_MISTAKES, gradeToDifficulty } from '../lib/types';
import ThemeSwitcher from './ThemeSwitcher';

interface GradeTile {
  id: Grade;
  sub: string;
  accent: string;
  Icon: typeof Leaf;
}

const GRADES: GradeTile[] = [
  { id: 'kids',       sub: 'eyeballing only · playful intro',            accent: 'from-lime-300/80 to-emerald-400/70',   Icon: Baby },
  { id: 'gentle',     sub: 'slice & dice · calm start',                  accent: 'from-emerald-400/80 to-teal-500/70',   Icon: Leaf },
  { id: 'moderate',   sub: 'pairs & triples · steady logic',             accent: 'from-sky-400/80 to-blue-500/70',       Icon: Waves },
  { id: 'tough',      sub: 'intersections, X-wings · brain flex',        accent: 'from-violet-400/80 to-fuchsia-500/70', Icon: Swords },
  { id: 'diabolical', sub: 'chains, unique rectangles · fire required',  accent: 'from-rose-400/80 to-orange-500/70',    Icon: FlameIcon },
  { id: 'extreme',    sub: 'rare beasts · logic on the edge',            accent: 'from-fuchsia-500/80 to-red-600/70',    Icon: Skull },
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
      className="flex flex-col flex-1 px-5 py-6 gap-6"
    >
      <header className="flex flex-col items-start gap-1 mt-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-glow-c">
          <Sparkles size={12} /> daily logic
        </div>
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '-0.02em' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-6xl font-semibold leading-none"
        >
          Pseud<span className="text-accent-c">ō</span>ku
        </motion.h1>
        <p className="text-muted-c text-sm mt-1">Quiet the noise. Fill the grid.</p>
      </header>

      {canResume && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={resume}
          className="btn-press group relative overflow-hidden glass rounded-2xl p-4 text-left halo-pulse"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-accent-glow-c">
              <Play size={12} fill="currentColor" /> Continue
            </span>
            <span className="text-xs text-muted-c digit">{fmt(save!.elapsedMs)}</span>
          </div>
          <div className="mt-1 font-display text-2xl">{resumeGradeLabel}</div>
          <div className="text-xs text-muted-c mt-1">
            {save!.user.filter((v, i) => v !== 0 && !save!.given[i]).length} placed · {save!.mistakes} mistakes
          </div>
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 group-hover:animate-shine rounded-2xl pointer-events-none" />
        </motion.button>
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs uppercase tracking-[0.25em] text-muted-c">Choose a grade</h2>
        {GRADES.map((g, idx) => {
          const Icon = g.Icon;
          const diff = gradeToDifficulty(g.id);
          const maxMistakes = GRADE_MAX_MISTAKES[g.id];
          return (
            <motion.button
              key={g.id}
              onClick={() => newGame(g.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.05 }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-2xl p-4 text-left glass btn-press group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.accent} opacity-15 group-hover:opacity-25 transition-opacity`} />
              <div className="relative flex items-center gap-3">
                <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-black/20 flex items-center justify-center">
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-xl">{GRADE_LABEL[g.id]}</span>
                    <span className="text-xs text-muted-c digit">
                      best {fmt(stats.bestMs[diff])}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-c mt-0.5 truncate">{g.sub}</p>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-c">
                    {maxMistakes === Infinity ? '∞ lives' : `${maxMistakes} lives`}
                  </div>
                </div>
                <ChevronRight size={16} className="flex-shrink-0 opacity-40 group-hover:opacity-80 transition" />
              </div>
            </motion.button>
          );
        })}
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat icon={<Trophy size={14} />} label="Solved" value={totalSolved} />
        <Stat icon={<Flame size={14} />} label="Streak" value={`${stats.streakDays}d`} />
        <Stat icon={<Award size={14} />} label="Badges" value={`${unlocked.length}/${ACHIEVEMENTS.length}`} />
      </section>

      <ThemeSwitcher />

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setScreen('achievements')}
        className="btn-press glass rounded-xl py-3 px-4 text-sm tracking-wide flex items-center justify-between group"
      >
        <span className="flex items-center gap-2"><Award size={16} /> View achievements</span>
        <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition" />
      </motion.button>

      <div className="mt-auto pt-4 flex flex-col gap-2">
        {confirmPurge ? (
          <div className="glass rounded-xl p-3 flex items-center gap-2">
            <span className="text-xs text-muted-c flex-1">Erase all saves, stats &amp; badges?</span>
            <button
              onClick={() => { purgeAll(); setConfirmPurge(false); }}
              className="btn-press text-xs px-3 py-1.5 rounded-lg text-white"
              style={{ background: 'var(--danger-c)' }}
            >
              Purge
            </button>
            <button
              onClick={() => setConfirmPurge(false)}
              className="btn-press text-xs px-3 py-1.5 rounded-lg bg-black/20"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmPurge(true)}
            className="btn-press text-[11px] uppercase tracking-[0.25em] text-muted-c hover:text-red-400 transition py-2 flex items-center justify-center gap-1.5"
          >
            <Trash2 size={12} /> Purge all data
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="digit text-2xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-c mt-0.5 flex items-center justify-center gap-1">
        {icon} {label}
      </div>
    </div>
  );
}
