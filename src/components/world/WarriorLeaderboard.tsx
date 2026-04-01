import React from "react";
import { Link } from "@tanstack/react-router";
import { Surface } from "@/components/ui/Surface";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortHeader } from "@/components/ui/sort-header";
import { TrendingUp, Star, Swords, Skull, Target, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarriorRow {
  id: string;
  name: string;
  stableName: string;
  stableId: string;
  fame: number;
  wins: number;
  losses: number;
  kills: number;
  winRate: number;
  style: string;
  isPlayer: boolean;
}

interface WarriorLeaderboardProps {
  rows: WarriorRow[];
  sort: { field: string; dir: "asc" | "desc" };
  onSort: (field: any) => void;
}

export function WarriorLeaderboard({ rows, sort, onSort }: WarriorLeaderboardProps) {
  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-display font-black uppercase tracking-tight">Vanguard Rankings</h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
              Elite Combatant Directory // Global Performance Index
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5 bg-black/20">
              <TableHead className="w-12 text-center text-[10px] font-black uppercase tracking-widest opacity-40">#</TableHead>
              <TableHead>
                <SortHeader label="Combatant" active={sort.field === "name"} dir={sort.dir} onClick={() => onSort("name")} />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortHeader label="Patron Stable" active={sort.field === "stable"} dir={sort.dir} onClick={() => onSort("stable")} />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortHeader label="Specialization" active={sort.field === "style"} dir={sort.dir} onClick={() => onSort("style")} />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader label="Renown" active={sort.field === "fame"} dir={sort.dir} onClick={() => onSort("fame")} />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader label="W" active={sort.field === "wins"} dir={sort.dir} onClick={() => onSort("wins")} />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader label="L" active={sort.field === "losses"} dir={sort.dir} onClick={() => onSort("losses")} />
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                <SortHeader label="Efficiency" active={sort.field === "winRate"} dir={sort.dir} onClick={() => onSort("winRate")} />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader label="Fatalities" active={sort.field === "kills"} dir={sort.dir} onClick={() => onSort("kills")} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 50).map((row, i) => (
              <TableRow 
                key={row.id} 
                className={cn(
                  "border-white/5 transition-colors group",
                  row.isPlayer ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-white/5"
                )}
              >
                <TableCell className="text-center font-mono text-xs font-black opacity-30 group-hover:opacity-100 transition-opacity">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {row.isPlayer ? (
                      <Link 
                        to={`/warrior/${row.id}` as any} 
                        className="font-display font-black uppercase text-xs tracking-tight text-primary hover:text-white transition-all flex items-center gap-2"
                      >
                        {row.name}
                        {i < 3 && <Medal className={cn("h-3 w-3", i === 0 ? "text-arena-gold" : "text-muted-foreground")} />}
                      </Link>
                    ) : (
                      <div className="font-display font-black uppercase text-xs tracking-tight text-foreground flex items-center gap-2">
                        {row.name}
                        {i < 3 && <Medal className={cn("h-3 w-3", i === 0 ? "text-arena-gold" : "text-muted-foreground")} />}
                      </div>
                    )}
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mt-0.5">STATUS // ACTIVE_DUTY</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Link
                    to={row.isPlayer ? "/stable/hall" : `/stable/${row.stableId}` as any}
                    className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <span className="text-[10px] opacity-20">PATRON:</span> {row.stableName}
                  </Link>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{row.style}</TableCell>
                <TableCell className="text-right font-mono font-black text-xs text-arena-gold">{row.fame.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono font-black text-xs text-primary">{row.wins}</TableCell>
                <TableCell className="text-right font-mono font-black text-xs text-muted-foreground/30">{row.losses}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                   <div className="flex flex-col items-end">
                      <span className="font-mono font-black text-xs">{row.winRate}%</span>
                      <div className="w-12 h-0.5 bg-neutral-900 rounded-full mt-1 overflow-hidden">
                         <div className="h-full bg-arena-pop" style={{ width: `${row.winRate}%` }} />
                      </div>
                   </div>
                </TableCell>
                <TableCell className="text-right">
                   <div className="flex items-center justify-end gap-2 group-hover:scale-110 transition-transform">
                      <span className={cn("font-mono font-black text-xs", row.kills > 0 ? "text-destructive" : "text-muted-foreground/20")}>{row.kills}</span>
                      <Skull className={cn("h-3 w-3", row.kills > 0 ? "text-destructive/40" : "text-muted-foreground/5")} />
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Surface>
  );
}
