# Pseudoku

A mobile-first, aesthetically-tuned Sudoku web game. Solve fast, chase streaks, collect badges.

## Features

- 3 difficulty tiers:
  - **Zen** — unlimited mistakes, chill solve (40–45 clues)
  - **Flow** — 5 lives, steady pace (30–35 clues)
  - **Crucible** — 3 lives, high stakes (24–28 clues)
- Unique-solution puzzle generator (seeded, deterministic).
- Pencil notes, hint, erase, mute, sound + haptic feedback.
- Auto-save to `localStorage` — resume any time.
- 12 achievements, streak tracker, per-difficulty best times.
- Confetti + spring animations via Framer Motion.
- Works fully offline after first load. Static build, no backend.

## Run locally

```bash
npm install
npm run dev
```

## Build & deploy to GitHub Pages

A workflow at `.github/workflows/deploy.yml` auto-deploys on push to `main`:

1. Push this repo to GitHub.
2. In repo **Settings → Pages → Build and deployment → Source**, pick **GitHub Actions**.
3. Push to `main`; the workflow builds and publishes `dist/` to Pages.

Manual alternative: `npm run build && npm run deploy` (uses `gh-pages` package).

Relative asset paths are on (`base: './'` in `vite.config.ts`) so it works at any sub-path (e.g. `username.github.io/pseudoku/`).

## Tech

Vite · React 18 · TypeScript · Tailwind · Zustand · Framer Motion. No backend, no tracking — all state is per-browser in `localStorage`.

## Keys used in localStorage

- `pseudoku:save` — current game state (resume point)
- `pseudoku:stats` — lifetime stats, streak, best times
- `pseudoku:achievements` — unlocked badge IDs

**Purge all data** button on the home screen wipes everything.
