import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Swords } from 'lucide-react';
import type { BoutResult } from '@/engine/bout';
import { RunResults } from '@/components/run-round/RunResults';
import uiMeta from '@/data/narrative/uiMeta.json';
import { StepHeader } from './StepHeader';
import { StepShell } from './StepShell';

interface BoutsStepProps {
  bouts: BoutResult[];
}

/**
 * Bouts step.
 * @param - { bouts }.
 */
export function BoutsStep({ bouts }: BoutsStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <StepShell className="flex flex-col">
      <StepHeader
        icon={Swords}
        iconClassName="text-primary"
        title={uiMeta.fanfare.report_combat}
        className="mb-6 shrink-0"
      />
      <ScrollArea className="flex-1 pr-4">
        {bouts.length > 0 ? (
          <RunResults results={bouts} expandedId={expandedId} onToggleExpand={setExpandedId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            {uiMeta.fanfare.report_combat_empty}
          </div>
        )}
      </ScrollArea>
    </StepShell>
  );
}
