import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Skull } from 'lucide-react';
import { FallenGrid } from './FallenGrid';
import type { Warrior } from '@/types/game';

interface GraveyardTabsProps {
  myFallen: Warrior[];
  graveyard: Warrior[];
  season: string;
}

export function GraveyardTabs({ myFallen, graveyard, season }: GraveyardTabsProps) {
  return (
    <Tabs defaultValue="memorial" className="w-full">
      <TabsList className="bg-secondary/20 p-1 rounded-none h-10 w-full sm:w-auto mb-8">
        <TabsTrigger
          value="memorial"
          className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
        >
          <Zap className="h-3 w-3" /> My Fallen ({myFallen.length})
        </TabsTrigger>
        <TabsTrigger
          value="world"
          className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-primary-foreground transition-all"
        >
          <Skull className="h-3 w-3" /> World Cemetery ({graveyard.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="memorial">
        <FallenGrid
          warriors={myFallen}
          season={season}
          emptyTitle="The Soil is Unbroken"
          emptyDesc="None of your warriors have fallen... yet."
        />
      </TabsContent>
      <TabsContent value="world">
        <FallenGrid
          warriors={graveyard}
          season={season}
          emptyTitle="Sands of Peace"
          emptyDesc="No blood has been spilled in this realm."
        />
      </TabsContent>
    </Tabs>
  );
}
