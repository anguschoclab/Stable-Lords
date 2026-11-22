// @vitest-environment jsdom
/**
 * readFileInput error-path coverage — the helper funnels every failure mode
 * (reader error, non-string result, onText throw) into a single onError path
 * so callers keep one error channel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileInput, MAX_FILE_INPUT_BYTES } from '@/utils/fileInput';
import { mockFileReader } from '@/test/_helpers/mockFileReader';

const changeEvent = (file: File | null) =>
  ({
    target: { files: file ? [file] : [], value: 'picked' },
  }) as unknown as React.ChangeEvent<HTMLInputElement>;

describe('readFileInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delivers the file text to onText and clears the input so re-picking re-fires change', () => {
    mockFileReader('{"ok":true}');
    const onText = vi.fn();
    const onError = vi.fn();
    const e = changeEvent(new File(['{"ok":true}'], 'pack.json'));

    readFileInput(e, onText, onError);

    expect(onText).toHaveBeenCalledWith('{"ok":true}');
    expect(onError).not.toHaveBeenCalled();
    expect(e.target.value).toBe('');
  });

  it('routes a reader failure to onError', () => {
    mockFileReader(null, { error: true });
    const onText = vi.fn();
    const onError = vi.fn();

    readFileInput(changeEvent(new File(['x'], 'pack.json')), onText, onError);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to read file.' })
    );
    expect(onText).not.toHaveBeenCalled();
  });

  it('routes a non-string result to onError', () => {
    mockFileReader(null);
    const onText = vi.fn();
    const onError = vi.fn();

    readFileInput(changeEvent(new File(['x'], 'pack.json')), onText, onError);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid file content' })
    );
    expect(onText).not.toHaveBeenCalled();
  });

  it('routes an onText throw to onError — callers keep a single error path', () => {
    mockFileReader('valid text');
    const boom = new Error('parse exploded');
    const onText = vi.fn(() => {
      throw boom;
    });
    const onError = vi.fn();

    readFileInput(changeEvent(new File(['x'], 'pack.json')), onText, onError);

    expect(onError).toHaveBeenCalledWith(boom);
  });

  it('rejects an oversize file via onError without ever constructing a FileReader', () => {
    mockFileReader('should not be read');
    const onText = vi.fn();
    const onError = vi.fn();
    const file = new File(['x'], 'huge.json');
    Object.defineProperty(file, 'size', { value: MAX_FILE_INPUT_BYTES + 1 });

    readFileInput(changeEvent(file), onText, onError);

    expect(window.FileReader).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'File exceeds the 10 MB size limit.' })
    );
    expect(onText).not.toHaveBeenCalled();
  });

  it('clears the input and does nothing when no file is selected', () => {
    const onText = vi.fn();
    const onError = vi.fn();
    const e = changeEvent(null);

    readFileInput(e, onText, onError);

    expect(e.target.value).toBe('');
    expect(onText).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
