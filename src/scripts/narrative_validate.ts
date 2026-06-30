import fs from 'fs';

const contentPath = 'src/data/narrativeContent.json';
const content = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));

let errors = 0;

function validateArray(arr: any[], path: string) {
    if (!Array.isArray(arr)) return;
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (typeof item === 'string') {
            const openCount = (item.match(/\{/g) || []).length;
            const closeCount = (item.match(/\}/g) || []).length;
            if (openCount !== closeCount) {
                console.error(`Mismatching brackets in ${path}[${i}]: ${item}`);
                errors++;
            }

            // Only enforce variables strictly on attacks, defenses, knockdowns, and executions
            if (path.includes('pbp.attacks') || path.includes('pbp.defenses') || path.includes('pbp.knockdown.pacing') || path.includes('pbp.executions')) {
                if (!item.includes('{{attacker}}') && !item.includes('{{defender}}') && !item.includes('{{name}}') && !item.includes('{{a}}') && !item.includes('{{b}}')) {
                    console.error(`Missing template variables in ${path}[${i}]: ${item}`);
                    errors++;
                }
            }
        }
    }
}

function traverseAndValidate(obj: any, path = '') {
    if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === 'string') {
            validateArray(obj, path);
        } else {
             obj.forEach((item, i) => traverseAndValidate(item, `${path}[${i}]`));
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            traverseAndValidate(obj[key], path ? `${path}.${key}` : key);
        }
    }
}

traverseAndValidate(content);

if (errors > 0) {
    console.error(`Validation failed with ${errors} errors.`);
    process.exit(1);
} else {
    console.log('Narrative content validation passed.');
}
