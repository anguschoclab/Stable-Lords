import SpeechBubble from './SpeechBubble';
import type { SpeechBubble as SpeechBubbleType, FighterPose } from '@/types/arena.types';

interface SpeechBubblesProps {
  bubbles: SpeechBubbleType[];
  fighterA: FighterPose;
  fighterD: FighterPose;
  onDismiss: (id: string) => void;
}

/**
 * Renders speech bubbles positioned above fighters.
 * Extracts bubble positioning logic from ArenaView.
 */
export default function SpeechBubbles({
  bubbles,
  fighterA,
  fighterD,
  onDismiss,
}: SpeechBubblesProps) {
  if (bubbles.length === 0) return null;

  return (
    <>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute"
          style={{
            left: bubble.speaker === 'A' ? `${fighterA.x}%` : `${fighterD.x}%`,
            bottom: bubble.speaker === 'A' ? `${40 + fighterA.y}%` : `${40 + fighterD.y}%`,
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <SpeechBubble
            bubble={bubble}
            position={bubble.speaker === 'A' ? 'left' : 'right'}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </>
  );
}
