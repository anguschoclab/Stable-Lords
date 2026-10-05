import { MinuteEvent } from '@/types/game';

type EventClass =
  | 'hit'
  | 'miss'
  | 'crit'
  | 'death'
  | 'ko'
  | 'exhaust'
  | 'status'
  | 'riposte'
  | 'initiative'
  | 'phase'
  | 'spatial';

/**
 * Ordered keyword rules — first match wins, so lethal/exhaust/crit patterns
 * must outrank the generic hit/miss vocabulary below them.
 */
const TEXT_RULES: readonly (readonly [EventClass, readonly string[]])[] = [
  ['death', ['kill', 'death', 'slain', 'fatal']],
  ['ko', ['knocked out', 'ko', 'unconscious', 'no longer continue']],
  ['exhaust', ['exhausted', 'exhaustion', 'tiring', 'sluggish']],
  ['crit', ['devastating', 'critical', 'massive', 'lethal']],
  ['riposte', ['counter-attack', 'riposte']],
  ['initiative', ['initiative', 'seizes']],
  [
    'spatial',
    [
      'range',
      'feint',
      'closes in',
      'backs away',
      'pushes',
      'forced to',
      'corner',
      'edge of',
      'center of',
    ],
  ],
  ['hit', ['damage', 'strikes', 'hits', 'lands', 'striking']],
  ['miss', ['miss', 'parr', 'dodge', 'turns', 'no opening', 'blocks']],
];

/**
 * Classify event.
 */
export function classifyEvent(event: MinuteEvent | string): EventClass {
  const text = typeof event === 'string' ? event : event.text;

  if (text.startsWith('—') && text.includes('Phase')) return 'phase';

  if (typeof event !== 'string') {
    // Check raw events for metadata first
    const hasCrit = event.events?.some((e) => e.metadata?.critical || e.metadata?.lethal);
    if (hasCrit) return 'crit';
    // Arena phenomena are spatial by nature — tag-venue hazards narrated
    // via ARENA_EVENT carry their source CombatEvent for classification.
    if (event.events?.some((e) => e.type === 'ARENA_EVENT')) return 'spatial';
  }

  const t = text.toLowerCase();
  for (const [cls, keywords] of TEXT_RULES) {
    if (keywords.some((k) => t.includes(k))) return cls;
  }
  return 'status';
}
