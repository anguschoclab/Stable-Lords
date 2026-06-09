import { Trophy } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';

interface DominantCombatantsSectionProps {
  topWarriorA: any;
  topWarriorB: any;
}

/**
 *
 */
export function DominantCombatantsSection({
  topWarriorA,
  topWarriorB,
}: DominantCombatantsSectionProps) {
  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-arena-gold/10 border border-arena-gold/20">
          <Trophy className="h-3.5 w-3.5 text-arena-gold" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
          Dominant Combatants
        </h3>
      </div>

      <div className="p-6 grid grid-cols-2 gap-8">
        {[
          {
            warrior: topWarriorA,
            color: 'text-primary',
            borderColor: 'border-primary/20',
            bgColor: 'bg-primary/5',
          },
          {
            warrior: topWarriorB,
            color: 'text-accent',
            borderColor: 'border-accent/20',
            bgColor: 'bg-accent/5',
          },
        ].map(({ warrior, color, borderColor, bgColor }) => (
          <div key={warrior.id} className={`p-4 border rounded-none ${borderColor} ${bgColor}`}>
            <div className="space-y-3">
              <div
                className={`text-[9px] font-black uppercase tracking-widest mb-3 opacity-60 ${color}`}
              >
                Top Warrior
              </div>

              <div className="flex items-center justify-between mb-2">
                <WarriorNameTag
                  id={warrior.id}
                  name={warrior.name}
                  isChampion={warrior.isChampion}
                  injuryCount={warrior.injuryCount}
                  isDead={warrior.isDead}
                />
                <div className={`text-[10px] font-mono font-black ${color}`}>
                  {warrior.career.wins}W-{warrior.career.losses}L
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground/50">Age</span>
                  <span className="text-foreground/80">{warrior.age}y</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground/50">Fame</span>
                  <span className="text-foreground/80">{warrior.fame ?? 0}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground/50">Status</span>
                  <span className="text-foreground/80">{warrior.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
