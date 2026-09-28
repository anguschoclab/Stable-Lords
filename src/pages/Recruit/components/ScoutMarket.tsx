import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Target, Search } from 'lucide-react';
import { RecruitCard } from '@/components/stable/RecruitCard';
import { canTransact } from '@/engine/economy/utils';
import { RecruitFilters } from './RecruitFilters';
import type { PoolWarrior, RecruitTier } from '@/engine/recruitment/recruitment';
import type { PotentialScoutReport } from '@/engine/recruitment/recruitScouting';
import type { FightingStyle } from '@/types/game';

type SortBy = 'cost-asc' | 'cost-desc' | 'random' | 'age-asc';

interface ScoutMarketProps {
  activeTiers: Set<RecruitTier>;
  activeStyle: FightingStyle | 'all';
  sortBy: SortBy;
  canRefresh: boolean;
  scoutedIds: Set<string>;
  scoutReports: Record<string, PotentialScoutReport>;
  filteredPool: PoolWarrior[];
  recruitPool: PoolWarrior[];
  treasury: number;
  rosterFull: boolean;
  selectedId: string | null;
  onSelect: (w: PoolWarrior) => void;
  setActiveStyle: (s: FightingStyle | 'all') => void;
  setSortBy: (s: SortBy) => void;
  toggleTier: (tier: RecruitTier) => void;
  handleRecruit: (w: PoolWarrior, bonus?: boolean) => void;
  handleScout: (w: PoolWarrior) => void;
  handleRefresh: () => void;
}

function EmptyPool() {
  return (
    <Surface
      variant="glass"
      className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
    >
      <ImperialRing size="lg" variant="bronze" className="opacity-20">
        <Search className="h-8 w-8" />
      </ImperialRing>
      <div className="space-y-2">
        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
          No Results
        </p>
        <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
          Broaden your filters or refresh the pool.
        </p>
      </div>
    </Surface>
  );
}

/** The "Scout Market" tab — filters rail plus the recruit card grid. */
export function ScoutMarket(props: ScoutMarketProps) {
  const {
    activeTiers,
    activeStyle,
    sortBy,
    canRefresh,
    scoutedIds,
    scoutReports,
    filteredPool,
    recruitPool,
    treasury,
    rosterFull,
    selectedId,
    onSelect,
    setActiveStyle,
    setSortBy,
    toggleTier,
    handleRecruit,
    handleScout,
    handleRefresh,
  } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
      <RecruitFilters
        activeTiers={activeTiers}
        toggleTier={toggleTier}
        activeStyle={activeStyle}
        setActiveStyle={setActiveStyle}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onRefresh={handleRefresh}
        canRefresh={canRefresh}
      />

      <div className="lg:col-span-3 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ImperialRing size="xs" variant="blood">
              <Target className="h-3 w-3" />
            </ImperialRing>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              Showing {filteredPool.length} of {recruitPool.length} Available Recruits
            </span>
          </div>
        </div>

        {filteredPool.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {filteredPool.map((w) => (
              <RecruitCard
                key={w.id}
                warrior={w}
                canAfford={canTransact(treasury, w.cost)}
                rosterFull={rosterFull}
                onRecruit={handleRecruit}
                isScouted={scoutedIds.has(w.id)}
                onScout={handleScout}
                canAffordScout={canTransact(treasury, 25)}
                canAffordBonus={canTransact(treasury, w.cost + 50)}
                scoutReport={scoutReports[w.id]}
                selected={selectedId === w.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <EmptyPool />
        )}
      </div>
    </div>
  );
}
