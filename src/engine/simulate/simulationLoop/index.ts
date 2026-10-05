/**
 * Simulation Loop - Main fight simulation loop
 */
import { resolveExchange } from '../../combat/resolution/resolution';
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE } from '@/constants/combat';
import { getPhaseByExchange } from '@/engine/combat/phase';
import type { FighterState, ResolutionContext } from '../../combat/resolution/types';
import type {
  MinuteEvent,
  FightOutcomeBy,
  ExchangeLogEntry,
} from '@/types/combat.types';
import type { FightPlan } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import { buildExchangeLogEntry } from '../logging';
import { isAIDebugEnabled } from '@/engine/ai/debug';
import { toPhase, type LoopCtx, type LoopRun } from './types';
import { emitProgressMarkers } from './beats';
import { checkYieldOutcome, firstBoutEnd, resolveBoutEnd } from './outcomes';
import { narrateExchangeEvents } from './narrate';

/**
 * Run exchange args.
 */
interface RunExchangeArgs {
  c: LoopCtx;
  run: LoopRun;
  fA: FighterState;
  fD: FighterState;
  ex: number;
  telemetry: boolean;
}

/**
 * One exchange of the bout: markers → yield check → resolve → narrate → end
 * check. Returns true when the bout has ended and the loop should break.
 */
function runExchange(args: RunExchangeArgs): boolean {
  const { c, run, fA, fD, ex } = args;
  const { telemetry } = args;
  const { resCtx, headless } = c;
  const min = Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;
  run.currentMinute = min;
  const phase = toPhase(getPhaseByExchange(ex, MAX_EXCHANGES));
  resCtx.phase = phase;
  resCtx.exchange = ex;
  // Corner advice: the first exchange of a new phase lets both fighters
  // re-evaluate plan conditions regardless of WT cadence.
  resCtx.cornerAdvice = phase !== run.lastPhase;

  ({ lastPhase: run.lastPhase, lastMinuteMarker: run.lastMinuteMarker } = emitProgressMarkers(
    { c: c, fA: fA, fD: fD, phase: phase, min: min, lastPhase: run.lastPhase, lastMinuteMarker: run.lastMinuteMarker }
  ));

  const yielded = checkYieldOutcome(c, fA, fD, min);
  if (yielded) {
    run.by = yielded.by;
    run.winner = yielded.winner;
    return true;
  }

  // A. Resolve Math (Dice)
  const events = resolveExchange(resCtx, fA, fD);
  if (telemetry) {
    run.exchangeLog.push(buildExchangeLogEntry(ex, min, phase, events));
  }

  // B. Resolve Narration (Drama)
  if (!headless) {
    ({ prevHpRatioA: run.prevHpRatioA, prevHpRatioD: run.prevHpRatioD } = narrateExchangeEvents(
      { c: c, fA: fA, fD: fD, events: events, min: min, prevHpRatioA: run.prevHpRatioA, prevHpRatioD: run.prevHpRatioD }
    ));
  }

  // C. Check for End Events — first BOUT_END in the array wins.
  const boutEnd = firstBoutEnd(events);
  if (boutEnd) {
    const result = resolveBoutEnd(c, boutEnd, ex, min);
    run.by = result.by;
    run.winner = result.winner;
    run.causeBucket = result.causeBucket;
    run.fatalHitLocation = result.fatalHitLocation;
    run.fatalExchangeIndex = result.fatalExchangeIndex;
    return true;
  }
  return false;
}

/**
 *
 */
interface RunSimulationLoopArgs {
  fA: FighterState;
  fD: FighterState;
  resCtx: ResolutionContext;
  nameA: string;
  nameD: string;
  weaponA: string;
  weaponD: string;
  warriorA: Warrior | undefined;
  warriorD: Warrior | undefined;
  planA: FightPlan | undefined;
  planD: FightPlan | undefined;
  crowdMood: string | undefined;
  headless: boolean;
  narRng: IRNGService;
}

/**
 * Run the main simulation loop.
 */
export function runSimulationLoop(args: RunSimulationLoopArgs): {
  log: MinuteEvent[];
  exchangeLog: ExchangeLogEntry[];
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
  causeBucket: import('@/types/combat.types').DeathCauseBucket | undefined;
  fatalHitLocation: string | undefined;
  fatalExchangeIndex: number | undefined;
  fightMinutes: number;
} {
  const { fA, fD, resCtx, nameA, nameD } = args;
  const { weaponA, weaponD, warriorA, warriorD, planA } = args;
  const { planD, crowdMood, headless, narRng } = args;
  // Stage F: AI_INTENT telemetry + exchangeLog surface when narrated, or when
  // the __AI_DEBUG escape hatch is set (headless debugging without narration).
  const telemetry = !headless || isAIDebugEnabled();
  resCtx.aiIntentTelemetry = telemetry;
  const c: LoopCtx = {
    resCtx,
    nameA,
    nameD,
    weaponA,
    weaponD,
    warriorA,
    warriorD,
    planA,
    planD,
    crowdMood,
    headless,
    flavorRng: narRng,
    log: [],
  };
  const run: LoopRun = {
    exchangeLog: [],
    prevHpRatioA: 1.0,
    prevHpRatioD: 1.0,
    winner: null,
    by: null,
    lastPhase: null,
    lastMinuteMarker: 0,
    currentMinute: 1,
    causeBucket: undefined,
    fatalHitLocation: undefined,
    fatalExchangeIndex: undefined,
  };

  for (let ex = 0; ex < MAX_EXCHANGES; ex++) {
    if (runExchange({ c: c, run: run, fA: fA, fD: fD, ex: ex, telemetry: telemetry })) break;
  }

  return {
    log: c.log,
    exchangeLog: run.exchangeLog,
    winner: run.winner,
    by: run.by,
    causeBucket: run.causeBucket,
    fatalHitLocation: run.fatalHitLocation,
    fatalExchangeIndex: run.fatalExchangeIndex,
    fightMinutes: Math.max(1, run.currentMinute),
  };
}
