import { Users, Flame } from 'lucide-react';
import type { RivalStableData } from '@/types/game';
import { cn } from '@/lib/utils';
import { StableCrest } from '@/components/crest/StableCrest';
import { isActive } from '@/engine/warrior/warriorStatus';
import { AvatarForEntity } from '@/components/avatar';

/** Crest + stable name + roster/personality/philosophy chip row. */
export function RivalIdentity({ rival, isSelected }: { rival: RivalStableData; isSelected: boolean }) {
  return (
    <div className="flex items-center gap-4 min-w-0">
      <div
        className={cn(
          'h-10 w-10 shrink-0 flex items-center justify-center rounded-none border transition-all motion-reduce:transition-none motion-reduce:transform-none overflow-hidden',
          isSelected
            ? 'border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]'
            : 'border-white/10 group-hover:border-white/20'
        )}
      >
        {rival.crest ? (
          <StableCrest crest={rival.crest} size="sm" />
        ) : (
          <div className="h-full w-full bg-neutral-800 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground">?</span>
          </div>
        )}
      </div>
      <AvatarForEntity
        entityId={rival.owner.id}
        entityType="owner"
        source={rival.owner}
        size={40}
        className={cn(
          'shrink-0 border transition-all motion-reduce:transition-none',
          isSelected ? 'border-primary/60' : 'border-white/10 group-hover:border-white/20'
        )}
      />
      <div className="space-y-1 min-w-0">
        <span
          className={cn(
            'block font-display font-black text-sm uppercase tracking-tight transition-colors truncate motion-reduce:transition-none',
            isSelected ? 'text-primary' : 'text-foreground'
          )}
        >
          {rival.owner.stableName}
        </span>
        <div className="flex items-center gap-2 flex-wrap text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          <span className="flex items-center gap-1 font-mono">
            <Users className="h-3 w-3" />
            {rival.roster.filter((w) => isActive(w)).length}
          </span>
          <span className="h-1 w-1 rounded-full bg-border/40" />
          <span className="text-primary/60">{rival.owner.personality}</span>
          {rival.philosophy && (
            <>
              <span className="h-1 w-1 rounded-full bg-border/40" />
              <span className="text-accent/60">{rival.philosophy}</span>
            </>
          )}
          {rival.owner.metaAdaptation && (
            <>
              <span className="h-1 w-1 rounded-full bg-border/40" />
              <span className="text-muted-foreground/40">{rival.owner.metaAdaptation}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Grudge-intensity flame meter (one flame per intensity point). */
export function GrudgeFlames({ intensity }: { intensity: number }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0 ml-2">
      {Array.from({ length: intensity }).map((_, i) => (
        <Flame
          key={`flame-${i}`}
          className="h-3 w-3 text-arena-blood"
          style={{ opacity: 0.4 + i * 0.12 }}
        />
      ))}
    </div>
  );
}
