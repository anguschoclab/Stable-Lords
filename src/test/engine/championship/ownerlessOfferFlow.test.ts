/**
 * End-to-end lifecycle for a champion whose stable dissolves while a title
 * defense is outstanding — the scenario that produced the strip storm.
 *
 * Pipeline: offerProcessor (rivalStrategy) marks the ownerless champion's
 * response Declined+voided → resolveImpacts swaps the bankrupt stable for
 * its successor → sweepTitleRefusals records NO refusal → next tick
 * enforceVacancies ends the reign 'retired' — never 'stripped'.
 */
import { describe, it, expect } from 'vitest';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker/offerProcessor';
import { STABLE_DISSOLVED_REASON } from '@/engine/bout/mutations/contractMutations';
import { resolveImpacts } from '@/engine/impacts';
import { buildWeekCaches } from '@/engine/pipeline/services/weekPipeline/caches';
import {
  sweepTitleRefusals,
  enforceVacancies,
  createChampionshipDelta,
} from '@/engine/championship/arenaChampionship';
import { ARENA_TITLE, ARENA_COMMISSION_ID } from '@/constants/arena';
import { makeGameState, makeRival, makeWarrior, makeBoutOffer } from '@/test/_fixtures/factories';
import { makeArenaTitle, makeVenueWarrior } from '@/test/_fixtures/arenaTitle';
import type { BoutOffer, GameState, RivalStableData } from '@/types/state.types';
import type { BoutOfferId, StableId, WarriorId } from '@/types/shared.types';

const arenaId = 'standard_arena';

describe('dissolved-stable champion — offer voids instead of refusing', () => {
  it('marks the defense void, accrues no refusal, and retires the reign next tick', () => {
    // World-stage snapshot: champion still rides the doomed stable's roster
    // (the bankruptcy swap lands at stage end via rivalReplacements).
    const champ = makeVenueWarrior('w-champ', { wins: 8, losses: 0, arenaId });
    const challenger = makeVenueWarrior('w-cont', { wins: 5, losses: 0, arenaId });
    const doomed = makeRival({
      id: 'r-dead' as StableId,
      treasury: -10_000,
      roster: [champ],
    });
    const successor = makeRival({ id: 'r-heir' as StableId, roster: [makeWarrior()] });
    const healthy = makeRival({ id: 'r-ok' as StableId, treasury: 100, roster: [challenger] });

    const offer = makeBoutOffer({
      id: 'o-defense' as BoutOfferId,
      warriorIds: ['w-champ' as WarriorId, 'w-cont' as WarriorId],
      promoterId: ARENA_COMMISSION_ID as BoutOffer['promoterId'],
      titleArenaId: arenaId,
      boutWeek: 10,
      expirationWeek: 11,
      status: 'Proposed',
      responses: { 'w-champ': 'Pending', 'w-cont': 'Pending' } as BoutOffer['responses'],
    });

    const state = makeGameState({
      absoluteWeek: 10,
      week: 10,
      rivals: [doomed, healthy],
      boutOffers: { [offer.id]: offer },
      arenaChampions: {
        [arenaId]: makeArenaTitle('w-champ', {
          refusals: ARENA_TITLE.REFUSALS_TO_STRIP - 1, // one shy of stripping
        }),
      },
    });

    // Rival strategy sees the finalized world: successor replaced r-dead.
    const finalized: RivalStableData[] = [successor, healthy];
    const offerImpact = processAllRivalsBoutOffers(state, finalized);
    const outOffer = offerImpact.boutOffers!['o-defense' as BoutOfferId]!;
    expect(outOffer.responses['w-champ' as WarriorId]).toBe('Declined');
    expect(outOffer.responseNotes?.['w-champ' as WarriorId]).toBe(STABLE_DISSOLVED_REASON);

    // Stage-end resolution: offers + the bankruptcy swap land together.
    const resolved: GameState = resolveImpacts(state, [
      { boutOffers: offerImpact.boutOffers },
      { rivalReplacements: new Map([['r-dead' as StableId, successor]]) },
    ]);
    buildWeekCaches(resolved);
    expect(resolved.rivals.map((r) => r.id)).toEqual(['r-heir', 'r-ok']);

    // The refusal sweep must not treat the void as ducking — one shy of the
    // strip threshold, a false refusal would end the reign as 'stripped'.
    const delta = createChampionshipDelta();
    sweepTitleRefusals(resolved, delta);
    const title = delta.arenaChampions[arenaId] ?? resolved.arenaChampions![arenaId]!;
    expect(title.refusals).toBe(ARENA_TITLE.REFUSALS_TO_STRIP - 1);
    expect(title.champion?.warriorId).toBe('w-champ');
    expect(title.history).toHaveLength(0);

    // Next tick's vacancy enforcement ends the reign cleanly.
    const delta2 = createChampionshipDelta();
    enforceVacancies(resolved, delta2);
    const retired = delta2.arenaChampions[arenaId]!;
    expect(retired.champion).toBeNull();
    expect(retired.history[0]!.endReason).toBe('retired');
    expect(retired.history[0]!.warriorId).toBe('w-champ');
  });
});
