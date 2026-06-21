import { useMemo } from 'react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Trophy,
  Star,
  Swords,
  Target,
  Zap,
  TrendingUp,
  User,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  calculateLeaderboardData,
  calculateBestByStyle,
  calculateRisingStars,
} from '@/engine/core/leaderboardCalculations';

interface LeaderboardProps {
  allFights: import('@/types/game').FightSummary[];
} /**
   * Gazette leaderboard.
   * @param - { all fights }.
   */

/**
 * Gazette leaderboard.
 * @param - { all fights }.
 */
export function GazetteLeaderboard({ allFights }: LeaderboardProps) {
  const leaderData = useMemo(() => calculateLeaderboardData(allFights), [allFights]);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="border-border/10 bg-neutral-900/40 overflow-hidden shadow-2xl relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Trophy className="h-48 w-48 text-primary" />
      </div>

      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-neutral-900/60 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Warrior Leaderboard
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Top Performers
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          Top 5
        </Badge>
      </div>

      <div className="overflow-x-auto relative z-10">
        <Table>
          <TableHeader className="bg-black/20">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8 py-4">
                Warrior
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">
                Style
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground/60 py-4">
                Record
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right text-muted-foreground/60 py-4">
                Win Rate
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8 py-4">
                Fame
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderData.map((w, idx) => (
              <TableRow
                key={w.name}
                className="border-white/5 group hover:bg-white/2 transition-colors"
              >
                <TableCell className="pl-8 py-5">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-black text-foreground/20">
                      #{idx + 1}
                    </span>
                    <span className="font-display font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
                      {w.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black border-white/5 bg-secondary/20 text-muted-foreground/80 uppercase tracking-widest px-3"
                  >
                    {w.style}
                  </Badge>
                </TableCell>
                <TableCell className="text-center py-5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-3 text-xs font-mono font-black">
                        <span className="text-arena-pop">{w.w}W</span>
                        <span className="text-foreground/10">/</span>
                        <span className="text-destructive/60">{w.l}L</span>
                        <span className="text-foreground/10">|</span>
                        <span className="text-arena-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.3)]">
                          {w.k}K
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                      Win / Loss / Kill Efficiency
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right py-5">
                  <span className="text-xs font-mono font-black text-primary/80 group-hover:text-primary transition-colors">
                    {(w.rate * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right pr-8 py-5">
                  <div className="flex items-center justify-end gap-2 text-sm font-mono font-black text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                    <span>{w.fame.toLocaleString()}</span>
                    <Star className="h-3.5 w-3.5 text-arena-gold opacity-60" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Surface>
  );
} /**
   * Best by style.
   * @param - { all fights }.
   */

/**
 * Best by style.
 * @param - { all fights }.
 */
export function BestByStyle({ allFights }: LeaderboardProps) {
  const styles = useMemo(
    () => ['Brawler', 'Technician', 'High-Flyer', 'Powerhouse', 'Grappler'],
    []
  );
  const bestData = useMemo(() => calculateBestByStyle(allFights, styles), [allFights, styles]);

  return (
    <Surface
      variant="glass"
      className="border-border/10 bg-neutral-900/40 relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Swords className="h-24 w-24 text-arena-gold" />
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-2.5 rounded-none bg-arena-gold/10 border border-arena-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <Zap className="h-5 w-5 text-arena-gold" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Best by Style
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Style Champions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {bestData.map((d) => (
          <Surface
            key={d.style}
            variant="paper"
            padding="sm"
            className="bg-white/[0.02] border-white/5 group hover:border-arena-gold/30 transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
                  {d.style}
                </span>
                <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-arena-gold transition-colors">
                  {d.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-arena-gold">
                  <span className="text-sm font-mono font-black">{d.wins}W</span>
                  <Target className="h-3 w-3 opacity-40" />
                </div>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </Surface>
  );
} /**
   * Rising stars.
   * @param - { all fights }.
   */

/**
 * Rising stars.
 * @param - { all fights }.
 */
export function RisingStars({ allFights }: LeaderboardProps) {
  const stars = useMemo(() => calculateRisingStars(allFights), [allFights]);

  return (
    <Surface
      variant="glass"
      className="border-border/10 bg-neutral-900/40 relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <TrendingUp className="h-24 w-24 text-primary" />
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Rising Stars
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            New Talent
          </p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {stars.length === 0 ? (
          <div className="py-12 text-center opacity-20 italic">
            <span className="text-[10px] uppercase tracking-widest">No record-breakers yet...</span>
          </div>
        ) : (
          stars.map((s) => (
            <Surface
              key={s.name}
              variant="paper"
              padding="sm"
              className="bg-primary/5 border border-primary/10 group hover:border-primary/40 transition-all"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-primary transition-colors">
                    {s.name}
                  </span>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                    Joined Week {s.firstWeek}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono font-black border-primary/20 bg-primary/10 text-primary"
                    >
                      {s.wins}-{s.matches - s.wins}
                    </Badge>
                    <ShieldCheck className="h-3 w-3 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </Surface>
          ))
        )}
      </div>
    </Surface>
  );
}
