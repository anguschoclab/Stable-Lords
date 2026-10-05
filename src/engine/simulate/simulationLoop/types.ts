import type { ResolutionContext } from '../../combat/resolution/types';
import type {
  MinuteEvent,
  DeathCauseBucket,
  FightOutcomeBy,
  ExchangeLogEntry,
} from '@/types/combat.types';
import type { FightPlan } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import type { PhaseKey } from '@/engine/combat/phase';

/**
 * Phase.
 */
export type Phase = 'OPENING' | 'MID' | 'LATE';

/**
 * To phase.
 */
export function toPhase(key: PhaseKey): Phase {
  return key === 'opening' ? 'OPENING' : key === 'mid' ? 'MID' : 'LATE';
}

/** Loop-invariant context bundle (names, weapons, plans, narration bits). */
export interface LoopCtx {
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

/** Mutable run state threaded through the exchange loop. */
export interface LoopRun {
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
