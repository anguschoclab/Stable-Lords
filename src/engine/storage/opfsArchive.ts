export type { ArchiveService } from './opfsArchive/types';
export { ArchiveConflictError } from './opfsArchive/types';
export { assertSafeFileNamePart } from './opfsArchive/validation';
export { OPFSArchiveService } from './opfsArchive/service';

import { OPFSArchiveService } from './opfsArchive/service';
export const opfsArchive = new OPFSArchiveService();
