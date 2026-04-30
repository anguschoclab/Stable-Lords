---
name: ai-agent
description: Run AI/agent system tests for rival stable intelligence, intent recognition, budget management, and strategic decision-making.
disable-model-invocation: true
---

# ai-agent

Tests the Stable Lords AI agent system including intent recognition, skepticism logic, budget management, and worker subsystems.

## Usage

```
/ai-agent [filter]
```

## Test Groups

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | All AI agent tests |
| intent | src/test/engine/ai/intentEngine.test.ts |
| bankruptcy | src/test/engine/ai/bankruptcyService.test.ts |
| expansion | src/test/engine/ai/expansionService.test.ts |
| retirement | src/test/engine/ai/seasonalRetirementService.test.ts |
| workers | src/test/engine/ai/workers/*.test.ts |
| architecture | src/test/engine/agentArchitecture.test.ts |

## Commands

**Run all AI agent tests:**
```bash
bun run test --reporter=verbose src/test/engine/ai/ src/test/engine/agentArchitecture.test.ts
```

**Run with a filter (e.g. /ai-agent intent):**
```bash
bun run test --reporter=verbose -- <filter>
```

**Run intent recognition and skepticism tests:**
```bash
bun run test --reporter=verbose src/test/engine/ai/intentEngine.test.ts
```

**Run bankruptcy service tests:**
```bash
bun run test --reporter=verbose src/test/engine/ai/bankruptcyService.test.ts
```

**Run all worker tests:**
```bash
bun run test --reporter=verbose src/test/engine/ai/workers/
```

## Notes

- AI system implements "Skeptical Memory" and "Hierarchical Delegation" patterns
- Intent engine recognizes 7 intents: RECOVERY, VENDETTA, WEALTH_ACCUMULATION, AGGRESSIVE_EXPANSION, ROSTER_DIVERSITY, EXPANSION, CONSOLIDATION
- Skepticism verification checks financial crisis, roster depletion, meta hostility, and environmental hazards
- Workers handle budget, staff, roster, recruitment, and competition decisions
- Agent context includes meta-awareness from arena history and budget reports
- Test timeout is 30s (set in vitest.config.ts)
