import React, { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, STYLE_DISPLAY_NAMES, type Warrior, type TrainingAssignment } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Check, X, Trophy } from "lucide-react";
import { toast } from "sonner";

function WarriorTrainingCard({ warrior, assignment, onAssign, onClear }: {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  onAssign: (attr: keyof typeof ATTRIBUTE_LABELS) => void;
  onClear: () => void;
}) {
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);
  const atCap = total >= 80;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-display text-base">{warrior.name}</CardTitle>
            {warrior.champion && <Trophy className="h-3.5 w-3.5 text-arena-gold" />}
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {STYLE_DISPLAY_NAMES[warrior.style]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {atCap && !assignment && (
          <p className="text-xs text-muted-foreground italic">Attribute cap reached (80). No further training possible.</p>
        )}

        {/* Attribute grid */}
        <div className="grid grid-cols-1 gap-1.5">
          {ATTRIBUTE_KEYS.map((key) => {
            const val = warrior.attributes[key];
            const isSelected = assignment?.attribute === key;
            const maxed = val >= 25;
            return (
              <button
                key={key}
                disabled={!!assignment || maxed || atCap}
                onClick={() => onAssign(key)}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors border ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : maxed || atCap
                    ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50 cursor-pointer"
                }`}
              >
                <span className="text-xs w-20 font-medium">{ATTRIBUTE_LABELS[key]}</span>
                <div className="flex-1">
                  <Progress value={(val / 25) * 100} className="h-1.5" />
                </div>
                <span className="text-xs font-mono w-5 text-right">{val}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                {maxed && <span className="text-[10px] text-muted-foreground">MAX</span>}
              </button>
            );
          })}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground font-mono">
            Total: {total}/80
          </span>
          {assignment ? (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" /> Clear
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {atCap ? "" : "Click an attribute to train"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Training() {
  const { state, setState } = useGame();
  const assignments = state.trainingAssignments ?? [];

  const assignmentMap = useMemo(() => {
    const map = new Map<string, TrainingAssignment>();
    for (const a of assignments) map.set(a.warriorId, a);
    return map;
  }, [assignments]);

  const handleAssign = (warriorId: string, attribute: keyof typeof ATTRIBUTE_LABELS) => {
    const warrior = state.roster.find((w) => w.id === warriorId);
    const next: TrainingAssignment[] = [
      ...assignments.filter((a) => a.warriorId !== warriorId),
      { warriorId, attribute },
    ];
    setState({ ...state, trainingAssignments: next });
    toast.success(`${warrior?.name} assigned to train ${ATTRIBUTE_LABELS[attribute]}`);
  };

  const handleClear = (warriorId: string) => {
    const next = assignments.filter((a) => a.warriorId !== warriorId);
    setState({ ...state, trainingAssignments: next });
  };

  const handleClearAll = () => {
    setState({ ...state, trainingAssignments: [] });
    toast("All training assignments cleared.");
  };

  const assignedCount = assignments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide">Training Grounds</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Assign warriors to train a specific attribute before the next round. Each warrior has a <span className="text-foreground font-medium">55% chance</span> to gain +1 in their chosen attribute when the week advances.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="outline" className="gap-1">
              <Dumbbell className="h-3 w-3" /> {assignedCount}/{state.roster.length} assigned
            </Badge>
            {assignedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Warrior Cards */}
      {state.roster.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No warriors in your stable. Recruit some first!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.roster.map((warrior) => (
            <WarriorTrainingCard
              key={warrior.id}
              warrior={warrior}
              assignment={assignmentMap.get(warrior.id)}
              onAssign={(attr) => handleAssign(warrior.id, attr)}
              onClear={() => handleClear(warrior.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
