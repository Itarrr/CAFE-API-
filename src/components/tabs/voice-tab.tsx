'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import { format } from 'date-fns';
import type { VoiceLogClassified, ParsedInventoryItem, InventoryItemType } from '@/lib/types';
import {
  Mic, AlertTriangle, Archive, FileText, Plus, Send, Package, X, Upload,
} from 'lucide-react';

// ─── キーワード自動分類ロジック ──────────────────────────────
function classifyText(text: string, masterItems: string[]): VoiceLogClassified {
  const sentences = text
    .split(/[。\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const urgentKeywords = ['緊急', '至急', '切れ', 'ない', 'ゼロ', '不足'];
  const inventoryKeywords = ['消費', '入荷', '残量', '確認', '個', '本', '枚', 'キロ', '補充', '使用', '仕入'];
  const handoverTriggers = ['引き継ぎ', '引継ぎ', 'ひきつぎ', '申し送り', '申送り', '連絡事項'];

  const urgent: string[] = [];
  const inventory: string[] = [];
  const inventoryParsed: ParsedInventoryItem[] = [];
  const handover: string[] = [];

  // 引き継ぎモード: トリガーワードが出たら、以降の文を引き継ぎとして拾う
  let handoverMode = false;

  for (const sentence of sentences) {
    // 引き継ぎトリガーを含む文 → 引き継ぎモードON
    const hasHandoverTrigger = handoverTriggers.some((kw) => sentence.includes(kw));
    if (hasHandoverTrigger) {
      handoverMode = true;
      // トリガーワードの後ろに内容があればそれも引き継ぎに含める
      // 例: "引き継ぎですが、明日シフト変更あります" → 全文を引き継ぎに
      handover.push(sentence);
      continue;
    }

    // 引き継ぎモード中は、緊急・在庫以外を引き継ぎとして拾う
    const hasMasterItem = masterItems.some((item) => sentence.includes(item));
    const isUrgent = urgentKeywords.some((kw) => sentence.includes(kw));
    const isInventory = hasMasterItem || inventoryKeywords.some((kw) => sentence.includes(kw));

    if (isUrgent) {
      urgent.push(sentence);
      const parsed = parseInventorySentence(sentence, masterItems);
      if (parsed) { inventory.push(sentence); inventoryParsed.push(parsed); }
      // 緊急は引き継ぎモードをリセットしない
    } else if (isInventory) {
      inventory.push(sentence);
      const parsed = parseInventorySentence(sentence, masterItems);
      if (parsed) inventoryParsed.push(parsed);
    } else if (handoverMode) {
      // 引き継ぎモード中 → 引き継ぎに追加
      handover.push(sentence);
    }
    // それ以外（雑談等）は何もしない → 捨てる
  }

  return { urgent, inventory, inventoryParsed, handover };
}

// ─── 在庫テキストから品目・数量・操作を抽出 ──────────────────
function parseInventorySentence(sentence: string, masterItems: string[]): ParsedInventoryItem | null {
  const numMap: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    'ひとつ': 1, 'ふたつ': 2, 'みっつ': 3, 'よっつ': 4, 'いつつ': 5,
  };
  const units = ['個', '本', '枚', 'キロ', 'kg', 'g', 'リットル', 'L', 'パック', '袋', '缶', '箱', 'つ', 'ケース', '瓶', '切り身', 'ポーション', 'ボトル'];
  const unitPattern = units.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  const isRestock = /入荷|補充|追加|仕入/.test(sentence);
  const action: 'consume' | 'restock' = isRestock ? 'restock' : 'consume';

  // マスタ商品名で先にマッチを試みる（長い名前から）
  const sortedMaster = [...masterItems].sort((a, b) => b.length - a.length);
  for (const itemName of sortedMaster) {
    if (!sentence.includes(itemName)) continue;
    // 商品名の後ろに数量があるか探す
    const afterItem = sentence.slice(sentence.indexOf(itemName) + itemName.length);
    const numMatch = afterItem.match(new RegExp(`[をがは]?(\\d+|[一二三四五六七八九十]+)\\s*(${unitPattern})?`));
    if (numMatch) {
      const qRaw = numMatch[1];
      const qty = numMap[qRaw] ?? (Number(qRaw) || 1);
      const unit = numMatch[2] || '個';
      return { item: itemName, quantity: qty, unit, action, raw: sentence };
    }
    // 数量なしでもマスタに合致したら1個として記録
    return { item: itemName, quantity: 1, unit: '個', action, raw: sentence };
  }

  // フォールバック: 従来のパターンマッチ
  const p1 = new RegExp(`^(.+?)[をがは]?(\\d+|[一二三四五六七八九十]+)(${unitPattern})`, 'u');
  const m1 = sentence.match(p1);
  if (m1) {
    const qRaw = m1[2];
    const qty = numMap[qRaw] ?? (Number(qRaw) || 1);
    return { item: m1[1].trim(), quantity: qty, unit: m1[3], action, raw: sentence };
  }

  const kanaCounts = Object.keys(numMap).filter((k) => k.length > 1);
  for (const kana of kanaCounts) {
    if (sentence.includes(kana)) {
      const idx = sentence.indexOf(kana);
      const item = sentence.slice(0, idx).replace(/[をがは]$/, '').trim();
      if (item) return { item, quantity: numMap[kana], unit: '個', action, raw: sentence };
    }
  }

  const p3 = /^(.+?)[をがは]?(\d+)\s*(消費|入荷|補充|追加|使用|仕入)/u;
  const m3 = sentence.match(p3);
  if (m3) return { item: m3[1].trim(), quantity: Number(m3[2]), unit: '個', action, raw: sentence };

  return null;
}

type SubTab = 'log' | 'master';

export default function VoiceTab() {
  const [subTab, setSubTab] = useState<SubTab>('log');

  return (
    <div className="space-y-4">
      {/* サブタブ切り替え */}
      <div className="flex bg-gray-50 rounded-xl p-1">
        <button
          onClick={() => setSubTab('log')}
          className={`flex-1 text-sm py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            subTab === 'log' ? 'bg-white shadow-sm font-medium text-[#ff6b6b]' : 'text-gray-400'
          }`}
        >
          <Mic className="w-4 h-4" />音声ログ
        </button>
        <button
          onClick={() => setSubTab('master')}
          className={`flex-1 text-sm py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            subTab === 'master' ? 'bg-white shadow-sm font-medium text-[#ff6b6b]' : 'text-gray-400'
          }`}
        >
          <Package className="w-4 h-4" />商品マスタ登録
        </button>
      </div>

      {subTab === 'log' ? <VoiceLogView /> : <MasterRegistrationView />}
    </div>
  );
}

// ─── 音声ログ入力・分類 ────────────────────────────────────
function VoiceLogView() {
  const { state, setState } = useAppState();
  const [rawText, setRawText] = useState('');
  const [classified, setClassified] = useState<VoiceLogClassified | null>(null);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const masterItems = state.inventoryItems.map((i) => i.name);

  const handleClassify = () => {
    if (!rawText.trim()) return;
    const result = classifyText(rawText, masterItems);
    setClassified(result);
    setSaved(false);
    setSendResult(null);
  };

  const handleSave = () => {
    if (!classified) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setState((s) => {
      // ローカル在庫を更新
      const newStock = [...(s.localStock ?? [])];
      for (const p of classified.inventoryParsed) {
        const masterItem = s.inventoryItems.find((i) => i.name === p.item);
        const idx = newStock.findIndex((st) => st.itemName === p.item);
        if (idx >= 0) {
          const qty = p.action === 'consume'
            ? Math.max(0, newStock[idx].quantity - p.quantity)
            : newStock[idx].quantity + p.quantity;
          newStock[idx] = { ...newStock[idx], quantity: qty, lastUpdated: today };
        } else {
          newStock.push({
            itemName: p.item,
            quantity: p.action === 'consume' ? 0 : p.quantity,
            unit: p.unit,
            category: masterItem?.category ?? '未分類',
            itemType: masterItem?.itemType ?? 'food',
            lastUpdated: today,
          });
        }
      }
      return {
        ...s,
        voiceLogs: [{
          id: generateId(), date: today, rawText, classified, createdAt: new Date().toISOString(),
        }, ...(s.voiceLogs ?? [])],
        localStock: newStock,
      };
    });
    setSaved(true);
  };

  const GAS_URL = state.settings.gasUrl || '';

  const handleSendToSheet = async () => {
    if (!classified) return;
    const today = format(new Date(), 'yyyy-MM-dd');

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'voiceLog',
          date: today,
          notifyEmail: state.settings.notifyEmail || '',
          urgent: classified.urgent,
          inventory: classified.inventory,
          inventoryParsed: classified.inventoryParsed.map((p) => {
            // 完全一致 → 部分一致の順でマスタを検索
            const masterItem = state.inventoryItems.find((i) => i.name === p.item)
              ?? state.inventoryItems.find((i) => p.item.includes(i.name) || i.name.includes(p.item));
            return { ...p, itemType: masterItem?.itemType ?? 'food' };
          }),
          handover: classified.handover,
          // GAS側でも参照できるよう商品タイプマップを送信
          itemTypeMap: Object.fromEntries(
            state.inventoryItems.map((i) => [i.name, i.itemType ?? 'food'])
          ),
        }),
      });
      setSendResult(res.ok ? 'success' : 'error');
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-[#ff6b6b]" />音声ログ入力
          </CardTitle>
          <p className="text-xs text-gray-400">登録済み商品名: {masterItems.length}件（自動マッチに使用）</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={rawText}
            onChange={(e) => { setRawText(e.target.value); setClassified(null); setSaved(false); setSendResult(null); }}
            placeholder="Ankerの文字起こしデータをここに貼り付けてください"
            rows={8}
            className="text-sm rounded-xl"
          />
          <Button onClick={handleClassify} className="w-full bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl" disabled={!rawText.trim()}>
            <FileText className="w-4 h-4 mr-1" />キーワードで自動分類
          </Button>
        </CardContent>
      </Card>

      {classified && (
        <>
          {/* 緊急 */}
          <Card className="border border-red-200 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-red-600">
                <AlertTriangle className="w-4 h-4" />緊急アラート
                <Badge className="bg-red-50 text-red-600 rounded-full ml-auto">{classified.urgent.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classified.urgent.length > 0 ? (
                <ul className="space-y-1">{classified.urgent.map((s, i) => (
                  <li key={i} className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-1.5">{s}</li>
                ))}</ul>
              ) : <p className="text-sm text-gray-400">該当なし</p>}
            </CardContent>
          </Card>

          {/* 在庫 */}
          <Card className="border border-blue-200 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-blue-600">
                <Archive className="w-4 h-4" />在庫ログ
                <Badge className="bg-blue-50 text-blue-600 rounded-full ml-auto">{classified.inventoryParsed.length}件パース</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classified.inventoryParsed.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-blue-50">
                        <th className="text-left px-2 py-1.5 text-xs text-blue-600">品目</th>
                        <th className="text-center px-2 py-1.5 text-xs text-blue-600">数量</th>
                        <th className="text-center px-2 py-1.5 text-xs text-blue-600">操作</th>
                        <th className="text-left px-2 py-1.5 text-xs text-blue-600">元テキスト</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classified.inventoryParsed.map((p, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-2 py-1.5 font-medium">{p.item}</td>
                          <td className="px-2 py-1.5 text-center">{p.quantity}{p.unit}</td>
                          <td className="px-2 py-1.5 text-center">
                            <Badge className={`rounded-full ${p.action === 'consume' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {p.action === 'consume' ? '消費' : '入荷'}
                            </Badge>
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-400">{p.raw}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : classified.inventory.length > 0 ? (
                <ul className="space-y-1">{classified.inventory.map((s, i) => (
                  <li key={i} className="text-sm text-blue-700 bg-blue-50 rounded-xl px-3 py-1.5">{s}</li>
                ))}</ul>
              ) : <p className="text-sm text-gray-400">該当なし</p>}
            </CardContent>
          </Card>

          {/* 引き継ぎ */}
          <Card className="border border-amber-200 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-amber-600">
                <FileText className="w-4 h-4" />引き継ぎ事項
                <Badge className="bg-amber-50 text-amber-600 rounded-full ml-auto">{classified.handover.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classified.handover.length > 0 ? (
                <ul className="space-y-1">{classified.handover.map((s, i) => (
                  <li key={i} className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-1.5">{s}</li>
                ))}</ul>
              ) : <p className="text-sm text-gray-400">該当なし</p>}
            </CardContent>
          </Card>

          {/* アクション */}
          <div className="flex gap-2">
            {!saved ? (
              <Button onClick={handleSave} className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl">
                <Plus className="w-4 h-4 mr-1" />ログを保存
              </Button>
            ) : (
              <Badge className="flex-1 justify-center py-2 bg-green-50 text-green-600 text-sm rounded-xl">保存済み</Badge>
            )}
            {GAS_URL && (
              <Button onClick={handleSendToSheet} variant="outline" className="flex-1 rounded-xl" disabled={sending}>
                <Send className="w-4 h-4 mr-1" />{sending ? '送信中...' : 'スプレッドシートに送信'}
              </Button>
            )}
          </div>
          {sendResult === 'success' && <p className="text-sm text-green-500 text-center">スプレッドシートに送信しました</p>}
          {sendResult === 'error' && <p className="text-sm text-red-500 text-center">送信に失敗しました。GAS URLを確認してください</p>}
        </>
      )}

      {/* 過去のログ */}
      {(state.voiceLogs ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 px-1">過去の音声ログ</h3>
          {(state.voiceLogs ?? []).slice(0, 10).map((log) => (
            <Card key={log.id} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{log.date}</span>
                  <div className="flex gap-1">
                    <Badge className="bg-red-50 text-red-500 text-[10px] rounded-full">緊急{log.classified.urgent.length}</Badge>
                    <Badge className="bg-blue-50 text-blue-500 text-[10px] rounded-full">在庫{log.classified.inventory.length}</Badge>
                    <Badge className="bg-amber-50 text-amber-500 text-[10px] rounded-full">引継{log.classified.handover.length}</Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-400 truncate">{log.rawText.slice(0, 80)}...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ─── 商品マスタ一括登録 ─────────────────────────────────────
function MasterRegistrationView() {
  const { state, setState } = useAppState();
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number } | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('個');
  const [newItemType, setNewItemType] = useState<InventoryItemType>('food');
  const [bulkItemType, setBulkItemType] = useState<InventoryItemType>('food');
  const [newMinStock, setNewMinStock] = useState('3');
  const [newOrderQty, setNewOrderQty] = useState('5');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const categories = [...new Set(state.inventoryItems.map((i) => i.category).filter(Boolean))];

  const foodItems = state.inventoryItems.filter((i) => (i.itemType ?? 'food') === 'food');
  const supplyItems = state.inventoryItems.filter((i) => i.itemType === 'supply');

  const addSingle = () => {
    if (!newName.trim()) return;
    const exists = state.inventoryItems.some((i) => i.name === newName.trim());
    if (exists) return;
    setState((s) => ({
      ...s,
      inventoryItems: [...s.inventoryItems, {
        id: generateId(), name: newName.trim(), category: newCategory || '未分類', unit: newUnit, itemType: newItemType,
        minStock: Number(newMinStock) || 3, orderQuantity: Number(newOrderQty) || 5, costPerUnit: 0,
      }],
    }));
    setNewName(''); setNewCategory(''); setNewUnit('個'); setNewMinStock('3'); setNewOrderQty('5');
  };

  const registerBulk = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const existingNames = new Set(state.inventoryItems.map((i) => i.name.trim()));
    const pendingNames = new Set<string>();
    const toAdd: typeof state.inventoryItems = [];
    let skipped = 0;

    for (const line of lines) {
      if (line.startsWith('アイテム名') || line.startsWith('商品名') || line.startsWith('品目')) continue;
      const cols = line.includes('\t')
        ? line.split('\t').map((c) => c.trim())
        : line.includes(',')
          ? line.split(',').map((c) => c.trim())
          : line.split(/\s{2,}/).map((c) => c.trim());
      const name = cols[0] ?? '';
      const category = cols[1] || '未分類';
      const unit = cols[2] || '個';
      const minStock = Number(cols[3]) || 3;
      const orderQuantity = Number(cols[4]) || 5;

      if (!name || existingNames.has(name) || pendingNames.has(name)) {
        skipped += 1;
        continue;
      }
      pendingNames.add(name);
      toAdd.push({ id: generateId(), name, category, unit, itemType: bulkItemType, minStock, orderQuantity, costPerUnit: 0 });
    }

    if (toAdd.length > 0) {
      setState((s) => ({ ...s, inventoryItems: [...s.inventoryItems, ...toAdd] }));
    }
    setBulkResult({ added: toAdd.length, skipped });
  };

  const removeItem = (id: string) => {
    setState((s) => ({ ...s, inventoryItems: s.inventoryItems.filter((i) => i.id !== id) }));
  };

  const GAS_URL = state.settings.gasUrl || '';

  const syncMasterToSheet = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'syncMaster',
          items: state.inventoryItems.map((i) => ({
            name: i.name, category: i.category, unit: i.unit, itemType: i.itemType ?? 'food',
          })),
        }),
      });
      setSendResult(res.ok ? 'success' : 'error');
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  };

  const clearAll = () => {
    if (!confirm('登録済みの商品をすべて削除しますか？')) return;
    setState((s) => ({ ...s, inventoryItems: [] }));
  };

  const clearByType = (type: InventoryItemType) => {
    const label = type === 'food' ? '食材' : '備品';
    if (!confirm(`${label}をすべて削除しますか？`)) return;
    setState((s) => ({ ...s, inventoryItems: s.inventoryItems.filter((i) => (i.itemType ?? 'food') !== type) }));
  };

  const typeLabel = (t: InventoryItemType) => t === 'food' ? '食材' : '備品';

  const renderItemGroup = (title: string, items: typeof state.inventoryItems, color: string) => {
    const grouped = items.reduce<Record<string, typeof state.inventoryItems>>((acc, item) => {
      const cat = item.category || '未分類';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return (
      <div className="space-y-2">
        <h3 className={`text-sm font-bold px-1 ${color}`}>{title} ({items.length}件)</h3>
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => (
          <Card key={category} className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-gray-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />{category}
                <Badge className="bg-gray-100 text-gray-500 rounded-full ml-auto text-[10px]">{catItems.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex flex-wrap gap-1.5">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-1 bg-gray-50 rounded-full pl-3 pr-1 py-1 text-sm">
                    <span>{item.name}</span>
                    <span className="text-[10px] text-gray-400">({item.unit})</span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const ItemTypeToggle = ({ value, onChange }: { value: InventoryItemType; onChange: (v: InventoryItemType) => void }) => (
    <div className="flex bg-gray-50 rounded-xl p-0.5">
      <button onClick={() => onChange('food')}
        className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${value === 'food' ? 'bg-orange-500 text-white font-medium' : 'text-gray-400'}`}>
        食材
      </button>
      <button onClick={() => onChange('supply')}
        className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${value === 'supply' ? 'bg-blue-500 text-white font-medium' : 'text-gray-400'}`}>
        備品
      </button>
    </div>
  );

  return (
    <>
      {/* 単品追加 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">商品を追加</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ItemTypeToggle value={newItemType} onChange={setNewItemType} />
          <div className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="商品名" className="flex-1 rounded-xl" />
            <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="カテゴリ" className="w-24 rounded-xl" list="cat-list" />
            <datalist id="cat-list">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
            <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="border rounded-xl px-2 text-sm bg-white w-14">
              {['個', '本', '袋', '缶', 'パック', 'kg', 'g', 'L', '瓶', '箱', '枚', 'ロール', 'セット'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-gray-400 shrink-0">最低</span>
              <Input type="number" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} className="rounded-xl h-8 text-xs" />
            </div>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-gray-400 shrink-0">発注</span>
              <Input type="number" value={newOrderQty} onChange={(e) => setNewOrderQty(e.target.value)} className="rounded-xl h-8 text-xs" />
            </div>
            <Button size="icon" onClick={addSingle} className="bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl shrink-0" disabled={!newName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 一括登録 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Upload className="w-4 h-4" />一括登録
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ItemTypeToggle value={bulkItemType} onChange={setBulkItemType} />
          <p className="text-xs text-gray-400">商品名,カテゴリ,単位,最低在庫,発注数</p>
          <Textarea
            value={bulkText}
            onChange={(e) => { setBulkText(e.target.value); setBulkResult(null); }}
            rows={6}
            placeholder={bulkItemType === 'food'
              ? '牛乳,乳製品,本,3,10\nトマト,野菜,個,5,20\nコーヒー豆,飲料,kg'
              : 'ナプキン,消耗品,袋,2,5\nテイクアウトカップ,消耗品,袋\nゴミ袋,消耗品,ロール'}
            className="text-sm rounded-xl font-mono"
          />
          <Button onClick={registerBulk} className="w-full bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl" disabled={!bulkText.trim()}>
            <Plus className="w-4 h-4 mr-1" />{typeLabel(bulkItemType)}を一括登録
          </Button>
          {bulkResult && (
            <p className="text-sm text-center text-gray-500">
              追加: <span className="font-bold text-green-600">{bulkResult.added}件</span>
              {bulkResult.skipped > 0 && <> / スキップ: <span className="text-amber-600">{bulkResult.skipped}件</span></>}
            </p>
          )}
        </CardContent>
      </Card>

      {/* スプレッドシート同期（GAS URL設定時のみ表示） */}
      {GAS_URL && (
        <>
          <Button onClick={syncMasterToSheet} variant="outline" className="w-full rounded-xl" disabled={sending || state.inventoryItems.length === 0}>
            <Send className="w-4 h-4 mr-1" />{sending ? '送信中...' : 'スプレッドシートに商品マスタを同期'}
          </Button>
          {sendResult === 'success' && <p className="text-sm text-green-500 text-center">商品マスタを同期しました</p>}
          {sendResult === 'error' && <p className="text-sm text-red-500 text-center">同期に失敗しました</p>}
        </>
      )}

      {/* 登録済み商品一覧（食材/備品別） */}
      <div className="space-y-4">
        {state.inventoryItems.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-gray-400">登録済み: {state.inventoryItems.length}件</span>
            <div className="flex gap-2">
              {foodItems.length > 0 && (
                <button onClick={() => clearByType('food')} className="text-xs text-orange-400 hover:text-orange-600">食材を全削除</button>
              )}
              {supplyItems.length > 0 && (
                <button onClick={() => clearByType('supply')} className="text-xs text-blue-400 hover:text-blue-600">備品を全削除</button>
              )}
              <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600">全削除</button>
            </div>
          </div>
        )}
        {foodItems.length > 0 && renderItemGroup('食材', foodItems, 'text-orange-500')}
        {supplyItems.length > 0 && renderItemGroup('備品', supplyItems, 'text-blue-500')}
        {state.inventoryItems.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">商品が登録されていません</div>
        )}
      </div>
    </>
  );
}
