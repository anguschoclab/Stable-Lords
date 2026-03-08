/**
 * Stable Lords — Recruit Page
 */
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/state/GameContext";
import { FightingStyle, type Attributes } from "@/types/game";
import { makeWarrior } from "@/state/gameStore";
import WarriorBuilder from "@/components/WarriorBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Recruit() {
  const { state, setState } = useGame();
  const navigate = useNavigate();

  const handleCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      const id = `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;
      const warrior = makeWarrior(id, data.name, data.style, data.attributes);
      setState({ ...state, roster: [...state.roster, warrior] });
      toast.success(`${data.name} has joined your stable!`);
      navigate(`/warrior/${id}`);
    },
    [state, setState, navigate]
  );

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <WarriorBuilder
        onCreateWarrior={handleCreate}
        maxRoster={10}
        currentRosterSize={state.roster.length}
      />
    </div>
  );
}
