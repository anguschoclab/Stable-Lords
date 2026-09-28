import { Link } from '@tanstack/react-router';
import { Trophy, Swords, Skull, ScrollText, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WarriorLink } from '@/components/EntityLink';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import type { FightSummary } from '@/types/state.types';
import type { HallEntry } from '@/types/state.types';

interface StyleStatRow {
  style: string;
  wins: number;
  losses: number;
  kills: number;
  fights: number;
  winRate: number;
}

/** Splits a fight title ("A vs B (context)") into display names. */
function fightNames(title: string): [string, string] {
  const n = (title.split(' (')[0] ?? '').split(' vs ');
  return [n[0] || 'Unknown', n[1] || 'Unknown'];
}

/** Fight Log tab — recent fights grouped by week. */
export function FightLogTab({
  fightsByWeek,
}: {
  fightsByWeek: [number, FightSummary[]][];
}) {
  if (fightsByWeek.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <ScrollText className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No fights recorded yet. Run some rounds to fill the archives.
          </p>
          <Link to="/stable/arena">
            <Button variant="outline" className="gap-2 mt-2">
              <Zap className="h-4 w-4" /> Run a Round
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      {fightsByWeek.map(([week, fights]) => (
        <Card key={week}>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm text-muted-foreground">
              Week {week}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fights.map((f) => {
              const isKill = f.by === 'Kill';
              const isKO = f.by === 'KO';
              const [nameA, nameD] = fightNames(f.title);
              return (
                <div
                  key={f.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isKill ? (
                      <Skull className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <Swords className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <WarriorLink name={nameA} className="text-sm font-medium" />
                    <span className="text-xs text-muted-foreground">vs</span>
                    <WarriorLink name={nameD} className="text-sm font-medium" />
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 ml-6 sm:ml-0 flex-wrap">
                    {f.flashyTags?.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                    <Badge
                      variant={isKill ? 'destructive' : isKO ? 'default' : 'outline'}
                      className="text-xs whitespace-nowrap"
                    >
                      {f.winner ? `${f.winner === 'A' ? nameA : nameD} — ${f.by}` : 'Draw'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/** Legends tab — Hall of Fame entries resolved to their fight summaries. */
export function LegendsTab({
  hallEntries,
  fightMap,
}: {
  hallEntries: HallEntry[];
  fightMap: Map<string, FightSummary>;
}) {
  if (hallEntries.length === 0) {
    return <p className="text-muted-foreground italic">No legendary fights recorded yet.</p>;
  }
  return (
    <>
      {hallEntries.map((h) => {
        const f = fightMap.get(h.fightId);
        if (!f) return null;
        const [nameA, nameD] = fightNames(f.title);
        return (
          <Card key={`${h.fightId}_${h.label}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-arena-gold" />
                  <span className="font-display font-semibold text-sm">{h.label}</span>
                  <Badge variant="outline" className="text-xs">
                    Week {h.week}
                  </Badge>
                </div>
              </div>
              <div className="text-sm">
                <WarriorLink name={nameA} className="font-medium" />
                {' vs '}
                <WarriorLink name={nameD} className="font-medium" />
                {f.by && ` — ${f.winner === 'A' ? nameA : nameD} by ${f.by}`}
              </div>
              {f.flashyTags && f.flashyTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {f.flashyTags.map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

/** Style Stats tab — all-history win/loss/kill table per fighting style. */
export function StyleStatsTab({ styleStats }: { styleStats: StyleStatRow[] }) {
  if (styleStats.length === 0) {
    return <p className="text-muted-foreground italic">No data yet.</p>;
  }
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Style</th>
                <th className="px-4 py-3 font-medium text-right">Fights</th>
                <th className="px-4 py-3 font-medium text-right">Wins</th>
                <th className="px-4 py-3 font-medium text-right">Losses</th>
                <th className="px-4 py-3 font-medium text-right">Kills</th>
                <th className="px-4 py-3 font-medium text-right">Win %</th>
              </tr>
            </thead>
            <tbody>
              {styleStats.map((s) => (
                <tr key={s.style} className="border-t border-border">
                  <td className="px-4 py-2.5 font-medium">
                    {STYLE_DISPLAY_NAMES[s.style as keyof typeof STYLE_DISPLAY_NAMES] ??
                      s.style}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{s.fights}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-arena-pop">
                    {s.wins}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-destructive">
                    {s.losses}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{s.kills}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">
                    {s.winRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
