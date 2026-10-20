import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
// @ts-expect-error — .mjs scanner has no types
import { collectSizes } from '../../../scripts/function-length.mjs';

/**
 * MEGAPLAN-V18 single-responsibility decomposition spec (authored test-first).
 *
 * A) Function-level splits (S1–S19, the >80-line queue from FINDINGS §A):
 *    no function in the target file may exceed FN_BUDGET after the split.
 *    Orchestrator + sibling-shard pattern (the established EXEMPT pattern).
 *
 * B) Unit-level god-component/hook splits (S20–S34, census-promoted mixed-
 *    responsibility units): the file must either shrink below its line
 *    budget OR gain a sibling extraction module — and no function may
 *    exceed FN_BUDGET either way.
 *
 * Every contract parks under .skip with its MEGAPLAN-S* ticket and
 * un-skips in the commit that lands the decomposition (v12Srp precedent).
 */

const REPO = path.resolve(__dirname, '../../..');
const FN_BUDGET = 60;

const fileLines = (p: string) => readFileSync(path.join(REPO, p), 'utf8').split('\n').length;
const exists = (p: string) => existsSync(path.join(REPO, p));

interface FnRec {
  file: string;
  name: string;
  len: number;
}

describe('megaplan V18: single-responsibility decomposition', () => {
  const { functions } = collectSizes() as { functions: FnRec[] };

  const budgetFor = (file: string) =>
    functions.filter((f) => f.file === file && f.len > FN_BUDGET).map((f) => `${f.name} (${f.len})`);

  it.skip('S1: index decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S1', () => {
    expect(budgetFor('src/components/WarriorBuilder/index.tsx'), 'split src/components/WarriorBuilder/index.tsx into orchestrator + named siblings').toEqual([]);
  });

  it('S2: decisionLogic decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S2', () => {
    expect(budgetFor('src/engine/bout/decisionLogic.ts'), 'split src/engine/bout/decisionLogic.ts into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S3: useRecruitActions decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S3', () => {
    expect(budgetFor('src/pages/Recruit/hooks/useRecruitActions.ts'), 'split src/pages/Recruit/hooks/useRecruitActions.ts into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S4: ComparisonHeader decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S4', () => {
    expect(budgetFor('src/components/scouting/ComparisonHeader.tsx'), 'split src/components/scouting/ComparisonHeader.tsx into orchestrator + named siblings').toEqual([]);
  });

  it('S5: actions decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S5', () => {
    expect(budgetFor('src/state/slices/rosterSlice/actions.ts'), 'split src/state/slices/rosterSlice/actions.ts into orchestrator + named siblings').toEqual([]);
  });

  it('S6: exchangePrep decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S6', () => {
    expect(budgetFor('src/engine/combat/resolution/exchangePrep.ts'), 'split src/engine/combat/resolution/exchangePrep.ts into orchestrator + named siblings').toEqual([]);
  });

  it('S7: counters decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S7', () => {
    expect(budgetFor('src/engine/ai/workers/competitionWorker/offerProcessor/counters.ts'), 'split src/engine/ai/workers/competitionWorker/offerProcessor/counters.ts into orchestrator + named siblings').toEqual([]);
  });

  it('S8: scheduling decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S8', () => {
    expect(budgetFor('src/engine/championship/arenaChampionship/phases/scheduling.ts'), 'split src/engine/championship/arenaChampionship/phases/scheduling.ts into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S9: RosterWarriorRow decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S9', () => {
    expect(budgetFor('src/components/stable/RosterWarriorRow.tsx'), 'split src/components/stable/RosterWarriorRow.tsx into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S10: WarriorDossierHeader decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S10', () => {
    expect(budgetFor('src/components/warrior/dossier/WarriorDossierHeader.tsx'), 'split src/components/warrior/dossier/WarriorDossierHeader.tsx into orchestrator + named siblings').toEqual([]);
  });

  it('S11: results decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S11', () => {
    expect(budgetFor('src/engine/matchmaking/tournamentSelection/resolution/results.ts'), 'split src/engine/matchmaking/tournamentSelection/resolution/results.ts into orchestrator + named siblings').toEqual([]);
  });

  it('S12: warriorStatements decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S12', () => {
    expect(budgetFor('src/data/warriorStatements.ts'), 'split src/data/warriorStatements.ts into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S13: ftueStateBuilder decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S13', () => {
    expect(budgetFor('src/components/orphanage/ftueStateBuilder.ts'), 'split src/components/orphanage/ftueStateBuilder.ts into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S14: DominantCombatantsSection decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S14', () => {
    expect(budgetFor('src/components/scouting/components/DominantCombatantsSection.tsx'), 'split src/components/scouting/components/DominantCombatantsSection.tsx into orchestrator + named siblings').toEqual([]);
  });

  it('S15: agingSystem decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S15', () => {
    expect(budgetFor('src/engine/aging/agingSystem.ts'), 'split src/engine/aging/agingSystem.ts into orchestrator + named siblings').toEqual([]);
  });

  it('S16: index decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S16', () => {
    expect(budgetFor('src/engine/ai/plan/coreGenerator/index.ts'), 'split src/engine/ai/plan/coreGenerator/index.ts into orchestrator + named siblings').toEqual([]);
  });

  it('S17: recruitmentWorker decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S17', () => {
    expect(budgetFor('src/engine/ai/workers/recruitmentWorker.ts'), 'split src/engine/ai/workers/recruitmentWorker.ts into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S18: MathStep decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S18', () => {
    expect(budgetFor('src/components/resolution-reveal/MathStep.tsx'), 'split src/components/resolution-reveal/MathStep.tsx into orchestrator + named siblings').toEqual([]);
  });

  it('S19: trainingImpact decomposed — no function exceeds ${FN_BUDGET} lines — MEGAPLAN-S19', () => {
    expect(budgetFor('src/engine/training/trainingImpact.ts'), 'split src/engine/training/trainingImpact.ts into orchestrator + named siblings').toEqual([]);
  });

  it.skip('S20: navigationShared split — file ≤200 lines or sibling module — MEGAPLAN-S20', () => {
    const shrunk = exists('src/components/layout/navigationShared.tsx') && fileLines('src/components/layout/navigationShared.tsx') <= 200;
    const landed = ["src/components/layout/AlertsStrip.tsx", "src/components/layout/SubPageList.tsx", "src/components/layout/HubSwitcher.tsx", "src/components/layout/navigationShared/"].some(exists);
    expect(shrunk || landed, 'src/components/layout/navigationShared.tsx not decomposed').toBe(true);
    expect(budgetFor('src/components/layout/navigationShared.tsx')).toEqual([]);
  });

  it.skip('S21: PromoterDirectory split — file ≤200 lines or sibling module — MEGAPLAN-S21', () => {
    const shrunk = exists('src/pages/PromoterDirectory.tsx') && fileLines('src/pages/PromoterDirectory.tsx') <= 200;
    const landed = ["src/pages/promoterDirectory/", "src/pages/PromoterDirectory/hooks/usePromoterDirectory.ts"].some(exists);
    expect(shrunk || landed, 'src/pages/PromoterDirectory.tsx not decomposed').toBe(true);
    expect(budgetFor('src/pages/PromoterDirectory.tsx')).toEqual([]);
  });

  it.skip('S22: useFtueFlow split — file ≤150 lines or sibling module — MEGAPLAN-S22', () => {
    const shrunk = exists('src/pages/orphanage/useFtueFlow.ts') && fileLines('src/pages/orphanage/useFtueFlow.ts') <= 150;
    const landed = ["src/pages/orphanage/ftueFlow/", "src/pages/orphanage/hooks/useFtueFlow/"].some(exists);
    expect(shrunk || landed, 'src/pages/orphanage/useFtueFlow.ts not decomposed').toBe(true);
    expect(budgetFor('src/pages/orphanage/useFtueFlow.ts')).toEqual([]);
  });

  it.skip('S23: useStartGame split — file ≤140 lines or sibling module — MEGAPLAN-S23', () => {
    const shrunk = exists('src/pages/startGame/useStartGame.ts') && fileLines('src/pages/startGame/useStartGame.ts') <= 140;
    const landed = ["src/pages/startGame/useStartGame/", "src/pages/startGame/hooks/useSaveSlots.ts"].some(exists);
    expect(shrunk || landed, 'src/pages/startGame/useStartGame.ts not decomposed').toBe(true);
    expect(budgetFor('src/pages/startGame/useStartGame.ts')).toEqual([]);
  });

  it.skip('S24: RosterWall split — file ≤130 lines or sibling module — MEGAPLAN-S24', () => {
    const shrunk = exists('src/components/stable/RosterWall.tsx') && fileLines('src/components/stable/RosterWall.tsx') <= 130;
    const landed = ["src/components/stable/rosterWall/", "src/components/stable/RosterWall/"].some(exists);
    expect(shrunk || landed, 'src/components/stable/RosterWall.tsx not decomposed').toBe(true);
    expect(budgetFor('src/components/stable/RosterWall.tsx')).toEqual([]);
  });

  it.skip('S25: ArenaHub split — file ≤80 lines or sibling module — MEGAPLAN-S25', () => {
    const shrunk = exists('src/pages/ArenaHub.tsx') && fileLines('src/pages/ArenaHub.tsx') <= 80;
    const landed = ["src/pages/arenaHub/ArenaHub.tsx", "src/pages/arenaHub/sections.tsx"].some(exists);
    expect(shrunk || landed, 'src/pages/ArenaHub.tsx not decomposed').toBe(true);
    expect(budgetFor('src/pages/ArenaHub.tsx')).toEqual([]);
  });

  it.skip('S26: Training split — file ≤110 lines or sibling module — MEGAPLAN-S26', () => {
    const shrunk = exists('src/pages/Training.tsx') && fileLines('src/pages/Training.tsx') <= 110;
    const landed = ["src/pages/training/Training.tsx", "src/pages/training/sections.tsx"].some(exists);
    expect(shrunk || landed, 'src/pages/Training.tsx not decomposed').toBe(true);
    expect(budgetFor('src/pages/Training.tsx')).toEqual([]);
  });

  it.skip('S27: useWarriorDetail split — file ≤90 lines or sibling module — MEGAPLAN-S27', () => {
    const shrunk = exists('src/pages/WarriorDetail/hooks/useWarriorDetail.ts') && fileLines('src/pages/WarriorDetail/hooks/useWarriorDetail.ts') <= 90;
    const landed = ["src/pages/WarriorDetail/hooks/useWarriorDetail/", "src/pages/WarriorDetail/hooks/useWarriorSelectors.ts"].some(exists);
    expect(shrunk || landed, 'src/pages/WarriorDetail/hooks/useWarriorDetail.ts not decomposed').toBe(true);
    expect(budgetFor('src/pages/WarriorDetail/hooks/useWarriorDetail.ts')).toEqual([]);
  });

  it.skip('S28: useBookingOffice split — file ≤130 lines or sibling module — MEGAPLAN-S28', () => {
    const shrunk = exists('src/pages/BookingOffice/hooks/useBookingOffice.ts') && fileLines('src/pages/BookingOffice/hooks/useBookingOffice.ts') <= 130;
    const landed = ["src/pages/BookingOffice/hooks/useBookingOffice/", "src/pages/BookingOffice/hooks/useOfferActions.ts"].some(exists);
    expect(shrunk || landed, 'src/pages/BookingOffice/hooks/useBookingOffice.ts not decomposed').toBe(true);
    expect(budgetFor('src/pages/BookingOffice/hooks/useBookingOffice.ts')).toEqual([]);
  });

  it.skip('S29: useArenaDetail split — file ≤80 lines or sibling module — MEGAPLAN-S29', () => {
    const shrunk = exists('src/pages/arenaDetail/useArenaDetail.ts') && fileLines('src/pages/arenaDetail/useArenaDetail.ts') <= 80;
    const landed = ["src/pages/arenaDetail/useArenaDetail/", "src/pages/arenaDetail/useArenaSelectors.ts"].some(exists);
    expect(shrunk || landed, 'src/pages/arenaDetail/useArenaDetail.ts not decomposed').toBe(true);
    expect(budgetFor('src/pages/arenaDetail/useArenaDetail.ts')).toEqual([]);
  });

  it.skip('S30: RosterSnapshot split — file ≤70 lines or sibling module — MEGAPLAN-S30', () => {
    const shrunk = exists('src/pages/ControlCenter/components/RosterSnapshot.tsx') && fileLines('src/pages/ControlCenter/components/RosterSnapshot.tsx') <= 70;
    const landed = ["src/pages/ControlCenter/components/rosterSnapshot/", "src/pages/ControlCenter/components/SnapshotRow.tsx"].some(exists);
    expect(shrunk || landed, 'src/pages/ControlCenter/components/RosterSnapshot.tsx not decomposed').toBe(true);
    expect(budgetFor('src/pages/ControlCenter/components/RosterSnapshot.tsx')).toEqual([]);
  });

  it.skip('S31: RivalStableList split — file ≤110 lines or sibling module — MEGAPLAN-S31', () => {
    const shrunk = exists('src/components/scouting/RivalStableList.tsx') && fileLines('src/components/scouting/RivalStableList.tsx') <= 110;
    const landed = ["src/components/scouting/rivalStableList/", "src/components/scouting/RivalIdentity.tsx"].some(exists);
    expect(shrunk || landed, 'src/components/scouting/RivalStableList.tsx not decomposed').toBe(true);
    expect(budgetFor('src/components/scouting/RivalStableList.tsx')).toEqual([]);
  });

  it.skip('S32: AppShell split — file ≤170 lines or sibling module — MEGAPLAN-S32', () => {
    const shrunk = exists('src/components/AppShell.tsx') && fileLines('src/components/AppShell.tsx') <= 170;
    const landed = ["src/components/appShell/LoadingOverlay.tsx", "src/components/appShell/EventLogRail.tsx", "src/components/appShell/"].some(exists);
    expect(shrunk || landed, 'src/components/AppShell.tsx not decomposed').toBe(true);
    expect(budgetFor('src/components/AppShell.tsx')).toEqual([]);
  });

  it('S33: rivalStableShard split — file ≤190 lines or sibling module — MEGAPLAN-S33', () => {
    const shrunk = exists('src/engine/pipeline/passes/rivalStableShard.ts') && fileLines('src/engine/pipeline/passes/rivalStableShard.ts') <= 190;
    const landed = ["src/engine/pipeline/passes/rivalStableShard/"].some(exists);
    expect(shrunk || landed, 'src/engine/pipeline/passes/rivalStableShard.ts not decomposed').toBe(true);
    expect(budgetFor('src/engine/pipeline/passes/rivalStableShard.ts')).toEqual([]);
  });

  it.skip('S34: Gazette split — file ≤100 lines or sibling module — MEGAPLAN-S34', () => {
    const shrunk = exists('src/pages/Gazette.tsx') && fileLines('src/pages/Gazette.tsx') <= 100;
    const landed = ["src/pages/gazette/GazetteMasthead.tsx", "src/pages/gazette/"].some(exists);
    expect(shrunk || landed, 'src/pages/Gazette.tsx not decomposed').toBe(true);
    expect(budgetFor('src/pages/Gazette.tsx')).toEqual([]);
  });

});