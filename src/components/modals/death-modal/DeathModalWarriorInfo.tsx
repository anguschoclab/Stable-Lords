import { Scroll, Crosshair, HeartOff } from 'lucide-react';
import type { Warrior } from '@/types/warrior.types';

interface DeathModalWarriorInfoProps {
  warrior: Warrior;
}

/**
 * Death modal warrior information section displaying deceased warrior details.
 */
export function DeathModalWarriorInfo({ warrior }: DeathModalWarriorInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Deceased
        </span>
        <h2 className="text-2xl font-display font-bold text-foreground leading-none">
          {warrior.name.toUpperCase()}
        </h2>
        <p className="text-xs font-mono text-muted-foreground/80 uppercase">
          {warrior.style} · Year {warrior.age}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
            Service
          </span>
          <div className="text-sm font-mono flex items-center gap-2">
            <Scroll className="w-3 h-3 text-arena-gold" />
            <span>Weeks 1 - {warrior.deathWeek}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
            Legacy
          </span>
          <div className="text-sm font-mono flex items-center gap-2">
            <Crosshair className="w-3 h-3 text-arena-blood" />
            <span>
              {warrior.career.wins}W - {warrior.career.losses}L
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-4 bg-arena-blood/5 border-l-2 border-arena-blood/40">
        <span className="text-[10px] font-black uppercase tracking-widest text-arena-blood/70 flex items-center gap-2">
          <HeartOff className="w-3 h-3" /> Fatal Circumstance
        </span>
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          "{warrior.deathCause || 'Fell in honorable combat on the sands of the arena.'}"
        </p>
      </div>
    </div>
  );
}
