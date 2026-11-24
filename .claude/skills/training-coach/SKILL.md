---
name: training-coach
description: Run training, recovery, trainers, facilities, and learn/burn tests. Growth mechanics are documented in warrior-development.
disable-model-invocation: true
---

# Training test runner

`warrior-development` owns growth rules, caps, favorites, and breakpoint burn;
`week-pipeline` owns weekly processing. This runner owns only test selection.

```bash
bun run test --reporter=verbose "src/test/engine/training/" "src/test/engine/trainers.test.ts" "src/test/engine/trainerSpecialties.test.ts" "src/test/engine/trainerAging.test.ts" "src/test/engine/injuries.test.ts" "src/test/engine/injuries/" "src/test/engine/learning/"
```

For narrow work choose a real file such as
`src/test/engine/training/trainingGains.test.ts`,
`src/test/engine/training/skillDrillParity.test.ts`, or
`src/test/engine/learning/trainsBurn.test.ts`. `-t "pattern"` filters titles
inside those paths; see `run-domain-tests`.

`traitTraining.integration.slow.test.ts` requires `bun run test:slow`, not the
fast runner. Do not repeat fixed timeout/environment claims here:
`run-all-tests` owns runner defaults and `write-engine-test` owns authoring.
