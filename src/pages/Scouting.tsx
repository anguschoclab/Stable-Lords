/**
 * Stable Lords — Scouting Page (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { generateScoutReport, getScoutCost, type ScoutQuality } from "@/engine/scouting";
import type { ScoutReportData } from "@/types/game";
import { Search, Eye, ArrowLeftRight, UserRoundSearch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Modular Components
import { ScoutIntelTab } from "@/components/scouting/ScoutIntelTab";
import { StableComparison } from "@/components/scouting/StableComparison";
import { WarriorComparison } from "@/components/scouting/WarriorComparison";

export default function Scouting() {
  const { state, setState } = useGameStore();
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);

  const rivals = useMemo(() => state.rivals ?? [], [state.rivals]);
  const reports = useMemo(() => state.scoutReports ?? [], [state.scoutReports]);

  const activeRival = useMemo(
    () => (state.rivals ?? []).find((r) => r.owner.id === selectedRivalId),
    [state.rivals, selectedRivalId]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w) => w.id === selectedWarriorId),
    [activeRival, selectedWarriorId]
  );

  const handleScout = useCallback(
    (quality: ScoutQuality) => {
      if (!activeWarrior) return;
      const cost = getScoutCost(quality);
      if ((state.gold ?? 0) < cost) {
        toast.error(`Insufficient funds! Scouting requires ${cost}g.`);
        return;
      }

      const { report } = generateScoutReport(activeWarrior, quality, state.week);
      
      // Ensure we don't have duplicate reports for the same warrior
      const newReports = [
        ...(state.scoutReports ?? []).filter((r) => r.warriorName !== activeWarrior.name),
        report as ScoutReportData,
      ];

      setState({
        ...state,
        scoutReports: newReports,
        gold: (state.gold ?? 0) - cost,
        ledger: [...(state.ledger ?? []), {
          week: state.week,
          label: `Intelligence: ${activeWarrior.name} (${quality})`,
          amount: -cost,
          category: "other",
        }],
      });
      toast.success(`Intel established for ${activeWarrior.name}. (-${cost}g)`);
    },
    [state, setState, activeWarrior]
  );

  const handleSelectRival = useCallback((id: string) => {
    setSelectedRivalId(id);
    setSelectedWarriorId(null);
  }, []);

  const handleSelectWarrior = useCallback((id: string) => {
    setSelectedWarriorId(id);
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-3xl font-display font-black flex items-center gap-3 uppercase tracking-tighter text-foreground">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <Search className="h-6 w-6 text-primary" />
          </div>
          Tactical Reconnaissance
        </h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
          Gathering vital intelligence on rival stables and veteran warriors
        </p>
      </div>

      <Tabs defaultValue="scout" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-secondary/20 p-1 rounded-2xl border border-border/40">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="scout" className="gap-2 rounded-xl transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary font-black uppercase text-[10px] tracking-widest">
                <Eye className="h-3.5 w-3.5" /> SCOUT_INTEL
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">Establish target intel</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="compare" className="gap-2 rounded-xl transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary font-black uppercase text-[10px] tracking-widest">
                <ArrowLeftRight className="h-3.5 w-3.5" /> STABLE_DYNAMICS
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">Compare stable performance</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="warriors" className="gap-2 rounded-xl transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary font-black uppercase text-[10px] tracking-widest">
                <UserRoundSearch className="h-3.5 w-3.5" /> WARRIOR_FACE-OFF
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">In-depth warrior comparison</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="scout" className="mt-6">
          <ScoutIntelTab
            rivals={rivals}
            reports={reports}
            selectedRivalId={selectedRivalId}
            onSelectRival={handleSelectRival}
            selectedWarriorId={selectedWarriorId}
            onSelectWarrior={handleSelectWarrior}
            gold={state.gold ?? 0}
            onScout={handleScout}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <StableComparison rivals={rivals} />
        </TabsContent>

        <TabsContent value="warriors" className="mt-6">
          <WarriorComparison rivals={rivals} playerRoster={state.roster} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
