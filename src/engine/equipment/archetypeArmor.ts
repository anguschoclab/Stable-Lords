/**
 * Archetype-aware armor fitting — Assur's canon: tanks wear the heaviest
 * plate their frame can carry ("APA/F is the norm"), hybrids stay under
 * their encumbrance limit, and every choice honors the armor's per-style
 * `restrictedStyles` list (aimed-blows and lungers never see plate).
 *
 * V25 Phase-1 scaffold — returns the creation default so the spec batch
 * compiles; real fitting lands in Phase 6.
 */

import { FightingStyle, type Attributes } from '@/types/shared.types';

/**
 * Pick the best legal armor for a warrior by winning-archetype fit and
 * carry capacity. Returns an armor item id.
 */
export function fitArchetypeArmor(
  _style: FightingStyle,
  _attrs: Attributes
): string {
  return 'leather';
}
