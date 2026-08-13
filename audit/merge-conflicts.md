# Merge Conflict Resolution Log

## PR Cherry-Picks (Original Consolidation)

All 7 approved PRs were cherry-picked onto `integration/exhaustive-audit` from their respective feature branches. Conflicts documented below.

### PR #809 — Curate narrative content
- **Conflict**: `narrativeContent.json` — both main and branch modified different sections
- **Resolution**: No conflict — non-overlapping line ranges (combat descriptions vs offseason_events)
- **Commit**: `08288dd9`

### PR #810 — styleRollups for-loop
- **Conflict**: None — clean cherry-pick
- **Commit**: `732d196a`

### PR #811 — rivalWarriorFactory tests
- **Conflict**: None — new file only
- **Commit**: `212df982`

### PR #812 — Button aria-label
- **Conflict**: None — clean cherry-pick
- **Commit**: `d0e984df`

### PR #813 — Unexplained Monolith event
- **Conflict**: `narrativeContent.json` — both PR #809 and #813 modified the file
- **Resolution**: Non-overlapping sections — #809 touched combat descriptions, #813 added offseason_events
- **Commit**: `82a13ca3`

### PR #814 — a11y polish + duplicate Switch fix
- **Conflict**: None — clean cherry-pick
- **Commit**: `d0e984df`

### PR #817 — Mist-Shrouded Ruins + Gallows Tree
- **Conflict**: `weather.ts` — `CURSED_BLOOD_MOON_DAMAGE` vs `GALLOWS_CURSE_DAMAGE`
- **Resolution**: Both constants coexist — no breaking change. `GALLOWS_CURSE_DAMAGE` added as new constant for the Gallows Tree arena, `CURSED_BLOOD_MOON_DAMAGE` preserved for existing Blood Moon mechanic.
- **Commit**: `c1230de9`

## Post-Plan Cherry-Picks (Aug 13, 2026)

### combat-chronicler-curation branch — combat narrative content
- **Conflict**: None — used `git checkout origin/branch -- <files>` to selectively pull only 3 JSON files
- **Files**: `combatPbp.json`, `combatStrikes.json`, `combatKillText.json`
- **Changes**: +513 / -493 lines (content curation — new dodge descriptions, kill text variations, strike narrations)
- **Verification**: narrative-validate passes, 1159 combat+narrative tests pass, tsc clean
- **Note**: Branch's architectural changes (lazy-loading, async advanceWeek) were already on main — only content was cherry-picked

## Disapproved PRs (No Cherry-Pick)

| PR # | Reason |
|------|--------|
| #815 | Superseded by #810 (less comprehensive styleRollups optimization) |
| #816 | Self-reverted Haunted Dummy handler; TreasurySparkline fix already on main |
| #818 | TreasurySparkline fix already on main; fewer narrative lines than main |
