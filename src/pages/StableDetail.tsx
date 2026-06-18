import { useMemo, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useWorldState } from '@/state/useGameStore';
import { isActive, isDead } from '@/engine/warriorStatus';
import { Badge } from '@/components/ui/badge';
import { WarriorLink } from '@/components/EntityLink';
import {
  Shield,
  Users,
  Swords,
  Skull,
  Trophy,
  ArrowLeft,
  LayoutDashboard,
  FileText,
  History,
} from 'lucide-react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { Button } from '@/components/ui/button';
import { StableCrest } from '@/components/crest/StableCrest';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { cn } from '@/lib/utils';
import { StableRosterTab } from '@/components/stable/StableRosterTab';
import { StableLogsTab } from '@/components/stable/StableLogsTab';

const TIER_CONFIG: Record<
  string,
  { label: string; ring: 'bronze' | 'silver' | 'gold' | 'blood'; text: string }
> = {
  Legendary: { label: 'Legendary', ring: 'gold', text: 'text-arena-gold' },
  Major: { label: 'Major', ring: 'blood', text: 'text-primary' },
  Established: { label: 'Established', ring: 'silver', text: 'text-foreground' },
  Minor: { label: 'Minor', ring: 'bronze', text: 'text-muted-foreground' },
};

/**
 * Stable detail.
 */

/**
 * Stable detail.
 */
export default function StableDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const state = useWorldState();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ROSTER' | 'LOGS'>('OVERVIEW');

  const rivalMap = useMemo(
    () => new Map((state.rivals ?? []).map((r) => [r.owner.id as string, r])),
    [state.rivals]
  );

  const rival = useMemo(() => (id ? rivalMap.get(id) : undefined), [rivalMap, id]);

  if (!rival) {
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

  const tierCfg = (TIER_CONFIG[rival.tier ?? 'Minor'] ?? TIER_CONFIG.Minor)!;

  const stableWarriorIds = new Set(rival.roster.map((w) => w.id));
  const recentBouts = state.arenaHistory
    .filter((f) => stableWarriorIds.has(f.warriorIdA) || stableWarriorIds.has(f.warriorIdD))
    .slice(-12)
    .reverse();

  return (
    <PageFrame maxWidth="xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-transparent -ml-4 opacity-40 hover:opacity-100 transition-all"
        >
          <Link
            to="/world/intelligence"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Intelligence
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="STABLE_DOSSIER"
        title={rival.owner.stableName}
        subtitle={`${(rival.owner.personality ?? '').toUpperCase()} · ${rival.tier?.toUpperCase() || 'MINOR'} CLASS ASSET`}
        icon={Shield}
        actions={
          <div className="flex items-center gap-8">
            <BookmarkButton entityType="rival" entityId={rival.owner.id} size="md" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Institutional Fame
              </span>
              <span className="text-xl font-display font-black text-arena-gold">
                {rival.owner.fame}
              </span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        {/* Sidebar: Subject Metadata */}
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

        {/* Main Content: Tabbed Analysis */}
        <div className="lg:col-span-8 space-y-8">
          {/* Dossier Tabs */}
          <div className="flex items-center gap-8 border-b border-white/5 -mt-4">
            {[
              { id: 'OVERVIEW', icon: LayoutDashboard },
              { id: 'ROSTER', icon: FileText },
              { id: 'LOGS', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                className={cn(
                  'flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative',
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground/40 hover:text-foreground'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.id}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {activeTab === 'OVERVIEW' && (
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
                  <SectionDivider label="Asset Decommissioning" />
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
                        No assets have been decommissioned to date.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'ROSTER' && <StableRosterTab activeRoster={activeRoster} />}

            {activeTab === 'LOGS' && (
              <StableLogsTab recentBouts={recentBouts} stableWarriorIds={stableWarriorIds} />
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
