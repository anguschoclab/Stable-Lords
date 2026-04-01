import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScoutReportData, ScoutQuality } from "@/types/game";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS } from "@/types/game";
import { getScoutCost } from "@/engine/scouting";

interface ScoutReportDetailsProps {
  report: ScoutReportData | null;
  warriorName: string;
  gold: number;
  onScout: (quality: ScoutQuality) => void;
}

export function ScoutReportDetails({ report, warriorName, gold, onScout }: ScoutReportDetailsProps) {
  const QUALITIES: ScoutQuality[] = ["Basic", "Detailed", "Expert"];

  if (!report) {
    return (
      <Card className="border-border/40 bg-glass-card shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tactical Analysis Pending</h4>
            <p className="text-sm text-foreground/80 leading-relaxed font-display">
              Commission a thorough scouting report on <span className="text-primary font-black uppercase tracking-tight">{warriorName}</span> to uncover their combat tendencies and physical limitations.
            </p>
          </div>
          
          <div className="space-y-2 pt-2">
            {QUALITIES.map((q) => {
              const cost = getScoutCost(q);
              const canAfford = gold >= cost;
              return (
                <Button
                  key={q}
                  variant={q === "Expert" ? "default" : "outline"}
                  className={`w-full justify-between h-11 border-border/40 font-black uppercase text-[10px] tracking-widest transition-all ${
                    q === "Expert" ? "shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]" : "hover:border-primary/40"
                  }`}
                  disabled={!canAfford}
                  onClick={() => onScout(q)}
                >
                  <span className="flex items-center gap-2.5">
                    <Eye className="h-4 w-4" /> {q} SCOUT_INTEL
                  </span>
                  <Badge variant="outline" className="font-mono gap-1.5 h-6 bg-secondary/20 border-secondary/40 text-arena-gold">
                    <Coins className="h-3 w-3" /> {cost}G
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/40 bg-glass-card shadow-[0_0_30px_-10px_rgba(var(--primary-rgb),0.2)] overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <CardHeader className="pb-3 border-b border-border/20 bg-primary/5">
        <CardTitle className="font-display font-black uppercase text-base flex items-center gap-3 tracking-tight">
          <Eye className="h-5 w-5 text-primary" />
          {report.warriorName}
          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary border-primary/20">{report.quality} COMPLETED</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Combat Discipline</div>
            <div className="text-sm font-black uppercase tracking-tight text-foreground">
              {STYLE_DISPLAY_NAMES[report.style as keyof typeof STYLE_DISPLAY_NAMES] ?? report.style}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Engagement Record</div>
            <div className="text-sm font-mono font-bold text-foreground">
              {report.record}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <div className="h-px flex-1 bg-primary/20" />
            Estimated Attributes
            <div className="h-px flex-1 bg-primary/20" />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {ATTRIBUTE_KEYS.map((key) => {
              const range = report.attributeRanges[key];
              if (!range) return null;
              return (
                <div key={key} className="flex items-center gap-3 bg-secondary/10 px-3 py-2 rounded-xl border border-border/10">
                  <span className="text-[10px] text-muted-foreground/60 w-8 font-black uppercase tracking-widest">{key}</span>
                  <div className="flex-1">
                    <div className="text-xs font-mono font-bold text-foreground">{range}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(report.suspectedOE || report.knownInjuries.length > 0) && (
          <div className="grid grid-cols-1 gap-4 bg-glass-card/50 p-4 rounded-2xl border border-border/20">
            {report.suspectedOE && (
              <div className="flex gap-6">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block">Suspected OE</span>
                  <span className="text-sm font-mono font-black text-primary">{report.suspectedOE}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block">Suspected AL</span>
                  <span className="text-sm font-mono font-black text-primary">{report.suspectedAL}</span>
                </div>
              </div>
            )}

            {report.knownInjuries.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-destructive block">Documented Wounds</span>
                <span className="text-[11px] font-bold text-destructive/80 leading-tight uppercase font-display">
                  {report.knownInjuries.join(" // ")}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="bg-secondary/5 rounded-xl p-3 border border-border/10 italic">
          <p className="text-xs text-muted-foreground/80 leading-relaxed">"{report.notes}"</p>
        </div>

        {report.quality !== "Expert" && (
          <Button
            variant="outline"
            className="w-full h-10 border-primary/20 hover:border-primary/50 text-foreground transition-all gap-2 font-black uppercase text-[10px] tracking-widest"
            onClick={() => onScout(report.quality === "Basic" ? "Detailed" : "Expert")}
          >
            <Eye className="h-4 w-4" />
            ELEVATE_INTEL_PRECISION
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
