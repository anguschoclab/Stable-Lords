const fs = require('fs');

const path = 'src/pages/TournamentAwards.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert import if not there
if (!content.includes('import AwardCard from "@/components/awards/AwardCard"')) {
    content = content.replace(
`import { useGame } from "@/state/GameContext";`,
`import { useGame } from "@/state/GameContext";
import AwardCard from "@/components/awards/AwardCard";`
    );
}

// Remove AwardCard definition
content = content.replace(
`function AwardCard({ entry, title, icon, accentClass }: {
  entry: WarriorStat | null;
  title: string;
  icon: React.ReactNode;
  accentClass: string;
}) {
  if (!entry) return null;
  const winRate = (entry.wins + entry.losses) > 0
    ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100) : 0;

  return (
    <Card className={cn("relative overflow-hidden", entry.isPlayer && "ring-1 ring-primary/30")}>
      <div className={cn("absolute top-0 left-0 right-0 h-1", accentClass)} />
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <p className="font-display font-bold text-sm">{entry.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {entry.style}
                {entry.isPlayer && <span className="text-primary ml-1">(You)</span>}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono shrink-0">{title}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-base font-bold font-display">{entry.wins}</p>
            <p className="text-[9px] text-muted-foreground">Wins</p>
          </div>
          <div>
            <p className="text-base font-bold font-display text-destructive">{entry.kills}</p>
            <p className="text-[9px] text-muted-foreground">Kills</p>
          </div>
          <div>
            <p className="text-base font-bold font-display">{winRate}%</p>
            <p className="text-[9px] text-muted-foreground">Win%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}`,
``);

fs.writeFileSync(path, content, 'utf8');
console.log('patched');
