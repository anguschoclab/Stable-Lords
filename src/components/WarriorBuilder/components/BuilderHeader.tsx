import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';
import { ATTRIBUTE_TOTAL } from '@/types/game';

interface BuilderHeaderProps {
  preview: ReactNode;
  onRandomize: () => void;
}

/** Title row: heading, live avatar preview, and the randomize action. */
export function BuilderHeader({ preview, onRandomize }: BuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-display font-bold">Warrior Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Forge a new warrior for your stable. Allocate {ATTRIBUTE_TOTAL} points across 7
          attributes.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {preview}
        <Button variant="outline" onClick={onRandomize} className="gap-2">
          <Shuffle className="h-4 w-4" /> Randomize
        </Button>
      </div>
    </div>
  );
}
