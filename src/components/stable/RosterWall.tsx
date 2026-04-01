import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { useNavigate, Link } from "@tanstack/react-router";
import { ATTRIBUTE_KEYS } from "@/types/game";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatBadge, WarriorNameTag } from "@/components/ui/WarriorBadges";
import { Users, ChevronRight, Trophy, Star, Swords, Target, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function RosterWall() {
  const { state } = useGameStore();
  const navigate = useNavigate();

  const sortedRoster = useMemo(
    () => [...state.roster]
      .filter(w => w.status === "Active")
      .sort((a, b) => b.fame - a.fame),
    [state.roster]
  );

  return (
    <Surface variant="glass" padding="none" className="border-border/20 overflow-hidden">
      <div className="p-6 border-b border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5">
        <div className="flex items-center gap-3">
           <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
             <Users className="h-5 w-5 text-primary" />
           </div>
           <div>
             <h3 className="font-display text-sm font-black uppercase tracking-tight">Active Roster Selection</h3>
             <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Deployable Assets // Total Recruits: {sortedRoster.length}</p>
           </div>
        </div>
        
        <Link to="/stable/recruit">
          <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-primary/10 hover:text-primary transition-all">
             Recruit New Specialist <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="p-6">
        {sortedRoster.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4 border-dashed border-border/40 border-2 rounded-xl">
            <Swords className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">The Roster is Empty</p>
              <p className="text-xs text-muted-foreground/60 italic max-w-xs mx-auto">Your stable stands vacant. Proceed to recruitment to enlist your first combatant.</p>
            </div>
            <Link to="/stable/recruit" className="mt-4">
               <Surface variant="neon" padding="sm" className="text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2.5 hover:scale-105 transition-transform">
                  Enlist Now
               </Surface>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {sortedRoster.map((w, i) => {
                const fights = w.career.wins + w.career.losses;
                const winRate = fights > 0 ? Math.round((w.career.wins / fights) * 100) : 0;
                const injuryCount = (w.injuries ?? []).length;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => navigate({ to: "/warrior/$id", params: { id: w.id } as any })}
                      className="w-full flex items-stretch gap-4 p-4 rounded-xl border border-white/5 bg-neutral-900/40 hover:bg-white/5 hover:border-primary/30 transition-all text-left group relative overflow-hidden"
                    >
                      {/* Ranking Indicator */}
                      <div className={cn(
                        "w-12 shrink-0 flex flex-col items-center justify-center border-r border-white/5 pr-4",
                        i === 0 ? "text-arena-gold" : i === 1 ? "text-muted-foreground" : "text-muted-foreground/40"
                      )}>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-40">Rank</span>
                        <span className="text-3xl font-display font-black tracking-tighter leading-none">{i + 1}</span>
                        {i === 0 && <Crown className="h-3 w-3 mt-1 animate-pulse" />}
                      </div>

                      {/* Info & Stats */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                             <WarriorNameTag
                                id={w.id}
                                name={w.name}
                                isChampion={w.champion}
                                injuryCount={injuryCount}
                                useCrown
                             />
                             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5 group-hover:border-primary/20 transition-all">
                                <Star className={cn("h-3 w-3", w.fame > 1000 ? "text-arena-gold" : "text-muted-foreground")} />
                                <span className={cn("text-[10px] font-mono font-black", w.fame > 1000 ? "text-arena-gold" : "text-muted-foreground")}>{w.fame} G</span>
                             </div>
                          </div>
                          <StatBadge styleName={w.style as any} career={w.career} />
                        </div>

                        {/* Attribute Matrix */}
                        <div className="flex gap-2 mt-4">
                          {ATTRIBUTE_KEYS.map(k => {
                            const val = w.attributes?.[k as keyof typeof w.attributes] ?? 0;
                            return (
                             <div key={k} className="flex flex-col items-center flex-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-1">{k}</span>
                                <div className="h-4 w-full bg-black/40 rounded-sm border border-white/5 relative overflow-hidden">
                                   <div 
                                      className={cn(
                                        "absolute inset-y-0 left-0 transition-all duration-1000",
                                        val >= 18 ? "bg-primary" : val >= 12 ? "bg-arena-pop" : "bg-muted-foreground/30"
                                      )} 
                                      style={{ width: `${(val / 25) * 100}%` }}
                                   />
                                </div>
                             </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Prowess Indicator */}
                      <div className="w-16 shrink-0 flex flex-col justify-between border-l border-white/5 pl-4 py-1">
                         <div className="text-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Victory</span>
                            <div className="text-sm font-mono font-black text-arena-pop">{winRate}%</div>
                         </div>
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">Fatal</span>
                            <div className={cn(
                               "px-2 py-0.5 rounded text-[10px] font-mono font-black",
                               w.career.kills > 0 ? "bg-destructive text-white shadow-[0_0_10px_rgba(255,0,0,0.4)]" : "bg-neutral-900/60 text-muted-foreground"
                            )}>
                               {w.career.kills}K
                            </div>
                         </div>
                      </div>

                      <div className="absolute right-0 top-0 h-full w-1.5 bg-primary transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Surface>
  );
}

// Minimal Button shim for RosterWall
function Button({ children, className, variant, size, ...props }: any) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "ghost" ? "hover:bg-accent hover:text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90",
        size === "sm" ? "h-8 px-3" : "h-10 px-4",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
