const SHEET_NAME = 'Responses';
const HEADERS = [
  'submitted_at',
  'd_score',
  'mean_congruent_ms',
  'mean_incongruent_ms',
  'interpretation',
  'app',
];

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
      const now = new Date();

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
      const sheet = getOrCreateSheet();

      sheet.appendRow([
        new Date(),
        asNumber(score.dScore),
        asNumber(score.meanCongruent),
        asNumber(score.meanIncongruent),
        String(score.interpretation || ''),
        app,
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
      generatedAt: new Date().toISOString(),
    });
  }

  const avgDScore = average(rows.map(row => row.dScore));
  const avgCongruentMs = average(rows.map(row => row.meanCongruentMs));
  const avgIncongruentMs = average(rows.map(row => row.meanIncongruentMs));
  const congruentFasterCount = rows.filter(
    row => row.meanCongruentMs < row.meanIncongruentMs
  ).length;

  return jsonOutput({
    count: rows.length,
    avgDScore: round(avgDScore, 3),
    avgCongruentMs: round(avgCongruentMs, 1),
    avgIncongruentMs: round(avgIncongruentMs, 1),
    congruentFasterPct: round((congruentFasterCount / rows.length) * 100, 1),
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
      avgDiff: round(average(diffs), 1),
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
    }))
    .filter(row =>
      Number.isFinite(row.dScore) &&
      Number.isFinite(row.meanCongruentMs) &&
      Number.isFinite(row.meanIncongruentMs)
    );
}

function average(values) {
  const valid = values.filter(v => Number.isFinite(v));
  if (valid.length === 0) return NaN;
  const total = valid.reduce((sum, value) => sum + value, 0);
  return total / valid.length;
}

function round(value, digits) {
  if (!Number.isFinite(value)) return null;
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function asNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
