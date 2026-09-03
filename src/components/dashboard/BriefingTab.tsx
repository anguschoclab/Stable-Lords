import { useMemo } from 'react';
import { Info, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import type { NewsletterItem } from '@/types/state.types';

interface BriefingTabProps {
  reports: NewsletterItem[];
}

/**
 *
 */
export function BriefingTab({ reports }: BriefingTabProps) {
  const state = useGameStore(
    useShallow((s: any) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
      player: s.player,
    }))
  );

  const warriorNames = useMemo(() => {
    const names = new Set<string>();
    for (const w of state.roster ?? []) names.add(w.name);
    for (const w of state.graveyard ?? []) names.add(w.name);
    for (const w of state.retired ?? []) names.add(w.name);
    for (const r of state.rivals ?? []) {
      for (const w of r.roster) names.add(w.name);
    }
    return [...names];
  }, [state.roster, state.graveyard, state.retired, state.rivals]);

  const stableNames = useMemo(() => {
    const names = new Set<string>();
    if (state.player?.stableName) names.add(state.player.stableName);
    for (const r of state.rivals ?? []) {
      if (r.owner?.stableName) names.add(r.owner.stableName);
    }
    return [...names];
  }, [state.player, state.rivals]);

  return (
    <ScrollArea className="h-72 px-6">
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 opacity-20">
          <Info className="h-8 w-8 mb-4 text-arena-gold" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">No News</p>
        </div>
      ) : (
        <div className="py-6 space-y-8">
          {reports.map((report, i) => (
            <div
              key={`${report.title.slice(0, 30)}-${i}`}
              className="group/report relative space-y-3 bg-white/[0.02] border border-white/5 rounded-none p-4 hover:border-arena-gold/30 transition-all motion-reduce:transition-none motion-reduce:transform-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-none bg-arena-gold/10 border border-arena-gold/20">
                    <Zap className="h-3 w-3 text-arena-gold" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-arena-gold opacity-60 uppercase tracking-widest">
                    Week {report.week} Report
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-black uppercase tracking-tight text-arena-gold/80 group-hover/report:text-arena-gold transition-colors motion-reduce:transition-none">
                <LinkifiedText text={report.title} names={warriorNames} stableNames={stableNames} />
              </h4>

              <ul className="space-y-2">
                {report.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex gap-3 text-[10px] text-muted-foreground leading-relaxed"
                  >
                    <span className="text-arena-gold/40 font-mono mt-0.5">[{j + 1}]</span>
                    <span className="flex-1">
                      <LinkifiedText text={item} names={warriorNames} stableNames={stableNames} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="h-6" />
    </ScrollArea>
  );
}
