'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import type { Recipe, RecipeStep } from '@/lib/types';
import {
  ChefHat, Plus, Trash2, Clock, Search, X, Package, RefreshCw, AlertTriangle,
} from 'lucide-react';

type SubTab = 'recipes' | 'inventory';

export default function RecipeTab() {
  const [subTab, setSubTab] = useState<SubTab>('recipes');

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-50 rounded-xl p-1">
        <button
          onClick={() => setSubTab('recipes')}
          className={`flex-1 text-sm py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            subTab === 'recipes' ? 'bg-white shadow-sm font-medium text-[#ff6b6b]' : 'text-gray-400'
          }`}
        >
          <ChefHat className="w-4 h-4" />レシピ
        </button>
        <button
          onClick={() => setSubTab('inventory')}
          className={`flex-1 text-sm py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            subTab === 'inventory' ? 'bg-white shadow-sm font-medium text-[#ff6b6b]' : 'text-gray-400'
          }`}
        >
          <Package className="w-4 h-4" />食材管理
        </button>
      </div>

      {subTab === 'recipes' ? <RecipeListView /> : <InventoryView />}
    </div>
  );
}

// ─── レシピ一覧 ──────────────────────────────
function RecipeListView() {
  const { state, setState } = useAppState();
  const recipes = state.recipes ?? [];
  const [view, setView] = useState<'list' | 'add'>('list');
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const categories = [...new Set(recipes.map((r) => r.category))];
  const filtered = recipes.filter((r) => {
    if (filterCat !== 'all' && r.category !== filterCat) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const removeRecipe = (id: string) => {
    setState((s) => ({ ...s, recipes: (s.recipes ?? []).filter((r) => r.id !== id) }));
    if (openId === id) setOpenId(null);
  };

  if (view === 'add') {
    return <RecipeForm onBack={() => setView('list')} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400">{recipes.length}件のレシピ</h2>
        <Button onClick={() => setView('add')} className="bg-[#ff6b6b] hover:bg-[#e05555] h-8 text-xs rounded-xl">
          <Plus className="w-3.5 h-3.5 mr-1" />レシピを追加
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="レシピを検索..." className="pl-8 h-9 rounded-xl" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="border rounded-xl px-2 text-sm h-9 bg-white">
          <option value="all">すべて</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filterCat === 'all' ? (
        categories.map((cat) => {
          const catRecipes = filtered.filter((r) => r.category === cat);
          if (catRecipes.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">{cat}</h3>
              <div className="space-y-2">
                {catRecipes.map((r) => (
                  <RecipeCard key={r.id} recipe={r} isOpen={openId === r.id}
                    onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                    onRemove={() => removeRecipe(r.id)} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} isOpen={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onRemove={() => removeRecipe(r.id)} />
          ))}
        </div>
      )}

      {filtered.length === 0 && recipes.length > 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">該当するレシピがありません</div>
      )}
      {recipes.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">レシピがまだ登録されていません</p>
          <Button onClick={() => setView('add')} variant="outline" className="mt-3 text-xs rounded-xl">
            <Plus className="w-3.5 h-3.5 mr-1" />最初のレシピを追加
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── レシピカード ──────────────────────────────
function RecipeCard({ recipe: r, isOpen, onToggle, onRemove }: {
  recipe: Recipe; isOpen: boolean; onToggle: () => void; onRemove: () => void;
}) {
  return (
    <Card className={`cursor-pointer transition-all rounded-2xl border-0 shadow-sm ${isOpen ? 'ring-1 ring-gray-200' : ''}`}>
      <CardContent className="py-3" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{r.imageEmoji}</span>
            <div>
              <span className="font-semibold text-sm">{r.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] rounded-full">{r.category}</Badge>
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />{r.prepTimeMinutes}分
                </span>
              </div>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 shrink-0"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">材料</p>
              <div className="bg-gray-50 rounded-xl p-2.5">
                {r.ingredients.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">手順</p>
              <div className="space-y-1">
                {r.steps.map((s) => (
                  <div key={s.order} className="flex gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-white bg-[#ff6b6b] rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{s.order}</span>
                    <span className="text-sm">{s.instruction}</span>
                  </div>
                ))}
              </div>
            </div>
            {r.notes && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">ポイント・注意</p>
                <p className="text-sm text-orange-600 bg-orange-50 rounded-xl p-2.5">{r.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── レシピ登録フォーム ──────────────────────────────
function RecipeForm({ onBack }: { onBack: () => void }) {
  const { setState } = useAppState();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ドリンク');
  const [emoji, setEmoji] = useState('☕');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [prepTime, setPrepTime] = useState('5');

  const RECIPE_EMOJIS = ['☕', '🍵', '🧃', '🥤', '🍰', '🥪', '🍝', '🥗', '🍳', '🍞', '🍕', '🍜', '🥐', '🧁', '🍔'];
  const CATEGORIES = ['ドリンク', 'フード', 'デザート', 'サイド'];

  const submit = () => {
    if (!name.trim()) return;
    const stepList: RecipeStep[] = steps.split('\n').filter(Boolean).map((s, i) => ({ order: i + 1, instruction: s.trim() }));
    const newRecipe: Recipe = {
      id: generateId(), name, category, imageEmoji: emoji,
      ingredients, steps: stepList, notes, prepTimeMinutes: Number(prepTime) || 5,
    };
    setState((s) => ({ ...s, recipes: [...(s.recipes ?? []), newRecipe] }));
    onBack();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="h-8 text-xs rounded-xl">
          <X className="w-3.5 h-3.5 mr-1" />戻る
        </Button>
        <h2 className="text-sm font-medium">レシピを追加</h2>
        <div className="w-16" />
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-400">メニュー名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="カフェラテ" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">カテゴリ</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-xl px-2 text-sm h-9 w-full mt-1 bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-400">アイコン</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {RECIPE_EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${emoji === e ? 'bg-[#fff0f0] ring-2 ring-[#ff6b6b]' : 'hover:bg-gray-100'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-400">材料（1行に1つ）</Label>
            <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)}
              placeholder={"コーヒー豆 15g\nお湯 200ml\n牛乳 50ml"} rows={4} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-gray-400">手順（1行に1ステップ）</Label>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)}
              placeholder={"豆を挽く\nお湯を注いで蒸らす\n牛乳を温めて注ぐ"} rows={5} className="mt-1 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-400">調理時間（分）</Label>
              <Input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">ポイント・注意</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="温度に注意" className="mt-1 rounded-xl" />
            </div>
          </div>
          <Button onClick={submit} className="w-full h-12 bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl" disabled={!name.trim()}>
            <Plus className="w-4 h-4 mr-1" />レシピを登録
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 食材管理（スプレッドシートの在庫データ表示） ──────────────────
type StockItem = {
  '品目': string;
  'カテゴリ': string;
  '現在数': number;
  '単位': string;
  '最終更新': string;
};

function InventoryView() {
  const [food, setFood] = useState<StockItem[]>([]);
  const [supply, setSupply] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [tab, setTab] = useState<'food' | 'supply'>('food');

  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzrc4vzBiZOkeWLD8nEZ-GLZNraYu6NZ6ZZjMhd4RlRi5E_QJP8-hxL6xjazzKY6BDI/exec';
  const GAS_URL = typeof window !== 'undefined'
    ? (localStorage.getItem('tebanashi-gas-url') ?? DEFAULT_GAS_URL)
    : DEFAULT_GAS_URL;

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GAS_URL}?action=getStock`);
      const data = await res.json();
      if (data.status === 'ok') {
        setFood(data.food || []);
        setSupply(data.supply || []);
        setLastFetched(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setError('データの取得に失敗しました');
      }
    } catch {
      setError('通信エラー。GAS URLを確認してください');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useState(() => { fetchStock(); });

  const currentItems = tab === 'food' ? food : supply;

  // カテゴリ別にグループ化
  const grouped = currentItems.reduce<Record<string, StockItem[]>>((acc, item) => {
    const cat = String(item['カテゴリ'] || '未分類');
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // 在庫ゼロの数
  const zeroCount = currentItems.filter((i) => Number(i['現在数']) <= 0).length;

  return (
    <div className="space-y-4">
      {/* 食材/備品 切り替え */}
      <div className="flex bg-gray-50 rounded-xl p-0.5">
        <button onClick={() => setTab('food')}
          className={`flex-1 text-xs py-2 rounded-lg transition-colors ${tab === 'food' ? 'bg-orange-500 text-white font-medium' : 'text-gray-400'}`}>
          食材 ({food.length})
        </button>
        <button onClick={() => setTab('supply')}
          className={`flex-1 text-xs py-2 rounded-lg transition-colors ${tab === 'supply' ? 'bg-blue-500 text-white font-medium' : 'text-gray-400'}`}>
          備品 ({supply.length})
        </button>
      </div>

      {/* 更新ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lastFetched && <span className="text-[10px] text-gray-400">最終取得: {lastFetched}</span>}
          {zeroCount > 0 && (
            <Badge className="bg-red-50 text-red-500 rounded-full text-[10px]">
              <AlertTriangle className="w-3 h-3 mr-0.5" />在庫切れ {zeroCount}件
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={fetchStock} className="h-7 text-xs gap-1 rounded-xl" disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />更新
        </Button>
      </div>

      {/* エラー */}
      {error && (
        <Card className="border border-red-200 bg-red-50 rounded-2xl">
          <CardContent className="py-3 text-sm text-red-600 text-center">{error}</CardContent>
        </Card>
      )}

      {/* ローディング */}
      {loading && currentItems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
          <p className="text-sm">データを取得中...</p>
        </div>
      )}

      {/* 在庫一覧（カテゴリ別） */}
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
        <Card key={category} className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs text-gray-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />{category}
              <Badge className="bg-gray-100 text-gray-500 rounded-full ml-auto text-[10px]">{items.length}件</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-1">
              {items.map((item, i) => {
                const qty = Number(item['現在数']);
                const isZero = qty <= 0;
                const isLow = qty > 0 && qty <= 3;
                return (
                  <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded-xl ${isZero ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      {isZero && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      <span className={`text-sm ${isZero ? 'text-red-600 font-medium' : ''}`}>{item['品目']}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${isZero ? 'text-red-600' : isLow ? 'text-amber-600' : ''}`}>
                        {qty}
                      </span>
                      <span className="text-[10px] text-gray-400">{item['単位']}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* データなし */}
      {!loading && currentItems.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">在庫データがありません</p>
          <p className="text-xs mt-1">音声ログから送信するとここに表示されます</p>
        </div>
      )}
    </div>
  );
}
