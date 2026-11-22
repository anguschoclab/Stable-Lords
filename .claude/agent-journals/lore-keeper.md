# Lore Keeper Journal

## 2026-05-24 - Apostrophe-clip corruption in lore pools

**Discovery:** The big union merges (d0a9831d3 "exhaustive consolidation of 44
open PRs", and later lore-union merges) clipped every lore-pool entry containing
a straight `'` apostrophe at the quote and silently dropped the tail — ~40
entries across `lore/{origins,childhoodTraits,definingMoments}.ts` were
fragments (`'Born in a debtors'`, `'charity'`, `'the bars couldn'`,
`'someone who didn'`). One entry was even split into two array items. Broken
prose shipped in-game (e.g. `Brutus …, driven by a promise made to someone who
didn.`).

**Rule:** Lore entries in single-quoted pools must use the curly `’` (U+2019)
for apostrophes — straight `'` terminates the literal and is what the merger
tripped on. When auditing, treat any pool entry that is a strict prefix of a
longer historical variant as a probable clip; `git log -p -S "<fragment>"` over
`src/engine/narrative/` recovers the original. Check
`src/data/narrative/*.json` and `src/data/arenas/` before assuming the rot is
confined to the lore shards (clean this time).

**Check:** Restore in place (same index, same array length) — zero pick-index
shift; only content changes. If a split produced an orphan tail (`'charity'`),
refill the slot with a fresh entry rather than deleting, to keep length
constant. Verify with `src/test/engine/narrative/` + `src/test/data/` and the
no-duplicate pins in `loreGenerator.test.ts` / `newLoreGenerator.test.ts`.
