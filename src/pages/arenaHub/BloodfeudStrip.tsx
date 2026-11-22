import { Skull, Crosshair } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { WarriorLink } from '@/components/EntityLink';
import { useBloodfeudMarks, type PlayerBloodfeud } from '@/hooks/useBloodfeudMarks';

/** Single feud row — direction icon, linked killer, expiry readout. */
function FeudRow({ feud }: { feud: PlayerBloodfeud }) {
  const owed = feud.direction === 'owed';
  return (
    <li className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {owed ? (
          <Skull className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <Crosshair className="h-3.5 w-3.5 text-arena-gold shrink-0 mt-0.5" />
        )}
        <p className="text-[11px] text-muted-foreground/80 leading-snug">
          {owed ? (
            <>
              <WarriorLink name={feud.killerName} id={feud.killerWarriorId} />{' '}
              <span className="text-muted-foreground/50">({feud.opposingStableName})</span> slew{' '}
              {feud.victimName ?? 'one of your warriors'} — any of your warriors takes the priority
              booking
            </>
          ) : (
            <>
              <WarriorLink name={feud.killerName} id={feud.killerWarriorId} /> is marked —{' '}
              {feud.opposingStableName} holds a bloodfeud for your kill
            </>
          )}
        </p>
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-destructive/70 whitespace-nowrap">
        {feud.weeksLeft}w left
      </span>
    </li>
  );
}

/**
 * Bloodfeud Ledger — the live V24/V26 feud entitlements touching the player's
 * stable, surfaced beside the fight card where booking decisions are read.
 * Renders nothing when no feud is live (the common case).
 */
export function BloodfeudStrip() {
  const feuds = useBloodfeudMarks();
  if (feuds.length === 0) return null;

  return (
    <Surface variant="glass" className="p-6 space-y-4 border-destructive/10">
      <div className="flex items-center gap-3">
        <Skull className="h-3.5 w-3.5 text-destructive opacity-60" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80">
          Bloodfeud Ledger
        </span>
      </div>
      <ul className="space-y-2">
        {feuds.map((feud) => (
          <FeudRow key={`${feud.direction}-${feud.mark.killerWarriorId}`} feud={feud} />
        ))}
      </ul>
    </Surface>
  );
}
