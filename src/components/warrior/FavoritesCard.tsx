import { Zap } from 'lucide-react';
import { type Warrior } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { useFavoritesActions } from '@/hooks/useFavoritesActions';
import { WeaponAffinitySection, BioRhythmSection } from './favorites';

/**
 *
 */
export function FavoritesCard({ warrior, onUpdate }: { warrior: Warrior; onUpdate: () => void }) {
  const actions = useFavoritesActions(warrior, onUpdate);

  if (!warrior.favorites) return null;

  return (
    <Surface variant="glass" className="border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
        <ImperialRing size="xs" variant="gold">
          <Zap className="h-3 w-3 text-arena-gold" />
        </ImperialRing>
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
          Synaptic Mapping
        </span>
      </div>

      <div className="p-8 space-y-10">
        <WeaponAffinitySection warrior={warrior} actions={actions} />
        <BioRhythmSection warrior={warrior} actions={actions} />
      </div>
    </Surface>
  );
}
