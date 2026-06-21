import { Crown, Shield, Trophy, Star } from 'lucide-react';

/**
 *
 */
export function AwardIcon({ type }: { type: string }) {
  switch (type) {
    case 'WARRIOR_OF_YEAR':
      return <Crown className="h-4 w-4 text-arena-gold" />;
    case 'KILLER_OF_YEAR':
      return <Shield className="h-4 w-4 text-arena-blood" />;
    case 'STABLE_OF_YEAR':
      return <Trophy className="h-4 w-4 text-primary" />;
    default:
      return <Star className="h-4 w-4 text-muted-foreground" />;
  }
}
