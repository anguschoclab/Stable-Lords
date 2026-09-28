/**
 * Stable Lords — Hall of Fame & Graveyard
 * shows yearly accolades, global legends, and fallen warriors.
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Skull } from 'lucide-react';
import { useHallOfFame } from './hooks/useHallOfFame';
import { YearAwardsSection } from './components/YearAwardsSection';
import { AllTimeGreats } from './components/AllTimeGreats';
import { GraveyardTabs } from './components/GraveyardTabs';

/** Header stat pair: total fallen vs player-stable fallen. */
function FallenStats({
  graveyardCount,
  myFallenCount,
}: {
  graveyardCount: number;
  myFallenCount: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          Fallen
        </span>
        <span className="text-xl font-mono font-black text-destructive">{graveyardCount}</span>
      </div>
      <div className="w-px h-8 bg-border/20" />
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          My Fallen
        </span>
        <span className="text-xl font-mono font-black text-primary">{myFallenCount}</span>
      </div>
    </div>
  );
}

/**
 *
 */
export default function HallOfFame() {
  const {
    year,
    player,
    season,
    graveyard,
    myFallen,
    yearlyAwards,
    allTimeGreats,
    warriorById,
    allFights,
    getFightsForYear,
    getUpsetsForYear,
  } = useHallOfFame();

  return (
    <PageFrame className="space-y-8">
      <PageHeader
        icon={Crown}
        title="History"
        subtitle={`IMPERIAL · LEGENDS & FALLEN · YEAR ${year}`}
        actions={<FallenStats graveyardCount={graveyard.length} myFallenCount={myFallen.length} />}
      />

      <Tabs defaultValue="halloffame" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-none h-12 w-full sm:w-auto">
          <TabsTrigger
            value="halloffame"
            className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all motion-reduce:transition-none"
          >
            <Crown className="h-3.5 w-3.5" /> Hall of Fame
          </TabsTrigger>
          <TabsTrigger
            value="graveyard"
            className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-primary-foreground transition-all motion-reduce:transition-none"
          >
            <Skull className="h-3.5 w-3.5" /> Graveyard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="halloffame" className="mt-8 space-y-8">
          {yearlyAwards.length > 0 ? (
            yearlyAwards.map(({ year, awards }) => (
              <YearAwardsSection
                key={year}
                year={year}
                awards={awards}
                warriorById={warriorById}
                player={player}
                yearFights={getFightsForYear(year)}
                yearUpsets={getUpsetsForYear(year)}
              />
            ))
          ) : (
            <AllTimeGreats warriors={allTimeGreats} fights={allFights} />
          )}
        </TabsContent>

        <TabsContent value="graveyard" className="mt-8">
          <GraveyardTabs myFallen={myFallen} graveyard={graveyard} season={season} />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
