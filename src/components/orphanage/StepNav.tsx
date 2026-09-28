import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface StepNavProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon?: LucideIcon;
  nextDisabled?: boolean;
  nextSize?: 'lg';
  className?: string;
}

export default function StepNav({
  onBack,
  onNext,
  nextLabel,
  nextIcon: NextIcon = ArrowRight,
  nextDisabled,
  nextSize,
  className = 'flex gap-3',
}: StepNavProps) {
  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={onBack}
        className="gap-2 border-[rgba(var(--oak-rgb),_0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
        size={nextSize}
      >
        {nextLabel} <NextIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
