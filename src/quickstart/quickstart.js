function alertQuickstartSheetMissing (name) {
  SpreadsheetApp2.getUi().alert(
    "Can't show example",
    'Sheet "' + name + "\" couldn't be found.",
    SpreadsheetApp2.getUi().ButtonSet.OK);
}

function playSpeedQuickstart (id) {
  if (!isInstalled_()) return;

  const lock = LockService.getDocumentLock();
  try {
    lock.waitLock(200);
  } catch (err) {
    ConsoleLog.warn(err);
    SpreadsheetApp2.getActiveSpreadsheet().toast('The add-on is busy. Try again in a moment.', 'Budget n Sheets');
    return;
  }

  const channel = id.match(/([a-z_]+)(\d)/);
  if (!channel) throw new Error('playSpeedQuickstart(): No match found. ' + id);

  const job = channel[1];
  const n = Number(channel[2]);

  switch (job) {
    case 'blank_value':
      playQuickBlankValue_(n);
      break;
    case 'statements':
      playQuickStatements_(n);
      break;
    case 'cashflow':
      playQuickCashFlow_(n);
      break;
    case 'calendar':
      playQuickCalendar_(n);
      break;
    case 'transactions':
      playQuickTransactions_(n);
      break;
    case 'acc_cards':
      playQuickAccCards_(n);
      break;
    case 'tags':
      playQuickTags_(n);
      break;

    default:
      throw new Error('playSpeedQuickstart(): Switch case is default. ' + job);
  }

  SpreadsheetApp2.getActiveSpreadsheet().toast('Done.', 'Quickstart');
  lock.releaseLock();
}

function fillMonthWithZeros (sheet) {
  let lastRow;
  let i, k;

  lastRow = sheet.getLastRow();
  if (lastRow < 5) return;

  lastRow -= 4;
  const values = sheet.getRange(5, 1, lastRow, 10).getValues();

  let n = 0;
  const list = [];

  for (k = 0; k < 2; k++) {
    i = lastRow - 1;
    while (i > -1 && values[i][2 + 5 * k] === '') { i--; }

    while (i > -1) {
      if (values[i][2 + 5 * k] === '') {
        list[n] = rollA1Notation(5 + i, 3 + 5 * k);
        n++;
      }
      i--;
    }
  }

  if (list.length > 0) sheet.getRangeList(list).setValue(0);
  SpreadsheetApp.flush();
}

function fillCardWithZeros (sheet, col) {
  let lastRow;
  let i, k;

  lastRow = sheet.getLastRow();
  if (lastRow < 6) return;

  lastRow -= 5;
  const values = sheet.getRange(6, col, lastRow, 18).getValues();
  col += 3;

  let n = 0;
  const list = [];

  for (k = 0; k < 3; k++) {
    i = lastRow - 1;
    while (i > -1 && values[i][3 + 6 * k] === '') { i--; }

    while (i > -1) {
      if (values[i][3 + 6 * k] === '') {
        list[n] = rollA1Notation(6 + i, col + 6 * k);
        n++;
      }
      i--;
    }
  }

  if (list.length > 0) sheet.getRangeList(list).setValue(0);
  SpreadsheetApp.flush();
}
