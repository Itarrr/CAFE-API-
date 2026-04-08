export interface StoreSettings {
  storeName: string;
  openTime: string;
  closeTime: string;
  onboarded: boolean;
}

// 曜日タイプ別の目標設定テンプレート
export interface DayTargetTemplate {
  dayType: 'weekday' | 'weekend' | 'holiday';
  targetRevenue: number;
  targetPoints: number;     // 店舗全体の目標生産性ポイント
}

// 当日の目標（開店時に確定）
export interface DailyGoal {
  date: string;
  dayType: 'weekday' | 'weekend' | 'holiday';
  targetRevenue: number;
  targetPoints: number;
  isOpen: boolean;          // 開店処理済みか
  openedAt: string | null;
  staffGoals: StaffDailyGoal[];
}

export interface StaffDailyGoal {
  employeeId: string;
  targetPoints: number;     // その人の目標ポイント
}

// アイドルタイム状態
export type StoreStatus = 'busy' | 'normal' | 'idle';

export interface Employee {
  id: string;
  name: string;
  role: 'manager' | 'staff' | 'part-time';
  hourlyWage: number;
  joinedDate: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  category: string;          // "清掃", "整理整頓", "仕込み" etc.
  description: string;
  videoUrl: string;
  points: number;            // 獲得ポイント
  repeatable: boolean;       // 同日に何度でもできるか
  estimateMinutes: number;   // 目安所要時間（分）
}

export interface TaskCompletion {
  taskId: string;            // テンプレートID or 'adhoc-xxx'
  taskTitle: string;         // 表示用タイトル
  completedBy: string;
  completedByEmployeeId: string;
  completedAt: string;
  comment: string;
  photoPlaceholder: boolean;
  pointsEarned: number;
  isAdhoc: boolean;          // スタッフ自主追加タスクか
}

export interface PointsArchive {
  employeeId: string;
  date: string;
  totalPoints: number;
}

export interface TimeRecord {
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
}

export interface ShiftSlot {
  id: string;
  dayOfWeek: number; // 0=Mon ... 6=Sun
  startTime: string;
  endTime: string;
  employeeId: string;
}

// スタッフのシフト希望
export interface ShiftRequest {
  id: string;
  employeeId: string;
  date: string;           // "2026-04-07"
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  submittedAt: string;
}

// 確定シフト（日付ベース）
export interface ConfirmedShift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;       // "ホール", "キッチン" etc.
  confirmedAt: string;
}

// 店舗の必要人員テンプレート
export interface StaffingRequirement {
  id: string;
  dayOfWeek: number;      // 0-6
  startTime: string;
  endTime: string;
  minStaff: number;
  position: string;
}

export type TimeRecordMethod = 'manual' | 'face';

export interface TimeRecordV2 {
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  method: TimeRecordMethod;
}

export type InventoryItemType = 'food' | 'supply';

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  itemType: InventoryItemType; // 食材 or 備品
  costPerUnit: number;
}

export interface InventoryRecord {
  itemId: string;
  date: string;
  type: 'purchase' | 'stocktake';
  quantity: number;
  note: string;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  maxPoints: number;
}

export interface BoardMessage {
  id: string;
  type: 'report' | 'notice' | 'handover';
  author: string;
  content: string;
  createdAt: string;
}

// レシピ（キッチンマニュアル）
export interface RecipeStep {
  order: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  name: string;         // メニュー名
  category: string;     // "ドリンク", "フード", "デザート" etc.
  imageEmoji: string;   // 表示用絵文字
  ingredients: string;  // 材料（改行区切りテキスト）
  steps: RecipeStep[];
  notes: string;        // ポイント・注意事項
  prepTimeMinutes: number;
}

// 旧互換（残す）
export interface ServiceTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  requireSeatNumber: boolean;
  tasks: { id: string; title: string; description: string; perPerson: boolean; videoUrl: string }[];
}

export interface ActiveServiceTask {
  id: string;
  serviceTemplateId: string;
  serviceTaskItemId: string;
  title: string;
  description: string;
  videoUrl: string;
  quantity: number;
  seatNumber: string;
  triggeredAt: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  comment: string;
}

export interface SalesEntry {
  id: string;
  time: string;           // "11:00"
  revenue: number;
  customerCount: number;
  note: string;
}

export interface DailySalesData {
  date: string;
  entries: SalesEntry[];
  lastEntryAt: string | null;  // 最後に入力した時刻
}

// 在庫パース結果
export interface ParsedInventoryItem {
  item: string;       // 品目名 "トマト"
  quantity: number;   // 数量 1
  unit: string;       // 単位 "個"
  action: 'consume' | 'restock'; // 消費 or 入荷
  raw: string;        // 元の文 "トマト1つ消費"
}

export interface VoiceLogClassified {
  urgent: string[];
  inventory: string[];
  inventoryParsed: ParsedInventoryItem[];
  handover: string[];
}

export interface VoiceLogEntry {
  id: string;
  date: string;
  rawText: string;
  classified: VoiceLogClassified;
  createdAt: string;
}

// スキルマトリクス（戦力表）
export interface SkillDefinition {
  id: string;
  name: string;          // "パスタ調理", "ラテアート" etc.
  category: string;      // "キッチン", "ドリンク", "接客", "清掃" etc.
}

// 従業員ID → スキルID → 習得済みか
export type SkillMap = Record<string, Record<string, boolean>>;

export interface AppState {
  settings: StoreSettings;
  employees: Employee[];
  taskTemplates: TaskTemplate[];
  taskCompletions: TaskCompletion[];
  timeRecords: TimeRecord[];
  shiftSlots: ShiftSlot[];
  inventoryItems: InventoryItem[];
  inventoryRecords: InventoryRecord[];
  evaluationCriteria: EvaluationCriteria[];
  boardMessages: BoardMessage[];
  dailySales: DailySalesData;
  lastOpenedDate: string;
  serviceTemplates: ServiceTemplate[];
  activeServiceTasks: ActiveServiceTask[];
  timeRecordsArchive: TimeRecord[];
  pointsArchive: PointsArchive[];
  shiftRequests: ShiftRequest[];
  confirmedShifts: ConfirmedShift[];
  staffingRequirements: StaffingRequirement[];
  dayTargetTemplates: DayTargetTemplate[];
  dailyGoal: DailyGoal | null;
  storeStatus: StoreStatus;
  recipes: Recipe[];
  voiceLogs: VoiceLogEntry[];
  skillDefinitions: SkillDefinition[];
  skillMap: SkillMap;
  checkedHandovers: string[];  // チェック済み引き継ぎ項目のID（"logId-index"形式）
}
