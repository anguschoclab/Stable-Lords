import { TRAITS, type TraitTier } from '@/engine/traits';
import { STYLE_DISPLAY_NAMES, type FightingStyle } from '@/types/shared.types';

export interface TraitBadgeMeta {
  id: string;
  name: string;
  tier: TraitTier;
  description: string;
  isFlaw: boolean;
  /** Short label of the restricting style, if class-specific. */
  classTag?: string;
}

export function traitBadgeMeta(id: string): TraitBadgeMeta | null {
  const t = TRAITS[id];
  if (!t) return null;
  return {
    id,
    name: t.name,
    tier: t.tier,
    description: t.description,
    isFlaw: t.tier === 'Flaw',
    classTag: t.styles?.length
      ? STYLE_DISPLAY_NAMES[t.styles[0] as FightingStyle] ?? String(t.styles[0])
      : undefined,
  };
}

/** Tailwind classes per tier — mirrors the potential-grade colour ladder; Flaw is a warning. */
export function traitTierColorClasses(tier: TraitTier): string {
  switch (tier) {
    case 'Common':      return 'bg-white/10 text-foreground/80 border-white/15';
    case 'Notable':     return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
    case 'Exceptional': return 'bg-arena-gold/10 text-arena-gold border-arena-gold/25';
    case 'Signature':   return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'Flaw':        return 'bg-destructive/15 text-destructive border-destructive/30';
  }
}
