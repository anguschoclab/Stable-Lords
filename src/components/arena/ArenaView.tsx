import { useEffect } from "react";
import { cn } from "@/lib/utils";
import ArenaBackground from "./ArenaBackground";
import ArenaFighter from "./ArenaFighter";
import SpeechBubble from "./SpeechBubble";
import MiniCombatLog from "./MiniCombatLog";
import { useArenaAnimation, setFighterNames } from "@/hooks/useArenaAnimation";
import type { MinuteEvent } from "@/types/combat.types";
import type { Gear, FightingStyle } from "@/types/game";
import type { ArenaTier } from "./ArenaBackground";

interface ArenaViewProps {
  nameA: string;
  nameD: string;
  styleA: FightingStyle;
  styleD: FightingStyle;
  log: MinuteEvent[];
  winner: "A" | "D" | null;
  by?: string;
  visibleCount: number;
  isPlaying?: boolean;
  isComplete?: boolean;
  arenaTier?: ArenaTier;
  weather?: string;
  gearA?: Gear;
  gearD?: Gear;
  maxHpA?: number;
  maxHpD?: number;
  transcript?: string[];
  className?: string;
}

export default function ArenaView({
  nameA,
  nameD,
  styleA,
  styleD,
  log,
  winner,
  visibleCount,
  isPlaying,
  isComplete = false,
  arenaTier = "standard",
  weather = "Clear",
  gearA,
  gearD,
  maxHpA = 50,
  maxHpD = 50,
  className,
}: ArenaViewProps) {
  // Set fighter names for text matching
  useEffect(() => {
    setFighterNames(nameA, nameD);
  }, [nameA, nameD]);

  // Arena animation state
  const {
    fighterA,
    fighterD,
    bubbles,
    hpA,
    hpD,
    fpA,
    fpD,
    removeBubble,
  } = useArenaAnimation(log, visibleCount, maxHpA, maxHpD, winner, isComplete);

  // Determine if fighters are dead
  const isDeadA = isComplete && winner === "D";
  const isDeadD = isComplete && winner === "A";
  const isWinnerA = isComplete && winner === "A";
  const isWinnerD = isComplete && winner === "D";

  return (
    <div className={cn("relative w-full h-[400px] overflow-hidden rounded-none", className)}>
      {/* Arena Background */}
      <ArenaBackground 
        tier={arenaTier} 
        weather={weather}
        className="absolute inset-0"
      />

      {/* Speech Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute"
          style={{
            left: bubble.speaker === "A" ? `${fighterA.x}%` : `${fighterD.x}%`,
            bottom: bubble.speaker === "A" ? `${40 + fighterA.y}%` : `${40 + fighterD.y}%`,
            transform: "translateX(-50%)",
            zIndex: 20,
          }}
        >
          <SpeechBubble
            bubble={bubble}
            position={bubble.speaker === "A" ? "left" : "right"}
            onDismiss={removeBubble}
          />
        </div>
      ))}

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
        weaponName={gearA?.weapon?.name}
        shieldName={gearA?.shield}
        isWinner={isWinnerA}
        isDead={isDeadA}
        isActive={fighterA.stance === "lunging" || fighterA.stance === "advancing"}
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
        weaponName={gearD?.weapon?.name}
        shieldName={gearD?.shield}
        isWinner={isWinnerD}
        isDead={isDeadD}
        isActive={fighterD.stance === "lunging" || fighterD.stance === "advancing"}
      />

      {/* Mini Combat Log - positioned at bottom */}
      <div className="absolute bottom-4 left-4 right-4">
        <MiniCombatLog
          events={log}
          visibleCount={visibleCount}
          isPlaying={!!isPlaying}
        />
      </div>
    </div>
  );
}
