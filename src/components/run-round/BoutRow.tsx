import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import BoutViewer from '@/components/BoutViewer';
import { Badge } from '@/components/ui/badge';
import type { BoutResult } from '@/engine/bout';
import { buildFightAnalysis } from '@/engine/narrative/fightAnalysis';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { OutcomeIcon } from './OutcomeIcon';

interface BoutRowProps {
  res: BoutResult;
  id: string;
  isExpanded: boolean;
  onToggleExpand: (id: string | null) => void;
}

/** Fighter name cell — accent bar + name, winner highlighted; mirrored via `right`. */
function FighterCell({ name, isWinner, right }: { name: string; isWinner: boolean; right?: boolean }) {
  const bar = (
    <div
      className={cn(
        'w-1.5 h-6 rounded-none',
        isWinner ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/5'
      )}
    />
  );
  const label = (
    <span
      className={cn(
        'font-display font-black uppercase text-xs tracking-tight',
        isWinner ? 'text-primary' : 'text-muted-foreground/40'
      )}
    >
      {name}
    </span>
  );
  return (
    <div className={cn('flex items-center gap-3 min-w-36', right && 'justify-end text-right')}>
      {right ? (
        <>
          {label}
          {bar}
        </>
      ) : (
        <>
          {bar}
          {label}
        </>
      )}
    </div>
  );
}

/** Collapsed row face — fighters, outcome badge, expand chevron. */
function RowTrigger({ res, isExpanded }: { res: BoutResult; isExpanded: boolean }) {
  const isWinnerA = res.outcome.winner === 'A';
  const isWinnerD = res.outcome.winner === 'D';
  return (
    <CollapsibleTrigger asChild>
      <div className="p-4 cursor-pointer flex items-center justify-between group">
        <div className="flex items-center gap-6 flex-1">
          <FighterCell name={res.a.name} isWinner={isWinnerA} />

          <div className="flex flex-col items-center gap-1.5 px-4">
            <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">
              VS
            </span>
            <Badge
              variant="outline"
              className="text-[8px] font-black uppercase tracking-widest h-4 bg-white/[0.02] border-white/5 px-2"
            >
              {res.outcome.by}
            </Badge>
          </div>

          <FighterCell name={res.d.name} isWinner={isWinnerD} right />
        </div>

        <div className="flex items-center gap-4 ml-6">
          <div className="flex items-center gap-2">
            <OutcomeIcon by={res.outcome.by} />
          </div>
          <div
            className={cn('h-8 w-8 flex items-center justify-center border border-white/5 transition-colors motion-reduce:transition-none',
              isExpanded
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-white/[0.02] text-muted-foreground/40 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20'
            )}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
    </CollapsibleTrigger>
  );
}

/** Expanded bout body — full BoutViewer with fight analysis. */
function ExpandedViewer({ res }: { res: BoutResult }) {
  const zeroSkills = { ATT: 0, PAR: 0, DEF: 0, INI: 0, RIP: 0, DEC: 0 };
  const analysis = buildFightAnalysis(
    res.outcome,
    {
      id: res.a.id,
      name: res.a.name,
      style: res.a.style,
      attributes: res.a.attributes,
      skills: res.a.baseSkills ?? zeroSkills,
    },
    {
      id: res.d.id,
      name: res.d.name,
      style: res.d.style,
      attributes: res.d.attributes,
      skills: res.d.baseSkills ?? zeroSkills,
    }
  );
  return (
    <CollapsibleContent>
      <div className="px-4 pb-4 border-t border-white/5 bg-black/20 pt-4">
        <BoutViewer
          nameA={res.a.name}
          nameD={res.d.name}
          styleA={res.a.style}
          styleD={res.d.style}
          log={res.outcome.log}
          winner={res.outcome.winner}
          by={res.outcome.by}
          announcement={res.announcement}
          isRivalry={res.isRivalry}
          analysis={analysis}
          exchangeLog={res.outcome.exchangeLog}
          weaponIdA={res.a.equipment?.weapon}
          weaponIdD={res.d.equipment?.weapon}
          warriorA={res.a}
          warriorD={res.d}
        />
      </div>
    </CollapsibleContent>
  );
}

/**
 *
 */
export function BoutRow({ res, id, isExpanded, onToggleExpand }: BoutRowProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(isExpanded ? null : id)}>
      <Surface
        variant="glass"
        padding="none"
        className={cn(
          'border-white/5 transition-all motion-reduce:transition-none motion-reduce:transform-none overflow-hidden',
          isExpanded
            ? 'border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
            : 'hover:border-white/20'
        )}
      >
        <RowTrigger res={res} isExpanded={isExpanded} />
        <ExpandedViewer res={res} />
      </Surface>
    </Collapsible>
  );
}
