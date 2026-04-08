'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import type { Employee, TaskTemplate, InventoryItem, Recipe, RecipeStep } from '@/lib/types';
import { Users, ClipboardList, Package, Plus, Trash2, Edit2, Save, X, Store, Star, HandMetal, Zap, Target, ChefHat } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

type Section = 'store' | 'targets' | 'employees' | 'tasks' | 'recipes' | 'inventory' | 'evaluation';

export default function SettingsTab() {
  const { state, setState } = useAppState();
  const [section, setSection] = useState<Section>('store');

  const sections: { id: Section; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'store', label: '店舗情報', icon: <Store className="w-4 h-4" /> },
    { id: 'targets', label: '目標設定', icon: <Target className="w-4 h-4" /> },
    { id: 'employees', label: '従業員', icon: <Users className="w-4 h-4" />, count: state.employees.length },
    { id: 'tasks', label: 'タスク・動画', icon: <ClipboardList className="w-4 h-4" />, count: state.taskTemplates.length },
    { id: 'recipes', label: 'レシピ管理', icon: <ChefHat className="w-4 h-4" />, count: (state.recipes ?? []).length },
    { id: 'inventory', label: '食材品目', icon: <Package className="w-4 h-4" />, count: state.inventoryItems.length },
    { id: 'evaluation', label: '評価基準', icon: <Star className="w-4 h-4" />, count: state.evaluationCriteria.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${section === s.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-violet-50'}`}
          >
            {s.icon}
            {s.label}
            {s.count !== undefined && <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{s.count}</Badge>}
          </button>
        ))}
      </div>

      {section === 'store' && <StoreSection />}
      {section === 'targets' && <TargetsSection />}
      {section === 'employees' && <EmployeeSection />}
      {section === 'tasks' && <TaskSection />}
      {section === 'recipes' && <RecipeSection />}
      {section === 'inventory' && <InventorySection />}
      {section === 'evaluation' && <EvaluationSection />}
    </div>
  );
}

function StoreSection() {
  const { state, setState } = useAppState();
  const [name, setName] = useState(state.settings.storeName);
  const [open, setOpen] = useState(state.settings.openTime);
  const [close, setClose] = useState(state.settings.closeTime);

  const save = () => {
    setState((s) => ({ ...s, settings: { ...s.settings, storeName: name, openTime: open, closeTime: close } }));
  };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">店舗情報</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>店舗名</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>開店</Label><Input type="time" value={open} onChange={(e) => setOpen(e.target.value)} className="mt-1" /></div>
          <div><Label>閉店</Label><Input type="time" value={close} onChange={(e) => setClose(e.target.value)} className="mt-1" /></div>
        </div>
        <Button onClick={save} className="w-full bg-violet-600 hover:bg-violet-700"><Save className="w-4 h-4 mr-1" />保存</Button>
      </CardContent>
    </Card>
  );
}

function TargetsSection() {
  const { state, setState } = useAppState();
  const templates = state.dayTargetTemplates ?? [];

  const update = (dayType: string, field: 'targetRevenue' | 'targetPoints', value: number) => {
    setState((s) => ({
      ...s,
      dayTargetTemplates: (s.dayTargetTemplates ?? []).map((t) =>
        t.dayType === dayType ? { ...t, [field]: value } : t
      ),
    }));
  };

  const typeLabel = (t: string) => t === 'weekday' ? '平日' : t === 'weekend' ? '土日' : '祝日';

  return (
    <div className="space-y-3">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="py-3">
          <p className="text-sm text-yellow-800 font-medium">目標テンプレート</p>
          <p className="text-xs text-yellow-700 mt-0.5">曜日タイプごとに目標売上と目標生産性ポイントを設定します。開店処理時にこの値がデフォルトとして使われます。</p>
        </CardContent>
      </Card>
      {templates.map((t) => (
        <Card key={t.dayType}>
          <CardContent className="py-3 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={`${t.dayType === 'weekday' ? 'bg-gray-100 text-gray-700' : t.dayType === 'weekend' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                {typeLabel(t.dayType)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">目標売上</Label>
                <Input type="number" value={t.targetRevenue} onChange={(e) => update(t.dayType, 'targetRevenue', Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">目標ポイント</Label>
                <Input type="number" value={t.targetPoints} onChange={(e) => update(t.dayType, 'targetPoints', Number(e.target.value))} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmployeeSection() {
  const { state, setState } = useAppState();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Employee['role']>('staff');
  const [wage, setWage] = useState('1100');

  const add = () => {
    if (!name.trim()) return;
    setState((s) => ({
      ...s,
      employees: [...s.employees, { id: generateId(), name, role, hourlyWage: Number(wage), joinedDate: new Date().toISOString().split('T')[0] }],
    }));
    setName(''); setWage('1100');
  };

  const remove = (id: string) => setState((s) => ({ ...s, employees: s.employees.filter((e) => e.id !== id) }));

  const roleLabel = (r: string) => r === 'manager' ? '社員' : r === 'staff' ? 'スタッフ' : 'アルバイト';

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2 flex-wrap">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="名前" className="flex-1 min-w-[120px]" />
            <select value={role} onChange={(e) => setRole(e.target.value as Employee['role'])} className="border rounded-md px-2 text-sm h-9">
              <option value="manager">社員</option>
              <option value="staff">スタッフ</option>
              <option value="part-time">アルバイト</option>
            </select>
            <Input type="number" value={wage} onChange={(e) => setWage(e.target.value)} className="w-24" placeholder="時給" />
            <Button size="icon" onClick={add}><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
      {state.employees.map((e) => (
        <Card key={e.id}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <span className="font-medium">{e.name}</span>
              <Badge variant="outline" className="ml-2 text-[10px]">{roleLabel(e.role)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">&yen;{e.hourlyWage}/h</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => remove(e.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskSection() {
  const { state, setState } = useAppState();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('清掃');
  const [desc, setDesc] = useState('');
  const [video, setVideo] = useState('');
  const [points, setPoints] = useState('10');
  const [minutes, setMinutes] = useState('10');
  const [repeatable, setRepeatable] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit state
  const [eTitle, setETitle] = useState('');
  const [eCategory, setECategory] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eVideo, setEVideo] = useState('');
  const [ePoints, setEPoints] = useState('');
  const [eMinutes, setEMinutes] = useState('');
  const [eRepeatable, setERepeatable] = useState(false);

  const add = () => {
    if (!title.trim()) return;
    setState((s) => ({
      ...s,
      taskTemplates: [...s.taskTemplates, {
        id: generateId(), title, category, description: desc, videoUrl: video,
        points: Number(points), repeatable, estimateMinutes: Number(minutes),
      }],
    }));
    setTitle(''); setDesc(''); setVideo(''); setPoints('10'); setMinutes('10');
  };

  const remove = (id: string) => {
    setState((s) => ({ ...s, taskTemplates: s.taskTemplates.filter((t) => t.id !== id) }));
    if (editingId === id) setEditingId(null);
  };

  const startEdit = (t: TaskTemplate) => {
    setEditingId(t.id);
    setETitle(t.title); setECategory(t.category); setEDesc(t.description);
    setEVideo(t.videoUrl); setEPoints(String(t.points)); setEMinutes(String(t.estimateMinutes));
    setERepeatable(t.repeatable);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setState((s) => ({
      ...s,
      taskTemplates: s.taskTemplates.map((t) =>
        t.id === editingId ? {
          ...t, title: eTitle, category: eCategory, description: eDesc,
          videoUrl: eVideo, points: Number(ePoints) || 10,
          estimateMinutes: Number(eMinutes) || 10, repeatable: eRepeatable,
        } : t
      ),
    }));
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="py-3">
          <p className="text-sm text-yellow-800 font-medium">ポイントタスクとは？</p>
          <p className="text-xs text-yellow-700 mt-1">
            アイドルタイムに自発的に行う作業。完了するとポイントが貯まり評価に反映。最低10ptから、難易度に応じて設定。
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">新規タスク追加</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タスク名（例: トイレ清掃）" />
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs text-gray-500">カテゴリ</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="清掃" className="mt-1" /></div>
            <div><Label className="text-xs text-gray-500">ポイント</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs text-gray-500">目安(分)</Label>
              <Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="mt-1" /></div>
          </div>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="説明（任意）" rows={2} />
          <Input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="マニュアル動画URL（任意）" />
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
            <div><p className="text-sm font-medium">同日に繰り返し可能</p><p className="text-[10px] text-gray-500">ONなら何度でもポイント獲得可</p></div>
            <Switch checked={repeatable} onCheckedChange={setRepeatable} />
          </div>
          <Button onClick={add} className="w-full bg-violet-600 hover:bg-violet-700" disabled={!title.trim()}>
            <Plus className="w-4 h-4 mr-1" />タスクを追加
          </Button>
        </CardContent>
      </Card>

      {/* Task list with inline editing */}
      {state.taskTemplates.map((t) => (
        <Card key={t.id} className={editingId === t.id ? 'ring-2 ring-black' : ''}>
          <CardContent className="py-3">
            {editingId === t.id ? (
              /* ── Edit mode ── */
              <div className="space-y-3">
                <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="タスク名" />
                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-xs text-gray-500">カテゴリ</Label>
                    <Input value={eCategory} onChange={(e) => setECategory(e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs text-gray-500">ポイント</Label>
                    <Input type="number" value={ePoints} onChange={(e) => setEPoints(e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs text-gray-500">目安(分)</Label>
                    <Input type="number" value={eMinutes} onChange={(e) => setEMinutes(e.target.value)} className="mt-1" /></div>
                </div>
                <Textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="説明" rows={2} />
                <Input value={eVideo} onChange={(e) => setEVideo(e.target.value)} placeholder="動画URL" />
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div><p className="text-sm font-medium">繰り返し可能</p></div>
                  <Switch checked={eRepeatable} onCheckedChange={setERepeatable} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEdit} className="flex-1 bg-violet-600 hover:bg-violet-700"><Save className="w-4 h-4 mr-1" />保存</Button>
                  <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">キャンセル</Button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => startEdit(t)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{t.title}</span>
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                    <Badge className="bg-yellow-50 text-yellow-700 text-[10px]">{t.points ?? 0}pt</Badge>
                    {t.repeatable && <Badge className="bg-blue-50 text-blue-600 text-[10px]">繰返</Badge>}
                  </div>
                  {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">目安: {t.estimateMinutes}分 — <span className="text-blue-500">タップで編集</span></p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startEdit(t)}>
                    <Edit2 className="w-3 h-3 mr-0.5" />編集
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => remove(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InventorySection() {
  const { state, setState } = useAppState();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [cat, setCat] = useState('');
  const [cost, setCost] = useState('');

  const add = () => {
    if (!name.trim()) return;
    setState((s) => ({
      ...s,
      inventoryItems: [...s.inventoryItems, { id: generateId(), name, unit, category: cat, itemType: 'food' as const, costPerUnit: Number(cost) }],
    }));
    setName(''); setUnit(''); setCat(''); setCost('');
  };

  const remove = (id: string) => setState((s) => ({ ...s, inventoryItems: s.inventoryItems.filter((i) => i.id !== id) }));

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="品名" />
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="単位 (kg, Lなど)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="カテゴリ" />
            <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="単価(円)" />
          </div>
          <Button onClick={add} className="w-full"><Plus className="w-4 h-4 mr-1" />追加</Button>
        </CardContent>
      </Card>
      {state.inventoryItems.map((item) => (
        <Card key={item.id}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">{item.name}</span>
              <span className="text-xs text-gray-500 ml-2">{item.category} / {item.unit}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">&yen;{item.costPerUnit}/{item.unit}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => remove(item.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const EMOJI_OPTIONS = ['👤', '🍽️', '☕', '🎂', '🧹', '📦', '🔔', '⚡', '🎉', '🛎️'];
const COLOR_OPTIONS = [
  { value: 'bg-blue-500', label: '青' },
  { value: 'bg-green-500', label: '緑' },
  { value: 'bg-orange-500', label: 'オレンジ' },
  { value: 'bg-purple-500', label: '紫' },
  { value: 'bg-red-500', label: '赤' },
  { value: 'bg-pink-500', label: 'ピンク' },
];

function RecipeSection() {
  const { state, setState } = useAppState();
  const recipes = state.recipes ?? [];
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ドリンク');
  const [emoji, setEmoji] = useState('☕');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [prepTime, setPrepTime] = useState('5');
  const [editingId, setEditingId] = useState<string | null>(null);

  const RECIPE_EMOJIS = ['☕', '🍵', '🧃', '🥤', '🍰', '🥪', '🍝', '🥗', '🍳', '🍞'];
  const CATEGORIES = ['ドリンク', 'フード', 'デザート', 'サイド'];

  const addRecipe = () => {
    if (!name.trim()) return;
    const stepList: RecipeStep[] = steps.split('\n').filter(Boolean).map((s, i) => ({ order: i + 1, instruction: s.trim() }));
    const newRecipe: Recipe = {
      id: generateId(), name, category, imageEmoji: emoji,
      ingredients, steps: stepList, notes, prepTimeMinutes: Number(prepTime) || 5,
    };
    setState((s) => ({ ...s, recipes: [...(s.recipes ?? []), newRecipe] }));
    setName(''); setIngredients(''); setSteps(''); setNotes(''); setPrepTime('5');
  };

  const removeRecipe = (id: string) => setState((s) => ({ ...s, recipes: (s.recipes ?? []).filter((r) => r.id !== id) }));

  return (
    <div className="space-y-3">
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="py-3">
          <p className="text-sm text-orange-800 font-medium">キッチンレシピ管理</p>
          <p className="text-xs text-orange-700 mt-0.5">店内メニューのレシピを登録すると、タスクタブの「レシピ」から注文時にすぐ確認できます。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">レシピを追加</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="メニュー名" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-md px-2 text-sm h-9">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">アイコン</Label>
            <div className="flex gap-1 mt-1">
              {RECIPE_EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center ${emoji === e ? 'bg-gray-200 ring-2 ring-black' : 'hover:bg-gray-100'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div><Label className="text-xs text-gray-500">材料（改行で区切る）</Label>
            <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="コーヒー豆 15g&#10;お湯 200ml&#10;牛乳 50ml" rows={3} className="mt-1" /></div>
          <div><Label className="text-xs text-gray-500">手順（1行1ステップ）</Label>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="豆を挽く&#10;お湯を注ぐ&#10;牛乳を温めて注ぐ" rows={4} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs text-gray-500">調理時間(分)</Label>
              <Input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs text-gray-500">ポイント・注意</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="温度に注意" className="mt-1" /></div>
          </div>
          <Button onClick={addRecipe} className="w-full bg-violet-600 hover:bg-violet-700" disabled={!name.trim()}>
            <Plus className="w-4 h-4 mr-1" />レシピを追加
          </Button>
        </CardContent>
      </Card>

      {recipes.map((r) => (
        <Card key={r.id} className={editingId === r.id ? 'ring-2 ring-black' : ''}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{r.imageEmoji}</span>
                <div>
                  <span className="font-semibold text-sm">{r.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                    <span className="text-[10px] text-gray-500">{r.prepTimeMinutes}分</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant={editingId === r.id ? 'default' : 'outline'} className="h-7 text-xs"
                  onClick={() => setEditingId(editingId === r.id ? null : r.id)}>
                  {editingId === r.id ? '閉じる' : '詳細'}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => removeRecipe(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            {editingId === r.id && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <div><p className="text-xs font-medium text-gray-500">材料</p>
                  <pre className="text-sm bg-gray-50 rounded-lg p-2 mt-1 whitespace-pre-wrap">{r.ingredients}</pre></div>
                <div><p className="text-xs font-medium text-gray-500">手順</p>
                  <div className="space-y-1 mt-1">
                    {r.steps.map((s) => (
                      <div key={s.order} className="flex gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-gray-400 font-bold shrink-0">{s.order}.</span>
                        <span className="text-sm">{s.instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {r.notes && <div><p className="text-xs font-medium text-gray-500">注意事項</p><p className="text-sm text-orange-700 bg-orange-50 rounded-lg p-2 mt-1">{r.notes}</p></div>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {recipes.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">レシピがまだ登録されていません</p>
        </div>
      )}
    </div>
  );
}

function EvaluationSection() {
  const { state, setState } = useAppState();
  const [name, setName] = useState('');
  const [points, setPoints] = useState('10');

  const add = () => {
    if (!name.trim()) return;
    setState((s) => ({
      ...s,
      evaluationCriteria: [...s.evaluationCriteria, { id: generateId(), name, maxPoints: Number(points) }],
    }));
    setName(''); setPoints('10');
  };

  const remove = (id: string) => setState((s) => ({ ...s, evaluationCriteria: s.evaluationCriteria.filter((c) => c.id !== id) }));

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="評価項目名" className="flex-1" />
            <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="w-20" placeholder="配点" />
            <Button size="icon" onClick={add}><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
      {state.evaluationCriteria.map((c) => (
        <Card key={c.id}>
          <CardContent className="py-3 flex items-center justify-between">
            <span className="font-medium text-sm">{c.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{c.maxPoints}pt</Badge>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => remove(c.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
