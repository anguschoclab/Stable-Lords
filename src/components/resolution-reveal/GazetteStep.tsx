import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Newspaper } from 'lucide-react';
import type { NewsletterItem } from '@/types/shared.types';
import narrativeContent from '@/data/narrativeContent.json';

interface GazetteStepProps {
  gazette: NewsletterItem[];
} /**
 * Gazette step.
 * @param - { gazette }.
 * @returns The result.
 */

/**
 * Gazette step.
 * @param - { gazette }.
 * @returns The result.
 */
export function GazetteStep({ gazette }: GazetteStepProps) {
  return (
    <motion.div
      key="gazette"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">The Weekly Gazette</h3>
      </div>
      <ScrollArea className="h-[calc(100%-4rem)] pr-4">
        {gazette.length > 0 ? (
          <div className="space-y-6">
            {gazette.map((item: NewsletterItem, i: number) => (
              <div
                key={`${item.title.slice(0, 30)}-${i}`}
                className="space-y-2 border-l-2 border-primary/50 pl-4"
              >
                <h4 className="text-lg font-bold font-display leading-tight">{item.title}</h4>
                <ul className="list-disc list-inside space-y-1">
                  {item.items.map((line: string, li: number) => (
                    <li
                      key={`${line.slice(0, 30)}-${li}`}
                      className="text-sm text-muted-foreground"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            {narrativeContent.fanfare.gazette_empty}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
