'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AppProvider } from '@/lib/context';
import MainApp from '@/components/main-app';
import Auth from '@/components/auth';

export default function Home() {
  const [session, setSession] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    // 初回チェック
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ローディング中
  if (session === null) {
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

  // 未ログイン → 認証画面
  if (!session) {
    return <Auth onAuth={() => setSession(true)} />;
  }

  // ログイン済み → アプリ
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
