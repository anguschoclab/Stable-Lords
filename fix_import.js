import fs from 'fs';
const file = 'src/engine/tick/TimeAdvanceService.ts';
let code = fs.readFileSync(file, 'utf8');

// I notice my patch _removed_ the telemetry import by accident!
// Let's add it back if it's missing or fix it if it's wrong.
// Look at the git diff from earlier:
// -import { telemetry, TelemetryEvents, TelemetryTags } from '@/engine/telemetry';
// I overwrote the import when doing `patch_super_real.js`... wait, I didn't mean to delete it!

code = code.replace(
`import { flushDeferredArchives } from '@/engine/pipeline/adapters/opfsArchiver';

/**`,
`import { flushDeferredArchives } from '@/engine/pipeline/adapters/opfsArchiver';
import { telemetry, TelemetryEvents, TelemetryTags } from '@/engine/telemetry';

/**`
);
fs.writeFileSync(file, code);
