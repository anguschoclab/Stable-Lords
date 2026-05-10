const { NarrativeTemplateEngine } = require('./src/engine/narrative/narrativeTemplateEngine.ts');

const ctx = {
  attacker: "Bolt",
  defender: "Bug",
  weapon: "Lightning",
  bodyPart: "Head",
  hits: 5,
  winner: "Bolt",
  loser: "Bug"
};

const template = "The warrior %A strikes %D's %BP with a %W for %H hits! {{winner}} defeats {{loser}}!";
console.log("Original: " + template);
console.log("Interpolated: " + NarrativeTemplateEngine.interpolateTemplate(template, ctx));
