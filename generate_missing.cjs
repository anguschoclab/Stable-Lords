const fs = require('fs');

const pbpFile = 'src/data/narrative/combatPbp.json';
const pbp = JSON.parse(fs.readFileSync(pbpFile, 'utf-8'));

// The prompt asked for:
// - Strike descriptions for underrepresented weapon types (slashing, bashing, piercing, fist)
// - Dodge/parry/riposte reactions with distinct personality signatures (desperate, confident, theatrical, grim)
// - Knockdown and recovery narration with varied pacing
// - Death/kill narration that respects the Design Bible's tone guidelines (clinical, dramatic, darkly humorous, bleak)

// We'll generate some fresh entries and append them where appropriate.

const newSlashing = [
  "{{attacker}} drags the blade in a vicious figure-eight, seeking to flay {{defender}} alive.",
  "With a terrifying scream, {{attacker}} unloads a flurry of horizontal cuts.",
  "The steel sings a chilling note as {{attacker}}'s slash seeks {{defender}}'s throat.",
  "{{attacker}} chops wildly at {{defender}}, a flurry of slashes intended to dismember.",
  "A sudden burst of speed from {{attacker}} leaves a trailing slash of crimson across {{defender}}."
];
const newBashing = [
  "{{attacker}} heaves their heavy weapon, delivering a skull-crushing bash.",
  "With raw, blunt fury, {{attacker}} attempts to cave in {{defender}}'s defenses.",
  "{{attacker}} swings with the momentum of a falling mountain."
];
const newPiercing = [
  "{{attacker}} steps inside and buries the point deep, a surgical piercing strike.",
  "A rapid-fire series of thrusts from {{attacker}} seeks to puncture {{defender}}'s vitals.",
  "{{attacker}} darts forward with a needle-like thrust, seeking a gap in the armor."
];
const newFist = [
  "{{attacker}} unloads a bare-knuckle barrage, attempting to pummel {{defender}} into submission.",
  "With a bone-shattering uppercut, {{attacker}} launches a devastating fist strike.",
  "{{attacker}} drives a heavy cross into {{defender}}, throwing their full body weight behind it."
];

const newDodgeTheatrical = [
  "{{defender}} evades the strike with an impossible backbend, laughing as the blade passes over.",
  "Playing the fool, {{defender}} pretends to trip, turning the tumble into a flawless evasion.",
  "{{defender}} catches the weapon's momentum in a dizzying pirouette, winking at the crowd.",
  "With a dramatic swoop of their arms, {{defender}} dodges, leaving {{attacker}} swinging at air."
];
const newDodgeDesperate = [
  "{{defender}} trips and falls, miraculously evading the lethal blow by sheer dumb luck.",
  "A frantic, terrified scramble saves {{defender}} from certain decapitation.",
  "Panic overtakes {{defender}} as they violently flail out of the weapon's path."
];

const newParryGrim = [
  "With a sickening crunch of steel, {{defender}} stops the blow dead, their expression an emotionless mask.",
  "{{defender}} steps into the attack, parrying with bone-jarring force and dead eyes.",
  "No wasted motion. {{defender}} brutally slaps the attack aside, saving their energy for the kill."
];

const newRiposteConfident = [
  "{{defender}} yawns, lazily deflecting the attack before burying a perfect counterstrike.",
  "{{defender}} practically invites the blow, parrying it to set up a devastating, arrogant riposte.",
  "With an infuriating smirk, {{defender}} redirects the force and effortlessly punctures {{attacker}}."
];

const newKnockdownSlow = [
  "Time distorts as the crushing blow connects. {{name}} falls endlessly, the arena echoing with the hollow thud.",
  "Like a crumbling monument, {{name}} collapses to the dirt in a slow, tragic spectacle."
];

const newKnockdownFast = [
  "In a terrifying blur, {{name}} is swept off their feet and slammed into the bloody sands.",
  "Before the crowd can even gasp, the devastating strike spikes {{name}} into the dirt."
];

const newRecoverySlow = [
  "Every muscle screaming, {{name}} forces themselves up, their slow ascent a testament to sheer willpower.",
  "It takes an agonizing eternity for {{name}} to find their footing, swaying on the brink of collapse."
];

const newRecoveryFast = [
  "{{name}} hits the sand and ricochets back to their feet in a blur of furious motion.",
  "Refusing to be broken, {{name}} kips up instantly, their eyes burning with renewed hatred."
];

if (pbp.pbp && pbp.pbp.attacks) {
    pbp.pbp.attacks.slashing.push(...newSlashing);
    pbp.pbp.attacks.bashing.push(...newBashing);
    pbp.pbp.attacks.piercing.push(...newPiercing);
    pbp.pbp.attacks.fist.push(...newFist);
}
if (pbp.pbp && pbp.pbp.defenses) {
    pbp.pbp.defenses.dodge.theatrical.push(...newDodgeTheatrical);
    pbp.pbp.defenses.dodge.desperate.push(...newDodgeDesperate);
    pbp.pbp.defenses.parry.grim.push(...newParryGrim);
    pbp.pbp.defenses.riposte.confident.push(...newRiposteConfident);
}
if (pbp.pbp && pbp.pbp.knockdown) {
    // In combatPbp.json, knockdown has fall and recovery arrays, not pacing.slow etc! Let's check structure:
    // It has "fall", "recovery", "pacing" -> "slow", "fast", "recovery_slow", "recovery_fast"
    pbp.pbp.knockdown.pacing.slow.push(...newKnockdownSlow);
    pbp.pbp.knockdown.pacing.fast.push(...newKnockdownFast);
    pbp.pbp.knockdown.pacing.recovery_slow.push(...newRecoverySlow);
    pbp.pbp.knockdown.pacing.recovery_fast.push(...newRecoveryFast);
}
fs.writeFileSync(pbpFile, JSON.stringify(pbp, null, 2));


const killFile = 'src/data/narrative/combatKillText.json';
const kill = JSON.parse(fs.readFileSync(killFile, 'utf-8'));

const newKills = [
  "{{attacker}} executes a clinically precise strike. {{defender}} is gone before they hit the ground.",
  "With operatic drama, {{attacker}} brings the weapon down, ending {{defender}} in a spray of crimson.",
  "{{defender}} stumbles, realizes their mistake, and twitches once as {{attacker}} stamps out their life.",
  "The arena claims its due. {{attacker}} delivers a bleak, joyless strike that snuffs out {{defender}}'s spark."
];

if (kill.kill_text && kill.kill_text.execution) {
    kill.kill_text.execution.push(...newKills);
}
fs.writeFileSync(killFile, JSON.stringify(kill, null, 2));

const strikeFile = 'src/data/narrative/combatStrikes.json';
const strike = JSON.parse(fs.readFileSync(strikeFile, 'utf-8'));
// Add missing strike text for underrepresented ones
const newStrikePiercing = [
    "{{attacker}} executes a clinically precise thrust into {{defender}}.",
    "A swift piercing strike from {{attacker}} finds the mark on {{defender}}."
];
if (strike.strikes && strike.strikes.piercing && strike.strikes.piercing.solid) {
    strike.strikes.piercing.solid.push(...newStrikePiercing);
}
fs.writeFileSync(strikeFile, JSON.stringify(strike, null, 2));

console.log("Appended new narrative entries.");
