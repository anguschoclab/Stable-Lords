const fs = require('fs');
const content = JSON.parse(fs.readFileSync('src/data/narrative/combatPbp.json', 'utf8'));

// Remove RIGHT BICEP
content.pbp.hit_locations['right arm'] = content.pbp.hit_locations['right arm'].filter(loc => loc !== 'RIGHT BICEP');

// Remove LEFT BICEP
content.pbp.hit_locations['left arm'] = content.pbp.hit_locations['left arm'].filter(loc => loc !== 'LEFT BICEP');

// Expand origin epithets
content.pbp.epithets.origin.push("the vagabond", "the native", "the outlander");

fs.writeFileSync('src/data/narrative/combatPbp.json', JSON.stringify(content, null, 2) + '\n');
