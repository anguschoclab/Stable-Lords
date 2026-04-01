import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import type { RivalStableData } from "@/types/game";

interface ComparisonHeaderProps {
  rivalA: RivalStableData;
  rivalB: RivalStableData;
}

export function ComparisonHeader({ rivalA, rivalB }: ComparisonHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-glass-card rounded-2xl p-6 border border-border/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="text-center flex-1 relative z-10">
        <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground decoration-primary decoration-4 underline-offset-8 transition-all">{rivalA.owner.stableName}</h3>
        <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase mt-3 border-primary/20 bg-primary/5 text-primary">{rivalA.tier}</Badge>
      </div>
      <div className="flex flex-col items-center justify-center mx-6 relative z-10">
         <ArrowLeftRight className="h-6 w-6 text-muted-foreground/40 mb-1" />
         <span className="text-[8px] font-black text-muted-foreground/30 tracking-widest uppercase">VS</span>
      </div>
      <div className="text-center flex-1 relative z-10">
        <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground decoration-accent decoration-4 underline-offset-8 transition-all">{rivalB.owner.stableName}</h3>
        <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase mt-3 border-accent/20 bg-accent/5 text-accent">{rivalB.tier}</Badge>
      </div>
    </div>
  );
}
