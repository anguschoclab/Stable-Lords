import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReturnLinkProps {
  to: string;
  label: string;
  className?: string;
}

/** Compact back affordance for detail pages; always names the real parent. */
export function ReturnLink({ to, label, className }: ReturnLinkProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={cn(
        '-ml-4 opacity-60 transition-all hover:bg-transparent hover:opacity-100 motion-reduce:transition-none',
        className
      )}
    >
      <Link
        to={to}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em]"
      >
        <ArrowLeft className="h-3 w-3" /> {label}
      </Link>
    </Button>
  );
}
