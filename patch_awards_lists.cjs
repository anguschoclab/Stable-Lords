const fs = require('fs');

function patchSeasonal() {
  const path = 'src/pages/SeasonalAwards.tsx';
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('import UpsetsList from "@/components/awards/UpsetsList"')) {
    content = content.replace(
      `import AwardCard from "@/components/awards/AwardCard";`,
      `import AwardCard from "@/components/awards/AwardCard";\nimport UpsetsList from "@/components/awards/UpsetsList";`
    );
  }

  content = content.replace(
    /\{\/\* Biggest Upsets \*\/\}\s*\{award\.upsets\.length > 0 && \(\s*<Collapsible>[\s\S]*?<\/Collapsible>\s*\)\}/m,
    `{/* Biggest Upsets */}\n      <UpsetsList upsets={award.upsets} />`
  );

  fs.writeFileSync(path, content, 'utf8');
}

function patchTournament() {
  const path = 'src/pages/TournamentAwards.tsx';
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('import UpsetsList from "@/components/awards/UpsetsList"')) {
    content = content.replace(
      `import AwardCard from "@/components/awards/AwardCard";`,
      `import AwardCard from "@/components/awards/AwardCard";\nimport UpsetsList from "@/components/awards/UpsetsList";\nimport FightsList from "@/components/awards/FightsList";`
    );
  }

  content = content.replace(
    /\{\/\* Upsets \*\/\}\s*\{award\.upsets\.length > 0 && \(\s*<Collapsible>[\s\S]*?<\/Collapsible>\s*\)\}/m,
    `{/* Upsets */}\n      <UpsetsList upsets={award.upsets} />`
  );

  content = content.replace(
    /\{\/\* Fight List \*\/\}\s*\{award\.fights\.length > 0 && \(\s*<Collapsible>[\s\S]*?<\/Collapsible>\s*\)\}/m,
    `{/* Fight List */}\n      <FightsList \n        fights={award.fights} \n        getRound={(id) => award.tournament.bracket.find(b => b.fightId === id)?.round} \n      />`
  );

  fs.writeFileSync(path, content, 'utf8');
}

patchSeasonal();
patchTournament();
console.log('lists patched');
