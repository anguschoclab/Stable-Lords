import { Link } from '@tanstack/react-router';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { ShieldCheck, FileSignature, Dumbbell, Swords, CheckCircle2 } from 'lucide-react';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import type { CouncilDirective } from '@/engine/advisor';

const KIND_ICON = {
  'unsigned-offer': FileSignature,
  'unassigned-training': Dumbbell,
  'unapplied-tactics': Swords,
} as const;

/**
 * Pre-Advance Checklist — surfaces council recommendations that have not yet
 * been applied to live state, so nothing is forgotten before the week runs.
 * The complementary manual-play counterpart to War Council Autopilot.
 */
export function PreAdvanceChecklist() {
  const { unresolvedDirectives } = useStableAdvisor();

  return (
    <Surface variant="glass" className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImperialRing size="xs" variant={unresolvedDirectives.length > 0 ? 'gold' : 'blood'}>
            <ShieldCheck className="h-3.5 w-3.5 text-arena-gold" />
          </ImperialRing>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            War Council Checklist
          </span>
        </div>
        <Link
          to="/stable/advisor"
          className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
        >
          Open Council
        </Link>
      </div>

      {unresolvedDirectives.length === 0 ? (
        <div className="flex items-center gap-3 text-muted-foreground/60">
          <CheckCircle2 className="h-4 w-4 text-arena-gold/70" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            All council directives resolved
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {unresolvedDirectives.map((d: CouncilDirective, i: number) => {
            const Icon = KIND_ICON[d.kind];
            return (
              <li key={`${d.warriorId}-${d.kind}-${i}`} className="flex items-center gap-3">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground/90 leading-snug">
                  {d.warriorName}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/70 leading-snug">
                  {d.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
