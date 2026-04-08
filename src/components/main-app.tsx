'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/context';
import Onboarding from './onboarding';
import BottomNav, { type TabId } from './bottom-nav';
import DashboardTab from './tabs/dashboard-tab';
import TasksTab from './tabs/tasks-tab';
import ShiftTab from './tabs/shift-tab';
import BackyardTab from './tabs/backyard-tab';
import RecipeTab from './tabs/recipe-tab';
import SkillMatrixTab from './tabs/skill-matrix-tab';
import VoiceTab from './tabs/voice-tab';
import SettingsTab from './tabs/settings-tab';
import { Coffee } from 'lucide-react';

export default function MainApp() {
  const { state } = useAppState();
  const [tab, setTab] = useState<TabId>('dashboard');

  if (!state.settings.onboarded) {
    return <Onboarding />;
  }

  const tabTitles: Record<TabId, string> = {
    dashboard: '現場監督',
    tasks: 'タスク・マニュアル',
    shift: 'シフト・打刻',
    recipes: 'レシピ',
    skillmatrix: '戦力表',
    voice: '音声ログ',
    backyard: '買い出しリスト',
    settings: 'マスター設定',
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#ff6b6b] flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm md:text-base">{tabTitles[tab]}</span>
              <span className="hidden md:inline text-xs text-gray-400 ml-3">{state.settings.storeName}</span>
            </div>
          </div>
          <span className="text-[10px] md:text-xs text-[#ff6b6b] font-bold tracking-wide">手離し経営</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-5 pb-28">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'tasks' && <TasksTab />}
        {tab === 'shift' && <ShiftTab />}
        {tab === 'recipes' && <RecipeTab />}
        {tab === 'skillmatrix' && <SkillMatrixTab />}
        {tab === 'voice' && <VoiceTab />}
        {tab === 'backyard' && <BackyardTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
