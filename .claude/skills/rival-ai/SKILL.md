---
name: rival-ai
description: Work on rival-stable AI — the LeadAgent orchestrator, skeptical memory, once-per-tick shared perception, and the worker subsystems (budget, staff, roster, recruitment, competition, tournament, crown, intel). Use whenever touching src/engine/ai, rival decisions, intent selection, dossiers/intel, grudges/bloodfeud targeting, tourney draft bias, or AI/player parity questions — maps the createAgentContext → intent → workers flow, the perception snapshot contract (build once in RivalStrategyPass, never re-scan world collections per rival), and the traps (meta is lagged per owner, asymmetries are adjudicated house rules, shard determinism).
---

# Rival AI Domain

Each rival stable runs a **LeadAgent** turn every week inside
`RivalStrategyPass` (`src/engine/pipeline/passes/`). The shape:
`createAgentContext` → intent selection → worker delegation → StateImpact.

## Architecture

- **Orchestrator:** `src/engine/ai/agentCore.ts` — `createAgentContext` builds
  the `AgentContext` (`rival`, `state`, `meta`, `playerThreatLevel`,
  `perception?`). Implements "Skeptical Memory" (persisted `agentMemory` on the
  rival: `lastTreasury`, `burnRate`, `metaAwareness`, `knownRivals`,
  `opponentDossiers`, `currentIntent`) and "Hierarchical Delegation" (workers
  own decisions).
- **Intents** — canonical list in `src/types/enumSources.ts` (`AI_INTENTS`);
  engine in `src/engine/ai/intentEngine/`. Skepticism checks (financial crisis,
  roster depletion, meta hostility) can demote a proposed intent.
- **Workers** (`src/engine/ai/workers/`): `budgetWorker`, `staffWorker`,
  `rosterWorker` (+ `rosterWorkerTraining`, `rosterWorkerEquipment`),
  `recruitmentWorker`, `competitionWorker/` (boutAcceptance, boutBidding
  conversion/generation, offerProcessor), `tournamentWorker`, `crownWorker`,
  `intelWorker`.
- **Plans & doctrine:** `src/engine/ai/plan/` (`coreGenerator/`, `doctrine`,
  `modifiers`, `strategicLayer`, `phasePlanner`, `strategyLab`, `agentPlan`),
  `src/engine/ai/matchup/` (`canonTargeting`, `styleMatcher`),
  `src/engine/ai/turnaround.ts`, `src/engine/ai/traitPolicy.ts`.
- **Memory:** `memory/intelDossier.ts`, `memory/perceptionSnapshot.ts`,
  `memory/seasonRecord.ts`.
- **Lifecycle:** `stableManager.ts`, `bankruptcyService.ts`,
  `expansionService.ts`, `seasonalRetirementService.ts`.

## The perception contract — the part people get wrong

`PerceptionSnapshot` (`memory/perceptionSnapshot.ts`) is built **once per tick**
in `RivalStrategyPass` and shared by every rival. It carries `weekFights`,
`meta`/`laggedMetaByLag`, `threatByStableId`, `knownRivalOwnerIds`,
`titleOffers`, bookable pools, and other pre-indexed views. Recent B5/B6 perf
work exists precisely because rivals used to re-scan `state.rivals ×
arenaHistory` each — **never rebuild a world view inside a per-rival loop**;
extend the snapshot instead (see `perf-audit` for the once-per-tick rubric).

- **Meta is a belief, not omniscience** — `metaLagWeeks`: only `Methodical`
  owners see current meta; others perceive `laggedMetaByLag` (1–2 weeks old).
- **Threat/dossiers are perception-fed** — `computePlayerThreatLevel`,
  `updateDossiers` read `perception.weekFights`, not fresh scans.

## Traps

- **AI/player asymmetry is intentional** — adjudicated house rules in
  `docs/MEGAPLAN_BACKLOG.md` §3 (e.g. `AI_TRAINING_EFFECTIVENESS`). Don't "fix".
- **Player-offer parity** — autosim evaluates player offers with the _same_
  `evaluateBoutOffer` rivals use (`src/engine/autosim/autosim.ts` presents the
  stable through a rival-shaped adapter). New offer logic must keep that parity.
- **Determinism** — shard execution must reduce deterministically;
  `parallelDeterminism`/`shardInputSize` gate it. Per-entity draws key off
  `hashStr(entity.id)` — renaming entities changes streams
  (`determinism-debug`).
- **Grudges/bloodfeud** — matchmaking-side mechanics live in
  `src/engine/matchmaking/` (`grudgeMatches`, `bloodfeud`, `rivalryLogic`),
  not in `ai/`; read both when touching vendetta behavior.

## Verify

`ai-agent` (runner) maps the focused test dirs; `stable-management` for roster
moves, `week-pipeline` for the pass contract, `recruitment-scout` for draft.
