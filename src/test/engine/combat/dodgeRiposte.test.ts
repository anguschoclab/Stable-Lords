/**
 * Canon: a successful dodge enables a riposte check — the attacker's whiffed
 * swing leaves them open to a counter (Noblish Island "dodge and strike").
 * VERIFIED-PRESENT: the dodge path already funnels into the whiff-riposte
 * channel (DEFENSE:DODGE → DEFENSE:RIPOSTE → counterattack). Spec keeps the
 * pairing pinned.
 */
import { describe, it, expect } from 'vitest';
import { resolveExchange } from '@/engine/combat/resolution/resolution';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { FighterState } from '@/engine/combat/resolution/types';

/** Defender who only dodges: AL 8 + no defensive tactic → every defend check is a dodge. */
const dodger = (rip: number): FighterState => {
  const plan = {
    style: FightingStyle.ParryRiposte,
    OE: 2,
    AL: 8,
  } as FighterState['activePlan'];
  return makeFighterState({
    label: 'D',
    style: FightingStyle.ParryRiposte,
    skills: { ATT: 5, PAR: 3, DEF: 18, INI: 3, RIP: rip, DEC: 10 },
    plan,
    activePlan: plan,
  });
};

const attacker = () => {
  const plan = {
    style: FightingStyle.StrikingAttack,
    OE: 8,
    AL: 8,
  } as FighterState['activePlan'];
  return makeFighterState({
    skills: { ATT: 12, PAR: 8, DEF: 8, INI: 14, RIP: 5, DEC: 10 },
    plan,
    activePlan: plan,
  });
};

/** Run one exchange; report the D's DEFENSE result sequence. */
const defenseResults = (seed: number, rip = 15) => {
  const rng = new SeededRNG(seed);
  const ctx = makeResolutionContext({ rng: () => rng.next() });
  const fA = attacker();
  const fD = dodger(rip);
  return resolveExchange(ctx, fA, fD)
    .filter((e) => e.type === 'DEFENSE' && e.actor === 'D')
    .map((e) => e.result as string);
};

describe('dodge → riposte (canon)', () => {
  it('the dodge branch can produce riposte outcomes across seeds', () => {
    let dodges = 0;
    let dodgeFollowedByRiposte = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const results = defenseResults(seed);
      const sawDodge = results.includes('DODGE');
      dodges += results.filter((r) => r === 'DODGE').length;
      // A dodge converts to a riposte check — the RIPOSTE result follows a
      // DODGE in the same defense sequence (whiff ripostes follow WHIFF
      // attack events, not DODGE defense events).
      if (sawDodge && results.indexOf('RIPOSTE') > results.indexOf('DODGE')) {
        dodgeFollowedByRiposte++;
      }
    }
    expect(dodges).toBeGreaterThan(20);
    expect(dodgeFollowedByRiposte).toBeGreaterThan(0);
  });

  it('a dodge-riposte converts at a meaningful rate', () => {
    let dodges = 0;
    let converted = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const results = defenseResults(seed, 18);
      const i = results.indexOf('DODGE');
      if (i === -1) continue;
      dodges++;
      if (results.indexOf('RIPOSTE', i + 1) !== -1) converted++;
    }
    // RIP 18 vs ATT 12 — canon expects a non-trivial conversion.
    expect(dodges).toBeGreaterThan(20);
    expect(converted / dodges).toBeGreaterThan(0.05);
  });
});
