import { useEffect } from 'react';
import { X, Skull, Swords, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BoutResult } from '@/engine/bout';

interface ResultsBannerProps {
  week: number;
  results: BoutResult[];
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 8000;

/**
 * Slim banner that appears in AppShell after a week executes.
 * Shows W/L/K summary and any deaths. Auto-dismisses after 8 seconds.
 */
export function ResultsBanner({ week, results, onDismiss }: ResultsBannerProps) {
  useEffect(() => {
    if (results.length === 0) return;
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [results, onDismiss]);

  if (results.length === 0) return null;

  // ⚡ Bolt: Single-pass loop to calculate results, replacing multiple .filter and .map operations.
  let wins = 0;
  let kills = 0;
  const deaths: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r) continue;
    if (r.outcome.winner === r.a.id) wins++;
    if (r.outcome.by === 'Kill') {
      kills++;
      deaths.push(r.outcome.winner === r.a.id ? r.d.name : r.a.name);
    }
  }
  const losses = results.length - wins;

  return (
    <div
      role="status"
      className="flex items-center gap-4 px-6 py-3 bg-primary/10 border-b border-primary/20 text-[10px] font-black uppercase tracking-[0.15em] animate-in motion-reduce:animate-none slide-in-from-top-2 duration-400"
    >
      <Swords className="h-3.5 w-3.5 text-primary shrink-0" />

      <span className="text-primary">Week {week} Complete</span>

      <div className="h-3 w-px bg-white/10" />

      <div className="flex items-center gap-4 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-primary" />
          <span className="text-primary">{wins}W</span>
          <span className="opacity-30">/</span>
          <span className="text-muted-foreground">{losses}L</span>
        </span>

        {kills > 0 && (
          <span className="flex items-center gap-1.5 text-destructive">
            <Skull className="h-3 w-3" />
            {deaths.join(', ')} fell in the arena
          </span>
        )}
      </div>

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="icon"
          tooltip="Dismiss results"
          aria-label="Dismiss results"
          onClick={onDismiss}
          className="h-6 w-6 rounded-none hover:bg-white/5"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
