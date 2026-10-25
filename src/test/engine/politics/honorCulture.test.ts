/**
 * Arena honor culture (canon: Andorian arenas frown on down-challenges).
 */
import { describe, it, expect } from 'vitest';
import {
  arenaIsHonorBound,
  isDownChallenge,
  HONOR_DOWN_CHALLENGE_MARGIN,
} from '@/engine/politics/honorCulture';
import { makeWarrior } from '@/test/_fixtures/factories';
import { makeBidScenario, runBidConversion } from '@/test/_fixtures/bidConversion';

describe('arenaIsHonorBound', () => {
  it('recognizes an honor-bound venue', () => {
    expect(arenaIsHonorBound('walled_court_arena')).toBe(true);
  });

  it('returns false for ordinary or unknown venues', () => {
    expect(arenaIsHonorBound('mudpit_arena')).toBe(false);
    expect(arenaIsHonorBound(undefined)).toBe(false);
    expect(arenaIsHonorBound('no_such_arena')).toBe(false);
  });
});

describe('isDownChallenge', () => {
  it('flags punching down beyond the recognition margin', () => {
    const famous = makeWarrior({ fame: 100 });
    const nobody = makeWarrior({ fame: 100 - HONOR_DOWN_CHALLENGE_MARGIN - 1 });
    expect(isDownChallenge(famous, nobody)).toBe(true);
  });

  it('does not flag peers or up-challenges', () => {
    const a = makeWarrior({ fame: 100 });
    const peer = makeWarrior({ fame: 100 - HONOR_DOWN_CHALLENGE_MARGIN });
    const bigger = makeWarrior({ fame: 140 });
    expect(isDownChallenge(a, peer)).toBe(false);
    expect(isDownChallenge(a, bigger)).toBe(false);
  });
});

describe('AI down-challenge suppression in honor-bound venues', () => {
  function setup(arenaId?: string) {
    // Scrub: a down-challenge (fame gap 35) whose favorable style matchup
    // would win the pairwise pick absent the dishonor penalty.
    const scrubW = makeWarrior({ fame: 55, style: 'Lunging Attack' as any });
    // Peer: not a down-challenge (fame gap 20) but a worse matchup for the
    // proposer — only wins when the honor penalty suppresses the scrub.
    const peerW = makeWarrior({
      fame: 70,
      style: 'Aimed Blow' as any,
      career: { wins: 15, losses: 10, kills: 0 },
    });
    const famousProposer = makeWarrior({ fame: 90, career: { wins: 12, losses: 6, kills: 0 } });
    return {
      ...makeBidScenario({
        proposerW: famousProposer,
        candidates: [scrubW, peerW],
        bidOverrides: { arenaId: arenaId as any },
      }),
      scrubW,
      peerW,
    };
  }

  const convert = runBidConversion;

  it('suppresses the down-challenge pick when the venue is honor-bound', () => {
    const s = setup('walled_court_arena');
    const offers = convert(s);
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(s.peerW.id);
  });

  it('permits the down-challenge pick in an ordinary venue', () => {
    const s = setup('mudpit_arena');
    const offers = convert(s);
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(s.scrubW.id);
  });
});
