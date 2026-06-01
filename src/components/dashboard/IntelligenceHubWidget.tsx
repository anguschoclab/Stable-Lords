import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { Send } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentReasoningWidget } from './AgentReasoningWidget';
import { IntelligenceHubHeader } from './IntelligenceHubHeader';
import { GazetteTab } from './GazetteTab';
import { BriefingTab } from './BriefingTab';
import { IntelligenceHubFooter } from './IntelligenceHubFooter';
import type { RivalStableData } from '@/types/state.types';

export function IntelligenceHubWidget() {
  const state = useWorldState();

  const recentGazettes = useMemo(() => {
    return (state.gazettes || []).slice(-5).reverse();
  }, [state.gazettes]);

  const recentNewsletter = useMemo(() => {
    return (state.newsletter || []).slice(-5).reverse();
  }, [state.newsletter]);

  const totalCommCount = recentGazettes.length + recentNewsletter.length;

  return (
    <Surface
      variant="glass"
      padding="none"
      className="h-full border-border/10 group overflow-hidden relative flex flex-col shadow-2xl md:col-span-2"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Send className="h-48 w-48 text-primary" />
      </div>

      <IntelligenceHubHeader totalCommCount={totalCommCount} />

      <div className="p-0 flex-1 relative z-10 overflow-hidden">
        <Tabs defaultValue="gazette" className="h-full flex flex-col">
          <div className="px-6 border-b border-white/5 bg-black/20">
            <TabsList className="bg-transparent border-none gap-6 h-10">
              <TabsTrigger
                value="gazette"
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 data-[state=active]:text-primary data-[state=active]:shadow-none relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                Gazette Feed
              </TabsTrigger>
              <TabsTrigger
                value="briefing"
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 data-[state=active]:text-arena-gold data-[state=active]:shadow-none relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-arena-gold after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                Intelligence Reports
              </TabsTrigger>
              <TabsTrigger
                value="reasoning"
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 data-[state=active]:text-primary data-[state=active]:shadow-none relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                Cognitive Sync
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="gazette" className="m-0 h-full">
              <GazetteTab stories={recentGazettes} />
            </TabsContent>
            <TabsContent value="briefing" className="m-0 h-full">
              <BriefingTab reports={recentNewsletter} />
            </TabsContent>
            <TabsContent value="reasoning" className="m-0 h-full">
              <div className="py-6 px-6">
                <AgentReasoningWidget rival={state.rivals?.[0] as RivalStableData} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <IntelligenceHubFooter />
    </Surface>
  );
}
