---
name: tournament-bracket
description: Run tournament class/freeze, bracket, resolution, sweep, consequence, and store tests. Implementation guidance lives in tournament-cycle.
disable-model-invocation: true
---

# Tournament test runner

Read `tournament-cycle` for FE classes, freezes, multi-bracket emission,
resolution consequences, and terminal sweeps. This runner does not define those
rules. A fixed 'semifinals are Round 5' claim is not valid for every field size.

```bash
bun run test --reporter=verbose "src/test/engine/matchmaking/tournament/" "src/test/engine/matchmaking/tournamentSelection/" "src/test/engine/matchmaking/tournamentResolution.test.ts" "src/test/engine/championship/championsTournament.test.ts" "src/test/state/slices/tournamentSlice.test.ts" "src/test/state/tournamentCycleSerialization.test.ts"
```

Narrow targets in the selection directory include `classes.test.ts`,
`freeze.test.ts`, `feAccrual.test.ts`, `multiBracketDay.test.ts`,
`consequenceParity.test.ts`, and `sweep.test.ts`. For season/week advancement:

```bash
bun run test:slow "src/test/integration/championshipAdvanceWeek.slow.test.ts"
```

Use the slow tier only for relevant lifecycle changes. `run-all-tests` and
`run-domain-tests` own runner/environment and filtering conventions.
