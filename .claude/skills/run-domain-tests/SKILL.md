---
name: run-domain-tests
description: Runs tests for a specific domain directory without the full suite
disable-model-invocation: true
---

Run tests for one domain without the full suite (from the repository root):

```bash
bun run test --reporter=verbose src/test/<domain>/
```

`src/test/` mirrors the production tree — useful targets:

```bash
bun run test --reporter=verbose src/test/engine/combat/     # combat resolution
bun run test --reporter=verbose src/test/engine/bout/       # bout lifecycle
bun run test --reporter=verbose src/test/engine/pipeline/   # week pipeline
bun run test --reporter=verbose src/test/engine/economy/    # economy
bun run test --reporter=verbose src/test/engine/training/   # training
bun run test --reporter=verbose src/test/engine/narrative/  # narration
bun run test --reporter=verbose src/test/state/             # store slices
bun run test --reporter=verbose src/test/megaplan/          # guard specs
bun run test --reporter=verbose src/test/integration/       # multi-week flows (mostly .slow)
```

- Filter by title instead: `bun run test --reporter=verbose -t "pattern"`.
- Slow-tier files need the slow config: `bun run test:slow <path>`.
- Curated per-domain filter maps live in the runner skills: `combat-sim`,
  `ai-agent`, `training-coach`, `recruitment-scout`, `tournament-bracket`,
  `pipeline-seasonal`, `integration-autosim`, `economy-balance`,
  `narrative-validate`.
