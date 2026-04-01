import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords } from "lucide-react";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import type { Warrior } from "@/types/game";

interface HeadToHeadProps {
  nameA: string;
  nameB: string;
  rosterA: Warrior[];
  rosterB: Warrior[];
}

export function HeadToHead({ nameA, nameB, rosterA, rosterB }: HeadToHeadProps) {
  const allFights = useMemo(() => ArenaHistory.all(), []);
  const namesA = useMemo(() => new Set(rosterA.map(w => w.name)), [rosterA]);
  const namesB = useMemo(() => new Set(rosterB.map(w => w.name)), [rosterB]);

  const h2h = useMemo(() => {
    return allFights.filter(f =>
      (namesA.has(f.a) && namesB.has(f.d)) || (namesA.has(f.d) && namesB.has(f.a))
    );
  }, [allFights, namesA, namesB]);

  const winsA = h2h.filter(f => (namesA.has(f.a) && f.winner === "A") || (namesA.has(f.d) && f.winner === "D")).length;
  const winsB = h2h.filter(f => (namesB.has(f.a) && f.winner === "A") || (namesB.has(f.d) && f.winner === "D")).length;
  const draws = h2h.length - winsA - winsB;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Swords className="h-4 w-4 text-arena-gold" /> Head-to-Head Record
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {h2h.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No direct matchups recorded between these stables.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm font-display">
              <span className="text-primary font-bold">{nameA}: {winsA}W</span>
              {draws > 0 && <span className="text-muted-foreground text-xs">{draws} Draw{draws !== 1 ? "s" : ""}</span>}
              <span className="text-accent font-bold">{nameB}: {winsB}W</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex bg-muted">
              {winsA > 0 && <div className="h-full bg-primary transition-all" style={{ width: `${(winsA / h2h.length) * 100}%` }} />}
              {draws > 0 && <div className="h-full bg-muted-foreground/30 transition-all" style={{ width: `${(draws / h2h.length) * 100}%` }} />}
              {winsB > 0 && <div className="h-full bg-accent transition-all" style={{ width: `${(winsB / h2h.length) * 100}%` }} />}
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono">
              {h2h.slice().reverse().map(f => {
                const aIsStableA = namesA.has(f.a);
                return (
                  <div key={f.id} className="flex items-center justify-between text-[11px] py-1 border-b border-border/20 last:border-0">
                    <span className="text-muted-foreground/50 w-10 text-[9px]">W{f.week}</span>
                    <span className={`flex-1 truncate ${(aIsStableA && f.winner === "A") || (!aIsStableA && f.winner === "D") ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                      {f.a}
                    </span>
                    <Badge variant="outline" className="text-[8px] h-4 mx-1 uppercase tracking-tight">{f.by ?? "Draw"}</Badge>
                    <span className={`flex-1 truncate text-right ${(!aIsStableA && f.winner === "A") || (aIsStableA && f.winner === "D") ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                      {f.d}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
