import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { THEMES, type ThemeId, applyTheme, loadTheme, saveTheme } from '../lib/theme';
import { sfx } from '../lib/sound';
import { haptic } from '../lib/haptic';

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState<ThemeId>(loadTheme());

  useEffect(() => {
    applyTheme(current);
    saveTheme(current);
  }, [current]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-c">Theme</div>
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => {
          const t = THEMES[id];
          const active = current === id;
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setCurrent(id); sfx.unlock(); haptic.soft(); }}
              className={`glass btn-press rounded-xl p-2 flex flex-col items-center gap-0.5 transition ${
                active ? 'ring-2 ring-offset-2 ring-offset-transparent halo-pulse' : 'opacity-70 hover:opacity-100'
              }`}
              style={active ? { borderColor: t.accent, '--tw-ring-color': t.accent } as React.CSSProperties : undefined}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
