/**
 * Weekly Digest Dashboard Widget
 * Summary of weekly events, match results, and upcoming bouts
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingDown, Swords, Trophy, ChevronRight, Flame, Target } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { FightSummary, WarriorId } from '@/types/game';
import type { BoutOffer } from '@/types/state.types';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useDigestSummary } from '@/hooks/useDigestSummary';
import { StatBox, AlertBox, EmptyDigestState } from './digest';

/**
 *
 */
export interface WeeklyDigestProps {
  week: number;
  season: string;
  arenaHistory: FightSummary[];
  boutOffers: Record<string, BoutOffer>;
  currentWeek: number;
}

/**
 *
 */
export function WeeklyDigestWidget({
  week,
  season,
  arenaHistory,
  boutOffers,
  currentWeek,
}: WeeklyDigestProps) {
  const playerWarriorIds = useGameStore(
    useShallow((s) => new Set<WarriorId>(s.roster.map((w) => w.id)))
  );

  const summary = useDigestSummary({
    arenaHistory,
    boutOffers,
    currentWeek,
    playerWarriorIds,
  });

  const hasActivity =
    summary.totalFights > 0 || summary.pendingOffers > 0 || summary.signedOffers > 0;

  if (!hasActivity) {
    return <EmptyDigestState week={week} season={season} />;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-black uppercase tracking-wider">
              Week {week} Digest — {season}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {summary.totalFights} Fights
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <StatBox
            icon={<Trophy className="h-3.5 w-3.5" />}
            label="Wins"
            value={summary.wins}
            color="primary"
          />
          <StatBox
            icon={<TrendingDown className="h-3.5 w-3.5" />}
            label="Losses"
            value={summary.losses}
            color="destructive"
          />
          <StatBox
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Kills"
            value={summary.kills}
            color="arena-gold"
          />
          <StatBox
            icon={<Swords className="h-3.5 w-3.5" />}
            label="Upcoming"
            value={summary.upcomingBouts}
            color="accent"
          />
        </div>

        {/* Alerts Section */}
        {(summary.deaths > 0 || summary.pendingOffers > 0) && (
          <div className="space-y-2">
            {summary.deaths > 0 && (
              <AlertBox
                type="death"
                message={`${summary.deaths} warrior${summary.deaths > 1 ? 's' : ''} lost this week`}
              />
            )}
            {summary.pendingOffers > 0 && (
              <AlertBox
                type="offer"
                message={`${summary.pendingOffers} bout offer${summary.pendingOffers > 1 ? 's' : ''} awaiting response`}
              />
            )}
          </div>
        )}

        {/* This Week's Schedule */}
        {summary.signedOffers > 0 && (
          <div className="p-3 bg-secondary/30 rounded-none">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Target className="h-3.5 w-3.5" />
              <span className="font-bold uppercase">Scheduled This Week</span>
            </div>
            <p className="text-sm">
              <span className="font-bold text-primary">{summary.signedOffers}</span> bout
              {summary.signedOffers > 1 ? 's' : ''} scheduled for Week {week}
            </p>
            <Link to="/stable/bouts">
              <Button variant="ghost" size="sm" className="mt-2 h-7 text-[10px] uppercase">
                View Schedule <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
