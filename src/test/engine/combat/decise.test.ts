/**
 * Canon: decisiveness skill feeds strike order — the D2 "decise" doctrine is
 * a skill-level effect, not only the named offensive tactic (Noblish Island
 * articles). GREEN — skills.DEC feeds the initiative sum at DEC_INI_COEFF.
 *
 * DEC diff is injected directly on FighterState.skills so the assertion
 * isolates the mechanic (WL→DEC exists at the attribute layer but WL also
 * feeds INI at 22+, so attribute-level setups would confound the read).
 */
import { describe, it, expect } from 'vitest';
import { resolveInitiativePhase } from '@/engine/combat/resolution/initiativePhase';
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';

const phaseArgs = (decA: number, decD: number, seed: number) => {
  const rng = new SeededRNG(seed);
  const ctx = makeResolutionContext({ rng: () => rng.next() });
  const fA = makeFighterState({ skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: decA } });
  const fD = makeFighterState({
    label: 'D',
    skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: decD },
  });
  const s = prepareExchange(ctx, fA, fD, []);
  return {
    ctx,
    fA,
    fD,
    OE_A: s.OE_A,
    AL_A: s.AL_A,
    OE_D: s.OE_D,
    AL_D: s.AL_D,
    fatA: s.fatA,
    fatD: s.fatD,
    defModsA: s.defModsA,
    defModsD: s.defModsD,
    passA: s.passA,
    passD: s.passD,
    psychA: s.psychA,
    psychD: s.psychD,
    dynTraitsA: s.dynTraitsA,
    dynTraitsD: s.dynTraitsD,
  };
};

describe('DEC skill feeds strike order (canon)', () => {
  it('higher DEC lands a strictly larger initiative sum', () => {
    const a = resolveInitiativePhase(phaseArgs(15, 5, 1));
    expect(a.iniA - a.iniD).toBeGreaterThan(0);
  });

  it('monte-carlo: the decisive fighter strikes first materially more often', () => {
    const trials = 400;
    let aFirst = 0;
    for (let seed = 1; seed <= trials; seed++) {
      if (resolveInitiativePhase(phaseArgs(16, 6, seed)).aGoesFirst) aFirst++;
    }
    // +10 DEC at DEC_INI_COEFF should clear ~55% of contests
    expect(aFirst / trials).toBeGreaterThan(0.55);
  });

  it('equal DEC leaves the contest symmetric (~50%)', () => {
    const trials = 400;
    let aFirst = 0;
    for (let seed = 1; seed <= trials; seed++) {
      if (resolveInitiativePhase(phaseArgs(10, 10, seed)).aGoesFirst) aFirst++;
    }
    expect(aFirst / trials).toBeGreaterThan(0.35);
    expect(aFirst / trials).toBeLessThan(0.65);
  });
});
