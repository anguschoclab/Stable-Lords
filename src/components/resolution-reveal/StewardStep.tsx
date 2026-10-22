import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import uiMeta from '@/data/narrative/uiMeta.json';
import type { GameState } from '@/types/state.types';
import { WarriorNameAvatar } from '@/components/avatar';
import { StepHeader } from './StepHeader';
import { StepShell } from './StepShell';

interface StewardStepProps {
  stewardReport: GameState['stewardReport'];
}

/** The two headline cards: treasury change + training-outcome count. */
function SummaryCards({ stewardReport }: StewardStepProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-secondary/10">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-medium">Weekly Treasury Change</CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div
            className={`text-2xl font-mono font-bold ${(stewardReport?.treasuryChange ?? 0) >= 0 ? 'text-primary' : 'text-arena-gold'}`}
          >
            {stewardReport?.treasuryChange && stewardReport.treasuryChange > 0
              ? '+'
              : ''}
            {stewardReport?.treasuryChange ?? 0} GC
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/10">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-medium">Training Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="text-2xl font-mono font-bold text-primary">
            {stewardReport?.trainingGains.length ?? 0} Improvements
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Scrolling ledger of per-warrior gains plus aging-event flags. */
function TrainingAndAging({ stewardReport }: StewardStepProps) {
  const isEmpty =
    !stewardReport ||
    (stewardReport.trainingGains.length === 0 &&
      stewardReport.agingEvents.length === 0);
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Training & Aging
      </h4>
      <ScrollArea className="h-[200px] border rounded-none p-4 bg-muted/30">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            {uiMeta.fanfare.report_steward_empty}
          </div>
        ) : (
          <div className="space-y-4">
            {stewardReport.trainingGains.map(
              (
                g: { warriorId?: string; warriorName: string; gain: number; attr: string },
                i: number
              ) => (
                <div
                  key={`${g.warriorId ?? g.warriorName}-${g.attr}-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium flex items-center gap-2">
                    <WarriorNameAvatar warriorId={g.warriorId} name={g.warriorName} size="xs" />
                    {g.warriorName}
                  </span>
                  <div className="flex gap-2 font-mono">
                    <Badge variant="outline" className="text-primary">
                      +{g.gain} {g.attr}
                    </Badge>
                  </div>
                </div>
              )
            )}
            {stewardReport.agingEvents.map((e: string, i: number) => (
              <div key={`age-${i}`} className="text-sm text-arena-gold">
                <span className="font-bold mr-2">!</span> {e}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/**
 * Steward step.
 * @param - { steward report }.
 */
export function StewardStep({ stewardReport }: StewardStepProps) {
  return (
    <StepShell className="space-y-6">
      <StepHeader
        icon={Activity}
        iconClassName="text-muted-foreground"
        title={uiMeta.fanfare.report_steward}
      />

      <SummaryCards stewardReport={stewardReport} />
      <TrainingAndAging stewardReport={stewardReport} />
    </StepShell>
  );
}
