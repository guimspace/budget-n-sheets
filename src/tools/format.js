function validateFormatRegistry_ () {
  const range = SpreadsheetApp.getActiveRange();
  const name = range.getSheet().getSheetName();

  if (name === 'Tags') {
    formatTags_();
  } else if (name === 'Cards') {
    let mm = range.getColumn();
    mm = (mm - (mm % 6)) / 6;
    formatCards_(mm);
  } else {
    const mm = MONTH_NAME.short.indexOf(name);

    if (mm === -1) {
      SpreadsheetApp2.getUi().alert(
        "Can't sort registry",
        'Select a month, Cards or Tags to sort the registry.',
        SpreadsheetApp2.getUi().ButtonSet.OK);
      return;
    }

    formatAccounts_(mm);
  }
}

function formatTags_ () {
  const sheet = SpreadsheetApp2.getActiveSpreadsheet().getSheetByName('Tags');
  if (!sheet) return;

  const maxRows = sheet.getMaxRows() - 1;
  if (maxRows < 1) return;

  sheet.getRange(2, 1, maxRows, 5).sort([
    { column: 2, ascending: true },
    { column: 1, ascending: true }
  ]);
  sheet.getRange(2, 4, maxRows, 1).insertCheckboxes();
  SpreadsheetApp.flush();
}

function formatAccounts_ (mm) {
  const sheet = SpreadsheetApp2.getActiveSpreadsheet().getSheetByName(MONTH_NAME.short[mm]);
  let date2;
  let table;
  let cc, i, k;

  const w_ = TABLE_DIMENSION.width;
  const num_acc = getConstProperties_('number_accounts');

  if (!sheet) return;
  if (sheet.getMaxColumns() < 5 + 5 * num_acc) return;

  const lastRow = sheet.getLastRow() - 4;
  if (lastRow < 1) return;

  sheet.showRows(5, lastRow);

  const snapshot = sheet.getRange(5, 1, lastRow, w_ * (1 + num_acc)).getValues();

  for (k = 0; k < 1 + num_acc; k++) {
    i = 0;
    cc = w_ * k;
    while (i < lastRow && snapshot[i][2 + cc] !== '') { i++; }

    if (i === 0) continue;
    const numRows = i;

    range = sheet.getRange(5, 1 + cc, numRows, 4);

    range.sort([
      { column: (1 + cc), ascending: true },
      { column: (3 + cc), ascending: true }
    ]);

    i = 0;
    table = range.getValues();
    while (i < numRows && table[i][0] < 0) { i++; }

    if (i > 1) sheet.getRange(5, 1 + cc, i, 4).sort({ column: 1 + cc, ascending: false });
  }

  const date1 = DATE_NOW.getTime();
  date2 = getConstProperties_('financial_year');
  date2 = new Date(date2, mm + 1, 0).getTime();

  const numRows = sheet.getMaxRows();
  if (lastRow + 4 < numRows && date2 < date1) sheet.hideRows(lastRow + 5, numRows - lastRow - 4);
}

function formatCards_ (mm) {
  const w_ = 6;

  const sheet = SpreadsheetApp2.getActiveSpreadsheet().getSheetByName('Cards');
  if (!sheet) return;

  const numRows = sheet.getLastRow() - 5;
  if (numRows < 1) return;

  let range = sheet.getRange(6, 4 + w_ * mm, numRows, 1);
  const snapshot = range.getValues();

  let i = 0;
  while (i < snapshot.length && snapshot[i][0] !== '') { i++; }
  if (i === 0) return;

  range = range.offset(0, -3, i, 5);
  sortCardsRange_(sheet, range);
}

function sortCardsRange_ (sheet, range) {
  const col = range.getColumn() - 1;

  range.sort([
    { column: (3 + col), ascending: true },
    { column: (1 + col), ascending: true },
    { column: (4 + col), ascending: true }
  ]);

  const snapshot = range.getValues();

  let i = 0;
  let j = 0;
  let num = 0;
  while (i < snapshot.length) {
    const card = snapshot[i][2];

    num = j;
    while (j < snapshot.length && snapshot[j][2] === card && snapshot[j][0] < 0) { j++; }

    num = j - num;
    if (num > 1) sheet.getRange(6 + i, 1 + col, num, 5).sort({ column: 1 + col, ascending: false });

    while (j < snapshot.length && snapshot[j][2] === card) { j++; }
    i = j;
  }
}
