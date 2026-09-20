import { useMemo } from 'react';
import { Skull, Crosshair, Activity, Crown } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { computeKillAnalytics } from '@/engine/analytics/killAnalytics';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * Kill analytics panel props.
 */
interface KillAnalyticsPanelProps {
  fights: FightSummary[];
  graveyard?: Warrior[];
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-mono font-black text-foreground">{value}</div>
      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
        {label}
      </div>
    </div>
  );
}

function BreakdownRow({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 truncate">
        {label}
      </span>
      <div className="w-24 h-1 bg-white/5 rounded-none overflow-hidden">
        <div
          className="h-full bg-arena-blood motion-reduce:transition-none"
          style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
        />
      </div>
      <span className="w-6 text-right text-[10px] font-mono font-black text-foreground/80">
        {count}
      </span>
    </div>
  );
}

function Breakdown({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: [string, number][] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
          {title}
        </span>
      </div>
      <div className="space-y-1.5">
        {rows.map(([label, n]) => (
          <BreakdownRow key={label} label={label} count={n} max={rows[0]?.[1] ?? 0} />
        ))}
      </div>
    </div>
  );
}

/**
 * Mechanics of Death — kill telemetry aggregated from persisted fight
 * summaries and graveyard records.
 */
export function KillAnalyticsPanel({ fights, graveyard = [] }: KillAnalyticsPanelProps) {
  const stats = useMemo(() => computeKillAnalytics(fights, graveyard), [fights, graveyard]);

  if (stats.kills === 0 && graveyard.length === 0) {
    return (
      <Surface variant="glass" className="p-10 text-center">
        <Skull className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          No kills recorded
        </p>
        <p className="text-[9px] text-muted-foreground/30 mt-1 uppercase tracking-widest">
          Death telemetry appears once warriors fall in the arena
        </p>
      </Surface>
    );
  }

  const byCause = Object.entries(stats.byCause).sort((a, b) => b[1] - a[1]);
  const byStyle = Object.entries(stats.byStyle).sort((a, b) => b[1] - a[1]);
  const byMinuteBand = Object.entries(stats.byMinuteBand).sort((a, b) => b[1] - a[1]);

  return (
    <Surface variant="glass" className="p-6 border-white/5">
      <div className="flex items-center gap-3 mb-6">
        <Skull className="h-4 w-4 text-arena-blood" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-arena-blood">
          Mechanics of Death
        </h3>
        <span className="ml-auto text-[9px] font-mono text-muted-foreground/40">
          {stats.totalFights} bouts · {graveyard.length} fallen
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCell label="Kills" value={String(stats.kills)} />
        <StatCell label="Kill Rate" value={`${(stats.killRate * 100).toFixed(1)}%`} />
        <StatCell label="Fallen" value={String(graveyard.length)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Breakdown
          title="Cause of Death"
          icon={<Crosshair className="h-3 w-3 text-muted-foreground/50" />}
          rows={byCause}
        />
        <Breakdown
          title="Killer Styles"
          icon={<Skull className="h-3 w-3 text-muted-foreground/50" />}
          rows={byStyle}
        />
        <Breakdown
          title="Fatal Minute"
          icon={<Activity className="h-3 w-3 text-muted-foreground/50" />}
          rows={byMinuteBand}
        />
      </div>

      {stats.topKillers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <Crown className="h-3 w-3 text-arena-blood/70" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
              Deadliest Warriors
            </span>
          </div>
          <div className="space-y-1">
            {stats.topKillers.map((k) => (
              <div key={k.name} className="flex justify-between text-[10px]">
                <span className="font-black uppercase tracking-wider text-foreground/80">
                  {k.name}
                </span>
                <span className="font-mono font-black text-arena-blood">{k.kills}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Surface>
  );
}
