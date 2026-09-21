/**
 * Display-only classification of an equipped weapon into a trail profile.
 * Weapon ids from `src/data/equipment/weapons.ts`; unknown/unequipped → 'fist'.
 */
export function weaponTrailTypeFor(
  weaponId: string | undefined
): 'slash' | 'bash' | 'pierce' | 'fist' {
  switch (weaponId) {
    case 'dagger':
    case 'epee':
    case 'short_spear':
    case 'long_spear':
    case 'halberd':
      return 'pierce';
    case 'mace':
    case 'morning_star':
    case 'war_flail':
    case 'war_hammer':
    case 'quarterstaff':
    case 'maul':
      return 'bash';
    case 'hatchet':
    case 'short_sword':
    case 'scimitar':
    case 'broadsword':
    case 'longsword':
    case 'great_axe':
    case 'greatsword':
    case 'battle_axe':
      return 'slash';
    default:
      return 'fist';
  }
}
