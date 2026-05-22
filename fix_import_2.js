import fs from 'fs';
const file = 'src/engine/tick/TimeAdvanceService.ts';
let code = fs.readFileSync(file, 'utf8');

// The `telemetry` import was already changed. Let's look at the top of the file:
