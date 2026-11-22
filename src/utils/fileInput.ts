/**
 * Largest picked file the renderer will read into memory. Mirrors the 10 MB
 * serialized-state cap enforced by the Electron `save-game` IPC handler —
 * save packs/content packs come from the same state, so this rejects only
 * files no legitimate export could produce. Without it, a hostile multi-GB
 * pick would be read, parsed, and schema-validated in full — a renderer DoS.
 */
export const MAX_FILE_INPUT_BYTES = 10 * 1024 * 1024;

/**
 * Read a file picked in an `<input type="file">` change event as text.
 * Clears the input value so re-picking the same file re-fires `change`.
 *
 * `onText` runs inside the helper's try — throws there surface through
 * `onError` alongside read failures, so callers keep a single error path.
 */
export function readFileInput(
  e: React.ChangeEvent<HTMLInputElement>,
  onText: (text: string) => void,
  onError: (err: unknown) => void
): void {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > MAX_FILE_INPUT_BYTES) {
    onError(new Error('File exceeds the 10 MB size limit.'));
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const content = ev.target?.result;
      if (typeof content !== 'string') throw new Error('Invalid file content');
      onText(content);
    } catch (err) {
      onError(err);
    }
  };
  reader.onerror = () => onError(new Error('Failed to read file.'));
  reader.readAsText(file);
}
