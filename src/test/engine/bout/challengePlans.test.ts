/**
 * Challenge-context alternate strategies (canon "special strategy" slot):
 * a plan override used when you challenge, when you're challenged, or both.
 */
import { describe, it, expect } from 'vitest';
import { applyChallengeContext } from '@/engine/bout/challengePlans';
import { makeWarrior, makePlan } from '@/test/_fixtures/factories';
import type { BoutOffer } from '@/types/state/rankings';
import type { StableId, WarriorId } from '@/types/shared.types';

const offer = (over: Partial<BoutOffer> = {}): BoutOffer => ({
  id: 'o1' as any,
  promoterId: 'p1' as any,
  warriorIds: [] as WarriorId[],
  boutWeek: 5,
  expirationWeek: 6,
  purse: 100,
  hype: 50,
  status: 'Signed',
  responses: {},
  ...over,
});

const proposerPlan = { OE: 10, AL: 2, killDesire: 9 };
const challengedPlan = { OE: 1, AL: 9, killDesire: 1 };

describe('applyChallengeContext', () => {
  it('applies whenProposer to the warrior whose stable proposed the bout', () => {
    const w = makeWarrior({
      stableId: 'stable-a' as StableId,
      plan: makePlan({ challengePlans: { whenProposer: proposerPlan } }),
    });
    const contract = offer({ proposerStableId: 'stable-a' as StableId });
    const out = applyChallengeContext(w, w.plan!, contract);
    expect(out.OE).toBe(10);
    expect(out.AL).toBe(2);
    expect(out.killDesire).toBe(9);
  });

  it('applies whenChallenged to the warrior being challenged', () => {
    const w = makeWarrior({
      stableId: 'stable-d' as StableId,
      plan: makePlan({ challengePlans: { whenChallenged: challengedPlan } }),
    });
    const contract = offer({ proposerStableId: 'stable-a' as StableId });
    const out = applyChallengeContext(w, w.plan!, contract);
    expect(out.OE).toBe(1);
    expect(out.AL).toBe(9);
  });

  it('treats warriorIds[0] as the proposer when proposerStableId is absent', () => {
    const w = makeWarrior({
      stableId: 'stable-d' as StableId,
      plan: makePlan({ challengePlans: { whenChallenged: challengedPlan } }),
    });
    const proposer = makeWarrior({ stableId: 'stable-a' as StableId });
    const contract = offer({
      proposerStableId: undefined,
      warriorIds: [proposer.id, w.id],
    });
    const out = applyChallengeContext(w, w.plan!, contract);
    expect(out.OE).toBe(1);
    expect(out.AL).toBe(9);
  });

  it('leaves the plan untouched when no override exists for the role', () => {
    const w = makeWarrior({
      stableId: 'stable-d' as StableId,
      plan: makePlan({ challengePlans: { whenProposer: proposerPlan } }),
    });
    const contract = offer({ proposerStableId: 'stable-a' as StableId });
    const out = applyChallengeContext(w, w.plan!, contract);
    expect(out).toBe(w.plan); // challenged role → no whenChallenged → base plan
  });

  it('leaves the plan untouched with no contract or no identifiable proposer', () => {
    const w = makeWarrior({
      stableId: 'stable-d' as StableId,
      plan: makePlan({ challengePlans: { whenChallenged: challengedPlan } }),
    });
    expect(applyChallengeContext(w, w.plan!, undefined)).toBe(w.plan);
    const anon = offer({ warriorIds: [w.id] });
    expect(applyChallengeContext(w, w.plan!, anon)).toBe(w.plan);
  });

  it('leaves the plan untouched for synthetic tournament contracts', () => {
    const w = makeWarrior({
      stableId: 'stable-d' as StableId,
      plan: makePlan({ challengePlans: { whenChallenged: challengedPlan } }),
    });
    const tour = offer({ id: 'tour_t1_0_0' as any, proposerStableId: 'stable-a' as StableId });
    expect(applyChallengeContext(w, w.plan!, tour)).toBe(w.plan);
  });

  it('override inherits base-plan fields it does not set', () => {
    const w = makeWarrior({
      stableId: 'stable-a' as StableId,
      plan: makePlan({
        offensiveTactic: 'Lunge',
        challengePlans: { whenProposer: { OE: 10 } },
      }),
    });
    const contract = offer({ proposerStableId: 'stable-a' as StableId });
    const out = applyChallengeContext(w, w.plan!, contract);
    expect(out.OE).toBe(10);
    expect(out.offensiveTactic).toBe('Lunge'); // inherited from base
    expect(out.AL).toBe(w.plan!.AL); // inherited
  });
});
