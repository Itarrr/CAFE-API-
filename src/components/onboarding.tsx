'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import type { Employee } from '@/lib/types';
import { Store, Clock, Users, Plus, X, ChevronRight, Coffee } from 'lucide-react';

export default function Onboarding() {
  const { setState } = useAppState();
  const [step, setStep] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [employees, setEmployees] = useState<Omit<Employee, 'id'>[]>([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Employee['role']>('staff');
  const [newWage, setNewWage] = useState('1100');

  const addEmployee = () => {
    if (!newName.trim()) return;
    setEmployees([
      ...employees,
      { name: newName, role: newRole, hourlyWage: Number(newWage), joinedDate: new Date().toISOString().split('T')[0] },
    ]);
    setNewName('');
    setNewWage('1100');
  };

  const finish = () => {
    setState((prev) => ({
      ...prev,
      settings: { storeName, openTime, closeTime, onboarded: true },
      employees: employees.map((e) => ({ ...e, id: generateId() })),
      taskTemplates: [
        { id: generateId(), title: 'テーブル拭き・セッティング', category: '清掃', description: '全テーブルの拭き上げとセット直し', videoUrl: '', points: 10, repeatable: true, estimateMinutes: 5 },
        { id: generateId(), title: 'フロア清掃（モップがけ）', category: '清掃', description: 'フロア全体のモップがけ・掃き掃除', videoUrl: '', points: 15, repeatable: true, estimateMinutes: 10 },
        { id: generateId(), title: 'トイレ清掃', category: '清掃', description: 'トイレの清掃・消耗品の補充・鏡磨き', videoUrl: '', points: 20, repeatable: true, estimateMinutes: 15 },
        { id: generateId(), title: 'グラス・カップ磨き', category: '整理整頓', description: 'グラスやカップの磨き上げ・棚の整理', videoUrl: '', points: 10, repeatable: true, estimateMinutes: 10 },
        { id: generateId(), title: '在庫チェック・補充', category: '在庫管理', description: '消耗品・食材の在庫確認と棚への補充', videoUrl: '', points: 15, repeatable: false, estimateMinutes: 10 },
        { id: generateId(), title: 'バックヤード整理', category: '整理整頓', description: 'バックヤードの整理・動線確保・在庫の並べ直し', videoUrl: '', points: 20, repeatable: false, estimateMinutes: 15 },
        { id: generateId(), title: '食材仕込み', category: '仕込み', description: '翌日分の食材カット・下準備', videoUrl: '', points: 30, repeatable: false, estimateMinutes: 20 },
        { id: generateId(), title: '外回り清掃', category: '清掃', description: '入口・看板周辺の清掃・ゴミ拾い', videoUrl: '', points: 15, repeatable: false, estimateMinutes: 10 },
        { id: generateId(), title: 'POP・メニュー整備', category: 'その他', description: 'メニューやPOPの清掃・差し替え・整頓', videoUrl: '', points: 10, repeatable: false, estimateMinutes: 10 },
        { id: generateId(), title: '冷蔵庫清掃・整理', category: '清掃', description: '冷蔵庫内の清掃・賞味期限チェック・整理', videoUrl: '', points: 25, repeatable: false, estimateMinutes: 20 },
      ],
      inventoryItems: [
        { id: generateId(), name: 'コーヒー豆', unit: 'kg', category: '飲料', itemType: 'food' as const, costPerUnit: 2500 },
        { id: generateId(), name: '牛乳', unit: 'L', category: '乳製品', itemType: 'food' as const, costPerUnit: 250 },
        { id: generateId(), name: '砂糖', unit: 'kg', category: '調味料', itemType: 'food' as const, costPerUnit: 300 },
        { id: generateId(), name: 'パン', unit: '個', category: '食材', itemType: 'food' as const, costPerUnit: 150 },
      ],
    }));
  };

  const steps = [
    {
      icon: <Store className="w-7 h-7" />,
      title: '店舗情報',
      content: (
        <div className="space-y-4">
          <div>
            <Label>店舗名</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="例: CAFE TEBANASHI" className="mt-1" />
          </div>
        </div>
      ),
      valid: storeName.trim().length > 0,
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: '営業時間',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>開店時間</Label>
            <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>閉店時間</Label>
            <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="mt-1" />
          </div>
        </div>
      ),
      valid: true,
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: '従業員登録',
      content: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="名前" className="flex-1" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as Employee['role'])} className="border rounded-xl px-2 text-sm bg-white">
              <option value="manager">社員</option>
              <option value="staff">スタッフ</option>
              <option value="part-time">アルバイト</option>
            </select>
            <Input type="number" value={newWage} onChange={(e) => setNewWage(e.target.value)} className="w-24" placeholder="時給" />
            <Button size="icon" variant="outline" onClick={addEmployee}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {employees.map((e, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-2.5 px-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{e.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {e.role === 'manager' ? '社員' : e.role === 'staff' ? 'スタッフ' : 'アルバイト'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">&yen;{e.hourlyWage}/h</span>
                  <button onClick={() => setEmployees(employees.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {employees.length === 0 && <p className="text-sm text-gray-400 text-center py-4">従業員を追加してください</p>}
        </div>
      ),
      valid: employees.length > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg border-0 rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-[#ff6b6b] rounded-3xl flex items-center justify-center">
              <Coffee className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl">手離し経営セットアップ</CardTitle>
          <p className="text-sm text-gray-400 mt-1">初期設定を完了して、現場の自走を始めましょう</p>
          <div className="flex gap-1.5 justify-center mt-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-[#ff6b6b]' : i < step ? 'w-4 bg-[#ffb3b3]' : 'w-4 bg-gray-200'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#fff0f0] flex items-center justify-center text-[#ff6b6b]">
              {steps[step].icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Step {step + 1} / {steps.length}</p>
              <h3 className="font-bold text-lg">{steps[step].title}</h3>
            </div>
          </div>
          {steps[step].content}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 rounded-xl">戻る</Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!steps[step].valid} className="flex-1 bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl">
                次へ <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={!steps[step].valid} className="flex-1 bg-[#ff6b6b] hover:bg-[#e05555] rounded-xl">
                セットアップ完了
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
