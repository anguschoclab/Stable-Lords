import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import type { RivalStableData, ScoutReportData, ScoutQuality } from "@/types/game";
import { RivalStableList } from "./RivalStableList";
import { RivalWarriorList } from "./RivalWarriorList";
import { ScoutReportDetails } from "./ScoutReportDetails";

interface ScoutIntelTabProps {
  rivals: RivalStableData[];
  reports: ScoutReportData[];
  selectedRivalId: string | null;
  onSelectRival: (id: string) => void;
  selectedWarriorId: string | null;
  onSelectWarrior: (id: string) => void;
  gold: number;
  onScout: (quality: ScoutQuality) => void;
}

export function ScoutIntelTab({
  rivals,
  reports,
  selectedRivalId,
  onSelectRival,
  selectedWarriorId,
  onSelectWarrior,
  gold,
  onScout
}: ScoutIntelTabProps) {
  const activeRival = useMemo(
    () => rivals.find((r) => r.owner.id === selectedRivalId),
    [rivals, selectedRivalId]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w) => w.id === selectedWarriorId),
    [activeRival, selectedWarriorId]
  );

  const existingReport = useMemo(
    () => activeWarrior ? reports.find((r) => r.warriorName === activeWarrior.name) : null,
    [reports, activeWarrior]
  );

  if (rivals.length === 0) {
    return (
      <Card className="border-dashed bg-glass-card border-border/40">
        <CardContent className="py-12 text-center text-muted-foreground/40 font-black uppercase tracking-[0.2em]">
          <Search className="h-10 w-10 mx-auto mb-4 opacity-20" />
          <p className="text-[10px]">Zero_Rival_Signatures_Detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 mt-4">
      <RivalStableList
        rivals={rivals}
        selectedRivalId={selectedRivalId}
        onSelectRival={onSelectRival}
      />

      <RivalWarriorList
        warriors={activeRival?.roster.filter((w) => w.status === "Active") ?? []}
        selectedWarriorId={selectedWarriorId}
        onSelectWarrior={onSelectWarrior}
        reports={reports}
        stableName={activeRival?.owner.stableName}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Scouting_Console</h3>
          <div className="h-px flex-1 bg-border/20" />
        </div>
        {activeWarrior ? (
          <ScoutReportDetails
            report={existingReport ?? null}
            warriorName={activeWarrior.name}
            gold={gold}
            onScout={onScout}
          />
        ) : (
          <div className="py-12 text-center text-muted-foreground/40 border border-dashed border-border/30 rounded-2xl">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Target_Warrior_Required</p>
          </div>
        )}
      </div>
    </div>
  );
}
