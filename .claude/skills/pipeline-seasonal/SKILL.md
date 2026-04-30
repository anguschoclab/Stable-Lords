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

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | All seasonal pipeline tests |
| plague | Plague outbreak event (injuries + fame loss) |
| feast | Grand feast event (gold cost + XP for all) |
| epiphany | Epiphany event (fame + XP + insight token) |
| tavern | Tavern brawl event (injury + fame gain) |
| bard | Bard's song event (fame gain) |
| winter | Winter chill event (gold cost for heating) |
| merchant | Merchant blessing event (gold donation) |
| fame_boost | Fame boost event (single warrior fame +25) |
| seasonal | src/test/engine/pipeline/seasonal.test.ts |
| passes | src/test/engine/pipeline/passes/SeasonalPass.test.ts |

## Commands

**Run all seasonal tests:**
```bash
bun run test --reporter=verbose src/test/engine/pipeline/seasonal.test.ts src/test/engine/pipeline/passes/SeasonalPass.test.ts
```

**Run with a filter (e.g. /pipeline-seasonal plague):**
```bash
bun run test --reporter=verbose -t "plague"
```

**Run seasonal pass tests:**
```bash
bun run test --reporter=verbose src/test/engine/pipeline/seasonal.test.ts
```

**Run specific event type tests:**
```bash
bun run test --reporter=verbose -t "fame_boost"
bun run test --reporter=verbose -t "grand_feast"
bun run test --reporter=verbose -t "epiphany"
```

**Run all pipeline passes:**
```bash
bun run test --reporter=verbose src/test/engine/pipeline/passes/
```

## Notes

- Seasonal pass triggers on transition to week 1 (off-season boundary)
- 9 offseason event types: fame_boost, winter_chill, merchant_blessing, epiphany, tavern_brawl, bards_song, plague_outbreak, black_market_raid, grand_feast
- Events use narrativeContent.json for event templates and narrative text
- Event impacts include: treasury changes, roster updates (injuries, fame, XP), newsletter items, ledger entries, insight tokens
- Insight tokens are generated for epiphany events with warrior-specific attribute discoveries
- Newsletter items track event narratives for player visibility
- Ledger entries track treasury changes for financial transparency
- Events are randomly selected each offseason with equal probability
- Test timeout is 30s (set in vitest.config.ts)
