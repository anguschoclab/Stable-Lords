import { useMemo } from 'react';
import { Swords, Activity, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { WEAPONS } from '@/data/equipment';
import { isActive } from '@/engine/warrior/warriorStatus';
import type { Warrior } from '@/types/game';

interface FavoritesChartingProps {
  warriors: Warrior[];
}

interface WeaponCount {
  weaponId: string;
  name: string;
  count: number;
}

interface RhythmBand {
  band: string;
  count: number;
}

/** Offense-effort band label for a rhythm OE value. */
function oeLabel(oe: number): string {
  if (oe <= 3) return 'Conservative';
  if (oe <= 6) return 'Moderate';
  return 'Aggressive';
}

/** Activity-level band label for a rhythm AL value. */
function alLabel(al: number): string {
  if (al <= 3) return 'Patient';
  if (al <= 6) return 'Steady';
  return 'Frantic';
}

interface FavoritesChart {
  total: number;
  weaponDiscovered: number;
  rhythmDiscovered: number;
  weaponRows: WeaponCount[];
  rhythmRows: RhythmBand[];
  maxWeapon: number;
  maxRhythm: number;
}

/** Aggregates discovered favorites across the active roster. */
function buildFavoritesChart(warriors: Warrior[]): FavoritesChart {
  const withFavorites = warriors.filter((w) => isActive(w) && w.favorites);
  const weaponCounts = new Map<string, number>();
  const rhythmBands = new Map<string, number>();
  let weaponDiscovered = 0;
  let rhythmDiscovered = 0;

  for (const w of withFavorites) {
    const fav = w.favorites;
    if (!fav) continue;
    if (fav.discovered.weapon) {
      weaponDiscovered += 1;
      weaponCounts.set(fav.weaponId, (weaponCounts.get(fav.weaponId) ?? 0) + 1);
    }
    if (fav.discovered.rhythm) {
      rhythmDiscovered += 1;
      const band = `${oeLabel(fav.rhythm.oe)} / ${alLabel(fav.rhythm.al)}`;
      rhythmBands.set(band, (rhythmBands.get(band) ?? 0) + 1);
    }
  }

  const weaponRows: WeaponCount[] = [...weaponCounts.entries()]
    .map(([weaponId, count]) => ({
      weaponId,
      name: WEAPONS.find((x) => x.id === weaponId)?.name ?? weaponId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const rhythmRows = [...rhythmBands.entries()]
    .map(([band, count]) => ({ band, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: withFavorites.length,
    weaponDiscovered,
    rhythmDiscovered,
    weaponRows,
    rhythmRows,
    maxWeapon: weaponRows[0]?.count ?? 0,
    maxRhythm: rhythmRows[0]?.count ?? 0,
  };
}

function DiscoverySummary({ chart }: { chart: FavoritesChart }) {
  const cells: { icon: typeof Swords; label: string; count: number }[] = [
    { icon: Swords, label: 'Weapons Revealed', count: chart.weaponDiscovered },
    { icon: Activity, label: 'Rhythms Charted', count: chart.rhythmDiscovered },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {cells.map(({ icon: Icon, label, count }) => (
        <div key={label} className="p-3 bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            <Icon className="h-3 w-3" /> {label}
          </div>
          <div className="mt-2 font-display font-black text-lg text-foreground">
            {count}
            <span className="text-[10px] text-muted-foreground/40 font-medium">
              {' '}/ {chart.total}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DistributionRows({
  title,
  rows,
  labelWidth,
  max,
  barClass,
}: {
  title: string;
  rows: { key: string; label: string; count: number }[];
  labelWidth: string;
  max: number;
  barClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
        {title}
      </div>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3">
          <span
            className={cn(
              'shrink-0 text-[10px] font-black uppercase tracking-tight text-foreground/80 truncate',
              labelWidth
            )}
          >
            {row.label}
          </span>
          <div className="h-2 flex-1 bg-white/5 overflow-hidden">
            <div
              className={cn('h-full transition-all motion-reduce:transition-none', barClass)}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right font-mono text-[10px] font-black text-foreground/70">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Roster-wide favorite-weapon charting (Feature Matrix #5).
 * Aggregates each warrior's discovered favorites — weapon affinity counts and
 * rhythm (OE/AL) bands — from real `warrior.favorites` state. Undiscovered
 * values are reported as discovery progress, never fabricated.
 */
export function FavoritesCharting({ warriors }: FavoritesChartingProps) {
  const chart = useMemo(() => buildFavoritesChart(warriors), [warriors]);

  if (chart.total === 0) return null;

  return (
    <div className="space-y-6">
      <DiscoverySummary chart={chart} />

      {chart.weaponRows.length > 0 && (
        <DistributionRows
          title="Weapon Affinity Distribution"
          rows={chart.weaponRows.map((r) => ({ key: r.weaponId, label: r.name, count: r.count }))}
          labelWidth="w-24"
          max={chart.maxWeapon}
          barClass="bg-arena-gold/80"
        />
      )}

      {chart.rhythmRows.length > 0 && (
        <DistributionRows
          title="Rhythm Bands (OE / AL)"
          rows={chart.rhythmRows.map((r) => ({ key: r.band, label: r.band, count: r.count }))}
          labelWidth="w-32"
          max={chart.maxRhythm}
          barClass="bg-primary/70"
        />
      )}

      {chart.weaponDiscovered === 0 && chart.rhythmDiscovered === 0 && (
        <Surface
          variant="glass"
          className="p-6 text-center border-dashed border-white/10 flex items-center justify-center gap-3"
        >
          <Eye className={cn('h-4 w-4 text-muted-foreground/30')} />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
            No favorites discovered yet — spend insight on the warrior dossier
          </span>
        </Surface>
      )}
    </div>
  );
}
