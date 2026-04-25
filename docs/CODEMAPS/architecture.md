<!-- Generated: 2026-04-25 | Files scanned: 28 | Token estimate: ~600 -->

# Architecture

## Type
Single-page web app. Client-only. No backend, no DB. React 18 + Vite 5 + TypeScript. Deployed to Vercel (root, no base path).

## Layers
```
[index.html] → main.tsx → App.tsx
                            ↓
                        screen router (zustand)
                            ↓
       ┌─────────────┬──────────────┬─────────────┐
       Home          Play           Achievements
       (grade pick)  (Hud+Board+    (badge grid)
                      Keypad)
                            ↓
                       useGame store
                            ↓
        ┌──────────┬──────────┬──────────┬──────────┐
      sudoku.ts  solver/    achievements  theme/sound/haptic
      (gen+val)  (logic     (badge defs)  (a11y/fx)
                  grade)
                            ↓
                       localStorage
                       (save/stats/ach)
```

## Data Flow
1. User picks Grade on `Home` → `newGame(grade)` → `sudoku.generate` → seeded puzzle + solution.
2. `Board` renders 81 `Cell`s; tap → `selectCell`. `Keypad` → `placeDigit` / `toggleNote` / `hint` / `autoPencil`.
3. Each placement updates `save.user`, scores combo, emits `FxEvent`s, persists to localStorage.
4. On `isComplete`, store updates `Stats`, evaluates `ACHIEVEMENTS`, fires `Celebration`.
5. `tick` interval (1s) accrues `elapsedMs`, throttled writes every 5s.

## Boundaries
- **State**: zustand `useGame` (single store, F:/Claude/Pseudoku/src/store/game.ts).
- **Persistence**: `localStorage` keys `pseudoku:save`, `pseudoku:stats`, `pseudoku:achievements`. All loads validated (digit/bool/notes grids); invalid blobs are discarded.
- **Pure logic** (no DOM): `src/lib/sudoku.ts`, `src/lib/solver/*`, `src/lib/grader.ts`, `src/lib/achievements.ts`, `src/lib/rng.ts`.
- **Side effects**: `theme.ts` (CSS vars), `sound.ts` (WebAudio), `haptic.ts` (navigator.vibrate).

## Backend
None. See `backend.md` (N/A stub).

## Hosting
Vercel root deploy. SPA rewrite → `/index.html`. Strict CSP; assets cache 1y immutable. Vercel Web Analytics via `@vercel/analytics`.
