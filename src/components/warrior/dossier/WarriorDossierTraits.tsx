import type { Warrior } from '@/types/warrior.types';
import { TraitBadge } from '@/components/warrior/traits/TraitBadge';

interface WarriorDossierTraitsProps {
  warrior: Warrior;
} /**
   * Warrior dossier traits.
   * @param - { warrior }.
   */

/**
 * Warrior dossier traits.
 * @param - { warrior }.
 */
export function WarriorDossierTraits({ warrior }: WarriorDossierTraitsProps) {
  if (!warrior.origin && (!warrior.traits || warrior.traits.length === 0)) {
    return null;
  }

  return (
    <div className="p-3 bg-white/5 border border-white/5 rounded-none space-y-3">
      {warrior.traits && warrior.traits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {warrior.traits.map((t) => (
            <TraitBadge key={t} traitId={t} />
          ))}
        </div>
      )}
      {warrior.origin && (
        <p className="text-[11px] font-medium text-muted-foreground/90 uppercase tracking-wider leading-tight">
          {warrior.origin}
        </p>
      )}
      {warrior.lore && (
        <p className="text-xs text-muted-foreground/60 italic leading-relaxed border-l border-white/10 pl-3">
          "{warrior.lore}"
        </p>
      )}
    </div>
  );
}
