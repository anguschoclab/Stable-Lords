import { Building2, DollarSign, History, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import type { PromoterPersonality } from '@/types/state.types';

/** Aggregated totals across all promoters shown in the directory. */
export interface PromoterDirectoryStats {
  totalPromoters: number;
  totalPurse: number;
  totalNotableBouts: number;
  totalCapacity: number;
  totalActiveOffers: number;
}

/** Aggregate stat cards across all promoters. */
export function DirectoryStatsGrid({ stats }: { stats: PromoterDirectoryStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Promoters
          </div>
          <div className="text-2xl font-black font-mono">{stats.totalPromoters}</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-arena-gold/5 to-transparent">
        <CardContent className="p-4 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Total Purse Paid
          </div>
          <div className="text-2xl font-black font-mono">{stats.totalPurse.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-arena-fame/5 to-transparent">
        <CardContent className="p-4 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
            <History className="h-3 w-3" /> Notable Bouts
          </div>
          <div className="text-2xl font-black font-mono">{stats.totalNotableBouts}</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-arena-pop/5 to-transparent">
        <CardContent className="p-4 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
            <Users className="h-3 w-3" /> Total Capacity
          </div>
          <div className="text-2xl font-black font-mono">
            {stats.totalActiveOffers}/{stats.totalCapacity}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Personality legend for the promoter directory. */
export function PersonalityGuide() {
  return (
    <div className="mb-6 p-4 border border-border/50 rounded-none bg-muted/20">
      <h3 className="text-[11px] uppercase tracking-wider font-bold mb-3 text-muted-foreground">
        Personality Guide
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(Object.keys(PERSONALITY_CONFIG) as PromoterPersonality[]).map((p) => (
          <div
            key={p}
            className={`p-2 rounded border text-[10px] space-y-1 ${PERSONALITY_CONFIG[p].color}`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {PERSONALITY_CONFIG[p].icon}
              {PERSONALITY_CONFIG[p].label}
            </div>
            <div className="opacity-80 leading-tight text-[9px]">
              {PERSONALITY_CONFIG[p].description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
