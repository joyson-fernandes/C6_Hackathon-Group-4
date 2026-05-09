import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AnalysisStoreProvider } from './store/AnalysisStore';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnalysisStoreProvider>
      <App />
    </AnalysisStoreProvider>
  </StrictMode>,
);
