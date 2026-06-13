export type { ArchiveService } from './types';
export { ArchiveConflictError } from './types';
export { assertSafeFileNamePart } from './validation';
export { OPFSArchiveService } from './service';

import { OPFSArchiveService } from './service';
export const opfsArchive = new OPFSArchiveService();
