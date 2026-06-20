/**
 * Stable Lords — Control Center
 * Phase 2: Replaces the draggable Dashboard with a fixed Command Grid.
 * Archetype: Command Grid — Hero KPI bar + 5 tabbed sections + 6-card grid.
 */
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { SeasonWidget } from '@/components/dashboard/SeasonWidget';
import { RecentBoutsWidget } from '@/components/dashboard/RecentBoutsWidget';
import { WeeklyDigestWidget } from '@/components/dashboard/WeeklyDigestWidget';
import { RivalryWidget } from '@/components/dashboard/RivalryWidget';
import { MetaDriftWidget } from '@/components/widgets';
import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';
import { Swords, Activity, Users, Crown } from 'lucide-react';
import { useControlCenter, type TabId } from './hooks/useControlCenter';
import { KpiBar } from './components/KpiBar';
import { RankingsBar } from './components/RankingsBar';
import { RosterSnapshot } from './components/RosterSnapshot';
import { ReputationTab } from './components/ReputationTab';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'roster', label: 'Roster', icon: Users },
  { id: 'rep', label: 'Reputation', icon: Crown },
];

export default function ControlCenter() {
  const { activeTab, setActiveTab, player, week, season, arenaHistory, boutOffers } =
    useControlCenter();

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Swords}
        eyebrow="Your Stable"
        title={player?.stableName ?? 'Stable Overview'}
        subtitle="STABLE HQ · SEASON STANDING · BATTLE RECORD"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-4 border-r border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Arena Standing
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Season Active
              </span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: High Density Intel */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <KpiBar />

          <div className="space-y-6">
            <SectionDivider label="Rankings" variant="gold" />
            <RankingsBar />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-1 border-b border-white/5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'relative flex items-center gap-3 px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                    activeTab === id
                      ? 'text-primary bg-primary/5 border-b-2 border-primary -mb-px shadow-[inset_0_-10px_20px_-10px_rgba(135,34,40,0.2)]'
                      : 'text-muted-foreground/40 hover:text-foreground/70 border-b-2 border-transparent -mb-px'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-[400px] animate-in fade-in duration-500">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SeasonWidget />
                  <WeeklyDigestWidget
                    week={week}
                    season={season}
                    arenaHistory={arenaHistory}
                    boutOffers={boutOffers ?? {}}
                    currentWeek={week}
                  />
                  <div className="md:col-span-2">
                    <RecentBoutsWidget />
                  </div>
                </div>
              )}
              {activeTab === 'roster' && <RosterSnapshot />}
              {activeTab === 'rep' && (
                <div className="grid grid-cols-1 gap-8">
                  <ReputationQuadrant />
                  <ReputationTab />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Monitoring */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="space-y-6">
            <SectionDivider label="Metagame & Rivalries" />
            <RivalryWidget />
          </div>
          <div className="space-y-6">
            <SectionDivider label="Meta Pulse" />
            <MetaDriftWidget />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
