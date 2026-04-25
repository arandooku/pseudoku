<!-- Generated: 2026-04-25 | Files scanned: 2 | Token estimate: ~500 -->

# Dependencies

## Runtime (npm)
| Package | Version | Use |
|---------|---------|-----|
| react | ^18.3.1 | UI |
| react-dom | ^18.3.1 | DOM render |
| zustand | ^5.0.0 | Single global store `useGame` |
| framer-motion | ^11.11.1 | Screen transitions, FX overlays, button springs |
| lucide-react | ^1.8.0 | Icons (Play, Trophy, Flame, etc.) |
| @vercel/analytics | ^2.0.1 | Page view + web vitals beacon |

## Dev / Build
| Package | Version | Use |
|---------|---------|-----|
| vite | ^5.4.8 | Dev server + bundle |
| @vitejs/plugin-react | ^4.3.2 | Fast Refresh, JSX |
| typescript | ^5.6.2 | Type checks (`tsc -b`) |
| tailwindcss | ^3.4.13 | Utility CSS |
| postcss / autoprefixer | ^8.4.47 / ^10.4.20 | Tailwind pipeline |
| sharp | ^0.34.5 | `scripts/gen-icons.mjs` PNG icon gen |
| gh-pages | ^6.2.0 | Legacy deploy script (Vercel is primary) |

## External Services
| Service | Endpoint | Why |
|---------|----------|-----|
| Vercel | platform host | Static hosting + analytics |
| Vercel Analytics | `va.vercel-scripts.com`, `vitals.vercel-insights.com` | Beacon, allowed in CSP `connect-src` |
| Google Fonts | `fonts.googleapis.com`, `fonts.gstatic.com` | Fraunces, Inter; allowed in CSP `style-src`/`font-src` |

## Browser APIs
- `localStorage` — persistence
- `WebAudio` (`AudioContext`) — `lib/sound.ts` osc tones
- `navigator.vibrate` — `lib/haptic.ts` (Android only)
- `performance.now`, `setInterval` — `App.tsx` tick loop
- `crypto.getRandomValues` (via `lib/rng.ts` seed init)

## CSP (vercel.json)
```
default-src 'self'
script-src   'self' va.vercel-scripts.com
style-src    'self' 'unsafe-inline' fonts.googleapis.com
font-src     'self' fonts.gstatic.com
connect-src  'self' vitals.vercel-insights.com va.vercel-scripts.com
img-src      'self' data: blob:
frame-ancestors 'none'
```
Plus `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy no-referrer`, restrictive `Permissions-Policy`.

## Internal Modules
```
store/game.ts ─┬─ lib/sudoku.ts        (generate, validate, conflicts, candidates)
               ├─ lib/solver/solver.ts (logical solve trace)
               ├─ lib/solver/strategies.ts (15 techniques: singles → swordfish/xy-chain)
               ├─ lib/solver/candidates.ts (peer maps, bitmask ops)
               ├─ lib/grader.ts        (trace → 6 grades by score)
               ├─ lib/achievements.ts  (14 badge definitions)
               ├─ lib/rng.ts           (mulberry32 seeded RNG)
               ├─ lib/theme.ts         (CSS-vars themer)
               ├─ lib/sound.ts         (WebAudio sfx)
               └─ lib/haptic.ts        (vibrate patterns)
```

## Strategies Implemented (src/lib/solver/types.ts:3)
naked_single, hidden_single, naked_pair, hidden_pair, naked_triple, hidden_triple, naked_quad, hidden_quad, pointing, box_line, x_wing, y_wing, swordfish, xy_chain, unique_rectangle.
