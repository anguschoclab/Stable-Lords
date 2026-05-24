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

// Initialize HowlerGlobal for Electron environment
// Note: Howler.js types expect HowlerGlobal to be a class, but we initialize
// as empty object for Electron compatibility. This is intentional.
if (typeof window.HowlerGlobal === 'undefined') {
  (window as any).HowlerGlobal = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);
