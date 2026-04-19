import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { useGame } from './store/game';
import Home from './components/Home';
import Board from './components/Board';
import Keypad from './components/Keypad';
import Hud from './components/Hud';
import Celebration from './components/Celebration';
import FailScreen from './components/FailScreen';
import AchievementsView from './components/AchievementsView';
import AchievementToast from './components/AchievementToast';
import FX from './components/FX';
import TitleBg from './components/TitleBg';
import { applyTheme, loadTheme } from './lib/theme';

export default function App() {
  const screen = useGame((s) => s.screen);
  const save = useGame((s) => s.save);
  const failed = useGame((s) => s.failed);

  useEffect(() => { applyTheme(loadTheme()); }, []);

  useEffect(() => {
    if (screen !== 'play') return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const s = useGame.getState();
      if (!s.save || s.save.completed || s.failed) return;
      const now = performance.now();
      s.tick(now - last);
      last = now;
    }, 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center">
      {screen === 'home' && <TitleBg />}
      <div
        className="relative z-10 w-full max-w-[520px] flex flex-col flex-1"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <AnimatePresence mode="wait">
          {screen === 'home' && <Home key="home" />}
          {screen === 'achievements' && <AchievementsView key="ach" />}
          {screen === 'play' && (
            <div key="play" className="flex flex-col flex-1 px-3 gap-3">
              <Hud />
              <Board />
              <Keypad />
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {save?.completed && <Celebration key="win" />}
        {failed && !save?.completed && <FailScreen key="fail" />}
      </AnimatePresence>

      <FX />
      <AchievementToast />
      <Analytics />
    </main>
  );
}
