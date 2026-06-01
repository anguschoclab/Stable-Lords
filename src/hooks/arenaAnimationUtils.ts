import type { FighterPose, SpeechBubble, ArenaState } from '@/types/arena.types';
import type { MinuteEvent } from '@/types/combat.types';
import { classifyEvent } from '@/lib/boutUtils';

const MIN_DISTANCE = 20; // Minimum distance between fighters

export function getBubbleFromEvent(
  event: MinuteEvent,
  index: number
): SpeechBubble | null {
  const type = classifyEvent(event);

  // Check for taunt-worthy events
  if (type === 'crit' || type === 'death') {
    const speaker = event.text.toLowerCase().includes('hit') ? 'A' : 'D';
    const isA = speaker === 'A';

    if (type === 'crit') {
      return {
        id: `bubble-${index}`,
        text: isA ? 'A devastating strike!' : 'Incredible counter!',
        speaker,
        duration: 2000,
        type: 'crit',
      };
    }

    if (type === 'death') {
      return {
        id: `bubble-${index}`,
        text: isA ? 'That swing insulted my ancestors!' : 'Pathetic!',
        speaker: isA ? 'D' : 'A', // Taunt from victor
        duration: 3000,
        type: 'death',
      };
    }
  }

  // Taunt lines from certain phrases
  const eventText = event.text.toLowerCase();
  if (eventText.includes('taunt') || eventText.includes('insult')) {
    return {
      id: `bubble-${index}`,
      text: 'You fight like a coward!',
      speaker: 'A',
      duration: 2500,
      type: 'taunt',
    };
  }

  return null;
}

export function processArenaEvent(
  prev: ArenaState,
  event: MinuteEvent,
  index: number,
  nameA: string,
  nameD: string
): ArenaState {
  const type = classifyEvent(event);
  const text = event.text.toLowerCase();
  const newState = { ...prev };

  // Determine which fighter is acting
  const isActingA =
    text.includes(nameA?.toLowerCase() ?? '') ||
    (!text.includes(nameD?.toLowerCase() ?? '') &&
      (text.includes('attacks') || text.includes('strikes')));

  const actor = isActingA ? 'A' : 'D';
  const victim = actor === 'A' ? 'D' : 'A';

  // Update poses based on event type
  switch (type) {
    case 'hit':
    case 'crit':
      // Actor lunges forward, victim flinches
      if (actor === 'A') {
        newState.fighterA = {
          ...prev.fighterA,
          x: Math.min(prev.fighterA.x + 8, prev.fighterD.x - MIN_DISTANCE),
          y: -3,
          stance: 'lunging',
        };
        newState.fighterD = {
          ...prev.fighterD,
          x: Math.min(prev.fighterD.x + 2, 95),
          stance: 'defending',
        };
      } else {
        newState.fighterD = {
          ...prev.fighterD,
          x: Math.max(prev.fighterD.x - 8, prev.fighterA.x + MIN_DISTANCE),
          y: -3,
          stance: 'lunging',
        };
        newState.fighterA = {
          ...prev.fighterA,
          x: Math.max(prev.fighterA.x - 2, 5),
          stance: 'defending',
        };
      }
      break;

    case 'miss':
      // Actor overextends, victim retreats slightly
      if (actor === 'A') {
        newState.fighterA = {
          ...prev.fighterA,
          x: Math.min(prev.fighterA.x + 5, 45),
          stance: 'advancing',
        };
        newState.fighterD = {
          ...prev.fighterD,
          x: Math.min(prev.fighterD.x + 3, 95),
          stance: 'retreating',
        };
      } else {
        newState.fighterD = {
          ...prev.fighterD,
          x: Math.max(prev.fighterD.x - 5, 55),
          stance: 'advancing',
        };
        newState.fighterA = {
          ...prev.fighterA,
          x: Math.max(prev.fighterA.x - 3, 5),
          stance: 'retreating',
        };
      }
      break;

    case 'riposte':
      // Both exchange positions
      if (actor === 'A') {
        newState.fighterA = {
          ...prev.fighterA,
          x: Math.min(prev.fighterA.x + 4, prev.fighterD.x - MIN_DISTANCE),
          stance: 'defending',
        };
        newState.fighterD = {
          ...prev.fighterD,
          x: Math.max(prev.fighterD.x - 6, prev.fighterA.x + MIN_DISTANCE),
          y: -2,
          stance: 'lunging',
        };
      } else {
        newState.fighterD = {
          ...prev.fighterD,
          x: Math.max(prev.fighterD.x - 4, prev.fighterA.x + MIN_DISTANCE),
          stance: 'defending',
        };
        newState.fighterA = {
          ...prev.fighterA,
          x: Math.min(prev.fighterA.x + 6, prev.fighterD.x - MIN_DISTANCE),
          y: -2,
          stance: 'lunging',
        };
      }
      break;

    case 'death':
    case 'ko':
      // Victor stands triumphantly, victim falls
      if (victim === 'A') {
        newState.fighterA = {
          ...prev.fighterA,
          y: 15,
          stance: 'defeated',
        };
        newState.fighterD = {
          ...prev.fighterD,
          stance: 'victorious',
        };
      } else {
        newState.fighterD = {
          ...prev.fighterD,
          y: 15,
          stance: 'defeated',
        };
        newState.fighterA = {
          ...prev.fighterA,
          stance: 'victorious',
        };
      }
      break;

    case 'exhaust':
      // Fighter slows down
      if (text.includes(nameA?.toLowerCase() ?? '')) {
        newState.fighterA = {
          ...prev.fighterA,
          stance: 'stunned',
        };
      } else {
        newState.fighterD = {
          ...prev.fighterD,
          stance: 'stunned',
        };
      }
      break;

    case 'initiative':
      // Fighter seizes initiative - advances
      if (actor === 'A') {
        newState.fighterA = {
          ...prev.fighterA,
          x: Math.min(prev.fighterA.x + 5, prev.fighterD.x - MIN_DISTANCE),
          stance: 'advancing',
        };
      } else {
        newState.fighterD = {
          ...prev.fighterD,
          x: Math.max(prev.fighterD.x - 5, prev.fighterA.x + MIN_DISTANCE),
          stance: 'advancing',
        };
      }
      break;

    default: {
      // Gradual return to neutral spacing
      const targetDist = 30;
      const currentDist = prev.fighterD.x - prev.fighterA.x;
      if (currentDist > targetDist + 5) {
        const adjust = (currentDist - targetDist) / 4;
        newState.fighterA = {
          ...prev.fighterA,
          x: prev.fighterA.x + adjust * 0.3,
          y: 0,
          stance: prev.fighterA.stance === 'lunging' ? 'neutral' : prev.fighterA.stance,
        };
        newState.fighterD = {
          ...prev.fighterD,
          x: prev.fighterD.x - adjust * 0.3,
          y: 0,
          stance: prev.fighterD.stance === 'lunging' ? 'neutral' : prev.fighterD.stance,
        };
      }
      break;
    }
  }

  // Add speech bubble if appropriate
  const bubble = getBubbleFromEvent(event, index);
  if (bubble) {
    newState.bubbles = [...prev.bubbles, bubble];
  }

  return newState;
}
