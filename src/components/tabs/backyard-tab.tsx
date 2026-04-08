'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/lib/context';
import { format } from 'date-fns';
import {
  Star, MessageCircle,
  Plus, Send, Mic,
} from 'lucide-react';

type Section = 'evaluation' | 'board';

export default function BackyardTab() {
  const [section, setSection] = useState<Section>('evaluation');

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'evaluation', label: '評価', icon: <Star className="w-4 h-4" /> },
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

      {section === 'evaluation' && <EvaluationView />}
      {section === 'board' && <BoardView />}
    </div>
  );
}

function EvaluationView() {
  const { state } = useAppState();
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {state.employees
        .map((emp) => {
          const todayCompletions = state.taskCompletions.filter((c) => c.completedByEmployeeId === emp.id);
          const todayPoints = todayCompletions.reduce((s, c) => s + (c.pointsEarned ?? 0), 0);
          const todayCount = todayCompletions.length;
          const archivedPoints = (state.pointsArchive ?? [])
            .filter((p) => p.employeeId === emp.id)
            .reduce((s, p) => s + p.totalPoints, 0);
          const totalAllTimePoints = archivedPoints + todayPoints;
          const timeRec = state.timeRecords.find(
            (r) => r.employeeId === emp.id && r.date === format(new Date(), 'yyyy-MM-dd')
          );
          return { emp, todayPoints, todayCount, totalAllTimePoints, todayCompletions, timeRec };
        })
        .sort((a, b) => b.totalAllTimePoints - a.totalAllTimePoints)
        .map(({ emp, todayPoints, todayCount, totalAllTimePoints, todayCompletions, timeRec }, rank) => (
          <Card key={emp.id} className="cursor-pointer rounded-2xl border-0 shadow-sm" onClick={() => setSelectedEmp(selectedEmp === emp.id ? null : emp.id)}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    rank === 0 ? 'bg-amber-400' : rank === 1 ? 'bg-gray-400' : rank === 2 ? 'bg-orange-300' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {rank < 3 ? `${rank + 1}` : emp.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{emp.name}</span>
                      <Badge variant="outline" className="text-[10px] rounded-full">
                        {emp.role === 'manager' ? '社員' : emp.role === 'staff' ? 'スタッフ' : 'アルバイト'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      本日: {todayCount}件 / +{todayPoints}pt
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="font-bold">{totalAllTimePoints}<span className="text-xs text-gray-400">pt</span></span>
                  </div>
                  <p className="text-[10px] text-gray-400">累計</p>
                </div>
              </div>

              {selectedEmp === emp.id && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-amber-50 rounded-xl p-2">
                      <p className="text-lg font-bold text-amber-600">{todayPoints}</p>
                      <p className="text-[10px] text-amber-500">今日のポイント</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-lg font-bold">{totalAllTimePoints}</p>
                      <p className="text-[10px] text-gray-400">累計ポイント</p>
                    </div>
                  </div>
                  {todayCompletions.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">今日の完了タスク</p>
                      {todayCompletions.map((c, i) => {
                        const task = state.taskTemplates.find((t) => t.id === c.taskId);
                        return (
                          <div key={i} className="flex items-center justify-between text-sm py-0.5">
                            <span className="text-gray-600">{task?.title ?? '不明'}</span>
                            <Badge className="bg-amber-50 text-amber-600 text-[10px] rounded-full">+{c.pointsEarned}pt</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {timeRec && (
                    <div className="text-xs text-gray-400">
                      出勤: {timeRec.clockIn ?? '-'} / 退勤: {timeRec.clockOut ?? '勤務中'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      {state.employees.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">従業員が登録されていません</div>
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

