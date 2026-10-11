import fs from 'fs';
import path from 'path';

const file = 'src/data/narrative/uiMeta.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

const goodPersonaLines = {
    initiative: {
        high: [
            "Dictates the flow of combat with absolute authority",
            "Moves with terrifying purpose and sudden swiftness",
            "Always seems to be half a step ahead of their opponent",
            "Seizes the momentum effortlessly and refuses to let go",
            "Their proactive pressure is overwhelming",
            "Anticipates their opponent's actions with uncanny accuracy",
            "Never gives their foe a moment to breathe",
            "Strikes with sudden, explosive aggression"
        ],
        low: [
            "Maintains a commanding presence, forcing errors",
            "Patiently waits for the perfect moment to strike",
            "Uses spacing and timing to effortlessly control the bout",
            "Reacts to threats with calm, practiced efficiency",
            "Turns their opponent's momentum against them",
            "Never rushes, completely confident in their timing",
            "Punishes mistakes with cold, calculated precision",
            "Their defensive awareness creates incredible offensive opportunities"
        ]
    },
    attack: {
        high: [
            "Unleashes devastating combinations with terrifying speed",
            "Every strike carries lethal intent and incredible power",
            "Their offensive technique is a masterclass in brutality",
            "Breaks through guards with overwhelming force",
            "Finds openings that shouldn't even exist",
            "Their strikes are both precise and incredibly punishing",
            "Relentlessly batters down their opponent's defenses",
            "Displays a breathtaking array of offensive maneuvers"
        ],
        low: [
            "Strikes with surgical precision, wasting no effort",
            "Every attack is meticulously calculated for maximum effect",
            "Their offensive timing is absolutely flawless",
            "Exploits even the tiniest weaknesses in their opponent's guard",
            "Their strikes are incredibly efficient and deadly",
            "Rarely misses a targeted blow",
            "Dismantles their opponent with cold, clinical strikes",
            "Their offensive patience is terrifying to behold"
        ]
    },
    defense: {
        high: [
            "Their guard is an impenetrable fortress",
            "Deflects even the heaviest blows with practiced ease",
            "Their defensive footwork is an absolute marvel",
            "Absorbs pressure without breaking a sweat",
            "Makes dodging lethal strikes look like a casual stroll",
            "Their parries are sharp, strong, and perfectly timed",
            "Completely shuts down their opponent's offensive rhythm",
            "Turns defense into offense with fluid grace"
        ],
        low: [
            "Evades attacks with minimalist, perfect movements",
            "Their defensive awareness is almost supernatural",
            "Rarely exerts unnecessary energy when defending",
            "Slips past strikes by the narrowest, most calculated of margins",
            "Their defensive patience frustrates even the most aggressive foes",
            "Always maintains perfect balance, even under heavy assault",
            "Their spatial awareness keeps them safely out of harm's way",
            "A master of defensive efficiency"
        ]
    },
    endurance: {
        high: [
            "Possesses a seemingly bottomless well of stamina",
            "Fights with the same intensity in the final minute as the first",
            "Shrugs off fatigue as if it were a minor inconvenience",
            "Their relentless pace eventually breaks every opponent",
            "Seems completely unfazed by extended, grueling bouts",
            "Maintains incredible power even when completely exhausted",
            "Their physical conditioning is second to none",
            "Thrives in deep waters where others drown"
        ],
        low: [
            "Conserves energy with masterful efficiency",
            "Never wastes a breath or a movement",
            "Paces themselves perfectly throughout the entire bout",
            "Their stamina management is a tactical masterclass",
            "Always keeps something in reserve for the final exchange",
            "Recovers incredibly quickly during lulls in the action",
            "Makes their opponent do all the exhausting work",
            "Fights with a calm, sustainable rhythm"
        ]
    }
};

for (const stat of Object.keys(data.persona.good)) {
    for (const level of ['high', 'low']) {
        const arr = data.persona.good[stat][level];
        // Replace the placeholder ones that end in (N)
        let placeholderCount = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].text.match(/\(\d+\)$/)) {
                if (goodPersonaLines[stat] && goodPersonaLines[stat][level] && placeholderCount < goodPersonaLines[stat][level].length) {
                    arr[i].text = goodPersonaLines[stat][level][placeholderCount++];
                }
            }
        }
    }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
