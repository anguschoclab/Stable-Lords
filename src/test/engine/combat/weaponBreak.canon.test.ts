/**
 * V31 canon — weapon breakage on hard armor contact (Terrablood archive,
 * Hoser Report folklore; adjudicated DN-C8: implement).
 *
 * Canon lore: quarterstaff, great axe, and greatsword "break a lot" — brittle
 * weapons can snap when a blow clangs off armor. A broken weapon is NOT a
 * disarm: the fighter drops to their backup (or fist) and cannot rearm —
 * the weapon is destroyed for the bout.
 */
import { describe, it, expect } from 'vitest';
import { weaponBreakChance } from '@/engine/combat/mechanics/weaponStats';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { EquipmentLoadout } from '@/data/equipment';

const ATTRS = { ST: 17, CN: 14, SZ: 12, WT: 13, WL: 13, SP: 12, DF: 13 };

const loadout = (weapon: string, armor: string, backup?: string): EquipmentLoadout =>
  ({ weapon, armor, shield: 'none_shield', helm: 'none_helm', backup }) as EquipmentLoadout;

function makeW(weapon: string, armor = 'none_armor', backup?: string, style = FightingStyle.BashingAttack) {
  const w = makeWarrior({
    id: undefined,
    name: 'W',
    style,
    attrs: ATTRS,
    overrides: undefined,
    rng: undefined,
  });
  return { ...w, equipment: loadout(weapon, armor, backup) };
}

const fightOnce = (attacker: ReturnType<typeof makeW>, defender: ReturnType<typeof makeW>, seed: number) =>
  simulateFight({
    warriorA: attacker,
    warriorD: defender,
    planA: defaultPlanForWarrior(attacker),
    planD: defaultPlanForWarrior(defender),
    providedRng: seed,
    headless: true,
  });

const breakEvents = (r: ReturnType<typeof fightOnce>) =>
  (r.log ?? []).flatMap((m) => m.events ?? []).filter((e) => e.type === 'WEAPON_BREAK');

describe('canon weapon-break table', () => {
  it('the folklore-fragile weapons carry a break chance', () => {
    for (const id of ['quarterstaff', 'great_axe', 'greatsword']) {
      expect(weaponBreakChance(id), id).toBeGreaterThan(0);
    }
  });

  it('durable weapons never break', () => {
    for (const id of ['scimitar', 'longsword', 'short_spear', 'dagger', 'war_hammer', 'fist']) {
      expect(weaponBreakChance(id), id).toBe(0);
    }
  });
});

describe('breakage in resolution (seeded)', () => {
  const N = 40;

  it('a quarterstaff wielder breaks a weapon against plate within N bouts', () => {
    let breaks = 0;
    for (let i = 0; i < N; i++) {
      const r = fightOnce(makeW('quarterstaff'), makeW('longsword', 'APA'), i * 104729 + 7);
      breaks += breakEvents(r).length;
    }
    expect(breaks).toBeGreaterThanOrEqual(1);
  });

  it('a scimitar wielder never breaks, same seed set', () => {
    let breaks = 0;
    for (let i = 0; i < N; i++) {
      const r = fightOnce(makeW('scimitar'), makeW('longsword', 'APA'), i * 104729 + 7);
      breaks += breakEvents(r).length;
    }
    expect(breaks).toBe(0);
  });

  it('a broken weapon is not rearmable — no REARM of the broken id follows a break', () => {
    // A quarterstaff wielder carrying a scimitar backup: when the staff
    // breaks, subsequent REARM events may restore only disarm-drops —
    // never the destroyed quarterstaff.
    for (let i = 0; i < N; i++) {
      const r = fightOnce(
        makeW('quarterstaff', 'none_armor', 'scimitar'),
        makeW('longsword', 'APA'),
        i * 104729 + 7
      );
      const entries = r.exchangeLog ?? [];
      for (let j = 0; j < entries.length; j++) {
        if (entries[j]?.weaponBreak) {
          // After the break, the exchange-log disarm/rearm channel may
          // still fire for OTHER weapons, but a destroyed id never returns:
          // every later REARM must not restore 'quarterstaff'.
          for (const e of entries.slice(j + 1)) {
            if (e.rearm) {
              const events = (r.log ?? []).flatMap((m) => m.events ?? []);
              const rearmed = events.filter(
                (x) => x.type === 'REARM' && x.metadata?.weaponId === 'quarterstaff'
              );
              expect(rearmed).toEqual([]);
            }
          }
        }
      }
    }
  });
});
