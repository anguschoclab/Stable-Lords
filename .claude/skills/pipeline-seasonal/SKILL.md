---
name: pipeline-seasonal
description: Run seasonal pipeline tests for offseason events, event impacts on state, newsletter generation, and insight token creation.
disable-model-invocation: true
---

# pipeline-seasonal

Tests the seasonal pipeline including offseason event execution, event impacts (treasury, injuries, XP), newsletter generation, and insight token creation.

## Usage

```
/pipeline-seasonal [filter]
```

## Test Groups

| Filter keyword | What it targets                                      |
| -------------- | ---------------------------------------------------- |
| (none)         | All seasonal pipeline tests                          |
| seasonal       | src/test/engine/pipeline/seasonal*.test.ts           |
| passes         | src/test/engine/pipeline/passes/SeasonalPass.test.ts |
| `<event_id>`   | Any offseason event named in a "should trigger the `<event_id>` offseason event" test, e.g. `chaos_rift`, `grand_feast`, `tavern_brawl`, `dreamweaver_visit`, `midnight_market` |

Note: `-t` matches test *titles*, not event keys — keywords like `plague`, `epiphany`, `bard`, `winter`, and `fame_boost` hit unrelated suites (arena data, lucky-epiphany reveals, bard engine, weather seasons) or nothing at all.

## Commands

**Run all seasonal tests:**

```bash
bun run test --reporter=verbose src/test/engine/pipeline/passes/SeasonalPass.test.ts src/test/engine/pipeline/seasonal*.test.ts src/test/engine/pipeline/offseason*.test.ts src/test/engine/pipeline/bountifulHarvest.test.ts src/test/engine/pipeline/suspiciousMushroomStew.test.ts src/test/engine/pipeline/wanderingMystic.test.ts src/test/data/seasonalEventHandlerCoverage.test.ts
```

**Run with a filter (e.g. /pipeline-seasonal plague):**

```bash
bun run test --reporter=verbose -t "plague"
```

**Run seasonal pass tests:**

```bash
bun run test --reporter=verbose src/test/engine/pipeline/passes/SeasonalPass.test.ts
```

**Run specific event type tests:**

```bash
bun run test --reporter=verbose -t "grand_feast"
bun run test --reporter=verbose -t "chaos_rift"
bun run test --reporter=verbose -t "tavern_brawl"
```

**Run all pipeline passes:**

```bash
bun run test --reporter=verbose src/test/engine/pipeline/passes/
```

## Notes

- Seasonal pass triggers on transition to week 1 (off-season boundary)
- 61 offseason event types defined in src/data/narrative/offseason.json (e.g. plague_outbreak, grand_feast, chaos_rift, wandering_healer, dreamweaver_visit, temporal_anomaly); handlers live in src/engine/pipeline/offseasonEvents/
- Events use narrativeContent.json for event templates and narrative text
- Event impacts include: treasury changes, roster updates (injuries, fame, XP), newsletter items, ledger entries, insight tokens
- Insight tokens are generated for epiphany events with warrior-specific attribute discoveries
- Newsletter items track event narratives for player visibility
- Ledger entries track treasury changes for financial transparency
- Events are randomly selected each offseason with equal probability
- Test timeout is 30s (set in vitest.config.ts)
