const SHEET_NAME = 'Responses';
const HEADERS = [
  'submitted_at',
  'd_score',
  'mean_congruent_ms',
  'mean_incongruent_ms',
  'interpretation',
  'app',
  'male_boss_ms',
  'female_care_ms',
  'female_boss_ms',
  'male_care_ms',
];

// The four combined-block pairing cells, in display order (congruent pair first).
const CELL_KEYS = ['maleBoss', 'femaleCare', 'femaleBoss', 'maleCare'];

const PRIMING_SHEET_NAME = 'Priming';
const PRIMING_HEADERS = [
  'submitted_at',
  'major',
  'mean_male_rt',
  'mean_female_rt',
  'diff',
];

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const app = String(payload.app || 'gender-iat');

    if (app === 'gender-iat-priming') {
      const scores = payload.scores || [];
      const sheet = getOrCreatePrimingSheet();
      // ISO string (millisecond precision) so submissions are counted per-student:
      // a plain Date loses its milliseconds under String() and would collide when
      // two students finish in the same wall-clock second.
      const now = new Date().toISOString();

      for (var i = 0; i < scores.length; i++) {
        var s = scores[i];
        sheet.appendRow([
          now,
          String(s.major || ''),
          asNumber(s.meanMaleRT),
          asNumber(s.meanFemaleRT),
          asNumber(s.diff),
        ]);
      }
    } else {
      const score = payload.score || {};
      const cells = score.cellMedians || {};
      const sheet = getOrCreateSheet();

      sheet.appendRow([
        new Date(),
        asNumber(score.dScore),
        asNumber(score.meanCongruent),
        asNumber(score.meanIncongruent),
        String(score.interpretation || ''),
        app,
        asNumber(cells.maleBoss),
        asNumber(cells.femaleCare),
        asNumber(cells.femaleBoss),
        asNumber(cells.maleCare),
      ]);
    }

    return jsonOutput({ ok: true });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error) });
  }
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'priming_summary') {
    return handlePrimingSummary();
  }

  if (action !== 'summary') {
    return jsonOutput({
      ok: true,
      message: 'Use ?action=summary or ?action=priming_summary.',
    });
  }

  const rows = readRows();
  if (rows.length === 0) {
    return jsonOutput({
      count: 0,
      avgDScore: null,
      avgCongruentMs: null,
      avgIncongruentMs: null,
      congruentFasterPct: null,
      cells: emptyCellStats(),
      generatedAt: new Date().toISOString(),
    });
  }

  const avgDScore = median(rows.map(row => row.dScore));
  const avgCongruentMs = median(rows.map(row => row.meanCongruentMs));
  const avgIncongruentMs = median(rows.map(row => row.meanIncongruentMs));
  const congruentFasterCount = rows.filter(
    row => row.meanCongruentMs < row.meanIncongruentMs
  ).length;

  return jsonOutput({
    count: rows.length,
    avgDScore: round(avgDScore, 3),
    avgCongruentMs: round(avgCongruentMs, 1),
    avgIncongruentMs: round(avgIncongruentMs, 1),
    congruentFasterPct: round((congruentFasterCount / rows.length) * 100, 1),
    cells: cellStats(rows),
    generatedAt: new Date().toISOString(),
  });
}

function handlePrimingSummary() {
  var sheet;
  try {
    sheet = getOrCreatePrimingSheet();
  } catch (_) {
    return jsonOutput({ responseCount: 0, majors: [], generatedAt: new Date().toISOString() });
  }

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return jsonOutput({ responseCount: 0, majors: [], generatedAt: new Date().toISOString() });
  }

  // Group diffs by major; count unique timestamps as responses
  var byMajor = {};
  var timestamps = {};
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var ts = String(row[0]);
    var major = String(row[1]);
    var diff = asNumber(row[4]);
    if (!Number.isFinite(diff)) continue;

    timestamps[ts] = true;

    if (!byMajor[major]) {
      byMajor[major] = [];
    }
    byMajor[major].push(diff);
  }

  var majors = [];
  for (var m in byMajor) {
    if (!byMajor.hasOwnProperty(m)) continue;
    var diffs = byMajor[m];
    majors.push({
      major: m,
      avgDiff: round(median(diffs), 1),
      count: diffs.length,
    });
  }

  return jsonOutput({
    responseCount: Object.keys(timestamps).length,
    majors: majors,
    generatedAt: new Date().toISOString(),
  });
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function getOrCreatePrimingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PRIMING_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PRIMING_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(PRIMING_HEADERS);
  }
  return sheet;
}

function readRows() {
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values
    .slice(1)
    .map(row => ({
      dScore: asNumber(row[1]),
      meanCongruentMs: asNumber(row[2]),
      meanIncongruentMs: asNumber(row[3]),
      // Cell medians (columns 6-9) are absent on rows submitted before this
      // change; asNumber() yields null and the per-cell stats skip them.
      maleBoss: asNumber(row[6]),
      femaleCare: asNumber(row[7]),
      femaleBoss: asNumber(row[8]),
      maleCare: asNumber(row[9]),
    }))
    .filter(row =>
      Number.isFinite(row.dScore) &&
      Number.isFinite(row.meanCongruentMs) &&
      Number.isFinite(row.meanIncongruentMs)
    );
}

// Per-cell class summary: median + interquartile range across students, plus how
// many students contributed a value for that cell.
function cellStats(rows) {
  var out = {};
  for (var c = 0; c < CELL_KEYS.length; c++) {
    var key = CELL_KEYS[c];
    var vals = [];
    for (var i = 0; i < rows.length; i++) {
      if (Number.isFinite(rows[i][key])) vals.push(rows[i][key]);
    }
    out[key] = {
      median: round(median(vals), 1),
      p25: round(quantile(vals, 0.25), 1),
      p75: round(quantile(vals, 0.75), 1),
      count: vals.length,
    };
  }
  return out;
}

function emptyCellStats() {
  var out = {};
  for (var c = 0; c < CELL_KEYS.length; c++) {
    out[CELL_KEYS[c]] = { median: null, p25: null, p75: null, count: 0 };
  }
  return out;
}

// Linear-interpolation quantile (same convention as most stats packages).
function quantile(values, q) {
  var valid = values.filter(function(v) { return Number.isFinite(v); });
  if (valid.length === 0) return NaN;
  valid.sort(function(a, b) { return a - b; });
  if (valid.length === 1) return valid[0];
  var pos = (valid.length - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;
  return valid[base + 1] !== undefined
    ? valid[base] + rest * (valid[base + 1] - valid[base])
    : valid[base];
}

function median(values) {
  var valid = values.filter(function(v) { return Number.isFinite(v); });
  if (valid.length === 0) return NaN;
  valid.sort(function(a, b) { return a - b; });
  var mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 1) return valid[mid];
  return (valid[mid - 1] + valid[mid]) / 2;
}

function round(value, digits) {
  if (!Number.isFinite(value)) return null;
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function asNumber(value) {
  // Treat blank cells as missing, not 0. Rows submitted before the cell columns
  // existed have empty strings there once the sheet grows those columns, and
  // Number('') is 0 (finite) — which would wrongly count old rows as 0 ms and
  // flatten every per-cell median. null makes cellStats() skip them instead.
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
