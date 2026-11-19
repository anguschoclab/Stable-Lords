---
name: lint-code
description: Runs ESLint to check code quality and style
disable-model-invocation: true
---

Run ESLint over the codebase (from the repository root):

```bash
bun run lint        # eslint . — reports errors/warnings, exits non-zero on errors
bun run lint:fix    # autofix what's fixable
```

Unlike some repos, `bun run lint` here has no `|| true` — its exit code is the
real pass/fail signal.
