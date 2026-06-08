import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES, type Attributes, type WarriorId } from '@/types/game';
import { BASE_ROSTER_CAP } from '@/constants/roster';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { hashStr } from '@/utils/random';
import {
  fullRefreshPool,
  type PoolWarrior,
  type RecruitTier,
  TIER_COST,
  REFRESH_COST,
} from '@/engine/recruitment';
import { canTransact } from '@/utils/economyUtils';
import { potentialRating } from '@/engine/potential';
import { revealRecruitPotential, type PotentialScoutReport } from '@/engine/recruitScouting';
import WarriorBuilder from '@/components/WarriorBuilder';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Hammer, Search, Coins, Shield, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { RecruitCard, TIER_CONFIG } from '@/components/stable/RecruitCard';
import type { Warrior } from '@/types/game';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

const CUSTOM_COST = 200;

// ─── Sub-Components ─────────────────────────────────────────────────────────

interface RecruitFiltersProps {
  activeTiers: Set<RecruitTier>;
  toggleTier: (tier: RecruitTier) => void;
  activeStyle: FightingStyle | 'all';
  setActiveStyle: (style: FightingStyle | 'all') => void;
  sortBy: 'cost-asc' | 'cost-desc' | 'potential-desc' | 'age-asc';
  setSortBy: (sort: 'cost-asc' | 'cost-desc' | 'potential-desc' | 'age-asc') => void;
  onRefresh: () => void;
  canRefresh: boolean;
}

function RecruitFilters({
  activeTiers,
  toggleTier,
  activeStyle,
  setActiveStyle,
  sortBy,
  setSortBy,
  onRefresh,
  canRefresh,
}: RecruitFiltersProps) {
  return (
    <aside className="space-y-8">
      <SectionDivider label="Filter Engine" />

      <div className="space-y-8">
        {/* Tiers */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            Market Tier Filter
          </label>
          <div className="grid grid-cols-1 gap-3">
            {(['Common', 'Promising', 'Exceptional', 'Prodigy'] as RecruitTier[]).map((tier) => {
              const isActive = activeTiers.has(tier);
              const config = TIER_CONFIG[tier];
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={cn(
                    'group flex items-center justify-between p-4 border transition-all',
                    isActive
                      ? 'bg-white/[0.05] border-white/20'
                      : 'bg-transparent border-white/5 opacity-20 grayscale hover:opacity-100 hover:grayscale-0'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-1.5 h-1.5', config.bg)} />
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-widest',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {tier}
                    </span>
                  </div>
                  <span className="font-display font-black text-[10px] text-arena-gold">
                    {TIER_COST[tier]}G
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            Tactical Archetype
          </label>
          <Select
            value={activeStyle}
            onValueChange={(v) => setActiveStyle(v as unknown as FightingStyle | 'all')}
          >
            <SelectTrigger className="h-12 bg-white/[0.02] border-white/10 rounded-none font-black uppercase text-[10px] tracking-widest">
              <SelectValue placeholder="All Archetypes" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-950 border-white/10 rounded-none">
              <SelectItem value="all">ALL ARCHETYPES</SelectItem>
              {Object.entries(STYLE_DISPLAY_NAMES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            Registry Sequence
          </label>
          <Select
            value={sortBy}
            onValueChange={(v) =>
              setSortBy(v as unknown as 'cost-asc' | 'cost-desc' | 'potential-desc' | 'age-asc')
            }
          >
            <SelectTrigger className="h-12 bg-white/[0.02] border-white/10 rounded-none font-black uppercase text-[10px] tracking-widest">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-950 border-white/10 rounded-none">
              <SelectItem value="potential-desc">POTENTIAL: HIGH TO LOW</SelectItem>
              <SelectItem value="cost-asc">VALUE: LOW TO HIGH</SelectItem>
              <SelectItem value="cost-desc">VALUE: HIGH TO LOW</SelectItem>
              <SelectItem value="age-asc">AGE: YOUNGEST FIRST</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Refresh */}
        <Button
          onClick={onRefresh}
          disabled={!canRefresh}
          className="w-full h-16 bg-white/[0.02] border border-white/10 text-foreground hover:bg-white/5 transition-all rounded-none flex items-center justify-between px-6 group"
        >
          <div className="flex items-center gap-4">
            <RefreshCw className="h-4 w-4 text-primary group-hover:rotate-180 transition-all duration-700" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sync Registry</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-3 w-3 text-arena-gold" />
            <span className="font-display font-black text-arena-gold text-xs">{REFRESH_COST}G</span>
          </div>
        </Button>
      </div>
    </aside>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * Recruit page component for personnel acquisition and management.
 */
export default function Recruit() {
  const store = useGameStore();
  const { roster, treasury, rosterBonus, recruitPool, setState, deductFunds } = store;

  const navigate = useNavigate();
  const MAX_ROSTER = BASE_ROSTER_CAP + (rosterBonus ?? 0);

  const [scoutedIds, setScoutedIds] = useState<Set<string>>(new Set());
  const [scoutReports, setScoutReports] = useState<Record<string, PotentialScoutReport>>({});

  const rosterFull = roster.length >= MAX_ROSTER;
  const [activeTiers, setActiveTiers] = useState<Set<RecruitTier>>(
    new Set(['Common', 'Promising', 'Exceptional', 'Prodigy'])
  );
  const [activeStyle, setActiveStyle] = useState<FightingStyle | 'all'>('all');
  const [sortBy, setSortBy] = useState<'cost-asc' | 'cost-desc' | 'potential-desc' | 'age-asc'>(
    'potential-desc'
  );

  const canRefresh = canTransact(treasury, REFRESH_COST);

  const handleRecruit = useCallback(
    (w: PoolWarrior, bonus: boolean = false) => {
      if (rosterFull) {
        toast.error('Roster full! Retire or release a warrior first.');
        return;
      }
      const BONUS_COST = 50;
      const totalCost = w.cost + (bonus ? BONUS_COST : 0);
      const label = `Recruit: ${w.name} (${w.tier})${bonus ? ' + signing bonus' : ''}`;
      if (!deductFunds(totalCost, label, 'recruit')) {
        toast.error(`Not enough funds! Need ${totalCost}g.`);
        return;
      }

      setState((draft: GameStore) => {
        const recruitRng = new SeededRNGService(draft.week + hashStr(w.name));
        const warrior = makeWarrior(
          recruitRng.uuid('warrior') as WarriorId,
          w.name,
          w.style,
          w.attributes,
          { age: w.age, potential: w.potential }
        );

        if (bonus) {
          warrior.xp = (warrior.xp ?? 0) + 2;
          const currentFlair = warrior.flair ?? [];
          warrior.flair = [...currentFlair, 'Eager'];
        }

        draft.roster.push(warrior);
        draft.recruitPool = (draft.recruitPool ?? []).filter((p: PoolWarrior) => p.id !== w.id);

        const items = [
          `${draft.player.stableName} signed ${w.name}, a ${w.tier.toLowerCase()} ${STYLE_DISPLAY_NAMES[w.style]}.`,
        ];
        if (bonus)
          items.push(
            `A 50g signing bonus sealed the deal — ${w.name} arrived eager to prove themselves.`
          );
        draft.newsletter.push({
          id: String(hashStr(`${draft.week}-recruitment-${w.name}`)),
          week: draft.week,
          title: 'Recruitment',
          items,
        });

        toast.success(`${w.name} has joined your stable! (-${totalCost}g)`);
      });
    },
    [MAX_ROSTER, rosterFull, setState, deductFunds]
  );

  const handleScout = useCallback(
    (w: PoolWarrior) => {
      if (!deductFunds(25, `Scout Potential: ${w.name}`, 'other')) {
        toast.error('Not enough gold to scout potential (need 25g).');
        return;
      }
      setScoutedIds((s) => new Set(s).add(w.id));
      const report = revealRecruitPotential(w.id, store.week, w.potential);
      setScoutReports((prev) => ({ ...prev, [w.id]: report }));
      toast.success(`Scouted potential for ${w.name}! (-25g)`);
    },
    [deductFunds, store.week]
  );

  const handleRefresh = useCallback(() => {
    if (!deductFunds(REFRESH_COST, 'Pool refresh', 'other')) {
      toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
      return;
    }

    setState((draft: GameStore) => {
      const usedNames = new Set<string>();
      draft.roster.forEach((w: Warrior) => usedNames.add(w.name));
      draft.graveyard.forEach((w: Warrior) => usedNames.add(w.name));
      draft.retired.forEach((w: Warrior) => usedNames.add(w.name));
      (draft.rivals ?? []).forEach((r) => r.roster.forEach((w: Warrior) => usedNames.add(w.name)));

      const newPool = fullRefreshPool(draft.week, usedNames);
      draft.recruitPool = newPool;
      toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
    });
  }, [deductFunds, setState]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      if (rosterFull) {
        toast.error('Roster full!');
        return;
      }
      if (!deductFunds(CUSTOM_COST, `Custom Build: ${data.name}`, 'recruit')) {
        toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
        return;
      }

      setState((draft: GameStore) => {
        const rng = new SeededRNGService(draft.week + hashStr(data.name));
        const id = rng.uuid('warrior') as WarriorId;
        const warrior = makeWarrior(id, data.name, data.style, data.attributes);

        draft.roster.push(warrior);

        toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
        setTimeout(() => navigate({ to: `/warrior/${id}` }), 0);
      });
    },
    [setState, navigate, MAX_ROSTER, rosterFull, deductFunds]
  );

  const filteredPool = useMemo(() => {
    let pool = [...(recruitPool ?? [])];
    pool = pool.filter((w: PoolWarrior) => activeTiers.has(w.tier));
    if (activeStyle !== 'all') {
      pool = pool.filter((w: PoolWarrior) => w.style === activeStyle);
    }
    pool.sort((a: PoolWarrior, b: PoolWarrior) => {
      switch (sortBy) {
        case 'cost-asc':
          return a.cost - b.cost;
        case 'cost-desc':
          return b.cost - a.cost;
        case 'potential-desc':
          return potentialRating(b.potential) - potentialRating(a.potential);
        case 'age-asc':
          return a.age - b.age;
        default:
          return 0;
      }
    });
    return pool;
  }, [recruitPool, activeTiers, activeStyle, sortBy]);

  const toggleTier = (tier: RecruitTier) => {
    const next = new Set(activeTiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    setActiveTiers(next);
  };

  return (
    <PageFrame>
      <PageHeader
        title="Personnel Acquisition"
        subtitle="STABLE · CONTRACT_MARKET · Wk {week}"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Roster Capacity
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {roster.length} / {MAX_ROSTER}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Available Credits
              </span>
              <span className="text-sm font-display font-black text-arena-gold">{treasury}G</span>
            </div>
          </div>
        }
      />

      {rosterFull && (
        <Surface
          variant="glass"
          className="border-destructive/30 bg-destructive/5 p-6 mb-8 flex items-center gap-6"
        >
          <ImperialRing size="sm" variant="blood">
            <Shield className="h-4 w-4 text-destructive" />
          </ImperialRing>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
              Roster Capacity Exhausted
            </p>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest italic">
              Protocol: Decommission active assets before acquiring new recruits.
            </p>
          </div>
        </Surface>
      )}

      <Tabs defaultValue="scout" className="w-full space-y-12">
        <TabsList className="w-full h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none">
          <TabsTrigger
            value="scout"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Personnel Registry
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Custom Specification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scout" className="mt-0 focus-visible:outline-none">
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

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ImperialRing size="xs" variant="blood">
                    <Target className="h-3 w-3" />
                  </ImperialRing>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    Showing {filteredPool.length} of {recruitPool.length} Identified Candidates
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
                    />
                  ))}
                </div>
              ) : (
                <Surface
                  variant="glass"
                  className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Search className="h-8 w-8" />
                  </ImperialRing>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      Zero Results Detected
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                      Broaden filtering parameters or synchronize registry.
                    </p>
                  </div>
                </Surface>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-0 space-y-12 focus-visible:outline-none">
          <Surface
            variant="glass"
            className="p-8 border-primary/20 bg-primary/5 flex items-center gap-8"
          >
            <ImperialRing size="md" variant="blood">
              <Hammer className="h-5 w-5 text-primary" />
            </ImperialRing>
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none">
                Custom Specification Protocol
              </h3>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                Unit Cost: <span className="text-arena-gold font-display font-black">200G</span> ·
                Allocation: <span className="text-foreground font-black">66 Attribute Points</span>{' '}
                · Full tactical customization enabled.
              </p>
            </div>
          </Surface>

          <WarriorBuilder
            onCreateWarrior={handleCustomCreate}
            maxRoster={MAX_ROSTER}
            currentRosterSize={roster.length}
          />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
