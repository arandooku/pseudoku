<!-- Generated: 2026-04-25 | Files scanned: 14 | Token estimate: ~900 -->

# Frontend

## Entry
`index.html` → `src/main.tsx` (StrictMode) → `src/App.tsx`.

## Screen Routing
zustand `useGame.screen`: `'home' | 'play' | 'achievements'`. No react-router. `App.tsx` switches via `<AnimatePresence>`.

## Component Tree
```
App                                       src/App.tsx
├─ TitleBg               (home only)      src/components/TitleBg.tsx
├─ Home                  screen=home      src/components/Home.tsx
│  └─ ThemeSwitcher                       src/components/ThemeSwitcher.tsx
├─ AchievementsView      screen=ach       src/components/AchievementsView.tsx
├─ Play                  screen=play
│  ├─ Hud                                 src/components/Hud.tsx
│  ├─ Board                               src/components/Board.tsx
│  │  └─ Cell × 81                        src/components/Cell.tsx
│  └─ Keypad                              src/components/Keypad.tsx
├─ Celebration           save.completed   src/components/Celebration.tsx
├─ FailScreen            failed           src/components/FailScreen.tsx
├─ FX                    fx queue         src/components/FX.tsx
├─ AchievementToast      lastUnlock       src/components/AchievementToast.tsx
└─ <Analytics/>          @vercel/analytics
```

## State (zustand `useGame`)
File: `src/store/game.ts` (575 lines).

Slices:
- `screen`, `selectedCell`, `noteMode`, `failed`, `muted`, `autoPencilOn`, `hintMessage`, `lastUnlock`, `fx[]`.
- `save: SaveState | null` — active puzzle (puzzle/solution/given/user/notes/mistakes/elapsedMs/grade/score/combo).
- `stats: Stats` — aggregate solved/bestMs/bestScore/streak/totals.
- `unlocked: string[]` — achievement IDs.

Actions:
- `newGame(grade)` → `sudoku.generate` → reset save, screen='play'.
- `resume()` → load `pseudoku:save` if not completed.
- `placeDigit(d)`, `clearCell()`, `toggleNote()` — board mutations + scoring + FX emission.
- `hint()` → `solver.solve` first deduction OR fallback reveal of a wrong cell.
- `autoPencil()` → toggle auto-notes (recompute via `computeAutoNotes`).
- `tick(deltaMs)` — 1s interval in App.tsx; throttled save every 5s.
- `purgeAll()` — wipe all 3 localStorage keys.

## Scoring
- Correct: `+20 + min(combo,9)*5`; wrong: `-25`, combo→0.
- Unit (row/col/box) completion bonus: `+150` each.
- Win bonus: `speedBonus = max(0, 1000 - sec*2) * diffMul`; `flawless: 500*mul`; `noHints: 300*mul`. `diffMul`: easy=1, medium=2, hard=3.

## FX Pipeline
Store appends `FxEvent { id, kind, cells?, cell?, combo?, tone? }` to `fx[]`. `FX.tsx` consumes by id and renders motion overlays. `consumeFx(id)` removes after animation.

## Theming
`src/lib/theme.ts` — 4 themes (`midnight`, `sunset`, `neon`, `paper`). `applyTheme()` writes CSS custom props (`--bg`, `--accent-c`, `--cell-*`, etc). Persisted in `localStorage['pseudoku:theme']`.

## Sound / Haptics
- `src/lib/sound.ts` — WebAudio osc tones (`tap`, `place`, `correct`, `wrong`, `win`, `fail`). Mute persisted.
- `src/lib/haptic.ts` — `navigator.vibrate` patterns.

## Animations
`framer-motion` `<AnimatePresence>` for screen swaps; per-cell `motion.button` whileTap/Hover; Celebration & FailScreen overlays.

## Build
Vite 5 + `@vitejs/plugin-react` (SWC default). Tailwind 3 + autoprefixer. TS strict via `tsconfig.app.json`. PWA manifest at `public/manifest.webmanifest` (icons 192/512 + maskable).
