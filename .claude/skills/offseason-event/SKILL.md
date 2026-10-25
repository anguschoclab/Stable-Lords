---
name: offseason-event
description: Recipe for adding a new offseason event to the seasonal pipeline. Use when the task is "add an offseason event", "new season-boundary event", or touches src/data/narrative/offseason.json, src/engine/pipeline/offseasonEvents/, or src/engine/pipeline/seasonal.ts. Covers the data→type→handler→registry chain that compile-checks and the coverage/determinism tests that gate it.
---

# offseason-event

61 offseason events already exist — follow the established 4-step chain. The
wiring is compile-enforced end to end: a handler keyed on a non-canonical
`effectType`, or a canonical `effectType` with no handler, **fails to compile**.

## The chain

1. **Data** — add the event to `src/data/narrative/offseason.json` under
   `offseason_events`: `title`, `effectType` (snake_case, unique), `newsletter`
   array of `{{token}}` templates.
2. **Type** — add the `effectType` to `OffseasonEffectType` in
   `src/engine/pipeline/offseasonEvents/types.ts`.
3. **Handler** — write `handleX(run: OffseasonEventRun)` in the matching
   thematic module: `economicHandlers.ts` (gold/ledger), `buffHandlers.ts`
   (XP/fame/tokens/traits), `injuryHandlers.ts` (injuries), `chaosHandlers/`,
   `socialHandlers/`. Mutate the `OffseasonEventContext` collector —
   `rosterUpdates`, `newsletterItems`, `ledgerEntries`, `insightTokens`,
   `treasuryDelta`. Roll branches on `run.rng`, never `Math.random()`.
4. **Registry** — map `effectType → handleX` in `EVENT_HANDLERS`
   (`src/engine/pipeline/seasonal.ts`). Re-export the handler from
   `offseasonEvents/index.ts`.

## Tests (fixture-driven, ~ms each)

- Unit test in `src/test/engine/pipeline/` (precedent:
  `bountifulHarvest.test.ts`, `suspiciousMushroomStew.test.ts`) using
  `makeOffseasonCtx()` + `makeStubRng({...})` from
  `src/test/_fixtures/offseasonCtx.ts`. Override stub methods to hit each RNG
  branch (`roll`, `pick`, `next`).
- **Coverage gate is automatic** —
  `src/test/data/seasonalEventHandlerCoverage.test.ts` asserts every JSON
  `effectType` resolves to a registered handler AND every registered handler is
  reachable from a JSON event. Both directions fail until the chain is complete.
- **Determinism gate is automatic** — `offseasonDeterminism.test.ts`
  characterizes every event: same seed = same impact, stable shape across seeds.
  A handler that isn't deterministic fails CI.

## Verify

```bash
bun run test --reporter=verbose src/test/data/seasonalEventHandlerCoverage.test.ts src/test/engine/pipeline/offseasonDeterminism.test.ts src/test/engine/pipeline/passes/SeasonalPass.test.ts
```

## Notes

- SeasonalPass only fires on the transition to week 1 (`nextWeek === 1`) —
  guard with an early return in SeasonalPass tests, not inside handlers.
- Insight tokens: created for epiphany-style discoveries; tag them Weapon /
  Rhythm / Style / Tactic per precedent.
- Conditional events check state inside the handler (e.g. wandering_blacksmith
  no-ops when treasury < 50, wandering_healer cures only if someone's injured).
