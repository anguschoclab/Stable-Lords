/**
 * Simulation Loop - Main fight simulation loop
 */
import { resolveEffectiveTactics } from '../combat/resolution/resolution';
import { resolveExchange } from '../combat/resolution/resolution';
import { narrateEvents, NarrationContext } from '../combat/narrative/narrator';
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE } from '@/constants/combat';
import { getPhaseByExchange, type PhaseKey } from '@/engine/combat/phase';
import type { FighterState, ResolutionContext } from '../combat/resolution/types';
import type {
  MinuteEvent,
  DeathCauseBucket,
  FightOutcomeBy,
  ExchangeLogEntry,
  CombatEvent,
} from '@/types/combat.types';
import type { FightPlan } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import { buildExchangeLogEntry } from './logging';
import { minuteStatusLine, tacticStreakLine, narrateBoutEnd } from '../narrative';
import { isAIDebugEnabled } from '@/engine/ai/debug';

type Phase = 'OPENING' | 'MID' | 'LATE';

function toPhase(key: PhaseKey): Phase {
  return key === 'opening' ? 'OPENING' : key === 'mid' ? 'MID' : 'LATE';
}

/** Loop-invariant context bundle (names, weapons, plans, narration bits). */
interface LoopCtx {
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
  flavorRng: IRNGService;
  log: MinuteEvent[];
}

/** Pushes the phase banner + tactic-reveal line on phase transitions. */
function emitPhaseHeader(
  c: LoopCtx,
  fA: FighterState,
  fD: FighterState,
  phase: Phase,
  min: number
): void {
  if (c.headless) return;
  const phaseKey = phase.toLowerCase() as 'opening' | 'mid' | 'late';
  const tacticsA = resolveEffectiveTactics(fA.plan, phaseKey);
  const tacticsD = resolveEffectiveTactics(fD.plan, phaseKey);
  c.log.push({
    minute: min,
    text: `— ${phase.charAt(0) + phase.slice(1).toLowerCase()} Phase —`,
    phase,
    offTacticA: tacticsA.offTactic !== 'none' ? tacticsA.offTactic : undefined,
    defTacticA: tacticsA.defTactic !== 'none' ? tacticsA.defTactic : undefined,
    offTacticD: tacticsD.offTactic !== 'none' ? tacticsD.offTactic : undefined,
    defTacticD: tacticsD.defTactic !== 'none' ? tacticsD.defTactic : undefined,
  });
}

/** Pushes the "MINUTE n." marker + status line at each minute boundary. */
function emitMinuteMarker(
  c: LoopCtx,
  fA: FighterState,
  fD: FighterState,
  min: number
): void {
  if (c.headless) return;
  c.log.push({ minute: min, text: `MINUTE ${min}.` });
  c.log.push({
    minute: min,
    text: minuteStatusLine(c.flavorRng, min, c.nameA, c.nameD, fA.hitsLanded, fD.hitsLanded),
  });
}

const YIELD_THRESHOLD = 0.15;

/**
 * Yield check — before resolving the exchange, a fighter whose
 * fallbackCondition is 'YIELD' and who is below desperation thresholds
 * surrenders. Returns the outcome or null to continue.
 */
function checkYieldOutcome(
  c: LoopCtx,
  fA: FighterState,
  fD: FighterState,
  min: number
): { winner: 'A' | 'D'; by: FightOutcomeBy } | null {
  const yields =
    c.planA?.fallbackCondition === 'YIELD' &&
    fA.hp < fA.maxHp * YIELD_THRESHOLD &&
    fA.endurance < fA.maxEndurance * YIELD_THRESHOLD
      ? 'A'
      : c.planD?.fallbackCondition === 'YIELD' &&
          fD.hp < fD.maxHp * YIELD_THRESHOLD &&
          fD.endurance < fD.maxEndurance * YIELD_THRESHOLD
        ? 'D'
        : null;
  if (!yields) return null;
  const winner = yields === 'A' ? 'D' : 'A';
  if (!c.headless) {
    const narWinner = yields === 'A' ? c.nameD : c.nameA;
    const narLoser = yields === 'A' ? c.nameA : c.nameD;
    const winnerWeapon = yields === 'A' ? c.weaponD : c.weaponA;
    const boutEndLines = narrateBoutEnd(c.flavorRng, 'Yield', narWinner, narLoser, winnerWeapon, {
      mood: c.crowdMood,
    });
    boutEndLines.forEach((line) => c.log.push({ minute: min, text: line, emphasis: true }));
  }
  return { winner, by: 'Yield' };
}

/**
 * Resolves narration for one exchange (drama layer): post-exchange HP ratios,
 * event narration, and tactic-streak commentary. Returns updated ratios.
 */
function narrateExchangeEvents(
  c: LoopCtx,
  fA: FighterState,
  fD: FighterState,
  events: CombatEvent[],
  min: number,
  prevHpRatioA: number,
  prevHpRatioD: number
): { prevHpRatioA: number; prevHpRatioD: number } {
  // Use authoritative post-mitigation HP ratios from the engine state.
  // These are already correct — resolveExchange mutated fA.hp and fD.hp
  // with the real (post-shield, post-protect) damage figure.
  const postHpRatioA = Math.max(0, fA.hp / fA.maxHp);
  const postHpRatioD = Math.max(0, fD.hp / fD.maxHp);

  const narCtx: NarrationContext = {
    rng: c.flavorRng,
    nameA: c.nameA,
    nameD: c.nameD,
    weaponA: c.weaponA,
    weaponD: c.weaponD,
    styleA: fA.style,
    styleD: fD.style,
    maxHpA: fA.maxHp,
    maxHpD: fD.maxHp,
    prevHpRatioA,
    prevHpRatioD,
    // Authoritative post-exchange HP ratios — narrator reads these instead
    // of re-deriving from pre-mitigation event.value.
    postHpRatioA,
    postHpRatioD,
    fameA: c.warriorA?.fame ?? 0,
    fameD: c.warriorD?.fame ?? 0,
    isFavoriteA: !!c.warriorA?.favorites?.discovered?.weapon,
    isFavoriteD: !!c.warriorD?.favorites?.discovered?.weapon,
    spA: c.warriorA?.attributes.SP,
    spD: c.warriorD?.attributes.SP,
    originA: c.warriorA?.origin,
    originD: c.warriorD?.origin,
    crowdMood: c.crowdMood,
  };
  const { log: newLines } = narrateEvents(events, narCtx, min);
  c.log.push(...newLines);

  // Tactic streak commentary
  if ((c.resCtx.tacticStreakA === 3 || c.resCtx.tacticStreakA === 5) && c.resCtx.lastOffTacticA) {
    const streakLine = tacticStreakLine(c.nameA, c.resCtx.lastOffTacticA, c.resCtx.tacticStreakA);
    if (streakLine) c.log.push({ minute: min, text: streakLine });
  }
  if ((c.resCtx.tacticStreakD === 3 || c.resCtx.tacticStreakD === 5) && c.resCtx.lastOffTacticD) {
    const streakLine = tacticStreakLine(c.nameD, c.resCtx.lastOffTacticD, c.resCtx.tacticStreakD);
    if (streakLine) c.log.push({ minute: min, text: streakLine });
  }
  return { prevHpRatioA: postHpRatioA, prevHpRatioD: postHpRatioD };
}

interface BoutEndResult {
  by: FightOutcomeBy;
  winner: 'A' | 'D' | null;
  causeBucket: DeathCauseBucket | undefined;
  fatalHitLocation: string | undefined;
  fatalExchangeIndex: number;
}

/** Resolves a BOUT_END event into outcome + narration. */
function resolveBoutEnd(c: LoopCtx, boutEnd: CombatEvent, ex: number, min: number): BoutEndResult {
  const by = boutEnd.result as FightOutcomeBy;
  const causeBucket = boutEnd.metadata?.cause as DeathCauseBucket;
  const fatalHitLocation = boutEnd.metadata?.location as string;

  let winner: 'A' | 'D' | null;
  if (by === 'Stoppage' || by === 'Decision' || by === 'Yield') {
    winner = boutEnd.actor === 'A' ? 'D' : 'A';
  } else if (by === 'Exhaustion') {
    winner = null;
  } else {
    winner = boutEnd.actor === 'A' ? 'A' : 'D';
  }

  if (!c.headless) {
    const boutActorIsWinner = by !== 'Stoppage' && by !== 'Decision' && by !== 'Yield';
    const narWinner = boutActorIsWinner
      ? boutEnd.actor === 'A'
        ? c.nameA
        : c.nameD
      : boutEnd.actor === 'A'
        ? c.nameD
        : c.nameA;
    const narLoser = boutActorIsWinner
      ? boutEnd.actor === 'A'
        ? c.nameD
        : c.nameA
      : boutEnd.actor === 'A'
        ? c.nameA
        : c.nameD;
    const winnerStyle = boutEnd.actor === 'A' ? c.planA?.style : c.planD?.style;
    const winnerWeapon = boutActorIsWinner
      ? boutEnd.actor === 'A'
        ? c.weaponA
        : c.weaponD
      : boutEnd.actor === 'A'
        ? c.weaponD
        : c.weaponA;
    const boutEndLines = narrateBoutEnd(
      c.flavorRng,
      by as string,
      narWinner,
      narLoser,
      winnerWeapon,
      {
        cause: causeBucket,
        style: winnerStyle,
        mood: c.crowdMood,
      }
    );
    boutEndLines.forEach((line) => c.log.push({ minute: min, text: line, emphasis: true }));
  }
  return { by, winner, causeBucket, fatalHitLocation, fatalExchangeIndex: ex };
}

/** Emits phase-header and minute-marker beats; returns updated markers. */
function emitProgressMarkers(
  c: LoopCtx,
  fA: FighterState,
  fD: FighterState,
  phase: Phase,
  min: number,
  lastPhase: string | null,
  lastMinuteMarker: number
): { lastPhase: string | null; lastMinuteMarker: number } {
  if (phase !== lastPhase) {
    lastPhase = phase;
    emitPhaseHeader(c, fA, fD, phase, min);
  }
  if (min > lastMinuteMarker && min > 1) {
    lastMinuteMarker = min;
    emitMinuteMarker(c, fA, fD, min);
  }
  return { lastPhase, lastMinuteMarker };
}

/**
 * First BOUT_END in the event array wins; inline scan avoids allocating a
 * find-closure per exchange.
 */
function firstBoutEnd(events: CombatEvent[]): CombatEvent | undefined {
  for (const e of events) {
    if (e.type === 'BOUT_END') return e;
  }
  return undefined;
}

/** Mutable run state threaded through the exchange loop. */
interface LoopRun {
  exchangeLog: ExchangeLogEntry[];
  prevHpRatioA: number;
  prevHpRatioD: number;
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
  lastPhase: string | null;
  lastMinuteMarker: number;
  currentMinute: number;
  causeBucket: DeathCauseBucket | undefined;
  fatalHitLocation: string | undefined;
  fatalExchangeIndex: number | undefined;
}

/**
 * One exchange of the bout: markers → yield check → resolve → narrate → end
 * check. Returns true when the bout has ended and the loop should break.
 */
function runExchange(
  c: LoopCtx,
  run: LoopRun,
  fA: FighterState,
  fD: FighterState,
  ex: number,
  telemetry: boolean
): boolean {
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
    c,
    fA,
    fD,
    phase,
    min,
    run.lastPhase,
    run.lastMinuteMarker
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
      c,
      fA,
      fD,
      events,
      min,
      run.prevHpRatioA,
      run.prevHpRatioD
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
 * Run the main simulation loop.
 */
export function runSimulationLoop(
  fA: FighterState,
  fD: FighterState,
  resCtx: ResolutionContext,
  nameA: string,
  nameD: string,
  weaponA: string,
  weaponD: string,
  warriorA: Warrior | undefined,
  warriorD: Warrior | undefined,
  planA: FightPlan | undefined,
  planD: FightPlan | undefined,
  crowdMood: string | undefined,
  headless: boolean,
  narRng: IRNGService
): {
  log: MinuteEvent[];
  exchangeLog: ExchangeLogEntry[];
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
  causeBucket: DeathCauseBucket | undefined;
  fatalHitLocation: string | undefined;
  fatalExchangeIndex: number | undefined;
  fightMinutes: number;
} {
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
    if (runExchange(c, run, fA, fD, ex, telemetry)) break;
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
