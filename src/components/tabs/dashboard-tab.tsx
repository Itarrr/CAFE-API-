'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppState } from '@/lib/context';
import { manualReset, generateId } from '@/lib/store';
import type { DailyGoal, StoreStatus } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DollarSign, Users, Zap, Star,
  Clock, Activity, Plus, Target, Coffee,
  Sunrise, Trophy, Sparkles, Eye, Mic, CheckCircle,
} from 'lucide-react';

export default function DashboardTab() {
  const { state, setState } = useAppState();
  const now = new Date();
  const [openingModal, setOpeningModal] = useState(false);

  const goal = state.dailyGoal;
  const isOpen = goal?.isOpen ?? false;

  // Today's points
  const todayPoints = state.taskCompletions.reduce((s, c) => s + (c.pointsEarned ?? 0), 0);
  const todayCompletions = state.taskCompletions.length;

  // Per-person points
  const pointsByEmp = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of state.taskCompletions) {
      map[c.completedByEmployeeId] = (map[c.completedByEmployeeId] ?? 0) + (c.pointsEarned ?? 0);
    }
    return map;
  }, [state.taskCompletions]);

  const clockedInCount = state.timeRecords.filter(
    (r) => r.date === format(now, 'yyyy-MM-dd') && r.clockIn && !r.clockOut
  ).length;

  const laborCost = useMemo(() => {
    const today = format(now, 'yyyy-MM-dd');
    return state.timeRecords
      .filter((r) => r.date === today && r.clockIn)
      .reduce((sum, r) => {
        const emp = state.employees.find((e) => e.id === r.employeeId);
        if (!emp) return sum;
        const [ih, im] = (r.clockIn ?? '0:0').split(':').map(Number);
        const end = r.clockOut ? r.clockOut.split(':').map(Number) : [now.getHours(), now.getMinutes()];
        const hours = (end[0] * 60 + end[1] - ih * 60 - im) / 60;
        return sum + emp.hourlyWage * Math.max(0, hours);
      }, 0);
  }, [state.timeRecords, state.employees, now]);

  // Sales from manual entries
  const entries = state.dailySales?.entries ?? [];
  const revenue = entries.reduce((s, e) => s + e.revenue, 0);
  const customerCount = entries.reduce((s, e) => s + e.customerCount, 0);
  const foodCost = revenue * 0.3;
  const flRatio = revenue > 0 ? Math.round(((foodCost + laborCost) / revenue) * 100) : 0;

  // 2-hour reminder
  const lastEntry = state.dailySales?.lastEntryAt;
  const needsSalesEntry = useMemo(() => {
    if (!isOpen) return false;
    if (!lastEntry) return true;
    const [lh, lm] = lastEntry.split(':').map(Number);
    const lastMin = lh * 60 + lm;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin - lastMin >= 120;
  }, [lastEntry, now, isOpen]);

  const [salesOpen, setSalesOpen] = useState(false);
  const [salesRevenue, setSalesRevenue] = useState('');
  const [salesCustomers, setSalesCustomers] = useState('');
  const [salesNote, setSalesNote] = useState('');

  const submitSales = () => {
    const nowTime = format(now, 'HH:mm');
    setState((s) => ({
      ...s,
      dailySales: {
        ...s.dailySales,
        entries: [...(s.dailySales?.entries ?? []), {
          id: generateId(), time: nowTime,
          revenue: Number(salesRevenue) || 0,
          customerCount: Number(salesCustomers) || 0,
          note: salesNote,
        }],
        lastEntryAt: nowTime,
      },
    }));
    setSalesOpen(false); setSalesRevenue(''); setSalesCustomers(''); setSalesNote('');
  };

  // Store status
  const statusConfig = {
    idle: { label: 'ヒマ', color: 'bg-blue-50 text-blue-600', icon: <Coffee className="w-4 h-4" />, desc: 'アイドルタイム！ポイントを稼ごう' },
    normal: { label: '通常', color: 'bg-green-50 text-green-600', icon: <Eye className="w-4 h-4" />, desc: '通常営業中' },
    busy: { label: '忙しい', color: 'bg-red-50 text-red-600', icon: <Zap className="w-4 h-4" />, desc: '接客優先' },
  };
  const currentStatus = statusConfig[state.storeStatus];

  const setStatus = (s: StoreStatus) => setState((prev) => ({ ...prev, storeStatus: s }));

  if (!isOpen) {
    return <OpeningFlow onOpen={() => setOpeningModal(false)} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{state.settings.storeName}</h1>
          <p className="text-xs text-gray-400">{format(now, 'M月d日(E) HH:mm', { locale: ja })}</p>
        </div>
        <Badge className={`rounded-full px-3 ${goal?.dayType === 'weekday' ? 'bg-gray-100 text-gray-600' : goal?.dayType === 'weekend' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
          {goal?.dayType === 'weekday' ? '平日' : goal?.dayType === 'weekend' ? '土日' : '祝日'}
        </Badge>
      </div>

      {/* Store Status Toggle */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">店舗ステータス</span>
            <Badge className={`rounded-full ${currentStatus.color}`}>{currentStatus.icon}<span className="ml-1">{currentStatus.label}</span></Badge>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['idle', 'normal', 'busy'] as StoreStatus[]).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`py-2 rounded-xl text-xs font-medium transition-all ${state.storeStatus === s ? 'bg-[#ff6b6b] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                {statusConfig[s].label}
              </button>
            ))}
          </div>
          {state.storeStatus === 'idle' && (
            <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />アイドルタイム！タスクタブでポイントを稼ぎましょう
            </p>
          )}
        </CardContent>
      </Card>

      {/* 引き継ぎタスク */}
      {(() => {
        const handoverItems = (state.voiceLogs ?? [])
          .flatMap((log) =>
            log.classified.handover.map((text, i) => ({ id: `${log.id}-${i}`, text }))
          );
        const checked = state.checkedHandovers ?? [];
        const unchecked = handoverItems.filter((item) => !checked.includes(item.id));
        if (unchecked.length === 0) return null;

        const toggleCheck = (itemId: string) => {
          setState((s) => ({
            ...s,
            checkedHandovers: [...(s.checkedHandovers ?? []), itemId],
          }));
        };

        return (
          <Card className="border border-orange-200 rounded-2xl">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-orange-700">引き継ぎ作業</span>
                <Badge className="bg-orange-50 text-orange-600 rounded-full ml-auto">{unchecked.length}件</Badge>
              </div>
              <ul className="space-y-1.5">
                {unchecked.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 bg-orange-50 rounded-xl px-3 py-2">
                    <Checkbox
                      id={item.id}
                      onCheckedChange={() => toggleCheck(item.id)}
                      className="mt-0.5 border-orange-300 data-[state=checked]:bg-orange-500"
                    />
                    <label htmlFor={item.id} className="text-sm text-orange-700 cursor-pointer flex-1">
                      {item.text}
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })()}

      {/* Sales Entry Reminder */}
      {needsSalesEntry && (
        <Card className="border border-amber-200 bg-amber-50 rounded-2xl">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-700">売上を入力してください</p>
                <p className="text-xs text-amber-500">{lastEntry ? `前回入力: ${lastEntry}（2時間以上経過）` : '本日まだ入力がありません'}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setSalesOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">入力</Button>
          </CardContent>
        </Card>
      )}

      {/* Sales Entry Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">売上入力: {entries.length}回</span>
          {lastEntry && <Badge variant="outline" className="text-[10px] rounded-full">最終: {lastEntry}</Badge>}
        </div>
        <Button size="sm" variant="outline" onClick={() => setSalesOpen(true)} className="h-7 text-xs gap-1 rounded-xl">
          <Plus className="w-3 h-3" />売上入力
        </Button>
      </div>

      {/* Goal Progress */}
      {goal && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><Target className="w-3.5 h-3.5" />本日の目標</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5"><span>売上目標</span><span>&yen;{revenue.toLocaleString()} / {goal.targetRevenue.toLocaleString()}</span></div>
                <Progress value={Math.min(100, (revenue / goal.targetRevenue) * 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5"><span>生産性ポイント</span><span>{todayPoints} / {goal.targetPoints}pt</span></div>
                <Progress value={Math.min(100, (todayPoints / goal.targetPoints) * 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-person Point Progress */}
      {goal && goal.staffGoals.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-400" />スタッフ別ポイント進捗</CardTitle></CardHeader>
          <CardContent className="pb-3 space-y-2">
            {goal.staffGoals.map((sg) => {
              const emp = state.employees.find((e) => e.id === sg.employeeId);
              if (!emp) return null;
              const earned = pointsByEmp[sg.employeeId] ?? 0;
              const pct = sg.targetPoints > 0 ? Math.min(100, (earned / sg.targetPoints) * 100) : 0;
              const achieved = earned >= sg.targetPoints;
              return (
                <div key={sg.employeeId}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${achieved ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.name.slice(0,1)}
                      </div>
                      <span className="text-xs font-medium">{emp.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${achieved ? 'text-amber-500' : ''}`}>{earned}/{sg.targetPoints}pt</span>
                  </div>
                  <Progress value={pct} className={`h-1.5 ${achieved ? '[&>div]:bg-amber-400' : ''}`} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-3">
          <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-gray-400">売上</span><DollarSign className="w-3.5 h-3.5 text-gray-300" /></div>
          <p className="text-lg font-bold">&yen;{revenue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">{customerCount}名来店</p>
        </CardContent></Card>
        <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-3">
          <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-gray-400">FL比率</span><Activity className="w-3.5 h-3.5 text-gray-300" /></div>
          <p className={`text-lg font-bold ${flRatio > 65 ? 'text-red-500' : flRatio > 55 ? 'text-amber-500' : 'text-green-500'}`}>{flRatio}%</p>
          <p className="text-[10px] text-gray-400">目標: 55%以下</p>
        </CardContent></Card>
        <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-3">
          <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-gray-400">出勤中</span><Users className="w-3.5 h-3.5 text-gray-300" /></div>
          <p className="text-lg font-bold">{clockedInCount}<span className="text-xs text-gray-300">名</span></p>
        </CardContent></Card>
        <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-3">
          <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-gray-400">本日ポイント</span><Star className="w-3.5 h-3.5 text-amber-400" /></div>
          <p className="text-lg font-bold">{todayPoints}<span className="text-xs text-gray-300 ml-0.5">pt</span></p>
          <p className="text-[10px] text-gray-400">{todayCompletions}件完了</p>
        </CardContent></Card>
      </div>

      {/* Idle Time Task Suggestions */}
      {state.storeStatus === 'idle' && (
        <Card className="border border-blue-100 bg-blue-50 rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Coffee className="w-4 h-4 text-blue-500" />アイドルタイムおすすめタスク</CardTitle></CardHeader>
          <CardContent className="pb-3 space-y-1.5">
            {state.taskTemplates
              .filter((t) => t.repeatable || !state.taskCompletions.find((c) => c.taskId === t.id))
              .sort((a, b) => b.points - a.points)
              .slice(0, 4)
              .map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                  <div>
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="text-[10px] text-gray-400 ml-2">約{t.estimateMinutes}分</span>
                  </div>
                  <Badge className="bg-amber-50 text-amber-600 rounded-full">{t.points}pt</Badge>
                </div>
              ))}
            {state.taskTemplates.length === 0 && <p className="text-xs text-blue-500">設定タブからタスクを追加してください</p>}
            <p className="text-[10px] text-blue-400 text-center pt-1">タスクタブで完了報告 → ポイント獲得</p>
          </CardContent>
        </Card>
      )}

      {/* Costs */}
      <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="py-3">
        <div className="flex items-center justify-between"><span className="text-sm text-gray-500">本日の人件費</span><span className="font-bold">&yen;{Math.round(laborCost).toLocaleString()}</span></div>
        <div className="flex items-center justify-between mt-1"><span className="text-sm text-gray-500">食材原価（推定30%）</span><span className="font-bold">&yen;{Math.round(foodCost).toLocaleString()}</span></div>
      </CardContent></Card>

      {/* Sales entry history */}
      {entries.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">売上入力履歴</CardTitle></CardHeader>
          <CardContent className="pb-3 space-y-1">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] rounded-full">{e.time}</Badge>
                  <span>&yen;{e.revenue.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">{e.customerCount}名</span>
                </div>
                {e.note && <span className="text-xs text-gray-400">{e.note}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sales Input Modal */}
      <Dialog open={salesOpen} onOpenChange={setSalesOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />売上入力</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-400">現在時刻: {format(now, 'HH:mm')} — 直近2時間分の売上・客数を入力</p>
            <div>
              <Label>売上金額</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">&yen;</span>
                <Input type="number" value={salesRevenue} onChange={(e) => setSalesRevenue(e.target.value)} placeholder="例: 25000" className="pl-7" autoFocus />
              </div>
            </div>
            <div>
              <Label>客数</Label>
              <Input type="number" value={salesCustomers} onChange={(e) => setSalesCustomers(e.target.value)} placeholder="例: 15" className="mt-1" />
            </div>
            <div>
              <Label>メモ（任意）</Label>
              <Input value={salesNote} onChange={(e) => setSalesNote(e.target.value)} placeholder="ランチピーク後 等" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalesOpen(false)} className="rounded-xl">キャンセル</Button>
            <Button onClick={submitSales} className="bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl" disabled={!salesRevenue}>
              <DollarSign className="w-4 h-4 mr-1" />記録する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── 開店処理フロー ──────────────────────────────
function OpeningFlow({ onOpen }: { onOpen: () => void }) {
  const { state, setState } = useAppState();
  const now = new Date();
  const dow = now.getDay();
  const isWeekend = dow === 0 || dow === 6;

  const [dayType, setDayType] = useState<'weekday' | 'weekend' | 'holiday'>(isWeekend ? 'weekend' : 'weekday');
  const template = state.dayTargetTemplates.find((t) => t.dayType === dayType);
  const [targetRevenue, setTargetRevenue] = useState(template?.targetRevenue ?? 80000);
  const [targetPoints, setTargetPoints] = useState(template?.targetPoints ?? 100);

  const switchDayType = (dt: 'weekday' | 'weekend' | 'holiday') => {
    setDayType(dt);
    const t = state.dayTargetTemplates.find((x) => x.dayType === dt);
    if (t) { setTargetRevenue(t.targetRevenue); setTargetPoints(t.targetPoints); }
  };

  const startDay = () => {
    const today = format(now, 'yyyy-MM-dd');
    const empCount = state.employees.length || 1;
    const perPerson = Math.round(targetPoints / empCount);
    const staffGoals = state.employees.map((e) => ({ employeeId: e.id, targetPoints: perPerson }));

    const goal: DailyGoal = {
      date: today, dayType, targetRevenue, targetPoints,
      isOpen: true, openedAt: format(now, 'HH:mm'), staffGoals,
    };

    const reset = manualReset(state);
    setState(() => ({
      ...reset, dailyGoal: goal, storeStatus: 'normal' as const,
    }));
    onOpen();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg border-0 rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto bg-[#ff6b6b] rounded-3xl flex items-center justify-center mb-3">
            <Sunrise className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">開店処理</CardTitle>
          <p className="text-sm text-gray-400 mt-1">{format(now, 'M月d日(E)', { locale: ja })} の目標を設定</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Day type */}
          <div>
            <Label className="text-xs text-gray-400">今日は何曜日タイプ？</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {([['weekday', '平日'], ['weekend', '土日'], ['holiday', '祝日']] as const).map(([v, l]) => (
                <button key={v} onClick={() => switchDayType(v)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${dayType === v ? 'bg-[#ff6b6b] text-white' : 'bg-gray-50 text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Targets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">目標売上</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&yen;</span>
                <Input type="number" value={targetRevenue} onChange={(e) => setTargetRevenue(Number(e.target.value))} className="pl-7" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400">目標ポイント（全体）</Label>
              <div className="relative mt-1">
                <Input type="number" value={targetPoints} onChange={(e) => setTargetPoints(Number(e.target.value))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">pt</span>
              </div>
            </div>
          </div>

          {/* Per-person preview */}
          <div className="bg-gray-50 rounded-2xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">スタッフ別目標（均等配分）</p>
            {state.employees.length > 0 ? (
              <div className="space-y-1">
                {state.employees.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span>{e.name}</span>
                    <Badge variant="outline" className="rounded-full">{Math.round(targetPoints / state.employees.length)}pt</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center">従業員が未登録です</p>
            )}
          </div>

          {/* 前日の引き継ぎ事項 */}
          {(() => {
            const today = format(now, 'yyyy-MM-dd');
            const handovers = (state.voiceLogs ?? [])
              .filter((log) => log.date !== today && log.classified.handover.length > 0);
            const items = handovers.flatMap((log) =>
              log.classified.handover.map((text, i) => ({ id: `${log.id}-${i}`, text }))
            );
            if (items.length === 0) return null;
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
                <p className="text-xs text-orange-600 font-medium flex items-center gap-1.5 mb-2">
                  <Mic className="w-3.5 h-3.5" />前日の引き継ぎ事項
                </p>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="text-sm text-orange-700 flex items-start gap-1.5">
                      <span className="mt-0.5">*</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          <Button onClick={startDay} className="w-full h-14 text-lg bg-[#ff6b6b] hover:bg-[#e05555] rounded-2xl">
            <Sunrise className="w-5 h-5 mr-2" />開店する
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
