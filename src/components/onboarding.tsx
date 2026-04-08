'use client';

import { useState } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import { Coffee, Mail, User } from 'lucide-react';

export default function Onboarding() {
  const { setState } = useAppState();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  const canStart = userName.trim().length > 0 && email.includes('@');

  const start = () => {
    if (!canStart) return;
    setState((prev) => ({
      ...prev,
      settings: {
        storeName: `${userName}のカフェ`,
        openTime: '09:00',
        closeTime: '22:00',
        onboarded: true,
        notifyEmail: email,
        gasUrl: '',
        shoppingDay: 1,
      },
      employees: [
        { id: generateId(), name: userName, role: 'manager', hourlyWage: 1200, joinedDate: new Date().toISOString().split('T')[0] },
      ],
      taskTemplates: [
        { id: generateId(), title: 'テーブル拭き・セッティング', category: '清掃', description: '全テーブルの拭き上げとセット直し', videoUrl: '', points: 10, repeatable: true, estimateMinutes: 5 },
        { id: generateId(), title: 'フロア清掃（モップがけ）', category: '清掃', description: 'フロア全体のモップがけ・掃き掃除', videoUrl: '', points: 15, repeatable: true, estimateMinutes: 10 },
        { id: generateId(), title: 'トイレ清掃', category: '清掃', description: 'トイレの清掃・消耗品の補充・鏡磨き', videoUrl: '', points: 20, repeatable: true, estimateMinutes: 15 },
        { id: generateId(), title: 'グラス・カップ磨き', category: '整理整頓', description: 'グラスやカップの磨き上げ・棚の整理', videoUrl: '', points: 10, repeatable: true, estimateMinutes: 10 },
        { id: generateId(), title: '在庫チェック・補充', category: '在庫管理', description: '消耗品・食材の在庫確認と棚への補充', videoUrl: '', points: 15, repeatable: false, estimateMinutes: 10 },
        { id: generateId(), title: 'バックヤード整理', category: '整理整頓', description: 'バックヤードの整理・動線確保・在庫の並べ直し', videoUrl: '', points: 20, repeatable: false, estimateMinutes: 15 },
        { id: generateId(), title: '食材仕込み', category: '仕込み', description: '翌日分の食材カット・下準備', videoUrl: '', points: 30, repeatable: false, estimateMinutes: 20 },
        { id: generateId(), title: '外回り清掃', category: '清掃', description: '入口・看板周辺の清掃・ゴミ拾い', videoUrl: '', points: 15, repeatable: false, estimateMinutes: 10 },
        { id: generateId(), title: 'POP・メニュー整備', category: 'その他', description: 'メニューやPOPの清掃・差し替え・整頓', videoUrl: '', points: 10, repeatable: false, estimateMinutes: 10 },
        { id: generateId(), title: '冷蔵庫清掃・整理', category: '清掃', description: '冷蔵庫内の清掃・賞味期限チェック・整理', videoUrl: '', points: 25, repeatable: false, estimateMinutes: 20 },
      ],
      inventoryItems: [
        { id: generateId(), name: 'コーヒー豆', unit: 'kg', category: '飲料', itemType: 'food' as const, minStock: 3, orderQuantity: 5, costPerUnit: 2500 },
        { id: generateId(), name: '牛乳', unit: 'L', category: '乳製品', itemType: 'food' as const, minStock: 3, orderQuantity: 5, costPerUnit: 250 },
        { id: generateId(), name: '砂糖', unit: 'kg', category: '調味料', itemType: 'food' as const, minStock: 3, orderQuantity: 5, costPerUnit: 300 },
        { id: generateId(), name: 'パン', unit: '個', category: '食材', itemType: 'food' as const, minStock: 3, orderQuantity: 5, costPerUnit: 150 },
      ],
    }));
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

          {/* 入力フォーム */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />あなたの名前
              </Label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="例: 田中太郎"
                className="mt-1 rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />メールアドレス
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例: tanaka@example.com"
                className="mt-1 rounded-xl"
              />
              <p className="text-[10px] text-gray-400 mt-1">在庫切れなどの通知が届きます</p>
            </div>
          </div>

          {/* 開始ボタン */}
          <Button
            onClick={start}
            disabled={!canStart}
            className="w-full h-12 mt-6 bg-[#ff6b6b] hover:bg-[#e05555] rounded-2xl text-base font-bold"
          >
            はじめる
          </Button>

          <p className="text-[10px] text-gray-300 text-center mt-4">
            店舗名・営業時間・従業員は設定タブからいつでも変更できます
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
