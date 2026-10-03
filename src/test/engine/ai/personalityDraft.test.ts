import { describe, it, expect } from 'vitest';
import { processRecruitment } from '@/engine/ai/workers/recruitmentWorker';
import { SeededRNGService } from '@/utils/random';
import { makeRival, makeOwner, makeTestRecruit } from '@/test/_fixtures/factories';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import type { RivalStableData } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { aiRosterMax } from '@/constants/ai';

const makeRivalWithPersonality = (personality: string, treasury = 5000): RivalStableData =>
  makeRival({
    owner: makeOwner({ personality: personality as never }),
    roster: [],
    treasury,
  } as never);

const recruit = (id: string, tier: string, cost: number): PoolWarrior =>
  makeTestRecruit({
    id: id as never,
    name: `Recruit ${id}`,
    tier: tier as never,
    cost,
    age: 18,
    style: FightingStyle.StrikingAttack,
    addedWeek: 1,
  });

describe('personality draft weights', () => {
  it('Showman pays for the Prodigy; Pragmatic takes the value buy', () => {
    // Pool order deliberately puts the cheap Common first — score, not
    // position, decides.
    const pool = () => [recruit('common', 'Common', 50), recruit('prodigy', 'Prodigy', 500)];

    const showman = processRecruitment(
      makeRivalWithPersonality('Showman'),
      pool(),
      5,
      new SeededRNGService(1),
      false
    );
    expect(showman.updatedRival.roster[0]?.name).toBe('Recruit prodigy');

    const pragmatic = processRecruitment(
      makeRivalWithPersonality('Pragmatic'),
      pool(),
      5,
      new SeededRNGService(1),
      false
    );
    expect(pragmatic.updatedRival.roster[0]?.name).toBe('Recruit common');
  });

  it('Methodical prefers the young prospect over the aged veteran', () => {
    const pool = () => [
      recruit('vet', 'Promising', 100), // age overridden below
      recruit('kid', 'Promising', 100),
    ];
    const vet = pool()[0]!;
    (vet as any).age = 30;
    (vet as any).veteran = {
      fame: 40,
      popularity: 10,
      career: { wins: 12, losses: 4, kills: 2 },
      titles: [],
    };
    const kid = pool()[1]!;
    (kid as any).age = 17;

    const methodical = processRecruitment(
      makeRivalWithPersonality('Methodical'),
      [vet, kid],
      5,
      new SeededRNGService(1),
      false
    );
    expect(methodical.updatedRival.roster[0]?.name).toBe('Recruit kid');

    // Aggressive has zero youth bonus — the veteran's career bonus wins.
    const aggressive = processRecruitment(
      makeRivalWithPersonality('Aggressive'),
      [vet, kid],
      5,
      new SeededRNGService(1),
      false
    );
    expect(aggressive.updatedRival.roster[0]?.name).toBe('Recruit vet');
  });

  it('a solvent stable below its cap drafts every week until full', () => {
    let rival = makeRivalWithPersonality('Pragmatic');
    const styles = [
      FightingStyle.StrikingAttack,
      FightingStyle.BashingAttack,
      FightingStyle.AimedBlow,
      FightingStyle.ParryStrike,
    ];
    const pool = Array.from({ length: 30 }, (_, i) => {
      const r = recruit(`p${i}`, 'Promising', 20);
      (r as any).style = styles[i % styles.length];
      return r;
    });
    let remaining = pool;
    let signings = 0;
    for (let week = 1; week <= 6; week++) {
      const res = processRecruitment(
        rival,
        remaining,
        week,
        new SeededRNGService(week),
        false
      );
      rival = res.updatedRival;
      remaining = res.updatedPool;
      signings = rival.roster.length;
      if (signings >= aiRosterMax('Pragmatic')) break;
    }
    expect(signings).toBe(aiRosterMax('Pragmatic'));
  });
});
