import React, { useMemo } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useWorldState } from '@/state/useGameStore';
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS } from '@/types/game';
import { isActive, isDead } from '@/engine/warriorStatus';
import { Badge } from '@/components/ui/badge';
import { WarriorLink } from '@/components/EntityLink';
import {
  Shield,
  Users,
  Swords,
  Skull,
  Trophy,
  Star,
  ArrowLeft,
  Quote,
  Scroll,
  Crown,
  Heart,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { ConditionBattery } from '@/components/ui/ConditionBattery';
import { StableCrest } from '@/components/crest/StableCrest';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { cn } from '@/lib/utils';

const TIER_CONFIG: Record<string, { label: string; ring: "bronze" | "silver" | "gold" | "blood"; text: string }> = {
  Legendary: { label: 'Legendary', ring: 'gold', text: 'text-arena-gold' },
  Major: { label: 'Major', ring: 'blood', text: 'text-primary' },
  Established: { label: 'Established', ring: 'silver', text: 'text-foreground' },
  Minor: { label: 'Minor', ring: 'bronze', text: 'text-muted-foreground' },
};

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClass = value >= 16 ? "bg-primary" : value >= 12 ? "bg-arena-gold" : "bg-white/20";
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-tighter">{label.slice(0, 3)}</span>
        <span className="text-[10px] font-display font-black text-foreground">{value}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-none overflow-hidden relative">
        <div
          className={cn("h-full transition-all duration-1000 ease-out", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StableDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const state = useWorldState();

  const rival = useMemo(
    () => (state.rivals ?? []).find((r) => r.owner.id === id),
    [state.rivals, id]
  );

  if (!rival) {
    return (
      <PageFrame size="xl" className="flex flex-col items-center justify-center py-48 text-center">
        <ImperialRing size="lg" variant="bronze" className="opacity-20 mb-8">
          <Shield className="h-10 w-10" />
        </ImperialRing>
        <div className="space-y-6">
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Stable Identifier Not Found</p>
          <Button variant="outline" asChild className="h-12 px-8 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10 hover:bg-white/5">
            <Link to="/world/intelligence">Return to Tactical Overview</Link>
          </Button>
        </div>
      </PageFrame>
    );
  }

  const activeRoster = rival.roster.filter(isActive);
  const deadWarriors = rival.roster.filter(isDead);
  const {
    wins: totalWins,
    losses: totalLosses,
    kills: totalKills,
  } = rival.roster.reduce(
    (acc, w) => ({
      wins: acc.wins + w.career.wins,
      losses: acc.losses + w.career.losses,
      kills: acc.kills + w.career.kills,
    }),
    { wins: 0, losses: 0, kills: 0 }
  );
  const totalFights = totalWins + totalLosses;
  const winRate = totalFights > 0 ? Math.round((totalWins / totalFights) * 100) : 0;

  const tierCfg = TIER_CONFIG[rival.tier ?? 'Minor'] ?? TIER_CONFIG.Minor;

  const stableWarriorNames = new Set(rival.roster.map((w) => w.name));
  const recentBouts = state.arenaHistory
    .filter((f) => stableWarriorNames.has(f.a) || stableWarriorNames.has(f.d))
    .slice(-8)
    .reverse();

  return (
    <PageFrame size="xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="hover:bg-transparent -ml-4 opacity-40 hover:opacity-100 transition-all">
          <Link to="/world/intelligence" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="h-3 w-3" /> Back to Intelligence
          </Link>
        </Button>
      </div>

      <PageHeader
        title={rival.owner.stableName}
        subtitle={`STABLE_DOSSIER · ${rival.owner.personality.toUpperCase()} · ${rival.tier?.toUpperCase() || 'MINOR'}`}
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Operational Status</span>
              <span className="text-sm font-display font-black text-foreground">{rival.tier || 'Minor'} Class Asset</span>
            </div>
            <div className="flex flex-col items-end border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Institutional Fame</span>
              <span className="text-sm font-display font-black text-arena-gold">{rival.owner.fame}</span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mt-12">
        {/* Profile Sidebar */}
        <aside className="space-y-12">
          <div className="flex flex-col items-center gap-8 py-8 border border-white/5 bg-white/[0.01]">
            <ImperialRing size="lg" variant={tierCfg.ring}>
              {rival.crest ? (
                <StableCrest
                  crest={rival.crest}
                  size={96}
                  className="drop-shadow-[0_0_25px_rgba(255,255,255,0.05)]"
                />
              ) : (
                <Shield className="h-12 w-12 text-muted-foreground/20" />
              )}
            </ImperialRing>
            
            <div className="text-center space-y-1">
              <h2 className="text-xl font-display font-black uppercase tracking-tight text-foreground">{rival.owner.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Institution Head</p>
            </div>

            <div className="w-full px-8 space-y-6">
              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Personality</span>
                <span className="text-[10px] font-black uppercase text-foreground">{rival.owner.personality}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Established</span>
                <span className="text-[10px] font-black uppercase text-foreground">Generation {rival.owner.generation || 1}</span>
              </div>
              {rival.philosophy && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Philosophy</span>
                  <span className="text-[10px] font-black uppercase text-primary">{rival.philosophy}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <SectionDivider label="Historical Context" />
            <div className="bg-white/[0.01] border border-white/5 p-6 space-y-6">
              {rival.motto && (
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Operational Motto</span>
                  <p className="text-[11px] font-display font-black text-foreground leading-relaxed italic">"{rival.motto}"</p>
                </div>
              )}
              {rival.origin && (
                <div className="space-y-3 pt-6 border-t border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Origins Archive</span>
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic">{rival.origin}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Roster & Analytics */}
        <div className="lg:col-span-3 space-y-16">
          {/* Performance Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Assets', value: activeRoster.length, icon: Users, color: 'text-foreground' },
              { label: 'Total Victories', value: totalWins, icon: Trophy, color: 'text-arena-pop' },
              { label: 'Asset Losses', value: totalLosses, icon: Skull, color: 'text-destructive' },
              { label: 'Confirmed Kills', value: totalKills, icon: Swords, color: 'text-arena-blood' },
            ].map((stat) => (
              <Surface key={stat.label} variant="glass" className="p-6 border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <stat.icon className={cn("h-4 w-4 opacity-40", stat.color)} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.label}</span>
                </div>
                <div className={cn("text-3xl font-display font-black", stat.color)}>{stat.value}</div>
              </Surface>
            ))}
          </div>

          {/* Roster Grid */}
          <div className="space-y-8">
            <SectionDivider label={`Active Roster [${activeRoster.length}]`} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {activeRoster
                .sort((a, b) => b.fame - a.fame)
                .map((w) => (
                  <Surface key={w.id} variant="glass" className="p-0 border-white/5 overflow-hidden group hover:border-primary/20 transition-all duration-500">
                    <div className="p-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <ImperialRing size="sm" variant="bronze">
                            <Activity className="h-4 w-4 text-muted-foreground/40" />
                          </ImperialRing>
                          <div>
                            <WarriorLink name={w.name} id={w.id} className="text-lg font-display font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors block mb-1" />
                            <div className="flex items-center gap-3">
                              <StatBadge styleName={w.style} showFullName />
                              <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">Age {w.age}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-display font-black text-arena-gold">{w.fame} FAME</div>
                          <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{w.popularity} POP</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-4 py-4 border-y border-white/5">
                        {ATTRIBUTE_KEYS.map((k) => (
                          <StatBar key={k} label={k} value={w.attributes[k]} />
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <ConditionBattery value={100 - (w.fatigue ?? 0)} className="h-1 w-12" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">CND</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FormSparkline warriorId={w.id} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">FRM</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Heart className="h-3 w-3 text-destructive" />
                            <span className="text-[10px] font-display font-black text-foreground">{w.derivedStats.hp}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-arena-fame" />
                            <span className="text-[10px] font-display font-black text-foreground">{w.derivedStats.endurance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Surface>
                ))}
            </div>
          </div>

          {/* Fallen Assets */}
          {deadWarriors.length > 0 && (
            <div className="space-y-6">
              <SectionDivider label={`Decommissioned Assets [${deadWarriors.length}]`} />
              <div className="flex flex-wrap gap-4">
                {deadWarriors.map((w) => (
                  <Badge
                    key={w.id}
                    variant="outline"
                    className="h-10 px-4 rounded-none border-white/5 bg-white/[0.02] text-muted-foreground/40 hover:text-destructive hover:border-destructive/20 transition-all font-black uppercase text-[10px] tracking-widest"
                  >
                    <WarriorLink name={w.name} id={w.id} className="mr-2">
                      {w.name}
                    </WarriorLink>
                    <span className="opacity-40">
                      {w.career.wins}W-{w.career.losses}L
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Arena History */}
          {recentBouts.length > 0 && (
            <div className="space-y-8">
              <SectionDivider label="Engagement Log" />
              <Surface variant="glass" className="p-0 border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {recentBouts.map((f) => {
                    const isStableA = stableWarriorNames.has(f.a);
                    const won = (f.winner === 'A' && isStableA) || (f.winner === 'D' && !isStableA);
                    return (
                      <div key={f.id} className="p-6 flex items-center justify-between group hover:bg-white/[0.01] transition-all">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-1 h-8",
                            won ? "bg-arena-pop" : f.winner ? "bg-destructive" : "bg-white/10"
                          )} />
                          <div>
                            <div className="flex items-center gap-4 mb-1">
                              <WarriorLink name={f.a} className={cn("text-[11px] font-black uppercase tracking-widest", won && isStableA ? "text-foreground" : "text-muted-foreground/40")} />
                              <span className="text-[9px] font-black text-muted-foreground/20">VS</span>
                              <WarriorLink name={f.d} className={cn("text-[11px] font-black uppercase tracking-widest", won && !isStableA ? "text-foreground" : "text-muted-foreground/40")} />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">Wk {f.week}</span>
                              {f.by && (
                                <Badge variant="outline" className="h-4 text-[8px] font-black uppercase tracking-widest px-2 py-0 border-white/5 text-muted-foreground/40">
                                  {f.by}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {f.by === 'Kill' && (
                            <ImperialRing size="xs" variant="blood">
                              <Skull className="h-3 w-3 text-primary" />
                            </ImperialRing>
                          )}
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            won ? "text-arena-pop" : "text-destructive/40"
                          )}>
                            {won ? "Victory Synchronized" : "Asset Defeat"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Surface>
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
