---
name: test-coverage
description: Runs tests with coverage reporting
disable-model-invocation: true
---

Run the fast suite with v8 coverage reporting to identify untested code (from
the repository root):

```bash
bun run test:coverage
```

Coverage thresholds — the ratchet floor enforced in `vitest.config.ts`:
statements 84 / branches 74 / functions 78 / lines 85.5. The run covers the
fast tier only — `*.slow.test.*` files are excluded. Floors fail the build;
raising them after coverage genuinely improves is the ratchet move.
