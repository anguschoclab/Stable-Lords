import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface CreateButtonProps {
  disabled: boolean;
  onClick: () => void;
  status: 'roster-full' | 'invalid' | 'valid';
  remaining: number;
}

export function CreateButton({ disabled, onClick, status, remaining }: CreateButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} size="lg" className="w-full gap-2">
      <UserPlus className="h-4 w-4" />
      {status === 'roster-full'
        ? 'Roster Full'
        : status === 'invalid'
          ? remaining !== 0
            ? `${Math.abs(remaining)} points ${remaining > 0 ? 'remaining' : 'over'}`
            : 'Name required'
          : 'Recruit Warrior'}
    </Button>
  );
}
