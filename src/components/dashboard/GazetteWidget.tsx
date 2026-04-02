import React from "react";
import { ScrollText, Newspaper, Zap, Activity, ArrowRight, NewspaperIcon } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function GazetteWidget() {
  const { state } = useGameStore();
  const recentNews = (state.newsletter || []).slice(-2).reverse();

  return (
    <Surface variant="glass" padding="none" className="md:col-span-2 border-border/10 group overflow-hidden relative flex flex-col">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
         <NewspaperIcon className="h-48 w-48 text-arena-fame" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-arena-fame/10 border border-arena-fame/20 shadow-[0_0_15px_rgba(255,165,0,0.1)]">
               <ScrollText className="h-5 w-5 text-arena-fame" />
            </div>
            <div>
               <h3 className="font-display text-base font-black uppercase tracking-tight">Arena_Gazette_Feed</h3>
               <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Intelligence_Broadcast_Sync</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest">
               {state.newsletter?.length ?? 0} DISPATCHES
            </Badge>
         </div>
      </div>

      <div className="p-6 flex-1 relative z-10 space-y-8">
        {recentNews.length === 0 ? (
          <div className="py-12 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.3em]">No_Transmission_Detected</p>
            <p className="text-[8px] lowercase mt-2 font-medium">Bout_engagement_required_for_narrative_generation...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentNews.map((n, i) => (
              <div key={i} className="space-y-4 group/item">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-arena-fame opacity-40 group-hover/item:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">WK_{n.week.toString().padStart(2, '0')}</span>
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{n.title}</span>
                </div>
                
                <ul className="space-y-3">
                  {n.items.slice(0, 3).map((item, j) => (
                    <li key={j} className="flex gap-3 group/li">
                       <div className="h-1 w-1 rounded-full bg-arena-fame/20 mt-1.5 shrink-0 group-hover/li:bg-arena-fame transition-colors" />
                       <span className="text-xs font-medium text-foreground/70 leading-relaxed group-hover/li:text-foreground transition-colors selection:bg-arena-fame/20">
                          {item}
                       </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
         <Link 
            to="/world/gazette"
            className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-arena-fame transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
         >
            Sync_Full_Dispatch <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
         </Link>
      </div>
    </Surface>
  );
}
