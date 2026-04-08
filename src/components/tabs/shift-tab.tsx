'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import type { ShiftRequest, ConfirmedShift } from '@/lib/types';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  LogIn, LogOut, Clock, Wand2, Calendar, Camera, UserCheck,
  ChevronLeft, ChevronRight, AlertCircle, Sparkles, Send,
  Check, X, Users, Bell, Eye, Scan, Plus, Trash2,
} from 'lucide-react';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const POSITIONS = ['ホール', 'キッチン', 'レジ'];

type View = 'request' | 'manage' | 'timecard' | 'face';

export default function ShiftTab() {
  const [view, setView] = useState<View>('manage');

  const views: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'request', label: '希望提出', icon: <Send className="w-4 h-4" /> },
    { id: 'manage', label: 'シフト管理', icon: <Calendar className="w-4 h-4" /> },
    { id: 'timecard', label: 'タイムカード', icon: <Clock className="w-4 h-4" /> },
    { id: 'face', label: '顔認証打刻', icon: <Scan className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex bg-violet-50 rounded-xl p-1 overflow-x-auto">
        {views.map((v) => (
          <button
            key={v.id}
            className={`flex-1 text-xs md:text-sm py-2 px-1 rounded-md transition-colors flex items-center justify-center gap-1 whitespace-nowrap ${
              view === v.id ? 'bg-white shadow font-medium' : 'text-gray-500'
            }`}
            onClick={() => setView(v.id)}
          >
            {v.icon}{v.label}
          </button>
        ))}
      </div>
      {view === 'request' && <ShiftRequestView />}
      {view === 'manage' && <ShiftManageView />}
      {view === 'timecard' && <TimecardView />}
      {view === 'face' && <FaceClockView />}
    </div>
  );
}

// ─── シフト希望提出 ────────────────────────────
function ShiftRequestView() {
  const { state, setState } = useAppState();
  const [weekOffset, setWeekOffset] = useState(1); // default to next week
  const [selectedEmp, setSelectedEmp] = useState(state.employees[0]?.id ?? '');
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [note, setNote] = useState('');

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const myRequests = state.shiftRequests.filter((r) => r.employeeId === selectedEmp);

  const submit = () => {
    if (!addingDate || !selectedEmp) return;
    setState((s) => ({
      ...s,
      shiftRequests: [...s.shiftRequests, {
        id: generateId(),
        employeeId: selectedEmp,
        date: addingDate,
        startTime,
        endTime,
        status: 'pending',
        note,
        submittedAt: new Date().toISOString(),
      }],
    }));
    setAddingDate(null);
    setNote('');
  };

  const removeRequest = (id: string) =>
    setState((s) => ({ ...s, shiftRequests: s.shiftRequests.filter((r) => r.id !== id) }));

  const emp = state.employees.find((e) => e.id === selectedEmp);

  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <p className="text-sm text-blue-800 font-medium">シフト希望を提出</p>
          <p className="text-xs text-blue-700 mt-0.5">出勤可能な日と時間帯を選んで送信してください。管理者が確認後にシフトが確定します。</p>
        </CardContent>
      </Card>

      {/* Employee selector */}
      <div>
        <Label className="text-xs text-gray-500">スタッフ選択</Label>
        <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
          {state.employees.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEmp(e.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedEmp === e.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, 'M/d')} - {format(addDays(weekStart, 6), 'M/d')}
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Badge variant="outline" className="text-xs">{myRequests.length}件提出済み</Badge>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d, i) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const req = myRequests.find((r) => r.date === dateStr);
          const isPast = d < new Date() && !isSameDay(d, new Date());
          return (
            <div key={i} className="text-center">
              <p className={`text-[10px] font-medium mb-1 ${i >= 5 ? 'text-red-400' : 'text-gray-500'}`}>
                {DAYS[i]}
              </p>
              <button
                disabled={isPast}
                onClick={() => { setAddingDate(dateStr); setStartTime('09:00'); setEndTime('17:00'); }}
                className={`w-full aspect-square rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center ${
                  req
                    ? req.status === 'approved' ? 'bg-green-100 text-green-800 border-2 border-green-400'
                    : req.status === 'rejected' ? 'bg-red-50 text-red-400 border border-red-200'
                    : 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                    : isPast ? 'bg-gray-50 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>{format(d, 'd')}</span>
                {req && <span className="text-[8px]">{req.startTime.slice(0,5)}</span>}
              </button>
              {req && (
                <button onClick={() => removeRequest(req.id)} className="text-[9px] text-gray-400 hover:text-red-500 mt-0.5">取消</button>
              )}
            </div>
          );
        })}
      </div>

      {/* My requests list */}
      {myRequests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">提出済み希望</p>
          {myRequests.sort((a,b) => a.date.localeCompare(b.date)).map((r) => (
            <Card key={r.id}>
              <CardContent className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${
                    r.status === 'approved' ? 'bg-green-50 text-green-700' : r.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {r.status === 'approved' ? '承認' : r.status === 'rejected' ? '却下' : '保留'}
                  </Badge>
                  <span className="text-sm">{format(new Date(r.date), 'M/d(E)', { locale: ja })}</span>
                  <span className="text-xs text-gray-500">{r.startTime}-{r.endTime}</span>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400" onClick={() => removeRequest(r.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add request dialog */}
      <Dialog open={!!addingDate} onOpenChange={() => setAddingDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>シフト希望を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-center">
              <p className="text-lg font-bold">{addingDate && format(new Date(addingDate), 'M月d日(E)', { locale: ja })}</p>
              <p className="text-sm text-gray-500">{emp?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>開始</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" /></div>
              <div><Label>終了</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>備考</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="希望理由など..." rows={2} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingDate(null)}>キャンセル</Button>
            <Button onClick={submit} className="bg-violet-600 hover:bg-violet-700"><Send className="w-4 h-4 mr-1" />提出</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── シフト管理（管理者） ───────────────────────
function ShiftManageView() {
  const { state, setState } = useAppState();
  const [weekOffset, setWeekOffset] = useState(0);
  const [optimizing, setOptimizing] = useState(false);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const pendingRequests = state.shiftRequests.filter((r) => r.status === 'pending');

  const approveRequest = (id: string) => {
    const req = state.shiftRequests.find((r) => r.id === id);
    if (!req) return;
    setState((s) => ({
      ...s,
      shiftRequests: s.shiftRequests.map((r) => r.id === id ? { ...r, status: 'approved' as const } : r),
      confirmedShifts: [...s.confirmedShifts, {
        id: generateId(), employeeId: req.employeeId, date: req.date,
        startTime: req.startTime, endTime: req.endTime, position: 'ホール',
        confirmedAt: new Date().toISOString(),
      }],
    }));
  };

  const rejectRequest = (id: string) =>
    setState((s) => ({ ...s, shiftRequests: s.shiftRequests.map((r) => r.id === id ? { ...r, status: 'rejected' as const } : r) }));

  const approveAll = () => {
    setState((s) => {
      const pending = s.shiftRequests.filter((r) => r.status === 'pending');
      const newConfirmed: ConfirmedShift[] = pending.map((r) => ({
        id: generateId(), employeeId: r.employeeId, date: r.date,
        startTime: r.startTime, endTime: r.endTime, position: 'ホール',
        confirmedAt: new Date().toISOString(),
      }));
      return {
        ...s,
        shiftRequests: s.shiftRequests.map((r) => r.status === 'pending' ? { ...r, status: 'approved' as const } : r),
        confirmedShifts: [...s.confirmedShifts, ...newConfirmed],
      };
    });
  };

  // AI auto-generate: fills gaps based on requirements
  const autoGenerate = () => {
    setOptimizing(true);
    setTimeout(() => {
      const newShifts: ConfirmedShift[] = [];
      weekDays.forEach((d, dayIdx) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const existing = state.confirmedShifts.filter((s) => s.date === dateStr);
        // Fill minimum staffing
        state.employees.forEach((emp) => {
          if (existing.find((s) => s.employeeId === emp.id)) return;
          if (Math.random() > 0.4) {
            newShifts.push({
              id: generateId(), employeeId: emp.id, date: dateStr,
              startTime: dayIdx < 5 ? '09:00' : '10:00',
              endTime: dayIdx < 5 ? '17:00' : '21:00',
              position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
              confirmedAt: new Date().toISOString(),
            });
          }
        });
      });
      setState((s) => ({
        ...s,
        confirmedShifts: [...s.confirmedShifts.filter((cs) => {
          const inWeek = weekDays.some((d) => format(d, 'yyyy-MM-dd') === cs.date);
          return !inWeek;
        }), ...newShifts],
        // also generate legacy shiftSlots for compatibility
        shiftSlots: newShifts.map((s) => ({
          id: s.id, dayOfWeek: new Date(s.date).getDay() === 0 ? 6 : new Date(s.date).getDay() - 1,
          startTime: s.startTime, endTime: s.endTime, employeeId: s.employeeId,
        })),
      }));
      setOptimizing(false);
    }, 1500);
  };

  // Calc hours helper
  const calcH = (a: string, b: string) => {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return Math.max(0, (bh * 60 + bm - ah * 60 - am) / 60);
  };

  const allRecords = [...(state.timeRecordsArchive ?? []), ...state.timeRecords];

  return (
    <div className="space-y-4">
      {/* Pending requests alert */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-yellow-800 flex items-center gap-1.5">
                <Bell className="w-4 h-4" />未承認のシフト希望
              </p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={approveAll}>
                  <Check className="w-3 h-3 mr-0.5" />一括承認
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              {pendingRequests.slice(0, 5).map((r) => {
                const emp = state.employees.find((e) => e.id === r.employeeId);
                return (
                  <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{emp?.name}</span>
                      <span className="text-xs text-gray-500">{format(new Date(r.date), 'M/d(E)', { locale: ja })}</span>
                      <span className="text-xs text-gray-500">{r.startTime}-{r.endTime}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" className="h-6 w-6 bg-green-500 hover:bg-green-600" onClick={() => approveRequest(r.id)}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-6 w-6 text-red-500" onClick={() => rejectRequest(r.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {pendingRequests.length > 5 && <p className="text-xs text-yellow-600 text-center">他{pendingRequests.length - 5}件</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week nav + AI */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">{format(weekStart, 'M/d')} - {format(addDays(weekStart, 6), 'M/d')}</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button size="sm" onClick={autoGenerate} disabled={optimizing} className="gap-1 bg-violet-600 hover:bg-violet-700">
          {optimizing ? <><Sparkles className="w-3.5 h-3.5 animate-spin" />AI生成中...</> : <><Wand2 className="w-3.5 h-3.5" />AIシフト自動作成</>}
        </Button>
      </div>

      {/* Shift table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[750px]">
          {/* Header */}
          <div className="grid gap-1 text-center text-xs" style={{ gridTemplateColumns: '80px repeat(7, 1fr) 90px' }}>
            <div className="p-1 font-medium text-gray-400">名前</div>
            {weekDays.map((d, i) => {
              const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={i} className={`p-1 font-medium rounded ${isToday ? 'bg-black text-white' : i >= 5 ? 'text-red-400' : 'text-gray-600'}`}>
                  {DAYS[i]}<br />{format(d, 'd')}
                </div>
              );
            })}
            <div className="p-1 font-medium text-gray-400 text-right">時間/人件費</div>
          </div>

          {/* Rows */}
          {state.employees.map((emp) => {
            let weekHours = 0;
            return (
              <div key={emp.id} className="grid gap-1 text-center border-t border-gray-50" style={{ gridTemplateColumns: '80px repeat(7, 1fr) 90px' }}>
                <div className="p-1 text-xs font-medium truncate text-left flex items-center">{emp.name}</div>
                {weekDays.map((d, i) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const cs = state.confirmedShifts.find((s) => s.employeeId === emp.id && s.date === dateStr);
                  const actual = allRecords.find((r) => r.employeeId === emp.id && r.date === dateStr && r.clockIn);
                  const req = state.shiftRequests.find((r) => r.employeeId === emp.id && r.date === dateStr && r.status === 'pending');
                  if (actual?.clockIn && actual?.clockOut) weekHours += calcH(actual.clockIn, actual.clockOut);
                  else if (cs) weekHours += calcH(cs.startTime, cs.endTime);

                  return (
                    <div key={i} className={`p-1 rounded text-[10px] ${
                      actual?.clockIn ? 'bg-green-50 border border-green-200'
                      : cs ? 'bg-blue-50 border border-blue-200'
                      : req ? 'bg-yellow-50 border border-yellow-200 border-dashed'
                      : 'text-gray-300'
                    }`}>
                      {cs && <div className={actual?.clockIn ? 'text-gray-400 line-through' : 'text-blue-700'}>{cs.startTime.slice(0,5)}-{cs.endTime.slice(0,5)}</div>}
                      {cs && <div className="text-[9px] text-blue-500">{cs.position}</div>}
                      {actual?.clockIn && (
                        <div className="text-green-700 font-medium">
                          {actual.clockIn}{actual.clockOut ? `-${actual.clockOut}` : '~'}
                        </div>
                      )}
                      {!cs && req && <div className="text-yellow-600">{req.startTime.slice(0,5)}<br/>希望</div>}
                      {!cs && !req && !actual?.clockIn && '-'}
                    </div>
                  );
                })}
                <div className="p-1 text-right flex flex-col justify-center">
                  <div className="text-xs font-bold">{weekHours.toFixed(1)}h</div>
                  <div className="text-[10px] text-gray-500">&yen;{Math.round(weekHours * emp.hourlyWage).toLocaleString()}</div>
                </div>
              </div>
            );
          })}

          {/* Total */}
          {state.employees.length > 0 && (
            <div className="grid gap-1 text-center border-t-2 border-gray-200 mt-1 pt-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr) 90px' }}>
              <div className="p-1 text-xs font-bold text-right" style={{ gridColumn: 'span 8' }}>合計</div>
              <div className="p-1 text-right">
                <div className="text-xs font-bold">
                  {state.employees.reduce((sum, emp) => {
                    return sum + weekDays.reduce((ds, d) => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const a = allRecords.find((r) => r.employeeId === emp.id && r.date === dateStr && r.clockIn && r.clockOut);
                      const cs = state.confirmedShifts.find((s) => s.employeeId === emp.id && s.date === dateStr);
                      if (a?.clockIn && a?.clockOut) return ds + calcH(a.clockIn, a.clockOut);
                      if (cs) return ds + calcH(cs.startTime, cs.endTime);
                      return ds;
                    }, 0);
                  }, 0).toFixed(1)}h
                </div>
                <div className="text-[10px] font-bold text-gray-700">
                  &yen;{Math.round(state.employees.reduce((sum, emp) => {
                    return sum + weekDays.reduce((ds, d) => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const a = allRecords.find((r) => r.employeeId === emp.id && r.date === dateStr && r.clockIn && r.clockOut);
                      const cs = state.confirmedShifts.find((s) => s.employeeId === emp.id && s.date === dateStr);
                      if (a?.clockIn && a?.clockOut) return ds + calcH(a.clockIn, a.clockOut) * emp.hourlyWage;
                      if (cs) return ds + calcH(cs.startTime, cs.endTime) * emp.hourlyWage;
                      return ds;
                    }, 0);
                  }, 0)).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 px-1">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /><span>確定シフト</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-50 border border-green-200" /><span>実績あり</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200 border-dashed" /><span>希望（未承認）</span></div>
      </div>
    </div>
  );
}

// ─── タイムカード ───────────────────────────────
function TimecardView() {
  const { state, setState } = useAppState();
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverEmp, setHandoverEmp] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  // Show employees with confirmed shift today, or all if none
  const todayDow = new Date().getDay();
  const shiftDow = todayDow === 0 ? 6 : todayDow - 1;
  const todayConfirmed = state.confirmedShifts.filter((s) => s.date === today);
  const todayShiftLegacy = state.shiftSlots.filter((s) => s.dayOfWeek === shiftDow);
  const scheduledIds = new Set([...todayConfirmed.map((s) => s.employeeId), ...todayShiftLegacy.map((s) => s.employeeId)]);
  const displayEmployees = scheduledIds.size > 0 ? state.employees.filter((e) => scheduledIds.has(e.id)) : state.employees;

  const getRecord = (empId: string) => state.timeRecords.find((r) => r.employeeId === empId && r.date === today);
  const getShift = (empId: string) => todayConfirmed.find((s) => s.employeeId === empId) ?? todayShiftLegacy.find((s) => s.employeeId === empId);

  const clockIn = (empId: string) => {
    const emp = state.employees.find((e) => e.id === empId);
    setHandoverEmp(emp?.name ?? '');
    setHandoverOpen(true);
    setState((s) => ({
      ...s,
      timeRecords: [...s.timeRecords, { employeeId: empId, date: today, clockIn: format(new Date(), 'HH:mm'), clockOut: null }],
    }));
    setSelectedEmpId(null);
  };

  const clockOut = (empId: string) => {
    const nowTime = format(new Date(), 'HH:mm');
    setState((s) => {
      const updated = s.timeRecords.map((r) =>
        r.employeeId === empId && r.date === today && !r.clockOut ? { ...r, clockOut: nowTime } : r
      );
      const completed = updated.find((r) => r.employeeId === empId && r.date === today && r.clockIn && r.clockOut);
      return { ...s, timeRecords: updated, timeRecordsArchive: completed ? [...(s.timeRecordsArchive ?? []), completed] : (s.timeRecordsArchive ?? []) };
    });
    setSelectedEmpId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-gray-500">{format(new Date(), 'M月d日(E)', { locale: ja })}</h3>
        <Badge variant="outline" className="text-[10px]">
          {scheduledIds.size > 0 ? `本日シフト: ${displayEmployees.length}名` : `全スタッフ: ${displayEmployees.length}名`}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {displayEmployees.map((emp) => {
          const rec = getRecord(emp.id);
          const shift = getShift(emp.id);
          const status = rec?.clockOut ? 'done' : rec?.clockIn ? 'working' : 'pending';
          const isSelected = selectedEmpId === emp.id;

          return (
            <Card
              key={emp.id}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-black' : ''} ${
                status === 'working' ? 'border-green-200 bg-green-50/30' : status === 'done' ? 'opacity-60' : ''
              }`}
              onClick={() => setSelectedEmpId(isSelected ? null : emp.id)}
            >
              <CardContent className="py-3 px-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    status === 'working' ? 'bg-green-500' : status === 'done' ? 'bg-gray-300' : 'bg-gray-200 text-gray-500'
                  }`}>{emp.name.slice(0, 1)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-[10px] text-gray-500">{emp.role === 'manager' ? '社員' : emp.role === 'staff' ? 'スタッフ' : 'アルバイト'}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${status === 'working' ? 'bg-green-500 animate-pulse' : status === 'done' ? 'bg-gray-300' : 'bg-gray-200'}`} />
                </div>
                {shift && 'startTime' in shift && <div className="text-[10px] text-gray-500 mb-1">シフト: {shift.startTime}-{shift.endTime}</div>}
                {status === 'pending' && <Badge variant="outline" className="text-[10px] w-full justify-center">未出勤</Badge>}
                {status === 'working' && <div className="text-xs text-green-700 font-medium text-center">出勤中 {rec?.clockIn}〜</div>}
                {status === 'done' && <div className="text-[10px] text-gray-500 text-center">{rec?.clockIn} - {rec?.clockOut}</div>}
                {isSelected && (
                  <div className="mt-3 pt-2 border-t space-y-2">
                    {status === 'pending' && <Button size="sm" className="w-full gap-1 bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); clockIn(emp.id); }}><LogIn className="w-3.5 h-3.5" />出勤する</Button>}
                    {status === 'working' && <Button size="sm" variant="outline" className="w-full gap-1 border-red-200 text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); clockOut(emp.id); }}><LogOut className="w-3.5 h-3.5" />退勤する</Button>}
                    {status === 'done' && <p className="text-[10px] text-gray-400 text-center">本日の勤務完了</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displayEmployees.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">本日シフトのスタッフがいません</p>
        </div>
      )}

      <Dialog open={handoverOpen} onOpenChange={setHandoverOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-blue-500" />本日の引き継ぎ事項</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">{handoverEmp}さん、おはようございます。</p>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-3 space-y-2">
                {state.boardMessages.filter((m) => m.type === 'handover').length > 0
                  ? state.boardMessages.filter((m) => m.type === 'handover').slice(0, 5).map((m) => (
                    <div key={m.id} className="text-sm"><span className="font-medium">{m.author}:</span> {m.content}</div>
                  ))
                  : <p className="text-sm">特記事項はありません。通常業務を開始してください。</p>
                }
              </CardContent>
            </Card>
          </div>
          <Button onClick={() => setHandoverOpen(false)} className="w-full bg-violet-600 hover:bg-violet-700">確認しました</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 顔認証打刻 ─────────────────────────────────
function FaceClockView() {
  const { state, setState } = useAppState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [recognized, setRecognized] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      // Camera not available
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  }, []);

  const simulateRecognition = () => {
    setScanning(true);
    setTimeout(() => {
      // Mock: pick a random employee
      const emp = state.employees[Math.floor(Math.random() * state.employees.length)];
      if (emp) {
        setRecognized(emp.id);
        // Auto clock in or out
        const existing = state.timeRecords.find((r) => r.employeeId === emp.id && r.date === today);
        const nowTime = format(new Date(), 'HH:mm');
        if (!existing) {
          setState((s) => ({ ...s, timeRecords: [...s.timeRecords, { employeeId: emp.id, date: today, clockIn: nowTime, clockOut: null }] }));
        } else if (!existing.clockOut) {
          setState((s) => {
            const updated = s.timeRecords.map((r) =>
              r.employeeId === emp.id && r.date === today && !r.clockOut ? { ...r, clockOut: nowTime } : r
            );
            const completed = updated.find((r) => r.employeeId === emp.id && r.date === today && r.clockIn && r.clockOut);
            return { ...s, timeRecords: updated, timeRecordsArchive: completed ? [...(s.timeRecordsArchive ?? []), completed] : (s.timeRecordsArchive ?? []) };
          });
        }
      }
      setScanning(false);
      setTimeout(() => setRecognized(null), 3000);
    }, 2000);
  };

  const recognizedEmp = recognized ? state.employees.find((e) => e.id === recognized) : null;
  const recognizedRecord = recognized ? state.timeRecords.find((r) => r.employeeId === recognized && r.date === today) : null;

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 text-white overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${streaming ? '' : 'hidden'}`} />
            {!streaming && (
              <div className="text-center p-8">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-4">カメラを起動して顔認証打刻</p>
                <Button onClick={startCamera} className="bg-white text-violet-700 hover:bg-violet-50">
                  <Camera className="w-4 h-4 mr-2" />カメラを起動
                </Button>
              </div>
            )}
            {/* Scan overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-48 h-48 border-4 border-green-400 rounded-3xl animate-pulse" />
                <p className="absolute bottom-8 text-green-400 text-sm font-medium animate-pulse">認識中...</p>
              </div>
            )}
            {/* Recognition result */}
            {recognizedEmp && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-3">
                    <UserCheck className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{recognizedEmp.name}</p>
                  <p className="text-green-400 text-lg font-medium mt-1">
                    {recognizedRecord?.clockOut ? `退勤 ${recognizedRecord.clockOut}` : `出勤 ${recognizedRecord?.clockIn}`}
                  </p>
                </div>
              </div>
            )}
          </div>
          {streaming && (
            <div className="p-4 flex gap-2">
              <Button onClick={simulateRecognition} disabled={scanning} className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg">
                <Scan className="w-5 h-5 mr-2" />{scanning ? '認識中...' : '打刻する'}
              </Button>
              <Button onClick={stopCamera} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's punches */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">本日の打刻記録</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {state.timeRecords.filter((r) => r.date === today).map((r) => {
            const emp = state.employees.find((e) => e.id === r.employeeId);
            return (
              <Card key={r.employeeId}>
                <CardContent className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${r.clockOut ? 'bg-gray-300' : 'bg-green-500 animate-pulse'}`} />
                    <span className="font-medium text-sm">{emp?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">{r.clockIn}</span>
                    {r.clockOut && <><span className="text-gray-400">→</span><span className="text-red-600">{r.clockOut}</span></>}
                    {!r.clockOut && <Badge className="bg-green-50 text-green-700 text-[10px]">勤務中</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {state.timeRecords.filter((r) => r.date === today).length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center col-span-2">まだ打刻がありません</p>
          )}
        </div>
      </div>

      <Card className="bg-gray-50">
        <CardContent className="py-3">
          <p className="text-xs text-gray-500">
            <strong>顔認証について:</strong> このプロトタイプではモック認証を使用しています。実運用ではWebカメラとAI顔認識APIを連携し、事前登録した顔データとの照合を行います。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
