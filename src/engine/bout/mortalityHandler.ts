import type { GameState, NewsletterItem } from '@/types/state.types';
import type { WarriorId, InjuryId } from '@/types/shared.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { FightOutcome, FightSummary } from '@/types/combat.types';
import { generateFightNarrative } from '@/engine/gazette/gazetteNarrative';
import { engineEventBus } from '@/engine/core/EventBus';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { formatDateOfDeath } from '@/utils/format';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { StateImpact } from '@/engine/impacts';
import { isPlayerOwned, patchRivalWarrior } from './warriorRouting';
import { weekToTimestamp } from '@/constants';

/**
 * Handle death.
 * @param s -
 * @param wA -
 * @param wD -
 * @param outcome -
 * @param week -
 * @param tags -
 * @param rivalStableId -
 * @param rng -
 */
/**
 * House rule (Design Bible §21.2): fatal blows maim instead of kill. The
 * victim survives with a Critical permanent injury; no graveyard entry,
 * no death narrative, no fame-from-death.
 */
function applySevereInjuryRule(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  week: number,
  rivalStableId: string | undefined,
  rng: IRNGService
) {
  const spared = outcome.winner === 'A' ? wD : wA;
  const injury: InjuryData = {
    id: rng.uuid() as InjuryId,
    name: 'Near-Fatal Wound',
    description:
      'A blow that should have been lethal. The crowd calls it a miracle; the healers call it a career question.',
    severity: 'Critical',
    location: 'Head',
    weeksRemaining: 24,
    penalties: { ST: -4, SP: -3, ATT: -3, DF: -3, CN: -2 },
  };
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  if (s.roster.some((w) => w.id === spared.id))
    rosterUpdates.set(spared.id, { injuries: [...spared.injuries, injury] });
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
  if (!s.roster.some((w) => w.id === spared.id)) {
    patchRivalWarrior(rivalWarriorPatches, spared, { injuries: [...spared.injuries, injury] });
  }
  void rivalStableId;
  const impact: StateImpact = {
    rosterUpdates,
    rivalWarriorPatches,
    newsletterItems: [
      {
        id: rng.uuid(),
        week,
        title: 'Miraculous Survival',
        items: [
          `${warriorDisplayName(spared)} was left for dead by ${warriorDisplayName(outcome.winner === 'A' ? wA : wD)}, but the healers refused to give up. (House rule: severe injury instead of death)`,
        ],
      },
    ],
  };
  return {
    impact,
    death: false,
    playerDeath: false,
    deathNames: [],
  };
}

/**
 * Derive the canonical DeathCauseBucket. Precedence:
 *   RIVALRY_FINISH (if the two stables were rivals at the time of the kill)
 *   > whatever the combat resolver stamped (EXECUTION / CRITICAL_CHAIN / ARMOR_FAILURE / FATIGUE_COLLAPSE)
 *   > FATAL_DAMAGE as the catch-all.
 */
function deriveCauseBucket(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome): string {
  const stableIds = [wA.stableId, wD.stableId].filter(
    (x): x is import('@/types/shared.types').StableId => !!x
  );
  const isRivalryKill =
    stableIds.length === 2 &&
    (s.rivalries ?? []).some(
      (r) =>
        (r.stableIdA === stableIds[0] && r.stableIdB === stableIds[1]) ||
        (r.stableIdA === stableIds[1] && r.stableIdB === stableIds[0])
    );
  const stampedCause = outcome.post?.causeBucket;
  return isRivalryKill ? 'RIVALRY_FINISH' : (stampedCause ?? 'FATAL_DAMAGE');
}

/**
 * Handle death.
 * @param s -
 * @param wA -
 * @param wD -
 * @param outcome -
 * @param week -
 * @param tags -
 * @param rivalStableId -
 * @param rng -
 */
/**
 * Builds the narrative + memorial event + graveyard entry for a kill — the
 * immutable artifacts recorded before state impact assembly.
 */
function buildDeathArtifacts(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  week: number,
  tags: string[],
  victim: Warrior,
  rng: IRNGService
) {
  const boutId = rng.uuid();
  const narrative = generateFightNarrative(
    {
      id: boutId,
      week,
      a: wA.name,
      d: wD.name,
      warriorIdA: wA.id,
      warriorIdD: wD.id,
      winner: outcome.winner,
      by: outcome.by,
      styleA: wA.style,
      styleD: wD.style,
      transcript: [],
      title: `${wA.name} vs ${wD.name}`,
      phase: 'resolution',
      createdAt: weekToTimestamp(week),
    } as unknown as FightSummary,
    s.crowdMood
  );

  const event = {
    boutId,
    killerId: outcome.winner === 'A' ? wA.id : wD.id,
    deathSummary: narrative,
    memorialTags: tags,
  };
  const causeBucket = deriveCauseBucket(s, wA, wD, outcome);

  // Pure State Transformation for Death.
  // Deep-copy the victim: a shallow spread would leave nested mutables
  // (favorites.discovered, injuries, flair) aliased to the still-live roster
  // object — post-death progression writes (checkDiscovery runs after this
  // handler and rival victims stay addressable via stale roster rebuilds)
  // would leak into the memorial. A graveyard entry is a snapshot at death.
  const graveyardEntry: Warrior = {
    ...structuredClone(victim),
    status: 'Dead',
    deathWeek: week,
    isDead: true,
    killedBy: outcome.winner === 'A' ? wA.name : wD.name,
    causeOfDeath: causeBucket,
    dateOfDeath: formatDateOfDeath(week, s.season),
    deathEvent: { ...event, causeBucket } as typeof event & { causeBucket: string },
  };

  return { narrative, graveyardEntry };
}

/**
 * Handle death.
 * @param s -
 * @param wA -
 * @param wD -
 * @param outcome -
 * @param week -
 * @param tags -
 * @param rivalStableId -
 * @param rng -
 */
export function handleDeath(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  week: number,
  tags: string[],
  rivalStableId?: string,
  rng: IRNGService = new SeededRNGService(week * 9973 + 123)
) {
  if (outcome.by !== 'Kill')
    return { impact: {}, death: false, playerDeath: false, deathNames: [] };

  if (s.houseRules?.severeInjuryInsteadOfDeath) {
    return applySevereInjuryRule(s, wA, wD, outcome, week, rivalStableId, rng);
  }

  const victim = outcome.winner === 'A' ? wD : wA;
  // Ownership, not side: the victim may sit on either side of the pairing and
  // `rivalStableId` only ever names the D-side stable. AI-vs-AI deaths granted
  // the player +5 fame, and player victims on the D side never flagged.
  const isPlayerVictim = isPlayerOwned(s, victim);

  const { narrative, graveyardEntry } = buildDeathArtifacts(
    s,
    wA,
    wD,
    outcome,
    week,
    tags,
    victim,
    rng
  );

  return assembleDeathImpact(s, victim, isPlayerVictim, graveyardEntry, narrative, week, rng);
}

/** Assemble the death impact: roster updates, obituary, event, fame delta. */
function assembleDeathImpact(
  s: GameState,
  victim: Warrior,
  isPlayerVictim: boolean,
  graveyardEntry: Warrior,
  narrative: string,
  week: number,
  rng: IRNGService
) {
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];

  // Remove victim from roster
  if (s.roster.some((w) => w.id === victim.id)) {
    rosterUpdates.set(victim.id, { status: 'Dead' });
  }

  if (isPlayerVictim) {
    newsletterItems.push({
      id: rng.uuid(),
      week,
      title: 'Fame Gained',
      items: ['Your stable gained 5 fame from this death.'],
    });
  }

  newsletterItems.push({ id: rng.uuid(), week, title: 'Arena Obituary', items: [narrative] });

  // Decoupled notification
  engineEventBus.emit({
    type: 'WARRIOR_DEATH',
    payload: { warriorId: victim.id, name: victim.name },
  });

  // Any rival-owned victim leaves its roster — not only the player-kills-rival
  // case. World bouts are rival vs rival, and the old whole-roster
  // rivalsUpdates write was clobbered by later bout impacts either way, so
  // killed rival warriors kept fighting ("zombies") and could be re-killed
  // or crowned after death.
  const rivalRosterRemovals: WarriorId[] = s.roster.some((w) => w.id === victim.id)
    ? []
    : [victim.id];

  const impact: StateImpact = {
    graveyard: [graveyardEntry],
    unacknowledgedDeaths: [victim.id],
    rosterUpdates,
    rivalRosterRemovals,
    newsletterItems,
    fameDelta: isPlayerVictim ? 5 : 0,
  };

  return {
    impact,
    death: true,
    playerDeath: isPlayerVictim,
    deathNames: [warriorDisplayName(victim)],
  };
}
