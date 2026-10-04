const fs = require('fs');

function extractArray(filePath, arrayName) {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(`export const ${arrayName}: string\\[\\] = \\[([\\s\\S]*?)\\];`);
    const match = content.match(regex);
    if (!match) return [];

    // Evaluate the array content
    // Be careful with eval, but here it's our own file
    const arrayStr = `[${match[1]}]`;
    try {
        // use a simple parser or eval
        return eval(arrayStr);
    } catch (e) {
        console.error("Eval failed for", arrayName, e);
        return [];
    }
}

function stringSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength == 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i == 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

const files = [
    { path: 'src/engine/narrative/lore/origins.ts', name: 'ORIGINS' },
    { path: 'src/engine/narrative/lore/childhoodTraits.ts', name: 'CHILDHOOD_TRAITS' },
    { path: 'src/engine/narrative/lore/definingMoments.ts', name: 'DEFINING_MOMENTS' }
];

for (const file of files) {
    console.log(`Checking ${file.name}...`);
    const arr = extractArray(file.path, file.name);
    console.log(`Found ${arr.length} entries.`);
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            const sim = stringSimilarity(arr[i], arr[j]);
            if (sim > 0.8) {
                duplicates.push({ i, j, sim, str1: arr[i], str2: arr[j] });
            }
        }
    }
    console.log(`Found ${duplicates.length} duplicates in ${file.name}`);
    for (const d of duplicates) {
        console.log(`  ${(d.sim * 100).toFixed(1)}%: "${d.str1}"\n         "${d.str2}"`);
    }
}
