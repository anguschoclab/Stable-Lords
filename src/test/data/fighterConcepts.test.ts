import { describe, it, expect } from 'vitest';
import {
  FIGHTER_CONCEPTS,
  scaleToAttributeBudget,
  conceptPrimaryAttr,
  conceptMean,
} from '@/data/fighterConcepts';
import {
  FightingStyle,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type Attributes,
} from '@/types/shared.types';

const ALL_STYLES = Object.values(FightingStyle);
const sum = (a: Attributes) => ATTRIBUTE_KEYS.reduce((s, k) => s + a[k], 0);

describe('FIGHTER_CONCEPTS — coverage & content', () => {
  it('covers every canonical fighting style', () => {
    for (const style of ALL_STYLES) {
      const guide = FIGHTER_CONCEPTS[style];
      expect(guide, `missing concept guide for ${style}`).toBeDefined();
      expect(guide.doctrine.length, `empty doctrine for ${style}`).toBeGreaterThan(0);
      expect(guide.concepts.length, `no concepts for ${style}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every concept carries canon and scaled spreads, notes, and tactics', () => {
    for (const style of ALL_STYLES) {
      for (const concept of FIGHTER_CONCEPTS[style].concepts) {
        expect(concept.name.length).toBeGreaterThan(0);
        expect(concept.notes.length).toBeGreaterThan(0);
        expect(concept.tactics.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('FIGHTER_CONCEPTS — canon spreads', () => {
  it('canon spreads preserve the original ~84-point newsletter budget', () => {
    for (const style of ALL_STYLES) {
      for (const concept of FIGHTER_CONCEPTS[style].concepts) {
        const total = sum(concept.canonStats);
        expect(
          total,
          `${style}/${concept.name} canon sum ${total} outside [83, 86]`
        ).toBeGreaterThanOrEqual(83);
        expect(total).toBeLessThanOrEqual(86);
      }
    }
  });
});

describe('FIGHTER_CONCEPTS — scaled spreads', () => {
  it('scaled spreads land exactly on the 70-point budget inside [MIN, MAX]', () => {
    for (const style of ALL_STYLES) {
      for (const concept of FIGHTER_CONCEPTS[style].concepts) {
        expect(sum(concept.stats), `${style}/${concept.name}`).toBe(ATTRIBUTE_TOTAL);
        for (const key of ATTRIBUTE_KEYS) {
          const v = concept.stats[key];
          expect(Number.isInteger(v), `${style}/${concept.name} ${key}=${v} not integer`).toBe(true);
          expect(v).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
          expect(v).toBeLessThanOrEqual(ATTRIBUTE_MAX);
        }
      }
    }
  });
});

describe('FIGHTER_CONCEPTS — "How to Build a Better Warrior" redesigns', () => {
  // Neon Necromancer's three example rebuilds (Arena 93, ~84-pt canon budget).
  const find = (style: FightingStyle, name: string) =>
    FIGHTER_CONCEPTS[style].concepts.find((c) => c.name === name);

  it('includes the Broke Stroker lunging redesign', () => {
    const c = find(FightingStyle.LungingAttack, 'Broke Stroker');
    expect(c).toBeDefined();
    expect(c!.canonStats).toEqual({ ST: 10, CN: 10, SZ: 10, WT: 15, WL: 15, SP: 11, DF: 13 });
  });

  it('includes the Scimitar Adept slashing redesign', () => {
    const c = find(FightingStyle.SlashingAttack, 'Scimitar Adept');
    expect(c).toBeDefined();
    expect(c!.canonStats).toEqual({ ST: 9, CN: 8, SZ: 14, WT: 13, WL: 17, SP: 10, DF: 13 });
  });

  it('includes the Low-Will Wonder striking redesign', () => {
    const c = find(FightingStyle.StrikingAttack, 'Low-Will Wonder');
    expect(c).toBeDefined();
    expect(c!.canonStats).toEqual({ ST: 17, CN: 9, SZ: 7, WT: 17, WL: 9, SP: 14, DF: 11 });
  });
});

describe('LU — Arena 93 lunger canon builds', () => {
  // Elder Snorri's "Lunger Strats", The Wild Boar's "Defensive Lunger", and
  // Assur's Lunger Model — every published qualifying spread plus the
  // synthesized model build. Boar's minimums (66) and his 11-3-10-… actual
  // (74) fail the ~84-point canon budget and are excluded.
  const luConcepts = FIGHTER_CONCEPTS[FightingStyle.LungingAttack].concepts;

  it('carries the full canon roster: 3 baseline + 12 article builds', () => {
    expect(luConcepts).toHaveLength(15);
  });

  it('names every article build', () => {
    const names = luConcepts.map((c) => c.name);
    for (const n of [
      // Snorri's three
      'Even Spread',
      'The Aesir',
      'Riposte Gamble',
      // The Wild Boar's two
      "Boar's Perfect",
      "Boar's Graduate",
      // Assur's synthesized model + six graduates
      "Assur's Model",
      'The Fantastic',
      'Freshman Crown',
      'The Natural',
      'Lucky Roll',
      'The Standard',
      'Arena Ace',
    ]) {
      expect(names).toContain(n);
    }
  });

  const pin = (name: string, spread: Attributes) =>
    expect(
      luConcepts.find((c) => c.name === name)?.canonStats,
      `${name} canonStats`
    ).toEqual(spread);

  it("pins Snorri's first lunger — the even spread (13-12-12-12-12-12-11)", () =>
    pin('Even Spread', { ST: 13, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 11 }));

  it("pins Snorri's best skill base (13-10-9-15-15-11-11)", () =>
    pin('The Aesir', { ST: 13, CN: 10, SZ: 9, WT: 15, WL: 15, SP: 11, DF: 11 }));

  it("pins Snorri's 60%-riposte gamble (9-15-8-15-13-11-13)", () =>
    pin('Riposte Gamble', { ST: 9, CN: 15, SZ: 8, WT: 15, WL: 13, SP: 11, DF: 13 }));

  it("pins the Wild Boar perfect defensive lunger (13-7-4-21-17-5-17)", () =>
    pin("Boar's Perfect", { ST: 13, CN: 7, SZ: 4, WT: 21, WL: 17, SP: 5, DF: 17 }));

  it("pins the Wild Boar graduate (13-11-6-17-19-5-13)", () =>
    pin("Boar's Graduate", { ST: 13, CN: 11, SZ: 6, WT: 17, WL: 19, SP: 5, DF: 13 }));

  it("pins the synthesized Assur model — meets every standard (11-14-9-13-21-5-11)", () =>
    pin("Assur's Model", { ST: 11, CN: 14, SZ: 9, WT: 13, WL: 21, SP: 5, DF: 11 }));

  it("pins Assur's 17-6 graduate — 'The Fantastic' (12-13-8-13-21-6-11)", () =>
    pin('The Fantastic', { ST: 12, CN: 13, SZ: 8, WT: 13, WL: 21, SP: 6, DF: 11 }));

  it('pins the freshman TC (9-15-11-14-20-5-10)', () =>
    pin('Freshman Crown', { ST: 9, CN: 15, SZ: 11, WT: 14, WL: 20, SP: 5, DF: 10 }));

  it('pins the untrained 14-7 graduate (9-11-8-15-21-7-13)', () =>
    pin('The Natural', { ST: 9, CN: 11, SZ: 8, WT: 15, WL: 21, SP: 7, DF: 13 }));

  it('pins the lucky-roll 16-5 graduate (10-10-4-16-20-14-10)', () =>
    pin('Lucky Roll', { ST: 10, CN: 10, SZ: 4, WT: 16, WL: 20, SP: 14, DF: 10 }));

  it('pins the trained-to-standard graduate (9-11-13-13-19-9-10)', () =>
    pin('The Standard', { ST: 9, CN: 11, SZ: 13, WT: 13, WL: 19, SP: 9, DF: 10 }));

  it('pins the easy-arena 17-4 graduate (9-9-13-17-21-4-11)', () =>
    pin('Arena Ace', { ST: 9, CN: 9, SZ: 13, WT: 17, WL: 21, SP: 4, DF: 11 }));

  it('LU doctrine encodes the even-spread advice and the scum avoid', () => {
    const d = FIGHTER_CONCEPTS[FightingStyle.LungingAttack].doctrine;
    expect(d).toMatch(/even|balanced/i);
    expect(d).toMatch(/scum|plate/i);
  });
});

describe('PL — Arena 93 parry-lunge canon builds', () => {
  // "The Armor Piercing Parry-Lunge" (the article's perfect spread), Tripwire's
  // Parry-Lunge (all seven listed graduates), and Assur's addendum — the lone
  // TV parry-lunger that fit no model.
  const plConcepts = FIGHTER_CONCEPTS[FightingStyle.ParryLunge].concepts;

  it('carries the full canon roster: 2 baseline + 9 article builds', () => {
    expect(plConcepts).toHaveLength(11);
  });

  it('names every article build', () => {
    const names = plConcepts.map((c) => c.name);
    for (const n of [
      'Armor-Piercer',
      'First Graduate',
      'Two-Time Televised',
      'Parry Adept',
      'Dodge Adept',
      'Endless Engine',
      'Low-Effort Razor',
      'Pocket Fencer',
      "Assur's Outlier",
    ]) {
      expect(names).toContain(n);
    }
  });

  const pin = (name: string, spread: Attributes) =>
    expect(
      plConcepts.find((c) => c.name === name)?.canonStats,
      `${name} canonStats`
    ).toEqual(spread);

  it("pins the Armor-Piercer's perfect spread (11-5-8-21-17-5-17)", () =>
    pin('Armor-Piercer', { ST: 11, CN: 5, SZ: 8, WT: 21, WL: 17, SP: 5, DF: 17 }));

  it("pins Tripwire's first listed graduate (10-10-9-17-17-4-17)", () =>
    pin('First Graduate', { ST: 10, CN: 10, SZ: 9, WT: 17, WL: 17, SP: 4, DF: 17 }));

  it("pins Tripwire's two-time TV strategy example (11-12-7-21-15-5-13)", () =>
    pin('Two-Time Televised', { ST: 11, CN: 12, SZ: 7, WT: 21, WL: 15, SP: 5, DF: 13 }));

  it("pins the parry-favorite graduate (11-9-8-17-15-9-15)", () =>
    pin('Parry Adept', { ST: 11, CN: 9, SZ: 8, WT: 17, WL: 15, SP: 9, DF: 15 }));

  it("pins the dodge-favorite graduate (9-13-10-21-15-5-11)", () =>
    pin('Dodge Adept', { ST: 9, CN: 13, SZ: 10, WT: 21, WL: 15, SP: 5, DF: 11 }));

  it("pins the will-engine graduate (7-11-13-17-21-4-11)", () =>
    pin('Endless Engine', { ST: 7, CN: 11, SZ: 13, WT: 17, WL: 21, SP: 4, DF: 11 }));

  it("pins the low-effort longsword graduate (9-13-10-15-15-7-15)", () =>
    pin('Low-Effort Razor', { ST: 9, CN: 13, SZ: 10, WT: 15, WL: 15, SP: 7, DF: 15 }));

  it("pins the compact scimitar graduate (10-12-5-17-21-8-11)", () =>
    pin('Pocket Fencer', { ST: 10, CN: 12, SZ: 5, WT: 17, WL: 21, SP: 8, DF: 11 }));

  it("pins Assur's addendum outlier (21-12-7-17-9-7-11)", () =>
    pin("Assur's Outlier", { ST: 21, CN: 12, SZ: 7, WT: 17, WL: 9, SP: 7, DF: 11 }));

  it('PL doctrine treats dodge as a first-class defense — no more "unsuited" canard', () => {
    const d = FIGHTER_CONCEPTS[FightingStyle.ParryLunge].doctrine;
    expect(d).toMatch(/dodge/i);
    expect(d).not.toMatch(/unsuited/i);
  });
});

describe('FIGHTER_CONCEPTS — Parry-Riposte Arena 93 canon builds', () => {
  const prConcepts = FIGHTER_CONCEPTS[FightingStyle.ParryRiposte].concepts;

  it('carries the full dozen canon ripper concepts', () => {
    expect(prConcepts).toHaveLength(12);
  });

  it('includes the newsletter canon builds', () => {
    const names = prConcepts.map((c) => c.name);
    for (const n of [
      'Daydream',
      'Consortium Hybrid',
      'Freshman Scum',
      'The Art',
      "Necrom's Paragon",
      "Thror's Lesson",
      'Fantasy Duelist',
      'Dawnrain',
      'Scovellie',
      'Santee',
    ]) {
      expect(names).toContain(n);
    }
  });

  it('pins Daydream — Assur\'s "best Parry Riposte ever" (17-14-4-17-7-8-17)', () => {
    const c = prConcepts.find((x) => x.name === 'Daydream');
    expect(c?.canonStats).toEqual({ ST: 17, CN: 14, SZ: 4, WT: 17, WL: 7, SP: 8, DF: 17 });
  });

  it('pins Necrom\'s Paragon — the "perfect" ripper (9-4-5-17-21-11-17)', () => {
    const c = prConcepts.find((x) => x.name === "Necrom's Paragon");
    expect(c?.canonStats).toEqual({ ST: 9, CN: 4, SZ: 5, WT: 17, WL: 21, SP: 11, DF: 17 });
  });
});

describe('PS — Arena 93 piker canon builds', () => {
  // Assur's "The Parry Strike Style" + addendum, The Priest's
  // "Parry Strike, Another Fun Style", and Assur's "Pikers" — every
  // published success spread plus the cautionary near-miss.
  const psConcepts = FIGHTER_CONCEPTS[FightingStyle.ParryStrike].concepts;

  it('carries the full canon roster: 2 baseline + 11 article builds', () => {
    expect(psConcepts).toHaveLength(13);
  });

  it('names every article build', () => {
    const names = psConcepts.map((c) => c.name);
    for (const n of [
      "Assur's Champion",
      'Quiet Qualifier',
      'The False Godling',
      'Eleven-Wit Scum',
      "Priest's Edge",
      "Priest's Guard",
      'Shell Piker',
      'Easy Design',
      'Burning Piker',
      'Wit Burn',
      'Attack Cutter',
    ]) {
      expect(names).toContain(n);
    }
  });

  const pin = (name: string, spread: Attributes) =>
    expect(
      psConcepts.find((c) => c.name === name)?.canonStats,
      `${name} canonStats`
    ).toEqual(spread);

  it("pins Assur's Tournament Champion (12-7-7-21-21-5-11)", () =>
    pin("Assur's Champion", { ST: 12, CN: 7, SZ: 7, WT: 21, WL: 21, SP: 5, DF: 11 }));

  it("pins the unremarkable TV qualifier (17-12-4-21-7-12-11)", () =>
    pin('Quiet Qualifier', { ST: 17, CN: 12, SZ: 4, WT: 21, WL: 7, SP: 12, DF: 11 }));

  it("pins the near-perfect mediocrity (15-5-10-21-17-5-11)", () =>
    pin('The False Godling', { ST: 15, CN: 5, SZ: 10, WT: 21, WL: 17, SP: 5, DF: 11 }));

  it("pins the eleven-wit scum piker (15-16-5-11-21-5-11)", () =>
    pin('Eleven-Wit Scum', { ST: 15, CN: 16, SZ: 5, WT: 11, WL: 21, SP: 5, DF: 11 }));

  it("pins The Priest's offensive rollup (15-7-11-17-16-7-11)", () =>
    pin("Priest's Edge", { ST: 15, CN: 7, SZ: 11, WT: 17, WL: 16, SP: 7, DF: 11 }));

  it("pins The Priest's defensive rollup (11-7-10-17-17-7-15)", () =>
    pin("Priest's Guard", { ST: 11, CN: 7, SZ: 10, WT: 17, WL: 17, SP: 7, DF: 15 }));

  it("pins the hit-points scum (17-18-17-3-16-6-7)", () =>
    pin('Shell Piker', { ST: 17, CN: 18, SZ: 17, WT: 3, WL: 16, SP: 6, DF: 7 }));

  it("pins the easy-design learner (10-13-12-21-9-6-13)", () =>
    pin('Easy Design', { ST: 10, CN: 13, SZ: 12, WT: 21, WL: 9, SP: 6, DF: 13 }));

  it("pins the hybrid burner (13-8-16-5-19-14-9)", () =>
    pin('Burning Piker', { ST: 13, CN: 8, SZ: 16, WT: 5, WL: 19, SP: 14, DF: 9 }));

  it("pins the wit burner (7-9-9-16-20-13-10)", () =>
    pin('Wit Burn', { ST: 7, CN: 9, SZ: 9, WT: 16, WL: 20, SP: 13, DF: 10 }));

  it("pins the attack-maxed piker (17-4-8-15-11-12-17)", () =>
    pin('Attack Cutter', { ST: 17, CN: 4, SZ: 8, WT: 15, WL: 11, SP: 12, DF: 17 }));

  it('PS doctrine encodes the wit keystone and the LO/SC weapon staples', () => {
    const d = FIGHTER_CONCEPTS[FightingStyle.ParryStrike].doctrine;
    expect(d).toMatch(/wit/i);
    expect(d).toMatch(/scimitar|longsword/i);
  });
});

describe('SL — Arena 93 slasher canon builds', () => {
  const slConcepts = FIGHTER_CONCEPTS[FightingStyle.SlashingAttack].concepts;

  it('has all 9 concepts: 3 stable-builds + 6 article builds', () => {
    expect(slConcepts).toHaveLength(9);
    const names = slConcepts.map((c) => c.name);
    for (const n of [
      'Sacred Lord',
      'Arcane Slasher',
      'Darque Slasher',
      'Unbiased Slasher',
      'Profile Slasher',
      'Anti-Thesis',
    ]) {
      expect(names).toContain(n);
    }
  });

  it('pins the Arcane Slasher canon spread (84 points, WL 21)', () => {
    const c = slConcepts.find((x) => x.name === 'Arcane Slasher');
    expect(c?.canonStats).toEqual({ ST: 6, CN: 3, SZ: 11, WT: 15, WL: 21, SP: 11, DF: 17 });
  });

  it('pins the Anti-Thesis canon spread — the average slasher that made AD', () => {
    const c = slConcepts.find((x) => x.name === 'Anti-Thesis');
    expect(c?.canonStats).toEqual({ ST: 13, CN: 11, SZ: 12, WT: 10, WL: 16, SP: 11, DF: 11 });
  });

  it('pins the Sacred Lord canon spread — the high-baseline ideal', () => {
    const c = slConcepts.find((x) => x.name === 'Sacred Lord');
    expect(c?.canonStats).toEqual({ ST: 11, CN: 7, SZ: 7, WT: 17, WL: 17, SP: 9, DF: 16 });
  });

  it('SL doctrine encodes the scimitar criterion and slash-only tactics', () => {
    const d = FIGHTER_CONCEPTS[FightingStyle.SlashingAttack].doctrine;
    expect(d).toMatch(/scimitar/i);
    expect(d).toMatch(/slash/i);
  });
});

describe('ST — Arena 93 striker canon builds', () => {
  // Assur's Striker Guide, Blind Man's Brainy Low-Will Striker, Sir Boyd's
  // Striking Style, Talon's Strikers R Us, Tex's Yet Another Striker Article,
  // and Crimson Strategist's Crimson Strikers — every published spread.
  const stConcepts = FIGHTER_CONCEPTS[FightingStyle.StrikingAttack].concepts;

  it('carries the full canon roster: 3 baseline + 28 article builds', () => {
    expect(stConcepts).toHaveLength(31);
  });

  it('names every article author line', () => {
    const names = stConcepts.map((c) => c.name);
    for (const n of [
      // Assur's eight-man stable
      "Assur's Godling",
      "Assur's Giant",
      "Assur's Stayer",
      "Assur's Hammer",
      "Assur's Sprinter",
      "Assur's Cutter",
      "Assur's Duelist",
      "Assur's Scholar",
      // Blind Man's brainy low-will pair
      'Brainy Striker',
      'Glass Decider',
      // Sir Boyd's two
      "Sir Boyd's Perfect",
      "Sir Boyd's Swift",
      // Talon's Biffs + named builds
      "Fool's Biff",
      'Clever Biff',
      "Gambler's Biff",
      'Hulk Biff',
      'Godling Biff',
      "Talon's Solid",
      'Primal Perfect',
      // Tex's eight veterans
      "Tex's Workhorse",
      "Tex's Graduate",
      "Tex's Bruiser",
      "Tex's Godling",
      "Tex's Fireball",
      "Tex's Stayer",
      "Tex's Accident",
      "Tex's Grinder",
      // Crimson's synthesized build
      'Crimson Striker',
    ]) {
      expect(names).toContain(n);
    }
  });

  const pin = (name: string, spread: Attributes) =>
    expect(
      stConcepts.find((c) => c.name === name)?.canonStats,
      `${name} canonStats`
    ).toEqual(spread);

  it("pins Assur's 21-wit godling (21-4-7-21-9-11-11)", () =>
    pin("Assur's Godling", { ST: 21, CN: 4, SZ: 7, WT: 21, WL: 9, SP: 11, DF: 11 }));

  it("pins Blind Man's first brainy striker (11-12-10-19-9-6-17)", () =>
    pin('Brainy Striker', { ST: 11, CN: 12, SZ: 10, WT: 19, WL: 9, SP: 6, DF: 17 }));

  it("pins Sir Boyd's ideal (13-4-9-21-11-9-17)", () =>
    pin("Sir Boyd's Perfect", { ST: 13, CN: 4, SZ: 9, WT: 21, WL: 11, SP: 9, DF: 17 }));

  it("pins Talon's Perfect column (15-3-5-21-15-8-17)", () =>
    pin('Primal Perfect', { ST: 15, CN: 3, SZ: 5, WT: 21, WL: 15, SP: 8, DF: 17 }));

  it("pins Tex's 69-fight veteran (13-5-17-17-10-9-13)", () =>
    pin("Tex's Workhorse", { ST: 13, CN: 5, SZ: 17, WT: 17, WL: 10, SP: 9, DF: 13 }));

  it('pins the Crimson synthesis (13-5-10-17-11-10-17)', () =>
    pin('Crimson Striker', { ST: 13, CN: 5, SZ: 10, WT: 17, WL: 11, SP: 10, DF: 17 }));

  it('ST doctrine encodes all-tactic versatility, not decisiveness-only', () => {
    const d = FIGHTER_CONCEPTS[FightingStyle.StrikingAttack].doctrine;
    expect(d).toMatch(/decisiveness/i);
    expect(d).toMatch(/versatil|every tactic|all (of )?(the )?tactics/i);
    expect(d).not.toMatch(/only suited offensive tactic/i);
  });
});

describe('scaleToAttributeBudget', () => {
  const SPREAD: Attributes = { ST: 11, CN: 12, SZ: 9, WT: 17, WL: 15, SP: 5, DF: 15 }; // sums 84

  it('leaves a spread already on budget untouched', () => {
    const onBudget: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    expect(scaleToAttributeBudget(onBudget)).toEqual(onBudget);
  });

  it('scales an 84-point spread to exactly 70 with integer values', () => {
    const scaled = scaleToAttributeBudget(SPREAD);
    expect(sum(scaled)).toBe(ATTRIBUTE_TOTAL);
    for (const key of ATTRIBUTE_KEYS) {
      expect(Number.isInteger(scaled[key])).toBe(true);
      expect(scaled[key]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
      expect(scaled[key]).toBeLessThanOrEqual(ATTRIBUTE_MAX);
    }
  });

  it('preserves the spread shape — rank order survives scaling', () => {
    const scaled = scaleToAttributeBudget(SPREAD);
    expect(scaled.WT).toBeGreaterThan(scaled.ST);
    expect(scaled.DF).toBeGreaterThan(scaled.SP);
    expect(scaled.SZ).toBeLessThan(scaled.CN);
  });

  it('respects the attribute floor when a stat scales below MIN', () => {
    const tiny: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 25, WL: 25, SP: 3, DF: 25 }; // sums 87
    const scaled = scaleToAttributeBudget(tiny);
    for (const key of ATTRIBUTE_KEYS) expect(scaled[key]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
    expect(sum(scaled)).toBe(ATTRIBUTE_TOTAL);
  });

  it('is deterministic — same input, same output', () => {
    expect(scaleToAttributeBudget(SPREAD)).toEqual(scaleToAttributeBudget(SPREAD));
  });
});

describe('conceptPrimaryAttr', () => {
  it('returns a legal attribute key for every style', () => {
    for (const style of ALL_STYLES) {
      expect(ATTRIBUTE_KEYS).toContain(conceptPrimaryAttr(style));
    }
  });

  it('picks the argmax of the style mean spread', () => {
    for (const style of ALL_STYLES) {
      const mean = conceptMean(style);
      const primary = conceptPrimaryAttr(style);
      for (const key of ATTRIBUTE_KEYS) {
        expect(mean[primary]).toBeGreaterThanOrEqual(mean[key]);
      }
    }
  });
});

describe('conceptMean', () => {
  it('equals the single concept spread for one-concept styles', () => {
    for (const style of ALL_STYLES) {
      const concepts = FIGHTER_CONCEPTS[style].concepts;
      if (concepts.length !== 1) continue;
      for (const key of ATTRIBUTE_KEYS) {
        expect(conceptMean(style)[key]).toBeCloseTo(concepts[0]!.stats[key], 5);
      }
    }
  });

  it('mean spreads stay on the 70-point scale', () => {
    for (const style of ALL_STYLES) {
      const mean = conceptMean(style);
      const total = ATTRIBUTE_KEYS.reduce((s, k) => s + mean[k], 0);
      expect(Math.abs(total - ATTRIBUTE_TOTAL), `${style} mean total ${total}`).toBeLessThan(1);
    }
  });
});
