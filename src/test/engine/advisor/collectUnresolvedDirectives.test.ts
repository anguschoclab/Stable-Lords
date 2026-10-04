import { describe, it, expect } from 'vitest';
import { collectUnresolvedDirectives } from '@/engine/advisor/stableCouncil/directives';
import { makeWarrior, makeBoutOffer, makeGameState } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { BoutOffer } from '@/types/state.types';
import type { WarriorAdvisorCard, WarriorActionPayload } from '@/engine/advisor/types';

const mkWarrior = (id: string, over: Partial<Warrior> = {}): Warrior =>
  makeWarrior({
    id: id as WarriorId,
    name: `Warrior_${id}`,
    style: FightingStyle.AimedBlow,
    ...over,
  });

const mkOffer = (id: string, over: Partial<BoutOffer> = {}): BoutOffer =>
  makeBoutOffer({
    id: id as BoutOfferId,
    warriorIds: ['w1' as WarriorId, 'r1' as WarriorId],
    status: 'Proposed',
    responses: { w1: 'Pending', r1: 'Pending' } as BoutOffer['responses'],
    purse: 200,
    ...over,
  });

const mkCard = (
  id: string,
  over: { action?: string; opponentName?: string; payload?: Partial<WarriorActionPayload> } = {}
): WarriorAdvisorCard =>
  ({
    warriorId: id as WarriorId,
    warriorName: `Warrior_${id}`,
    fightAdvice: {
      action: over.action ?? 'HOLD',
      opponent: over.opponentName
        ? ({ id: 'opp' as WarriorId, name: over.opponentName } as never)
        : undefined,
    },
    actionPayload: { warriorId: id as WarriorId, ...over.payload },
  }) as unknown as WarriorAdvisorCard;

const mkArgs = (
  over: Partial<Parameters<typeof collectUnresolvedDirectives>[0]> = {}
): Parameters<typeof collectUnresolvedDirectives>[0] => ({
  state: makeGameState({ week: 5, absoluteWeek: 5, roster: [], rivals: [], boutOffers: {} }),
  cards: [],
  activeWarriors: [],
  playerWarriorIds: new Set<string>(),
  assignedWarriorIds: new Set<string>(),
  upcomingAbsWeek: 6,
  ...over,
});

describe('collectUnresolvedDirectives', () => {
  it('emits unsigned-offer while the recommended contract is still pending', () => {
    const w = mkWarrior('w1');
    const offer = mkOffer('o1');
    const card = mkCard('w1', {
      opponentName: 'Rival X',
      payload: { boutOfferIdToAccept: 'o1' as BoutOfferId },
    });
    const state = makeGameState({ roster: [w], boutOffers: { o1: offer } });

    const out = collectUnresolvedDirectives(
      mkArgs({ state, cards: [card], activeWarriors: [w] })
    );

    const item = out.find((d) => d.kind === 'unsigned-offer' && d.warriorId === 'w1');
    expect(item).toBeDefined();
    expect(item!.label).toContain('Rival X');
    expect(item!.label).toContain('200');
  });

  it('emits no unsigned-offer once the player response is Accepted or Declined', () => {
    const w = mkWarrior('w1');
    for (const response of ['Accepted', 'Declined'] as const) {
      const offer = mkOffer('o1', { responses: { w1: response, r1: 'Pending' } as BoutOffer['responses'] });
      const card = mkCard('w1', { payload: { boutOfferIdToAccept: 'o1' as BoutOfferId } });
      const state = makeGameState({ roster: [w], boutOffers: { o1: offer } });

      const out = collectUnresolvedDirectives(
        mkArgs({ state, cards: [card], activeWarriors: [w] })
      );
      expect(out.some((d) => d.kind === 'unsigned-offer')).toBe(false);
    }
  });

  it('emits unassigned-training only while the recommended assignment is missing from the board', () => {
    const w = mkWarrior('w1');
    const card = mkCard('w1', {
      payload: { trainingAssignment: { warriorId: 'w1' as WarriorId, type: 'attribute' } as never },
    });
    const state = makeGameState({ roster: [w] });

    const unassigned = collectUnresolvedDirectives(
      mkArgs({ state, cards: [card], activeWarriors: [w] })
    );
    expect(
      unassigned.some((d) => d.kind === 'unassigned-training' && d.warriorId === 'w1')
    ).toBe(true);

    const assigned = collectUnresolvedDirectives(
      mkArgs({
        state,
        cards: [card],
        activeWarriors: [w],
        assignedWarriorIds: new Set<string>(['w1']),
      })
    );
    expect(assigned.some((d) => d.kind === 'unassigned-training')).toBe(false);
  });

  it('emits unapplied-tactics when a fighting warrior\'s plan diverges from the patch', () => {
    const w = mkWarrior('w1', { plan: { OE: 3, AL: 4 } } as Partial<Warrior>);
    const card = mkCard('w1', {
      action: 'ACCEPT_OFFER',
      payload: { tacticsPlanPatch: { OE: 8, AL: 4 } as never },
    });
    const state = makeGameState({ roster: [w] });

    const out = collectUnresolvedDirectives(
      mkArgs({ state, cards: [card], activeWarriors: [w] })
    );
    expect(out.some((d) => d.kind === 'unapplied-tactics' && d.warriorId === 'w1')).toBe(true);
  });

  it('does not emit unapplied-tactics when the live plan already matches the patch', () => {
    const patch = { OE: 8, AL: 4, offensiveTactic: 'Feint', defensiveTactic: 'Parry' };
    const w = mkWarrior('w1', { plan: { ...patch, conditions: [] } } as unknown as Partial<Warrior>);
    const card = mkCard('w1', {
      action: 'ACCEPT_OFFER',
      payload: { tacticsPlanPatch: patch as never },
    });
    const state = makeGameState({ roster: [w] });

    const out = collectUnresolvedDirectives(
      mkArgs({ state, cards: [card], activeWarriors: [w] })
    );
    expect(out.some((d) => d.kind === 'unapplied-tactics')).toBe(false);
  });

  it('counts a suggested condition as unapplied when no authored condition covers its trigger', () => {
    const patch = {
      OE: 8,
      AL: 4,
      conditions: [{ trigger: { type: 'LOW_HP' } }],
    };
    const w = mkWarrior('w1', {
      plan: { OE: 8, AL: 4, conditions: [{ trigger: { type: 'OUTNUMBERED' } }] },
    } as unknown as Partial<Warrior>);
    const card = mkCard('w1', {
      action: 'ACCEPT_OFFER',
      payload: { tacticsPlanPatch: patch as never },
    });
    const state = makeGameState({ roster: [w] });

    const out = collectUnresolvedDirectives(
      mkArgs({ state, cards: [card], activeWarriors: [w] })
    );
    expect(out.some((d) => d.kind === 'unapplied-tactics' && d.warriorId === 'w1')).toBe(true);
  });

  it('adds signed upcoming-week bouts to fightingIds even without a card accept', () => {
    const w = mkWarrior('w2', { plan: { OE: 3 } } as Partial<Warrior>);
    // boutWeek 6 with no createdAbsoluteWeek → absolute 6 == upcomingAbsWeek
    const signed = mkOffer('o-signed', {
      warriorIds: ['w2' as WarriorId, 'r1' as WarriorId],
      status: 'Signed',
      boutWeek: 6,
    });
    const card = mkCard('w2', {
      action: 'HOLD',
      payload: { tacticsPlanPatch: { OE: 9 } as never },
    });
    const state = makeGameState({
      roster: [w],
      boutOffers: { 'o-signed': signed },
    });

    const out = collectUnresolvedDirectives(
      mkArgs({
        state,
        cards: [card],
        activeWarriors: [w],
        playerWarriorIds: new Set<string>(['w2']),
        upcomingAbsWeek: 6,
      })
    );
    expect(out.some((d) => d.kind === 'unapplied-tactics' && d.warriorId === 'w2')).toBe(true);
  });

  it('skips cards whose warrior is absent from the active roster', () => {
    const w = mkWarrior('w1');
    const ghost = mkCard('w-ghost', {
      opponentName: 'Rival X',
      payload: {
        boutOfferIdToAccept: 'o1' as BoutOfferId,
        trainingAssignment: { warriorId: 'w-ghost' as WarriorId, type: 'attribute' } as never,
      },
    });
    const offer = mkOffer('o1', {
      warriorIds: ['w-ghost' as WarriorId, 'r1' as WarriorId],
      responses: { 'w-ghost': 'Pending', r1: 'Pending' } as BoutOffer['responses'],
    });
    const state = makeGameState({ roster: [w], boutOffers: { o1: offer } });

    const out = collectUnresolvedDirectives(
      mkArgs({ state, cards: [ghost], activeWarriors: [w] })
    );
    expect(out).toHaveLength(0);
  });
});
