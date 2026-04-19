import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const App = lazy(() => import('./App.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center font-sans overflow-hidden">
            <div className="text-cyber-blue font-mono animate-pulse">INITIALIZING INTERFACE...</div>
          </div>
        }
      >
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
