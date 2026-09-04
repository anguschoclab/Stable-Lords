const fs = require('fs');

const data = fs.readFileSync('src/engine/pipeline/offseasonEvents/economicHandlers.ts', 'utf8');

const newData = data
  .replace('export function handleWinterChill(', '/**\n * Handler for the Winter Chill offseason event.\n */\nexport function handleWinterChill(')
  .replace('export function handleMerchantBlessing(', '/**\n * Handler for the Merchant Blessing offseason event.\n */\nexport function handleMerchantBlessing(')
  .replace('export function handleBlackMarketRaid(', '/**\n * Handler for the Black Market Raid offseason event.\n */\nexport function handleBlackMarketRaid(')
  .replace('export function handleMysteriousPatron(', '/**\n * Handler for the Mysterious Patron offseason event.\n */\nexport function handleMysteriousPatron(')
  .replace('export function handleBountifulHarvest(', '/**\n * Handler for the Bountiful Harvest offseason event.\n */\nexport function handleBountifulHarvest(');

fs.writeFileSync('src/engine/pipeline/offseasonEvents/economicHandlers.ts', newData);
