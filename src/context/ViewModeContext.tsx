import React, { createContext, useContext, useState, useEffect } from 'react';

type ViewMode = 'slide' | 'section';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: 'slide',
  setViewMode: () => {},
});

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'section') return 'section';
    }
    return 'slide';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (mode === 'section') {
        url.searchParams.set('view', 'section');
      } else {
        url.searchParams.set('view', 'slide');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (viewMode === 'section') {
      document.documentElement.classList.add('view-section');
    } else {
      document.documentElement.classList.remove('view-section');
    }
  }, [viewMode]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      setViewModeState(v === 'section' ? 'section' : 'slide');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);
