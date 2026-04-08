// ============================================================
// カフェ在庫管理 GAS バックエンド v2
// ============================================================
// 【設定】以下の2つを書き換えてからデプロイしてください
var CONFIG = {
  SPREADSHEET_ID: '1Elqj0wVUZkGyQMLLd84WYf8TBYQb0HawooA8ETZn99c',
  NOTIFY_EMAIL:   'ここに通知先メールアドレスを入力',
};

// ── シート名 ──
var SHEET_MASTER_FOOD   = '商品マスタ（食材）';
var SHEET_MASTER_SUPPLY = '商品マスタ（備品）';
var SHEET_STOCK_FOOD    = '在庫管理表（食材）';
var SHEET_STOCK_SUPPLY  = '在庫管理表（備品）';
var SHEET_LOG           = '在庫ログ';
var SHEET_URGENT    = '緊急アラート';
var SHEET_HANDOVER  = '引き継ぎ事項';
var SHEET_SHOPPING  = '買い出しリスト';
var SHEET_RAW_LOG   = '音声ログ原文';

// ============================================================
// POST ハンドラ（action で分岐）
// ============================================================
function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
    var action = json.action || 'voiceLog';

    if (action === 'syncMaster') {
      return handleSyncMaster(json);
    } else {
      return handleVoiceLog(json);
    }
  } catch (err) {
    return buildResponse(500, { status: 'error', message: err.toString() });
  }
}

// ============================================================
// 商品マスタ同期
// ============================================================
function handleSyncMaster(json) {
  var items = json.items || [];
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  var foodSheet = getOrCreateSheet(ss, SHEET_MASTER_FOOD, ['商品名', 'カテゴリ', '単位', '登録日']);
  var supplySheet = getOrCreateSheet(ss, SHEET_MASTER_SUPPLY, ['商品名', 'カテゴリ', '単位', '登録日']);

  // 両シートをクリアして全件書き直す（食材/備品の移動に対応）
  clearSheetData(foodSheet);
  clearSheetData(supplySheet);

  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var foodCount = 0;
  var supplyCount = 0;

  for (var j = 0; j < items.length; j++) {
    var name = String(items[j].name).trim();
    if (!name) continue;
    var isSupply = (String(items[j].itemType) === 'supply');
    var targetSheet = isSupply ? supplySheet : foodSheet;
    targetSheet.appendRow([name, items[j].category || '未分類', items[j].unit || '個', today]);
    if (isSupply) { supplyCount++; } else { foodCount++; }
  }

  // 各シートをカテゴリ別にソート
  var sheets = [foodSheet, supplySheet];
  for (var k = 0; k < sheets.length; k++) {
    var totalRows = sheets[k].getLastRow();
    if (totalRows >= 3) {
      sheets[k].getRange(2, 1, totalRows - 1, 4).sort([{column: 2, ascending: true}, {column: 1, ascending: true}]);
    }
    colorByCategory(sheets[k]);
  }

  return buildResponse(200, { status: 'ok', food: foodCount, supply: supplyCount, total: foodCount + supplyCount });
}

// ============================================================
// 音声ログ処理（分類してシート別に書き込み）
// ============================================================
function handleVoiceLog(json) {
  var date            = json.date || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var time            = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'HH:mm');
  var urgent          = json.urgent          || [];
  var inventoryParsed = json.inventoryParsed  || [];
  var inventory       = json.inventory       || [];
  var handover        = json.handover        || [];

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // ── 1. 在庫管理表を更新 ──
  if (inventoryParsed.length > 0) {
    updateStockTable(ss, date, inventoryParsed);
  }

  // ── 2. 在庫ログに詳細記録 ──
  appendInventoryLog(ss, date, time, inventoryParsed, inventory);

  // ── 3. 緊急アラートシートに記録 ──
  if (urgent.length > 0) {
    appendUrgentSheet(ss, date, time, urgent);
    appendShoppingList(ss, date, urgent);
  }

  // ── 4. 引き継ぎ事項シートに記録 ──
  if (handover.length > 0) {
    appendHandoverSheet(ss, date, time, handover);
  }

  // ── 5. 音声ログ原文を記録 ──
  appendRawLog(ss, date, time, urgent, inventory, handover);

  // ── 6. 緊急メール通知 ──
  if (urgent.length > 0 && CONFIG.NOTIFY_EMAIL && CONFIG.NOTIFY_EMAIL.indexOf('@') > 0) {
    sendUrgentEmail(date, urgent);
  }

  return buildResponse(200, {
    status: 'ok',
    stockUpdated: inventoryParsed.length,
    urgentCount: urgent.length,
    handoverCount: handover.length,
  });
}

// ============================================================
// GET ハンドラ（動作確認用）
// ============================================================
function doGet() {
  return buildResponse(200, {
    status: 'ok',
    message: 'カフェ在庫管理 GAS v2 が稼働中です',
    sheets: [SHEET_MASTER_FOOD, SHEET_MASTER_SUPPLY, SHEET_STOCK_FOOD, SHEET_STOCK_SUPPLY, SHEET_LOG, SHEET_URGENT, SHEET_HANDOVER, SHEET_SHOPPING, SHEET_RAW_LOG],
  });
}

// ============================================================
// 在庫管理表を更新
// ============================================================
function updateStockTable(ss, date, parsedItems) {
  var foodSheet = getOrCreateSheet(ss, SHEET_STOCK_FOOD, ['品目', 'カテゴリ', '現在数', '単位', '最終更新']);
  var supplySheet = getOrCreateSheet(ss, SHEET_STOCK_SUPPLY, ['品目', 'カテゴリ', '現在数', '単位', '最終更新']);

  // 両マスタシートから品目→タイプのマップを構築
  var masterMap = {}; // { name: { category, unit, itemType } }
  var masterSheets = [
    { sheet: ss.getSheetByName(SHEET_MASTER_FOOD), type: 'food' },
    { sheet: ss.getSheetByName(SHEET_MASTER_SUPPLY), type: 'supply' },
  ];
  for (var ms = 0; ms < masterSheets.length; ms++) {
    var mSheet = masterSheets[ms].sheet;
    if (mSheet && mSheet.getLastRow() >= 2) {
      var mData = mSheet.getRange(2, 1, mSheet.getLastRow() - 1, 3).getValues();
      for (var m = 0; m < mData.length; m++) {
        masterMap[String(mData[m][0]).trim()] = {
          category: String(mData[m][1]) || '未分類',
          unit: String(mData[m][2]) || '個',
          itemType: masterSheets[ms].type,
        };
      }
    }
  }

  // 各在庫シートの既存データを読み込む
  var stockSheets = [
    { sheet: foodSheet, type: 'food' },
    { sheet: supplySheet, type: 'supply' },
  ];
  var itemMap = {}; // { name: { sheet, row, qty, unit, type } }
  for (var si = 0; si < stockSheets.length; si++) {
    var sSheet = stockSheets[si].sheet;
    var lastRow = sSheet.getLastRow();
    if (lastRow >= 2) {
      var data = sSheet.getRange(2, 1, lastRow - 1, 5).getValues();
      for (var i = 0; i < data.length; i++) {
        var name = String(data[i][0]).trim();
        if (name) {
          itemMap[name] = { sheet: sSheet, row: i + 2, qty: Number(data[i][2]) || 0, unit: String(data[i][3]) || '個', type: stockSheets[si].type };
        }
      }
    }
  }

  for (var j = 0; j < parsedItems.length; j++) {
    var p = parsedItems[j];
    var itemName = String(p.item).trim();
    var quantity = Number(p.quantity) || 0;
    var unit     = String(p.unit) || '個';
    var action   = String(p.action);
    var master = masterMap[itemName];
    var cat = (master && master.category) || '未分類';
    // POSTデータにitemTypeがあればそれを優先、なければマスタから、最終的にfood
    var type = String(p.itemType || (master && master.itemType) || 'food');
    var targetSheet = (type === 'supply') ? supplySheet : foodSheet;

    if (itemMap[itemName]) {
      var existing = itemMap[itemName];
      var newQty = (action === 'consume') ? Math.max(0, existing.qty - quantity) : existing.qty + quantity;
      existing.sheet.getRange(existing.row, 3).setValue(newQty);
      existing.sheet.getRange(existing.row, 5).setValue(date);
    } else {
      var initialQty = (action === 'consume') ? 0 : quantity;
      targetSheet.appendRow([itemName, cat, initialQty, unit, date]);
    }
  }

  // 在庫ゼロを赤背景（両シート）
  for (var z = 0; z < stockSheets.length; z++) {
    var zSheet = stockSheets[z].sheet;
    var totalRows = zSheet.getLastRow();
    if (totalRows >= 2) {
      for (var r = 2; r <= totalRows; r++) {
        var val = zSheet.getRange(r, 3).getValue();
        if (Number(val) <= 0) {
          zSheet.getRange(r, 1, 1, 5).setBackground('#fce4ec');
        } else {
          zSheet.getRange(r, 1, 1, 5).setBackground(null);
        }
      }
    }
  }
}

// ============================================================
// 在庫ログ（詳細履歴）
// ============================================================
function appendInventoryLog(ss, date, time, parsedItems, rawInventory) {
  var sheet = getOrCreateSheet(ss, SHEET_LOG, ['日付', '時刻', '品目', '数量', '単位', '操作', '元テキスト']);

  for (var i = 0; i < parsedItems.length; i++) {
    var p = parsedItems[i];
    sheet.appendRow([date, time, p.item, p.quantity, p.unit, p.action === 'consume' ? '消費' : '入荷', p.raw || '']);
  }

  // パースできなかった在庫テキスト
  for (var k = 0; k < rawInventory.length; k++) {
    var alreadyParsed = false;
    for (var m = 0; m < parsedItems.length; m++) {
      if (parsedItems[m].raw === rawInventory[k]) { alreadyParsed = true; break; }
    }
    if (!alreadyParsed) {
      sheet.appendRow([date, time, '', '', '', '未パース', rawInventory[k]]);
    }
  }
}

// ============================================================
// 緊急アラートシート
// ============================================================
function appendUrgentSheet(ss, date, time, urgentItems) {
  var sheet = getOrCreateSheet(ss, SHEET_URGENT, ['日付', '時刻', '内容', '対応状況']);
  for (var i = 0; i < urgentItems.length; i++) {
    sheet.appendRow([date, time, urgentItems[i], '未対応']);
  }
  // 未対応を赤に
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    for (var r = 2; r <= lastRow; r++) {
      var status = sheet.getRange(r, 4).getValue();
      if (status === '未対応') {
        sheet.getRange(r, 1, 1, 4).setBackground('#fff3e0');
      }
    }
  }
}

// ============================================================
// 引き継ぎ事項シート
// ============================================================
function appendHandoverSheet(ss, date, time, handoverItems) {
  var sheet = getOrCreateSheet(ss, SHEET_HANDOVER, ['日付', '時刻', '内容', '確認済み']);
  for (var i = 0; i < handoverItems.length; i++) {
    sheet.appendRow([date, time, handoverItems[i], '']);
  }
}

// ============================================================
// 音声ログ原文（日次サマリー）
// ============================================================
function appendRawLog(ss, date, time, urgent, inventory, handover) {
  var sheet = getOrCreateSheet(ss, SHEET_RAW_LOG, ['日付', '時刻', '緊急件数', '在庫件数', '引き継ぎ件数', 'サマリー']);
  var summary = [];
  if (urgent.length > 0) summary.push('緊急' + urgent.length + '件');
  if (inventory.length > 0) summary.push('在庫' + inventory.length + '件');
  if (handover.length > 0) summary.push('引き継ぎ' + handover.length + '件');
  sheet.appendRow([date, time, urgent.length, inventory.length, handover.length, summary.join(' / ')]);
}

// ============================================================
// 買い出しリスト
// ============================================================
function appendShoppingList(ss, date, urgentItems) {
  var sheet = getOrCreateSheet(ss, SHEET_SHOPPING, ['日付', '品目', '対応状況']);
  for (var i = 0; i < urgentItems.length; i++) {
    sheet.appendRow([date, urgentItems[i], '未対応']);
  }
}

// ============================================================
// メール通知
// ============================================================
function sendUrgentEmail(date, urgentItems) {
  var subject = '【緊急】在庫補充 (' + date + ')';
  var body = ['カフェ在庫管理システムからの緊急通知です。', '', '以下の在庫に緊急対応が必要です:', ''];
  for (var i = 0; i < urgentItems.length; i++) {
    body.push('  ' + (i + 1) + '. ' + urgentItems[i]);
  }
  body.push('', '---', 'スプレッドシートの各シートを確認してください。');
  MailApp.sendEmail({ to: CONFIG.NOTIFY_EMAIL, subject: subject, body: body.join('\n') });
}

// ============================================================
// ユーティリティ
// ============================================================

/** シートを取得。なければヘッダー付きで新規作成 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f5f5f5');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** ヘッダー行を残してデータをクリア */
function clearSheetData(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
    // 空行を削除
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
  }
}

/** カテゴリ別に交互背景色 */
function colorByCategory(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var data = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  var colors = ['#ffffff', '#fafafa'];
  var prevCat = '';
  var colorIdx = 0;
  for (var i = 0; i < data.length; i++) {
    var cat = String(data[i][0]).trim();
    if (cat !== prevCat) { colorIdx = 1 - colorIdx; prevCat = cat; }
    sheet.getRange(i + 2, 1, 1, sheet.getLastColumn()).setBackground(colors[colorIdx]);
  }
}

/** JSON レスポンスを返す */
function buildResponse(code, payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 初期セットアップ（手動で1回だけ実行）
// ============================================================
function setup() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  getOrCreateSheet(ss, SHEET_MASTER_FOOD,   ['商品名', 'カテゴリ', '単位', '登録日']);
  getOrCreateSheet(ss, SHEET_MASTER_SUPPLY, ['商品名', 'カテゴリ', '単位', '登録日']);
  getOrCreateSheet(ss, SHEET_STOCK_FOOD,    ['品目', 'カテゴリ', '現在数', '単位', '最終更新']);
  getOrCreateSheet(ss, SHEET_STOCK_SUPPLY,  ['品目', 'カテゴリ', '現在数', '単位', '最終更新']);
  getOrCreateSheet(ss, SHEET_LOG,           ['日付', '時刻', '品目', '数量', '単位', '操作', '元テキスト']);
  getOrCreateSheet(ss, SHEET_URGENT,        ['日付', '時刻', '内容', '対応状況']);
  getOrCreateSheet(ss, SHEET_HANDOVER,      ['日付', '時刻', '内容', '確認済み']);
  getOrCreateSheet(ss, SHEET_SHOPPING,      ['日付', '品目', '対応状況']);
  getOrCreateSheet(ss, SHEET_RAW_LOG,       ['日付', '時刻', '緊急件数', '在庫件数', '引き継ぎ件数', 'サマリー']);
  Logger.log('セットアップ完了: 9シートを作成しました');
}
