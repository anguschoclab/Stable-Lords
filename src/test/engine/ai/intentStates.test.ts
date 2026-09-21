import { describe, it, expect } from 'vitest';
import {
  deriveBoutIntent,
  type BoutIntentInput,
} from '@/engine/ai/intentStates';
import { COMMIT_HP_THRESHOLD, COMMIT_KILL_DESIRE } from '@/constants/combat';

const base: BoutIntentInput = {
  psychState: 'Neutral',
  phase: 'MID',
  hpRatio: 0.9,
  endRatio: 0.9,
  opponentHpRatio: 0.9,
  killDesire: 5,
  committed: false,
  desperateActive: false,
  momentum: 0,
  killWindowHpMult: 0.3,
};

describe('deriveBoutIntent — pure mapping', () => {
  describe('Finish (kill-window-eligible only)', () => {
    it('returns Finish when opponent is inside the style kill window and KD is high', () => {
      expect(
        deriveBoutIntent({ ...base, opponentHpRatio: 0.29, killDesire: COMMIT_KILL_DESIRE })
      ).toBe('Finish');
    });

    it('returns Finish at the exact kill-window boundary', () => {
      expect(
        deriveBoutIntent({ ...base, opponentHpRatio: 0.3, killDesire: COMMIT_KILL_DESIRE })
      ).toBe('Finish');
    });

    it('returns Finish when committed regardless of opponent HP', () => {
      expect(deriveBoutIntent({ ...base, committed: true, opponentHpRatio: 0.9 })).toBe(
        'Finish'
      );
    });

    it('does NOT return Finish when the opponent is above the kill window', () => {
      expect(
        deriveBoutIntent({ ...base, opponentHpRatio: 0.31, killDesire: COMMIT_KILL_DESIRE })
      ).not.toBe('Finish');
    });

    it('does NOT return Finish when killDesire is below the commit threshold', () => {
      expect(
        deriveBoutIntent({
          ...base,
          opponentHpRatio: 0.2,
          killDesire: COMMIT_KILL_DESIRE - 1,
        })
      ).not.toBe('Finish');
    });

    it('respects wider style windows (e.g. Bashing Attack 0.8)', () => {
      expect(
        deriveBoutIntent({
          ...base,
          killWindowHpMult: 0.8,
          opponentHpRatio: 0.75,
          killDesire: COMMIT_KILL_DESIRE,
        })
      ).toBe('Finish');
    });

    it('Finish takes precedence over Survive — the all-in commit case', () => {
      expect(
        deriveBoutIntent({
          ...base,
          hpRatio: 0.1,
          opponentHpRatio: 0.2,
          killDesire: COMMIT_KILL_DESIRE,
        })
      ).toBe('Finish');
    });
  });

  describe('Survive', () => {
    it('returns Survive just below the commit HP threshold', () => {
      expect(deriveBoutIntent({ ...base, hpRatio: COMMIT_HP_THRESHOLD - 0.01 })).toBe('Survive');
    });

    it('does NOT return Survive at or above the threshold', () => {
      expect(deriveBoutIntent({ ...base, hpRatio: COMMIT_HP_THRESHOLD })).not.toBe('Survive');
    });

    it('returns Survive on Desperate psych driven by low HP', () => {
      expect(
        deriveBoutIntent({ ...base, psychState: 'Desperate', hpRatio: 0.25 })
      ).toBe('Survive');
    });
  });

  describe('Recover', () => {
    it('returns Recover on FatiguePanic', () => {
      expect(deriveBoutIntent({ ...base, psychState: 'FatiguePanic' })).toBe('Recover');
    });

    it('returns Recover below 20% endurance', () => {
      expect(deriveBoutIntent({ ...base, endRatio: 0.19 })).toBe('Recover');
    });

    it('returns Recover when the desperate plan is engaged', () => {
      expect(deriveBoutIntent({ ...base, desperateActive: true, endRatio: 0.5 })).toBe(
        'Recover'
      );
    });

    it('end-driven Desperate (high endurance floor intact) maps to Recover', () => {
      expect(
        deriveBoutIntent({ ...base, psychState: 'Desperate', hpRatio: 0.9, endRatio: 0.08 })
      ).toBe('Recover');
    });
  });

  describe('Press / Hold mid-band', () => {
    it('maps InTheZone and Cruising to Press', () => {
      expect(deriveBoutIntent({ ...base, psychState: 'InTheZone' })).toBe('Press');
      expect(deriveBoutIntent({ ...base, psychState: 'Cruising' })).toBe('Press');
    });

    it('maps Rattled to Hold', () => {
      expect(deriveBoutIntent({ ...base, psychState: 'Rattled' })).toBe('Hold');
    });

    it('maps strong momentum to Press', () => {
      expect(deriveBoutIntent({ ...base, momentum: 2 })).toBe('Press');
    });

    it('maps momentum deficit to Hold', () => {
      expect(deriveBoutIntent({ ...base, momentum: -2 })).toBe('Hold');
    });

    it('psych signal beats raw momentum', () => {
      expect(deriveBoutIntent({ ...base, psychState: 'Rattled', momentum: 2 })).toBe('Hold');
      expect(deriveBoutIntent({ ...base, psychState: 'InTheZone', momentum: -2 })).toBe(
        'Press'
      );
    });
  });

  describe('Probe default and personality shading', () => {
    it('defaults to Probe in the opening', () => {
      expect(deriveBoutIntent({ ...base, phase: 'OPENING' })).toBe('Probe');
    });

    it('Aggressive/Showman press in mid/late neutral', () => {
      expect(deriveBoutIntent({ ...base, personality: 'Aggressive' })).toBe('Press');
      expect(deriveBoutIntent({ ...base, personality: 'Showman', phase: 'LATE' })).toBe(
        'Press'
      );
    });

    it('Methodical/Pragmatic hold in mid/late neutral', () => {
      expect(deriveBoutIntent({ ...base, personality: 'Methodical' })).toBe('Hold');
      expect(deriveBoutIntent({ ...base, personality: 'Pragmatic', phase: 'LATE' })).toBe(
        'Hold'
      );
    });

    it('Tactician/undefined keeps probing in neutral', () => {
      expect(deriveBoutIntent({ ...base, personality: 'Tactician' })).toBe('Probe');
      expect(deriveBoutIntent(base)).toBe('Probe');
    });
  });
});
