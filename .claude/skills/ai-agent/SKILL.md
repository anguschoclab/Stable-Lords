---
name: ai-agent
description: Run focused rival-AI tests for intent, memory, budgets, staffing, recruitment, competition, and tournament decisions. For implementation use rival-ai.
disable-model-invocation: true
---

# AI test runner

This is the test entry point, not an autonomous improvement agent. For the
implementation map and shared perception/cache rules, read `rival-ai`.
`run-all-tests` owns runner/environment conventions; `run-domain-tests` owns
path/title filtering. Resolve a supplied keyword to a real path before running.

```bash
bun run test --reporter=verbose "src/test/engine/ai/"
bun run test --reporter=verbose "src/test/engine/ai/workers/"
bun run test --reporter=verbose "src/test/engine/ai/intentEngine.test.ts"
bun run test --reporter=verbose "src/test/engine/ai/bankruptcyService.test.ts"
```

Use `-t "pattern"` in the selected directory for a test-title filter, not a
fictional keyword-to-file mapping. Add owner/recruitment/pipeline tests when the
change crosses those boundaries. Never launch specialist agents or commit their
changes merely because this runner was invoked.
