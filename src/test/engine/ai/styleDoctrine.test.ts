// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { applyStyleDoctrine } from '@/engine/ai/plan/coreGenerator';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';

const plan = (oe: number, al: number, kd: number): FightPlan =>
  ({ OE: oe, AL: al, killDesire: kd }) as FightPlan;

const TP = makeComputedWarrior({ WT: 9, WL: 19 }, FightingStyle.TotalParry);
const OTP = makeComputedWarrior({ WT: 17, DF: 15, SP: 7, CN: 12 }, FightingStyle.TotalParry);
const ST = makeComputedWarrior({}, FightingStyle.StrikingAttack);
const AB = makeComputedWarrior({ DF: 21, WT: 17 }, FightingStyle.AimedBlow);

describe('applyStyleDoctrine — TP scum doctrine', () => {
  it('caps OE at 5 — a TP run hot abandons its defense', () => {
    const p = plan(10, 3, 3);
    applyStyleDoctrine(p, TP);
    expect(p.OE).toBe(5);
  });

  it('caps AL at 5 — conservative activity ceiling', () => {
    const p = plan(3, 9, 3);
    applyStyleDoctrine(p, TP);
    expect(p.AL).toBe(5);
  });

  it('caps killDesire at 5 — attrition, not intent', () => {
    const p = plan(3, 3, 9);
    applyStyleDoctrine(p, TP);
    expect(p.killDesire).toBe(5);
  });

  it('is a ceiling, not a floor — conservative plans pass through', () => {
    const p = plan(2, 3, 1);
    applyStyleDoctrine(p, TP);
    expect(p).toMatchObject({ OE: 2, AL: 3, killDesire: 1 });
  });

  it('does not touch other styles', () => {
    const p = plan(9, 9, 9);
    applyStyleDoctrine(p, ST);
    expect(p).toMatchObject({ OE: 9, AL: 9, killDesire: 9 });
  });
});

describe('applyStyleDoctrine — Offensive TP (Un-Scum) variety', () => {
  it('routes high-WT/DF TPs to the offensive doctrine, not the scum caps', () => {
    const p = plan(9, 9, 9);
    applyStyleDoctrine(p, OTP);
    expect(p).toMatchObject({ OE: 7, AL: 7, killDesire: 7 });
  });

  it('floors AL at 4 — the Un-Scum must stay active', () => {
    const p = plan(2, 1, 2);
    applyStyleDoctrine(p, OTP);
    expect(p.AL).toBe(4);
  });

  it('permits mid-range plans a scum would never run', () => {
    const p = plan(4, 6, 6);
    applyStyleDoctrine(p, OTP);
    expect(p).toMatchObject({ OE: 4, AL: 6, killDesire: 6 });
  });
});

describe('applyStyleDoctrine — Aimed Blow doctrine', () => {
  it('floors OE at 4 — scummy ABs stand around looking for an opening', () => {
    const p = plan(2, 4, 4);
    applyStyleDoctrine(p, AB);
    expect(p.OE).toBe(4);
  });

  it('caps killDesire at 7 — accuracy degrades at high KD', () => {
    const p = plan(6, 6, 10);
    applyStyleDoctrine(p, AB);
    expect(p.killDesire).toBe(7);
  });

  it('leaves AL free — canon doctrines span 1-10', () => {
    const low = plan(5, 1, 5);
    const high = plan(5, 10, 5);
    applyStyleDoctrine(low, AB);
    applyStyleDoctrine(high, AB);
    expect(low.AL).toBe(1);
    expect(high.AL).toBe(10);
  });

  it('permits the hot offensive plans all doctrines recommend', () => {
    const p = plan(10, 10, 6);
    applyStyleDoctrine(p, AB);
    expect(p).toMatchObject({ OE: 10, AL: 10, killDesire: 6 });
  });
});
