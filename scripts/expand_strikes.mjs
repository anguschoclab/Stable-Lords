import fs from 'fs';
import path from 'path';

const file = 'src/data/narrative/combatStrikes.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

const newLines = {
    slashing: {
        solid: [
            "{{attacker}} carves a brutal, sweeping arc across {{defender}}'s {{bodyPart}}.",
            "The blade bites deeply into {{defender}}'s {{bodyPart}}, leaving a ghastly wound.",
            "{{attacker}} rips a vicious laceration across {{defender}}'s {{bodyPart}}.",
            "A wicked horizontal slash from {{attacker}} catches {{defender}} solidly on the {{bodyPart}}.",
            "{{attacker}} draws a horrifying line of crimson across {{defender}}'s {{bodyPart}}."
        ],
        critical: [
            "{{attacker}} cleaves through {{defender}}'s guard entirely, biting horrifically deep into the {{bodyPart}}.",
            "A devastating, momentum-fueled swing from {{attacker}} nearly severs {{defender}}'s {{bodyPart}}.",
            "{{attacker}} unleashes a monstrous slash, opening a terrifying wound on {{defender}}'s {{bodyPart}}.",
            "{{defender}} reels backward as {{attacker}}'s blade carves deeply into their {{bodyPart}}."
        ]
    },
    bashing: {
        solid: [
            "{{attacker}} brings the heavy weapon crashing down against {{defender}}'s {{bodyPart}}.",
            "A jarring, bone-rattling thud echoes as {{attacker}} slams into {{defender}}'s {{bodyPart}}.",
            "{{attacker}} delivers a sickening concussive blow to {{defender}}'s {{bodyPart}}.",
            "The sheer impact of {{attacker}}'s strike sends shockwaves through {{defender}}'s {{bodyPart}}.",
            "{{attacker}} batters {{defender}}'s {{bodyPart}} with a punishing, heavy strike."
        ],
        critical: [
            "{{attacker}} unleashes a cataclysmic blow, audibly shattering bone in {{defender}}'s {{bodyPart}}.",
            "A monstrous swing from {{attacker}} caves in {{defender}}'s defenses, crushing the {{bodyPart}}.",
            "{{defender}} is nearly knocked off their feet by a colossal smash to the {{bodyPart}} from {{attacker}}.",
            "With terrifying force, {{attacker}} crushes {{defender}}'s {{bodyPart}} in a ruinous impact."
        ]
    },
    piercing: {
        solid: [
            "{{attacker}} lunges with terrifying speed, driving the point into {{defender}}'s {{bodyPart}}.",
            "A sharp, cruel thrust from {{attacker}} finds purchase in {{defender}}'s {{bodyPart}}.",
            "{{attacker}} threads the needle, sinking their weapon deep into {{defender}}'s {{bodyPart}}.",
            "The point bites maliciously as {{attacker}} skewers {{defender}}'s {{bodyPart}}.",
            "{{attacker}} delivers a sudden, agonizing stab straight into {{defender}}'s {{bodyPart}}."
        ],
        critical: [
            "{{attacker}} drives a horrific, life-threatening thrust deep into {{defender}}'s {{bodyPart}}.",
            "With sickening depth, {{attacker}} impales {{defender}}'s {{bodyPart}}.",
            "{{defender}} gasps in agony as {{attacker}} buries their weapon to the hilt in the {{bodyPart}}.",
            "A flawless, devastating lunge from {{attacker}} pierces straight through {{defender}}'s {{bodyPart}}."
        ]
    },
    fist: {
        solid: [
            "{{attacker}} lands a punishing, bare-knuckle hook to {{defender}}'s {{bodyPart}}.",
            "A sharp, snapping jab from {{attacker}} snaps {{defender}}'s head back.",
            "{{attacker}} sinks a heavy body blow directly into {{defender}}'s {{bodyPart}}.",
            "The sickening sound of knuckle on bone rings out as {{attacker}} connects with the {{bodyPart}}.",
            "{{attacker}} delivers a bruising straight right to {{defender}}'s {{bodyPart}}."
        ],
        critical: [
            "{{attacker}} unleashes a monstrous haymaker, cratering {{defender}}'s {{bodyPart}}.",
            "A devastating, perfectly placed uppercut from {{attacker}} completely scrambles {{defender}}.",
            "{{defender}} is sent staggering by a jaw-shattering blow to the {{bodyPart}} from {{attacker}}.",
            "{{attacker}} steps into a crushing hook, visibly buckling {{defender}}'s knees with a strike to the {{bodyPart}}."
        ]
    }
};

for (const [weapon, qualities] of Object.entries(newLines)) {
    for (const [quality, lines] of Object.entries(qualities)) {
        if (!data.strikes[weapon][quality]) {
            data.strikes[weapon][quality] = [];
        }
        data.strikes[weapon][quality].push(...lines);
    }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
