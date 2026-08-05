import * as fs from 'fs';
import * as path from 'path';

const srcFile = path.join(process.cwd(), 'src/engine/pipeline/seasonalHandlers.ts');
const outDir = path.join(process.cwd(), 'src/engine/pipeline/offseasonEvents');
const content = fs.readFileSync(srcFile, 'utf-8');

// Handler groupings
const groups = {
  economicHandlers: ['handleWinterChill', 'handleMerchantBlessing', 'handleBlackMarketRaid', 'handleMysteriousPatron'],
  buffHandlers: ['handleFameBoost', 'handleEpiphany', 'handleBardsSong', 'handleMysticVision', 'handleStrangeDream', 'handleMeteorShower', 'handleGladiatorOlympics', 'handleLoyalStrayDog', 'handleWanderingMystic', 'handleChaosSpores', 'handleChaosWeaversGift', 'handleShadowTraining'],
  injuryHandlers: ['handleTavernBrawl', 'handlePlagueOutbreak', 'handleWildAnimalAttack', 'handleGoblinRaid', 'handleUndergroundPitFight', 'handleTavernBrawlSurprise', 'handleSecretFightClub', 'handleChaoticWeatherExperiment'],
  chaosHandlers: ['handleChaosRift', 'handleChaoticSpells', 'handleAbyssalBargain', 'handleFeyTrickster', 'handleRogueAlchemist', 'handleShadowTournament', 'handleChaosWeaversGame', 'handleChaosWeaverVisit', 'handleTemporalAnomaly'],
  socialHandlers: ['handleShadowMarketRun', 'handleGrandFeast', 'handleWanderingHealer', 'handleLoyalStray', 'handleStreetPerformance', 'handleMidnightFeast', 'handleTravelingCircus', 'handleBountyHunterVisit', 'handleMidnightMarket', 'handleWanderingFortuneTeller', 'handleMoonlightDuel', 'handleDreamweaverVisit'],
};

// Extract each handler function from the source
function extractHandler(name, src) {
  const startIdx = src.indexOf(`export function ${name}(`);
  if (startIdx === -1) throw new Error(`Handler ${name} not found`);
  
  // Find the matching closing brace
  let braceCount = 0;
  let started = false;
  let endIdx = startIdx;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === '{') { braceCount++; started = true; }
    if (src[i] === '}') { braceCount--; }
    if (started && braceCount === 0) { endIdx = i + 1; break; }
  }
  return src.slice(startIdx, endIdx);
}

// Common imports for all handler files
const commonImports = `import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { TRAITS, type TraitDef } from '@/engine/traits';
import { type LedgerEntryId } from '@/types/shared.types';
import { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';`;

// Some files may not need all imports, but including them all is safe (tree-shaking will handle it)
// Actually, let's be more precise about imports per file

const importSets = {
  economicHandlers: `import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';`,
  
  buffHandlers: `import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';`,
  
  injuryHandlers: `import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';`,
  
  chaosHandlers: `import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { TRAITS, type TraitDef } from '@/engine/traits';
import { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';`,
  
  socialHandlers: `import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { type LedgerEntryId } from '@/types/shared.types';
import { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';`,
};

const descriptions = {
  economicHandlers: 'Economic offseason events — pure treasury/ledger effects, no warrior roster updates.',
  buffHandlers: 'Buff offseason events — grant XP, fame, traits, or insights to warriors.',
  injuryHandlers: 'Injury offseason events — cause injuries to warriors, sometimes with fame/gold side effects.',
  chaosHandlers: 'Chaos offseason events — branching/random outcomes with multiple possible effects.',
  socialHandlers: 'Social offseason events — mixed gold and warrior effects from social activities.',
};

for (const [fileName, handlerNames] of Object.entries(groups)) {
  const handlers = handlerNames.map(name => extractHandler(name, content)).join('\n\n');
  const fileContent = `/**
 * ${descriptions[fileName]}
 */
${importSets[fileName]}

${handlers}
`;
  const outPath = path.join(outDir, `${fileName}.ts`);
  fs.writeFileSync(outPath, fileContent);
  console.log(`Wrote ${outPath} (${handlerNames.length} handlers)`);
}

// Create index.ts that re-exports everything
const allHandlers = Object.values(groups).flat();
const reExports = allHandlers.map(h => `export { ${h} } from './${Object.keys(groups).find(k => groups[k].includes(h))}';`).join('\n');
const indexContent = `/**
 * Offseason event handlers — re-exported from thematic sub-modules.
 */
export { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';
${reExports}
`;
fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent);
console.log(`Wrote ${path.join(outDir, 'index.ts')}`);

console.log('Done!');
