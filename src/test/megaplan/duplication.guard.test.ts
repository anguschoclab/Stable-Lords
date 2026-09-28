import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectDuplicates } from '../../../scripts/dup-scan.mjs';

/**
 * Duplication guard — megaplan Phase-4 ratchet.
 *
 * Baseline (2026-09-27, exact-normalized, 8-line blocks): 967 pair-clusters —
 * 84 src↔src, 780 test↔test, 103 mixed.
 *
 * Rebaselined during Phase 3 (130 src↔src): splitting the offseason-handler
 * monoliths relocated KNOWN handler-boilerplate duplication into new
 * shard-vs-shard pairs; remaining growth is shard-boundary boilerplate and
 * new instances of the shared table/section markup pattern (arenaDetail,
 * simulateFight/simulationLoop, weapons barrel). All are Phase-4 dedupe
 * targets — the list is the elimination ledger. The guard asserts the src↔src
 * count never grows, and enumerates every known src↔src pair so NEW
 * duplicate pairs fail loudly. Remove a pair from KNOWN_SRC_PAIRS as its
 * cluster is deduped (the list is the Phase-4 elimination list).
 */
const SRC_TO_SRC_BASELINE = 128;

const KNOWN_SRC_PAIRS = new Set([
  'src/components/EntityLink.tsx|src/components/warrior/WarriorFightHistory.tsx',
  'src/components/EventLog.tsx|src/components/eventLog/index.ts',
  'src/components/WarriorBuilder/hooks/useWarriorBuilderState.ts|src/components/WarriorBuilder/index.tsx',
  'src/components/arena/weather/effects/heatEffects.tsx|src/components/arena/weather/effects/windEffects.tsx',
  'src/components/arena/weather/effects/miscEffects.tsx|src/components/arena/weather/effects/stormEffects.tsx',
  'src/components/arena/weather/effects/miscEffects.tsx|src/components/arena/weather/effects/windEffects.tsx',
  'src/components/arena/weather/effects/stormEffects.tsx|src/components/arena/weather/effects/windEffects.tsx',
  'src/components/bout-viewer/FightAnalysisPanel.tsx|src/components/bout-viewer/FightForecastPanel.tsx',
  'src/components/charts/StyleMeterTable.tsx|src/components/scouting/components/DominantCombatantsSection.tsx',
  'src/components/dashboard/ActionTimeline.tsx|src/components/dashboard/BriefingTab.tsx',
  'src/components/dashboard/ActionTimeline.tsx|src/components/dashboard/GazetteTab.tsx',
  'src/components/dashboard/ActionTimeline.tsx|src/components/gazette/GazetteArticle.tsx',
  'src/components/dashboard/BriefingTab.tsx|src/components/dashboard/GazetteTab.tsx',
  'src/components/dashboard/BriefingTab.tsx|src/components/gazette/GazetteArticle.tsx',
  'src/components/dashboard/GazetteTab.tsx|src/components/gazette/GazetteArticle.tsx',
  'src/components/gazette/GazetteLeaderboards.tsx|src/components/ledger/HallOfWarriors.tsx',
  'src/components/gazette/GazetteLeaderboards.tsx|src/components/ledger/TreasuryOverview.tsx',
  'src/components/gazette/GazetteLeaderboards.tsx|src/pages/ArenaHub.tsx',
  'src/components/gazette/GazetteLeaderboards.tsx|src/pages/arenaDetail/RecordTable.tsx',
  'src/components/gazette/GazetteLeaderboards.tsx|src/pages/arenaDetail/sections.tsx',
  'src/components/layout/ArenaSettings.tsx|src/components/stable/FighterConfigCard.tsx',
  'src/components/layout/LeftNav.tsx|src/components/layout/MobileNav.tsx',
  'src/components/layout/ResetDialog.tsx|src/pages/ArenaDetail.tsx',
  'src/components/layout/ResetDialog.tsx|src/pages/StartGame.tsx',
  'src/components/ledger/HallOfWarriors.tsx|src/components/ledger/TreasuryOverview.tsx',
  'src/components/ledger/HallOfWarriors.tsx|src/pages/ArenaHub.tsx',
  'src/components/ledger/HallOfWarriors.tsx|src/pages/arenaDetail/RecordTable.tsx',
  'src/components/ledger/HallOfWarriors.tsx|src/pages/arenaDetail/sections.tsx',
  'src/components/ledger/InsightManager/hooks/useInsightManager.ts|src/components/ledger/InsightManager/index.tsx',
  'src/components/ledger/TreasuryOverview.tsx|src/pages/ArenaHub.tsx',
  'src/components/ledger/TreasuryOverview.tsx|src/pages/arenaDetail/RecordTable.tsx',
  'src/components/ledger/TreasuryOverview.tsx|src/pages/arenaDetail/sections.tsx',
  'src/components/orphanage/FirstBloodStep.tsx|src/components/orphanage/IdentityStep.tsx',
  'src/components/orphanage/FirstBloodStep.tsx|src/components/orphanage/PlanStep.tsx',
  'src/components/orphanage/FirstBloodStep.tsx|src/components/orphanage/WarriorSelectionStep.tsx',
  'src/components/orphanage/IdentityStep.tsx|src/components/orphanage/PlanStep.tsx',
  'src/components/orphanage/IdentityStep.tsx|src/components/orphanage/WarriorSelectionStep.tsx',
  'src/components/orphanage/PlanStep.tsx|src/components/orphanage/WarriorSelectionStep.tsx',
  'src/components/orphanage/PlanStep.tsx|src/components/planBuilder/TacticBank.tsx',
  'src/components/orphanage/StoryBeginsStep.tsx|src/components/startGame/NewGameForm.tsx',
  'src/components/scouting/RivalWarriorList.tsx|src/components/scouting/ScoutIntelTab.tsx',
  'src/components/scouting/ScoutIntelTab.tsx|src/pages/Scouting.tsx',
  'src/components/scouting/StableComparison.tsx|src/hooks/useScoutingStableComparison.ts',
  'src/components/scouting/StableSelector.tsx|src/components/scouting/components/WarriorSelector.tsx',
  'src/components/scouting/components/AttributeComparison.tsx|src/components/scouting/components/AverageAttributesSection.tsx',
  'src/components/stable/LegacyMentorsTab.tsx|src/components/stable/StableRosterTab.tsx',
  'src/components/stable/LiabilityBadge.tsx|src/components/stable/PotentialBadge.tsx',
  'src/components/stable/RosterWarriorRow.tsx|src/hooks/useActiveRoster.ts',
  'src/components/tournaments/TournamentSchedule.tsx|src/hooks/useTournamentSchedule.ts',
  'src/components/ui/alert-dialog.tsx|src/components/ui/sheet.tsx',
  'src/components/warrior/AttributeRow.tsx|src/components/warrior/attributeRowState.ts',
  'src/components/warrior/favorites/BioRhythmSection.tsx|src/components/warrior/favorites/WeaponAffinitySection.tsx',
  'src/data/equipment/weapons.ts|src/data/equipment/weapons/items.ts',
  'src/data/terrabloodCharts.ts|src/engine/warrior/skillCalc.ts',
  'src/engine/bout/fighterState.ts|src/engine/combat/mechanics/simulateHelpers.ts',
  'src/engine/bout/services/boutResolution.ts|src/engine/matchmaking/tournamentSelection/utils.ts',
  'src/engine/crest/crestGenerator.ts|src/schemas/schemaEnums.ts',
  'src/engine/crest/crestGenerator.ts|src/types/enumSources.ts',
  'src/engine/factories/warriorFactory.ts|src/engine/owner/roster/recruitGenerator.ts',
  'src/engine/factories/warriorFactory.ts|src/engine/pipeline/passes/SystemPass.ts',
  'src/engine/owner/grudges.ts|src/engine/rivals/rivalUtils.ts',
  'src/engine/owner/roster/recruitGenerator.ts|src/engine/pipeline/passes/SystemPass.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/buffHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/bargains.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/oddities.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/phenomena.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts|src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/rift.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts|src/engine/pipeline/offseasonEvents/injuryHandlers.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/chaosHandlers/weavers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/economicHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/pages/Orphanage.tsx|src/pages/orphanage/useFtueFlow.ts',
  'src/components/PlanBuilder.tsx|src/components/planBuilder/usePlanOrchestration.ts',
  'src/pages/StartGame.tsx|src/pages/startGame/useStartGame.ts',
  'src/pages/ArenaDetail.tsx|src/pages/startGame/DeleteSaveDialog.tsx',
  'src/components/layout/ResetDialog.tsx|src/pages/startGame/DeleteSaveDialog.tsx',
  'src/components/startGame/NewGameForm.tsx|src/pages/StartGame.tsx',
  'src/components/startGame/NewGameForm.tsx|src/pages/startGame/useStartGame.ts',
  'src/engine/pipeline/offseasonEvents/injuryHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts',
  'src/engine/pipeline/offseasonEvents/injuryHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/injuryHandlers.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts|src/engine/pipeline/offseasonEvents/socialHandlers/street.ts',
  'src/engine/pipeline/offseasonEvents/socialHandlers/feasts.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/offseasonEvents/socialHandlers/street.ts|src/engine/pipeline/offseasonEvents/socialHandlers/visitors.ts',
  'src/engine/pipeline/seasonal.ts|src/engine/pipeline/seasonalHandlers.ts',
  'src/engine/rivals/rivalNamePool.ts|src/engine/trainers/trainers.ts',
  'src/engine/simulate/simulateFight.ts|src/engine/simulate/simulationLoop.ts',
  'src/engine/storage/electronArchive.ts|src/engine/storage/opfsArchive/service.ts',
  'src/engine/storage/electronArchive.ts|src/engine/storage/opfsArchive/types.ts',
  'src/engine/storage/opfsArchive/service.ts|src/scripts/nodeArchiveService.ts',
  'src/pages/AdminTools/hooks/useAdminTools.ts|src/pages/AdminTools/index.tsx',
  'src/pages/ArenaCircuit.tsx|src/pages/ArenaHub.tsx',
  'src/pages/ArenaDetail.tsx|src/pages/StartGame.tsx',
  'src/pages/ArenaHub.tsx|src/pages/arenaDetail/RecordTable.tsx',
  'src/pages/ArenaHub.tsx|src/pages/arenaDetail/sections.tsx',
  'src/pages/BookingOffice/components/AssetRegistry.tsx|src/pages/TrainingPlanner/components/WarriorSelector.tsx',
  'src/pages/BookingOffice/hooks/useBookingOffice.ts|src/pages/BookingOffice/index.tsx',
  'src/pages/ControlCenter/components/RankingsBar.tsx|src/pages/ControlCenter/hooks/useControlCenter.ts',
  'src/pages/ControlCenter/hooks/useControlCenter.ts|src/pages/ControlCenter/index.tsx',
  'src/pages/HallOfFame/hooks/useHallOfFame.ts|src/pages/HallOfFame/index.tsx',
  'src/pages/ImportExport.tsx|src/pages/Mods.tsx',
  'src/pages/Trainers.tsx|src/pages/Trainers/hooks/useTrainers.ts',
  'src/pages/WarriorDetail.tsx|src/pages/WarriorDetail/hooks/useWarriorDetail.ts',
  'src/pages/arenaDetail/RecordTable.tsx|src/pages/arenaDetail/sections.tsx',
  'src/schemas/fightSchemas.ts|src/schemas/gameStateSchema.ts',
  'src/schemas/schemaEnums.ts|src/types/enumSources.ts',
  // Phase-D2 extraction seams — page↔hook/prop destructuring boilerplate shared
  // across the component↔extracted-module boundary. Thin interface overlap,
  // not behavioral duplication; registered knowingly per the guard contract.
  'src/components/scouting/RivalStableList.tsx|src/components/scouting/RivalWarriorList.tsx',
  'src/pages/ArenaDetail.tsx|src/pages/arenaDetail/useArenaDetail.ts',
  'src/pages/WorldOverview.tsx|src/pages/worldOverview/useWorldOverview.ts',
  'src/components/orphanage/PlanStep.tsx|src/components/planBuilder/sections.tsx',
  'src/pages/Scouting.tsx|src/pages/scouting/useScouting.ts',
  'src/pages/Tournaments.tsx|src/pages/tournaments/useTournamentState.ts',
  'src/components/arena/MiniCombatLog.tsx|src/components/layout/TacticalBar.tsx',
  'src/components/scouting/ScoutIntelTab.tsx|src/pages/scouting/useScouting.ts',
  'src/pages/StableDetail.tsx|src/pages/stableDetail/deriveStableStats.ts',
  'src/components/warrior/dossier/WarriorDossierTabs.tsx|src/pages/StableDetail.tsx',
  'src/pages/Recruit/components/ScoutMarket.tsx|src/pages/Recruit/index.tsx',
  'src/pages/Training.tsx|src/pages/training/useTrainingAssignments.ts',
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
