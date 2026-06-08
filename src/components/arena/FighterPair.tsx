import ArenaFighter from './ArenaFighter';
import type { FighterPose } from '@/types/arena.types';
import type { FightingStyle } from '@/types/game';

interface FighterPairProps {
  // Fighter identities
  nameA: string;
  nameD: string;
  styleA: FightingStyle;
  styleD: FightingStyle;
  // Fighter poses from useArenaAnimation
  fighterA: FighterPose;
  fighterD: FighterPose;
  // Stats
  hpA: number;
  hpD: number;
  fpA: number;
  fpD: number;
  maxHpA: number;
  maxHpD: number;
  // Status
  isWinnerA: boolean;
  isWinnerD: boolean;
  isDeadA: boolean;
  isDeadD: boolean;
}

/**
 * Renders both arena fighters with their stats and status.
 * Extracts duplicate ArenaFighter prop assembly from ArenaView.
 */
export default function FighterPair({
  nameA,
  nameD,
  styleA,
  styleD,
  fighterA,
  fighterD,
  hpA,
  hpD,
  fpA,
  fpD,
  maxHpA,
  maxHpD,
  isWinnerA,
  isWinnerD,
  isDeadA,
  isDeadD,
}: FighterPairProps) {
  return (
    <>
      {/* Fighter A */}
      <ArenaFighter
        name={nameA}
        pose={fighterA}
        stats={{
          maxHp: maxHpA,
          currentHp: hpA,
          maxFp: 100,
          currentFp: fpA,
        }}
        style={styleA}
        isWinner={isWinnerA}
        isDead={isDeadA}
        isActive={fighterA.stance === 'lunging' || fighterA.stance === 'advancing'}
      />

      {/* Fighter D */}
      <ArenaFighter
        name={nameD}
        pose={fighterD}
        stats={{
          maxHp: maxHpD,
          currentHp: hpD,
          maxFp: 100,
          currentFp: fpD,
        }}
        style={styleD}
        isWinner={isWinnerD}
        isDead={isDeadD}
        isActive={fighterD.stance === 'lunging' || fighterD.stance === 'advancing'}
      />
    </>
  );
}
