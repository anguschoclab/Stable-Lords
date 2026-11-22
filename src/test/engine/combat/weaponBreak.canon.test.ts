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
import { tryWeaponBreak } from '@/engine/combat/resolution/disarm';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { EquipmentLoadout } from '@/data/equipment';
import type { FighterState } from '@/engine/combat/resolution/types';
import type { CombatEvent } from '@/types/combat.types';

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

// exchangeLog populates under telemetry (!headless) — the structured
// per-exchange record is the observable surface for the break channel.
const fightOnce = (attacker: ReturnType<typeof makeW>, defender: ReturnType<typeof makeW>, seed: number) =>
  simulateFight({
    warriorA: attacker,
    warriorD: defender,
    planA: defaultPlanForWarrior(attacker),
    planD: defaultPlanForWarrior(defender),
    providedRng: seed,
  });

const breakCount = (r: ReturnType<typeof fightOnce>) =>
  (r.exchangeLog ?? []).filter((e) => e.weaponBreak !== undefined).length;

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
      breaks += breakCount(r);
    }
    expect(breaks).toBeGreaterThanOrEqual(1);
  });

  it('a scimitar wielder never breaks, same seed set', () => {
    let breaks = 0;
    for (let i = 0; i < N; i++) {
      const r = fightOnce(makeW('scimitar'), makeW('longsword', 'APA'), i * 104729 + 7);
      breaks += breakCount(r);
    }
    expect(breaks).toBe(0);
  });

  it('a break surfaces in the narrated log — players see the shatter, not just telemetry', () => {
    // Player-vs-NPC parity: the NPC headless path records exchangeLog.weaponBreak;
    // the player's narrated path must print the beat and attach the event.
    let saw = false;
    for (let i = 0; i < N && !saw; i++) {
      const r = fightOnce(makeW('quarterstaff'), makeW('longsword', 'APA'), i * 104729 + 7);
      if (breakCount(r) === 0) continue;
      const lines = r.log.filter((m) => m.events?.some((e) => e.type === 'WEAPON_BREAK'));
      saw = lines.length > 0 && lines.every((m) => /shatter|snap|break/i.test(m.text));
    }
    expect(saw).toBe(true);
  });

  it('a broken weapon is not rearmable — the destroyed id never enters droppedWeaponId', () => {
    // REARM only retrieves `droppedWeaponId`; the invariant a break must
    // keep is that the shattered id never lands there. Asserted directly
    // on tryWeaponBreak — stronger than watching the exchange stream for
    // an absence.
    const events: CombatEvent[] = [];
    const attacker = {
      weaponId: 'quarterstaff',
      backupWeaponId: 'scimitar',
      coordination: 'Normal',
      skills: { ATT: 10, PAR: 5, DEF: 5 },
      hp: 30,
      maxHp: 30,
    } as unknown as FighterState;
    // Force the break: a roll of 0 always clears the 6% staff chance.
    const broke = tryWeaponBreak({
      events: events,
      rng: () => 0.0,
      attacker: attacker,
      attLabel: 'A',
      defArmorId: 'APA',
    });
    expect(broke).toBe(true);
    expect(attacker.droppedWeaponId).toBeUndefined();
    expect(attacker.weaponId).toBe('scimitar');
    const ev = events.find((e) => e.type === 'WEAPON_BREAK');
    expect(ev?.metadata?.weaponId).toBe('quarterstaff');
  });

  it('the clang gate: no armor on the defender means no snap, forced roll', () => {
    const events: CombatEvent[] = [];
    const attacker = {
      weaponId: 'quarterstaff',
      coordination: 'Normal',
      skills: { ATT: 10, PAR: 5, DEF: 5 },
      hp: 30,
      maxHp: 30,
    } as unknown as FighterState;
    const broke = tryWeaponBreak({
      events: events,
      rng: () => 0.0,
      attacker: attacker,
      attLabel: 'A',
      defArmorId: 'none_armor',
    });
    expect(broke).toBe(false);
    expect(attacker.weaponId).toBe('quarterstaff');
  });
});
