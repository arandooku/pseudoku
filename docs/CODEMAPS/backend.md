<!-- Generated: 2026-04-25 | Files scanned: 0 | Token estimate: ~80 -->

# Backend

**N/A.** Pseudoku is a client-only SPA. No server, no API, no DB.

The closest thing to a "service layer" is `src/store/game.ts` (zustand) which orchestrates pure logic modules and localStorage I/O.

External calls (one-way, observability only):
- `@vercel/analytics` → `va.vercel-scripts.com` + `vitals.vercel-insights.com` (page views, web vitals).
- Google Fonts CSS/woff2 (Fraunces, Inter).

If a backend is added later, route here:
```
POST /api/...   → ???
```
