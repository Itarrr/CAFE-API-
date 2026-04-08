'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AppState } from './types';
import { loadState, saveState } from './store';
import { supabase } from './supabase';

interface AppContextType {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  loaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Supabaseからデータを読み込み、なければlocalStorageから
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('app_data')
          .select('data')
          .eq('user_id', session.user.id)
          .single();

        if (data?.data && Object.keys(data.data).length > 0) {
          // Supabaseにデータがある → それを使う
          const localDefault = loadState();
          const merged = { ...localDefault, ...data.data } as AppState;
          // マイグレーション
          merged.inventoryItems = (merged.inventoryItems ?? []).map((item) => ({
            ...item,
            itemType: item.itemType ?? 'food',
            minStock: item.minStock ?? 3,
            orderQuantity: item.orderQuantity ?? 5,
          }));
          merged.settings = {
            ...merged.settings,
            notifyEmail: merged.settings.notifyEmail ?? session.user.email ?? '',
            gasUrl: merged.settings.gasUrl ?? '',
            shoppingDay: merged.settings.shoppingDay ?? 1,
          };
          merged.localStock = merged.localStock ?? [];
          setStateRaw(merged);
          saveState(merged); // localStorageにもキャッシュ
        } else {
          // Supabaseにデータがない → localStorageから読み込み、Supabaseに初回保存
          const s = loadState();
          if (s.settings.notifyEmail === '' && session.user.email) {
            s.settings.notifyEmail = session.user.email;
          }
          setStateRaw(s);
          await supabase.from('app_data').upsert({
            user_id: session.user.id,
            store_name: s.settings.storeName,
            data: s,
          });
        }
      } else {
        // ログインしていない場合（通常はauth画面に行くが念のため）
        setStateRaw(loadState());
      }
      setLoaded(true);
    };
    init();
  }, []);

  // Supabaseに保存（デバウンス: 1秒後に保存）
  const saveToSupabase = useCallback(async (newState: AppState) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('app_data').upsert({
      user_id: session.user.id,
      store_name: newState.settings.storeName,
      data: newState,
    });
  }, []);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveState(next); // localStorageに即座に保存

      // Supabaseへのデバウンス保存
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveToSupabase(next), 1000);

      return next;
    });
  }, [saveToSupabase]);

  if (!loaded || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f8f8]">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#ff6b6b] rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white text-xl">☕</span>
          </div>
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
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
