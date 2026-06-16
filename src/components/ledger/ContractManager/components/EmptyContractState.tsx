import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export function EmptyContractState() {
  return (
    <div className="py-24 text-center flex flex-col items-center gap-6 group">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
        <GraduationCap className="h-16 w-16 text-muted-foreground opacity-20 relative z-10 group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">
          The_Academy_Is_Offline
        </p>
        <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
          No specialists are currently under contract. Institutional growth is stagnant. Access the
          recruitment terminal to restore faculty operations.
        </p>
      </div>
      <Link to="/stable/recruit" className="mt-4">
        <Button>Access_Recruitment_Hub</Button>
      </Link>
    </div>
  );
}
