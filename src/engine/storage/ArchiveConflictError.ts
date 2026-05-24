/**
 * ArchiveConflictError — thrown when an archive operation would overwrite existing data.
 */
export class ArchiveConflictError extends Error {
  /**
   * Creates a new ArchiveConflictError.
   * @param message - The error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveConflictError';
  }
}
