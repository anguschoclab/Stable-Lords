/**
 * Simulation Loop - Main fight simulation loop
 */
import { resolveEffectiveTactics } from '../combat/resolution/resolution';
import { resolveExchange } from '../combat/resolution/resolution';
import { narrateEvents, NarrationContext } from '../combat/narrative/narrator';
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE } from '@/constants/combat';
import type { FighterState } from '../combat/resolution';
import type { ResolutionContext } from '../combat/resolution/resolution';
import type { MinuteEvent, DeathCauseBucket, FightOutcomeBy, ExchangeLogEntry } from '@/types/combat.types';
import type { FightPlan } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import { buildExchangeLogEntry } from './logging';
import {
  minuteStatusLine,
  tacticStreakLine,
  narrateBoutEnd,
} from '../narrativePBP';

type Phase = 'OPENING' | 'MID' | 'LATE';

/**
 * Maps exchange index to a combat phase.
 */
function getPhase(exchange: number, maxExchanges: number): Phase {
  const p = Math.floor((exchange / maxExchanges) * 3);
  if (p === 0) return 'OPENING';
  if (p === 1) return 'MID';
  return 'LATE';
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
  warriorA?: Warrior,
  warriorD?: Warrior,
  planA?: FightPlan,
  planD?: FightPlan,
  crowdMood?: string,
  headless?: boolean
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
  const log: MinuteEvent[] = [];
  const exchangeLog: ExchangeLogEntry[] = [];
  let prevHpRatioA = 1.0;
  let prevHpRatioD = 1.0;
  let winner: 'A' | 'D' | null = null;
  let by: FightOutcomeBy | null = null;
  let lastPhase: string | null = null;
  let lastMinuteMarker = 0;
  let currentMinute = 1;

  let causeBucket: DeathCauseBucket | undefined;
  let fatalHitLocation: string | undefined;
  let fatalExchangeIndex: number | undefined;

  for (let ex = 0; ex < MAX_EXCHANGES; ex++) {
    const min = Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;
    currentMinute = min;
    const phase = getPhase(ex, MAX_EXCHANGES);
    resCtx.phase = phase;
    resCtx.exchange = ex;

    // Phase Change & Tactic Reveal
    if (phase !== lastPhase) {
      lastPhase = phase;
      if (!headless) {
        const phaseKey = phase.toLowerCase() as 'opening' | 'mid' | 'late';
        const tacticsA = resolveEffectiveTactics(fA.plan, phaseKey);
        const tacticsD = resolveEffectiveTactics(fD.plan, phaseKey);
        log.push({
          minute: min,
          text: `— ${phase.charAt(0) + phase.slice(1).toLowerCase()} Phase —`,
          phase,
          offTacticA: tacticsA.offTactic !== 'none' ? tacticsA.offTactic : undefined,
          defTacticA: tacticsA.defTactic !== 'none' ? tacticsA.defTactic : undefined,
          offTacticD: tacticsD.offTactic !== 'none' ? tacticsD.offTactic : undefined,
          defTacticD: tacticsD.defTactic !== 'none' ? tacticsD.defTactic : undefined,
        });
      }
    }

    if (min > lastMinuteMarker && min > 1) {
      lastMinuteMarker = min;
      if (!headless) {
        log.push({ minute: min, text: `MINUTE ${min}.` });
        log.push({
          minute: min,
          text: minuteStatusLine(resCtx.rng, min, nameA, nameD, fA.hitsLanded, fD.hitsLanded),
        });
      }
    }

    // A. Resolve Math (Dice)
    const events = resolveExchange(resCtx, fA, fD);
    if (!headless) {
      exchangeLog.push(buildExchangeLogEntry(ex, min, phase, events));
    }

    // B. Resolve Narration (Drama)
    if (!headless) {
      const narCtx: NarrationContext = {
        rng: resCtx.rng,
        nameA,
        nameD,
        weaponA,
        weaponD,
        styleA: fA.style,
        styleD: fD.style,
        maxHpA: fA.maxHp,
        maxHpD: fD.maxHp,
        prevHpRatioA,
        prevHpRatioD,
        fameA: warriorA?.fame ?? 0,
        fameD: warriorD?.fame ?? 0,
        isFavoriteA: !!warriorA?.favorites?.discovered?.weapon,
        isFavoriteD: !!warriorD?.favorites?.discovered?.weapon,
      };
      const { log: newLines, lastHpRatioA, lastHpRatioD } = narrateEvents(events, narCtx, min);
      log.push(...newLines);
      prevHpRatioA = lastHpRatioA;
      prevHpRatioD = lastHpRatioD;

      // Tactic streak commentary
      if ((resCtx.tacticStreakA === 3 || resCtx.tacticStreakA === 5) && resCtx.lastOffTacticA) {
        const streakLine = tacticStreakLine(nameA, resCtx.lastOffTacticA, resCtx.tacticStreakA);
        if (streakLine) log.push({ minute: min, text: streakLine });
      }
      if ((resCtx.tacticStreakD === 3 || resCtx.tacticStreakD === 5) && resCtx.lastOffTacticD) {
        const streakLine = tacticStreakLine(nameD, resCtx.lastOffTacticD, resCtx.tacticStreakD);
        if (streakLine) log.push({ minute: min, text: streakLine });
      }
    }

    // C. Check for End Events
    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    if (boutEnd) {
      by = boutEnd.result as FightOutcomeBy;
      fatalHitLocation = boutEnd.metadata?.location as string;
      fatalExchangeIndex = ex;
      causeBucket = boutEnd.metadata?.cause as DeathCauseBucket;

      if (by === 'Stoppage') {
        winner = boutEnd.actor === 'A' ? 'D' : 'A';
      } else if (by === 'Exhaustion') {
        winner = null;
      } else {
        winner = boutEnd.actor === 'A' ? 'A' : 'D';
      }

      if (!headless) {
        const boutActorIsWinner = by !== 'Stoppage';
        const narWinner = boutActorIsWinner
          ? boutEnd.actor === 'A'
            ? nameA
            : nameD
          : boutEnd.actor === 'A'
            ? nameD
            : nameA;
        const narLoser = boutActorIsWinner
          ? boutEnd.actor === 'A'
            ? nameD
            : nameA
          : boutEnd.actor === 'A'
            ? nameA
            : nameD;
        const winnerStyle = boutEnd.actor === 'A' ? planA?.style : planD?.style;
        const boutEndLines = narrateBoutEnd(resCtx.rng, by as string, narWinner, narLoser, undefined, {
          cause: causeBucket,
          style: winnerStyle,
          mood: crowdMood,
        });
        boutEndLines.forEach((line) => log.push({ minute: min, text: line }));
      }
      break;
    }
  }

  return {
    log,
    exchangeLog,
    winner,
    by,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex,
    fightMinutes: Math.max(1, currentMinute),
  };
}

