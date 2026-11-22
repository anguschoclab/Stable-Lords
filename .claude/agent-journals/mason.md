# Mason Journal

## 2026-11-22 - Dead re-export blocks double-register in the duplication ledger

**Finding:** Removing `src/data/equipment/weapons.ts`'s dead
`export {...} from './weaponStyles'` block tripped TWO
`duplication.guard.test.ts` stale-entry checks: the re-export preamble
itself was the duplicated text registered as
`weapons.ts|weapons/items.ts` (src↔src) and
`weapons.ts|weaponStyles.test.ts` (mixed literal-pin).

**Learning:** Barrel re-export preambles are counted as duplication by the
guard — a dead barrel shows up in `EXEMPT_PAIRS`/`MIXED_EXEMPT_PAIRS`, so
deleting it requires pruning the now-stale ledger entries in the same
commit (the ledger only ratchets down; `<=` baselines absorb the drop).

**Constraint:** When deleting re-export surface, expect stale ledger
entries — grep `duplication.guard.test.ts` for the file name first and
remove the pair + its comment together. Consumers of style constants all
use the canonical `@/data/equipment/weaponStyles` path (the
`@/data/equipment` index never re-exported them), and V11 precedent
(`v11DeadSurface.guard.test.ts`) establishes that hooks/constants live at
their canonical module — `useGameStore.ts` convenience re-exports are the
deprecated path (`useReputationState` was the last dead one; the other
four still have live barrel consumers).
