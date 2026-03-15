const fs = require('fs');

const path = 'src/pages/SeasonalAwards.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`/* ── Award Trophy Card ───────────────────────────────────── */

function AwardTrophy({ entry, title, icon, accent }: {
  entry: AwardEntry | null;
  title: string;
  icon: React.ReactNode;
  accent: string;
}) {
  if (!entry) return null;
  const winRate = (entry.wins + entry.losses) > 0
    ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100) : 0;

  return (
    <Card className={cn("relative overflow-hidden border-border/60", entry.isPlayer && "ring-1 ring-primary/30")}>
      <div className={cn("absolute top-0 left-0 right-0 h-1", accent)} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <p className="font-display font-bold text-sm">{entry.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {entry.style} · {entry.stableName}
                {entry.isPlayer && <span className="text-primary ml-1">(You)</span>}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono shrink-0">{title}</Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-base font-bold font-display">{entry.wins}</p>
            <p className="text-[9px] text-muted-foreground">Wins</p>
          </div>
          <div>
            <p className="text-base font-bold font-display text-destructive">{entry.kills}</p>
            <p className="text-[9px] text-muted-foreground">Kills</p>
          </div>
          <div>
            <p className="text-base font-bold font-display text-arena-fame">{entry.fameGained > 0 ? \`+\${entry.fameGained}\` : entry.fameGained}</p>
            <p className="text-[9px] text-muted-foreground">Fame</p>
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
`import AwardCard from "@/components/awards/AwardCard";`);

content = content.replace(
`<AwardTrophy
          entry={award.mvp}
          title="Season MVP"
          icon={<Crown className="h-5 w-5 text-arena-gold" />}
          accent="bg-arena-gold"
        />
        <AwardTrophy
          entry={award.deadliest}
          title="Deadliest"
          icon={<Skull className="h-5 w-5 text-destructive" />}
          accent="bg-destructive"
        />
        <AwardTrophy
          entry={award.ironWill}
          title="Iron Will"
          icon={<Shield className="h-5 w-5 text-primary" />}
          accent="bg-primary"
        />`,
`<AwardCard
          entry={award.mvp}
          title="Season MVP"
          icon={<Crown className="h-5 w-5 text-arena-gold" />}
          accentClass="bg-arena-gold"
        />
        <AwardCard
          entry={award.deadliest}
          title="Deadliest"
          icon={<Skull className="h-5 w-5 text-destructive" />}
          accentClass="bg-destructive"
        />
        <AwardCard
          entry={award.ironWill}
          title="Iron Will"
          icon={<Shield className="h-5 w-5 text-primary" />}
          accentClass="bg-primary"
        />`);

fs.writeFileSync(path, content, 'utf8');
console.log('patched');
