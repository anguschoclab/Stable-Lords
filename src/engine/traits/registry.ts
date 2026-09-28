/**
 * TRAITS registry — assembled from the tier shards. Spread order preserves
 * the former bottom-of-file Object.assign merge (flaw pool, then
 * class-restricted traits win on key collisions).
 */
import type { TraitDef } from './types';
import { COMMON_TRAITS } from './defs/common';
import { NOTABLE_TRAITS } from './defs/notable';
import { EXCEPTIONAL_TRAITS } from './defs/exceptional';
import { SIGNATURE_TRAITS } from './defs/signature';
import { FLAWS_TRAITS } from './defs/flaws';
import { CLASS_TRAITS } from './defs/classTraits';

export const TRAITS: Record<string, TraitDef> = {
  ...COMMON_TRAITS,
  ...NOTABLE_TRAITS,
  ...EXCEPTIONAL_TRAITS,
  ...SIGNATURE_TRAITS,
  ...FLAWS_TRAITS,
  ...CLASS_TRAITS,
};
