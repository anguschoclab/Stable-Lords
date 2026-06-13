import { NarrativeTemplateEngine } from '../narrativeTemplateEngine';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

export function battleOpener(rng: IRNGService): string {
  const template = NarrativeTemplateEngine.getFromArchive(rng, ['pbp', 'openers']);
  return NarrativeTemplateEngine.interpolateTemplate(template, {});
}
