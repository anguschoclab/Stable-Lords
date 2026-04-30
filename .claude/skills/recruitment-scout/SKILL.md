---
name: recruitment-scout
description: Run recruitment and scouting tests for warrior generation, genetic bloodlines, meta-aware style bias, and draft service logic.
disable-model-invocation: true
---

# recruitment-scout

Tests the recruitment and scouting systems including warrior generation by tier, genetic bloodline inheritance, meta-aware style bias, and draft service logic.

## Usage

```
/recruitment-scout [filter]
```

## Test Groups

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | All recruitment and scouting tests |
| generation | src/test/engine/recruitment.test.ts |
| bloodlines | Warrior generation with legacy/bloodline inheritance |
| draft | src/test/engine/draftService.test.ts |
| scouting | src/test/engine/scouting.test.ts |
| potential | src/test/engine/potential.test.ts |

## Commands

**Run all recruitment tests:**
```bash
bun run test --reporter=verbose src/test/engine/recruitment.test.ts src/test/engine/scouting.test.ts src/test/engine/draftService.test.ts src/test/engine/potential.test.ts
```

**Run with a filter (e.g. /recruitment-scout generation):**
```bash
bun run test --reporter=verbose -- <filter>
```

**Run recruitment generation tests:**
```bash
bun run test --reporter=verbose src/test/engine/recruitment.test.ts
```

**Run scouting tests:**
```bash
bun run test --reporter=verbose src/test/engine/scouting.test.ts
```

**Run draft service tests:**
```bash
bun run test --reporter=verbose src/test/engine/draftService.test.ts
```

**Run potential tests:**
```bash
bun run test --reporter=verbose src/test/engine/potential.test.ts
```

## Notes

- Recruitment tiers: Common (5%), Promising (30%), Exceptional (20%), Prodigy (5%)
- Genetic bloodlines: 5% chance to be a legacy recruit with parent warrior's style and lineage
- Meta-aware recruitment: style distribution biased by current meta-drift (styles doing well appear more often)
- Name uniqueness: names are checked against used names set to prevent duplicates
- Archetype matching: warrior names are drawn from archetype-specific pools for thematic fit
- Draft service: AI stables auto-draft warriors based on budget, roster needs, and strategy
- Pool management: partial refresh replaces oldest 3-4 warriors weekly, hard cap at 36 entries
- Trait generation: 0-2 traits per warrior, weighted by rarity and archetype synergy
- Test timeout is 30s (set in vitest.config.ts)
