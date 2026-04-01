import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Swords } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Warrior, ScoutReportData } from "@/types/game";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { cn } from "@/lib/utils";

interface RivalWarriorListProps {
  warriors: Warrior[];
  selectedWarriorId: string | null;
  onSelectWarrior: (id: string) => void;
  reports: ScoutReportData[];
  stableName: string | undefined;
}

export function RivalWarriorList({ warriors, selectedWarriorId, onSelectWarrior, reports, stableName }: RivalWarriorListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stableName ? `${stableName}_ROSTER` : "Select_Stable"}</h3>
        <div className="h-px flex-1 bg-border/20" />
      </div>

      <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[60vh] pr-1">
        {warriors.map((w) => {
          const hasReport = reports.some((r) => r.warriorName === w.name);
          const isSelected = selectedWarriorId === w.id;
          
          return (
            <Tooltip key={w.id}>
              <TooltipTrigger asChild>
                <Card
                  className={cn(
                    "cursor-pointer transition-all border border-border/30 hover:border-primary/40 bg-glass-card shadow-sm group",
                    isSelected 
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.3)]" 
                      : "hover:bg-secondary/40"
                  )}
                  onClick={() => onSelectWarrior(w.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="space-y-1.5 px-0">
                          <div className="flex items-center gap-2">
                             <WarriorNameTag id={w.id} name={w.name} />
                             <StatBadge styleName={w.style} />
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span className="font-mono">{w.career.wins}W-{w.career.losses}L</span>
                            {hasReport && (
                              <Badge variant="secondary" className="h-4 p-0 px-1.5 text-[8px] font-black bg-primary/20 text-primary border-primary/20 gap-1 uppercase tracking-tight">
                                <Eye className="h-2.5 w-2.5" /> SCOUTED
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">SELECT_WARRIOR_ASSET</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {warriors.length === 0 && (
          <div className="py-12 text-center text-muted-foreground/40 border border-dashed border-border/30 rounded-2xl">
            <Swords className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">Select_Stable_To_Begin_Roster_Scan</p>
          </div>
        )}
      </div>
    </div>
  );
}
