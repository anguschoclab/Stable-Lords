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
 * KNOWN_SRC_PAIRS is the elimination ledger — it now enumerates exactly the
 * live pairs, each registered with its verdict category. NEW duplicate pairs
 * fail loudly; remove a pair from KNOWN_SRC_PAIRS as its cluster is deduped.
 */
const SRC_TO_SRC_BASELINE = 34;

const KNOWN_SRC_PAIRS = new Set([
  // ─── Page↔hook / barrel extraction seams — thin interface overlap (prop
  // destructuring, import preambles) across the shell↔extracted-module
  // boundary, not behavioral duplication. Established project pattern.
  'src/components/EventLog.tsx|src/components/eventLog/index.ts',
  'src/components/PlanBuilder.tsx|src/components/planBuilder/usePlanOrchestration.ts',
  'src/components/WarriorBuilder/hooks/useWarriorBuilderState.ts|src/components/WarriorBuilder/index.tsx',
  'src/components/scouting/ScoutIntelTab.tsx|src/pages/scouting/useScouting.ts',
  'src/components/scouting/StableComparison.tsx|src/hooks/useScoutingStableComparison.ts',
  'src/components/stable/RosterWarriorRow.tsx|src/hooks/useActiveRoster.ts',
  'src/components/tournaments/TournamentSchedule.tsx|src/hooks/useTournamentSchedule.ts',
  'src/pages/AdminTools/hooks/useAdminTools.ts|src/pages/AdminTools/index.tsx',
  'src/pages/ArenaDetail.tsx|src/pages/arenaDetail/useArenaDetail.ts',
  'src/pages/ControlCenter/components/RankingsBar.tsx|src/pages/ControlCenter/hooks/useControlCenter.ts',
  'src/pages/HallOfFame/hooks/useHallOfFame.ts|src/pages/HallOfFame/index.tsx',
  'src/pages/Scouting.tsx|src/pages/scouting/useScouting.ts',
  'src/pages/StartGame.tsx|src/pages/startGame/useStartGame.ts',
  'src/pages/Trainers.tsx|src/pages/Trainers/hooks/useTrainers.ts',
  'src/pages/WarriorDetail.tsx|src/pages/WarriorDetail/hooks/useWarriorDetail.ts',
  // bookmarks page seam: the hook owns the store slice + navigation, the pure
  // module owns row projection — same thin interface-overlap category.
  'src/pages/bookmarks/groupBookmarks.ts|src/pages/bookmarks/useBookmarkGroups.ts',

  // ─── Shard-boundary boilerplate — V11 file→directory splits carry the same
  // import preamble into orchestrator + sibling shards. Registered knowingly.
  'src/engine/combat/resolution/exchangeHelpers/execution/hitExecution/index.ts|src/engine/combat/resolution/exchangeHelpers/execution/hitExecution/killWindow.ts',
  'src/engine/combat/resolution/offenseDefense/index.ts|src/engine/combat/resolution/offenseDefense/prepare.ts',
  'src/engine/combat/resolution/offenseDefense/prepare.ts|src/engine/combat/resolution/offenseDefense/types.ts',
  'src/engine/simulate/simulationLoop/index.ts|src/engine/simulate/simulationLoop/types.ts',

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
  // Data barrel adjacency — items.ts is the per-item shard, weapons.ts the
  // curated registry; overlap is re-export/import preamble only.
  'src/data/equipment/weapons.ts|src/data/equipment/weapons/items.ts',
  // shadcn overlay boilerplate (portal+overlay+content skeleton) — vendor
  // component shape, not shared app logic.
  'src/components/ui/alert-dialog.tsx|src/components/ui/sheet.tsx',

  // ─── Related-but-divergent markup families (V12-D6 residual). These rows
  // share the selectable-row idiom but carry meaningfully different
  // layout/disabled/accent behavior; SelectableCard covers the two identical
  // sites — the rest are registered knowingly pending a wider primitive.
  'src/components/orphanage/PlanStep.tsx|src/components/planBuilder/TacticBank.tsx',
  'src/components/orphanage/PlanStep.tsx|src/components/planBuilder/sections.tsx',
  'src/components/scouting/StableSelector.tsx|src/components/scouting/components/WarriorSelector.tsx',
  'src/pages/BookingOffice/components/AssetRegistry.tsx|src/pages/TrainingPlanner/components/WarriorSelector.tsx',
  // shared shadcn Select/search toolbar boilerplate — different option domains
  // (recruit tier/style vs. rival list sorts), styling, and behavior.
  'src/components/scouting/rivalListShell.tsx|src/pages/Recruit/components/RecruitFilters.tsx',
  // Shared dashboard/settings card idiom — divergent content, same shell.
  'src/components/dashboard/BriefingTab.tsx|src/components/dashboard/GazetteTab.tsx',
  'src/components/layout/ArenaSettings.tsx|src/components/stable/FighterConfigCard.tsx',
]);

describe('megaplan: duplication guard', () => {
  const { clusters, counts } = collectDuplicates();
  const srcPairs = clusters.filter((c: { pair: string[] }) =>
    c.pair.every((f: string) => !f.includes('/test/') && !/\.(test|spec)\.tsx?$/.test(f))
  );

  it('src↔src duplicate pair count never exceeds baseline', () => {
    expect(counts.srcToSrc).toBeLessThanOrEqual(SRC_TO_SRC_BASELINE);
  });

  it('every src↔src pair is on the elimination list (no NEW duplication)', () => {
    const novel = srcPairs
      .map((c: { pair: string[] }) => `${c.pair[0]}|${c.pair[1]}`)
      .filter((p: string) => !KNOWN_SRC_PAIRS.has(p));
    expect(novel, 'new duplicate pairs introduced — dedupe or extend baseline knowingly').toEqual(
      []
    );
  });

  it('KNOWN_SRC_PAIRS stays pruned to live pairs (no stale entries)', () => {
    const live = new Set(srcPairs.map((c: { pair: string[] }) => `${c.pair[0]}|${c.pair[1]}`));
    const stale = [...KNOWN_SRC_PAIRS].filter((p) => !live.has(p));
    expect(
      stale,
      'KNOWN_SRC_PAIRS contains dead entries — remove them (list = live ledger)'
    ).toEqual([]);
  });
});
