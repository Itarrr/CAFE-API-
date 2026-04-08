'use client';

import { LayoutDashboard, ClipboardCheck, CalendarClock, ShoppingCart, Shield, ChefHat, Settings, Mic } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: '現場監督', icon: LayoutDashboard },
  { id: 'tasks', label: 'タスク', icon: ClipboardCheck },
  { id: 'shift', label: 'シフト', icon: CalendarClock },
  { id: 'recipes', label: 'レシピ', icon: ChefHat },
  { id: 'skillmatrix', label: '戦力表', icon: Shield },
  { id: 'voice', label: '音声ログ', icon: Mic },
  { id: 'backyard', label: '買い出し', icon: ShoppingCart },
  { id: 'settings', label: '設定', icon: Settings },
] as const;

export type TabId = (typeof tabs)[number]['id'];

export default function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white">
      <div className="max-w-[1200px] mx-auto flex px-1 md:px-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 pt-2.5 transition-colors ${isActive ? 'text-[#ff6b6b]' : 'text-gray-400'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] md:text-xs font-medium ${isActive ? 'font-bold' : ''}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
