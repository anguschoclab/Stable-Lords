import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, type Attributes } from '@/types/game';
import { BASE_ROSTER_CAP } from '@/data/constants';
import { makeWarrior } from '@/engine/factories';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { hashStr } from '@/utils/random';
import {
  generateRecruitPool,
  fullRefreshPool,
  type PoolWarrior,
  type RecruitTier,
  TIER_COST,
  TIER_STARS,
  REFRESH_COST,
} from '@/engine/recruitment';
import { canTransact } from '@/utils/economyUtils';
import { potentialRating, potentialGrade } from '@/engine/potential';
import { revealRecruitPotential, type PotentialScoutReport } from '@/engine/recruitScouting';
import WarriorBuilder from '@/components/WarriorBuilder';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  RefreshCw,
  Hammer,
  Search,
  Heart,
  Zap,
  Users,
  Eye,
  Clock,
  Quote,
  Star,
  Coins,
  Shield,
  Target,
  Sword,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
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

const TIER_CONFIG: Record<RecruitTier, { border: string; text: string; bg: string; ring: "bronze" | "silver" | "gold" | "blood" }> = {
  Common: { border: 'border-white/10', text: 'text-muted-foreground', bg: 'bg-white/5', ring: 'bronze' },
  Promising: { border: 'border-white/20', text: 'text-foreground', bg: 'bg-white/10', ring: 'silver' },
  Exceptional: { border: 'border-primary/30', text: 'text-primary', bg: 'bg-primary/5', ring: 'blood' },
  Prodigy: { border: 'border-arena-gold/30', text: 'text-arena-gold', bg: 'bg-arena-gold/5', ring: 'gold' },
};

function TierBadge({ tier }: { tier: RecruitTier }) {
  const stars = TIER_STARS[tier];
  const config = TIER_CONFIG[tier];
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[9px] gap-1.5 font-black uppercase tracking-[0.2em] px-3 py-1 rounded-none border-white/10",
        config.text
      )}
    >
      {stars > 0 && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="h-2 w-2 fill-current" />
          ))}
        </div>
      )}
      {tier}
    </Badge>
  );
}

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClass = value >= 16 ? "bg-primary" : value >= 12 ? "bg-arena-gold" : "bg-white/20";
  
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black uppercase text-muted-foreground/40 w-8 tracking-tighter">
        {label.slice(0, 3)}
      </span>
      <div className="flex-1 h-1 bg-white/5 rounded-none overflow-hidden relative">
        <div
          className={cn("h-full transition-all duration-1000 ease-out", colorClass)}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold Markers */}
        <div className="absolute top-0 left-[60%] w-px h-full bg-white/10" />
        <div className="absolute top-0 left-[80%] w-px h-full bg-white/10" />
      </div>
      <span className="text-[11px] font-display font-black w-6 text-right text-foreground">
        {value}
      </span>
    </div>
  );
}

function RecruitCard({
  warrior,
  canAfford,
  rosterFull,
  onRecruit,
  isScouted,
  onScout,
  canAffordScout,
  canAffordBonus,
  scoutReport,
}: {
  warrior: PoolWarrior;
  canAfford: boolean;
  rosterFull: boolean;
  onRecruit: (w: PoolWarrior, bonus?: boolean) => void;
  isScouted: boolean;
  onScout: (w: PoolWarrior) => void;
  canAffordScout: boolean;
  canAffordBonus: boolean;
  scoutReport?: PotentialScoutReport;
}) {
  const grade = potentialGrade(potentialRating(warrior.potential));
  const config = TIER_CONFIG[warrior.tier];

  return (
    <Surface
      variant="glass"
      className="group p-0 border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden"
    >
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <ImperialRing size="md" variant={config.ring}>
              <Sword className={cn("h-5 w-5", config.text)} />
            </ImperialRing>
            <div>
              <h3 className="text-xl font-display font-black uppercase tracking-tight text-foreground leading-none mb-2">
                {warrior.name}
              </h3>
              <div className="flex items-center gap-4">
                <StatBadge styleName={warrior.style} showFullName />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                  Age {warrior.age}
                </span>
              </div>
            </div>
          </div>
          <TierBadge tier={warrior.tier} />
        </div>

        {/* Intelligence Overlay */}
        {isScouted ? (
          <div className="bg-primary/5 border border-primary/20 p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Synchronized</span>
              </div>
              <Badge className="bg-primary text-primary-foreground font-black text-[10px] rounded-none px-3">
                POTENTIAL: {grade}
              </Badge>
            </div>
            {scoutReport && (
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                "{scoutReport.summary}"
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 p-6 flex items-center justify-between group/scout">
            <div className="flex items-center gap-3 opacity-40">
              <Info className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Personnel Intel Redacted</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[9px] font-black uppercase tracking-widest border-white/10 hover:border-primary/50 transition-all rounded-none"
              disabled={!canAffordScout}
              onClick={() => onScout(warrior)}
            >
              Scout Profile [25G]
            </Button>
          </div>
        )}

        {/* Attributes Grid */}
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-4 bg-white/[0.01] border border-white/5 p-6">
            {ATTRIBUTE_KEYS.map((key) => (
              <StatBar key={key} label={key} value={warrior.attributes[key]} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Health Capacity</span>
              <div className="flex items-center gap-3">
                <Heart className="h-3.5 w-3.5 text-destructive" />
                <span className="text-lg font-display font-black text-foreground">{warrior.derivedStats.hp}</span>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Endurance Pool</span>
              <div className="flex items-center gap-3">
                <Zap className="h-3.5 w-3.5 text-arena-fame" />
                <span className="text-lg font-display font-black text-foreground">{warrior.derivedStats.endurance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lore / Quote */}
        <div className="relative pl-6 border-l border-white/10">
          <Quote className="absolute -left-1 top-0 h-4 w-4 text-white/5" />
          <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed">
            {warrior.lore}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 pt-8 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Contract Value</span>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-arena-gold" />
              <span className="text-2xl font-display font-black text-arena-gold">{warrior.cost}G</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="flex-1 sm:flex-none h-14 px-8 bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-[0.2em] rounded-none hover:shadow-[0_0_25px_rgba(135,34,40,0.4)] transition-all"
              disabled={!canAfford || rosterFull}
              onClick={() => onRecruit(warrior, false)}
            >
              <UserPlus className="h-4 w-4 mr-3" />
              Contract Secure
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-14 px-6 border-arena-gold/30 text-arena-gold font-black uppercase text-[10px] tracking-widest rounded-none hover:bg-arena-gold/5 transition-all"
              disabled={!canAffordBonus || rosterFull}
              onClick={() => onRecruit(warrior, true)}
              title="Pay a 50g signing bonus — warrior arrives eager (+2 XP) and gets a gazette mention."
            >
              + Bonus [50G]
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}

export default function Recruit() {
  const store = useGameStore();
  const { roster, treasury, rosterBonus, recruitPool, setState } = store;

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
      setState((draft: GameStore) => {
        const BONUS_COST = 50;
        const totalCost = w.cost + (bonus ? BONUS_COST : 0);
        if (!canTransact(draft.treasury, totalCost)) {
          toast.error(`Not enough funds! Need ${totalCost}g.`);
          return;
        }
        if (draft.roster.length >= MAX_ROSTER) {
          toast.error('Roster full! Retire or release a warrior first.');
          return;
        }

        // 1.0 Deterministic ID: Recruitment uses hash-based seed for bit-identity
        const recruitRng = new SeededRNGService(draft.week + hashStr(w.name));
        const warrior = makeWarrior(
          recruitRng.uuid('warrior') as any,
          w.name,
          w.style,
          w.attributes,
          { age: w.age, potential: w.potential }
        );

        // Signing bonus perk — +2 XP and an "Eager" flair tag.
        if (bonus) {
          (warrior as any).xp = ((warrior as any).xp ?? 0) + 2;
          const tags = (warrior as any).tags ?? (warrior as any).flair ?? [];
          (warrior as any).tags = [...tags, 'Eager'];
        }

        draft.roster.push(warrior);
        draft.treasury -= totalCost;
        draft.recruitPool = (draft.recruitPool ?? []).filter((p: PoolWarrior) => p.id !== w.id);

        draft.ledger.push({
          id: String(hashStr(`${draft.week}-${w.name}`)),
          week: draft.week,
          label: `Recruit: ${w.name} (${w.tier})${bonus ? ' + signing bonus' : ''}`,
          amount: -totalCost,
          category: 'recruit',
        });

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
    [MAX_ROSTER, setState]
  );

  const handleScout = useCallback(
    (w: PoolWarrior) => {
      setState((draft: GameStore) => {
        if (!canTransact(draft.treasury, 25)) {
          toast.error('Not enough gold to scout potential (need 25g).');
          return;
        }
        setScoutedIds((s) => new Set(s).add(w.id));
        // Deterministic partial reveal — same (recruit, week) always yields the
        // same subset, so save/load doesn't shuffle the intel.
        const report = revealRecruitPotential(w.id, draft.week, w.potential);
        setScoutReports((prev) => ({ ...prev, [w.id]: report }));
        draft.treasury -= 25;
        draft.ledger.push({
          id: String(hashStr(`${draft.week}-scout-${w.name}`)),
          week: draft.week,
          label: `Scout Potential: ${w.name}`,
          amount: -25,
          category: 'other',
        });
        toast.success(`Scouted potential for ${w.name}! (-25g)`);
      });
    },
    [setState]
  );

  const handleRefresh = useCallback(() => {
    setState((draft: GameStore) => {
      if (!canTransact(draft.treasury, REFRESH_COST)) {
        toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
        return;
      }

      // ⚡ Bolt: Moving name collection inside the callback to avoid per-render overhead.
      // We use a single-pass loop approach to avoid intermediate array allocations (O(N) vs O(N*M)).
      const usedNames = new Set<string>();
      draft.roster.forEach((w: any) => usedNames.add(w.name));
      draft.graveyard.forEach((w: any) => usedNames.add(w.name));
      draft.retired.forEach((w: any) => usedNames.add(w.name));
      (draft.rivals ?? []).forEach((r: any) => r.roster.forEach((w: any) => usedNames.add(w.name)));

      const newPool = fullRefreshPool(draft.week, usedNames);
      draft.treasury -= REFRESH_COST;
      draft.recruitPool = newPool;
      draft.ledger.push({
        id: String(hashStr(`${draft.week}-pool-refresh`)),
        week: draft.week,
        label: 'Pool refresh',
        amount: -REFRESH_COST,
        category: 'other',
      });
      toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
    });
  }, [setState]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      setState((draft: GameStore) => {
        if (!canTransact(draft.treasury, CUSTOM_COST)) {
          toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
          return;
        }
        if (draft.roster.length >= MAX_ROSTER) {
          toast.error('Roster full!');
          return;
        }
        const rng = new SeededRNGService(draft.week + hashStr(data.name));
        const id = rng.uuid('warrior');
        const warrior = makeWarrior(id, data.name, data.style, data.attributes);

        draft.roster.push(warrior);
        draft.treasury -= CUSTOM_COST;
        draft.ledger.push({
          id: String(hashStr(`${draft.week}-custom-${data.name}`)),
          week: draft.week,
          label: `Custom Build: ${data.name}`,
          amount: -CUSTOM_COST,
          category: 'recruit',
        });

        toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
        setTimeout(() => navigate({ to: `/warrior/${id}` }), 0);
      });
    },
    [setState, navigate, MAX_ROSTER]
  );

  const filteredPool = useMemo(() => {
    let pool = [...(recruitPool ?? [])];

    // Filter by Tier
    pool = pool.filter((w: PoolWarrior) => activeTiers.has(w.tier));

    // Filter by Style
    if (activeStyle !== 'all') {
      pool = pool.filter((w: PoolWarrior) => w.style === activeStyle);
    }

    // Sort
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
    <div className="space-y-4">
      <PageHeader
        icon={UserPlus}
        title="Recruit Warriors"
        subtitle="STABLE · RECRUITMENT · CONTRACT MARKET"
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 font-mono">
              <Users className="h-3 w-3" />
              {roster.length}/{MAX_ROSTER}
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-mono">
              <Coins className="h-3 w-3 text-arena-gold" />
              {treasury}g
            </Badge>
          </div>
        }
      />

      {rosterFull && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Roster full! Retire or release a warrior before recruiting.
        </div>
      )}

      <Tabs defaultValue="scout" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="scout" className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Scout Pool
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5">
            <Hammer className="h-3.5 w-3.5" />
            Custom Build
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scout" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Archetype B: Left Filter Sidebar (span-3) */}
            <aside className="lg:col-span-3 space-y-6 sticky top-6">
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  FILTER ENGINE
                </span>
              </div>

              <Surface variant="glass" className="space-y-6">
                {/* Tiers */}
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Market Tiers
                  </label>
                  <div className="space-y-3">
                    {(['Common', 'Promising', 'Exceptional', 'Prodigy'] as RecruitTier[]).map(
                      (tier) => {
                        const isActive = activeTiers.has(tier);
                        return (
                          <button
                            key={tier}
                            onClick={() => toggleTier(tier)}
                            className={cn(
                              'w-full flex items-center justify-between p-2 border transition-all',
                              isActive
                                ? 'bg-white/[0.05] border-white/20'
                                : 'bg-transparent border-transparent opacity-40 grayscale hover:grayscale-0 hover:opacity-100'
                            )}
                          >
                            <TierBadge tier={tier} />
                            <span className="font-mono text-[10px] text-arena-gold">
                              {TIER_COST[tier]}g
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Style */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Combat Style
                  </label>
                  <Select value={activeStyle} onValueChange={(v) => setActiveStyle(v as any)}>
                    <SelectTrigger className="h-9 text-[10px] uppercase font-black tracking-widest bg-black/20 border-white/10">
                      <SelectValue placeholder="All Styles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ALL_STYLES</SelectItem>
                      {Object.entries(STYLE_DISPLAY_NAMES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Sequence Order
                  </label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-9 text-[10px] uppercase font-black tracking-widest bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="potential-desc">POTENTIAL_DESC</SelectItem>
                      <SelectItem value="cost-asc">COST_ASCENDING</SelectItem>
                      <SelectItem value="cost-desc">COST_DESCENDING</SelectItem>
                      <SelectItem value="age-asc">AGE_ASCENDING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refresh */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Temporal Refresh
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-10 px-4 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 transition-colors"
                    onClick={handleRefresh}
                    disabled={!canRefresh}
                  >
                    <span>REFRESH_LIST</span>
                    <div className="flex items-center gap-1.5 text-arena-gold">
                      <Coins className="h-3 w-3" />
                      {REFRESH_COST}g
                    </div>
                  </Button>
                </div>
              </Surface>
            </aside>

            {/* Right Result Grid (span-9) */}
            <main className="lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {filteredPool.length} Profiles_Match_Criteria / {recruitPool.length} TOTAL
                </p>
              </div>

              {filteredPool.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
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
                <Surface variant="glass" className="py-48 text-center border-dashed opacity-50">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="font-display font-black uppercase tracking-widest text-sm text-muted-foreground/30">
                    NO MATCHES DETECTED
                  </p>
                </Surface>
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-8 space-y-4">
          <div className="rounded-none border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
            <Hammer className="h-4 w-4 inline mr-1.5" />
            Custom warriors cost{' '}
            <span className="font-semibold text-foreground">{CUSTOM_COST}g</span> and start with 66
            total attribute points. You choose the distribution.
            {!canTransact(treasury, CUSTOM_COST) && (
              <span className="text-destructive ml-1">(Need {CUSTOM_COST - treasury}g more)</span>
            )}
          </div>
          <WarriorBuilder
            onCreateWarrior={handleCustomCreate}
            maxRoster={MAX_ROSTER}
            currentRosterSize={roster.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
