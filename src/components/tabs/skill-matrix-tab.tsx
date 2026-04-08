'use client';

import { Fragment, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/lib/context';
import { generateId } from '@/lib/store';
import { Plus, Trash2, Shield } from 'lucide-react';

export default function SkillMatrixTab() {
  const { state, setState } = useAppState();
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('キッチン');

  const skills = state.skillDefinitions ?? [];
  const employees = state.employees;
  const skillMap = state.skillMap ?? {};

  // カテゴリ一覧（表示順）
  const categories = [...new Set(skills.map((s) => s.category))];

  // スキルをカテゴリ順にソート
  const sortedSkills = [...skills].sort((a, b) => {
    const ci = categories.indexOf(a.category) - categories.indexOf(b.category);
    return ci !== 0 ? ci : a.name.localeCompare(b.name);
  });

  // ◯×トグル
  const toggleSkill = (empId: string, skillId: string) => {
    setState((s) => {
      const map = { ...(s.skillMap ?? {}) };
      const empSkills = { ...(map[empId] ?? {}) };
      empSkills[skillId] = !empSkills[skillId];
      map[empId] = empSkills;
      return { ...s, skillMap: map };
    });
  };

  // スキル追加
  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setState((s) => ({
      ...s,
      skillDefinitions: [
        ...(s.skillDefinitions ?? []),
        { id: generateId(), name: newSkillName.trim(), category: newSkillCategory },
      ],
    }));
    setNewSkillName('');
  };

  // スキル削除
  const removeSkill = (skillId: string) => {
    setState((s) => ({
      ...s,
      skillDefinitions: (s.skillDefinitions ?? []).filter((sk) => sk.id !== skillId),
    }));
  };

  // 従業員の合計スキル数
  const getEmpTotal = (empId: string) => {
    const empSkills = skillMap[empId] ?? {};
    return sortedSkills.filter((sk) => empSkills[sk.id]).length;
  };

  // スキルの習得者数
  const getSkillTotal = (skillId: string) => {
    return employees.filter((emp) => (skillMap[emp.id] ?? {})[skillId]).length;
  };

  // カテゴリ色
  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'キッチン': 'bg-orange-100 text-orange-700',
      'ドリンク': 'bg-blue-100 text-blue-700',
      '接客': 'bg-green-100 text-green-700',
      '運営': 'bg-purple-100 text-purple-700',
      '清掃': 'bg-gray-100 text-gray-700',
    };
    return colors[cat] ?? 'bg-gray-100 text-gray-700';
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">設定タブから従業員を登録してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* スキル追加 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">スキル項目を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="border rounded-md px-2 text-sm h-9 shrink-0"
            >
              {['キッチン', 'ドリンク', '接客', '運営', '清掃'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="例: パスタ調理"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            />
            <Button onClick={addSkill} disabled={!newSkillName.trim()} className="bg-violet-600 hover:bg-violet-700 shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* マトリクス表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Shield className="w-4 h-4" />戦力表
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* 人名ヘッダー行 */}
                <tr className="border-b bg-gray-50">
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-xs text-gray-500 font-medium min-w-28">スキル</th>
                  {employees.map((emp) => (
                    <th key={emp.id} className="px-1 py-2 text-center min-w-14">
                      <span className="text-xs font-medium">{emp.name}</span>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-medium bg-yellow-50 min-w-14">習得者数</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const catSkills = sortedSkills.filter((s) => s.category === cat);
                  return (
                    <Fragment key={cat}>
                      {/* カテゴリ見出し行 */}
                      <tr className="border-t">
                        <td colSpan={employees.length + 2} className="sticky left-0 z-10 bg-white px-3 py-1.5">
                          <Badge className={`text-[10px] ${categoryColor(cat)}`}>{cat}</Badge>
                        </td>
                      </tr>
                      {/* スキル行 */}
                      {catSkills.map((sk, si) => {
                        const count = getSkillTotal(sk.id);
                        const ratio = employees.length > 0 ? count / employees.length : 0;
                        return (
                          <tr key={sk.id} className={`border-b ${si % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                            <td className={`sticky left-0 z-10 px-3 py-2 text-xs whitespace-nowrap ${si % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{sk.name}</span>
                                <button
                                  onClick={() => removeSkill(sk.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors"
                                  title="削除"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            {employees.map((emp) => {
                              const has = (skillMap[emp.id] ?? {})[sk.id] ?? false;
                              return (
                                <td key={emp.id} className="px-1 py-1.5 text-center">
                                  <button
                                    onClick={() => toggleSkill(emp.id, sk.id)}
                                    className={`w-8 h-8 rounded-md text-sm font-bold transition-all ${
                                      has
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-500'
                                    }`}
                                  >
                                    {has ? '◯' : '×'}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="px-2 py-1.5 text-center bg-yellow-50/50">
                              <span className={`text-xs font-bold ${
                                ratio === 0 ? 'text-red-500' : ratio < 0.5 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {count}/{employees.length}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
                {/* 合計フッター行 */}
                <tr className="border-t-2 bg-gray-50 font-medium">
                  <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-xs text-gray-500">合計</td>
                  {employees.map((emp) => {
                    const total = getEmpTotal(emp.id);
                    const pct = sortedSkills.length > 0 ? Math.round((total / sortedSkills.length) * 100) : 0;
                    return (
                      <td key={emp.id} className="px-1 py-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-sm">{total}</span>
                          <span className="text-[10px] text-gray-400">{pct}%</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center bg-yellow-50">
                    <span className="text-xs font-bold text-gray-600">
                      {sortedSkills.length}項目
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {categories.map((cat) => {
          const catSkills = sortedSkills.filter((s) => s.category === cat);
          const totalPossible = catSkills.length * employees.length;
          const totalAcquired = catSkills.reduce((sum, sk) =>
            sum + employees.filter((emp) => (skillMap[emp.id] ?? {})[sk.id]).length, 0);
          const pct = totalPossible > 0 ? Math.round((totalAcquired / totalPossible) * 100) : 0;
          return (
            <Card key={cat}>
              <CardContent className="py-3 text-center">
                <Badge className={`text-[10px] mb-1 ${categoryColor(cat)}`}>{cat}</Badge>
                <p className="text-lg font-bold">{pct}<span className="text-xs text-gray-400">%</span></p>
                <p className="text-[10px] text-gray-400">{totalAcquired}/{totalPossible}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
