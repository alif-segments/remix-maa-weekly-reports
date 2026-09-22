// Protect against environments where window.fetch has only a getter on Window.prototype
if (typeof window !== 'undefined') {
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || desc.configurable) {
      let _fetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined;
      Object.defineProperty(window, 'fetch', {
        get() {
          return _fetch;
        },
        set(fn) {
          _fetch = typeof fn === 'function' ? fn.bind(window) : fn;
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch (_) {}
}

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
