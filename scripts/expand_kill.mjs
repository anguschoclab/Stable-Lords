import fs from 'fs';
import path from 'path';

const file = 'src/data/narrative/combatKillText.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

const newLines = {
    slashing: [
        "{{attacker}}'s blade arcs beautifully, separating {{defender}}'s head from their shoulders.",
        "A wicked, horizontal slash from {{attacker}} disembowels {{defender}} right on the sands.",
        "{{attacker}} executes a brutal, two-handed cleave that nearly cuts {{defender}} in half.",
        "With a terrifying spray of crimson, {{attacker}} severs {{defender}}'s neck.",
        "{{defender}} collapses as {{attacker}}'s edge carves a lethal crescent across their throat."
    ],
    bashing: [
        "{{attacker}} brings their weapon down with seismic force, totally obliterating {{defender}}'s helm and skull.",
        "A colossal, sweeping smash from {{attacker}} shatters {{defender}}'s ribcage, stopping their heart instantly.",
        "{{defender}} is driven violently into the dirt as {{attacker}} crushes their spine with a final blow.",
        "With a sickening crunch that echoes through the stands, {{attacker}} caves in {{defender}}'s chest.",
        "{{attacker}} pulverizes {{defender}} into the red sands with a horrific downward strike."
    ],
    piercing: [
        "{{attacker}} lunges perfectly, sinking their point directly into {{defender}}'s heart.",
        "A vicious thrust from {{attacker}} skewers {{defender}} completely, pinning them to the air for a moment.",
        "{{defender}} gasps a final time as {{attacker}} threads the needle, piercing their throat.",
        "{{attacker}} drives their weapon deep into {{defender}}'s chest cavity, a flawless, fatal execution.",
        "With terrifying precision, {{attacker}} impales {{defender}} through the visor."
    ],
    fist: [
        "{{attacker}} unleashes a skull-cracking haymaker that turns {{defender}}'s lights out forever.",
        "A sickening snap rings out as {{attacker}} breaks {{defender}}'s neck with a brutal right hook.",
        "{{attacker}} mounts the fallen {{defender}} and delivers a horrifying, bare-knuckle execution.",
        "{{defender}}'s chest caves in under the primal, brutal force of {{attacker}}'s final punch.",
        "With bare hands and raw fury, {{attacker}} beats the very life from {{defender}}'s body."
    ]
};

for (const [weapon, lines] of Object.entries(newLines)) {
    if (!data.kill_text.weapon_specific[weapon]) {
        data.kill_text.weapon_specific[weapon] = [];
    }
    data.kill_text.weapon_specific[weapon].push(...lines);
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
