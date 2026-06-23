import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '@/utils/logger';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger.log', () => {
    it('delegates to console.log with single arg', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log('hello');
      expect(spy).toHaveBeenCalledWith('hello');
    });

    it('delegates to console.log with multiple args', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log('a', 'b', 'c');
      expect(spy).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('passes through mixed-type args', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log('str', 42, { key: 'val' }, [1, 2]);
      expect(spy).toHaveBeenCalledWith('str', 42, { key: 'val' }, [1, 2]);
    });

    it('returns undefined', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      expect(logger.log('test')).toBeUndefined();
    });
  });

  describe('logger.error', () => {
    it('delegates to console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('boom');
      expect(spy).toHaveBeenCalledWith('boom');
    });

    it('delegates with multiple args', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('err', new Error('test'));
      expect(spy).toHaveBeenCalledWith('err', expect.any(Error));
    });

    it('returns undefined', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(logger.error('test')).toBeUndefined();
    });
  });

  describe('logger.warn', () => {
    it('delegates to console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('careful');
      expect(spy).toHaveBeenCalledWith('careful');
    });

    it('delegates with multiple args', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('w1', 'w2');
      expect(spy).toHaveBeenCalledWith('w1', 'w2');
    });

    it('returns undefined', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(logger.warn('test')).toBeUndefined();
    });
  });
});
