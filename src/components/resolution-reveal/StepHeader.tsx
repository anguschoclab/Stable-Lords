import type { LucideIcon } from 'lucide-react';

interface StepHeaderProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  className?: string;
}

/** Shared step heading — icon + title row atop each reveal step. */
export function StepHeader({ icon: Icon, iconClassName, title, className }: StepHeaderProps) {
  return (
    <div className={`flex items-center gap-2${className ? ` ${className}` : ''}`}>
      <Icon className={`h-6 w-6${iconClassName ? ` ${iconClassName}` : ''}`} />
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
  );
}
