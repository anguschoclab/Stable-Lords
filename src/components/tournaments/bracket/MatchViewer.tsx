import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { resolveWarriorName } from '@/utils/historyResolver';
import BoutViewer from '@/components/BoutViewer';
import type { TournamentBout, FightSummary } from '@/types/game';

interface MatchViewerProps {
  bout: TournamentBout;
  fightSummary: FightSummary;
  gameState: any;
  onToggleExpand: (key: string | null) => void;
}

/**
 *
 */
export function MatchViewer({ bout, fightSummary, gameState, onToggleExpand }: MatchViewerProps) {
  return (
    <div className="absolute top-0 left-full ml-4 z-50 w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-300">
      <Surface
        variant="glass"
        padding="none"
        className="border-primary/50 shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 bg-secondary/40 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate max-w-[80%]">
            Archive: {resolveWarriorName(gameState, bout.warriorIdA, 'Unknown')} vs{' '}
            {resolveWarriorName(gameState, bout.warriorIdD, 'Unknown')}
          </span>
          <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10">
            {fightSummary.by || '???'}
          </Badge>
        </div>
        <div className="p-0 max-h-[500px] overflow-y-auto thin-scrollbar bg-background/60">
          <BoutViewer
            nameA={resolveWarriorName(gameState, fightSummary.warriorIdA, 'Unknown')}
            nameD={resolveWarriorName(gameState, fightSummary.warriorIdD, 'Unknown')}
            styleA={fightSummary.styleA || ''}
            styleD={fightSummary.styleD || ''}
            log={(fightSummary.transcript || []).map((text, idx) => ({
              minute: idx + 1,
              text,
            }))}
            winner={fightSummary.winner}
            by={fightSummary.by ?? null}
            isRivalry={fightSummary.isRivalry}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full rounded-none border-t border-white/5 h-10 text-[9px] font-black uppercase tracking-widest hover:bg-primary/5"
          onClick={() => onToggleExpand(null)}
        >
          Deactivate Archive
        </Button>
      </Surface>
    </div>
  );
}
