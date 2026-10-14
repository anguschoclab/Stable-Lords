import fs from 'fs';
import path from 'path';

const file = 'src/data/narrative/uiMeta.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

const badPersonaLines = {
    initiative: {
        high: [
            "Hesitates precisely when decisive action is required",
            "Moves with agonizing slowness, giving away every advantage",
            "Seems completely overwhelmed by the pacing of combat",
            "Reacts to threats only after they've already landed",
            "Stands rooted to the spot when they should be moving",
            "Consistently second-guesses their own attacks",
            "Allows the opponent to dictate the flow of the entire match",
            "Takes too long to recover from even minor missteps"
        ],
        low: [
            "Shows a concerning lack of situational awareness",
            "Fails to capitalize on obvious openings",
            "Gets easily distracted by feints and footwork",
            "Lacks the killer instinct needed to press an advantage",
            "Seems content to simply survive rather than win",
            "Moves as if fighting underwater",
            "Shows zero urgency even when terribly outmatched",
            "Rarely seizes the initiative, preferring a passive stance"
        ]
    },
    attack: {
        high: [
            "Swings wildly, expending energy with nothing to show for it",
            "Their offensive technique is an embarrassing display",
            "Fails to connect even the most basic of combinations",
            "Leaves themselves wide open after every clumsy strike",
            "Lacks any real power behind their desperate swings",
            "Their attacks are as predictable as the sunrise",
            "Struggles to find the range, constantly hitting empty air",
            "Relies on brute force rather than any sort of tactical acumen"
        ],
        low: [
            "Shows a complete lack of precision in their strikes",
            "Their offensive maneuvers are slow and easily countered",
            "Fails to put their weight behind their attacks",
            "Seems afraid to commit fully to any offensive action",
            "Their strikes lack both speed and conviction",
            "Rarely follows through on their attacks",
            "Their offense is practically non-existent",
            "Seems to close their eyes right before they swing"
        ]
    },
    defense: {
        high: [
            "Their guard is riddled with exploitable holes",
            "Flinches away from strikes instead of properly deflecting them",
            "Backpedals clumsily instead of holding their ground",
            "Routinely fails to raise their shield in time",
            "Their parries are weak and easily broken through",
            "Seems to absorb blows rather than actually avoiding them",
            "Consistently falls for simple misdirections",
            "Their defensive footwork is practically non-existent"
        ],
        low: [
            "Shows a terrifying lack of defensive coordination",
            "Leaves their vital areas completely exposed",
            "Fails to anticipate incoming strikes until it's too late",
            "Their defensive reactions are sluggish and uncoordinated",
            "Seems to have no concept of distance management",
            "Rarely attempts to block, preferring to just take the hit",
            "Their evasive maneuvers are clumsy and ineffective",
            "Displays a shocking lack of self-preservation instincts"
        ]
    }
};

for (const stat of Object.keys(data.persona.bad)) {
    for (const level of ['high', 'low']) {
        const arr = data.persona.bad[stat][level];
        // Replace the placeholder ones that end in (N)
        let placeholderCount = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].text.match(/\(\d+\)$/)) {
                if (placeholderCount < badPersonaLines[stat][level].length) {
                    arr[i].text = badPersonaLines[stat][level][placeholderCount++];
                }
            }
        }
    }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
