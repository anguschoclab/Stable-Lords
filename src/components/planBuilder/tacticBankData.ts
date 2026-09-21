import { Zap, Swords, Shield, Target, Activity, Flame, Clock } from 'lucide-react';

/**
 * Tactic_bank.
 */
export const TACTIC_BANK = [
  { id: 'Lunge', type: 'offensive', label: 'Lunge', icon: Zap },
  { id: 'Slash', type: 'offensive', label: 'Slash', icon: Swords },
  { id: 'Bash', type: 'offensive', label: 'Bash', icon: Shield },
  { id: 'Decisiveness', type: 'offensive', label: 'DEC', icon: Target },
  { id: 'Dodge', type: 'defensive', label: 'Dodge', icon: Activity },
  { id: 'Parry', type: 'defensive', label: 'Parry', icon: Shield },
  { id: 'Riposte', type: 'defensive', label: 'Riposte', icon: Flame },
  { id: 'Responsiveness', type: 'defensive', label: 'RESP', icon: Clock },
] as const;
