'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppState } from './types';
import { loadState, saveState } from './store';

interface AppContextType {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  loaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const s = loadState();
    setStateRaw(s);
    setLoaded(true);
  }, []);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  if (!loaded || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse text-gray-400 text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, setState, loaded }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
