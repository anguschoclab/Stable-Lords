/**
 * AI learning-seek targeting (canon: "challenge a very experienced warrior").
 * Young warriors of studious personalities prefer seasoned opponents.
 */
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/test/_fixtures/factories';
import { makeBidScenario, runBidConversion } from '@/test/_fixtures/bidConversion';

function setup(personality: string) {
  const rookieW = makeWarrior({ fame: 60 });
  const veteranW = makeWarrior({ fame: 60, career: { wins: 25, losses: 15, kills: 0 } });
  const youngProposer = makeWarrior({ fame: 60, career: { wins: 1, losses: 1, kills: 0 } });
  // Rookie stable listed FIRST — pure-score tie means first candidate wins,
  // so only a real learning bonus flips the pick to the veteran.
  return {
    ...makeBidScenario({
      proposerW: youngProposer,
      personality,
      candidates: [rookieW, veteranW],
    }),
    rookieW,
    veteranW,
  };
}

const convert = runBidConversion;

describe('AI learning-seek (challenge up to learn)', () => {
  it('a young Methodical proposer picks the seasoned veteran over the rookie', () => {
    const s = setup('Methodical');
    const offers = convert(s);
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(s.veteranW.id);
  });

  it('a young Aggressive proposer gets no learning bonus — first candidate wins the tie', () => {
    const s = setup('Aggressive');
    const offers = convert(s);
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(s.rookieW.id);
  });

  it('a veteran proposer is too seasoned to learn-seek', () => {
    const s = setup('Methodical');
    s.rivals[0]!.roster[0]!.career = { wins: 15, losses: 10, kills: 0 };
    const offers = convert(s);
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(s.rookieW.id);
  });
});
