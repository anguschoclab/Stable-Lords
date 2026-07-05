import { describe, it, expect } from 'vitest';
import { setMockOPFSError, setMockOPFSFileText } from '@/test/_setup/setup';

describe('setup.ts regression — OPFS mock reset between tests', () => {
  it('test A: sets OPFS error — should throw on write', async () => {
    setMockOPFSError('QuotaExceededError', 'write');
    const dir = await navigator.storage.getDirectory();
    const fileHandle = await dir.getFileHandle('test', { create: true });
    const writable = await fileHandle.createWritable();
    await expect(writable.write('data')).rejects.toThrow('QuotaExceededError');
  });

  it('test B: OPFS write should succeed (beforeEach reset cleared error)', async () => {
    const dir = await navigator.storage.getDirectory();
    const fileHandle = await dir.getFileHandle('test', { create: true });
    const writable = await fileHandle.createWritable();
    await expect(writable.write('data')).resolves.toBeUndefined();
  });
});

describe('setup.ts regression — OPFS file text reset between tests', () => {
  it('test A: sets custom file text', () => {
    setMockOPFSFileText('custom-content');
  });

  it('test B: file.text() should return default {} (beforeEach reset cleared text)', async () => {
    const dir = await navigator.storage.getDirectory();
    const fileHandle = await dir.getFileHandle('test', { create: true });
    const file = await fileHandle.getFile();
    const text = await file.text();
    expect(text).toBe('{}');
  });
});

describe('setup.ts regression — localStorage normal operation', () => {
  it('setItem does not throw and getItem retrieves value', () => {
    localStorage.setItem('regression-key', 'regression-val');
    expect(localStorage.getItem('regression-key')).toBe('regression-val');
  });
});

describe('setup.ts regression — localStorage cleared between tests', () => {
  it('test A: sets a key in localStorage', () => {
    localStorage.setItem('persist-test', 'should-be-cleared');
    expect(localStorage.getItem('persist-test')).toBe('should-be-cleared');
  });

  it('test B: key should be null (beforeEach cleared localStorage)', () => {
    expect(localStorage.getItem('persist-test')).toBeNull();
  });
});
