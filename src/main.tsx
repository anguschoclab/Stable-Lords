import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { applyA11yPrefs, loadA11yPrefs } from './lib/a11yPrefs';

applyA11yPrefs(loadA11yPrefs());

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

// Dark-only theme: applied statically via `class="dark"` on <html>.
createRoot(container).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
