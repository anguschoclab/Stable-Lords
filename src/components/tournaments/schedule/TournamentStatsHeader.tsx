import { Card, CardContent } from '@/components/ui/card';
import { Swords, Trophy, Clock, Users } from 'lucide-react';

interface TournamentStatsHeaderProps {
  stats: { total: number; completed: number; byes: number; upcoming: number };
}

/**
 *
 */
export function TournamentStatsHeader({ stats }: TournamentStatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
            <Swords className="h-3.5 w-3.5" /> Total
          </div>
          <div className="text-xl font-black font-mono mt-1">{stats.total}</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
            <Trophy className="h-3.5 w-3.5" /> Completed
          </div>
          <div className="text-xl font-black font-mono mt-1 text-primary">{stats.completed}</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-arena-gold/5 to-transparent">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
            <Clock className="h-3.5 w-3.5" /> Pending
          </div>
          <div className="text-xl font-black font-mono mt-1 text-arena-gold">{stats.upcoming}</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-muted-foreground/5 to-transparent">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
            <Users className="h-3.5 w-3.5" /> Byes
          </div>
          <div className="text-xl font-black font-mono mt-1 text-muted-foreground">
            {stats.byes}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
