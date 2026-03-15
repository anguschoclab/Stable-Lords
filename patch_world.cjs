const fs = require('fs');

const path = 'src/pages/WorldOverview.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { SortHeader, type SortDir } from "@/components/ui/sort-header"')) {
    content = content.replace(
      `import { useGame } from "@/state/GameContext";`,
      `import { useGame } from "@/state/GameContext";\nimport { SortHeader, type SortDir } from "@/components/ui/sort-header";`
    );
}

// Remove the inline SortHeader component
content = content.replace(
  /const SortHeader = \(\{ label, field, active, dir, onClick \}: \{ label: string; field: string; active: boolean; dir: SortDir; onClick: \(\) => void \}\) => \([\s\S]*?<\/button>\s*\);/m,
  ''
);

// We need to change the inline type SortDir since we are importing it now
content = content.replace(`type SortDir = "asc" | "desc";`, ``);

fs.writeFileSync(path, content, 'utf8');
console.log('patched world');
