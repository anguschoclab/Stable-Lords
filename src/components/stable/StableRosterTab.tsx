import type { Warrior } from '@/types/shared.types';
import { ATTRIBUTE_KEYS } from '@/types/game';
import { WarriorLink } from '@/components/EntityLink';
import { Activity, Heart, Zap } from 'lucide-react';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { ConditionBattery } from '@/components/ui/ConditionBattery';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { cn } from '@/lib/utils';

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClass = value >= 16 ? 'bg-primary' : value >= 12 ? 'bg-arena-gold' : 'bg-white/20';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-tighter">
          {label.slice(0, 3)}
        </span>
        <span className="text-[10px] font-display font-black text-foreground">{value}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-none overflow-hidden relative">
        <div
          className={cn('h-full transition-all duration-1000 ease-out', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface StableRosterTabProps {
  activeRoster: Warrior[];
}

export function StableRosterTab({ activeRoster }: StableRosterTabProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        {activeRoster
          .sort((a, b) => b.fame - a.fame)
          .map((w) => (
            <Surface
              key={w.id}
              variant="glass"
              className="p-0 border-white/5 overflow-hidden group hover:border-primary/20 transition-all duration-500"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <ImperialRing size="sm" variant="bronze">
                      <Activity className="h-4 w-4 text-muted-foreground/40" />
                    </ImperialRing>
                    <div>
                      <WarriorLink
                        name={w.name}
                        id={w.id}
                        className="text-lg font-display font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors block mb-1"
                      />
                      <div className="flex items-center gap-3">
                        <StatBadge styleName={w.style} showFullName />
                        <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
                          Age {w.age}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-display font-black text-arena-gold">
                      {w.fame} FAME
                    </div>
                    <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                      {w.popularity} POP
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-4 py-4 border-y border-white/5 mb-6">
                  {ATTRIBUTE_KEYS.map((k) => (
                    <StatBar key={k} label={k} value={w.attributes[k]} />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <ConditionBattery
                        value={100 - (w.fatigue ?? 0)}
                        className="h-1.5 w-16"
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Condition
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FormSparkline warriorId={w.id} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Form
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-sm font-display font-black text-foreground">
                        {w.derivedStats.hp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-arena-fame" />
                      <span className="text-sm font-display font-black text-foreground">
                        {w.derivedStats.endurance}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Surface>
          ))}
      </div>
    </div>
  );
}
