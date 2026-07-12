const fs = require('fs');
const filepath = 'src/engine/combat/mechanics/weatherEffects.ts';
let content = fs.readFileSync(filepath, 'utf8');

const newEffect = `  'Eldritch Eclipse': {
    staminaMult: 0.9,
    initiativeMod: 4,
    riposteMod: 4,
    damageMult: 1.4,
    description: 'An otherworldly eclipse that drives fighters to the brink of madness.',
  },
`;

if (!content.includes("'Eldritch Eclipse': {")) {
  content = content.replace(/const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {/, `const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {\n${newEffect}`);
}

const newLine = `  'Eldritch Eclipse': 'The sky turns a sickening purple as an Eldritch Eclipse blocks the sun. Madness descends.',\n`;

if (!content.includes("Eldritch Eclipse': 'The sky turns a sickening purple")) {
  content = content.replace(/const WEATHER_OPENING_LINES: Record<WeatherType, string \| null> = {/, `const WEATHER_OPENING_LINES: Record<WeatherType, string | null> = {\n${newLine}`);
}
fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated weatherEffects.ts");
