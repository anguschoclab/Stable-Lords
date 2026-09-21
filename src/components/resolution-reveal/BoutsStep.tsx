import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Swords } from 'lucide-react';
import type { BoutResult } from '@/engine/bout';
import { RunResults } from '@/components/run-round/RunResults';
import uiMeta from '@/data/narrative/uiMeta.json';

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
    <motion.div
      key="bouts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Swords className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">{uiMeta.fanfare.report_combat}</h3>
      </div>
      <ScrollArea className="flex-1 pr-4">
        {bouts.length > 0 ? (
          <RunResults results={bouts} expandedId={expandedId} onToggleExpand={setExpandedId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            {uiMeta.fanfare.report_combat_empty}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
