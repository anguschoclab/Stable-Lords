import fs from 'fs';

let content = fs.readFileSync('src/test/hooks/useWeekExecution.test.ts', 'utf8');
content = content.replace(/vi.mocked\(useWorldState\).mockImplementation\(\(\) => \(\{/g, 'vi.mocked(useWorldState).mockImplementation(() => ({\n      ...store,');
content = content.replace(/useWorldState: vi.fn\(\(\) => \(\{/g, 'useWorldState: vi.fn(() => ({\n      ...store,');
fs.writeFileSync('src/test/hooks/useWeekExecution.test.ts', content, 'utf8');

let content2 = fs.readFileSync('src/test/state/selectors.test.ts', 'utf8');
content2 = content2.replace(/import \{ \n  useWorldState,\n/g, 'import {\n');
content2 = content2.replace(/import type \{ GameState \} from '@\/types\/state.types';\nimport type \{ Warrior \} from '@\/types\/warrior.types';/g, '');
fs.writeFileSync('src/test/state/selectors.test.ts', content2, 'utf8');
