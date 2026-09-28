import { validatePipelinePasses, type WeekPassSpec } from '@/engine/pipeline/pipelineStages';
import { runWarriorPass } from '../../passes/WarriorPass';
import { runEconomyPass } from '../../passes/EconomyPass';
import { runEquipmentPass } from '../../passes/EquipmentPass';
import { runWorldPass } from '../../passes/WorldPass';
import { runRecruitmentPass } from '../../passes/RecruitmentPass';
import { runSystemPass } from '../../passes/SystemPass';
import { runRankingsPass } from '../../passes/RankingsPass';
import { runPromoterPass } from '../../passes/PromoterPass';
import { runPromoterLifecyclePass } from '../../passes/PromoterLifecyclePass';
import { runTrainerPass } from '../../passes/TrainerPass';
import { runRivalStrategyPass } from '../../passes/RivalStrategyPass';
import { runArenaChampionshipPass } from '../../passes/ArenaChampionshipPass';
import { runEventPass } from '../../passes/EventPass';
import { runNarrativePass } from '../../passes/NarrativePass';
import { runSeasonalPass } from '../../seasonal';
import { runProgressionPass } from '../../passes/ProgressionPass';

/**
 * Declarative pipeline table. Execution order is declaration order; stages
 * resolve sequentially (core → world → content). `writes` declarations are
 * validated by `validatePipelinePasses` — asserted once per process in
 * advanceWeek and exhaustively in weekPipelineDAG.test.ts.
 */
export const WEEK_PIPELINE_PASSES: WeekPassSpec[] = [
  {
    id: 'warrior',
    stage: 'core',
    run: (s, ctx) => runWarriorPass(s, ctx.rootRng),
    writes: ['rosterUpdates', 'retired', 'hiringPool', 'seasonalGrowth', 'ledgerEntries'],
  },
  {
    id: 'economy',
    stage: 'core',
    run: (s, ctx) => runEconomyPass(s, ctx.rootRng),
    writes: ['treasuryDelta', 'ledgerEntries', 'popularityDelta', 'fameDelta'],
  },
  {
    id: 'equipment',
    stage: 'core',
    run: (s) => runEquipmentPass(s),
    writes: ['rivalsUpdates'],
  },
  {
    id: 'recruitment',
    stage: 'core',
    run: (s, ctx) => runRecruitmentPass(s, ctx.rootRng),
    writes: ['recruitPool'],
  },
  {
    id: 'world',
    stage: 'world',
    run: (s, ctx) => runWorldPass(s, ctx.nextWeek, ctx.rootRng),
    writes: ['week', 'season', 'weather', 'ownerGrudges', 'rivalries'],
  },
  {
    id: 'system',
    stage: 'world',
    run: (s, ctx) => runSystemPass(s, ctx.rootRng),
    writes: [
      'seasonalGrowth',
      'hallOfFame',
      'awards',
      'rosterUpdates',
      'rivalsUpdates',
      'newsletterItems',
    ],
  },
  {
    id: 'rankings',
    stage: 'world',
    run: (s) => runRankingsPass(s),
    writes: ['realmRankings'],
  },
  {
    id: 'progression',
    stage: 'world',
    run: (s, ctx) => runProgressionPass(s, ctx.nextWeek, ctx.nextYear),
    writes: ['progression', 'newsletterItems', 'gazettes'],
  },
  {
    id: 'promoter',
    stage: 'world',
    run: (s) => runPromoterPass(s),
    writes: ['boutOffers'],
  },
  {
    id: 'promoterLifecycle',
    stage: 'world',
    run: (s, ctx) => runPromoterLifecyclePass(s, ctx.rootRng),
    writes: ['promoters'],
  },
  {
    id: 'trainer',
    stage: 'world',
    run: (s, ctx) => runTrainerPass(s, ctx.rootRng),
    writes: ['trainers', 'hiringPool', 'rivalsUpdates'],
  },
  {
    id: 'arenaChampionship',
    stage: 'world',
    // Before rivalStrategy: the refusal sweep must observe Rejected and
    // lapsed-unsigned title offers before that pass's pruneBoutOffers removes
    // them (stage impacts resolve against one snapshot — nothing here can be
    // observed same-tick, so order only matters for next-tick reads).
    after: ['rankings'],
    run: (s, ctx) => runArenaChampionshipPass(s, ctx),
    writes: [
      'arenaChampions',
      'grandChampions',
      'boutOffers',
      'newsletterItems',
      'rosterUpdates',
      'rivalsUpdates',
      'fameDelta',
      'popularityDelta',
      'treasuryDelta',
    ],
  },
  {
    id: 'rivalStrategy',
    stage: 'world',
    after: ['recruitment'], // draft pool must be refilled before the AI draft drains it
    run: (s, ctx) => runRivalStrategyPass(s, ctx.nextWeek, ctx.rootRng, ctx.headless, ctx.pool),
    writes: [
      'rivalsUpdates',
      'boutOffers',
      'recruitPool',
      'tournaments',
      'isTournamentWeek',
      'activeTournamentId',
      'day',
      'newsletterItems',
      'retired',
    ],
  },
  {
    id: 'event',
    stage: 'content',
    playerFacing: true,
    run: (s, ctx) => runEventPass(s, ctx.nextWeek, ctx.rootRng),
    writes: ['rosterUpdates', 'newsletterItems', 'ledgerEntries', 'treasuryDelta'],
  },
  {
    id: 'narrative',
    stage: 'content',
    playerFacing: true,
    run: (s, ctx) => runNarrativePass(s, ctx.currentWeek, ctx.nextWeek, ctx.rootRng),
    writes: ['gazettes', 'newsletterItems'],
  },
  {
    id: 'seasonal',
    stage: 'content',
    run: (s, ctx) => runSeasonalPass(s, ctx.nextWeek, ctx.rootRng),
    writes: ['rosterUpdates', 'treasuryDelta', 'ledgerEntries', 'insightTokens', 'newsletterItems'],
  },
];


let pipelineValidated = false;

/** Validates the pass table once per process (throws on illegal declaration). */
export function assertPipelineLegal(): void {
  if (pipelineValidated) return;
  const issues = validatePipelinePasses(WEEK_PIPELINE_PASSES);
  if (issues.length > 0) {
    throw new Error(
      `Illegal week pipeline declaration:\n${issues.map((i) => ` - ${i.message}`).join('\n')}`
    );
  }
  pipelineValidated = true;
}
