import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ViewModeProvider } from './context/ViewModeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ViewModeProvider>
      <App />
    </ViewModeProvider>
  </StrictMode>,
);
