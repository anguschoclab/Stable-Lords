/**
 * EntityName schema — cleans user-controlled entity display names at the
 * deserialization boundary (save-file import) so markdown/HTML
 * metacharacters from crafted saves can't reach the gazette pipeline.
 */
import { z } from 'zod';
import { sanitizeEntityName } from '@/utils/entityName';

export const EntityNameSchema = z.string().transform((s) => sanitizeEntityName(s) || 'Unknown');
