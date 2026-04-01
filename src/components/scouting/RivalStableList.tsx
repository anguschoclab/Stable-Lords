import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RivalStableData } from "@/types/game";
import { cn } from "@/lib/utils";

interface RivalStableListProps {
  rivals: RivalStableData[];
  selectedRivalId: string | null;
  onSelectRival: (id: string) => void;
}

export function RivalStableList({ rivals, selectedRivalId, onSelectRival }: RivalStableListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Rival_Asset_Inventory</h3>
        <div className="h-px flex-1 bg-border/20" />
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {rivals.map((rival) => (
          <Tooltip key={rival.owner.id}>
            <TooltipTrigger asChild>
              <Card
                className={cn(
                  "cursor-pointer transition-all border border-border/30 hover:border-primary/40 bg-glass-card shadow-sm group",
                  selectedRivalId === rival.owner.id 
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.3)]" 
                    : "hover:bg-secondary/40"
                )}
                onClick={() => onSelectRival(rival.owner.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl border border-border/40 transition-colors",
                        selectedRivalId === rival.owner.id ? "bg-primary/20 text-primary border-primary/20" : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:border-primary/40"
                      )}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className={cn(
                          "font-display font-black text-sm uppercase tracking-tight transition-colors",
                          selectedRivalId === rival.owner.id ? "text-primary" : "text-foreground"
                        )}>{rival.owner.stableName}</span>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span className="flex items-center gap-1.5 font-mono">
                            <Users className="h-3 w-3" /> {rival.roster.filter((w) => w.status === "Active").length}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-border/20">{rival.owner.personality}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-glass-card border-border/40 shadow-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">SELECT_STABLE_ASSET</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
