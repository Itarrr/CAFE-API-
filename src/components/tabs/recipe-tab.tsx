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
  ChefHat, Plus, Trash2, Clock, Search, X,
} from 'lucide-react';

type View = 'list' | 'add';

export default function RecipeTab() {
  const { state, setState } = useAppState();
  const recipes = state.recipes ?? [];
  const [view, setView] = useState<View>('list');
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">
          {recipes.length}件のレシピ
        </h2>
        <Button onClick={() => setView('add')} className="bg-violet-600 hover:bg-violet-700 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />レシピを追加
        </Button>
      </div>

      {/* 検索・フィルター */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="レシピを検索..."
            className="pl-8 h-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border rounded-md px-2 text-sm h-9"
        >
          <option value="all">すべて</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* カテゴリ別レシピ一覧 */}
      {filterCat === 'all' ? (
        // カテゴリごとにグループ表示
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
          <Button onClick={() => setView('add')} variant="outline" className="mt-3 text-xs">
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
    <Card className={`cursor-pointer transition-all ${isOpen ? 'ring-1 ring-gray-300' : ''}`}>
      <CardContent className="py-3" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{r.imageEmoji}</span>
            <div>
              <span className="font-semibold text-sm">{r.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
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
            {/* 材料 */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">材料</p>
              <div className="bg-gray-50 rounded-lg p-2.5">
                {r.ingredients.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* 手順 */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">手順</p>
              <div className="space-y-1">
                {r.steps.map((s) => (
                  <div key={s.order} className="flex gap-2.5 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-white bg-black rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{s.order}</span>
                    <span className="text-sm">{s.instruction}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 注意事項 */}
            {r.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">ポイント・注意</p>
                <p className="text-sm text-orange-700 bg-orange-50 rounded-lg p-2.5">{r.notes}</p>
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
        <Button variant="outline" onClick={onBack} className="h-8 text-xs">
          <X className="w-3.5 h-3.5 mr-1" />戻る
        </Button>
        <h2 className="text-sm font-medium">レシピを追加</h2>
        <div className="w-16" />
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* メニュー名・カテゴリ */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">メニュー名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="カフェラテ" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">カテゴリ</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-md px-2 text-sm h-9 w-full mt-1">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* アイコン */}
          <div>
            <Label className="text-xs text-gray-500">アイコン</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {RECIPE_EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${emoji === e ? 'bg-gray-200 ring-2 ring-black' : 'hover:bg-gray-100'}`}>{e}</button>
              ))}
            </div>
          </div>

          {/* 材料 */}
          <div>
            <Label className="text-xs text-gray-500">材料（1行に1つ）</Label>
            <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)}
              placeholder={"コーヒー豆 15g\nお湯 200ml\n牛乳 50ml"} rows={4} className="mt-1" />
          </div>

          {/* 手順 */}
          <div>
            <Label className="text-xs text-gray-500">手順（1行に1ステップ）</Label>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)}
              placeholder={"豆を挽く\nお湯を注いで蒸らす\n牛乳を温めて注ぐ"} rows={5} className="mt-1" />
          </div>

          {/* 調理時間・注意 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">調理時間（分）</Label>
              <Input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">ポイント・注意</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="温度に注意" className="mt-1" />
            </div>
          </div>

          <Button onClick={submit} className="w-full h-12 bg-violet-600 hover:bg-violet-700" disabled={!name.trim()}>
            <Plus className="w-4 h-4 mr-1" />レシピを登録
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
