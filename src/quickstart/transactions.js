const QUICKSTART_DATA_TRANSACTIONS = Object.freeze({
  1: [[7, 'Deposit (to my account #dp)', null, '#dp']],
  2: [[7, 'Transfer (from someone #trf)', null, '#trf']],
  3: [[7, 'Transfer (to someone #trf)', null, '#trf']],
  4: [[7, 'Withdrawal (cash dispenser #wd)', null, '#wd']]
});

function playQuickTransactions_ (n) {
  const data = QUICKSTART_DATA_TRANSACTIONS[n];
  if (!data) throw new Error("Values for quickstart example couldn't be found. transactions " + n);

  switch (n) {
    case 1:
      data[0][2] = randomValue(3, 2);
      break;
    case 2:
      data[0][2] = randomValue(3, 2);
      break;
    case 3:
      data[0][2] = randomValueNegative(3, 2);
      break;
    case 4:
      data[0][2] = randomValueNegative(3, 2);
      break;

    default:
      throw new Error('playQuickTransactions_(): Switch case is default. ' + n);
  }

  const name = (getConstProperties_('financial_year') === DATE_NOW.getFullYear() ? MONTH_NAME.short[DATE_NOW.getMonth()] : MONTH_NAME.short[0]);
  const spreadsheet = SpreadsheetApp2.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    alertQuickstartSheetMissing(name);
    return;
  }

  spreadsheet.setActiveSheet(sheet);
  let lastRow = sheet.getLastRow();
  if (lastRow < 4) lastRow = 4;

  if (sheet.getMaxRows() < lastRow + data.length) toolPicker_('AddBlankRows', sheet.getName());

  sheet.getRange(lastRow + 1, 6, data.length, data[0].length)
    .setValues(data)
    .activate();

  SpreadsheetApp.flush();
  fillMonthWithZeros(sheet);
}
