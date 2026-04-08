'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import type { TaskTemplate } from '@/lib/types';
import {
  Play, Camera, X, CheckCircle2, Video, Zap, Trophy,
  Clock, Star, Sparkles, User, Plus, Coffee, Target,
} from 'lucide-react';

export default function TasksTab() {
  const { state, setState } = useAppState();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [videoTask, setVideoTask] = useState<TaskTemplate | null>(null);
  const [claimTask, setClaimTask] = useState<TaskTemplate | null>(null);
  const [claimEmployee, setClaimEmployee] = useState('');
  const [comment, setComment] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  // Categories from task templates
  const categories = useMemo(() => {
    const cats = new Set(state.taskTemplates.map((t) => t.category));
    return ['all', ...Array.from(cats)];
  }, [state.taskTemplates]);

  const filteredTasks = activeCategory === 'all'
    ? state.taskTemplates
    : state.taskTemplates.filter((t) => t.category === activeCategory);

  // Check if task is already done today (for non-repeatable)
  const completionsForTask = (taskId: string) =>
    state.taskCompletions.filter((c) => c.taskId === taskId);

  const isDisabledToday = (task: TaskTemplate) =>
    !task.repeatable && completionsForTask(task.id).length > 0;

  // Today's points per employee
  const todayPointsByEmp = useMemo(() => {
    const map: Record<string, { name: string; points: number; count: number }> = {};
    for (const c of state.taskCompletions) {
      if (!map[c.completedByEmployeeId]) {
        map[c.completedByEmployeeId] = { name: c.completedBy, points: 0, count: 0 };
      }
      map[c.completedByEmployeeId].points += (c.pointsEarned ?? 0);
      map[c.completedByEmployeeId].count += 1;
    }
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.points - a.points);
  }, [state.taskCompletions]);

  const totalPointsToday = todayPointsByEmp.reduce((s, e) => s + e.points, 0);

  // Adhoc task form
  const [adhocOpen, setAdhocOpen] = useState(false);
  const [adhocTitle, setAdhocTitle] = useState('');
  const [adhocPoints, setAdhocPoints] = useState('5');
  const [adhocEmployee, setAdhocEmployee] = useState('');

  const submitAdhoc = () => {
    if (!adhocTitle.trim() || !adhocEmployee) return;
    const emp = state.employees.find((e) => e.id === adhocEmployee);
    if (!emp) return;
    const pts = Number(adhocPoints) || 5;
    setState((s) => ({
      ...s,
      taskCompletions: [...s.taskCompletions, {
        taskId: `adhoc-${Date.now()}`, taskTitle: adhocTitle,
        completedBy: emp.name, completedByEmployeeId: emp.id,
        completedAt: new Date().toISOString(), comment: '', photoPlaceholder: false,
        pointsEarned: pts, isAdhoc: true,
      }],
      boardMessages: [{ id: `msg-${Date.now()}`, type: 'report' as const, author: emp.name,
        content: `自主タスク「${adhocTitle}」を完了（+${pts}pt）`, createdAt: new Date().toISOString() }, ...s.boardMessages],
    }));
    setAdhocOpen(false); setAdhocTitle(''); setAdhocPoints('5'); setAdhocEmployee('');
  };

  const submitClaim = () => {
    if (!claimTask || !claimEmployee) return;
    const emp = state.employees.find((e) => e.id === claimEmployee);
    if (!emp) return;
    setState((s) => ({
      ...s,
      taskCompletions: [
        ...s.taskCompletions,
        {
          taskId: claimTask.id,
          taskTitle: claimTask.title,
          completedBy: emp.name,
          completedByEmployeeId: emp.id,
          completedAt: new Date().toISOString(),
          comment,
          photoPlaceholder: hasPhoto,
          pointsEarned: claimTask.points,
          isAdhoc: false,
        },
      ],
      boardMessages: [
        {
          id: `msg-${Date.now()}`,
          type: 'report' as const,
          author: emp.name,
          content: `「${claimTask.title}」を完了（+${claimTask.points}pt）${comment ? `: ${comment}` : ''}`,
          createdAt: new Date().toISOString(),
        },
        ...s.boardMessages,
      ],
    }));
    setClaimTask(null);
    setComment('');
    setHasPhoto(false);
    setClaimEmployee('');
  };

  // Recipe viewer
  const [recipeView, setRecipeView] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeCategory, setRecipeCategory] = useState<string>('all');
  const recipes = state.recipes ?? [];
  const recipeCategories = ['all', ...new Set(recipes.map((r) => r.category))];
  const filteredRecipes = recipeCategory === 'all' ? recipes : recipes.filter((r) => r.category === recipeCategory);
  const viewingRecipe = recipes.find((r) => r.id === selectedRecipe);

  // Goal data
  const goal = state.dailyGoal;
  const myGoals = goal?.staffGoals ?? [];

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {state.storeStatus === 'idle' && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <CardContent className="py-3 flex items-center gap-3">
            <Coffee className="w-8 h-8 opacity-80" />
            <div className="flex-1">
              <p className="font-bold">アイドルタイム中！</p>
              <p className="text-xs text-blue-100">お客様がいない今がチャンス。下のタスクを完了してポイントを稼ぎましょう。</p>
            </div>
          </CardContent>
        </Card>
      )}
      {state.storeStatus === 'busy' && (
        <Card className="bg-gray-100 border-gray-200">
          <CardContent className="py-3 flex items-center gap-3">
            <Zap className="w-6 h-6 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-600">忙しい時間帯です</p>
              <p className="text-xs text-gray-500">接客を優先してください。ポイントタスクはアイドルタイムに実施しましょう。</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Self-add task button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />ポイントタスク
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAdhocOpen(true)}>
          <Plus className="w-3 h-3" />自主タスクを追加
        </Button>
      </div>

      {/* Per-person mini goals */}
      {myGoals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {myGoals.map((sg) => {
            const emp = state.employees.find((e) => e.id === sg.employeeId);
            if (!emp) return null;
            const earned = todayPointsByEmp.find((e) => e.id === sg.employeeId)?.points ?? 0;
            const pct = sg.targetPoints > 0 ? Math.min(100, (earned / sg.targetPoints) * 100) : 0;
            return (
              <div key={sg.employeeId} className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">{emp.name}</span>
                  <span className="text-[10px] font-bold">{earned}/{sg.targetPoints}</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      )}

      {/* Today's Points Summary */}
      <Card className="bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">本日の獲得ポイント</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold">{totalPointsToday}</span>
                <span className="text-sm text-gray-400">pt</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{state.taskCompletions.length}件完了</p>
            </div>
            <Trophy className="w-10 h-10 text-yellow-400 opacity-80" />
          </div>
          {/* Mini leaderboard */}
          {todayPointsByEmp.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 flex gap-3 overflow-x-auto">
              {todayPointsByEmp.map((e, i) => (
                <div key={e.id} className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-gray-500'}`}>
                    {i + 1}.
                  </span>
                  <span className="text-xs">{e.name}</span>
                  <Badge className="bg-white/10 text-white text-[10px]">{e.points}pt</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Quick Access */}
      {recipes.length > 0 && (
        <div>
          {!recipeView ? (
            <Button variant="outline" className="w-full gap-2 h-11 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => setRecipeView(true)}>
              <span className="text-lg">📖</span>レシピを確認する（{recipes.length}品）
            </Button>
          ) : (
            <Card className="border-orange-200">
              <CardContent className="py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold flex items-center gap-1.5"><span className="text-lg">📖</span>レシピ</p>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setRecipeView(false); setSelectedRecipe(null); }}>
                    <X className="w-3 h-3 mr-0.5" />閉じる
                  </Button>
                </div>
                {!selectedRecipe ? (
                  <>
                    <div className="flex gap-1.5 mb-3 overflow-x-auto">
                      {recipeCategories.map((c) => (
                        <button key={c} onClick={() => setRecipeCategory(c)}
                          className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${recipeCategory === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {c === 'all' ? 'すべて' : c}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredRecipes.map((r) => (
                        <button key={r.id} onClick={() => setSelectedRecipe(r.id)}
                          className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-all">
                          <span className="text-3xl">{r.imageEmoji}</span>
                          <p className="text-xs font-medium mt-1">{r.name}</p>
                          <p className="text-[10px] text-gray-400">{r.prepTimeMinutes}分</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : viewingRecipe && (
                  <div className="space-y-3">
                    <button onClick={() => setSelectedRecipe(null)} className="text-xs text-blue-600 hover:underline">← メニュー一覧に戻る</button>
                    <div className="text-center">
                      <span className="text-4xl">{viewingRecipe.imageEmoji}</span>
                      <h3 className="text-lg font-bold mt-1">{viewingRecipe.name}</h3>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Badge variant="outline">{viewingRecipe.category}</Badge>
                        <span className="text-xs text-gray-500">{viewingRecipe.prepTimeMinutes}分</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">材料</p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap">{viewingRecipe.ingredients}</div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">手順</p>
                      <div className="space-y-1.5">
                        {viewingRecipe.steps.map((s) => (
                          <div key={s.order} className="flex gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <div className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center shrink-0 font-bold">{s.order}</div>
                            <span className="text-sm">{s.instruction}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {viewingRecipe.notes && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-orange-700 mb-0.5">ポイント・注意</p>
                        <p className="text-sm text-orange-800">{viewingRecipe.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <div className="border-b border-gray-200 mt-4 mb-2" />
        </div>
      )}

      {/* Category Filter */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-0.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />ヒマな時間にポイントを稼ごう
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-violet-50'
              }`}
            >
              {cat === 'all' ? 'すべて' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredTasks.map((task) => {
          const completions = completionsForTask(task.id);
          const disabled = isDisabledToday(task);

          return (
            <Card key={task.id} className={`transition-all ${disabled ? 'opacity-50' : 'hover:shadow-md'}`}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{task.title}</span>
                      {task.videoUrl && (
                        <button onClick={() => setVideoTask(task)}>
                          <Video className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      )}
                    </div>
                    {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg shrink-0 ml-2">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-sm font-bold text-yellow-700">{task.points}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />約{task.estimateMinutes}分</span>
                    <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                    {task.repeatable && <Badge className="bg-blue-50 text-blue-600 text-[10px]">何度でもOK</Badge>}
                  </div>
                  <Button
                    size="sm"
                    className="h-7 gap-1 bg-violet-600 hover:bg-violet-700"
                    disabled={disabled}
                    onClick={() => setClaimTask(task)}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {disabled ? '完了済み' : '完了報告'}
                  </Button>
                </div>

                {/* Show today's completions */}
                {completions.length > 0 && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    {completions.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{c.completedBy}</span>
                        <span className="text-gray-400">
                          {new Date(c.completedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-medium">+{c.pointsEarned}pt</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">このカテゴリのタスクはありません</p>
          <p className="text-xs mt-1">設定タブから追加できます</p>
        </div>
      )}

      {/* Claim Modal */}
      <Dialog open={!!claimTask} onOpenChange={() => { setClaimTask(null); setComment(''); setHasPhoto(false); setClaimEmployee(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-yellow-700">{claimTask?.points}pt</span>
              </div>
              <span className="text-base">{claimTask?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                <User className="w-4 h-4" />誰が完了しましたか？
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {state.employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setClaimEmployee(emp.id)}
                    className={`p-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                      claimEmployee === emp.id
                        ? 'bg-violet-600 text-white ring-2 ring-violet-500'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">コメント（任意）</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="完了メモ..."
                rows={2}
              />
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setHasPhoto(!hasPhoto)}
            >
              <Camera className={`w-4 h-4 ${hasPhoto ? 'text-green-500' : ''}`} />
              {hasPhoto ? '写真添付済み' : '写真を添付（プレースホルダー）'}
            </Button>
            {hasPhoto && (
              <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-gray-400 text-sm">
                写真プレビュー（モック）
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setClaimTask(null); setComment(''); setHasPhoto(false); setClaimEmployee(''); }}>
              キャンセル
            </Button>
            <Button onClick={submitClaim} className="bg-violet-600 hover:bg-violet-700" disabled={!claimEmployee}>
              <Star className="w-4 h-4 mr-1" />ポイント獲得
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={!!videoTask} onOpenChange={() => setVideoTask(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <div className="bg-black aspect-video flex items-center justify-center relative">
            <div className="text-center text-white">
              <Play className="w-16 h-16 mx-auto mb-3 opacity-60" />
              <p className="text-sm opacity-80">マニュアル動画</p>
              <p className="text-lg font-semibold mt-1">{videoTask?.title}</p>
            </div>
            <button
              onClick={() => setVideoTask(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{videoTask?.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{videoTask?.description}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adhoc Task Dialog */}
      <Dialog open={adhocOpen} onOpenChange={setAdhocOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />自主タスクを追加</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500">通常業務以外で自発的にやったことを登録してポイントを獲得しましょう。</p>
            <Input value={adhocTitle} onChange={(e) => setAdhocTitle(e.target.value)} placeholder="何をしましたか？（例: 窓拭き）" />
            <div>
              <Label className="text-xs text-gray-500">ポイント</Label>
              <Input type="number" value={adhocPoints} onChange={(e) => setAdhocPoints(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">誰が？</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {state.employees.map((emp) => (
                  <button key={emp.id} onClick={() => setAdhocEmployee(emp.id)}
                    className={`p-2 rounded-lg text-sm font-medium text-left transition-all ${adhocEmployee === emp.id ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-violet-50'}`}>
                    {emp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdhocOpen(false)}>キャンセル</Button>
            <Button onClick={submitAdhoc} className="bg-violet-600 hover:bg-violet-700" disabled={!adhocTitle.trim() || !adhocEmployee}>
              <Star className="w-4 h-4 mr-1" />ポイント獲得
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
