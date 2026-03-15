const fs = require('fs');

const path = 'src/pages/SeasonalAwards.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import AwardCard from "@/components/awards/AwardCard"')) {
    content = content.replace(
`import { useGame } from "@/state/GameContext";`,
`import { useGame } from "@/state/GameContext";
import AwardCard from "@/components/awards/AwardCard";`
    );
}

// Remove the inline replacement that we put in the middle of nowhere previously
content = content.replace(`import AwardCard from "@/components/awards/AwardCard";\n\n/* ── Season Section ──────────────────────────────────────── */`, `/* ── Season Section ──────────────────────────────────────── */`);

fs.writeFileSync(path, content, 'utf8');
console.log('patched2');
