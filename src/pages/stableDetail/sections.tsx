import { Shield, Users, Swords, Skull, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WarriorLink } from '@/components/EntityLink';
import { StableCrest } from '@/components/crest/StableCrest';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { cn } from '@/lib/utils';
import type { RivalStableData } from '@/types/game';
import type { Warrior } from '@/types/warrior.types';

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
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Personality
            </span>
            <span className="text-[10px] font-black uppercase text-foreground">
              {rival.owner.personality}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Tier
            </span>
            <span className={cn('text-[10px] font-black uppercase', tierCfg.text)}>
              {rival.tier || 'Minor'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Win Rate
            </span>
            <span className="text-[10px] font-mono font-black text-primary">{winRate}%</span>
          </div>
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
        </div>
      </section>
    </aside>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Roster',
            value: activeRoster.length,
            icon: Users,
            color: 'text-foreground',
          },
          { label: 'Victories', value: totalWins, icon: Trophy, color: 'text-arena-pop' },
          { label: 'Losses', value: totalLosses, icon: Skull, color: 'text-destructive' },
          {
            label: 'Confirmed Kills',
            value: totalKills,
            icon: Swords,
            color: 'text-arena-blood',
          },
        ].map((stat) => (
          <Surface
            key={stat.label}
            variant="glass"
            className="p-6 border-white/5 space-y-3"
          >
            <stat.icon className={cn('h-4 w-4 opacity-40', stat.color)} />
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                {stat.label}
              </div>
              <div className={cn('text-2xl font-display font-black', stat.color)}>
                {stat.value}
              </div>
            </div>
          </Surface>
        ))}
      </div>

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
                  <WarriorLink
                    name={w.name}
                    id={w.id}
                    className="mr-2 hover:text-destructive"
                  >
                    {w.name}
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
