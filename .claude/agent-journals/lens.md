# Lens Journal

## 2026-11-22 - moodHistory is over-appended — dedupe by week before charting

**Data:** `state.moodHistory` (`{ week, mood }[]`) — written by
`engine/bout/services/WeekFinalizationService.ts`.
**Learning:** The stored array is NOT one entry per week. Each impact's
`moodHistory` is a pre-computed tail (`old.slice(-19) + new entry`) and the
impact merger applies the field with an `append` strategy, so a live 8-week
autosim produced ~50 entries — each logical week repeated ~6× and out of
order. Every same-week entry carried the same mood (all are computed from
the same pre-week `arenaHistory`), so **dedupe by `week`, last-wins, sort
ascending** recovers the true series; the final week then always equals
`state.crowdMood`. Always probe a real autosim (`scripts/advisor-e2e.ts`
pattern: `createFreshState` → `runAutosim`) before trusting a field's
write-once-per-tick comment.
**Pattern:** For categorical series (enums like CrowdMood), the
FormSparkline idiom — equal-height colored cells + tooltip + aria-label —
is the honest viz; a "line" would fake ordinal meaning. The five
CrowdMood values map to existing tokens: Bloodthirsty→`--arena-blood`,
Festive→`--arena-gold`, Theatrical→`--arena-fame`, Solemn→`--arena-steel`,
Calm→`--arena-bone` (muted).
