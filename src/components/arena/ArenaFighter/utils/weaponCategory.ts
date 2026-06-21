/**
 *
 */
export type WeaponCategory = 'slash' | 'bash' | 'pierce' | 'shield' | 'fist';

/**
 *
 */
export function getWeaponCategory(weaponName: string): WeaponCategory {
  const w = weaponName.toLowerCase();
  if (
    w.includes('shield') ||
    w.includes('small shield') ||
    w.includes('medium shield') ||
    w.includes('large shield')
  )
    return 'shield';
  if (
    w.includes('sword') ||
    w.includes('scimitar') ||
    w.includes('axe') ||
    w.includes('blade') ||
    w.includes('scythe') ||
    w.includes('halberd')
  )
    return 'slash';
  if (
    w.includes('mace') ||
    w.includes('hammer') ||
    w.includes('flail') ||
    w.includes('maul') ||
    w.includes('morning star') ||
    w.includes('morningstar')
  )
    return 'bash';
  if (
    w.includes('spear') ||
    w.includes('épée') ||
    w.includes('epee') ||
    w.includes('dagger') ||
    w.includes('pike') ||
    w.includes('lance')
  )
    return 'pierce';
  if (w.includes('staff') || w.includes('fist') || w.includes('gauntlet')) return 'fist';
  return 'slash';
}
