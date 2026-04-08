'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/lib/context';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  MessageCircle, Send, Mic, ShoppingCart, Settings2, AlertTriangle, Check,
} from 'lucide-react';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

type Section = 'shopping' | 'settings' | 'board';

export default function BackyardTab() {
  const [section, setSection] = useState<Section>('shopping');

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'shopping', label: '買い出しリスト', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'settings', label: '発注設定', icon: <Settings2 className="w-4 h-4" /> },
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
      {section === 'settings' && <OrderSettingsView />}
      {section === 'board' && <BoardView />}
    </div>
  );
}

// ─── 買い出しリスト ──────────────────────────────
function ShoppingListView() {
  const { state } = useAppState();
  const [newItem, setNewItem] = useState('');
  const [manualItems, setManualItems] = useState<{ id: string; text: string; done: boolean }[]>([]);

  const today = new Date();
  const todayDow = today.getDay();
  const shoppingDay = state.settings.shoppingDay ?? 1;
  const isShoppingDay = shoppingDay === -1 || todayDow === shoppingDay;
  const nextShoppingLabel = shoppingDay === -1 ? '毎日' : `毎週${DAY_LABELS[shoppingDay]}曜日`;

  // 在庫がminStock以下の品目を抽出
  const localStock = state.localStock ?? [];
  const needOrderItems = state.inventoryItems
    .map((m) => {
      const stock = localStock.find((s) => s.itemName === m.name);
      const currentQty = stock?.quantity ?? 0;
      const minStock = m.minStock ?? 3;
      const orderQty = m.orderQuantity ?? 5;
      return { ...m, currentQty, minStock, orderQty, needsOrder: currentQty <= minStock };
    })
    .filter((i) => i.needsOrder);

  const foodNeedOrder = needOrderItems.filter((i) => (i.itemType ?? 'food') === 'food');
  const supplyNeedOrder = needOrderItems.filter((i) => i.itemType === 'supply');

  const addItem = () => {
    if (!newItem.trim()) return;
    setManualItems([...manualItems, { id: `${Date.now()}`, text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const toggleItem = (id: string) => setManualItems(manualItems.map((i) => i.id === id ? { ...i, done: !i.done } : i));
  const removeItem = (id: string) => setManualItems(manualItems.filter((i) => i.id !== id));

  const renderOrderGroup = (title: string, items: typeof needOrderItems, color: string) => {
    if (items.length === 0) return null;
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className={`text-xs flex items-center gap-1.5 ${color}`}>
            <ShoppingCart className="w-3.5 h-3.5" />{title}
            <Badge className="bg-gray-100 text-gray-500 rounded-full ml-auto text-[10px]">{items.length}件</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 space-y-1">
          {items.map((item) => (
            <div key={item.id} className={`flex items-center justify-between py-2 px-3 rounded-xl ${item.currentQty <= 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
              <div>
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-[10px] text-gray-400 ml-1">({item.category})</span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${item.currentQty <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                    残{item.currentQty}{item.unit}
                  </span>
                  <Badge className="bg-[#ff6b6b] text-white rounded-full text-xs">
                    {item.orderQty}{item.unit}発注
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* 買い出し日ステータス */}
      <Card className={`rounded-2xl border ${isShoppingDay ? 'border-[#ff6b6b] bg-[#fff5f5]' : 'border-gray-200'}`}>
        <CardContent className="py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{format(today, 'M月d日(E)', { locale: ja })}</p>
            <p className="text-xs text-gray-400">買い出し日: {nextShoppingLabel}</p>
          </div>
          {isShoppingDay ? (
            <Badge className="bg-[#ff6b6b] text-white rounded-full">今日は買い出し日</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-500 rounded-full">買い出し日ではありません</Badge>
          )}
        </CardContent>
      </Card>

      {/* 発注が必要な品目 */}
      {needOrderItems.length > 0 ? (
        <>
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">発注が必要: {needOrderItems.length}品目</span>
          </div>
          {renderOrderGroup('食材', foodNeedOrder, 'text-orange-500')}
          {renderOrderGroup('備品', supplyNeedOrder, 'text-blue-500')}
        </>
      ) : (
        <Card className="border border-green-200 bg-green-50 rounded-2xl">
          <CardContent className="py-4 text-center">
            <Check className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-green-600 font-medium">在庫は十分です</p>
          </CardContent>
        </Card>
      )}

      {/* 手動メモ */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">買い出しメモ</CardTitle>
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

// ─── 発注設定 ──────────────────────────────
function OrderSettingsView() {
  const { state, setState } = useAppState();
  const shoppingDay = state.settings.shoppingDay ?? 1;

  const setShoppingDay = (day: number) => {
    setState((s) => ({ ...s, settings: { ...s.settings, shoppingDay: day } }));
  };

  const updateItem = (id: string, field: 'minStock' | 'orderQuantity', value: number) => {
    setState((s) => ({
      ...s,
      inventoryItems: s.inventoryItems.map((i) => i.id === id ? { ...i, [field]: value } : i),
    }));
  };

  const foodItems = state.inventoryItems.filter((i) => (i.itemType ?? 'food') === 'food');
  const supplyItems = state.inventoryItems.filter((i) => i.itemType === 'supply');

  const renderGroup = (title: string, items: typeof state.inventoryItems, color: string) => {
    if (items.length === 0) return null;

    const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
      const cat = item.category || '未分類';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return (
      <div className="space-y-2">
        <h3 className={`text-sm font-bold px-1 ${color}`}>{title}</h3>
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => (
          <Card key={category} className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-gray-400">{category}</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 space-y-2">
              {catItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-1">
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">{item.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-400">最低</span>
                    <Input
                      type="number"
                      value={item.minStock ?? 3}
                      onChange={(e) => updateItem(item.id, 'minStock', Number(e.target.value))}
                      className="w-14 h-7 text-xs text-center rounded-lg px-1"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-400">発注</span>
                    <Input
                      type="number"
                      value={item.orderQuantity ?? 5}
                      onChange={(e) => updateItem(item.id, 'orderQuantity', Number(e.target.value))}
                      className="w-14 h-7 text-xs text-center rounded-lg px-1"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-6">{item.unit}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 買い出し曜日設定 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">買い出し曜日</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-1">
            <button
              onClick={() => setShoppingDay(-1)}
              className={`py-2 rounded-xl text-xs font-medium transition-all ${shoppingDay === -1 ? 'bg-[#ff6b6b] text-white' : 'bg-gray-50 text-gray-500'}`}
            >毎日</button>
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setShoppingDay(i)}
                className={`py-2 rounded-xl text-xs font-medium transition-all ${shoppingDay === i ? 'bg-[#ff6b6b] text-white' : 'bg-gray-50 text-gray-500'}`}
              >{label}</button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">選択した曜日に買い出しリストがハイライトされます</p>
        </CardContent>
      </Card>

      {/* 各商品の最低在庫・発注数 */}
      <Card className="bg-blue-50 border-blue-200 rounded-2xl">
        <CardContent className="py-3">
          <p className="text-xs text-blue-700">「最低」以下になると買い出しリストに自動追加されます。「発注」は購入すべき数量です。</p>
        </CardContent>
      </Card>

      {renderGroup('食材', foodItems, 'text-orange-500')}
      {renderGroup('備品', supplyItems, 'text-blue-500')}

      {state.inventoryItems.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">商品マスタが登録されていません</div>
      )}
    </div>
  );
}

// ─── 連絡ボード ──────────────────────────────
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
