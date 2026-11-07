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
const LU = makeComputedWarrior({}, FightingStyle.LungingAttack);
const BA = makeComputedWarrior({}, FightingStyle.BashingAttack);

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
    applyStyleDoctrine(p, BA); // LU carries its own doctrine now — BA stays doctrine-free
    expect(p).toMatchObject({ OE: 9, AL: 9, killDesire: 9 });
  });
});

describe('applyStyleDoctrine — Striker doctrine (Arena 93)', () => {
  it('floors OE at 5 — every canon sheet opens 6-10; a passive striker is not a striker', () => {
    const p = plan(2, 4, 6);
    applyStyleDoctrine(p, ST);
    expect(p.OE).toBe(5);
  });

  it('is a floor, not a ceiling — hot canon plans pass through', () => {
    const p = plan(10, 10, 6);
    applyStyleDoctrine(p, ST);
    expect(p).toMatchObject({ OE: 10, AL: 10, killDesire: 6 });
  });

  it('leaves AL and killDesire to personality — canon spreads both freely', () => {
    const p = plan(7, 1, 9);
    applyStyleDoctrine(p, ST);
    expect(p).toMatchObject({ OE: 7, AL: 1, killDesire: 9 });
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

describe('applyStyleDoctrine — Lunger doctrine (Arena 93)', () => {
  it('floors AL at 4 — a lunger too slow to move is just a target', () => {
    const p = plan(7, 1, 6);
    applyStyleDoctrine(p, LU);
    expect(p.AL).toBe(4);
  });

  it('caps killDesire at 8 — Snorri runs the whole style inside the 5-8 band', () => {
    const p = plan(7, 7, 10);
    applyStyleDoctrine(p, LU);
    expect(p.killDesire).toBe(8);
  });

  it('leaves canon plans untouched — Assur 7-10 and Boar 4-6 both pass through', () => {
    const assur = plan(7, 10, 6);
    const boar = plan(4, 6, 4);
    applyStyleDoctrine(assur, LU);
    applyStyleDoctrine(boar, LU);
    expect(assur).toMatchObject({ OE: 7, AL: 10, killDesire: 6 });
    expect(boar).toMatchObject({ OE: 4, AL: 6, killDesire: 4 });
  });
});

describe('applyStyleDoctrine — Parry-Lunge doctrine (Arena 93)', () => {
  const PL = makeComputedWarrior({}, FightingStyle.ParryLunge);

  it('caps killDesire at 7 — "keep the kill desire relatively low as to avoid sloppy attacking"', () => {
    const p = plan(8, 8, 10);
    applyStyleDoctrine(p, PL);
    expect(p.killDesire).toBe(7);
  });

  it('leaves a canon kill desire untouched — ceiling, not a rewrite', () => {
    const p = plan(8, 8, 5);
    applyStyleDoctrine(p, PL);
    expect(p.killDesire).toBe(5);
  });

  it('leaves OE and AL free — canon PL favorites span VL-HI / LO-VH', () => {
    const low = plan(1, 3, 5);
    const high = plan(8, 10, 5);
    applyStyleDoctrine(low, PL);
    applyStyleDoctrine(high, PL);
    expect(low).toMatchObject({ OE: 1, AL: 3 });
    expect(high).toMatchObject({ OE: 8, AL: 10 });
  });
});

describe('applyStyleDoctrine — Wall-of-Steel doctrine (Arena 93)', () => {
  // Canon walls run hot while young (Eli/She-Puppy: "run them offensively
  // while young") then taper to the high-low pace; activity stays
  // moderate-to-low and kill desire stays at or under 6 outside desperation.
  const YOUNG = makeComputedWarrior({}, FightingStyle.WallOfSteel);
  const VETERAN = makeComputedWarrior({}, FightingStyle.WallOfSteel, {
    career: { wins: 6, losses: 4, kills: 0 },
  });

  it('floors OE for young walls — canon runs them offensively while young', () => {
    const p = plan(3, 4, 5);
    applyStyleDoctrine(p, YOUNG);
    expect(p.OE).toBe(6);
  });

  it('leaves a veteran wall free to run a defensive sheet', () => {
    const p = plan(3, 6, 3);
    applyStyleDoctrine(p, VETERAN);
    expect(p.OE).toBe(3);
  });

  it('caps AL at 7 — walls run moderate-to-low activity', () => {
    const p = plan(6, 10, 5);
    applyStyleDoctrine(p, YOUNG);
    expect(p.AL).toBe(7);
  });

  it('caps killDesire at 7 — canon sheets run KD 6; 7+ is a desperation save', () => {
    const p = plan(6, 5, 10);
    applyStyleDoctrine(p, YOUNG);
    expect(p.killDesire).toBe(7);
  });

  it('is a ceiling plus a young-OE floor — canon sheets pass through', () => {
    const p = plan(9, 6, 6);
    applyStyleDoctrine(p, YOUNG);
    expect(p).toMatchObject({ OE: 9, AL: 6, killDesire: 6 });
  });
});
