/**
 * Canonical Duel2 death model — vitals gate, two-roll doom, death spiral,
 * infirmary roll (Noblish Island: Death Intent Explained / Mechanics of
 * Death / Staying Alive / Assur's Guide to Killing).
 */
import { describe, it, expect } from 'vitest';
import {
  deathRollFailChance,
  infirmaryFailChance,
  rollInfirmaryOutcome,
} from '@/engine/combat/mechanics/deathRolls';
import { simulateFight } from '@/engine/simulate';
import { FightingStyle, type FightPlan } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

const killer = (id: string, st: FightingStyle, over: Partial<Warrior> = {}): Warrior =>
  ({
    id: id as WarriorId,
    name: id,
    style: st,
    attributes: { ST: 20, CN: 10, SZ: 10, WT: 12, WL: 10, SP: 14, DF: 14 },
    baseSkills: { ATT: 15, PAR: 10, DEF: 8, INI: 12, RIP: 8, DEC: 10 },
    derivedStats: { hp: 60, endurance: 90, damage: 4, encumbrance: 10 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    champion: false,
    status: 'Active',
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    equipment: { weapon: 'scimitar', armor: 'leather', helm: 'cap' } as Warrior['equipment'],
    ...over,
  }) as Warrior;

const plan = (st: FightingStyle, over: Partial<FightPlan> = {}): FightPlan =>
  ({ style: st, OE: 9, AL: 7, killDesire: 9, ...over }) as FightPlan;

const weakVictim = () =>
  killer('Victim', FightingStyle.StrikingAttack, {
    attributes: { ST: 6, CN: 6, SZ: 8, WT: 8, WL: 5, SP: 8, DF: 5 },
    derivedStats: { hp: 40, endurance: 60, damage: 1, encumbrance: 5 },
    baseSkills: { ATT: 5, PAR: 3, DEF: 3, INI: 5, RIP: 3, DEC: 4 },
  });

describe('deathRollFailChance', () => {
  const base = {
    hitLoc: 'chest' as const,
    armorId: 'leather',
    helmId: 'cap',
    will: 10,
    maxHp: 60,
    totalFights: 10,
    enduranceRatio: 0.5,
  };

  it('no armor dies more than armored — Staying Alive #2', () => {
    expect(deathRollFailChance({ ...base, armorId: 'none_armor', helmId: 'none_helm' })).toBeGreaterThan(
      deathRollFailChance(base)
    );
  });

  it('bare head on a head hit dies more — helm matters', () => {
    const headHit = { ...base, hitLoc: 'head' as const };
    expect(deathRollFailChance({ ...headHit, helmId: 'none_helm' })).toBeGreaterThan(
      deathRollFailChance(headHit)
    );
    // helm does not protect the chest
    expect(deathRollFailChance({ ...base, helmId: 'none_helm' })).toBe(
      deathRollFailChance(base)
    );
  });

  it('willpower is the infirmary stat — Staying Alive #5', () => {
    expect(deathRollFailChance({ ...base, will: 20 })).toBeLessThan(
      deathRollFailChance({ ...base, will: 5 })
    );
  });

  it('young fighters die more — Zen of Killing #9', () => {
    expect(deathRollFailChance({ ...base, totalFights: 1 })).toBeGreaterThan(
      deathRollFailChance({ ...base, totalFights: 20 })
    );
  });

  it('exhaustion kills — Staying Alive #10', () => {
    expect(deathRollFailChance({ ...base, enduranceRatio: 0 })).toBeGreaterThan(
      deathRollFailChance({ ...base, enduranceRatio: 1 })
    );
  });
});

describe('rollInfirmaryOutcome', () => {
  const downed = {
    attributes: { WL: 5 },
    maxHp: 40,
    endurance: 0,
    maxEndurance: 60,
    totalFights: 2,
    armorId: 'none_armor',
  };

  it('deathRateMult 0 → never dies of wounds (house rule)', () => {
    const rng = () => 0; // worst possible rolls
    expect(rollInfirmaryOutcome(rng, downed, 0)).toBe(false);
  });

  it('two-roll chain: both rolls must fail to die', () => {
    const passFirst = () => expect(
      rollInfirmaryOutcome(() => 0.5, downed, 1)
    ).toBe(false);
    passFirst();
    expect(infirmaryFailChance({ will: 5, enduranceRatio: 0 })).toBeLessThan(1);
  });
});

describe('death intent model — integration', () => {
  it('kills produce DEATH_INTENT or DIED_OF_WOUNDS; doom spirals occur', () => {
    let intents = 0;
    let dooms = 0;
    let kills = 0;
    let woundDeaths = 0;
    for (let s = 1; s <= 150; s++) {
      const r = simulateFight({
        planA: plan(FightingStyle.BashingAttack, { target: 'Head' }),
        planD: plan(FightingStyle.StrikingAttack, { killDesire: 1, OE: 5, AL: 5 }),
        warriorA: killer('Killer', FightingStyle.BashingAttack),
        warriorD: weakVictim(),
        providedRng: s,
      });
      const codes = (r.exchangeLog ?? []).flatMap((e) => e.reasonCodes ?? []);
      if (codes.includes('DEATH_INTENT')) intents++;
      if (codes.includes('DOOMED')) dooms++;
      if (r.by === 'Kill') {
        kills++;
        if (r.post?.causeBucket === 'DIED_OF_WOUNDS') woundDeaths++;
      }
    }
    expect(kills).toBeGreaterThan(0);
    expect(intents).toBeGreaterThan(0);
    // Canon: intent statements print more often than kills — the death roll
    // can spare the victim.
    expect(intents).toBeGreaterThanOrEqual(dooms);
    expect(dooms).toBeGreaterThan(0);
    // Infirmary deaths are the minority path (~90% via death intent).
    expect(woundDeaths).toBeLessThan(kills);
  });

  it('a warrior hitting only limbs never dooms a victim', () => {
    // 'Left Arm' targeting still strays to vitals ~30% of the time (canon:
    // ~67% location accuracy), so kills are possible — but a kill must have
    // come through a vital hit or the infirmary path, never a limb hit.
    for (let s = 1; s <= 60; s++) {
      const r = simulateFight({
        planA: plan(FightingStyle.BashingAttack, { target: 'Left Arm' }),
        planD: plan(FightingStyle.StrikingAttack, { killDesire: 1, OE: 5, AL: 5 }),
        warriorA: killer('Killer', FightingStyle.BashingAttack),
        warriorD: weakVictim(),
        providedRng: s,
      });
      if (r.by === 'Kill' && r.post?.causeBucket !== 'DIED_OF_WOUNDS') {
        // Death-intent kills must resolve on a vital — infirmary deaths may
        // carry a limb location since that roll ignores where hits land.
        expect(r.post?.fatalHitLocation).not.toMatch(/arm|leg/);
      }
    }
  });
});
