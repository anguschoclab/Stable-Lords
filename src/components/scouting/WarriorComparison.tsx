import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserRoundSearch, Swords } from "lucide-react";
import type { RivalStableData, Warrior } from "@/types/game";
import { ATTRIBUTE_KEYS, STYLE_DISPLAY_NAMES } from "@/types/game";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { ComparisonBar } from "./ComparisonBar";

interface WarriorComparisonProps {
  rivals: RivalStableData[];
  playerRoster: Warrior[];
}

export function WarriorComparison({ rivals, playerRoster }: WarriorComparisonProps) {
  const [wIdA, setWIdA] = useState<string | null>(null);
  const [wIdB, setWIdB] = useState<string | null>(null);

  const allWarriors = useMemo(() => {
    const list: { warrior: Warrior; stable: string }[] = [];
    for (const w of playerRoster.filter(w => w.status === "Active")) list.push({ warrior: w, stable: "Your Stable" });
    for (const r of rivals) {
      for (const w of r.roster.filter(w => w.status === "Active")) list.push({ warrior: w, stable: r.owner.stableName });
    }
    return list;
  }, [rivals, playerRoster]);

  const entryA = useMemo(() => allWarriors.find(e => e.warrior.id === wIdA), [allWarriors, wIdA]);
  const entryB = useMemo(() => allWarriors.find(e => e.warrior.id === wIdB), [allWarriors, wIdB]);

  if (allWarriors.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <UserRoundSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Need at least 2 warriors to compare.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[{ sel: wIdA, setSel: setWIdA, other: wIdB, label: "Warrior A", color: "bg-primary" },
          { sel: wIdB, setSel: setWIdB, other: wIdA, label: "Warrior B", color: "bg-accent" }].map(({ sel, setSel, other, label, color }) => (
          <div key={label} className="space-y-2">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</label>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {allWarriors.map(({ warrior: w, stable }) => (
                <Tooltip key={w.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSel(w.id === sel ? null : w.id)}
                      disabled={w.id === other}
                      className={`w-full text-left px-3 py-1.5 rounded-lg border text-[11px] transition-all ${
                        sel === w.id
                          ? `border-${color.replace("bg-", "")} ${color}/10 text-foreground shadow-sm`
                          : w.id === other
                          ? "border-border/10 text-muted-foreground/20 cursor-not-allowed"
                          : "border-border/40 bg-glass-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <WarriorNameTag id={w.id} name={w.name} />
                        <StatBadge styleName={w.style} />
                      </div>
                      <div className="text-[9px] text-muted-foreground/60">{stable}</div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={label === "Warrior A" ? "left" : "right"}>
                    <p className="text-[10px] font-black uppercase tracking-widest">Select {w.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>

      {entryA && entryB && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-glass-card border border-border/40 rounded-2xl p-4">
            <div className="text-center flex-1">
              <h3 className="font-display text-sm font-black uppercase tracking-tight">{entryA.warrior.name}</h3>
              <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                {STYLE_DISPLAY_NAMES[entryA.warrior.style]} · {entryA.stable}
              </div>
            </div>
            <Swords className="h-5 w-5 text-muted-foreground/40 mx-3" />
            <div className="text-center flex-1">
              <h3 className="font-display text-sm font-black uppercase tracking-tight">{entryB.warrior.name}</h3>
              <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                {STYLE_DISPLAY_NAMES[entryB.warrior.style]} · {entryB.stable}
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ATTRIBUTE_KEYS.map(key => (
                <ComparisonBar 
                  key={key} 
                  label={key} 
                  valA={entryA.warrior.attributes[key] ?? 0} 
                  valB={entryB.warrior.attributes[key] ?? 0} 
                  maxVal={25} 
                  colorA="bg-primary" 
                  colorB="bg-accent" 
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Career</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ComparisonBar label="Wins" valA={entryA.warrior.career.wins} valB={entryB.warrior.career.wins} maxVal={Math.max(entryA.warrior.career.wins, entryB.warrior.career.wins, 1)} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Losses" valA={entryA.warrior.career.losses} valB={entryB.warrior.career.losses} maxVal={Math.max(entryA.warrior.career.losses, entryB.warrior.career.losses, 1)} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Kills" valA={entryA.warrior.career.kills} valB={entryB.warrior.career.kills} maxVal={Math.max(entryA.warrior.career.kills, entryB.warrior.career.kills, 1)} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Fame" valA={entryA.warrior.fame ?? 0} valB={entryB.warrior.fame ?? 0} maxVal={Math.max(entryA.warrior.fame ?? 0, entryB.warrior.fame ?? 0, 1)} colorA="bg-primary" colorB="bg-accent" />
              <ComparisonBar label="Popularity" valA={entryA.warrior.popularity ?? 0} valB={entryB.warrior.popularity ?? 0} maxVal={Math.max(entryA.warrior.popularity ?? 0, entryB.warrior.popularity ?? 0, 1)} colorA="bg-primary" colorB="bg-accent" />
            </CardContent>
          </Card>
        </div>
      )}

      {(!entryA || !entryB) && (
        <Card className="border-dashed bg-transparent border-border/40">
          <CardContent className="py-12 text-center text-muted-foreground/40">
            <UserRoundSearch className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">Select two warriors to begin engagement analysis</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
