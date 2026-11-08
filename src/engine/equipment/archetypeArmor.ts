/**
 * Archetype-aware armor fitting — Assur's canon: tanks and defensives
 * wear the heaviest plate their frame can carry ("APA/F is the norm"),
 * hybrids take moderate protection, offensives stay light, and EVERY
 * pick honors two hard gates: the armor's per-style `restrictedStyles`
 * list and the warrior's encumbrance capacity (a fitted loadout never
 * lands OVER).
 *
 * The ladder is the archetype's own preference order first, then every
 * style-legal armor by weight — so a tank-fit frame falls back to chain
 * when plate over-encumbers, and an offensive fit never ends up in
 * armor its doctrine didn't ask for.
 */
import { FightingStyle, type Attributes } from '@/types/shared.types';
import type { EquipmentLoadout } from '@/data/equipment';
import { getAvailableItems } from '@/data/equipment';
import {
  getEncumbranceRatio,
  getEncumbranceTier,
} from '@/data/equipment/encumbrance';
import { computeEncumbranceCapacity } from '@/data/terrabloodCharts';
import {
  WINNING_ARCHETYPES,
  classifyArchetype,
} from '@/data/warriorArchetypes';

/** Encumbrance ratio ceiling — OVER starts at 1.2; the fitter never lands there. */
const MAX_RATIO = 1.2;

/** Standard light loadout used when the caller has no real loadout to model. */
const MODEL_LOADOUT: EquipmentLoadout = {
  weapon: 'short_spear',
  armor: 'none_armor',
  shield: 'none_shield',
  helm: 'leather_cap',
};

/**
 * Pick the best legal armor for a warrior by winning-archetype fit and
 * carry capacity. `loadout` overrides the modeled weapon/shield/helm so
 * callers refitting real gear measure the true total.
 */
export function fitArchetypeArmor(
  style: FightingStyle,
  attrs: Attributes,
  loadout: EquipmentLoadout = MODEL_LOADOUT
): string {
  const capacity = computeEncumbranceCapacity(attrs.ST, attrs.CN);
  const legal = getAvailableItems('armor', style);
  if (legal.length === 0) return 'none_armor';

  const top = classifyArchetype(attrs, style)[0];
  const preferred = top ? WINNING_ARCHETYPES[top.archetype].armor.ids : [];

  // Archetype ladder first (in doctrine order), then every legal armor
  // heaviest-first as fallback — deduped.
  const legalIds = new Set(legal.map((i) => i.id));
  const byWeight = [...legal].sort((a, b) => b.weight - a.weight).map((i) => i.id);
  const ladder = [...new Set([...preferred, ...byWeight])].filter((id) =>
    legalIds.has(id)
  );

  for (const id of ladder) {
    const ratio = getEncumbranceRatio({ ...loadout, armor: id }, capacity);
    if (getEncumbranceTier(ratio) !== 'OVER' && ratio < MAX_RATIO) return id;
  }
  return 'none_armor';
}

/**
 * Re-fit only the armor slot of an existing loadout; returns the same
 * object when unchanged. The armor pick sees the real weapon/shield/helm
 * so the total never over-encumbers.
 */
export function refitArmor(
  style: FightingStyle,
  attrs: Attributes,
  loadout: EquipmentLoadout
): EquipmentLoadout {
  const armor = fitArchetypeArmor(style, attrs, { ...loadout, armor: 'none_armor' });
  return armor === loadout.armor ? loadout : { ...loadout, armor };
}
