import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { cn } from '@/lib/utils';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/game';
import { type RecruitTier, TIER_COST, REFRESH_COST } from '@/engine/recruitment';
import { TIER_CONFIG } from '@/components/stable/RecruitCard';
import { RefreshCw, Coins } from 'lucide-react';

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

export function RecruitFilters({
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
