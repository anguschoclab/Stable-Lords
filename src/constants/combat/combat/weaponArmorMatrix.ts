/**
 * V24-F2 — weapon × armor interaction matrix (full adjudication).
 *
 * Canon basis (reality.com armor texts + Assur's "Which Weapons vs Which
 * Armors?" + Jalopy's DA note, reconciled):
 *
 *   ALE Leather        — "surprisingly effective, reduces rather than stops"
 *                        → slash-absorbing hide, thin blades still through
 *   APL Padded Leather — cushions smashing blows; "readily chopped through
 *                        or punctured" → bash resist, slash+pierce weak
 *   ARM Ringmail       — "absorbs most crushing blows very well", BUT
 *                        "disadvantage vs long thin blades" → bash resist,
 *                        pierce weak  [pre-F2 row was canon-inverted]
 *   ASM Scalemail      — scales deflect slashes; "chinks... smashed or
 *                        pierced" + Assur's bash sweet spot → slash resist,
 *                        bash+pierce weak
 *   ACM Chainmail      — "essentially a heavier, well-designed ringmail"
 *                        with the same strengths/weaknesses to greater degree
 *                        → ARM's profile amplified
 *   APM Platemail      — few unprotected spots; weak-spot attackers fare
 *                        slightly worse; one weapon (DA) fares well
 *                        → broad moderate resist
 *   APA Plate Armor    — "lighter weapons and the Mordant longspear bounce
 *                        off this metal shell"; still, shells get smashed
 *                        → strongest resist, bash least resistive
 *
 * Matrix cell semantics: a number is a WEAPON-SPECIFIC factor composed on
 * top of the armor's dtype baseline (cell × ARMOR_TYPE_MULT[armor][dtype]).
 * 'dtype-inherit' (and missing cells) fall through to the dtype baseline
 * unchanged. This keeps every cited interaction layered over the armor's
 * generic resistance — e.g. a light blade's bounce is strictly worse than
 * a heavy weapon's vs the same shell.
 *
 * Weapon-specific canon cells:
 *   dagger      — Jalopy "poor or ineffective at ASM or higher" vs Assur's
 *                 "surprisingly good vs APA/APM" → mid-armor penalty (0.7),
 *                 plate parity (1.0): the plate exception IS that DA fares
 *                 no worse than the generic baseline where others bounce.
 *   epee/hatchet/short_sword — the light blades (weight ≤2) that bounce
 *                 off APA's shell: 0.85 on top of APA's strong baseline.
 *   fist        — lightest "weapon" vs the shell: 0.7.
 *   long_spear  — "the Mordant longspear bounces off" APA: 0.7.
 *   longsword   — Assur names LO among the weapons that struggle vs
 *                 APM/APA: 0.9/0.85 extra penalty.
 *
 * Everything else inherits the dtype baseline — recorded here so the whole
 * 20-weapon × 8-armor surface is adjudicated, not silently defaulted.
 */

/** Weapon-specific factor composed on top of the armor dtype baseline. */
export type ArmorMatrixCell = number | 'dtype-inherit';

export const WEAPON_ARMOR_MATRIX: Record<
  string,
  Partial<Record<string, ArmorMatrixCell>>
> = {
  dagger: { ASM: 0.7, ACM: 0.7, APM: 1.0, APA: 1.0 },
  epee: { APA: 0.85 },
  hatchet: { APA: 0.85 },
  short_sword: { APA: 0.85 },
  fist: { APA: 0.7 },
  long_spear: { APA: 0.7 },
  longsword: { APM: 0.9, APA: 0.85 },
};
