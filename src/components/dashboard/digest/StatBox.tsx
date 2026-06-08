import { cn } from '@/lib/utils';

/** Individual stat box for digest grid */
export interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'primary' | 'destructive' | 'arena-gold' | 'accent';
}

export function StatBox({ icon, label, value, color }: StatBoxProps) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    destructive: 'text-destructive bg-destructive/10',
    'arena-gold': 'text-arena-gold bg-arena-gold/10',
    accent: 'text-accent bg-accent/10',
  };

  return (
    <div className={cn('p-2 rounded-none text-center', colorClasses[color])}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-black font-mono">{value}</div>
      <div className="text-[9px] uppercase font-bold opacity-70">{label}</div>
    </div>
  );
}
