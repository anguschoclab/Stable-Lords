/**
 * dominant-player pressure in bout acceptance.
 * When the player stable dominates the realm rankings, rival owners adjust
 * how they treat player-bound offers: calculating camps avoid feeding the
 * dominant stable, Showmen chase the upset, and everyone negotiates harder
 * because the dominant stable can afford it.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker';
import {
  makeBoutOffer,
  makeGameState,
  makeOwner,
  makeRival,
  makeWarrior,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import {
  dominantRankings,
  playerPressureState,
} from '@/test/_fixtures/competitionWorker';

beforeEach(() => resetFixtureIds());



describe('dominant-player offer pressure', () => {
  it('a Methodical stable declines a coin-flip bout vs a dominant player', () => {
    // BA vs AB is a mild -1 style edge — accepted at baseline skepticism (-2
    // floor). A calculating camp refuses to feed the dominant stable on a
    // coin flip.
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.BashingAttack });
    const opponent = makeWarrior({
      id: 'pw1' as WarriorId,
      fame: 55,
      style: FightingStyle.AimedBlow,
    });
    const rival = makeRival({
      roster: [warrior],
      treasury: 5000,
      owner: makeOwner({ personality: 'Methodical' }),
    });
    const offer = makeBoutOffer({ warriorIds: [warrior.id, opponent.id], purse: 400, hype: 80 });

    expect(
      evaluateBoutOffer({
        offer: offer,
        rival: rival,
        warrior: warrior,
        currentWeek: 5,
        weather: 'Clear',
        opponent: opponent,
        state: playerPressureState(opponent, true),
      })
    ).toBe('Declined');
    expect(
      evaluateBoutOffer({
        offer: offer,
        rival: rival,
        warrior: warrior,
        currentWeek: 5,
        weather: 'Clear',
        opponent: opponent,
        state: playerPressureState(opponent, false),
      })
    ).toBe('Accepted');
  });

  it('a Showman accepts a low-purse bout vs a dominant player (upset chase)', () => {
    // fame 100 vs a 40g purse: a neutral Showman counters for a fair purse —
    // the dominant-player upset spectacle is worth taking the fight raw.
    const warrior = makeWarrior({ fame: 100, style: FightingStyle.StrikingAttack });
    const opponent = makeWarrior({
      id: 'pw1' as WarriorId,
      fame: 55,
      style: FightingStyle.StrikingAttack,
    });
    const rival = makeRival({
      roster: [warrior],
      treasury: 5000,
      owner: makeOwner({ personality: 'Showman' }),
    });
    const offer = makeBoutOffer({ warriorIds: [warrior.id, opponent.id], purse: 40, hype: 90 });

    expect(
      evaluateBoutOffer({
        offer: offer,
        rival: rival,
        warrior: warrior,
        currentWeek: 5,
        weather: 'Clear',
        opponent: opponent,
        state: playerPressureState(opponent, true),
      })
    ).toBe('Accepted');
    expect(
      evaluateBoutOffer({
        offer: offer,
        rival: rival,
        warrior: warrior,
        currentWeek: 5,
        weather: 'Clear',
        opponent: opponent,
        state: playerPressureState(opponent, false),
      })
    ).toBe('Countered');
  });

  it('non-Aggressive stables counter harder against a dominant player', () => {
    // fame 100 vs a 60g purse clears the neutral floor (100-50) but not the
    // squeeze floor (100-20) — the dominant stable can afford to pay up.
    const warrior = makeWarrior({ fame: 100, style: FightingStyle.StrikingAttack });
    const opponent = makeWarrior({
      id: 'pw1' as WarriorId,
      fame: 55,
      style: FightingStyle.StrikingAttack,
    });
    const rival = makeRival({
      roster: [warrior],
      treasury: 5000,
      owner: makeOwner({ personality: 'Pragmatic' }),
    });
    const offer = makeBoutOffer({ warriorIds: [warrior.id, opponent.id], purse: 60, hype: 80 });

    expect(
      evaluateBoutOffer({
        offer: offer,
        rival: rival,
        warrior: warrior,
        currentWeek: 5,
        weather: 'Clear',
        opponent: opponent,
        state: playerPressureState(opponent, true),
      })
    ).toBe('Countered');
    expect(
      evaluateBoutOffer({
        offer: offer,
        rival: rival,
        warrior: warrior,
        currentWeek: 5,
        weather: 'Clear',
        opponent: opponent,
        state: playerPressureState(opponent, false),
      })
    ).toBe('Accepted');
  });

  it('rival-bound offers are unaffected by player threat level', () => {
    // Same fixtures but the opponent belongs to a rival stable — no player
    // pressure applies even while the player is dominant.
    const warrior = makeWarrior({ fame: 100, style: FightingStyle.StrikingAttack });
    const opponent = makeWarrior({
      id: 'rw1' as WarriorId,
      fame: 55,
      style: FightingStyle.StrikingAttack,
    });
    const rival = makeRival({
      roster: [warrior],
      treasury: 5000,
      owner: makeOwner({ personality: 'Pragmatic' }),
    });
    const oppStable = makeRival({ roster: [opponent] });
    const offer = makeBoutOffer({ warriorIds: [warrior.id, opponent.id], purse: 60, hype: 80 });

    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [makeWarrior({ id: 'pw1' as WarriorId })],
      rivals: [rival, oppStable],
      realmRankings: dominantRankings('pw1'),
    });
    expect(
      evaluateBoutOffer({
        offer: offer,
        rival: rival,
        warrior: warrior,
        currentWeek: 5,
        weather: 'Clear',
        opponent: opponent,
        state: state,
      })
    ).toBe('Accepted');
  });
});
