<!-- Generated: 2026-04-25 | Files scanned: 3 | Token estimate: ~600 -->

# Data

No database. All state lives in browser `localStorage`. Keys are namespaced under `pseudoku:`.

## Keys

| Key | Schema | Validated by |
|-----|--------|--------------|
| `pseudoku:save` | `SaveState \| null` | `isValidSave()` in `store/game.ts:109` |
| `pseudoku:stats` | `Stats` | `loadStats()` field-by-field coercion `store/game.ts:176` |
| `pseudoku:achievements` | `{ unlocked: string[] }` | `loadUnlocked()` filters via `ACHIEVEMENTS` whitelist `store/game.ts:210` |
| `pseudoku:theme` | `ThemeId` string | `loadTheme()` in `lib/theme.ts` |
| `pseudoku:muted` | `'1' \| '0'` | `lib/sound.ts` |

## SaveState (src/lib/types.ts:19)
```
puzzle:    number[81]   // initial clues, 0=empty
solution:  number[81]   // full solution
given:     boolean[81]  // true = clue (locked)
user:      number[81]   // current entries
notes:     number[81]   // bitmask, bits 1..9
mistakes:  number
elapsedMs: number
difficulty:'easy'|'medium'|'hard'
grade:     'kids'|'gentle'|'moderate'|'tough'|'diabolical'|'extreme'
seed:      number
startedAt: ISO string
completed: boolean
hintsUsed: number
score:     number
combo:     number
bestCombo: number
```

## Stats (src/lib/types.ts:38)
```
solved:           { easy, medium, hard }: number
bestMs:           { easy, medium, hard }: number|null
bestScore:        { easy, medium, hard }: number
streakDays:       number
lastPlayedDate:   YYYY-MM-DD | null
noMistakeRun:    number
totalMsPlayed:    number
hardWinsFlawless: number
bestCombo:        number
```

## Validation
Strict guards reject malformed blobs (length≠81, out-of-range digits, non-boolean grids, oversized note masks > 0x1ff). On failure `loadSave()` removes the key. Migration shim back-fills legacy `grade`/`score`/`combo` fields from `difficulty`.

## Persistence Triggers
- `writeSave` on every placement, hint, autoPencil toggle, completion.
- `tick` writes only every 5s (throttle).
- `writeStats` on completion.
- `writeUnlocked` only when new achievements fire.
- `purgeAll` removes all three save/stats/ach keys.

## Migrations
History: legacy `difficulty`-only saves → mapped to `grade` via `difficultyToGrade()` (game.ts:131). No schema versioning — relies on shape validation + field defaults.
