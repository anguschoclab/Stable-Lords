import { describe, it, expect } from 'vitest';
import { assertSafeFileNamePart } from '@/engine/storage/opfsArchive/validation';

describe('assertSafeFileNamePart', () => {
  describe('valid inputs (no throw)', () => {
    it('accepts pure alphanumeric lowercase', () => {
      expect(() => assertSafeFileNamePart('abc123', 'slotId')).not.toThrow();
    });

    it('accepts pure alphanumeric uppercase', () => {
      expect(() => assertSafeFileNamePart('ABC', 'slotId')).not.toThrow();
    });

    it('accepts numeric-only string', () => {
      expect(() => assertSafeFileNamePart('123', 'week')).not.toThrow();
    });

    it('accepts underscore', () => {
      expect(() => assertSafeFileNamePart('file_name', 'slotId')).not.toThrow();
    });

    it('accepts single underscore', () => {
      expect(() => assertSafeFileNamePart('_', 'slotId')).not.toThrow();
    });

    it('accepts single dot (no traversal)', () => {
      expect(() => assertSafeFileNamePart('.', 'slotId')).not.toThrow();
    });

    it('accepts dot in filename', () => {
      expect(() => assertSafeFileNamePart('file.txt', 'slotId')).not.toThrow();
    });

    it('accepts hyphen', () => {
      expect(() => assertSafeFileNamePart('file-name', 'slotId')).not.toThrow();
    });

    it('accepts single hyphen', () => {
      expect(() => assertSafeFileNamePart('-', 'slotId')).not.toThrow();
    });

    it('accepts mixed valid characters', () => {
      expect(() => assertSafeFileNamePart('save_slot-1.json', 'slotId')).not.toThrow();
    });

    it('accepts mixed valid chars with all allowed symbols', () => {
      expect(() => assertSafeFileNamePart('a.b-c_d', 'slotId')).not.toThrow();
    });

    it('accepts single letter', () => {
      expect(() => assertSafeFileNamePart('a', 'slotId')).not.toThrow();
    });

    it('accepts single digit', () => {
      expect(() => assertSafeFileNamePart('1', 'slotId')).not.toThrow();
    });
  });

  describe('invalid characters (throws TypeError)', () => {
    it('rejects empty string', () => {
      expect(() => assertSafeFileNamePart('', 'slotId')).toThrow(TypeError);
    });

    it('rejects forward slash', () => {
      expect(() => assertSafeFileNamePart('a/b', 'slotId')).toThrow(TypeError);
    });

    it('rejects backslash', () => {
      expect(() => assertSafeFileNamePart('a\\b', 'slotId')).toThrow(TypeError);
    });

    it('rejects space', () => {
      expect(() => assertSafeFileNamePart('a b', 'slotId')).toThrow(TypeError);
    });

    it('rejects colon', () => {
      expect(() => assertSafeFileNamePart('a:b', 'slotId')).toThrow(TypeError);
    });

    it('rejects semicolon', () => {
      expect(() => assertSafeFileNamePart('a;b', 'slotId')).toThrow(TypeError);
    });

    it('rejects pipe', () => {
      expect(() => assertSafeFileNamePart('a|b', 'slotId')).toThrow(TypeError);
    });

    it('rejects left angle bracket', () => {
      expect(() => assertSafeFileNamePart('a<b', 'slotId')).toThrow(TypeError);
    });

    it('rejects right angle bracket', () => {
      expect(() => assertSafeFileNamePart('a>b', 'slotId')).toThrow(TypeError);
    });

    it('rejects parentheses', () => {
      expect(() => assertSafeFileNamePart('a(b)', 'slotId')).toThrow(TypeError);
    });

    it('rejects square brackets', () => {
      expect(() => assertSafeFileNamePart('a[b]', 'slotId')).toThrow(TypeError);
    });

    it('rejects curly braces', () => {
      expect(() => assertSafeFileNamePart('a{b}', 'slotId')).toThrow(TypeError);
    });

    it('rejects at sign', () => {
      expect(() => assertSafeFileNamePart('a@b', 'slotId')).toThrow(TypeError);
    });

    it('rejects hash', () => {
      expect(() => assertSafeFileNamePart('a#b', 'slotId')).toThrow(TypeError);
    });

    it('rejects percent', () => {
      expect(() => assertSafeFileNamePart('a%b', 'slotId')).toThrow(TypeError);
    });

    it('rejects ampersand', () => {
      expect(() => assertSafeFileNamePart('a&b', 'slotId')).toThrow(TypeError);
    });

    it('rejects plus', () => {
      expect(() => assertSafeFileNamePart('a+b', 'slotId')).toThrow(TypeError);
    });

    it('rejects equals', () => {
      expect(() => assertSafeFileNamePart('a=b', 'slotId')).toThrow(TypeError);
    });

    it('rejects comma', () => {
      expect(() => assertSafeFileNamePart('a,b', 'slotId')).toThrow(TypeError);
    });

    it('rejects exclamation mark', () => {
      expect(() => assertSafeFileNamePart('a!b', 'slotId')).toThrow(TypeError);
    });

    it('rejects question mark', () => {
      expect(() => assertSafeFileNamePart('a?b', 'slotId')).toThrow(TypeError);
    });

    it('rejects tilde', () => {
      expect(() => assertSafeFileNamePart('a~b', 'slotId')).toThrow(TypeError);
    });

    it('rejects backtick', () => {
      expect(() => assertSafeFileNamePart('a`b', 'slotId')).toThrow(TypeError);
    });

    it('rejects dollar sign', () => {
      expect(() => assertSafeFileNamePart('a$b', 'slotId')).toThrow(TypeError);
    });

    it('rejects asterisk', () => {
      expect(() => assertSafeFileNamePart('a*b', 'slotId')).toThrow(TypeError);
    });

    it('rejects caret', () => {
      expect(() => assertSafeFileNamePart('a^b', 'slotId')).toThrow(TypeError);
    });

    it('rejects newline', () => {
      expect(() => assertSafeFileNamePart('a\nb', 'slotId')).toThrow(TypeError);
    });

    it('rejects tab', () => {
      expect(() => assertSafeFileNamePart('a\tb', 'slotId')).toThrow(TypeError);
    });

    it('rejects unicode characters', () => {
      expect(() => assertSafeFileNamePart('café', 'slotId')).toThrow(TypeError);
    });
  });

  describe('path traversal ".." detection (throws TypeError)', () => {
    it('rejects bare double dot', () => {
      expect(() => assertSafeFileNamePart('..', 'slotId')).toThrow(TypeError);
    });

    it('rejects triple dot', () => {
      expect(() => assertSafeFileNamePart('...', 'slotId')).toThrow(TypeError);
    });

    it('rejects leading double dot', () => {
      expect(() => assertSafeFileNamePart('..a', 'slotId')).toThrow(TypeError);
    });

    it('rejects trailing double dot', () => {
      expect(() => assertSafeFileNamePart('a..', 'slotId')).toThrow(TypeError);
    });

    it('rejects middle double dot', () => {
      expect(() => assertSafeFileNamePart('a..b', 'slotId')).toThrow(TypeError);
    });

    it('rejects double dot in filename', () => {
      expect(() => assertSafeFileNamePart('file..txt', 'slotId')).toThrow(TypeError);
    });

    it('rejects multiple double dots', () => {
      expect(() => assertSafeFileNamePart('a..b..c', 'slotId')).toThrow(TypeError);
    });
  });

  describe('error message format', () => {
    it('throws TypeError (not generic Error)', () => {
      try {
        assertSafeFileNamePart('a/b', 'slotId');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
      }
    });

    it('includes the label in the message', () => {
      try {
        assertSafeFileNamePart('bad/value', 'myCustomLabel');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
        expect((e as TypeError).message).toContain('myCustomLabel');
      }
    });

    it('includes the value in the message', () => {
      try {
        assertSafeFileNamePart('bad/value', 'slotId');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
        expect((e as TypeError).message).toContain('bad/value');
      }
    });

    it('includes the word "unsafe" in the message', () => {
      try {
        assertSafeFileNamePart('bad/value', 'slotId');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
        expect((e as TypeError).message).toContain('unsafe');
      }
    });
  });

  describe('return value', () => {
    it('returns undefined for valid input', () => {
      expect(assertSafeFileNamePart('valid_name-1.json', 'slotId')).toBeUndefined();
    });
  });
});
