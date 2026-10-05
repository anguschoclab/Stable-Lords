/**
 * Per-event-type narrators for the combat event log. Each handler receives the
 * event plus a helpers bundle (name/weapon/style accessors resolved against
 * NarrationContext) and returns the MinuteEvent lines to append.
 */
import { type CombatEvent, type MinuteEvent } from '@/types/combat.types';
import {
  narrateAttack,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  damageSeverityLine,
  stateChangeLine,
  fatigueLine,
  crowdReaction,
  narrateInitiative,
  narrateInsightHint,
  narratePassive,
  narrateRangeShift,
  narrateFeint,
  narrateZoneShift,
} from '../../../narrative';
import { narrateKnockdown, narrateRecovery } from '../../../narrative/combatNarrators';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { NarrationContext } from '../types';

type Actor = 'A' | 'D';

/** Accessor bundle resolved once per narrateEvents call. */
export interface NarrateHelpers {
  rng: IRNGService;
  ctx: NarrationContext;
  getName: (actor: Actor) => string;
  getOpponentName: (actor: Actor) => string;
  getWeapon: (actor: Actor) => string;
  getStyle: (actor: Actor) => NarrationContext['styleA'];
  getMaxHp: (actor: Actor) => number;
  getFame: (actor: Actor) => number;
  getIsFavorite: (actor: Actor) => boolean | undefined;
  getSpeed: (actor: Actor) => number | undefined;
  displayName: (actor: Actor) => string;
  getPostHitRatio: (target: Actor, event: CombatEvent) => number;
}

/** One event-type narrator: event + helpers + minute -> lines to append. */
type EventNarrator = (
  event: CombatEvent,
  h: NarrateHelpers,
  minute: number,
  events: CombatEvent[]
) => MinuteEvent[];

const narrateInitiativeEvent: EventNarrator = (event, h, minute) => {
  if (h.rng.next() >= 0.3) return [];
  return [
    {
      minute,
      text: narrateInitiative(
        h.rng,
        h.getName(event.actor),
        h.rng.next() < 0.3,
        h.getOpponentName(event.actor)
      ),
    },
  ];
};

const narrateAttackEvent: EventNarrator = (event, h, minute) => {
  if (event.result !== 'WHIFF') return [];
  return [
    {
      minute,
      text: narrateAttack(
        { rng: h.rng, attackerName: h.displayName(event.actor), weaponId: h.getWeapon(event.actor), _isMastery: false, defenderName: h.getOpponentName(event.actor), style: h.getStyle(event.actor) }
      ),
    },
    {
      minute,
      text: narrateDodge(
        h.rng,
        h.getOpponentName(event.actor),
        h.getSpeed(event.actor === 'A' ? 'D' : 'A'),
        h.displayName(event.actor)
      ),
    },
  ];
};

const narrateKnockdownEvent: EventNarrator = (event, h, minute) => [
  { minute, text: narrateKnockdown(h.rng, h.getName(event.actor), h.getSpeed(event.actor)) },
];

const narrateRecoveryEvent: EventNarrator = (event, h, minute) => [
  {
    minute,
    text: narrateRecovery(
      h.rng,
      h.getName(event.actor),
      h.getSpeed(event.actor),
      h.getOpponentName(event.actor)
    ),
  },
];

const narrateDefenseEvent: EventNarrator = (event, h, minute) => {
  const actorName = h.getName(event.actor);
  const opponentName = h.getOpponentName(event.actor);
  const weapon = h.getWeapon(event.actor);
  if (event.result === 'PARRY') {
    return [
      {
        minute,
        text: narrateAttack(
          { rng: h.rng, attackerName: h.getOpponentName(event.actor), weaponId: h.getWeapon(event.actor === 'A' ? 'D' : 'A'), _isMastery: false, defenderName: actorName, style: h.getStyle(event.actor === 'A' ? 'D' : 'A') }
        ),
      },
      { minute, text: narrateParry(h.rng, actorName, weapon, opponentName) },
    ];
  }
  if (event.result === 'DODGE') {
    return [
      {
        minute,
        text: narrateDodge(h.rng, actorName, h.getSpeed(event.actor), opponentName),
      },
    ];
  }
  if (event.result === 'RIPOSTE') {
    return [{ minute, text: narrateCounterstrike(h.rng, actorName, opponentName) }];
  }
  return [];
};

interface HitAttackLeadArgs {
  event: Parameters<EventNarrator>[0];
  h: Parameters<EventNarrator>[1];
  minute: number;
  events: Parameters<EventNarrator>[3];
  isMastery: boolean;
  opponentName: string;
  weapon: string;
}

/** Lead-in attack line — emitted when the hit follows a riposte or an undefended blow. */
function hitAttackLead(args: HitAttackLeadArgs): MinuteEvent[] {
  const { event, h, minute, events, isMastery } = args;
  const { opponentName, weapon } = args;
  const showAttack =
    events.some((e) => e.type === 'DEFENSE' && e.result === 'RIPOSTE' && e.actor === event.actor) ||
    !events.some((e) => e.type === 'DEFENSE' && e.actor === event.target);
  if (!showAttack) return [];
  return [
    {
      minute,
      text: narrateAttack(
        { rng: h.rng, attackerName: h.displayName(event.actor), weaponId: weapon, _isMastery: isMastery, defenderName: opponentName, style: h.getStyle(event.actor) }
      ),
    },
  ];
}

/** Post-hit reactions: severity line, hp-ratio state change, crowd response. */
function hitReactions(
  event: Parameters<EventNarrator>[0],
  h: Parameters<EventNarrator>[1],
  minute: number,
  actorName: string,
  opponentName: string
): MinuteEvent[] {
  const out: MinuteEvent[] = [];
  if (!event.value) return out;
  const { rng, ctx } = h;
  const target = event.target as 'A' | 'D';

  const sevLine = damageSeverityLine(rng, event.value, h.getMaxHp(target), opponentName);
  if (sevLine) out.push({ minute, text: sevLine });

  const prevRatio = target === 'A' ? ctx.prevHpRatioA : ctx.prevHpRatioD;
  const newHpRatio = h.getPostHitRatio(target, event);
  const sLine = stateChangeLine(rng, opponentName, newHpRatio, prevRatio);
  if (sLine) out.push({ minute, text: sLine });

  const crowd = crowdReaction(rng, opponentName, actorName, newHpRatio, ctx.crowdMood);
  if (crowd) out.push({ minute, text: crowd });
  return out;
}

const narrateHitEvent: EventNarrator = (event, h, minute, events) => {
  if (!event.location) return [];
  const { rng } = h;
  const actorName = h.getName(event.actor);
  const opponentName = h.getOpponentName(event.actor);
  const weapon = h.getWeapon(event.actor);
  const isMastery = !!event.metadata?.isMastery;
  const isSuperFlashy =
    isMastery &&
    (!!event.metadata?.crit ||
      (event.value && event.value > 5) ||
      events.some((e) => e.type === 'BOUT_END'));

  const out: MinuteEvent[] = [
    ...hitAttackLead({ event: event, h: h, minute: minute, events: events, isMastery: isMastery, opponentName: opponentName, weapon: weapon }),
  ];

  const isFatal = !!event.metadata?.lethal;
  const isCrit = !!event.metadata?.crit;
  const isHeavyHit =
    isCrit ||
    isFatal ||
    (!!event.value && event.value / h.getMaxHp(event.target as 'A' | 'D') >= 0.15);

  out.push({
    minute,
    text: narrateHit(
      { rng: rng, defenderName: opponentName, location: event.location, _isMastery: isMastery, isSuperFlashy: isSuperFlashy, attackerName: actorName, weaponId: weapon, damage: event.value, maxHp: h.getMaxHp(event.target as 'A' | 'D'), isFatal: isFatal, attackerFame: h.getFame(event.actor as 'A' | 'D'), isFavorite: h.getIsFavorite(event.actor as 'A' | 'D'), style: h.getStyle(event.actor as 'A' | 'D') }
    ),
    emphasis: isHeavyHit,
  });

  if (isCrit) {
    out.push({
      minute,
      text: `💥 CRITICAL HIT! ${actorName} finds a vital weakness!`,
      emphasis: true,
    });
  }

  out.push(...hitReactions(event, h, minute, actorName, opponentName));
  return out;
};

const narrateFatigueEvent: EventNarrator = (event, h, minute) => {
  if (event.value === undefined) return [];
  const fLine = fatigueLine(h.rng, h.getName(event.actor), event.value);
  return fLine ? [{ minute, text: fLine }] : [];
};

const narratePassiveEvent: EventNarrator = (event, h, minute) => {
  if (!event.result) return [];
  return [
    {
      minute,
      text: narratePassive(
        h.rng,
        event.actor === 'A' ? h.ctx.styleA : h.ctx.styleD,
        h.getName(event.actor)
      ),
    },
  ];
};

const narrateInsightEvent: EventNarrator = (event, h, minute) => {
  const attribute = (event.metadata?.attribute as string) || 'ST';
  const hint = narrateInsightHint(
    h.rng,
    attribute,
    h.getName(event.actor),
    h.getOpponentName(event.actor)
  );
  return hint ? [{ minute, text: `🔍 ${hint}` }] : [];
};

const narrateMomentumShiftEvent: EventNarrator = (event, h, minute) => {
  const actorName = h.getName(event.actor);
  const newMom = event.value ?? 0;
  const prevMom = (event.metadata?.prev as number) ?? 0;
  const swing = Math.abs(newMom - prevMom);
  if (swing < 2 && Math.abs(newMom) < 2) return [];
  let text: string | null = null;
  if (newMom >= 3) {
    text = `${actorName} is absolutely dominant — driving every exchange.`;
  } else if (newMom >= 2) {
    text = `${actorName} seizes the upper hand, dictating the tempo.`;
  } else if (newMom <= -2) {
    text = `${actorName} is on the back foot, struggling to find a rhythm.`;
  } else if (swing >= 2) {
    const reason = event.metadata?.reason as string;
    if (reason === 'PARRY') {
      text = `${actorName} turns the tide with a iron-solid block.`;
    } else {
      text = `${actorName} turns the tide — a sharp counter reverses the momentum.`;
    }
  }
  return text ? [{ minute, text }] : [];
};

const narrateStateChangeEvent: EventNarrator = (event, h, minute) => {
  const actorName = h.getName(event.actor);
  const result = event.result as string;
  if (result === 'COMMIT') {
    return [
      {
        minute,
        text: `${actorName} throws aside all caution — a desperate, all-or-nothing assault!`,
      },
    ];
  }
  if (result === 'SURVIVAL_STRIKE') {
    return [
      {
        minute,
        text: `${actorName} barely survives the onslaught — and answers with fury!`,
      },
    ];
  }
  if (result === 'DESPERATE') {
    return [{ minute, text: `${actorName} is in dire straits — switching to survival mode.` }];
  }
  if (result?.startsWith('PSYCH_')) {
    const state = result.replace('PSYCH_', '');
    const psychLines: Record<string, string> = {
      INTHEZONE: `${actorName}'s movements become fluid and precise — completely locked in.`,
      RATTLED: `${actorName} can't find the rhythm. Something has broken their composure.`,
      DESPERATE: `${actorName} fights on pure instinct now, their mind fracturing under the pressure.`,
      CRUISING: `${actorName} looks almost comfortable — controlling this fight with ease.`,
    };
    const line = psychLines[state];
    return line && h.rng.next() < 0.5 ? [{ minute, text: line }] : [];
  }
  return [];
};

const narrateRangeShiftEvent: EventNarrator = (event, h, minute) => {
  if (!event.result) return [];
  return [
    { minute, text: narrateRangeShift(h.rng, h.getName(event.actor), event.result as string) },
  ];
};

const narrateFeintSuccessEvent: EventNarrator = (event, h, minute) => [
  {
    minute,
    text: narrateFeint(h.rng, h.getName(event.actor), true, h.getOpponentName(event.actor)),
  },
];

const narrateArenaEvent: EventNarrator = (event, _h, minute) => {
  const text = event.metadata?.narrativeText;
  return typeof text === 'string' && text ? [{ minute, text }] : [];
};

const narrateFeintFailEvent: EventNarrator = (event, h, minute) => [
  {
    minute,
    text: narrateFeint(h.rng, h.getName(event.actor), false, h.getOpponentName(event.actor)),
  },
];

const narrateZoneShiftEvent: EventNarrator = (event, h, minute) => {
  if (!event.result || !event.target) return [];
  const pushedName = h.getName(event.target as 'A' | 'D');
  return [{ minute, text: narrateZoneShift(h.rng, pushedName, event.result as string) }];
};

/** Dispatch table: CombatEvent.type -> narrator. Absent keys produce no lines. */
export const EVENT_NARRATORS: Partial<Record<CombatEvent['type'], EventNarrator>> = {
  INITIATIVE: narrateInitiativeEvent,
  ATTACK: narrateAttackEvent,
  KNOCKDOWN: narrateKnockdownEvent,
  RECOVERY: narrateRecoveryEvent,
  DEFENSE: narrateDefenseEvent,
  HIT: narrateHitEvent,
  FATIGUE: narrateFatigueEvent,
  PASSIVE: narratePassiveEvent,
  INSIGHT: narrateInsightEvent,
  MOMENTUM_SHIFT: narrateMomentumShiftEvent,
  STATE_CHANGE: narrateStateChangeEvent,
  RANGE_SHIFT: narrateRangeShiftEvent,
  FEINT_SUCCESS: narrateFeintSuccessEvent,
  FEINT_FAIL: narrateFeintFailEvent,
  ZONE_SHIFT: narrateZoneShiftEvent,
  ARENA_EVENT: narrateArenaEvent,
};
