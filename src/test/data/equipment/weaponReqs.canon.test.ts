/**
 * V24 canon — Assur's Weapon Requirement Chart (Arena 93, Noblish Island).
 * Exact per-weapon ST/SZ/WT/DF minimums, canonical two-letter codes, the
 * Battle Axe offhand-carry rule, and Smithy's hedged "no size penalties".
 */
import { describe, it, expect } from 'vitest';
import { checkWeaponRequirements, getItemById } from '@/data/equipment';

// Assur's chart verbatim: STR SIZ WIT DFT
const CANON: [id: string, code: string, st: number, sz: number, wt: number, df: number][] = [
  ['battle_axe', 'BA', 15, 3, 7, 9],
  ['broadsword', 'BS', 11, 3, 9, 7],
  ['dagger', 'DA', 3, 3, 7, 7],
  ['epee', 'EP', 7, 3, 15, 15],
  ['great_axe', 'GA', 13, 3, 9, 11],
  ['greatsword', 'GS', 15, 9, 9, 11],
  ['hatchet', 'HA', 7, 3, 5, 7],
  ['halberd', 'HL', 17, 9, 9, 11],
  ['longsword', 'LO', 11, 3, 13, 11],
  ['long_spear', 'LS', 11, 9, 5, 9],
  ['mace', 'MA', 13, 3, 3, 5],
  ['maul', 'ML', 15, 9, 5, 7],
  ['morning_star', 'MS', 13, 3, 9, 11],
  ['quarterstaff', 'QS', 11, 9, 11, 11],
  ['scimitar', 'SC', 9, 3, 11, 11],
  ['short_sword', 'SS', 5, 3, 11, 3],
  ['short_spear', 'SH', 9, 3, 5, 7],
  ['war_flail', 'WF', 11, 3, 5, 5],
  ['war_hammer', 'WH', 13, 3, 5, 7],
  ['large_shield', 'LG', 13, 7, 3, 7],
  ['medium_shield', 'ME', 9, 3, 3, 5],
  ['small_shield', 'SM', 5, 3, 3, 5],
];

describe("Assur's weapon requirement chart", () => {
  it.each(CANON)('%s (%s) requires ST%d SZ%d WT%d DF%d', (id, code, st, sz, wt, df) => {
    const item = getItemById(id);
    expect(item?.code).toBe(code);
    expect(item).toMatchObject({ reqST: st, reqSZ: sz, reqWT: wt, reqDF: df });
  });

  it('codes are canonical: SS is the shortsword, SH the shortspear', () => {
    expect(getItemById('short_sword')?.code).toBe('SS');
    expect(getItemById('short_spear')?.code).toBe('SH');
  });
});

describe('Battle Axe size rule', () => {
  it('base BA requires only SZ 3 — the SZ 9 minimum applies to offhand carry', () => {
    const item = getItemById('battle_axe');
    expect(item?.reqSZ).toBe(3);
    // Canon: "Battle Axe requires 9 size if you are carrying an off hand weapon"
    expect(item?.offhandCarryReq).toMatchObject({ SZ: 9 });
  });
});

describe("Smithy's hedged size claim (no skill penalty for SZ shortfall)", () => {
  it('an undersized warrior pays endurance, not attack', () => {
    // Dagger SZ req 3 → SZ 1 warrior is 2 short.
    const res = checkWeaponRequirements('dagger', { ST: 9, SZ: 1, WT: 9, DF: 9 });
    expect(res.met).toBe(false);
    expect(res.failures.map((f) => f.stat)).toContain('SZ');
    expect(res.attPenalty).toBe(0); // SZ shortfall: no ATT hit
    expect(res.endurancePenalty).toBeGreaterThan(1); // …but still costs endurance
  });
});
