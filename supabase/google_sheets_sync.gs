/**
 * SUPERLEAP CRM — Google Sheets ↔ Supabase Bi-Directional Sync
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with tabs: Dealers, Leads, Calls, Visits, DCF_Leads, Org, Config
 *    (see google_sheets_schema.md for column definitions)
 * 2. Open Extensions → Apps Script, paste this entire file into Code.gs
 * 3. Run createTimeTrigger() once to enable auto-sync every 5 minutes
 * 4. Click Deploy → New Deployment → Web App → Execute as "Me", Access "Anyone"
 * 5. Copy the Web App URL for Supabase webhooks
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://fdmlyrgiktljuyuthgki.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWx5cmdpa3RsanV5dXRoZ2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTYyMjQsImV4cCI6MjA4NjI3MjIyNH0.P6td3mqAoKYz6wdgPa9Bs2GytZH4x11n2vuTl6oVb3s';

// Sheet name → Supabase raw table mapping
const SHEET_TABLE_MAP = {
  'Dealers':    { table: 'dealers_raw',    idCol: 'dealer_id' },
  'Leads':      { table: 'leads_raw',      idCol: 'lead_id' },
  'Calls':      { table: 'calls_raw',      idCol: 'call_id' },
  'Visits':     { table: 'visits_raw',     idCol: 'visit_id' },
  'DCF_Leads':  { table: 'dcf_leads_raw',  idCol: 'dcf_id' },
  'Org':        { table: 'org_raw',         idCol: 'user_id' },
};

// ─── CUSTOM MENU ─────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Superleap CRM')
    .addItem('🔄 Sync Now', 'syncAllSheets')
    .addItem('⏰ Enable Auto-Sync (every 5 min)', 'createTimeTrigger')
    .addItem('🛑 Disable Auto-Sync', 'removeTimeTrigger')
    .addToUi();
}

// ─── TIME TRIGGER MANAGEMENT ────────────────────────────────────────────────
function createTimeTrigger() {
  // Remove existing triggers first
  removeTimeTrigger();
  ScriptApp.newTrigger('syncAllSheets')
    .timeBased()
    .everyMinutes(5)
    .create();
  SpreadsheetApp.getUi().alert('✅ Auto-sync enabled! Data will sync every 5 minutes.');
}

function removeTimeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncAllSheets') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ─── MAIN SYNC: ALL SHEETS → SUPABASE ──────────────────────────────────────
function syncAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = [];

  for (const [sheetName, config] of Object.entries(SHEET_TABLE_MAP)) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      results.push(`⚠️ ${sheetName}: Sheet not found, skipping`);
      continue;
    }

    const count = syncSheetToSupabase(sheet, config.table, config.idCol);
    results.push(`✅ ${sheetName}: ${count} rows synced → ${config.table}`);
  }

  // Also sync the Config sheet as key-value pairs into org_raw
  const configSheet = ss.getSheetByName('Config');
  if (configSheet) {
    const configCount = syncConfigSheet(configSheet);
    results.push(`✅ Config: ${configCount} keys synced`);
  }

  console.log(results.join('\n'));
  return results;
}

// ─── SYNC SINGLE SHEET → SUPABASE RAW TABLE ───────────────────────────────
function syncSheetToSupabase(sheet, tableName, idColumn) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0; // No data rows

  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = data.slice(1);

  let synced = 0;

  for (const row of rows) {
    // Build payload object from headers + row values
    const payload = {};
    headers.forEach((header, i) => {
      const val = row[i];
      if (val !== '' && val !== null && val !== undefined) {
        // Convert dates to ISO strings
        if (val instanceof Date) {
          payload[header] = val.toISOString();
        } else {
          payload[header] = val;
        }
      }
    });

    // Skip empty rows
    const id = payload[idColumn];
    if (!id) continue;

    // Upsert into *_raw table as JSON payload
    const rawRow = {
      id: String(id),
      payload: payload,
      synced_at: new Date().toISOString(),
    };

    const url = `${SUPABASE_URL}/rest/v1/${tableName}?on_conflict=id`;
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      payload: JSON.stringify(rawRow),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() < 300) {
        synced++;
      } else {
        console.error(`Failed to sync ${id} to ${tableName}: ${response.getContentText()}`);
      }
    } catch (error) {
      console.error(`Error syncing ${id}: ${error}`);
    }
  }

  return synced;
}

// ─── SYNC CONFIG SHEET ─────────────────────────────────────────────────────
function syncConfigSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;

  const configObj = {};
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const value = data[i][1];
    if (key) configObj[key] = value;
  }

  // Store entire config as a single org_raw entry
  const rawRow = {
    id: 'config-1',
    payload: configObj,
    synced_at: new Date().toISOString(),
  };

  const url = `${SUPABASE_URL}/rest/v1/org_raw?on_conflict=id`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    payload: JSON.stringify(rawRow),
    muteHttpExceptions: true
  };

  try {
    UrlFetchApp.fetch(url, options);
    return Object.keys(configObj).length;
  } catch (error) {
    console.error('Config sync error: ' + error);
    return 0;
  }
}

// ─── SUPABASE → SHEET (Webhook Receiver) ────────────────────────────────────
// Deploy as Web App. Supabase sends POST when app writes data.
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const record = data.record;
    const table = data.table;

    if (!record) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'ignored', reason: 'no record' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Find which sheet this table maps to
    let targetSheet = null;
    let idCol = null;
    for (const [sheetName, config] of Object.entries(SHEET_TABLE_MAP)) {
      // Incoming webhook comes from normalized tables (not _raw)
      const configTableRaw = config.table; // e.g. "leads_raw"
      const configTableNormalized = configTableRaw.replace(/_raw$/, ''); // e.g. "leads"
      
      // Special mappings for tables where normalized name != sheet raw name prefix
      let actualTableNormalized = configTableNormalized;
      if (configTableRaw === 'calls_raw') actualTableNormalized = 'call_events';
      if (configTableRaw === 'dcf_leads_raw') actualTableNormalized = 'dcf_cases';
      
      if (table === configTableRaw || table === configTableNormalized || table === actualTableNormalized) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        targetSheet = ss.getSheetByName(sheetName);
        idCol = config.idCol;
        break;
      }
    }

    if (!targetSheet || !idCol) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'ignored', reason: 'no matching sheet for table: ' + table })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Get headers from row 1
    const headers = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn()).getValues()[0]
      .map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));

    // Find the record ID
    const recordId = record[idCol];
    if (!recordId) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'ignored', reason: 'no id in record' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Build row from record
    const rowData = headers.map(header => record[header] !== undefined ? record[header] : '');

    // Check if row exists
    const allData = targetSheet.getDataRange().getValues();
    const idColIndex = headers.indexOf(idCol);
    let existingRow = -1;

    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][idColIndex]) === String(recordId)) {
        existingRow = i + 1;
        break;
      }
    }

    if (existingRow > 0) {
      targetSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      targetSheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', action: existingRow > 0 ? 'updated' : 'inserted' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── SHEET → SUPABASE (onEdit for real-time single-cell edits) ─────────────
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();

  const config = SHEET_TABLE_MAP[sheetName];
  if (!config) return; // Not a tracked sheet

  const row = e.range.getRow();
  if (row === 1) return; // Ignore header edits

  // Get headers and full row data
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Build payload
  const payload = {};
  headers.forEach((header, i) => {
    const val = rowData[i];
    if (val !== '' && val !== null && val !== undefined) {
      payload[header] = val instanceof Date ? val.toISOString() : val;
    }
  });

  const id = payload[config.idCol];
  if (!id) return;

  // Upsert to raw table
  const rawRow = {
    id: String(id),
    payload: payload,
    synced_at: new Date().toISOString(),
  };

  const url = `${SUPABASE_URL}/rest/v1/${config.table}?on_conflict=id`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    payload: JSON.stringify(rawRow),
    muteHttpExceptions: true
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error('onEdit sync error: ' + error);
  }
}
