import { AlertTriangle, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Alert box for important notifications */
export interface AlertBoxProps {
  type: 'death' | 'offer' | 'tournament';
  message: string;
}

export function AlertBox({ type, message }: AlertBoxProps) {
  const configs = {
    death: {
      icon: <AlertTriangle className="h-4 w-4" />,
      className: 'bg-destructive/10 border-destructive/30 text-destructive',
    },
    offer: {
      icon: <Target className="h-4 w-4" />,
      className: 'bg-arena-gold/10 border-arena-gold/30 text-arena-gold',
    },
    tournament: {
      icon: <Trophy className="h-4 w-4" />,
      className: 'bg-accent/10 border-accent/30 text-accent',
    },
  };

  const config = configs[type];

  return (
    <div
      className={cn('flex items-center gap-2 p-2 rounded-none border text-sm', config.className)}
    >
      {config.icon}
      <span className="font-medium">{message}</span>
    </div>
  );
}
