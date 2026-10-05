/**
 * Stable-template aggregate — the canonical concatenation of all
 * authored tier template corpora.
 */

import type { StableTemplate } from './stableTemplate.types';
import { LEGENDARY_TEMPLATES } from './legendaryTemplates';
import { MAJOR_TEMPLATES } from './majorTemplates';
import { ESTABLISHED_TEMPLATES } from './establishedTemplates';
import { MINOR_TEMPLATES } from './minorTemplates';

/**
 * All_templates.
 */
export const ALL_TEMPLATES: StableTemplate[] = [
  ...LEGENDARY_TEMPLATES,
  ...MAJOR_TEMPLATES,
  ...ESTABLISHED_TEMPLATES,
  ...MINOR_TEMPLATES,
];
