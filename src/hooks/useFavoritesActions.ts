import { useGameStore } from '@/state/useGameStore';
import { applyInsightToken } from '@/engine/favorites';
import { getFavoritesDisplay } from '@/components/warrior/favoritesDisplay';
import { toast } from 'sonner';
import type { Warrior } from '@/types/game';

export interface UseFavoritesActionsResult {
  handleInsight: (type: 'weapon' | 'rhythm') => void;
  handleApplyRhythm: () => void;
  handleEquipFavoriteWeapon: () => void;
  favDisplay: ReturnType<typeof getFavoritesDisplay>;
  isWeaponDiscovered: boolean;
  isRhythmDiscovered: boolean;
  weaponHints: number;
  rhythmHints: number;
  weaponProgress: number;
  rhythmProgress: number;
}

export function useFavoritesActions(
  warrior: Warrior,
  onUpdate: () => void
): UseFavoritesActionsResult {
  const setState = useGameStore((s) => s.setState);
  const favDisplay = getFavoritesDisplay(warrior);

  const isWeaponDiscovered = !!warrior.favorites?.discovered.weapon;
  const isRhythmDiscovered = !!warrior.favorites?.discovered.rhythm;

  const weaponHints = warrior.favorites?.discovered.weaponHints ?? 0;
  const rhythmHints = warrior.favorites?.discovered.rhythmHints ?? 0;

  const weaponProgress = isWeaponDiscovered ? 100 : (weaponHints / 2) * 100;
  const rhythmProgress = isRhythmDiscovered ? 100 : (rhythmHints / 2) * 100;

  const mutateRosterWarrior = (fn: (w: typeof warrior) => void) => {
    setState((s) => {
      const w = s.roster.find((x) => x.id === warrior.id);
      if (w) fn(w);
    });
  };

  const handleInsight = (type: 'weapon' | 'rhythm') => {
    const msg = applyInsightToken(warrior, type);
    mutateRosterWarrior((w) => {
      if (w.favorites) w.favorites = warrior.favorites;
    });
    toast.success(msg);
    onUpdate();
  };

  const handleApplyRhythm = () => {
    const fav = warrior.favorites;
    if (!fav?.discovered.rhythm) return;
    mutateRosterWarrior((w) => {
      if (fav?.rhythm) {
        if (!w.plan) w.plan = { style: w.style, OE: fav.rhythm.oe, AL: fav.rhythm.al };
        else {
          w.plan.OE = fav.rhythm.oe;
          w.plan.AL = fav.rhythm.al;
        }
      }
    });
    toast.success(
      `Cognitive Alignment Confirmed: OE ${fav.rhythm.oe} / AL ${fav.rhythm.al} synchronized.`
    );
    onUpdate();
  };

  const handleEquipFavoriteWeapon = () => {
    const fav = warrior.favorites;
    if (!fav?.discovered.weapon) return;
    mutateRosterWarrior((w) => {
      if (!w.equipment)
        w.equipment = {
          weapon: fav.weaponId,
          armor: 'none_armor',
          shield: 'none_shield',
          helm: 'none_helm',
        };
      else w.equipment.weapon = fav.weaponId;
    });
    const weaponName = favDisplay.weapon ?? fav.weaponId;
    toast.success(`Biological Lock: ${weaponName} equipped.`);
    onUpdate();
  };

  return {
    handleInsight,
    handleApplyRhythm,
    handleEquipFavoriteWeapon,
    favDisplay,
    isWeaponDiscovered,
    isRhythmDiscovered,
    weaponHints,
    rhythmHints,
    weaponProgress,
    rhythmProgress,
  };
}
