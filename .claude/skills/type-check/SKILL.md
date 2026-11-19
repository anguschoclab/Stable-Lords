---
name: type-check
description: Runs TypeScript type checking (routeTree regen + typescript7 build)
disable-model-invocation: true
---

Run the repo's type-check pipeline (from the repository root):

```bash
bun run type-check
```

Note this is **not** a bare `tsc --noEmit`: it first regenerates
`routeTree.gen.ts` via `bunx tsr generate` (TanStack Router), then runs
`node node_modules/typescript7/bin/tsc --build --force`. Route changes need
the regen step — run the script, not `tsc` directly.
