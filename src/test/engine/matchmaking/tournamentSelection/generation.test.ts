import { describe, it, expect, vi } from 'vitest';
import type { Warrior } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import {
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
  makeTournamentBaseState,
  makeTournamentWarrior,
} from '@/test/_fixtures/tournamentState';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import { buildTournament } from '@/engine/matchmaking/tournamentSelection/committee';
import { generateSeasonalTiers } from '@/engine/matchmaking/tournamentSelection/core';

const PLAYER_ID = TOURNEY_PLAYER_ID;
const RIVAL_ID = TOURNEY_RIVAL_ID;

describe('odd-sized fields — the tail entrant gets a real bye', () => {
  it('buildTournament places every entrant of an odd field into the bracket', () => {
    const warriors: Warrior[] = [];
    for (let i = 0; i < 5; i++) {
      warriors.push(
        makeTournamentWarrior(
          `ow${i}`,
          `Odd ${i}`,
          FightingStyle.StrikingAttack,
          i % 2 === 0 ? PLAYER_ID : RIVAL_ID
        )
      );
    }

    const tourney = buildTournament({
      tierId: 'Gold',
      tierName: 'Gold Cup',
      warriors: warriors,
      week: 10,
      season: 'Spring',
      rng: new SeededRNG(7),
      year: 1,
    });

    const inBouts = new Set(
      tourney.bracket
        .flatMap((b) => [b.warriorIdA as string, b.warriorIdD as string])
        .filter((id) => id !== 'bye')
    );
    for (const w of warriors) {
      expect(inBouts.has(w.id), `entrant ${w.id} dropped from bracket`).toBe(true);
    }
    // The bye must resolve during the round — a preset winner is skipped by
    // findCurrentRoundBouts and its recipient never reaches the next winners list.
    const bye = tourney.bracket.find((b) => (b.warriorIdD as string) === 'bye');
    expect(bye).toBeDefined();
    expect(bye!.winner).toBeUndefined();
  });
});

describe('generateSeasonalTiers — tournament id uniqueness across years', () => {
  it('produces distinct ids for the same season+week in different years', () => {
    // Year 2's Spring week-13 tournament must not reuse year 1's id — a
    // collision makes find-by-id resolution target the stale completed entry.
    const y1 = generateSeasonalTiers(makeTournamentBaseState(1), 13, 'Spring', 881);
    const y2 = generateSeasonalTiers({ ...makeTournamentBaseState(1), year: 2 }, 13, 'Spring', 881);

    const ids = [...y1, ...y2].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tour of y2) {
      expect(y1.map((t) => t.id)).not.toContain(tour.id);
    }
  });
});
