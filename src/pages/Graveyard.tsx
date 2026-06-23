/**
 * Stable Lords — Graveyard & Retired Warriors
 */
import { useGameStore } from '@/state/useGameStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skull, Zap } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import { VirtualizedFallenGrid } from '@/components/fallen/VirtualizedFallenGrid'; /**
 * Graveyard.
 */

/**
 * Graveyard.
 */
export default function Graveyard() {
  const { graveyard, player, season } = useGameStore();

  const myFallen = graveyard.filter((w) => w.stableId === player.id);
  const worldFallen = graveyard;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        icon={Skull}
        title="The Graveyard"
        subtitle="FALLEN WARRIORS"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                WORLD FALLEN
              </span>
              <span className="text-2xl font-mono font-black text-destructive">
                {worldFallen.length}
              </span>
            </div>
            <Separator orientation="vertical" className="h-10 bg-border/20" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                STABLE MEMORIAL
              </span>
              <span className="text-2xl font-mono font-black text-primary">{myFallen.length}</span>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="memorial" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-none h-12">
          <TabsTrigger
            value="memorial"
            className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <Zap className="h-3.5 w-3.5" /> Private Memorial
          </TabsTrigger>
          <TabsTrigger
            value="world"
            className="flex-1 rounded-none gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-primary-foreground transition-all"
          >
            <Skull className="h-3.5 w-3.5" /> World Cemetery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memorial" className="mt-8">
          <VirtualizedFallenGrid
            warriors={myFallen}
            season={season}
            emptyTitle="The Soil is Unbroken"
            emptyDesc="None of your warriors have fallen... yet."
          />
        </TabsContent>

        <TabsContent value="world" className="mt-8">
          <VirtualizedFallenGrid
            warriors={worldFallen}
            season={season}
            emptyTitle="Sands of Peace"
            emptyDesc="No blood has been spilled in this realm."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Separator = ({
  className,
  orientation = 'horizontal',
}: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) => (
  <div
    className={cn(
      'bg-border shrink-0',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )}
  />
);
