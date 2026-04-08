'use client';

import { format } from 'date-fns';
import type { AppState, DailySalesData } from './types';

const STORAGE_KEY = 'tebanashi-cafe-app';

function emptyDailySales(today: string): DailySalesData {
  return { date: today, entries: [], lastEntryAt: null };
}

const defaultState: AppState = {
  settings: { storeName: '', openTime: '09:00', closeTime: '22:00', onboarded: false },
  employees: [],
  taskTemplates: [],
  taskCompletions: [],
  timeRecords: [],
  shiftSlots: [],
  inventoryItems: [],
  inventoryRecords: [],
  evaluationCriteria: [
    { id: 'ev1', name: '時間厳守', maxPoints: 10 },
    { id: 'ev2', name: 'タスク完了率', maxPoints: 20 },
    { id: 'ev3', name: '接客態度', maxPoints: 15 },
    { id: 'ev4', name: 'チームワーク', maxPoints: 10 },
  ],
  boardMessages: [],
  dailySales: emptyDailySales(format(new Date(), 'yyyy-MM-dd')),
  lastOpenedDate: format(new Date(), 'yyyy-MM-dd'),
  serviceTemplates: [],
  activeServiceTasks: [],
  timeRecordsArchive: [],
  pointsArchive: [],
  shiftRequests: [],
  confirmedShifts: [],
  staffingRequirements: [
    { id: 'sr1', dayOfWeek: 0, startTime: '09:00', endTime: '15:00', minStaff: 2, position: 'ホール' },
    { id: 'sr2', dayOfWeek: 0, startTime: '15:00', endTime: '22:00', minStaff: 2, position: 'ホール' },
    { id: 'sr3', dayOfWeek: 0, startTime: '09:00', endTime: '22:00', minStaff: 1, position: 'キッチン' },
  ],
  dayTargetTemplates: [
    { dayType: 'weekday', targetRevenue: 80000, targetPoints: 100 },
    { dayType: 'weekend', targetRevenue: 120000, targetPoints: 150 },
    { dayType: 'holiday', targetRevenue: 150000, targetPoints: 180 },
  ],
  dailyGoal: null,
  storeStatus: 'normal',
  recipes: [],
  voiceLogs: [],
  skillDefinitions: [
    { id: 'sk1', name: 'パスタ調理', category: 'キッチン' },
    { id: 'sk2', name: 'サラダ仕込み', category: 'キッチン' },
    { id: 'sk3', name: 'デザート盛付', category: 'キッチン' },
    { id: 'sk4', name: 'エスプレッソ抽出', category: 'ドリンク' },
    { id: 'sk5', name: 'ラテアート', category: 'ドリンク' },
    { id: 'sk6', name: 'レジ操作', category: '接客' },
    { id: 'sk7', name: 'オーダーテイク', category: '接客' },
    { id: 'sk8', name: '開店作業', category: '運営' },
    { id: 'sk9', name: '閉店作業', category: '運営' },
    { id: 'sk10', name: '在庫発注', category: '運営' },
  ],
  skillMap: {},
  checkedHandovers: [],
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const state: AppState = { ...defaultState, ...JSON.parse(raw) };
    const today = format(new Date(), 'yyyy-MM-dd');
    if (state.lastOpenedDate !== today) {
      return performDailyReset(state, today);
    }
    return state;
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function performDailyReset(state: AppState, today: string): AppState {
  const completedRecords = state.timeRecords.filter((r) => r.clockIn && r.clockOut);
  const timeArchive = [...(state.timeRecordsArchive ?? []), ...completedRecords];

  const pointsByEmp: Record<string, number> = {};
  for (const c of state.taskCompletions) {
    if (!pointsByEmp[c.completedByEmployeeId]) pointsByEmp[c.completedByEmployeeId] = 0;
    pointsByEmp[c.completedByEmployeeId] += (c.pointsEarned ?? 0);
  }
  const newPointsArchive = Object.entries(pointsByEmp).map(([employeeId, totalPoints]) => ({
    employeeId, date: state.lastOpenedDate, totalPoints,
  }));

  return {
    ...state,
    taskCompletions: [],
    timeRecords: [],
    dailySales: emptyDailySales(today),
    lastOpenedDate: today,
    activeServiceTasks: [],
    boardMessages: state.boardMessages.filter((m) => m.type === 'handover'),
    inventoryRecords: [],
    timeRecordsArchive: timeArchive,
    pointsArchive: [...(state.pointsArchive ?? []), ...newPointsArchive],
    dailyGoal: null,
    storeStatus: 'normal' as const,
    checkedHandovers: [],
  };
}

export function manualReset(state: AppState): AppState {
  const today = format(new Date(), 'yyyy-MM-dd');
  const newState = performDailyReset(state, today);
  newState.boardMessages = [
    {
      id: `msg-${Date.now()}`,
      type: 'notice',
      author: 'システム',
      content: `開店処理が完了しました（${format(new Date(), 'HH:mm')}）`,
      createdAt: new Date().toISOString(),
    },
    ...newState.boardMessages,
  ];
  return newState;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
