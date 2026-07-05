# Plan 2 — Fix the player bankruptcy death spiral

## Problem (measured, confirmed)

`src/test/engine/combat/simulation_hardening.test.ts` fails ~week 31: player 4→0 warriors,
treasury -457 → -1682, never recovers. Path corrections found during investigation: rival
auto-recruit is at `src/engine/owner/roster/management.ts` (not `ai/`); `processPlayerBankruptcy`
is invoked from `SystemPass.ts:133-137` (not a dedicated pass).

- **Auto-sell spiral** — `bankruptcyService.ts:38-103`: every week `treasury < -500`, sells
  highest-fame warrior for `fame*10` (~line 63). Starters sell for 0-200g → never clears debt
  → sells next warrior next week. No roster floor, no debt floor.
- **No way back from 0** — `RecruitmentPass.ts` only fills the shared `recruitPool`, never
  `state.roster`. The only player auto-recruit is in the test harness
  (`src/scripts/simulation-harness.ts:82-88`), which `advanceWeek` bypasses.
- **Structural deficit** — `STARTING_TREASURY` effectively 500 (`worldSeeder.ts:67` overrides
  the factory's 1000); `WARRIOR_UPKEEP_BASE = 60`/warrior/week guaranteed (`economy.ts:149-153`)
  vs `FIGHT_PURSE = 90` only-if-booked. 4 idle warriors bleed ~240/week.
- **Pipeline facts:** bankruptcy runs after core economy is applied, so `state.treasury` is
  current. **There is no `rosterAdditions` impact field** — `warriorsHandlers` supports only
  `rosterUpdates`/`rosterRemovals`/`graveyard`/`retired`. New randomness must use
  `SeededRNGService` seeded from week; never `makeWarrior(undefined, ...)` (falls back to
  non-deterministic crypto).

## Fix — three coordinated parts

### (a) Player roster floor

New helper `signFreeRecruitForPlayer` called from `runSystemPass` right after the bankruptcy
check. Add a first-class `rosterAdditions?: Warrior[]` impact field in `impacts/types.ts`,
handler in `impacts/warriors.ts` (`state.roster = [...state.roster, ...value]`), `MERGE_CONFIG`
entry `rosterAdditions: { strategy: 'append', defaultValue: [] }`. Floor logic (floor = 1):

```ts
const floorRng = new SeededRNGService(state.week * 6151 + 29);
const recruit = materializeFloorRecruit(state, floorRng); // pool[0]→full Warrior, or generate
if (recruit) impact.rosterAdditions = [recruit];
```

`materializeFloorRecruit` reuses `recruitPool[0]` and adds the runtime fields exactly as
`recruitGenerator.ts:162-183` (`career`, `status:'Active'`, `stableId`, `fame:0`, …); emits a
`recruitPool` impact removing the consumed entry; if pool empty, `makeWarrior` **with** the
seeded rng.

### (b) Make `processPlayerBankruptcy` solvent-restoring

Stop selling below a roster floor + bounded emergency loan:

```ts
const MIN_BANKRUPTCY_ROSTER = 2; // never strip below this
const DEBT_FLOOR = -800;
const EMERGENCY_LOAN = 300;
```

Only force-sell if `roster.length > MIN_BANKRUPTCY_ROSTER`; at the floor and still under
threshold, inject a capped top-up toward the threshold (keep `popularityDelta -= 50` + a
newsletter note). Deterministic (existing seeded rng).

### (c) Rebalance

`constants/economy/economy.ts`: `WARRIOR_UPKEEP_BASE 60 → 45`; add `IDLE_STIPEND = 30`.
In `economy.ts` `computeWeeklyBreakdown`, credit `IDLE_STIPEND` when a stable has ≥1 active
warrior and fought 0 bouts (flows symmetrically to rivals).

## Interaction per week

EconomyPass (lower upkeep + stipend) → SystemPass: bankruptcy (sells to floor + capped loan)
then roster-floor (free recruit via `rosterAdditions`). `rosterRemovals`/`rosterAdditions`
operate on disjoint ids → merge-safe.

## Verification

`npx vitest run src/test/engine/combat/simulation_hardening.test.ts` must pass (104 weeks,
rival count 30-45, mortality <20%). `DEBUG_SIM=true` to confirm treasury bottoms then recovers.
`src/test/engine/resolveImpacts.test.ts` for the new field; integration autosim/weekAdvancement

- economy specs for over-correction; `npx tsc --noEmit`.

## Risks

Over-correction into too-easy economy (keep numbers conservative; add a test that a _deliberately
idle_ stable still trends negative); **rival-band drift** (stipend helps rivals too — if count
climbs past 45, scope stipend to the player); hard-coded economy numbers in other tests;
PoolWarrior→Warrior materialization gaps (produce a full Warrior); determinism (run twice, diff).

## Critical files

`src/engine/ai/bankruptcyService.ts`; `src/engine/pipeline/passes/SystemPass.ts`;
`src/engine/impacts/{types.ts,warriors.ts,impactSystem.ts}`; `src/constants/economy/economy.ts`;
`src/engine/economy.ts`. Reference: `src/engine/owner/roster/recruitGenerator.ts:162-183`,
`src/engine/factories/warriorFactory.ts:27`, `src/scripts/simulation-harness.ts:82-88`.
