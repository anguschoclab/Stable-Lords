/**
 * Weapon Suitability Matrix — how well each fighting style wields each weapon.
 * Canonical source: Duel II "Weapons for each Fighting Style" chart (terrablood.com),
 * rated W = Well suited, M = Marginal, U = Unorthodox.
 * See memory terrablood-weapon-tables. Mirrors the tactic-suitability system.
 *
 * Keyed by weapon id. The published chart screenshot covered hand weapons only;
 * the three shield rows are derived to match each shield's gear suitability data
 * in weapons.ts (W = preferredStyles, U = restrictedStyles, M otherwise), so the
 * matrix is the single source of truth across all equippable items.
 */
import { FightingStyle } from '@/types/shared.types';

/** Canonical weapon-style fit: Can't-go-Wrong (favorite), Well-suited, Marginal, or Unorthodox. */
export type WeaponSuitability = 'CW' | 'W' | 'M' | 'U';

const S = FightingStyle;

/** Compact per-weapon row in canonical column order: AIM BAS LUN PLU PRP PST STR SLA TPS WOS. */
type Row = [
  WeaponSuitability, // AimedBlow
  WeaponSuitability, // BashingAttack
  WeaponSuitability, // LungingAttack
  WeaponSuitability, // ParryLunge
  WeaponSuitability, // ParryRiposte
  WeaponSuitability, // ParryStrike
  WeaponSuitability, // StrikingAttack
  WeaponSuitability, // SlashingAttack
  WeaponSuitability, // TotalParry
  WeaponSuitability, // WallOfSteel
];

const COLUMN_ORDER: FightingStyle[] = [
  S.AimedBlow,
  S.BashingAttack,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.ParryStrike,
  S.StrikingAttack,
  S.SlashingAttack,
  S.TotalParry,
  S.WallOfSteel,
];

// Canonical chart, transcribed weapon-by-weapon (CW/W/M/U). CW marks each style's
// favorite ("can't go wrong") weapon — mirrors weapons.ts favoredStyles.
const RAW_ROWS: Record<string, Row> = {
  //              AIM   BAS   LUN   PLU   PRP   PST   STR   SLA   TPS   WOS
  dagger:        ['W',  'U',  'M',  'U',  'U',  'W',  'W',  'M',  'W',  'U'],
  short_sword:   ['W',  'U',  'W',  'W',  'W',  'CW', 'W',  'W',  'W',  'U'],
  hatchet:       ['M',  'U',  'U',  'U',  'W',  'W',  'W',  'W',  'W',  'U'],
  epee:          ['W',  'U',  'W',  'W',  'CW', 'W',  'W',  'W',  'W',  'U'],
  scimitar:      ['W',  'U',  'M',  'W',  'W',  'W',  'W',  'CW', 'W',  'W'],
  short_spear:   ['W',  'U',  'CW', 'W',  'W',  'W',  'W',  'U',  'M',  'U'],
  longsword:     ['W',  'U',  'W',  'CW', 'W',  'W',  'W',  'W',  'W',  'U'], // LO = Long Sword
  broadsword:    ['M',  'M',  'U',  'M',  'U',  'W',  'CW', 'W',  'W',  'W'],
  quarterstaff:  ['CW', 'W',  'U',  'U',  'U',  'W',  'W',  'U',  'W',  'W'],
  long_spear:    ['W',  'U',  'W',  'W',  'W',  'W',  'W',  'U',  'W',  'U'], // LS = Long Spear
  war_hammer:    ['U',  'W',  'U',  'U',  'U',  'W',  'W',  'U',  'W',  'U'],
  mace:          ['U',  'CW', 'U',  'U',  'U',  'M',  'W',  'U',  'M',  'U'],
  war_flail:     ['U',  'W',  'U',  'U',  'U',  'M',  'W',  'U',  'U',  'W'],
  morning_star:  ['U',  'W',  'U',  'U',  'U',  'M',  'W',  'U',  'U',  'CW'],
  great_axe:     ['U',  'W',  'U',  'U',  'U',  'U',  'W',  'W',  'U',  'W'],
  battle_axe:    ['U',  'M',  'U',  'U',  'U',  'W',  'W',  'W',  'W',  'W'],
  greatsword:    ['U',  'W',  'U',  'U',  'U',  'W',  'W',  'M',  'W',  'W'],
  maul:          ['U',  'W',  'U',  'U',  'U',  'U',  'W',  'U',  'U',  'U'],
  halberd:       ['U',  'W',  'M',  'U',  'U',  'U',  'W',  'U',  'U',  'U'],
  // Shields — derived from each shield's gear suitability in weapons.ts.
  //              AIM   BAS   LUN   PLU   PRP   PST   STR   SLA   TPS   WOS
  small_shield:  ['M',  'M',  'M',  'W',  'W',  'W',  'M',  'M',  'M',  'M'],
  medium_shield: ['U',  'M',  'M',  'M',  'M',  'W',  'M',  'M',  'CW', 'W'],
  large_shield:  ['U',  'M',  'U',  'M',  'M',  'M',  'M',  'U',  'CW', 'M'],
};

/** Expanded matrix: weaponId → (style → suitability). */
export const WEAPON_STYLE_SUITABILITY: Record<string, Partial<Record<FightingStyle, WeaponSuitability>>> =
  Object.fromEntries(
    Object.entries(RAW_ROWS).map(([weaponId, row]) => [
      weaponId,
      Object.fromEntries(COLUMN_ORDER.map((style, i) => [style, row[i]])),
    ])
  );

/**
 * Suitability of a weapon for a fighting style. Unknown / unrated ids default to Marginal.
 */
export function getWeaponSuitability(weaponId: string | undefined, style: FightingStyle): WeaponSuitability {
  if (!weaponId) return 'M';
  return WEAPON_STYLE_SUITABILITY[weaponId]?.[style] ?? 'M';
}

/**
 * Damage-class delta from weapon-style suitability. Centred on the favorite weapon:
 * CW (your "can't go wrong" pick) is the +1 baseline, and effectiveness falls off
 * the further you stray — Well-suited 0, Marginal −1, Unorthodox −2. Because every
 * style's default loadout is its CW weapon, the population-wide damage baseline is
 * unchanged from the prior model (CW preserves the old well-suited +1).
 */
export function weaponSuitabilityDamageMod(rating: WeaponSuitability): number {
  return rating === 'CW' ? 1 : rating === 'W' ? 0 : rating === 'M' ? -1 : -2;
}

export const WEAPON_SUITABILITY_LABELS: Record<WeaponSuitability, string> = {
  CW: "Can't Go Wrong",
  W: 'Well Suited',
  M: 'Marginal',
  U: 'Unorthodox',
};

export const WEAPON_SUITABILITY_COLORS: Record<WeaponSuitability, string> = {
  CW: 'text-arena-gold',
  W: 'text-primary',
  M: 'text-muted-foreground',
  U: 'text-destructive',
};
