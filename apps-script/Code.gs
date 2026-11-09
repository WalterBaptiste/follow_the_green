// FOLLOW THE GREEN — réception des événements dans Google Sheets.
// À coller dans Extensions > Apps Script depuis le Google Sheet qui doit stocker les données.

const SHEET_EVENTS = 'events';

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = (e && e.parameter) || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_EVENTS) || initEvents_(ss);
    const known = ['game', 'sessionId', 'event', 't', 'place', 'route'];
    const rest = {};
    Object.keys(p).forEach(function (k) { if (known.indexOf(k) < 0) rest[k] = p[k]; });
    sheet.appendRow([new Date(), p.sessionId || '', p.event || '', Number(p.t) || 0, p.place || '', p.route || '', JSON.stringify(rest)]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('FOLLOW THE GREEN endpoint OK');
}

function initEvents_(ss) {
  const sheet = ss.insertSheet(SHEET_EVENTS);
  sheet.appendRow(['Reçu le', 'Session', 'Événement', 'Temps (s)', 'Lieu', 'Chemin', 'Détails (JSON)']);
  sheet.setFrozenRows(1);
  return sheet;
}

function count_(event, place, route) {
  let cond = 'events!C2:C="' + event + '"';
  if (place) cond += ',events!E2:E="' + place + '"';
  if (route) cond += ',events!F2:F="' + route + '"';
  return '=IFERROR(COUNTUNIQUE(FILTER(events!B2:B,' + cond + ')),0)';
}

// À lancer une fois à la main : crée l'onglet "stats" avec l'entonnoir (joueurs uniques par étape).
function setupStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_EVENTS)) initEvents_(ss);
  const sheet = ss.getSheetByName('stats') || ss.insertSheet('stats');
  sheet.clear();
  const steps = [
    ['Démarrage', count_('start')],
    ['Cour (après intro)', count_('location', 'courtyard')],
    ['Premier objet', count_('first_item')],
    ['Alcôve', count_('location', 'alcove')],
    ['Local technique', count_('location', 'local')],
    ['Tram', count_('location', 'tram')],
    ['Serre', count_('location', 'greenhouse')],
    ['Chemin lianes débloqué', count_('route', null, 'vines')],
    ['Chemin signal débloqué', count_('route', null, 'signal')],
    ['Chemin rails débloqué', count_('route', null, 'sewer')],
    ['Karmen Camina', count_('location', 'karmen')],
    ['Scène finale', count_('location', 'final')],
    ['Fin (profil affiché)', count_('end')],
    ['A utilisé le ?', count_('hint')],
    ['S\'est heurté à un blocage', count_('blocked')]
  ];
  sheet.appendRow(['ÉTAPE', 'JOUEURS UNIQUES', '% DES DÉMARRAGES']);
  steps.forEach(function (s, i) {
    sheet.appendRow([s[0], s[1], '=IFERROR(B' + (i + 2) + '/$B$2,0)']);
  });
  sheet.getRange(2, 3, steps.length, 1).setNumberFormat('0%');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 3);
}
