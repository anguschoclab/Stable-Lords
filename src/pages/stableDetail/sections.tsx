import { Link } from '@tanstack/react-router';
import { Shield, Users, Swords, Skull, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageFrame } from '@/components/ui/PageFrame';
import { Badge } from '@/components/ui/badge';
import { WarriorLink } from '@/components/EntityLink';
import { StableCrest } from '@/components/crest/StableCrest';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/state/useGameStore';
import type { RivalStableData } from '@/types/game';
import type { Warrior } from '@/types/warrior.types';
import { warriorDisplayName } from '@/utils/warriorDisplay';

/** Full-page fallback when the route id matches no rival stable. */
export function StableNotFound() {
  return (
    <PageFrame
      maxWidth="xl"
      className="flex flex-col items-center justify-center py-48 text-center"
    >
      <ImperialRing size="lg" variant="bronze" className="opacity-20 mb-8">
        <Shield className="h-10 w-10" />
      </ImperialRing>
      <div className="space-y-6">
        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
          Stable Identifier Not Found
        </p>
        <Button
          variant="outline"
          asChild
          className="h-12 px-8 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10 hover:bg-white/5"
        >
          <Link to="/world/scouting">Return to World Overview</Link>
        </Button>
      </div>
    </PageFrame>
  );
}

/** Display config for a rival-stable tier badge/ring. */
export interface TierConfig {
  label: string;
  ring: 'bronze' | 'silver' | 'gold' | 'blood';
  text: string;
}

/** Left rail: crest, owner identity, and stat metadata for the rival stable. */
export function StableSidebar({
  rival,
  tierCfg,
  winRate,
}: {
  rival: RivalStableData;
  tierCfg: TierConfig;
  winRate: number;
}) {
  return (
    <aside className="lg:col-span-4 space-y-12">
      <div className="flex flex-col items-center gap-8 py-12 border border-white/5 bg-white/[0.01]">
        <ImperialRing size="lg" variant={tierCfg.ring}>
          {rival.crest ? (
            <StableCrest crest={rival.crest} size={96} />
          ) : (
            <Shield className="h-12 w-12 text-muted-foreground/20" />
          )}
        </ImperialRing>

        <div className="text-center space-y-1 px-8">
          <h2 className="text-xl font-display font-black uppercase tracking-tight text-foreground">
            {rival.owner.name}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
            Ludus Primus
          </p>
        </div>

        <div className="w-full px-8 space-y-6 pt-8 border-t border-white/5">
          <SidebarStatRow label="Personality" value={rival.owner.personality || 'Pragmatic'} />
          <SidebarStatRow label="Tier" value={rival.tier || 'Minor'} valueClass={tierCfg.text} />
          <SidebarStatRow
            label="Win Rate"
            value={`${winRate}%`}
            valueClass="font-mono text-primary"
          />
        </div>
      </div>

      <section>
        <SectionDivider label="Historical Context" />
        <div className="mt-8 space-y-6 bg-white/[0.01] border border-white/5 p-6">
          {rival.motto && (
            <div className="space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Motto
              </span>
              <p className="text-[11px] font-display font-black text-foreground leading-relaxed italic">
                "{rival.motto}"
              </p>
            </div>
          )}
          {rival.origin && (
            <div className="space-y-3 pt-6 border-t border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Origins
              </span>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                {rival.origin}
              </p>
            </div>
          )}
          <LineageBlock rival={rival} />
        </div>
      </section>
    </aside>
  );
}

/** Legacy-founder lineage: "Founded by <warrior>, formerly of <parent>". */
function LineageBlock({ rival }: { rival: RivalStableData }) {
  const rivals = useGameStore((s) => s.rivals);
  const founderName = rival.owner.foundedByWarriorName;
  const parentName = rival.owner.parentStableId
    ? rivals?.find((r) => r.id === rival.owner.parentStableId)?.owner.stableName
    : undefined;
  if (!founderName && !parentName) return null;

  return (
    <div className="space-y-3 pt-6 border-t border-white/5">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
        Lineage
      </span>
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
        Founded by{' '}
        {rival.owner.foundedByWarriorId ? (
          <WarriorLink
            name={founderName ?? ''}
            id={rival.owner.foundedByWarriorId}
            className="text-foreground font-black hover:text-primary"
          >
            {founderName}
          </WarriorLink>
        ) : (
          <span className="text-foreground font-black">{founderName}</span>
        )}
        {parentName ? (
          <>
            {' '}
            after a career at <span className="text-foreground font-black">{parentName}</span>
          </>
        ) : (
          ' after retiring from the sands'
        )}
        .
      </p>
    </div>
  );
}

/** Label/value row inside the sidebar identity card. */
function SidebarStatRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
        {label}
      </span>
      <span className={cn('text-[10px] font-black uppercase text-foreground', valueClass)}>
        {value}
      </span>
    </div>
  );
}

/** OVERVIEW tab: stat tiles + retired-warrior memorial badges. */
export function StableOverviewTab({
  activeRoster,
  deadWarriors,
  totalWins,
  totalLosses,
  totalKills,
}: {
  activeRoster: Warrior[];
  deadWarriors: Warrior[];
  totalWins: number;
  totalLosses: number;
  totalKills: number;
}) {
  return (
    <div className="space-y-12">
      <OverviewStatTiles
        activeCount={activeRoster.length}
        totalWins={totalWins}
        totalLosses={totalLosses}
        totalKills={totalKills}
      />

      <section>
        <SectionDivider label="Retirement" />
        <div className="mt-8">
          {deadWarriors.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {deadWarriors.map((w) => (
                <Badge
                  key={w.id}
                  variant="outline"
                  className="h-10 px-4 rounded-none border-white/5 bg-white/[0.02] text-muted-foreground/40 font-black uppercase text-[10px] tracking-widest"
                >
                  <WarriorLink name={w.name} id={w.id} className="mr-2 hover:text-destructive">
                    {warriorDisplayName(w)}
                  </WarriorLink>
                  <span className="opacity-40">
                    {w.career.wins}W-{w.career.losses}L
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground/30 italic">
              No warriors have been retired to date.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/** Overview stat tiles: active roster, victories, losses, confirmed kills. */
function OverviewStatTiles({
  activeCount,
  totalWins,
  totalLosses,
  totalKills,
}: {
  activeCount: number;
  totalWins: number;
  totalLosses: number;
  totalKills: number;
}) {
  const stats = [
    { label: 'Active Roster', value: activeCount, icon: Users, color: 'text-foreground' },
    { label: 'Victories', value: totalWins, icon: Trophy, color: 'text-arena-pop' },
    { label: 'Losses', value: totalLosses, icon: Skull, color: 'text-destructive' },
    { label: 'Confirmed Kills', value: totalKills, icon: Swords, color: 'text-arena-blood' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Surface key={stat.label} variant="glass" className="p-6 border-white/5 space-y-3">
          <stat.icon className={cn('h-4 w-4 opacity-40', stat.color)} />
          <div>
            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
              {stat.label}
            </div>
            <div className={cn('text-2xl font-display font-black', stat.color)}>{stat.value}</div>
          </div>
        </Surface>
      ))}
    </div>
  );
}
