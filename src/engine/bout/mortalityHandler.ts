import type { GameState, RivalStableData, NewsletterItem } from '@/types/state.types';
import type { WarriorId, StableId, InjuryId } from '@/types/shared.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { FightOutcome, FightSummary } from '@/types/combat.types';
import { generateFightNarrative } from '@/engine/gazette/gazetteNarrative';
import { engineEventBus } from '@/engine/core/EventBus';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { formatDateOfDeath } from '@/utils/format';
import { StateImpact } from '@/engine/impacts';
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

  // House rule (Design Bible §21.2): fatal blows maim instead of kill. The
  // victim survives with a Critical permanent injury; no graveyard entry,
  // no death narrative, no fame-from-death.
  if (s.houseRules?.severeInjuryInsteadOfDeath) {
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
    const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
    if (rivalStableId) {
      const rival = s.rivalMap?.get(rivalStableId as StableId);
      if (rival?.roster.some((w) => w.id === spared.id))
        rivalsUpdates.set(rivalStableId as StableId, {
          roster: rival.roster.map((w) =>
            w.id === spared.id ? { ...w, injuries: [...w.injuries, injury] } : w
          ),
        });
    }
    return {
      impact: {
        rosterUpdates,
        rivalsUpdates,
        newsletterItems: [
          {
            id: rng.uuid(),
            week,
            title: 'Miraculous Survival',
            items: [
              `${spared.name} was left for dead by ${outcome.winner === 'A' ? wA.name : wD.name}, but the healers refused to give up. (House rule: severe injury instead of death)`,
            ],
          },
        ],
      },
      death: false,
      playerDeath: false,
      deathNames: [],
    };
  }

  const victim = outcome.winner === 'A' ? wD : wA;
  const isPlayerVictim = outcome.winner === 'A' && !!rivalStableId ? false : outcome.winner !== 'A';

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

  // Derive the canonical DeathCauseBucket. Precedence:
  //   RIVALRY_FINISH (if the two stables were rivals at the time of the kill)
  //   > whatever the combat resolver stamped (EXECUTION / CRITICAL_CHAIN / ARMOR_FAILURE / FATIGUE_COLLAPSE)
  //   > FATAL_DAMAGE as the catch-all.
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
  const causeBucket: string = isRivalryKill ? 'RIVALRY_FINISH' : (stampedCause ?? 'FATAL_DAMAGE');

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

  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
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

  if (rivalStableId && outcome.winner === 'A') {
    // Player killed a rival. rivalStableId is rival.id (StableId), not owner.id —
    // looking up by owner.id silently failed, so the dead warrior stayed in
    // the rival's roster while ALSO being added to the graveyard.
    const rival = s.rivalMap?.get(rivalStableId as StableId);
    if (rival) {
      const updatedRoster = rival.roster.filter((w: Warrior) => w.id !== wD.id);
      rivalsUpdates.set(rivalStableId as StableId, { roster: updatedRoster });
    }
  }

  const impact: StateImpact = {
    graveyard: [graveyardEntry],
    unacknowledgedDeaths: [victim.id],
    rosterUpdates,
    rivalsUpdates,
    newsletterItems,
    fameDelta: isPlayerVictim ? 5 : 0,
  };

  return { impact, death: true, playerDeath: isPlayerVictim, deathNames: [victim.name] };
}
