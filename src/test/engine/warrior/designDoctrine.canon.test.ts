/**
 * V24 canon — Consortium design doctrine (Arena 93): ST and WL must never
 * drop below 7; DF 11 vs DF 7 is a real weapon-access boundary; low-burn
 * styles steer PR/PS/AB/TP/ST; breakpoints WT 11/13/17, WL 15/17/21, AB 17/21.
 */
import { describe, it, expect } from 'vitest';
import { reviewWarriorDesign } from '@/engine/warrior/designReview';
import { LOW_BURN_STYLES } from '@/data/designDoctrine';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/warrior.types';

const base: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

const ids = (attrs: Attributes, style: FightingStyle) =>
  reviewWarriorDesign(attrs, style)
    .map((i) => i.id)
    .filter((id): id is string => !!id);

describe('stat floor warnings', () => {
  it.each(['ST', 'WL'] as const)('%s < 7 is flagged as a hard floor breach', (stat) => {
    const attrs = { ...base, [stat]: 5 };
    const found = reviewWarriorDesign(attrs, FightingStyle.BashingAttack).some(
      (i) => i.id === `${stat.toLowerCase()}-floor`
    );
    expect(found).toBe(true);
  });

  it('ST/WL at 7+ does not trip the floor warning', () => {
    const found = reviewWarriorDesign({ ...base }, FightingStyle.BashingAttack).some(
      (i) => i.id === 'st-floor' || i.id === 'wl-floor'
    );
    expect(found).toBe(false);
  });
});

describe('deftness weapon-tier guidance (Consortium: DF 11 unlocks the real arsenal)', () => {
  it('DF 7-10 is flagged as the crippled weapon tier', () => {
    expect(ids({ ...base, DF: 9 }, FightingStyle.SlashingAttack)).toContain('df-weapon-tier');
  });
  it('DF 11+ clears the flag', () => {
    expect(ids({ ...base, DF: 11 }, FightingStyle.SlashingAttack)).not.toContain(
      'df-weapon-tier'
    );
  });
});

describe('dagger favored-style advisory (Jalopy: dagger fully suited only to ST/AB)', () => {
  it('a dagger-tier build on a non-ST/AB style is noted', () => {
    expect(ids({ ...base, DF: 9 }, FightingStyle.LungingAttack)).toContain('dagger-style-fit');
  });
  it('ST and AB dagger-tier builds are on-style (no note)', () => {
    expect(ids({ ...base, DF: 9 }, FightingStyle.StrikingAttack)).not.toContain('dagger-style-fit');
    expect(ids({ ...base, DF: 9 }, FightingStyle.AimedBlow)).not.toContain('dagger-style-fit');
  });
  it('DF 11+ builds never see the note — the dagger tier does not bind them', () => {
    expect(ids({ ...base, DF: 11 }, FightingStyle.LungingAttack)).not.toContain('dagger-style-fit');
  });
});

describe('low-burn style steering (Consortium: PR/PS/AB/TP/ST tolerate low burns)', () => {
  it('contains exactly the article set', () => {
    expect(new Set(LOW_BURN_STYLES)).toEqual(
      new Set([
        FightingStyle.ParryRiposte,
        FightingStyle.ParryStrike,
        FightingStyle.AimedBlow,
        FightingStyle.TotalParry,
        FightingStyle.StrikingAttack,
      ])
    );
  });

  it('a low-burn PR build is steered on-style, a low-burn BA is not', () => {
    const lowBurn: Attributes = { ...base, SP: 3, WT: 17, WL: 15 };
    const prItems = reviewWarriorDesign(lowBurn, FightingStyle.ParryRiposte);
    const baItems = reviewWarriorDesign(lowBurn, FightingStyle.BashingAttack);
    expect(prItems.some((i) => i.id === 'low-burn-fit')).toBe(true);
    expect(baItems.some((i) => i.id === 'low-burn-fit')).toBe(false);
  });
});

describe('breakpoint dossier labels', () => {
  it('flags the canon stat breakpoints', () => {
    for (const [attrs, id] of [
      [{ ...base, WT: 13 }, 'breakpoint-wt-13'],
      [{ ...base, WL: 17 }, 'breakpoint-wl-17'],
      [{ ...base, WT: 17 }, 'breakpoint-wt-17'],
    ] as [Attributes, string][]) {
      expect(ids(attrs, FightingStyle.TotalParry)).toContain(id);
    }
  });

  it('aimed-blow designs flag the AB 17/21 DF breakpoints', () => {
    const a = ids({ ...base, DF: 17 }, FightingStyle.AimedBlow);
    const b = ids({ ...base, DF: 21 }, FightingStyle.AimedBlow);
    expect(a.some((i) => i.startsWith('breakpoint-df-ab'))).toBe(true);
    expect(b.some((i) => i.startsWith('breakpoint-df-ab'))).toBe(true);
  });
});
