import fs from 'fs';
import path from 'path';

const file = 'src/data/narrative/combatPbp.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

const newLines = {
    defenses: {
        dodge: {
            desperate: [
                "{{defender}} stumbles backward just in time, narrowly avoiding a lethal strike.",
                "With a panicked scramble, {{defender}} hurls themselves out of the weapon's path.",
                "{{defender}} practically falls over to evade, trading dignity for survival."
            ],
            confident: [
                "{{defender}} reads the attack perfectly, stepping aside with clinical precision.",
                "Without even blinking, {{defender}} weaves out of danger, making it look effortless.",
                "{{defender}} smoothly sidesteps the incoming blow, entirely unfazed."
            ],
            theatrical: [
                "{{defender}} pirouettes away from the strike, flashing a wicked grin to the crowd.",
                "With a dramatic flourish, {{defender}} leaps to safety, playing to the roaring stands.",
                "{{defender}} spins elegantly out of range, turning evasion into a performance."
            ],
            grim: [
                "{{defender}} steps back into the shadows, a cold, expressionless evasion.",
                "With no wasted movement, {{defender}} silently slips past the deadly arc.",
                "{{defender}} ducks the blow with a stoic, dead-eyed calm."
            ]
        },
        parry: {
            desperate: [
                "{{defender}} throws up a hasty block, barely absorbing the horrific impact.",
                "Sparks fly as {{defender}} frantically bats the weapon away at the very last second.",
                "{{defender}} is forced onto the back foot, violently deflecting the incoming steel."
            ],
            confident: [
                "{{defender}} intercepts the strike with casual authority, completely unbothered.",
                "A firm, calculated parry from {{defender}} effortlessly halts the offensive.",
                "{{defender}} meets the blow head-on, their guard remaining absolutely absolute."
            ],
            theatrical: [
                "{{defender}} swats the blade aside with an arrogant flick of the wrist.",
                "With a showman's flair, {{defender}} loudly clashes steel, inviting the crowd's cheer.",
                "{{defender}} deflects the blow beautifully, holding the pose for a fraction of a second."
            ],
            grim: [
                "{{defender}} violently slaps the weapon aside, their face locked in a murderous scowl.",
                "A brutal, heavy parry from {{defender}} sends a shockwave through the air.",
                "{{defender}} intercepts the strike with a jarring clang, eyes promising violence."
            ]
        },
        riposte: {
            desperate: [
                "After a panicked deflection, {{defender}} lashes out blindly in a wild counter-attack.",
                "Breathing heavily, {{defender}} parries and immediately throws a desperate, ragged counter.",
                "{{defender}} barely survives the block, instantly snapping back with a messy riposte."
            ],
            confident: [
                "{{defender}} turns the parry into a fluid, deadly counterstrike with practiced ease.",
                "A perfect deflection opens the door, and {{defender}} smoothly slides in for the riposte.",
                "{{defender}} absorbs the momentum entirely, redirecting it into a flawless counter."
            ],
            theatrical: [
                "{{defender}} bats the weapon away and retaliates with a flourishing, spinning strike.",
                "With a grand, sweeping motion, {{defender}} parries and dances into a beautiful counter.",
                "{{defender}} winks to the crowd mid-deflection, seamlessly returning a flashy riposte."
            ],
            grim: [
                "{{defender}} brutally forces the weapon aside, driving in a savage, wordless counter.",
                "A jarring parry is immediately followed by a ruthless, punishing riposte from {{defender}}.",
                "{{defender}} creates an opening with sheer force, stepping in for a brutal retaliation."
            ]
        }
    },
    knockdown: {
        pacing: {
            slow: [
                "{{name}} staggers heavily, swaying for agonizing seconds before finally collapsing to the sand.",
                "Like a felled timber, {{name}} tips backward in slow motion, crashing to the dirt.",
                "The impact echoes through the arena, and {{name}} slowly, inevitably crumbles."
            ],
            fast: [
                "{{name}} is instantly swept off their feet, hitting the ground with a sickening thud.",
                "A sudden, violent impact drops {{name}} immediately into the dirt.",
                "{{name}}'s legs are taken out completely, slamming them violently into the sand."
            ],
            recovery_slow: [
                "{{name}} groans, pushing up from the sand with agonizing, trembling slowness.",
                "Covered in dirt, {{name}} crawls to their knees before finally, shakily finding their footing.",
                "The crowd watches as {{name}} struggles violently against their own battered body to stand."
            ],
            recovery_fast: [
                "{{name}} instantly springs back to their feet, practically bouncing off the arena floor.",
                "With a sudden burst of adrenaline, {{name}} kips up off the sand, refusing to stay down.",
                "{{name}} rolls with the impact, immediately popping back into a fighting stance."
            ]
        }
    }
};

// Insert defenses
for (const [action, signatures] of Object.entries(newLines.defenses)) {
    for (const [signature, lines] of Object.entries(signatures)) {
        if (!data.pbp.defenses[action][signature]) {
            data.pbp.defenses[action][signature] = [];
        }
        data.pbp.defenses[action][signature].push(...lines);
    }
}

// Insert knockdowns
for (const [pace, lines] of Object.entries(newLines.knockdown.pacing)) {
    if (!data.pbp.knockdown.pacing[pace]) {
        data.pbp.knockdown.pacing[pace] = [];
    }
    data.pbp.knockdown.pacing[pace].push(...lines);
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
