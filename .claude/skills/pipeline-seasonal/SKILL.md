---
name: pipeline-seasonal
description: Run seasonal pass, offseason handler coverage, and event determinism tests. Event authoring belongs to offseason-event.
disable-model-invocation: true
---

# Seasonal pipeline runner

`offseason-event` owns the data/type/handler/registry recipe; `week-pipeline`
owns weekly wiring. Read those rather than duplicating event counts or contracts
here. Events live in `src/data/narrative/offseason.json`, not a monolithic
narrativeContent.json. `runSeasonalPass` selects one event key at the transition
to week 1; handlers can legitimately no-op when eligibility conditions fail.

```bash
bun run test --reporter=verbose "src/test/engine/pipeline/passes/SeasonalPass.test.ts" "src/test/engine/pipeline/offseasonDeterminism.test.ts" "src/test/data/seasonalEventHandlerCoverage.test.ts"
bun run test --reporter=verbose "src/test/engine/pipeline/"
```

The second command is the broader fast pipeline suite, including individual
event specs such as `elegyForTheFallen.test.ts`. Resolve a supplied event keyword
to its test file or a verified test title; do not pass shell globs that only
happen to expand on one platform. `run-domain-tests` owns filtering conventions.
