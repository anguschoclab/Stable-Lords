import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker';
import type { EvaluateBoutOfferArgs } from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import { makeBoutOffer, makeGameState, makeRival } from '@/test/_fixtures/factories';
import type { BoutOffer, GameState, RankingEntry, RivalStableData, Warrior } from '@/types/state.types';
import type { BoutOfferId, InjuryId, StableId, WarriorId } from '@/types/shared.types';
import type { InjuryData } from '@/types/warrior.types';

/** Blocking injury used by offer-gate specs ("Crushed Rib", Severe). */
export const severeInjury: InjuryData = {
  id: 'inj-1' as InjuryId,
  name: 'Crushed Rib',
  severity: 'Severe',
  description: 'Crushed rib',
  weeksRemaining: 6,
  penalties: {},
};

/**
 * Shared eval harness for competitionWorker offer-acceptance specs — sane
 * defaults (Clear weather, week 5) so tests only state what they vary.
 */
export function evalBoutOffer(args: Partial<EvaluateBoutOfferArgs> & Pick<EvaluateBoutOfferArgs, 'offer' | 'rival' | 'warrior'>) {
  return evaluateBoutOffer({ currentWeek: 5, weather: 'Clear', ...args });
}

/** Rankings where `topWarriorId` sits #1 of ten — the 'Dominant' threat profile. */
export function dominantRankings(topWarriorId: string): Record<WarriorId, RankingEntry> {
  const entries: Record<WarriorId, RankingEntry> = {
    [topWarriorId as WarriorId]: { overallRank: 1, classRank: 1, compositeScore: 100 },
  };
  for (let i = 2; i <= 10; i++) {
    entries[`dummy-${i}` as WarriorId] = {
      overallRank: i,
      classRank: i,
      compositeScore: 100 - i,
    };
  }
  return entries;
}

/** Player-owned opponent + dominant rankings (or empty for the control). */
export function playerPressureState(opponent: Warrior, dominant: boolean): GameState {
  return makeGameState({
    week: 5,
    absoluteWeek: 5,
    roster: [opponent],
    realmRankings: dominant ? dominantRankings(opponent.id) : {},
  });
}

/**
 * Rival-with-warrior + bout-offer pair — the fixed two-line preamble every
 * offer-acceptance spec repeats. Tests override only what they vary.
 */
export function rivalOffer(opts: {
  warrior: Warrior;
  opponent?: Warrior;
  rivalOver?: Parameters<typeof makeRival>[0];
  offerOver?: Parameters<typeof makeBoutOffer>[0];
}): { rival: RivalStableData; offer: BoutOffer } {
  const { warrior, opponent, rivalOver = {}, offerOver = {} } = opts;
  const rival = makeRival({ roster: [warrior], ...rivalOver });
  const offer = makeBoutOffer({
    warriorIds: opponent ? [warrior.id, opponent.id] : [warrior.id],
    ...offerOver,
  });
  return { rival, offer };
}

/** Pending 'Proposed' offer — shared by offerProcessor/responseNotes specs. */
export function makePendingOffer(
  id: string,
  warriorIds: string[],
  opts: Partial<BoutOffer> = {}
): BoutOffer {
  return makeBoutOffer({
    id: id as BoutOfferId,
    promoterId: 'prom-1' as never,
    warriorIds: warriorIds as WarriorId[],
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: Object.fromEntries(warriorIds.map((w) => [w, 'Pending'])),
    ...opts,
  });
}

/** GameState carrying pending offers + rivals at week 5. */
export function offerState(
  offers: BoutOffer[],
  rivals: RivalStableData[],
  playerWarriors: Warrior[] = []
): GameState {
  return makeGameState({
    roster: playerWarriors,
    rivals,
    boutOffers: Object.fromEntries(offers.map((o) => [o.id, o])),
    absoluteWeek: 5,
  });
}

/** Consolidating rival carrying a roster — treasury 1000, week-5 planning. */
export function makeOfferRival(
  id: string,
  roster: Warrior[],
  over: Partial<RivalStableData> = {}
): RivalStableData {
  return makeRival({
    id: id as StableId,
    roster,
    treasury: 1000,
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    ...over,
  });
}

/** Positional shorthand for evalBoutOffer's full arg spread. */
export function verdict(
  offer: EvaluateBoutOfferArgs['offer'],
  rival: EvaluateBoutOfferArgs['rival'],
  warrior: EvaluateBoutOfferArgs['warrior'],
  opponent: EvaluateBoutOfferArgs['opponent'],
  state: EvaluateBoutOfferArgs['state']
) {
  return evalBoutOffer({ offer, rival, warrior, opponent, state });
}
