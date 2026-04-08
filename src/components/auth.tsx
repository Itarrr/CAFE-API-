'use client';

import { useState } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Coffee, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Auth({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('メールアドレスまたはパスワードが間違っています');
    } else {
      onAuth();
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!email || !password) return;
    if (password.length < 6) { setError('パスワードは6文字以上にしてください'); return; }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message.includes('already') ? 'このメールアドレスは既に登録されています' : error.message);
    } else if (data.user) {
      // 新規ユーザーのapp_dataを作成
      await supabase.from('app_data').insert({
        user_id: data.user.id,
        store_name: storeName || '',
        data: {},
      });
      onAuth();
    }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (mode === 'login') handleLogin();
    else handleSignup();
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg border-0 rounded-3xl">
        <CardContent className="pt-8 pb-6 px-6">
          {/* ロゴ */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#ff6b6b] rounded-3xl flex items-center justify-center mx-auto mb-3">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">手離し経営</CardTitle>
            <p className="text-sm text-gray-400 mt-1">カフェ現場管理アプリ</p>
          </div>

          {/* モード切り替え */}
          <div className="flex bg-gray-50 rounded-xl p-1 mb-5">
            <button onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'login' ? 'bg-white shadow-sm font-medium text-[#ff6b6b]' : 'text-gray-400'
              }`}>
              <LogIn className="w-4 h-4" />ログイン
            </button>
            <button onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'signup' ? 'bg-white shadow-sm font-medium text-[#ff6b6b]' : 'text-gray-400'
              }`}>
              <UserPlus className="w-4 h-4" />新規登録
            </button>
          </div>

          {/* フォーム */}
          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label className="text-xs text-gray-500">店舗名（任意）</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="例: CAFE TEBANASHI"
                  className="mt-1 rounded-xl"
                />
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />メールアドレス
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="mt-1 rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />パスワード
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '6文字以上' : 'パスワード'}
                className="mt-1 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          {/* エラー */}
          {error && (
            <p className="text-sm text-red-500 text-center mt-3 bg-red-50 rounded-xl py-2">{error}</p>
          )}

          {/* ボタン */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full h-12 mt-5 bg-[#ff6b6b] hover:bg-[#e05555] rounded-2xl text-base font-bold"
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
          </Button>

          <p className="text-[10px] text-gray-300 text-center mt-4">
            {mode === 'login' ? 'アカウントがない場合は「新規登録」から作成してください' : 'どの端末からでも同じアカウントでログインできます'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
