import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { applyA11yPrefs, loadA11yPrefs } from './lib/a11yPrefs';

applyA11yPrefs(loadA11yPrefs());

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);
