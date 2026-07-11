const fs = require('fs');
const filepath = 'src/constants/arena/weather.ts';
let content = fs.readFileSync(filepath, 'utf8');

const newConfig = `  'Eldritch Eclipse': {
    icon: Moon,
    colorClass: 'text-arena-fame',
    bgClass: 'bg-arena-fame/10',
    borderClass: 'border-arena-fame/20',
    extraClass: 'glow-neon-purple',
    description: 'An otherworldly eclipse that drives fighters to the brink of madness.',
  },
`;

if (!content.includes("'Eldritch Eclipse': {")) {
  content = content.replace(/export const WEATHER_CONFIG: Record<WeatherType, WeatherConfig> = {/, `export const WEATHER_CONFIG: Record<WeatherType, WeatherConfig> = {\n${newConfig}`);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Added Eldritch Eclipse to WEATHER_CONFIG");
} else {
  console.log("Eldritch Eclipse already exists in WEATHER_CONFIG");
}
