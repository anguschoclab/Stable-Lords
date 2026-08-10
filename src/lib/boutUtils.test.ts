import { describe, it, expect } from 'vitest';
import { classifyEvent } from './boutUtils';
import { MinuteEvent } from '@/types/game';

describe('classifyEvent', () => {
  describe('string input', () => {
    it('classifies phase events starting with em-dash', () => {
      expect(classifyEvent('— Phase: OPENING')).toBe('phase');
      expect(classifyEvent('— Phase: MID')).toBe('phase');
    });

    it('does not classify as phase without em-dash prefix', () => {
      expect(classifyEvent('Phase: OPENING')).not.toBe('phase');
    });

    it('classifies death events by keyword', () => {
      expect(classifyEvent('A kills B')).toBe('death');
      expect(classifyEvent('sudden death strikes')).toBe('death');
      expect(classifyEvent('B is slain')).toBe('death');
      expect(classifyEvent('a fatal blow')).toBe('death');
    });

    it('classifies ko events by keyword', () => {
      expect(classifyEvent('knocked out cold')).toBe('ko');
      expect(classifyEvent('a KO finish')).toBe('ko');
      expect(classifyEvent('left unconscious')).toBe('ko');
      expect(classifyEvent('can no longer continue')).toBe('ko');
    });

    it('classifies exhaust events by keyword', () => {
      expect(classifyEvent('completely exhausted')).toBe('exhaust');
      expect(classifyEvent('exhaustion sets in')).toBe('exhaust');
      expect(classifyEvent('tiring rapidly')).toBe('exhaust');
      expect(classifyEvent('sluggish movement')).toBe('exhaust');
    });

    it('classifies crit events by keyword', () => {
      expect(classifyEvent('devastating strike')).toBe('crit');
      expect(classifyEvent('a critical hit')).toBe('crit');
      expect(classifyEvent('massive damage')).toBe('crit');
      expect(classifyEvent('a lethal blow')).toBe('crit');
    });

    it('classifies riposte events by keyword', () => {
      expect(classifyEvent('a counter-attack lands')).toBe('riposte');
      expect(classifyEvent('a riposte follows')).toBe('riposte');
    });

    it('classifies initiative events by keyword', () => {
      expect(classifyEvent('seizes initiative')).toBe('initiative');
      expect(classifyEvent('gains the initiative')).toBe('initiative');
      expect(classifyEvent('A seizes the moment')).toBe('initiative');
    });

    it('classifies spatial events by keyword', () => {
      expect(classifyEvent('closes in')).toBe('spatial');
      expect(classifyEvent('backs away')).toBe('spatial');
      expect(classifyEvent('pushes forward')).toBe('spatial');
      expect(classifyEvent('forced to retreat')).toBe('spatial');
      expect(classifyEvent('driven into the corner')).toBe('spatial');
      expect(classifyEvent('edge of the arena')).toBe('spatial');
      expect(classifyEvent('center of the arena')).toBe('spatial');
      expect(classifyEvent('a feint attempt')).toBe('spatial');
      expect(classifyEvent('out of range')).toBe('spatial');
    });

    it('classifies hit events by keyword', () => {
      expect(classifyEvent('deals damage')).toBe('hit');
      expect(classifyEvent('A strikes B')).toBe('hit');
      expect(classifyEvent('hits hard')).toBe('hit');
      expect(classifyEvent('lands a blow')).toBe('hit');
      expect(classifyEvent('striking at the gap')).toBe('hit');
    });

    it('classifies miss events by keyword', () => {
      expect(classifyEvent('a clean miss')).toBe('miss');
      expect(classifyEvent('a parry deflects')).toBe('miss');
      expect(classifyEvent('a quick dodge')).toBe('miss');
      expect(classifyEvent('turns aside')).toBe('miss');
      expect(classifyEvent('finds no opening')).toBe('miss');
      expect(classifyEvent('blocks the strike')).toBe('miss');
    });

    it('defaults to status for unmatched text', () => {
      expect(classifyEvent('a tense standoff')).toBe('status');
      expect(classifyEvent('the crowd roars')).toBe('status');
      expect(classifyEvent('')).toBe('status');
    });
  });

  describe('MinuteEvent input', () => {
    const base = (text: string): MinuteEvent => ({
      minute: 1,
      text,
    });

    it('classifies based on text field', () => {
      expect(classifyEvent(base('A kills B'))).toBe('death');
      expect(classifyEvent(base('knocked out'))).toBe('ko');
      expect(classifyEvent(base('devastating strike'))).toBe('crit');
    });

    it('classifies phase events via text field', () => {
      expect(classifyEvent(base('— Phase: LATE'))).toBe('phase');
    });

    it('returns crit when an event has critical metadata', () => {
      const event: MinuteEvent = {
        minute: 2,
        text: 'A strikes B',
        events: [
          { type: 'ATTACK', actor: 'A', target: 'D', metadata: { critical: true } },
        ],
      };
      expect(classifyEvent(event)).toBe('crit');
    });

    it('returns crit when an event has lethal metadata', () => {
      const event: MinuteEvent = {
        minute: 2,
        text: 'A strikes B',
        events: [
          { type: 'ATTACK', actor: 'A', target: 'D', metadata: { lethal: true } },
        ],
      };
      expect(classifyEvent(event)).toBe('crit');
    });

    it('metadata crit takes precedence over text-based death', () => {
      const event: MinuteEvent = {
        minute: 2,
        text: 'A kills B',
        events: [
          { type: 'ATTACK', actor: 'A', target: 'D', metadata: { critical: true } },
        ],
      };
      expect(classifyEvent(event)).toBe('crit');
    });

    it('falls through to text classification when events lack crit metadata', () => {
      const event: MinuteEvent = {
        minute: 2,
        text: 'A kills B',
        events: [
          { type: 'ATTACK', actor: 'A', target: 'D', metadata: { critical: false } },
        ],
      };
      expect(classifyEvent(event)).toBe('death');
    });

    it('falls through to text classification when events is empty', () => {
      const event: MinuteEvent = {
        minute: 2,
        text: 'a parry',
        events: [],
      };
      expect(classifyEvent(event)).toBe('miss');
    });

    it('falls through to text classification when events is undefined', () => {
      const event: MinuteEvent = {
        minute: 2,
        text: 'a parry',
      };
      expect(classifyEvent(event)).toBe('miss');
    });
  });

  describe('branch precedence', () => {
    it('phase takes precedence over all text-based branches', () => {
      expect(classifyEvent('— Phase: kills')).toBe('phase');
    });

    it('death takes precedence over ko', () => {
      expect(classifyEvent('knocked out and killed')).toBe('death');
    });

    it('death takes precedence over crit text', () => {
      expect(classifyEvent('a fatal critical strike')).toBe('death');
    });

    it('ko takes precedence over exhaust', () => {
      expect(classifyEvent('knocked out and exhausted')).toBe('ko');
    });

    it('crit text takes precedence over riposte', () => {
      expect(classifyEvent('a devastating counter-attack')).toBe('crit');
    });

    it('riposte takes precedence over initiative', () => {
      expect(classifyEvent('a riposte that seizes initiative')).toBe('riposte');
    });

    it('initiative takes precedence over spatial', () => {
      expect(classifyEvent('seizes the center of the arena')).toBe('initiative');
    });

    it('spatial takes precedence over hit', () => {
      expect(classifyEvent('closes in and strikes')).toBe('spatial');
    });

    it('hit takes precedence over miss', () => {
      expect(classifyEvent('strikes and is parried')).toBe('hit');
    });
  });

  describe('case insensitivity', () => {
    it('matches keywords regardless of case', () => {
      expect(classifyEvent('KILLS')).toBe('death');
      expect(classifyEvent('KNOCKED OUT')).toBe('ko');
      expect(classifyEvent('EXHAUSTED')).toBe('exhaust');
      expect(classifyEvent('DEVASTATING')).toBe('crit');
      expect(classifyEvent('Riposte')).toBe('riposte');
      expect(classifyEvent('Initiative')).toBe('initiative');
      expect(classifyEvent('Closes In')).toBe('spatial');
      expect(classifyEvent('STRIKES')).toBe('hit');
      expect(classifyEvent('PARRY')).toBe('miss');
    });
  });
});
