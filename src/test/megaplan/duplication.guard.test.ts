import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectDuplicates } from '../../../scripts/dup-scan.mjs';

/**
 * Duplication guard — megaplan Phase-4 ratchet.
 *
 * Baseline (2026-09-27, exact-normalized, 8-line blocks): 967 pair-clusters —
 * 84 src↔src, 780 test↔test, 103 mixed. The guard asserts the src↔src
 * count never grows, and enumerates every known src↔src pair so NEW
 * duplicate pairs fail loudly. Remove a pair from KNOWN_SRC_PAIRS as its
 * cluster is deduped (the list is the Phase-4 elimination list).
 */
const SRC_TO_SRC_BASELINE = 84;

const KNOWN_SRC_PAIRS = new Set([
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/chaosHandlers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/injuryHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers.ts',
  'src/schemas/schemaEnums.ts|src/types/enumSources.ts',
  'src/engine/pipeline/seasonal.ts|src/engine/pipeline/seasonalHandlers.ts',
  'src/components/dashboard/BriefingTab.tsx|src/components/dashboard/GazetteTab.tsx',
  'src/components/dashboard/BriefingTab.tsx|src/components/gazette/GazetteArticle.tsx',
  'src/components/dashboard/GazetteTab.tsx|src/components/gazette/GazetteArticle.tsx',
  'src/engine/rivals/rivalNamePool.ts|src/engine/trainers/trainers.ts',
  'src/components/dashboard/ActionTimeline.tsx|src/components/dashboard/BriefingTab.tsx',
  'src/components/dashboard/ActionTimeline.tsx|src/components/dashboard/GazetteTab.tsx',
  'src/components/dashboard/ActionTimeline.tsx|src/components/gazette/GazetteArticle.tsx',
  'src/components/orphanage/PlanStep.tsx|src/components/orphanage/WarriorSelectionStep.tsx',
  'src/engine/storage/electronArchive.ts|src/engine/storage/opfsArchive/types.ts',
  'src/components/scouting/StableComparison.tsx|src/hooks/useScoutingStableComparison.ts',
  'src/engine/owner/grudges.ts|src/engine/rivals/rivalUtils.ts',
  'src/pages/AdminTools/hooks/useAdminTools.ts|src/pages/AdminTools/index.tsx',
  'src/pages/BookingOffice/hooks/useBookingOffice.ts|src/pages/BookingOffice/index.tsx',
  'src/pages/ControlCenter/components/RankingsBar.tsx|src/pages/ControlCenter/hooks/useControlCenter.ts',
  'src/pages/Trainers.tsx|src/pages/Trainers/hooks/useTrainers.ts',
  'src/components/arena/weather/effects/heatEffects.tsx|src/components/arena/weather/effects/windEffects.tsx',
  'src/components/scouting/StableSelector.tsx|src/components/scouting/components/WarriorSelector.tsx',
  'src/components/WarriorBuilder/hooks/useWarriorBuilderState.ts|src/components/WarriorBuilder/index.tsx',
  'src/components/orphanage/FirstBloodStep.tsx|src/components/orphanage/PlanStep.tsx',
  'src/components/ledger/InsightManager/hooks/useInsightManager.ts|src/components/ledger/InsightManager/index.tsx',
  'src/components/stable/RosterWarriorRow.tsx|src/hooks/useActiveRoster.ts',
  'src/components/warrior/AttributeRow.tsx|src/components/warrior/attributeRowState.ts',
  'src/pages/WarriorDetail.tsx|src/pages/WarriorDetail/hooks/useWarriorDetail.ts',
  'src/components/gazette/GazetteLeaderboards.tsx|src/components/ledger/TreasuryOverview.tsx',
  'src/components/orphanage/IdentityStep.tsx|src/components/orphanage/WarriorSelectionStep.tsx',
  'src/components/warrior/favorites/BioRhythmSection.tsx|src/components/warrior/favorites/WeaponAffinitySection.tsx',
  'src/engine/bout/services/boutResolution.ts|src/engine/matchmaking/tournamentSelection/utils.ts',
  'src/engine/crest/crestGenerator.ts|src/schemas/schemaEnums.ts',
  'src/engine/crest/crestGenerator.ts|src/types/enumSources.ts',
  'src/pages/HallOfFame/hooks/useHallOfFame.ts|src/pages/HallOfFame/index.tsx',
  'src/components/gazette/GazetteLeaderboards.tsx|src/pages/ArenaHub.tsx',
  'src/pages/ArenaDetail.tsx|src/pages/ArenaHub.tsx',
  'src/components/layout/LeftNav.tsx|src/components/layout/MobileNav.tsx',
  'src/pages/ArenaDetail.tsx|src/pages/StartGame.tsx',
  'src/components/orphanage/StoryBeginsStep.tsx|src/components/startGame/NewGameForm.tsx',
  'src/data/terrabloodCharts.ts|src/engine/warrior/skillCalc.ts',
  'src/components/layout/ResetDialog.tsx|src/pages/ArenaDetail.tsx',
  'src/components/layout/ResetDialog.tsx|src/pages/StartGame.tsx',
  'src/components/EventLog.tsx|src/components/eventLog/index.ts',
  'src/components/gazette/GazetteLeaderboards.tsx|src/pages/ArenaDetail.tsx',
  'src/components/ledger/TreasuryOverview.tsx|src/pages/ArenaDetail.tsx',
  'src/components/ledger/TreasuryOverview.tsx|src/pages/ArenaHub.tsx',
  'src/components/orphanage/FirstBloodStep.tsx|src/components/orphanage/WarriorSelectionStep.tsx',
  'src/components/scouting/ScoutIntelTab.tsx|src/pages/Scouting.tsx',
  'src/components/stable/LiabilityBadge.tsx|src/components/stable/PotentialBadge.tsx',
  'src/components/tournaments/TournamentSchedule.tsx|src/hooks/useTournamentSchedule.ts',
  'src/schemas/fightSchemas.ts|src/schemas/gameStateSchema.ts',
  'src/components/EntityLink.tsx|src/components/warrior/WarriorFightHistory.tsx',
  'src/components/arena/weather/effects/miscEffects.tsx|src/components/arena/weather/effects/stormEffects.tsx',
  'src/components/arena/weather/effects/miscEffects.tsx|src/components/arena/weather/effects/windEffects.tsx',
  'src/components/arena/weather/effects/stormEffects.tsx|src/components/arena/weather/effects/windEffects.tsx',
  'src/components/bout-viewer/FightAnalysisPanel.tsx|src/components/bout-viewer/FightForecastPanel.tsx',
  'src/components/charts/StyleMeterTable.tsx|src/components/scouting/components/DominantCombatantsSection.tsx',
  'src/components/gazette/GazetteLeaderboards.tsx|src/components/ledger/HallOfWarriors.tsx',
  'src/components/ledger/HallOfWarriors.tsx|src/components/ledger/TreasuryOverview.tsx',
  'src/components/ledger/HallOfWarriors.tsx|src/pages/ArenaDetail.tsx',
  'src/components/ledger/HallOfWarriors.tsx|src/pages/ArenaHub.tsx',
  'src/components/layout/ArenaSettings.tsx|src/components/stable/FighterConfigCard.tsx',
  'src/components/orphanage/FirstBloodStep.tsx|src/components/orphanage/IdentityStep.tsx',
  'src/components/orphanage/IdentityStep.tsx|src/components/orphanage/PlanStep.tsx',
  'src/components/orphanage/PlanStep.tsx|src/components/planBuilder/TacticBank.tsx',
  'src/components/scouting/RivalWarriorList.tsx|src/components/scouting/ScoutIntelTab.tsx',
  'src/components/scouting/components/AttributeComparison.tsx|src/components/scouting/components/AverageAttributesSection.tsx',
  'src/components/stable/LegacyMentorsTab.tsx|src/components/stable/StableRosterTab.tsx',
  'src/components/ui/alert-dialog.tsx|src/components/ui/sheet.tsx',
  'src/engine/bout/fighterState.ts|src/engine/combat/mechanics/simulateHelpers.ts',
  'src/engine/factories/warriorFactory.ts|src/engine/owner/roster/recruitGenerator.ts',
  'src/engine/factories/warriorFactory.ts|src/engine/pipeline/passes/SystemPass.ts',
  'src/engine/owner/roster/recruitGenerator.ts|src/engine/pipeline/passes/SystemPass.ts',
  'src/engine/storage/electronArchive.ts|src/engine/storage/opfsArchive/service.ts',
  'src/engine/storage/opfsArchive/service.ts|src/scripts/nodeArchiveService.ts',
  'src/pages/ArenaCircuit.tsx|src/pages/ArenaHub.tsx',
  'src/pages/BookingOffice/components/AssetRegistry.tsx|src/pages/TrainingPlanner/components/WarriorSelector.tsx',
  'src/pages/ControlCenter/hooks/useControlCenter.ts|src/pages/ControlCenter/index.tsx',
  'src/pages/ImportExport.tsx|src/pages/Mods.tsx',
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
    expect(novel, 'new duplicate pairs introduced — dedupe or extend baseline knowingly').toEqual([]);
  });
});
