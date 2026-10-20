import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectDuplicates } from '../../../scripts/dup-scan.mjs';

/**
 * Duplication guard — megaplan Phase-4 ratchet.
 *
 * Baseline (2026-09-27, exact-normalized, 8-line blocks): 967 pair-clusters —
 * 84 src↔src, 780 test↔test, 103 mixed.
 *
 * Rebaselined during Phase 3 (130 src↔src), then V11 Phase-4 dedupe brought
 * the live count to 43; MEGAPLAN-V12 (D1–D11 consolidation) brought it to 32.
 * V17 whole-repo prettier pass normalized line/quote formatting, which
 * unmasked 9 latent parallel-boilerplate pairs → 36.
 *
 * V18 triage split the ledger in two (validated per-pair against source):
 *   EXEMPT_PAIRS — permanent structural overlap (prop-name echoes, shard
 *     barrels, vendor/parallel implementations). Registered knowingly, not
 *     dedupe targets.
 *   DEBT_PAIRS — genuine cloned logic slated for elimination. Drains to
 *     zero; each dedup commit removes its entries.
 * NEW duplicate pairs fail loudly; a pair leaving either set must be dead
 * on the scan (the stale-entries test enforces the live-ledger invariant).
 */
const SRC_TO_SRC_BASELINE = 36;

const EXEMPT_PAIRS = new Set([
  // ─── Page↔hook / barrel extraction seams — thin interface overlap (prop
  // destructuring, import preambles) across the shell↔extracted-module
  // boundary, not behavioral duplication. Established project pattern.
  'src/components/EventLog.tsx|src/components/eventLog/index.ts',
  'src/components/PlanBuilder.tsx|src/components/planBuilder/usePlanOrchestration.ts',
  'src/components/WarriorBuilder/hooks/useWarriorBuilderState.ts|src/components/WarriorBuilder/index.tsx',
  'src/pages/TrainingPlanner/hooks/useTrainingPlanner.ts|src/pages/TrainingPlanner/index.tsx',
  'src/components/scouting/StableComparison.tsx|src/hooks/useScoutingStableComparison.ts',
  'src/components/stable/RosterWarriorRow.tsx|src/hooks/useActiveRoster.ts',
  'src/components/tournaments/TournamentSchedule.tsx|src/hooks/useTournamentSchedule.ts',
  'src/pages/AdminTools/hooks/useAdminTools.ts|src/pages/AdminTools/index.tsx',
  'src/pages/ControlCenter/components/RankingsBar.tsx|src/pages/ControlCenter/hooks/useControlCenter.ts',
  'src/pages/HallOfFame/hooks/useHallOfFame.ts|src/pages/HallOfFame/index.tsx',
  'src/pages/Scouting.tsx|src/pages/scouting/useScouting.ts',
  'src/pages/StartGame.tsx|src/pages/startGame/useStartGame.ts',
  'src/pages/Trainers.tsx|src/pages/Trainers/hooks/useTrainers.ts',
  'src/pages/WarriorDetail.tsx|src/pages/WarriorDetail/hooks/useWarriorDetail.ts',

  // ─── Shard-boundary boilerplate — file→directory splits carry the same
  // import preamble into orchestrator + sibling shards. Registered knowingly.
  'src/engine/combat/resolution/exchangeHelpers/execution/hitExecution/index.ts|src/engine/combat/resolution/exchangeHelpers/execution/hitExecution/killWindow.ts',
  'src/engine/combat/resolution/offenseDefense/index.ts|src/engine/combat/resolution/offenseDefense/prepare.ts',
  'src/engine/combat/resolution/offenseDefense/prepare.ts|src/engine/combat/resolution/offenseDefense/types.ts',
  'src/engine/simulate/simulationLoop/index.ts|src/engine/simulate/simulationLoop/types.ts',
  // Data barrel adjacency — items.ts is the per-item shard, weapons.ts the
  // curated registry; overlap is re-export/import preamble only.
  'src/data/equipment/weapons.ts|src/data/equipment/weapons/items.ts',

  // ─── Intentional parallel implementations / ordered design data.
  // crestGenerator↔enumSources: post-V12-D4 the generator's per-tier lists are
  // ordered pick-tables whose sequence is load-bearing for rollWeighted —
  // they legitimately re-state the canonical literals as design data.
  'src/engine/crest/crestGenerator.ts|src/types/enumSources.ts',
  // Parallel storage backends (Electron IPC vs OPFS) share the persistence
  // scaffold — different environments, same contract shape.
  'src/engine/storage/electronArchive.ts|src/engine/storage/opfsArchive/service.ts',
  // Nav shell is intentionally rendered twice (desktop rail vs mobile sheet).
  'src/components/layout/LeftNav.tsx|src/components/layout/MobileNav.tsx',
  // shadcn overlay boilerplate (portal+overlay+content skeleton) — vendor
  // component shape, not shared app logic.
  'src/components/ui/alert-dialog.tsx|src/components/ui/sheet.tsx',
  // shared shadcn Select/search toolbar boilerplate — different option domains
  // (recruit tier/style vs. list sorts), styling, and behavior. The toolbar
  // moved scouting/rivalListShell → ui/ListToolbar when lists adopted it.
  'src/components/ui/ListToolbar.tsx|src/pages/Recruit/components/RecruitFilters.tsx',
  // Shared dashboard/settings card idiom — divergent content, same shell.
  'src/components/dashboard/BriefingTab.tsx|src/components/dashboard/GazetteTab.tsx',
  'src/components/layout/ArenaSettings.tsx|src/components/stable/FighterConfigCard.tsx',
  // Warrior-card avatar block idiom — the sm-size AvatarForEntity + adjacent
  // flex wrapper is a shared display pattern, not behavioral duplication.
  'src/components/stable/StableRosterTab.tsx|src/components/stable/VeteranReassignmentDialog.tsx',
]);

// ─── DEBT — genuine cloned logic, drain to zero. V17's whole-repo prettier
// pass normalized quote style and line wrapping across already-parallel
// handlers, surfacing 8-line blocks that prior formatting differences had
// masked. All 9 drained: statGrantOutcome/makeMinorInjury (7 offseason
// pairs), DriftParticles (weather particle JSX), rivalFightPlan (rival-plan
// grudge+aiPlan tail).
const DEBT_PAIRS = new Set<string>([]);

describe('megaplan: duplication guard', () => {
  const { clusters, counts } = collectDuplicates();
  const srcPairs = clusters.filter((c: { pair: string[] }) =>
    c.pair.every((f: string) => !f.includes('/test/') && !/\.(test|spec)\.tsx?$/.test(f))
  );
  const REGISTERED = new Set([...EXEMPT_PAIRS, ...DEBT_PAIRS]);

  it('src↔src duplicate pair count never exceeds baseline', () => {
    expect(counts.srcToSrc).toBeLessThanOrEqual(SRC_TO_SRC_BASELINE);
  });

  it('every src↔src pair is registered (no NEW duplication)', () => {
    const novel = srcPairs
      .map((c: { pair: string[] }) => `${c.pair[0]}|${c.pair[1]}`)
      .filter((p: string) => !REGISTERED.has(p));
    expect(novel, 'new duplicate pairs introduced — dedupe or register knowingly').toEqual([]);
  });

  it('registered pairs stay pruned to live pairs (no stale entries)', () => {
    const live = new Set(srcPairs.map((c: { pair: string[] }) => `${c.pair[0]}|${c.pair[1]}`));
    const stale = [...REGISTERED].filter((p) => !live.has(p));
    expect(
      stale,
      'EXEMPT_PAIRS/DEBT_PAIRS contain dead entries — remove them (live ledger)'
    ).toEqual([]);
  });

  it('DEBT_PAIRS drains — size never exceeds its remaining budget', () => {
    expect(DEBT_PAIRS.size).toBeLessThanOrEqual(9);
  });
});
