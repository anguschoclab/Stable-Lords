/**
 * Dynamic Orphanage Pool Generator
 * Generates randomized orphan warriors with thematic names, backstories,
 * personality traits, ages, and style-appropriate attribute spreads.
 */
import { FightingStyle } from '@/types/game';
import type { Attributes } from '@/types/game';
import type { AttributePotential } from '@/types/warrior.types';
import { generatePotential } from '@/engine/potential';
import { TRAITS } from '@/engine/traits';
import { ARCHETYPE_NAMES } from '@/data/names/archetypeNames';
import { STYLE_ARCHETYPE, generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';
import { shuffled } from '@/utils/random';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { SeededRNGService } from '@/utils/random'; /**
 * Defines the shape of orphan warrior.
 */

/**
 * Defines the shape of orphan warrior.
 */
export interface OrphanWarrior {
  id: string;
  name: string;
  age: number;
  style: FightingStyle;
  attrs: Attributes;
  lore: string;
  trait: string;
  origin: string;
  potential: AttributePotential;
}

// ── RNG & Helpers ────────────────────────────────────────────────────────

const TRAIT_IDS = Object.keys(TRAITS); /**
 * Generate orphan pool.
 * @param seed - Seed. (optional)
 */

// ── Generation Logic ─────────────────────────────────────────────────────

/**
 * Generate orphan pool.
 * @param seed - Seed. (optional)
 */
export function generateOrphanPool(count: number = 8, seed?: number): OrphanWarrior[] {
  const rng = new SeededRNGService(seed ?? cryptoRandomInt(0, 2147483647));
  const styles = Object.values(FightingStyle);
  const usedNames = new Set<string>();
  const pool: OrphanWarrior[] = [];

  const guaranteedStyles = shuffled(
    [
      rng.pick([FightingStyle.BashingAttack, FightingStyle.StrikingAttack]),
      rng.pick([FightingStyle.LungingAttack, FightingStyle.SlashingAttack]),
      rng.pick([
        FightingStyle.AimedBlow,
        FightingStyle.ParryRiposte,
        FightingStyle.ParryLunge,
        FightingStyle.ParryStrike,
      ]),
      rng.pick([FightingStyle.TotalParry, FightingStyle.WallOfSteel]),
    ],
    rng
  );

  for (let i = 0; i < count; i++) {
    const style = i < guaranteedStyles.length ? guaranteedStyles[i]! : rng.pick(styles);
    const archetype = STYLE_ARCHETYPE[style];

    // Combine the archetype name pool with the generic "tank" mixed pool for variety
    const namePool = [...ARCHETYPE_NAMES[archetype], ...ARCHETYPE_NAMES.tank].filter(
      (n) => !usedNames.has(n)
    );
    const name = namePool.length > 0 ? rng.pick(namePool) : `ORPHAN_${i}`;
    usedNames.add(name);

    const age = Math.floor(rng.next() * 5) + 15;
    const attrs = generateArchetypeAttrs(style, rng);
    const origin = generateOrigin(rng);
    const trait = rng.pick(TRAIT_IDS);
    const lore = generateLore(name, rng);

    const rarityRoll = rng.next();
    let tier: 'Common' | 'Promising' | 'Exceptional' | 'Prodigy' = 'Common';
    if (rarityRoll > 0.99) tier = 'Prodigy';
    else if (rarityRoll > 0.95) tier = 'Exceptional';
    else if (rarityRoll > 0.82) tier = 'Promising';

    const traitData = TRAITS[trait];
    if (traitData?.effect.attrBonus) {
      for (const [key, bonus] of Object.entries(traitData.effect.attrBonus)) {
        attrs[key as keyof Attributes] += bonus as number;
      }
    }

    const potential = generatePotential(attrs, tier, rng);

    pool.push({
      id: `orp_${i}_${Math.floor(rng.next() * 1e6)}`,
      name,
      age,
      style,
      attrs,
      lore,
      trait,
      origin,
      potential,
    });
  }

  return pool;
}

// Re-export TRAITS as TRAIT_DATA for UI components (WarriorCard tooltip)
export { TRAITS as TRAIT_DATA };
