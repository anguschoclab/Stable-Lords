import { Swords, Eye, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Warrior } from '@/types/game';
import type { UseFavoritesActionsResult } from '@/hooks/useFavoritesActions';
import { getItemById, getAvailableItems } from '@/data/equipment';
import { CHART_MIN_SWINGS, CHART_SIGNAL_CRIT_RATE } from '@/engine/favorites';
import {
  getWeaponSuitability,
  WEAPON_SUITABILITY_LABELS,
  WEAPON_SUITABILITY_COLORS,
} from '@/engine/equipment/weaponSuitability';
import { weaponDamageBonus } from '@/engine/combat/mechanics/weaponStats';

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

  const weaponId = warrior.favorites?.weaponId;
  const suitability = weaponId ? getWeaponSuitability(weaponId, warrior.style) : null;
  const dmgBonus = weaponId ? weaponDamageBonus(weaponId, warrior.style) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 flex items-center gap-2">
          <Swords className="h-3 w-3" /> Weapon Affinity
        </div>
        {isWeaponDiscovered && (
          <span className="text-[8px] font-black uppercase text-arena-gold tracking-widest px-2 py-0.5 border border-arena-gold/20 bg-arena-gold/5">
            REVEALED
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {isWeaponDiscovered ? (
            <div className="space-y-1">
              <div className="text-sm font-display font-black uppercase">{favDisplay.weapon}</div>
              <div className="text-[9px] font-black text-arena-gold uppercase tracking-widest">
                {dmgBonus >= 0 ? '+' : ''}
                {dmgBonus} DMG
                {suitability && (
                  <span className={cn('ml-2', WEAPON_SUITABILITY_COLORS[suitability])}>
                    {WEAPON_SUITABILITY_LABELS[suitability]}
                  </span>
                )}
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
      <ProgressBar pct={weaponProgress} revealed={isWeaponDiscovered} />
      <WeaponChart warrior={warrior} revealedWeaponId={isWeaponDiscovered ? weaponId : undefined} />
    </div>
  );
}

interface ChartRow {
  weaponId: string;
  name: string;
  swings: number;
  crits: number;
  knockdowns: number;
  rate: number;
}

/**
 * The charting ledger — swings / crits / knockdowns per weapon wielded.
 * A weapon that keeps producing crits at an elevated rate is the statistical
 * tell of a hidden favorite (the classic charting method): the favorite bonus
 * is always on, so the ledger drifts up before discovery names it.
 */
function WeaponChart({
  warrior,
  revealedWeaponId,
}: {
  warrior: Warrior;
  revealedWeaponId?: string;
}) {
  const chart = warrior.favorites?.chart;
  const rows: ChartRow[] = Object.entries(chart ?? {})
    .filter(([, r]) => r.swings > 0)
    .map(([weaponId, r]) => ({
      weaponId,
      name: getItemById(weaponId)?.name ?? weaponId,
      swings: r.swings,
      crits: r.crits,
      knockdowns: r.knockdowns,
      rate: r.crits / r.swings,
    }))
    .sort((a, b) => b.rate - a.rate || b.swings - a.swings);

  if (rows.length === 0) return null;

  // Only flag a suspect the style may actually equip — e.g. a Total Parry's
  // disarmed fist-swing tally is real data but not an equip option.
  const legalIds = new Set(getAvailableItems('weapon', warrior.style).map((i) => i.id));
  const suspect = rows.find(
    (r) =>
      legalIds.has(r.weaponId) && r.swings >= CHART_MIN_SWINGS && r.rate >= CHART_SIGNAL_CRIT_RATE
  );

  return (
    <div className="space-y-2 pt-2 border-t border-white/5">
      <div className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 flex items-center gap-2">
        <Activity className="h-3 w-3" /> Weapon Chart
      </div>
      <div className="grid grid-cols-[1fr_2rem_2rem_3rem_2rem] gap-x-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
        <span>Weapon</span>
        <span className="text-right">Swg</span>
        <span className="text-right">Crt</span>
        <span className="text-right">Crt%</span>
        <span className="text-right">KD</span>
      </div>
      {rows.map((row) => {
        const isRevealed = row.weaponId === revealedWeaponId;
        const isSuspect = !revealedWeaponId && suspect?.weaponId === row.weaponId;
        return (
          <div
            key={row.weaponId}
            className="grid grid-cols-[1fr_2rem_2rem_3rem_2rem] gap-x-2 items-center"
          >
            <span
              className={cn(
                'truncate text-[10px] font-black uppercase tracking-tight',
                isRevealed ? 'text-arena-gold' : 'text-foreground/80'
              )}
            >
              {row.name}
              {isSuspect && (
                <span className="ml-1.5 text-[7px] text-arena-gold/70 tracking-widest">
                  PROMISING
                </span>
              )}
            </span>
            <span className="text-right font-mono text-[10px] text-foreground/70">
              {row.swings}
            </span>
            <span className="text-right font-mono text-[10px] text-foreground/70">
              {row.crits}
            </span>
            <span
              className={cn(
                'text-right font-mono text-[10px] font-black',
                row.rate >= CHART_SIGNAL_CRIT_RATE ? 'text-arena-gold' : 'text-foreground/50'
              )}
            >
              {(row.rate * 100).toFixed(0)}%
            </span>
            <span className="text-right font-mono text-[10px] text-foreground/70">
              {row.knockdowns}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Hint-progress bar — gold-lit once the affinity is discovered. */
function ProgressBar({ pct, revealed }: { pct: number; revealed: boolean }) {
  return (
    <div className="h-1 w-full bg-white/5 overflow-hidden">
      <div
        className={cn(
          'h-full transition-all motion-reduce:transition-none motion-reduce:transform-none duration-1000',
          revealed ? 'bg-arena-gold shadow-[0_0_8px_rgba(255,184,0,0.4)]' : 'bg-white/10'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
