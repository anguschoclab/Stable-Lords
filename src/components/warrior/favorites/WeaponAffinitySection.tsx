import { Swords, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Warrior } from '@/types/game';
import type { UseFavoritesActionsResult } from '@/hooks/useFavoritesActions';

interface WeaponAffinitySectionProps {
  warrior: Warrior;
  actions: Pick<
    UseFavoritesActionsResult,
    | 'handleInsight'
    | 'handleEquipFavoriteWeapon'
    | 'favDisplay'
    | 'isWeaponDiscovered'
    | 'weaponHints'
    | 'weaponProgress'
  >;
}

/**
 *
 */
export function WeaponAffinitySection({ warrior, actions }: WeaponAffinitySectionProps) {
  const {
    handleInsight,
    handleEquipFavoriteWeapon,
    favDisplay,
    isWeaponDiscovered,
    weaponHints,
    weaponProgress,
  } = actions;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2">
          <Swords className="h-3 w-3" /> Materiel Affinity
        </div>
        {isWeaponDiscovered && (
          <span className="text-[8px] font-black uppercase text-arena-gold tracking-widest px-2 py-0.5 border border-arena-gold/20 bg-arena-gold/5">
            DISCOVERED
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {isWeaponDiscovered ? (
            <div className="space-y-1">
              <div className="text-sm font-display font-black uppercase">{favDisplay.weapon}</div>
              <div className="text-[9px] font-black text-arena-gold uppercase tracking-widest">
                Combat Bonus: +2 ACC / +1 DMG
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-black italic">
              {weaponHints > 0 ? favDisplay.weaponHint : 'Unknown'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isWeaponDiscovered && warrior.equipment?.weapon !== warrior.favorites?.weaponId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEquipFavoriteWeapon}
              className="h-8 px-4 border-arena-gold/20 hover:bg-arena-gold/10 text-arena-gold text-[9px] font-black uppercase rounded-none tracking-widest"
            >
              Equip
            </Button>
          )}
          {!isWeaponDiscovered && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInsight('weapon')}
              className="h-8 w-8 p-0 border-white/10 hover:bg-white/5 rounded-none"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="h-1 w-full bg-white/5 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            isWeaponDiscovered
              ? 'bg-arena-gold shadow-[0_0_8px_rgba(255,184,0,0.4)]'
              : 'bg-white/10'
          )}
          style={{ width: `${weaponProgress}%` }}
        />
      </div>
    </div>
  );
}
