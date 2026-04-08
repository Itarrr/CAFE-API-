'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/lib/context';
import { format } from 'date-fns';
import {
  MessageCircle, Send, Mic, ShoppingCart,
} from 'lucide-react';

type Section = 'shopping' | 'board';

export default function BackyardTab() {
  const [section, setSection] = useState<Section>('shopping');

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'shopping', label: '買い出しリスト', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'board', label: '連絡ボード', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-50 rounded-xl p-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 text-sm py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
              section === s.id ? 'bg-white shadow-sm font-medium text-[#ff6b6b]' : 'text-gray-400'
            }`}
          >
            {s.icon}{s.label}
          </button>
        ))}
      </div>

      {section === 'shopping' && <ShoppingListView />}
      {section === 'board' && <BoardView />}
    </div>
  );
}

function ShoppingListView() {
  const { state, setState } = useAppState();
  const [newItem, setNewItem] = useState('');

  // ローカル在庫から在庫切れ・残りわずかの品目を自動抽出
  const localStock = state.localStock ?? [];
  const masterItems = state.inventoryItems;
  const allItems = masterItems.map((m) => {
    const stock = localStock.find((s) => s.itemName === m.name);
    return { name: m.name, quantity: stock?.quantity ?? 0, unit: m.unit, category: m.category, itemType: m.itemType };
  });
  const lowStockItems = allItems.filter((i) => i.quantity <= 3);

  // 手動追加の買い出しリスト
  const [manualItems, setManualItems] = useState<{ id: string; text: string; done: boolean }[]>([]);

  const addItem = () => {
    if (!newItem.trim()) return;
    setManualItems([...manualItems, { id: `${Date.now()}`, text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const toggleItem = (id: string) => {
    setManualItems(manualItems.map((i) => i.id === id ? { ...i, done: !i.done } : i));
  };

  const removeItem = (id: string) => {
    setManualItems(manualItems.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* 在庫切れ・残りわずかの自動リスト */}
      {lowStockItems.length > 0 && (
        <Card className="border border-red-200 bg-red-50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-red-600">
              <ShoppingCart className="w-4 h-4" />在庫が少ない品目
              <Badge className="bg-red-100 text-red-600 rounded-full ml-auto text-[10px]">{lowStockItems.length}件</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 space-y-1">
            {lowStockItems.map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-1.5 px-3 rounded-xl ${item.quantity <= 0 ? 'bg-white' : 'bg-red-50/50'}`}>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] rounded-full ${item.itemType === 'supply' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                    {item.itemType === 'supply' ? '備品' : '食材'}
                  </Badge>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className={`text-sm font-bold ${item.quantity <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {item.quantity}{item.unit}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lowStockItems.length === 0 && (
        <Card className="border border-green-200 bg-green-50 rounded-2xl">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-green-600 font-medium">在庫は十分です</p>
          </CardContent>
        </Card>
      )}

      {/* 手動追加 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">買い出しメモを追加</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="例: 牛乳 2本"
              className="flex-1 border rounded-xl px-3 py-2 text-sm bg-white"
            />
            <Button onClick={addItem} className="bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl" disabled={!newItem.trim()}>追加</Button>
          </div>
        </CardContent>
      </Card>

      {/* 手動リスト */}
      {manualItems.length > 0 && (
        <div className="space-y-1.5">
          {manualItems.map((item) => (
            <div key={item.id} className={`flex items-center justify-between py-2 px-3 rounded-xl bg-white shadow-sm ${item.done ? 'opacity-50' : ''}`}>
              <button onClick={() => toggleItem(item.id)} className="flex items-center gap-2 flex-1 text-left">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${item.done ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                  {item.done && '✓'}
                </div>
                <span className={`text-sm ${item.done ? 'line-through text-gray-400' : ''}`}>{item.text}</span>
              </button>
              <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-xs ml-2">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoardView() {
  const { state, setState } = useAppState();
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'notice' | 'handover'>('notice');

  const send = () => {
    if (!msg.trim()) return;
    setState((s) => ({
      ...s,
      boardMessages: [
        {
          id: `msg-${Date.now()}`,
          type: msgType,
          author: s.employees[0]?.name ?? 'オーナー',
          content: msg,
          createdAt: new Date().toISOString(),
        },
        ...s.boardMessages,
      ],
    }));
    setMsg('');
  };

  const typeLabel = (t: string) => t === 'report' ? '完了報告' : t === 'notice' ? '連絡' : '引き継ぎ';
  const typeColor = (t: string) => t === 'report' ? 'bg-green-50 text-green-600' : t === 'notice' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600';

  const today = format(new Date(), 'yyyy-MM-dd');
  const previousHandovers = (state.voiceLogs ?? [])
    .filter((log) => log.date !== today && log.classified.handover.length > 0)
    .slice(0, 1);

  return (
    <div className="space-y-4">
      {previousHandovers.length > 0 && previousHandovers[0].classified.handover.length > 0 && (
        <Card className="border border-orange-200 bg-orange-50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-orange-600">
              <Mic className="w-4 h-4" />前日引き継ぎ
              <Badge className="bg-orange-100 text-orange-600 rounded-full ml-auto text-[10px]">{previousHandovers[0].date}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <ul className="space-y-1">
              {previousHandovers[0].classified.handover.map((item, i) => (
                <li key={i} className="text-sm text-orange-700">* {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={msgType}
              onChange={(e) => setMsgType(e.target.value as 'notice' | 'handover')}
              className="border rounded-xl px-2 text-sm h-9 bg-white"
            >
              <option value="notice">連絡事項</option>
              <option value="handover">引き継ぎ</option>
            </select>
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="メッセージを入力..." rows={2} className="flex-1 rounded-xl" />
          </div>
          <Button onClick={send} className="w-full bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl" disabled={!msg.trim()}>
            <Send className="w-4 h-4 mr-1" />送信
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {state.boardMessages.map((m) => (
          <Card key={m.id} className="rounded-2xl border-0 shadow-sm">
            <CardContent className="py-2.5">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{m.author}</span>
                  <Badge className={`text-[10px] rounded-full ${typeColor(m.type)}`}>{typeLabel(m.type)}</Badge>
                </div>
                <span className="text-[10px] text-gray-400">
                  {format(new Date(m.createdAt), 'HH:mm')}
                </span>
              </div>
              <p className="text-sm text-gray-600">{m.content}</p>
            </CardContent>
          </Card>
        ))}
        {state.boardMessages.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">メッセージがありません</div>
        )}
      </div>
    </div>
  );
}
