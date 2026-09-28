import { Calendar, Coins, Crown, DollarSign, History, TrendingUp, Users } from 'lucide-react';
import type { Promoter, BoutOffer } from '@/types/state.types';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, type PersonalityConfig, type PromoterStats } from './config';

/** One headline stat card. */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
          {icon} {label}
        </div>
        <div className="text-2xl font-black font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}

/** Weekly capacity usage card with threshold-colored progress bar. */
function CapacityCard({ promoter, stats }: { promoter: Promoter; stats: PromoterStats }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase tracking-wider">Weekly Capacity Usage</span>
          <span
            className={`font-mono font-bold ${stats.capacityPercent >= 80 ? 'text-destructive' : stats.capacityPercent >= 50 ? 'text-arena-gold' : 'text-primary'}`}
          >
            {Math.round(stats.capacityPercent)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-none overflow-hidden">
          <div
            className={`h-full rounded-none transition-all duration-500 motion-reduce:transition-none ${
              stats.capacityPercent >= 80
                ? 'bg-destructive'
                : stats.capacityPercent >= 50
                  ? 'bg-arena-gold'
                  : 'bg-primary'
            }`}
            style={{ width: `${Math.min(stats.capacityPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {stats.capacityUsed} of {promoter.capacity} weekly bouts scheduled
        </p>
      </CardContent>
    </Card>
  );
}

/** Personality traits card: badges, age, style preferences. */
function PersonalityCard({
  promoter,
  personality,
}: {
  promoter: Promoter;
  personality: PersonalityConfig;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          {personality.icon} {personality.label} Traits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {personality.traits.map((trait, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {trait}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">Age</span>
            <div className="font-mono font-bold">{promoter.age} years</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">Style Preferences</span>
            <div className="font-medium">
              {promoter.biases.length > 0
                ? promoter.biases.map((s) => STYLE_DISPLAY_NAMES[s]).join(', ')
                : 'No preferences'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Overview tab: headline stats, weekly capacity bar, personality traits. */
export function OverviewTab({
  promoter,
  stats,
  personality,
}: {
  promoter: Promoter;
  stats: PromoterStats;
  personality: PersonalityConfig;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Coins className="h-3 w-3" />} label="Avg Purse" value={formatNumber(stats.avgPurse)} />
        <StatCard icon={<TrendingUp className="h-3 w-3" />} label="Total Hype" value={formatNumber(stats.totalHype)} />
        <StatCard icon={<Calendar className="h-3 w-3" />} label="This Week" value={`${stats.thisWeekActive}/${promoter.capacity}`} />
        <StatCard icon={<Users className="h-3 w-3" />} label="Total Offers" value={stats.totalOffers} />
      </div>
      <CapacityCard promoter={promoter} stats={stats} />
      <PersonalityCard promoter={promoter} personality={personality} />
    </div>
  );
}

/** History tab: legacy fame, purse paid, notable-bout count, mentor. */
export function HistoryTab({ promoter }: { promoter: Promoter }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-arena-fame/5 to-transparent">
          <CardContent className="p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <Crown className="h-3 w-3" /> Legacy Fame
            </div>
            <div className="text-2xl font-black font-mono">{promoter.history.legacyFame}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-arena-gold/5 to-transparent">
          <CardContent className="p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Purse Paid
            </div>
            <div className="text-2xl font-black font-mono">
              {formatNumber(promoter.history.totalPursePaid)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <History className="h-3 w-3" /> Notable Bouts
            </div>
            <div className="text-2xl font-black font-mono">
              {promoter.history.notableBouts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {promoter.history.mentorId && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-bold">Mentor:</span> {promoter.history.mentorId}
            </div>
          </CardContent>
        </Card>
      )}

      {promoter.history.notableBouts.length === 0 && (
        <Card className="p-8 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-bold uppercase tracking-wider">No Notable Bouts</p>
          <p className="text-sm text-muted-foreground mt-2">
            This promoter hasn't hosted any legendary matches yet.
          </p>
        </Card>
      )}
    </div>
  );
}

/** Active Offers tab: this promoter's pending/signed bout offers. */
export function OffersTab({ offers }: { offers: BoutOffer[] }) {
  return (
    <div className="space-y-4">
      {offers.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-bold uppercase tracking-wider">No Active Offers</p>
          <p className="text-sm text-muted-foreground mt-2">
            This promoter has no pending or signed bout offers.
          </p>
        </Card>
      ) : (
        offers.map((offer) => (
          <Card key={offer.id} className={offer.status === 'Signed' ? 'border-primary/30' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{offer.id}</span>
                    <Badge
                      variant={offer.status === 'Signed' ? 'default' : 'outline'}
                      className="text-[10px]"
                    >
                      {offer.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Week {offer.boutWeek} • Expires Week {offer.expirationWeek || 0}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono font-bold">{formatNumber(offer.purse)} gold</div>
                  <div className="text-xs text-muted-foreground">{offer.hype} hype</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Warriors ({offer.warriorIds.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {offer.warriorIds.map((wid) => (
                    <Badge key={wid} variant="secondary" className="text-[10px]">
                      {wid.slice(0, 8)}...
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
