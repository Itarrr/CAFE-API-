'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import { format } from 'date-fns';
import type { VoiceLogClassified, ParsedInventoryItem } from '@/lib/types';
import {
  Mic, AlertTriangle, Archive, FileText, Plus, Send,
} from 'lucide-react';

// ─── キーワード自動分類ロジック ──────────────────────────────
function classifyText(text: string): VoiceLogClassified {
  const sentences = text
    .split(/[。\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const urgentKeywords = ['緊急', '至急', '切れ', 'ない', 'ゼロ', '不足'];
  const inventoryKeywords = ['消費', '入荷', '残量', '確認', '個', '本', '枚', 'キロ', '補充', '使用', '仕入'];

  const urgent: string[] = [];
  const inventory: string[] = [];
  const inventoryParsed: ParsedInventoryItem[] = [];
  const handover: string[] = [];

  for (const sentence of sentences) {
    if (urgentKeywords.some((kw) => sentence.includes(kw))) {
      urgent.push(sentence);
    } else if (inventoryKeywords.some((kw) => sentence.includes(kw))) {
      inventory.push(sentence);
      const parsed = parseInventorySentence(sentence);
      if (parsed) inventoryParsed.push(parsed);
    } else {
      handover.push(sentence);
    }
  }

  return { urgent, inventory, inventoryParsed, handover };
}

// ─── 在庫テキストから品目・数量・操作を抽出 ──────────────────
function parseInventorySentence(sentence: string): ParsedInventoryItem | null {
  const numMap: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    'ひとつ': 1, 'ふたつ': 2, 'みっつ': 3, 'よっつ': 4, 'いつつ': 5,
  };
  const units = ['個', '本', '枚', 'キロ', 'kg', 'g', 'リットル', 'L', 'パック', '袋', '缶', '箱', 'つ', 'ケース'];
  const unitPattern = units.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  const isRestock = /入荷|補充|追加|仕入/.test(sentence);
  const action: 'consume' | 'restock' = isRestock ? 'restock' : 'consume';

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
      if (item) {
        return { item, quantity: numMap[kana], unit: '個', action, raw: sentence };
      }
    }
  }

  const p3 = /^(.+?)[をがは]?(\d+)\s*(消費|入荷|補充|追加|使用|仕入)/u;
  const m3 = sentence.match(p3);
  if (m3) {
    return { item: m3[1].trim(), quantity: Number(m3[2]), unit: '個', action, raw: sentence };
  }

  return null;
}

export default function VoiceTab() {
  const { state, setState } = useAppState();
  const [rawText, setRawText] = useState('');
  const [classified, setClassified] = useState<VoiceLogClassified | null>(null);
  const [saved, setSaved] = useState(false);

  const handleClassify = () => {
    if (!rawText.trim()) return;
    const result = classifyText(rawText);
    setClassified(result);
    setSaved(false);
  };

  const handleSave = () => {
    if (!classified) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const entry = {
      id: generateId(),
      date: today,
      rawText,
      classified,
      createdAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      voiceLogs: [entry, ...(s.voiceLogs ?? [])],
    }));

    setSaved(true);
  };

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzrc4vzBiZOkeWLD8nEZ-GLZNraYu6NZ6ZZjMhd4RlRi5E_QJP8-hxL6xjazzKY6BDI/exec';
  const GAS_URL = typeof window !== 'undefined'
    ? (localStorage.getItem('tebanashi-gas-url') ?? DEFAULT_GAS_URL)
    : DEFAULT_GAS_URL;

  const handleSendToSheet = async () => {
    if (!classified) return;
    const today = format(new Date(), 'yyyy-MM-dd');

    if (!GAS_URL) {
      const lines = [
        `日付: ${today}`,
        '',
        '【緊急アラート】',
        ...classified.urgent.map((s) => `- ${s}`),
        '',
        '【在庫ログ】',
        ...classified.inventory.map((s) => `- ${s}`),
        '',
        '【引き継ぎ事項】',
        ...classified.handover.map((s) => `- ${s}`),
      ].join('\n');

      navigator.clipboard.writeText(lines).then(() => {
        alert('GAS URLが未設定のため、クリップボードにコピーしました。\n設定タブでGAS URLを登録すると自動送信できます。');
      }).catch(() => {
        alert('コピーに失敗しました。');
      });
      return;
    }

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          date: today,
          urgent: classified.urgent,
          inventory: classified.inventory,
          inventoryParsed: classified.inventoryParsed,
          handover: classified.handover,
        }),
      });
      if (res.ok) {
        setSendResult('success');
      } else {
        setSendResult('error');
      }
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 入力エリア */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-[#ff6b6b]" />音声ログ入力
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={rawText}
            onChange={(e) => { setRawText(e.target.value); setClassified(null); setSaved(false); }}
            placeholder="Ankerの文字起こしデータをここに貼り付けてください"
            rows={8}
            className="text-sm rounded-xl"
          />
          <Button
            onClick={handleClassify}
            className="w-full bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl"
            disabled={!rawText.trim()}
          >
            <FileText className="w-4 h-4 mr-1" />キーワードで自動分類
          </Button>
        </CardContent>
      </Card>

      {classified && (
        <>
          {/* 緊急アラート */}
          <Card className="border border-red-200 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-red-600">
                <AlertTriangle className="w-4 h-4" />緊急アラート
                <Badge className="bg-red-50 text-red-600 rounded-full ml-auto">{classified.urgent.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classified.urgent.length > 0 ? (
                <ul className="space-y-1">
                  {classified.urgent.map((s, i) => (
                    <li key={i} className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-1.5">{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">該当なし</p>
              )}
            </CardContent>
          </Card>

          {/* 在庫ログ */}
          <Card className="border border-blue-200 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-blue-600">
                <Archive className="w-4 h-4" />在庫ログ
                <Badge className="bg-blue-50 text-blue-600 rounded-full ml-auto">{classified.inventory.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classified.inventoryParsed.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-blue-50 rounded-xl">
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
                <ul className="space-y-1">
                  {classified.inventory.map((s, i) => (
                    <li key={i} className="text-sm text-blue-700 bg-blue-50 rounded-xl px-3 py-1.5">{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">該当なし</p>
              )}
            </CardContent>
          </Card>

          {/* 引き継ぎ事項 */}
          <Card className="border border-amber-200 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-amber-600">
                <FileText className="w-4 h-4" />引き継ぎ事項
                <Badge className="bg-amber-50 text-amber-600 rounded-full ml-auto">{classified.handover.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classified.handover.length > 0 ? (
                <ul className="space-y-1">
                  {classified.handover.map((s, i) => (
                    <li key={i} className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-1.5">{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">該当なし</p>
              )}
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex gap-2">
            {!saved ? (
              <Button onClick={handleSave} className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl">
                <Plus className="w-4 h-4 mr-1" />ログを保存
              </Button>
            ) : (
              <Badge className="flex-1 justify-center py-2 bg-green-50 text-green-600 text-sm rounded-xl">保存済み</Badge>
            )}
            <Button onClick={handleSendToSheet} variant="outline" className="flex-1 rounded-xl" disabled={sending}>
              <Send className="w-4 h-4 mr-1" />
              {sending ? '送信中...' : 'スプレッドシートに送信'}
            </Button>
          </div>
          {sendResult === 'success' && (
            <p className="text-sm text-green-500 text-center">スプレッドシートに送信しました</p>
          )}
          {sendResult === 'error' && (
            <p className="text-sm text-red-500 text-center">送信に失敗しました。GAS URLを確認してください</p>
          )}
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
    </div>
  );
}
