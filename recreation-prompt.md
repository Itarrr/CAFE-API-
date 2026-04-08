# 手離し経営カフェ管理アプリ - 完全再現プロンプト

以下の指示に従い、カフェ店舗管理アプリ「手離し経営」をゼロから完全に再現してください。

---

## ステップ1: プロジェクト初期化

### 1-1. Next.js プロジェクト作成

```bash
npx create-next-app@16.2.2 cafe-app --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd cafe-app
```

### 1-2. パスエイリアス設定

`tsconfig.json` の `compilerOptions.paths` を以下に設定:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

### 1-3. 依存パッケージインストール

```bash
npm install date-fns recharts lucide-react class-variance-authority clsx tailwind-merge tw-animate-css @base-ui/react
npm install shadcn@^4.1.2
```

### 1-4. shadcn/ui 初期化 (base-nova スタイル)

`components.json` を以下の内容で作成:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

### 1-5. shadcn UIコンポーネントのインストール

以下の全コンポーネントをインストール:

```bash
npx shadcn@latest add card button badge input textarea label checkbox select separator avatar scroll-area alert switch dialog tooltip sheet tabs progress
```

### 1-6. next.config.ts

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

---

## ステップ2: グローバルCSS (globals.css)

`src/app/globals.css` を以下の内容で**完全に置き換え**:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans), "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: #f8f8f8;
  --foreground: #1a1a1a;
  --card: #ffffff;
  --card-foreground: #1a1a1a;
  --popover: #ffffff;
  --popover-foreground: #1a1a1a;
  --primary: #ff6b6b;
  --primary-foreground: #ffffff;
  --secondary: #fff0f0;
  --secondary-foreground: #e05555;
  --muted: #f3f3f3;
  --muted-foreground: #888888;
  --accent: #fff4e6;
  --accent-foreground: #c47a20;
  --destructive: #ef4444;
  --border: #eeeeee;
  --input: #f0f0f0;
  --ring: #ff6b6b;
  --chart-1: #ff6b6b;
  --chart-2: #ffa94d;
  --chart-3: #69db7c;
  --chart-4: #74c0fc;
  --chart-5: #b197fc;
  --radius: 1rem;
  --sidebar: #ffffff;
  --sidebar-foreground: #1a1a1a;
  --sidebar-primary: #ff6b6b;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #fff0f0;
  --sidebar-accent-foreground: #1a1a1a;
  --sidebar-border: #eeeeee;
  --sidebar-ring: #ff6b6b;
}

.dark {
  --background: #111111;
  --foreground: #f8f8f8;
  --card: #1a1a1a;
  --card-foreground: #f8f8f8;
  --popover: #1a1a1a;
  --popover-foreground: #f8f8f8;
  --primary: #ff6b6b;
  --primary-foreground: #ffffff;
  --secondary: #2a1a1a;
  --secondary-foreground: #ff9a9a;
  --muted: #222222;
  --muted-foreground: #999999;
  --accent: #2a2010;
  --accent-foreground: #ffa94d;
  --destructive: #ef4444;
  --border: rgba(255,255,255,0.1);
  --input: rgba(255,255,255,0.1);
  --ring: #ff6b6b;
  --chart-1: #ff6b6b;
  --chart-2: #ffa94d;
  --chart-3: #69db7c;
  --chart-4: #74c0fc;
  --chart-5: #b197fc;
  --sidebar: #1a1a1a;
  --sidebar-foreground: #f8f8f8;
  --sidebar-primary: #ff6b6b;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #2a1a1a;
  --sidebar-accent-foreground: #f8f8f8;
  --sidebar-border: rgba(255,255,255,0.1);
  --sidebar-ring: #ff6b6b;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

**重要なデザインルール:**
- プライマリカラー: `#ff6b6b`（コーラルピンク）
- ホバー: `#e05555`
- 背景: `#f8f8f8`
- カード: `rounded-2xl border-0 shadow-sm`
- ボタン: `rounded-xl`
- グラデーションは**一切使用禁止**（一部タスクタブのポイントサマリーカードのみ例外で `bg-gradient-to-r from-violet-700 to-fuchsia-600` を使用）
- フォント: Geist + 日本語フォールバック（Hiragino, Meiryo）
- 全体のスタイル: ポップ、可愛い、シンプル

---

## ステップ3: 型定義 (types.ts)

`src/lib/types.ts` を以下の内容で作成。**全てのインターフェースが必須**:

```typescript
export interface StoreSettings {
  storeName: string;
  openTime: string;
  closeTime: string;
  onboarded: boolean;
}

export interface DayTargetTemplate {
  dayType: 'weekday' | 'weekend' | 'holiday';
  targetRevenue: number;
  targetPoints: number;
}

export interface DailyGoal {
  date: string;
  dayType: 'weekday' | 'weekend' | 'holiday';
  targetRevenue: number;
  targetPoints: number;
  isOpen: boolean;
  openedAt: string | null;
  staffGoals: StaffDailyGoal[];
}

export interface StaffDailyGoal {
  employeeId: string;
  targetPoints: number;
}

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
  category: string;
  description: string;
  videoUrl: string;
  points: number;
  repeatable: boolean;
  estimateMinutes: number;
}

export interface TaskCompletion {
  taskId: string;
  taskTitle: string;
  completedBy: string;
  completedByEmployeeId: string;
  completedAt: string;
  comment: string;
  photoPlaceholder: boolean;
  pointsEarned: number;
  isAdhoc: boolean;
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
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  employeeId: string;
}

export interface ShiftRequest {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  submittedAt: string;
}

export interface ConfirmedShift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  confirmedAt: string;
}

export interface StaffingRequirement {
  id: string;
  dayOfWeek: number;
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
  itemType: InventoryItemType;
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

export interface RecipeStep {
  order: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  imageEmoji: string;
  ingredients: string;
  steps: RecipeStep[];
  notes: string;
  prepTimeMinutes: number;
}

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
  time: string;
  revenue: number;
  customerCount: number;
  note: string;
}

export interface DailySalesData {
  date: string;
  entries: SalesEntry[];
  lastEntryAt: string | null;
}

export interface ParsedInventoryItem {
  item: string;
  quantity: number;
  unit: string;
  action: 'consume' | 'restock';
  raw: string;
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

export interface SkillDefinition {
  id: string;
  name: string;
  category: string;
}

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
  checkedHandovers: string[];
}
```

---

## ステップ4: ストア・永続化 (store.ts)

`src/lib/store.ts` を作成。以下のロジックを**正確に**実装:

### localStorageキー
```
tebanashi-cafe-app
```

### defaultState（初期値）
- `evaluationCriteria`: 4つのデフォルト項目（時間厳守10pt, タスク完了率20pt, 接客態度15pt, チームワーク10pt）
- `staffingRequirements`: 3つのデフォルト（月曜ホール午前2名、午後2名、キッチン終日1名）
- `dayTargetTemplates`: 3タイプ（平日: 売上80000/ポイント100、土日: 120000/150、祝日: 150000/180）
- `skillDefinitions`: 10個のデフォルトスキル（パスタ調理, サラダ仕込み, デザート盛付, エスプレッソ抽出, ラテアート, レジ操作, オーダーテイク, 開店作業, 閉店作業, 在庫発注 - カテゴリはキッチン/ドリンク/接客/運営）
- その他は空配列、`dailyGoal: null`, `storeStatus: 'normal'`

### loadState()
1. `localStorage` からJSONを読み込み、`defaultState` とマージ
2. **マイグレーション**: `inventoryItems` の各アイテムに `itemType` がなければ `'food'` をデフォルト設定
3. **日付チェック**: `lastOpenedDate` が今日と異なれば `performDailyReset()` を実行

### performDailyReset(state, today)
日次リセット処理:
- 完了済み `timeRecords`（clockIn && clockOut あり）を `timeRecordsArchive` に移動
- 各従業員の当日ポイント合計を `pointsArchive` に記録
- リセットされるもの: `taskCompletions`, `timeRecords`, `dailySales`, `activeServiceTasks`, `inventoryRecords`, `checkedHandovers`
- `boardMessages`: `type === 'handover'` のみ残す
- `dailyGoal: null`, `storeStatus: 'normal'`

### manualReset(state)
- `performDailyReset()` を呼び、さらにシステムメッセージ「開店処理が完了しました（HH:mm）」を `boardMessages` の先頭に追加

### generateId()
```typescript
Math.random().toString(36).slice(2, 10)
```

---

## ステップ5: Context (context.tsx)

`src/lib/context.tsx` を作成:

- `AppProvider`: `loadState()` で初期化、`useEffect` でクライアントサイド読み込み
- `setState`: `updater` 関数を受け取り、新しいstateを `saveState()` で自動保存
- ローディング中は「読み込み中...」を表示
- `useAppState()` フック: Context から `{ state, setState, loaded }` を取得

---

## ステップ6: ユーティリティ (utils.ts)

`src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## ステップ7: レイアウト (layout.tsx)

`src/app/layout.tsx`:
- Geist と Geist_Mono フォントをGoogle Fontsから読み込み
- `lang="ja"`, `antialiased`
- メタデータ: title=「手離し経営 - 現場監督アプリ」, description=「社内カフェ向け現場監督・店舗管理アプリ」

---

## ステップ8: ページ (page.tsx)

`src/app/page.tsx`:
- `'use client'` ディレクティブ
- `AppProvider` でラップした `MainApp` コンポーネントを表示

---

## ステップ9: メインアプリ構造 (main-app.tsx)

`src/components/main-app.tsx`:

1. `state.settings.onboarded` が `false` なら `Onboarding` コンポーネントを表示
2. オンボーディング済みの場合:
   - **ヘッダー**: sticky, 白背景, `Coffee` アイコン（`#ff6b6b` 背景の `rounded-2xl` ボックス内）, タブタイトル, 店舗名, 「手離し経営」ブランドテキスト
   - **メインコンテンツ**: `max-w-[1200px]`, `pb-28`（ボトムナビ分の余白）
   - **ボトムナビ**: 固定位置
3. タブ状態管理: `useState<TabId>('dashboard')`

---

## ステップ10: ボトムナビゲーション (bottom-nav.tsx)

`src/components/bottom-nav.tsx`:

8タブの定義:
| id | label | icon |
|---|---|---|
| dashboard | 現場監督 | LayoutDashboard |
| tasks | タスク | ClipboardCheck |
| shift | シフト | CalendarClock |
| recipes | レシピ | ChefHat |
| skillmatrix | 戦力表 | Shield |
| voice | 音声ログ | Mic |
| backyard | 評価 | BarChart3 |
| settings | 設定 | Settings |

- `TabId` 型を `export`
- 固定ボトム, 白背景, `border-t border-gray-100`
- アクティブタブ: `text-[#ff6b6b]`, `stroke-[2.5]`, `font-bold`
- 非アクティブ: `text-gray-400`
- アイコンサイズ: `w-5 h-5`
- ラベル: `text-[10px] md:text-xs`

---

## ステップ11: オンボーディング (onboarding.tsx)

`src/components/onboarding.tsx`:

3ステップのウィザード:
1. **店舗情報**: 店舗名入力
2. **営業時間**: 開店・閉店時間
3. **従業員登録**: 名前、役職（社員/スタッフ/アルバイト）、時給を入力して追加

完了時に以下をセット:
- `settings.onboarded = true`
- 10個のデフォルトタスクテンプレートを生成（テーブル拭き10pt, フロア清掃15pt, トイレ清掃20pt, グラス磨き10pt, 在庫チェック15pt, バックヤード整理20pt, 食材仕込み30pt, 外回り清掃15pt, POP整備10pt, 冷蔵庫清掃25pt）
- 4つのデフォルト在庫品目（コーヒー豆, 牛乳, 砂糖, パン - すべて `itemType: 'food'`）

UIスタイル:
- プログレスバー: ドット型（アクティブ=幅8, `#ff6b6b`; 完了=幅4, `#ffb3b3`; 未=幅4, `bg-gray-200`）
- ステップアイコン: `#fff0f0` 背景の `rounded-2xl` ボックス

---

## ステップ12: ダッシュボードタブ (dashboard-tab.tsx)

`src/components/tabs/dashboard-tab.tsx`:

### 開店前 (OpeningFlow)
- `dailyGoal` が null または `isOpen === false` のとき表示
- 曜日タイプ選択（平日/土日/祝日）→ テンプレートから目標値を自動セット
- 目標売上・目標ポイントの入力
- スタッフ別目標のプレビュー（均等配分）
- 前日の引き継ぎ事項（voiceLogs から前日の handover を表示）
- 「開店する」ボタン → `manualReset()` + `dailyGoal` 設定 + `storeStatus: 'normal'`

### 開店後のダッシュボード
表示順:
1. **ヘッダー**: 店舗名、日付（date-fns `ja` ロケール）、曜日タイプバッジ
2. **店舗ステータストグル**: idle/normal/busy の3ボタン切り替え
   - idle: 「アイドルタイム！タスクタブでポイントを稼ぎましょう」メッセージ表示
3. **引き継ぎタスクチェックリスト**: voiceLogs の handover 項目をチェックボックス付きで表示（`checkedHandovers` で管理）
4. **売上入力リマインダー**: 前回入力から2時間経過、または本日未入力時に警告カード
5. **売上入力ボタン**: 入力回数と最終入力時刻を表示
6. **目標進捗**: 売上目標とポイント目標の `Progress` バー
7. **スタッフ別ポイント進捗**: 各スタッフの目標達成状況（達成=アンバー色）
8. **KPIカード** (2x2 or 4列): 売上、FL比率（55%以下=緑, 55-65%=アンバー, 65%超=赤）、出勤中人数、本日ポイント
9. **アイドルタイムおすすめタスク**: status=idle のとき、ポイント降順で上位4タスクを表示
10. **本日コスト**: 人件費（リアルタイム計算）、食材原価（売上x30%推定）
11. **売上入力履歴**: エントリー一覧
12. **売上入力ダイアログ**: 金額、客数、メモ

### FL比率計算
- 食材原価 = 売上 x 0.3
- 人件費 = 各スタッフの (勤務時間 x 時給) の合計
- FL比率 = (食材原価 + 人件費) / 売上 x 100

---

## ステップ13: タスクタブ (tasks-tab.tsx)

`src/components/tabs/tasks-tab.tsx`:

ポイントベースのタスクシステム:

1. **ステータスバナー**: idle時=ブルーグラデカード、busy時=グレーカード
2. **自主タスク追加ボタン**
3. **スタッフ別ミニ目標**: グリッド表示、Progress バー
4. **本日ポイントサマリー**: 紫グラデカード（`bg-gradient-to-r from-violet-700 to-fuchsia-600`）、トロフィーアイコン、ミニリーダーボード
5. **レシピクイックアクセス**: レシピがある場合、展開可能なレシピビューア（カテゴリフィルタ、絵文字アイコン、手順表示）
6. **カテゴリフィルタ**: `rounded-full` ボタン（アクティブ=`bg-violet-600`）
7. **タスクカード一覧**: グリッド表示
   - ポイントバッジ（黄色）、所要時間、カテゴリ、繰り返し可否
   - 「完了報告」ボタン（`bg-violet-600`）
   - 完了済みタスクは `opacity-50`、非繰り返しは disabled
   - 動画URL がある場合は `Video` アイコン表示
8. **完了報告ダイアログ**: スタッフ選択（グリッドボタン）、コメント、写真添付（モック）
9. **自主タスクダイアログ**: タイトル、ポイント、スタッフ選択

**重要**: タスク完了時に `boardMessages` にも自動投稿される（「XXがYYを完了(+Zpt)」形式）

---

## ステップ14: シフトタブ (shift-tab.tsx)

`src/components/tabs/shift-tab.tsx`:

4つのサブビュー:

### 14-1. シフト希望提出 (ShiftRequestView)
- スタッフ選択 → 週カレンダー → 日付タップで希望追加ダイアログ
- 希望状態: pending=青, approved=緑, rejected=赤
- 週ナビゲーション（デフォルト来週）

### 14-2. シフト管理 (ShiftManageView)
- 未承認シフト希望の一覧 + 一括承認/個別承認・却下
- **AIシフト自動作成**: モック実装（1.5秒のsetTimeoutで擬似最適化、ランダムにシフトを生成）
- 週間シフト表: 名前 x 7日のグリッド、色分け（確定=青, 実績=緑, 希望=黄色破線）
- 各セルに時間・ポジション表示
- 右端: 週間合計時間・人件費
- 凡例付き

### 14-3. タイムカード (TimecardView)
- 本日シフトのスタッフをカード表示
- ステータス: pending=未出勤, working=出勤中（緑パルスドット）, done=完了
- タップで出勤/退勤ボタン表示
- 出勤時に引き継ぎ事項ダイアログ表示

### 14-4. 顔認証打刻 (FaceClockView)
- `getUserMedia` でカメラ起動
- **モック認証**: ランダムにスタッフを選んで打刻処理
- スキャンオーバーレイ（パルスアニメーション）
- 認証成功表示（緑丸 + UserCheck アイコン）
- プロトタイプである旨の説明カード

---

## ステップ15: レシピタブ (recipe-tab.tsx)

`src/components/tabs/recipe-tab.tsx`:

2つのサブタブ:

### 15-1. レシピ一覧 (RecipeListView)
- 検索 + カテゴリフィルタ
- カテゴリ別グループ表示
- レシピカード: 絵文字、名前、カテゴリ、所要時間
- タップで展開: 材料（ドット区切り）、手順（番号付きステップ）、注意事項
- レシピ追加フォーム: メニュー名、カテゴリ（ドリンク/フード/デザート/サイド）、絵文字選択（15種類）、材料（改行区切り）、手順（改行区切り、自動番号振り）、調理時間、注意事項

### 15-2. 食材管理 (InventoryView)
- Google Apps Script からGETリクエストで在庫データを取得
- `?action=getStock` → `data.food` と `data.supply` を分離表示
- 食材/備品の切り替えタブ
- カテゴリ別グループ表示
- 在庫ゼロ=赤背景 + AlertTriangle、低在庫(3以下)=アンバー背景
- 更新ボタン（RefreshCw アニメーション）
- GAS URL は `localStorage.getItem('tebanashi-gas-url')` から取得、なければデフォルトURL

---

## ステップ16: 戦力表タブ (skill-matrix-tab.tsx)

`src/components/tabs/skill-matrix-tab.tsx`:

- スキル項目の追加（カテゴリ: キッチン/ドリンク/接客/運営/清掃）
- マトリクス表: スキル x 従業員
- ◯/× トグルボタン（◯=緑, ×=グレー）
- カテゴリ見出し行（色分けバッジ: キッチン=オレンジ, ドリンク=青, 接客=緑, 運営=紫, 清掃=グレー）
- 各行に習得者数、各列に合計スキル数とパーセンテージ
- カテゴリ別サマリーカード（習得率%）
- スキル削除可能
- テーブルは横スクロール対応（sticky左列）

---

## ステップ17: 音声ログタブ (voice-tab.tsx)

`src/components/tabs/voice-tab.tsx`:

**最重要コンポーネント** - 分類ロジックを正確に実装すること。

2つのサブタブ:

### 17-1. 音声ログ (VoiceLogView)

テキスト入力 → キーワード自動分類:

#### classifyText() の分類ロジック（超重要）:
1. テキストを「。」と改行で文に分割
2. **引き継ぎモード** を管理する変数 `handoverMode = false`
3. 各文を順に処理:
   - 引き継ぎトリガーワード（「引き継ぎ」「引継ぎ」「ひきつぎ」「申し送り」「申送り」「連絡事項」）を含む → `handoverMode = true` にして、その文を引き継ぎに追加、`continue`
   - 緊急キーワード（「緊急」「至急」「切れ」「ない」「ゼロ」「不足」）を含む → 緊急に追加（+ パース試行）
   - マスタ商品名一致 or 在庫キーワード（「消費」「入荷」「残量」「確認」「個」「本」「枚」「キロ」「補充」「使用」「仕入」）を含む → 在庫に追加 + パース
   - `handoverMode === true` かつ上記どれにも該当しない → **引き継ぎに追加**
   - それ以外 → **捨てる**（引き継ぎにしない）

#### parseInventorySentence() のパースロジック:
- 漢数字マッピング（一〜十、ひとつ〜いつつ）
- 単位パターン: 個, 本, 枚, キロ, kg, g, リットル, L, パック, 袋, 缶, 箱, つ, ケース, 瓶, 切り身, ポーション, ボトル
- 消費/入荷の判定: 「入荷」「補充」「追加」「仕入」があれば restock、それ以外は consume
- マスタ商品名を長い順にソートしてマッチ（部分一致対応）
- 数量なしでもマスタ一致なら1個として記録

#### GAS送信:
```javascript
{
  action: 'voiceLog',
  date: today,
  urgent: [...],
  inventory: [...],
  inventoryParsed: [...].map(p => ({ ...p, itemType: masterItem?.itemType ?? 'food' })),
  handover: [...],
  itemTypeMap: Object.fromEntries(inventoryItems.map(i => [i.name, i.itemType ?? 'food']))
}
```

- `Content-Type: 'text/plain'`（GASの制約のため）
- `inventoryParsed` の各アイテムに `itemType` を付与（マスタから完全一致 → 部分一致の順で検索）
- `itemTypeMap` を別途送信（GAS側での参照用）

### 17-2. 商品マスタ登録 (MasterRegistrationView)

- 食材/備品の `ItemTypeToggle`（オレンジ=食材, 青=備品）
- 単品追加: 商品名、カテゴリ（datalist付き）、単位（select: 個/本/袋/缶/パック/kg/g/L/瓶/箱/枚/ロール/セット）
- **一括登録**: テキストエリアに貼り付け
  - 区切り判定: タブ区切り優先 → カンマ区切り → 2つ以上のスペース
  - ヘッダー行（「アイテム名」「商品名」「品目」で始まる行）はスキップ
  - 重複チェック（既存名 + バッチ内重複）
  - 結果表示（追加件数 + スキップ件数）
- **スプレッドシート同期** (`action: 'syncMaster'`): 全マスタ商品を送信
- 登録済み一覧: 食材/備品別にカテゴリグループ表示
- 食材全削除 / 備品全削除 / 全削除ボタン

---

## ステップ18: 評価・バックヤードタブ (backyard-tab.tsx)

`src/components/tabs/backyard-tab.tsx`:

2つのサブタブ:

### 18-1. 評価 (EvaluationView)
- 従業員を累計ポイント降順でランキング表示
- ランク表示: 1位=ゴールド, 2位=シルバー, 3位=ブロンズ
- カードタップで展開: 今日のポイント、累計ポイント、完了タスク一覧、勤務時間
- ポイント計算: 当日 `taskCompletions` + `pointsArchive`（過去アーカイブ）

### 18-2. 連絡ボード (BoardView)
- 前日引き継ぎ表示（voiceLogs から）
- メッセージ投稿: 連絡事項 / 引き継ぎ 選択
- 投稿者は `employees[0]?.name ?? 'オーナー'`
- メッセージ一覧: タイプバッジ（完了報告=緑, 連絡=青, 引き継ぎ=アンバー）、投稿者、時刻

---

## ステップ19: 設定タブ (settings-tab.tsx)

`src/components/tabs/settings-tab.tsx`:

7セクション（横スクロール `rounded-full` ボタンで切り替え、アクティブ=`bg-violet-600`）:

1. **店舗情報**: 店舗名、開店・閉店時間の編集
2. **目標設定**: 曜日タイプ別（平日/土日/祝日）の売上目標・ポイント目標をインライン編集
3. **従業員**: 追加（名前、役職、時給）・削除
4. **タスク・動画**: 追加・インライン編集・削除。カテゴリ、ポイント、目安時間、説明、動画URL、繰り返し可否（Switch）
5. **レシピ管理**: 追加・詳細表示・削除（絵文字選択、材料・手順入力）
6. **食材品目**: 追加・削除（品名、単位、カテゴリ、単価）
7. **評価基準**: 追加・削除（項目名、配点）

---

## ステップ20: Google Apps Script (GAS) 連携仕様

GAS側で9つのシートを管理:

| シート名 | 用途 |
|---|---|
| 商品マスタ(食材) | 食材マスタ |
| 商品マスタ(備品) | 備品マスタ |
| 在庫管理表(食材) | 食材の在庫数量 |
| 在庫管理表(備品) | 備品の在庫数量 |
| 在庫ログ | 消費・入荷ログ |
| 緊急アラート | 緊急事項 |
| 引き継ぎ事項 | 引き継ぎ |
| 買い出しリスト | 在庫ゼロ品目 |
| 音声ログ原文 | 音声テキスト原文 |

### POST エンドポイント

**action: 'voiceLog'**
- urgent → 緊急アラートシートに追記
- inventoryParsed → itemType に応じて食材 or 備品の在庫管理表を更新 + 在庫ログに記録
- handover → 引き継ぎ事項シートに追記
- itemTypeMap → 品目名→タイプの辞書（GAS側でルーティング補助）

**action: 'syncMaster'**
- 両方のマスタシートをクリアして再構築
- items の itemType で食材/備品シートに振り分け

### GET エンドポイント

**action: 'getStock'**
- レスポンス: `{ status: 'ok', food: StockItem[], supply: StockItem[] }`
- StockItem: `{ '品目': string, 'カテゴリ': string, '現在数': number, '単位': string, '最終更新': string }`

### GAS URL の管理
- `localStorage.getItem('tebanashi-gas-url')` で取得
- なければハードコードのデフォルトURLを使用

---

## 重要な実装ノート

### デザイン統一ルール
- すべてのカードに `rounded-2xl border-0 shadow-sm`
- すべてのボタンに `rounded-xl`
- プライマリボタン: `bg-[#ff6b6b] hover:bg-[#e05555]`
- セカンダリ（タスク系）: `bg-violet-600 hover:bg-violet-700`
- バッジ: `rounded-full`
- サブタブ切り替え: `bg-gray-50 rounded-xl p-1` コンテナ内の `rounded-xl` ボタン
- アクティブサブタブ: `bg-white shadow-sm font-medium text-[#ff6b6b]`
- 境界線: `border-gray-100` or `border-gray-50`
- 小テキスト: `text-[10px]` を積極的に使用
- グレースケール: gray-50, gray-100, gray-200, gray-300, gray-400, gray-500

### データフロー
1. 全データは `localStorage` に保存（キー: `tebanashi-cafe-app`）
2. `setState()` 呼び出し時に自動保存
3. 日付変更時に自動リセット
4. タスク完了 → 掲示板メッセージ自動生成
5. 開店処理 → リセット + 目標設定 + システムメッセージ

### lucide-react アイコン使用一覧
主要なインポート:
- LayoutDashboard, ClipboardCheck, CalendarClock, ChefHat, Shield, Mic, BarChart3, Settings
- Coffee, Sunrise, Target, Trophy, Sparkles, Star, Zap, Eye
- DollarSign, Users, Activity, Clock, Plus, X, Check
- LogIn, LogOut, Camera, Scan, UserCheck, Send, Wand2
- AlertTriangle, Archive, FileText, Package, RefreshCw, Upload
- Play, Video, CheckCircle2, User, ChevronLeft, ChevronRight
- Store, Trash2, Edit2, Save, HandMetal, Bell, AlertCircle

### ファイル構成（完成形）
```
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    main-app.tsx
    bottom-nav.tsx
    onboarding.tsx
    tabs/
      dashboard-tab.tsx
      tasks-tab.tsx
      shift-tab.tsx
      recipe-tab.tsx
      skill-matrix-tab.tsx
      voice-tab.tsx
      backyard-tab.tsx
      settings-tab.tsx
    ui/
      (shadcnコンポーネント群: card, button, badge, input, textarea,
       label, checkbox, select, separator, avatar, scroll-area,
       alert, switch, dialog, tooltip, sheet, tabs, progress)
  lib/
    types.ts
    store.ts
    context.tsx
    utils.ts
```

### Vercelデプロイ
```bash
npm run build
# Vercelにデプロイ
```

---

## 完成チェックリスト

以下の全機能が動作することを確認:

- [ ] オンボーディング3ステップ（店舗名→営業時間→従業員）
- [ ] オンボーディング完了でデフォルトタスク10件・在庫4件が自動生成
- [ ] 開店処理フロー（曜日タイプ選択、目標設定、リセット）
- [ ] ダッシュボードKPI（売上、FL比率、出勤数、ポイント）
- [ ] 売上入力（2時間リマインダー付き）
- [ ] 店舗ステータス切り替え（idle/normal/busy）
- [ ] 引き継ぎチェックリスト（ダッシュボード上）
- [ ] ポイントタスクシステム（カテゴリフィルタ、完了報告、掲示板自動投稿）
- [ ] 自主タスク追加・報告
- [ ] レシピクイックビューア（タスクタブ内）
- [ ] シフト希望提出（週カレンダー）
- [ ] シフト管理（承認/却下、AI自動生成モック）
- [ ] タイムカード（出退勤、引き継ぎ表示）
- [ ] 顔認証打刻（カメラ起動、モック認識）
- [ ] レシピ一覧・追加（絵文字、材料、手順、カテゴリ）
- [ ] 食材管理（GASからGET取得、食材/備品分離）
- [ ] 戦力表（スキルマトリクス、◯×トグル、カテゴリ色分け）
- [ ] 音声ログ自動分類（緊急/在庫/引き継ぎ、引き継ぎモード）
- [ ] 在庫パース（漢数字対応、マスタ名マッチ優先）
- [ ] 商品マスタ登録（食材/備品分離、一括登録、スプレッドシート同期）
- [ ] 評価ランキング（累計ポイント、当日詳細）
- [ ] 連絡ボード（投稿、タスク完了自動投稿、引き継ぎ表示）
- [ ] 設定7セクション全て
- [ ] 日付変更時の自動リセット
- [ ] localStorageへの自動保存
- [ ] itemType マイグレーション（既存アイテムへの 'food' デフォルト付与）
