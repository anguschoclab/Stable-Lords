# Backlog work plan (validated): SP-boundary, SP-virt, V24-F2/F3, V15, V30 seed re-baselines

Codebase-validated implementation plan for the open MEGAPLAN_BACKLOG items — bout-boundary cast removal, list virtualization, full canon armor table + weapon×armor matrix, engine-pool persistent shard state via stage-granular impact-sync, and two in-spec seed re-baselines — every workstream test-first (RED→GREEN per V30 precedent), zero save-compat constraints, MEGAPLAN_BACKLOG.md updated on completion.

## Validation status

Plan audited against live code post-V30 (tree clean; phases 1–6 + FINDINGS committed). Corrections from the draft are folded in inline; key disproval/approval calls:

- **WS1** — all three fixes verified correct; `mortalityHandler` additionally needs `rng.uuid() as FightId` (uuid returns `string`); `changedFields`/`patchRivalWarrior` have **zero existing test coverage** → a spec must land first.
- **WS2** — **disproved**: the draft said "remove the pager"; there is no pager — `useListShell` is a 25-row window + `showAll` toggle. Corrected design virtualizes `list.visible`, preserving the toolbar affordance.
- **WS3** — zero save-compat confirmed (house precedent: `SAVE_STATE_VERSION` free to bump; V11 bumped 2.1.0-hardened→3.0.0 across "both copies + package.json"). Simplification approved: **drop the legacy-alias index entirely**; bump `SAVE_STATE_VERSION` in `src/constants/core/core.ts:12` AND `electron/main.ts:25` (+ package.json version per V11 precedent) so stale saves are rejected cleanly instead of silently unarmoring warriors. Codemod set measured: ~37 source/test files + `snap.json` (14MB, ~5,200 keyed `"armor":"<id>"` pairs) + ~45 ambiguous `'leather'`/`'padded'` sites.
- **WS5** — **design correction**: a single end-of-week broadcast is wrong — bout shards read post-sweep `mutableState` while rival shards read `stateAfterCore`; the sync protocol must be **stage-granular** (bootstrap → weekStart → postCore → endWeek). Bench script is `scripts/parallel-bench.mjs` (not `.ts`).
- **Test-first mandate** — every workstream follows V30's "Phase T" discipline: specs authored and RED-verified before any implementation edit, then implementation to GREEN. New spec files trigger `bun scripts/test-audit-scan.mjs` to regenerate `runnerGroups.json`/`auditBaseline.json`, and file under the matching `src/test/<domain>/` (enforced by `testQualityAudit`).

Sequencing: **WS1 → WS2 → WS3 → WS4 → WS5 → WS6 → WS7**. WS3/WS4 re-roll seeded streams, so the WS6 seed sweeps run once, on the final tree. The two V30 specs stay RED in the slow suite until WS6 (known-red backlog rows; slow tier gates nightly, not PRs).

---

## WS1 — SP-boundary: remove residual `as unknown as` bout-boundary casts

**Phase T (specs first, RED-verified):**
- New `src/test/engine/bout/warriorRouting.test.ts` — `changedFields`: drops reference-identical fields, keeps changed fields, returns only changed keys; `patchRivalWarrior`: no-op on empty diff, merges per-warrior patches cumulatively. (Coverage gap: both functions currently untested.)
- `handleReporting` spec (`src/test/engine/bout/`): returned `summary.stableIdA/stableIdD` equal `wA.stableId`/`wD.stableId` (incl. `undefined` pass-through) — behavior pin feeding `stableManager.weeklyIncome`/`ownerNarrative` lookups noted in the inline comment at `reportingHandler.ts:61-65`.
- `generateFightNarrative` contract spec (`src/test/engine/gazette/`): a `Pick<FightSummary,'week'|'title'|'winner'|'by'|'styleA'|'styleD'>`-shaped input produces narrative (pins the narrowed signature).

**Phase I (implement):**
1. `reportingHandler.ts:66-67` — delete `as unknown as StableId` on both lines. Verified: `Warrior.stableId?: StableId` (`warrior.types.ts:254`) ≡ `FightSummary.stableIdA/D?: StableId` (`combat.types.ts:215-216`).
2. `mortalityHandler.ts:133-150` — drop dead `a`/`d` fields from the literal (excess-property-only cast; `generateFightNarrative` reads only `week/title/winner/by/styleA/styleD` — verified `gazetteNarrative.ts:19-71`, names come from `getNamesFromTitle(fight.title)`), change `id: boutId` to `id: boutId as FightId` (single `as`, matching `reportingHandler.ts:52`), remove the outer `as unknown as FightSummary`. Optional hardening: narrow `generateFightNarrative`'s param to `Pick<FightSummary,'week'|'title'|'winner'|'by'|'styleA'|'styleD'>` — all other callers pass full summaries, no ripple.
3. `warriorRouting.ts:17-24` — delete-based rewrite preserving the reference-inequality diff:
   ```ts
   const out: Partial<Warrior> = { ...after };
   for (const k of Object.keys(after) as (keyof Warrior)[]) {
     if (before[k] === out[k]) delete out[k];
   }
   return out;
   ```
   (`Object.keys(...) as (keyof Warrior)[]` is sound — `Partial<Warrior>` keys ⊆ `keyof Warrior`; `delete` is legal since all props are optional.)

**Scope guard:** only the three backlog sites. Other `as unknown as` in engine (`rosterWorkerTraining` GameState adapters, `'bye' as unknown as WarriorId`, Comlink wraps, `agingSystem` rivalId, `tacticsAdvisorBridge` armor strings) are different debt — leave.

**Verify:** `bun run type-check`, `bun run test` (bout + gazette specs green).

---

## WS2 — SP-virt: virtualize StableRankings + RivalStableList

Precedent (verified): `WarriorLeaderboard.tsx` — `useVirtualizer({count, estimateSize:()=>48, overscan:10, getScrollElement:scrollRef})`, `<div max-h-[70vh] overflow-auto>` scroll container, `TableHeader sticky top-0`, spacer `<tr>` before/after virtual rows, `useFallback` plain-map when `getVirtualItems()` is empty. Non-table precedent: `VirtualizedFallenGrid.tsx`.

**Phase T (specs first, RED-verified):**
- `src/test/components/world/StableRankings.test.tsx` (new) — rendered row count is bounded (< total rows for a large `rows` prop), first and last visible rows carry correct rank/index, sort header still fires `onSort`, empty `rows` renders cleanly, fallback path renders all rows when virtualizer reports no items.
- `src/test/components/scouting/RivalStableList.test.tsx` (new) — same bounded-render assertion for `list.visible`; selection callback fires with `rival.owner.id`; `SelectableCard` aria/`role="button"` + tooltip intact; search filters; `showAll` expansion renders the full filtered set virtualized (still bounded DOM nodes); `GrudgeFlames` renders when grudge present.

**Phase I (implement):**
- `src/components/world/StableRankings.tsx` — wrap `<Table>` in `ref`'d `max-h` scroll container (mirror WarriorLeaderboard: header inside scroll div, `sticky top-0`); replace `rows.map` in `TableBody` with virtual rows + spacer `<tr>`; `rows` prop is the full filtered set (~90–160 stables — the win is real here, no windowing exists today). `estimateSize`: measure `StableRankingsRow` (~44–48px).
- `src/components/scouting/RivalStableList.tsx` — **keep `useListShell` + `ListToolbar` + the `+N more`/`Top N` toggle unchanged**; virtualize `list.visible` inside a bounded `max-h` scroll container using transform-positioned rows (FallenGrid pattern, not spacer `<tr>` — it's a card grid, not a table). At the 25-row default the virtualizer is a no-op; on `showAll` (90–160 rivals) it bounds DOM nodes. Measure a `RivalRow` card height (~70–80px) for `estimateSize`; preserve selection, `GrudgeFlames`, `RivalIdentity`, `SelectableCard` a11y contract verbatim.

**Verify:** component specs green; `bun run test`; `bun run e2e` smoke.

---

## WS3 — V24-F3: full canon armor table alignment

Canon mapping (verified 1:1 by weight tier onto the extended Duel2 family; stats unchanged):

| current id | → id / code | canon name | wt | description moves to |
| --- | --- | --- | --- | --- |
| `padded` | `ALE` | Leather | 2 | "Cured leather armor…" |
| `leather` | `APL` | Padded Leather | 4 | "Quilted cloth armor…" |
| `studded_leather` | `ASH` | Studded (Hide) | 5 | unchanged |
| `ring_mail` | `ARM` | Ringmail | 6 | unchanged |
| `scale_mail` | `ASM` | Scalemail | 8 | unchanged |
| `chain_mail` | `ACM` | Chainmail | 10 | unchanged |
| `plate_mail` | `APM` | Platemail | 12 | unchanged |
| `plate_armor` | `APA` | Plate Armor | 14 | unchanged |
| `none_armor` | unchanged | None | 0 | — |

Canon prerequisite: **verify `ASH` and `APA-F` in a canon source first** (duel2.info charts / Assur). If `ASH` is unverifiable, keep `code:'AS'` and record a §3 house divergence instead of inventing a code. `APA-F` (full plate, ~wt 16–18) has no armor here — do NOT add a tier; document as canon tier not yet modeled. (Sibling note, not scope: `full_helm`'s code is `FF` vs canon `F` — record as a backlog watch note.)

**Phase T (specs first, RED-verified):**
- `src/test/data/equipment/armor.canon.test.ts` (new) — 8 armors: `id === code` canon letters, canon names, **explicit per-row stat pins** (weight/mitigation/defenseMod/enduranceCostMod/restrictedStyles — the codemod must not drift them), `getItemById('APM')`/`getItemByCode('ARM')` resolve; `DEFAULT_LOADOUT.armor === 'APL'`.
- `src/test/data/equipment/equipmentData.test.ts`, `equipmentLookup.test.ts` — already iterate `ARMORS` generically (survive); any literal-id assertions re-keyed in the same pass.
- Save-version pins: `retrieveHotStatePlausibility.test.ts:134` pins `'3.0.0'` → update to new version; `gameStateFactory.test.ts`/`opfsArchive.test.ts` use the constant (survive).
- Stream-neutrality probe (temporary, not committed): same seed, N weeks, state-hash identical pre/post rename — disproves any armor-id RNG salting (salts found use `owner.id.length`, not equipment ids — expected clean).

**Phase I (implement):**
- `src/data/equipment/armor.ts` — rename `id`+`code`+`name`+`description` per table; stats untouched.
- **Bump `SAVE_STATE_VERSION`** in `src/constants/core/core.ts:12` AND `electron/main.ts:25` (+ `package.json` version field, V11 precedent) — stale saves reject cleanly rather than silently unarmor. NO legacy-alias index (zero-constraint directive).
- **Safe codemod** (`safe-codemod` skill) — transform ONLY whole-string armor-id occurrences:
  - Definite sites (~37 files): `archetypeArmor.ts`, `warriorArchetypes.ts`, `deathRolls.ts`, `hitLocation.ts`, `narrativeIntro.ts`, `weaponArmor.ts` (`ARMOR_TYPE_MULT` keys), `balance.ts` (`WEAPON_ARMOR_OVERRIDES` keys), `equipmentOptimizer.ts`, `rosterWorkerEquipment.ts`, `fighterState.ts`, `useFavoritesActions.ts` (`armor:'none_armor'` stays), all literal-id tests/fixtures (`equipmentLoadout`, `fighterState.test`, `weaponArmor.test` ~59 hits, `combatDamage`, `flatMitigationPipeline`, `hitLocation`, `equipmentIntegration`, `encumbrance`, `styleWinConditions`, `deathRolls`, `archetypeArmor`, `warriorArchetypes.canon`, `tacticsAdvisorBridge`, `equipmentOptimizer`, `simulate`, `rosterSlice`).
  - `equipment.utils.ts` internals: `DEFAULT_LOADOUT.armor:'leather'→'APL'` and `getStyleDefaultLoadout` armor `'leather'→'APL'`.
  - `snap.json` (14MB): transform `"armor":"<old-id>"` keyed pairs only (~5,200 occurrences measured).
  - Ambiguous `'leather'`/`'padded'`: ONLY where a whole-string armor id (e.g. `armor: 'leather'`, `=== 'leather'`, `getItemById('leather')`). **Keep-set MUST protect:** `leather_cap` (helm id, ~3.7k substring hits), `none_armor`/`none_helm`/`none_shield`, "leather"/"padded" material prose in `combatStrikes.json` + descriptions, `armor_leather_*.png`/`armor_plate_*.png` avatar filenames in `public/avatars/index.json` (exclude file — art names, not ids), helm/weapon/shield ids.
  - Scan for corruption signatures post-run; revert-and-redo on any corruption.

**Verify:** `bun run test`, `type-check`, `lint`; `bun run test:slow` equipment/combat domains; seeded-parity probe clean before WS4.

---

## WS4 — V24-F2: full weapon×armor matrix adjudication

Surface (verified): 20 damage-dtype weapons (`fist` is `bash`-dtype and in scope; the 3 shields are `'none'` → early-return before the armor lookup, `weaponArmor.ts:54`) × 9 armors (8 canon + `none_armor`). `ARMOR_TYPE_MULT` lives at `weaponArmor.ts:36-46`; `WEAPON_ARMOR_OVERRIDES` at `balance.ts:222-224`.

**Adjudication deliverable (before any code):** a per-weapon canon table built from Assur's *"Which Weapons vs Which Armors?"* (bash-family sweet spot vs ASM; DA good vs APM/APA; most weapons struggle vs APA/APM; slash>bash>lunge), reality.com armor descriptions (ALE "surprisingly effective"; APL cushions smash, pierced/chopped easily; **ARM absorbs crushing blows but disadvantaged vs long thin blades**; ASM deflects slash, chinks to smash/pierce; ACM = ARM to greater degree; APM weak-spot attackers fare slightly worse, one weapon fares well; APA — lighter weapons + longspear bounce off, shell can be smashed), Jalopy DA-vs-ASM+ note, turnsheet light/medium/heavy weapon-vs-armor-weight guidance. Every matrix cell is either canon-cited or explicitly recorded `dtype-inherit` — nothing silently defaults.

**Phase T (specs first, RED-verified):**
- `src/test/engine/combat/mechanics/weaponArmorMatrix.test.ts` (new) — table-driven: each canon-cited cell returns its matrix value; `dtype-inherit` cells fall through to `ARMOR_TYPE_MULT`; missing dtype → 1.0; `none_armor`/missing weapon → identity.
- `weaponArmor.canon.test.ts` — extend: dagger poor vs ASM/ACM preserved, ~baseline vs APM/APA (Aimed Blow bypass stays downstream — matrix never sees style); **ARM row corrected** (`bash < 1.0`, `pierce > 1.0` — current `{slash:0.9, pierce:0.9, bash:1.1}` is canon-inverted, verified).
- Integration: `applyArmorTypeMod` exercised through all three call sites — hit damage (`hitExecution/damage.ts:117`), free riposte (`hitExecution/index.ts:47`), riposte (`riposteExecution.ts:50`).

**Phase I (implement):**
- New `src/constants/combat/combat/weaponArmorMatrix.ts` — `WEAPON_ARMOR_MATRIX: Record<weaponId, Record<armorId, number|'dtype-inherit'>>` keyed by canon ids, per-row citation comments; `applyArmorTypeMod` consults matrix → `ARMOR_TYPE_MULT[dtype]` → 1.0. Replace `WEAPON_ARMOR_OVERRIDES` (matrix subsumes it — dagger row becomes matrix cells).
- Fix `ARMOR_TYPE_MULT.ARM` (canon-inverted bash/pierce).
- **Boundary:** no `STYLE_PENALTIES`/`MATCHUP_MATRIX`/damage-scale/suitability/mortality edits (V22-D3's soak campaign stays separate).

**Balance verification:** style-probe + balance-lab deltas recorded; seeded world check on kill-rate/style spread (this is the stream re-roll — must precede WS6); `bun run test:slow` combat + balance domains.

---

## WS5 — V15: engine-pool persistent shard state (full implementation)

Grounded architecture (verified in `weekPipelineService.ts`, `stages.ts`, `finalize.ts`, `context.ts`, `enginePool.ts`, `shardContract.ts`): every week transition is deterministic pure boundary functions + `resolveImpacts`. Workers hold `syncedState` and consume **stage-granular sync messages** — required because the two shard passes read different mid-week state versions (bout shards: post-sweep `mutableState`; rival shards: `stateAfterCore`).

**Sync protocol** (per worker, per week):
1. `bootstrap(state)` — first sync sends the full state once (worker construction / after `invalidate`).
2. `weekStart({headless})` — worker replays `sweepUnfinishedTournaments` (pure spread-based, seeded `year*10000+week*100+7+i*16` — verified `resolution/index.ts:205-247`), `flushGazette` when headed (`SeededRNG(week*977)` — verified `gazette.ts:26-28`), `buildWeekCaches` → post-sweep working state.
3. Bout shards: wire `BoutShardContext` drops `state`/`warriorMap`/`moodMods` → worker derives all three (`getMoodModifiers(state.crowdMood)` — `crowdMood.ts:46`; `warriorMap` via `buildWeekCaches`).
4. `postCore({boutImpact, coreImpacts, boutDisplay})` — worker `resolveImpacts` in order + recompute `cachedMetaDrift` + stash `lastWeekBoutDisplay` + conditional `buildWeekCaches` (`impactsAffectWeekCaches` rule) → `stateAfterCore`. Piggyback `perception`/`successorByStable` on this message (both built once on coordinator — `RivalStrategyPass/index.ts:50-54`; broadcasting avoids N× the O(world) rebuild).
5. Rival shards: wire `RivalShardContext` drops `state`/`perception`/`successorByStable` → uses postCore-synced state + piggybacked derivatives + `nextWeek` scalar.
6. `endWeek({worldImpacts, contentImpacts})` — apply → replay `finalizeState` verbatim (every write verified deterministic pure f(state, ctx scalars): week/year bump, tournament-flag release, `accumulateLifetimeStats` vs pre-week synced copy, training-assignment decay, `clearExpiredRest`, `cleanupBoutOffers` (deterministic `voided_contracts_${absoluteWeek}` id), `rebuildWarriorOfferIndex`, `applySeasonBoundaryReset`, `sweepOrphanedReigns`, `deferBoutArchives`, `truncateState`, `lastWeekBoutDisplay` restore) → new synced baseline.
7. `invalidate()` — on save-load/new-game/`configureEnginePool`/`shutdownEnginePool` → next shard call re-bootstraps.

**Gate 0 — coverage audit (named deliverable, written to `pipeline-parallelism.md`):** enumerate every non-impact write between synced snapshots. Known set above is all deterministic; any pass writing state directly (bypassing impacts) must convert to impact or join the broadcast. Fallback if coverage fails materially: versioned structural JSON-diff (diff once on coordinator, broadcast).

**Simplifications:** drop `narrowRivalShardState` (`shardContract.ts:26-52`) — its whole purpose was wire-payload dieting; synced workers hold full state and the in-line path reads the same full state (equivalence already proven by `shardInputSize.test.ts`'s byte-identical-output spec — that's what makes dropping safe). Retire `shardInputSize.test.ts`, replacing its invariant with a synced-state equivalence spec. Update `pipeline-dependency-map.md` + `pipeline-parallelism.md`.

**Phase T (specs first, RED-verified):**
- `src/test/engine/pool/enginePool.test.ts` (new fast-tier) — fake `ShardWorkerApi` (mirroring `enginePool.slow.test.ts:30` + sync methods): bootstrap sends full state once; wire ctx omits `state` when synced, includes when not; message order weekStart→postCore→endWeek; fallback path unchanged for unsynced/in-line; `invalidate` forces re-bootstrap.
- `src/test/engine/pool/syncedShardState.test.ts` (new) — worker replay on small fixture state: after each stage delta, worker's materialized state hash ≡ coordinator's state hash at the same boundary (the core sync-fidelity invariant).
- `src/test/engine/pipeline/parallelDeterminism.slow.test.ts` — extend: synced pool 1 vs 4, 8 weeks, byte-identical final state + event stream (existing spec's contract, new mechanism).
- `src/test/engine/pipeline/shardInputSize.test.ts` — retire (subject deleted) or repurpose to the synced-equivalence spec above.

**Phase I (implement):** `ShardWorkerApi` gains `syncWeek(msg)` + `syncBootstrap(state)` + `invalidate()`; `shardWorker.ts` + `fakeShardWorker` implement; `EnginePool` tracks sync epoch per worker and emits wire ctx minus synced fields; `weekPipelineService`/`stages.ts` emit deltas at stage boundaries; `BoutShardContext`/`RivalShardContext` wire shapes (functions keep full-ctx signature — stripping happens at transport).

**Bench + gate:** `bun run scripts/parallel-bench.mjs --weeks 52 --pool 4` (correct path — draft had `.ts`). History: 0.20× → 0.38× → 0.33×; gate ≥1.30×. Honest ceiling: rival compute ~100 ms/wk + bouts 30–80 ms/wk of ~285 ms serial week → theoretical max ≈1.8×. If the gate fails again: mechanism stays opt-in (`configureEnginePool`), `poolSize=1` default stands, outcome recorded in the backlog — implementation still complete. `killDeathDivergence` 900s-cap relief needs real workers under vitest — include a small Bun/vitest nested-Worker feasibility probe; stretch deliverable, not guaranteed.

**Verify:** `bun run test`, `type-check`, `lint`; `bun run test:slow` (parallelDeterminism, enginePool, stateInvariants, weekDeterminism); bench numbers recorded.

---

## WS6 — V30 seed re-baselines (in-spec sweeps, V29 process)

Runs after WS3/WS4 — they re-roll streams; sweep once on the final tree. `probe-liveness-seed.ts` does NOT replicate spec env (opfsArchive shared mock + test-setup module env diverge the seeded trajectory — proven at V29 `f3636f927`). Process per spec:

**worldLiveness competence-gradient** (`worldLiveness.integration.slow.test.ts:161-368`, seed 42 → gradient −463):
- Temp probe spec(s) in `src/test/engine/sim/` mirroring env exactly: `vi.mock('@/engine/storage/opfsArchive', () => ({...__SHARED_MOCKS.opfsArchive}))`, `setMockIdGenerator(()=>'id_${++n}')`, `engineEventBus.clear()`, `runSimulation({weeks:104, seed, logFrequency:4, ignoreBankruptcy:true, onWeek: SERVICING-coherence counters})`.
- Sweep ~10–15 seeds (~15–20 min each, sequential). Winner = **coherent-denominator** pass: medM>0 AND medN>0, gradient>1.3, masterN>10, noviceN>10, objWeeks>1000, coherence>0.12.
- Update spec seed + append a V30 re-baseline comment block with the sweep table (matching the V23/V24/V26/V27/V29 block format at lines 174-343); delete temp specs; verify winner green in-spec.

**worldBalance roster-fill** (`worldBalance.slow.test.ts:91`, fill 94.4% vs ≥95%):
- Same env mirroring (opfsArchive mock + `wb_${++n}` ids + `engineEventBus.clear()`); 52-week runs per candidate.
- Winner must hold ALL bands: fill≥0.95, floor≥`WORLD_RIVAL_FLOOR`, growth>floor, count variance>1, legacyFounders≥1, killRate∈[0.04,0.14], dark arenas≤2.
- Prefer a new seed; a justified threshold re-baseline is acceptable ONLY with written reasoning recorded in the comment + backlog (94.4% = marginal single-roster miss inside noise — "do NOT loosen silently").

Fold both rows: `docs/MEGAPLAN_V30_DEFERRED.md` open-items → resolved; backlog §A → §E.

---

## WS7 — Backlog close-out (user requirement)

Update `docs/MEGAPLAN_BACKLOG.md`: move SP-boundary, SP-virt, V30×2, V24-F2, V24-F3, V15 rows to **§E Resolved** with evidence (commits, spec names, bench/sweep numbers); record adjudications in place — `ASH` verification result (§3 divergence if unverifiable), `APA-F` not-yet-modeled note, `full_helm` code `FF` sibling-divergence watch note, V15 gate outcome (opt-in shipped vs poolSize=1 stands), WS4 balance deltas. Refresh the "Compiled" note. Also update `docs/engineering/pipeline-parallelism.md` (WS5 design + bench) and `docs/engineering/pipeline-dependency-map.md` (narrowing removal).

## Verification matrix

| WS | Phase-T specs | fast suite | typecheck/lint | slow suite | e2e | other |
| --- | --- | --- | --- | --- | --- | --- |
| WS1 | warriorRouting, handleReporting, gazette-contract | yes | yes | — | — | bout tests |
| WS2 | StableRankings, RivalStableList | yes | yes | — | yes | bounded-render asserts |
| WS3 | armor.canon, save-version pins | yes | yes | equip/combat | — | seeded parity probe |
| WS4 | weaponArmorMatrix, canon ext, 3-path integration | yes | yes | combat/balance | — | balance-lab/style-probe deltas |
| WS5 | enginePool sync, syncedShardState, parallelDeterminism ext | yes | yes | pool/determinism | — | parallel-bench.mjs ratio |
| WS6 | (the sweeps are the work) | — | — | the 2 specs green | — | sweep tables recorded |
| — | all | — | — | — | — | `bun scripts/test-audit-scan.mjs` regen for new spec files |

## Risks

- **F3 codemod corruption** — keep-set discipline (`leather_cap`, narrative prose, avatar filenames); corruption-signature scan; revert-and-redo.
- **F3 stale-save semantics** — accepted under zero-constraint; `SAVE_STATE_VERSION` bump converts silent unarmoring into a clean rejection (both copies + package.json).
- **WS6 invalidation** — any stream-affecting change landing after the sweeps re-rolls them; gate the sweep on "no further seeded-stream changes in flight".
- **V15 coverage miss** — a late-found non-impact write breaks sync; Gate 0 audit + structural-diff fallback + per-stage hash assertion in specs.
- **WS4 balance regression** — full matrix is a large surface; ARM fix alone shifts ring-mail's profile. Re-ratchet only if world metrics move outside documented bands, with reasoning recorded.
