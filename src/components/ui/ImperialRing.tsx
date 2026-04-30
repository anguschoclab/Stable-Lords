import { cn } from '@/lib/utils';

interface ImperialRingProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bronze' | 'gold' | 'blood';
}

export function ImperialRing({
  children,
  className,
  size = 'md',
  variant = 'bronze',
}: ImperialRingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 p-0.5',
    md: 'w-10 h-10 p-1',
    lg: 'w-14 h-14 p-1.5',
  };

  const variantClasses = {
    bronze: 'border-white/10 bg-neutral-900/50 shadow-[inset_0_0_10px_rgba(180,140,100,0.1)]',
    gold: 'border-arena-gold/30 bg-arena-gold/5 shadow-[0_0_15px_rgba(255,215,0,0.15)]',
    blood: 'border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(135,34,40,0.2)]',
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center border rounded-none transform rotate-45 shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <div className="transform -rotate-45 flex items-center justify-center w-full h-full">
        {children}
      </div>
      {/* Decorative corner accents */}
      <div className="absolute -top-[1px] -left-[1px] w-1 h-1 bg-inherit border-t border-l border-inherit" />
      <div className="absolute -bottom-[1px] -right-[1px] w-1 h-1 bg-inherit border-b border-r border-inherit" />
    </div>
  );
}
