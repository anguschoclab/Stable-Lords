---
name: integration-autosim
description: Run autosim and week-advancement integration tests, including per-week stops, cancellation, offer parity, and deterministic advancement.
disable-model-invocation: true
---

# Autosim integration runner

The authority is `src/engine/autosim/autosim.ts`: one sequential loop checks
stops **every week**. Quarter-batched advancement was removed. Week one clones
the input; later iterations use autosim-owned state with `mutableInput`.

Player offers use the shared rival `evaluateBoutOffer` evaluator, not a
hype/purse threshold. Counter verdicts are declined. Council autopilot instead
applies council decisions. Completion, cancellation, and stops use the terminal
tournament sweep. Bankruptcy uses `BANKRUPTCY_THRESHOLD`; inspect the source for
current stop-reason mapping rather than equating raw stop keys with result keys.

```bash
bun run test --reporter=verbose "src/test/engine/autosim/" "src/test/engine/weekPipeline.test.ts"
bun run test:slow "src/test/integration/autosim.slow.test.ts" "src/test/integration/weekAdvancement.slow.test.ts"
bun run test:slow "src/test/integration/livingWorld.slow.test.ts" "src/test/integration/worldLiveness.slow.test.ts"
```

These slow flows are deliberate checks for autosim/pipeline changes, not routine
verification for unrelated work. `determinism-debug` owns seed triage;
`week-pipeline` owns passes; `add-player-action` owns worker entry points;
`run-all-tests` and `run-domain-tests` own runner conventions and filtering.
