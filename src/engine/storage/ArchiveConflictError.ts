/**
 * ArchiveConflictError — thrown when an archive operation would overwrite existing data.
 */
export class ArchiveConflictError extends Error {
  /**
   *
   */
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveConflictError';
  }
}
