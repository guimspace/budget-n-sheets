function resumeActivity_ (mm) {
  const formulasBuild = FormulaBuild.backstage();
  const formulasWallet = formulasBuild.wallet();
  const formulasAcc = formulasBuild.accounts();
  const formulasCards = formulasBuild.cards();

  const h_ = TABLE_DIMENSION.height;
  const w_ = TABLE_DIMENSION.width;

  const list1 = [];
  const list2 = [];
  const list3 = [];
  const list4 = [];

  const values = ['C5:C', 'H5:H', 'M5:M', 'R5:R', 'W5:W', 'AB5:AB'];
  const tags = ['D5:D', 'I5:I', 'N5:N', 'S5:S', 'X5:X', 'AC5:AC'];
  const combo = ['C5:D404', 'H5:I404', 'M5:N404', 'R5:S404', 'W5:X404', 'AB5:AC404'];
  const balance1 = ['G2', 'L2', 'Q2', 'V2', 'AA2', 'G12', 'L12', 'Q12', 'V12', 'AA12', 'G22', 'L22', 'Q22', 'V22', 'AA22', 'G32', 'L32', 'Q32', 'V32', 'AA32', 'G42', 'L42', 'Q42', 'V42', 'AA42', 'G52', 'L52', 'Q52', 'V52', 'AA52', 'G62', 'L62', 'Q62', 'V62', 'AA62', 'G72', 'L72', 'Q72', 'V72', 'AA72', 'G82', 'L82', 'Q82', 'V82', 'AA82', 'G92', 'L92', 'Q92', 'V92', 'AA92', 'G102', 'L102', 'Q102', 'V102', 'AA102', 'G112', 'L112', 'Q112', 'V112', 'AA112'];
  const balance2 = ['0', '0', '0', '0', '0', 'G3', 'L3', 'Q3', 'V3', 'AA3', 'G13', 'L13', 'Q13', 'V13', 'AA13', 'G23', 'L23', 'Q23', 'V23', 'AA23', 'G33', 'L33', 'Q33', 'V33', 'AA33', 'G43', 'L43', 'Q43', 'V43', 'AA43', 'G53', 'L53', 'Q53', 'V53', 'AA53', 'G63', 'L63', 'Q63', 'V63', 'AA63', 'G73', 'L73', 'Q73', 'V73', 'AA73', 'G83', 'L83', 'Q83', 'V83', 'AA83', 'G93', 'L93', 'Q93', 'V93', 'AA93', 'G103', 'L103', 'Q103', 'V103', 'AA103'];

  let formula, width;

  const spreadsheet = SpreadsheetApp2.getActiveSpreadsheet();
  const sheetBackstage = spreadsheet.getSheetByName('_Backstage');
  if (!sheetBackstage) return;

  const month = spreadsheet.getSheetByName(MONTH_NAME.short[mm]);
  if (!month) return;
  const max1 = month.getMaxRows();
  if (max1 < 5) return;

  const sheetCards = spreadsheet.getSheetByName('Cards');
  if (!sheetCards) return;
  const max2 = sheetCards.getMaxRows() - 5;
  if (max2 < 1) return;

  const num_acc = getConstProperties_('number_accounts');
  const actual_month = getMonthFactored_('actual_month');

  const db_accounts = getDbTables_('accounts');
  const db_cards = getDbTables_('cards');

  const col = 2 + w_ + w_ * num_acc + w_;

  for (let i = 0; i < 6; i++) {
    values[i] += max1;
    tags[i] += max1;
  }

  const accounts = new Array(h_);
  const cards = new Array(h_);

  width = w_ * num_acc;
  for (let i = 0; i < h_; i++) {
    accounts[i] = new Array(width).fill(null);
  }

  width = 10 * w_;
  for (let i = 0; i < h_; i++) {
    cards[i] = new Array(width).fill(null);
  }

  formula = formulasWallet.bsblank(mm, values[0]);
  sheetBackstage.getRange(2 + h_ * mm, 6).setFormula(formula);

  formula = formulasWallet.expenses_ign(max1 - 4, mm, rollA1Notation(2 + h_ * mm, 6));
  sheetBackstage.getRange(4 + h_ * mm, 2).setFormula(formula);

  let income = '0';
  let expenses = '0';

  for (let k = 0; k < num_acc; k++) {
    const bsblank = rollA1Notation(2 + h_ * mm, 11 + w_ * k);

    income += ' + ' + rollA1Notation(6 + h_ * mm, 8 + w_ * k);
    expenses += ' + ' + rollA1Notation(4 + h_ * mm, 7 + w_ * k);

    accounts[0][w_ * k] = '=' + balance2[5 * mm + k];
    accounts[0][1 + w_ * k] = formulasAcc.bsreport(mm, tags[1 + k], combo[1 + k], bsblank);
    accounts[0][4 + w_ * k] = formulasAcc.bsblank(mm, values[1 + k]);
    accounts[1][w_ * k] = formulasAcc.balance(mm, values[1 + k], balance1[5 * mm + k], bsblank);
    accounts[2][w_ * k] = formulasAcc.expenses_ign(mm, values[1 + k], tags[1 + k], bsblank);
  }

  sheetBackstage.getRange(3 + h_ * mm, 2).setFormula(income);
  sheetBackstage.getRange(5 + h_ * mm, 2).setFormula(expenses);
  sheetBackstage.getRange(2 + h_ * mm, 7, h_, w_ * num_acc).setFormulas(accounts);
  sheetBackstage.getRangeList([
    rollA1Notation(6 + h_ * mm, 2),
    rollA1Notation(7 + h_ * mm, 2)
  ]).setFormulaR1C1('R[-2]C[' + (col - w_ - 2) + ']');
  SpreadsheetApp.flush();

  for (let k = 0; k < num_acc; k++) {
    const rangeList = [];

    for (let i = 1 + mm; i < actual_month; i++) {
      rangeList[i - 1 - mm] = rollA1Notation(2 + h_ * i, 2 + w_ + w_ * k);

      const bsblank = rollA1Notation(2 + h_ * i, 11 + w_ * k);

      formula = formulasAcc.balance(i, values[1 + k], balance1[5 * i + k], bsblank);
      sheetBackstage.getRange(3 + h_ * i, 2 + w_ + w_ * k).setFormula(formula);
    }

    if (rangeList.length > 0) {
      sheetBackstage.getRangeList(rangeList).setFormulaR1C1('R[-' + (h_ - 1) + ']C');
    }
  }

  for (let k = 0; k < num_acc; k++) {
    const account = db_accounts.data[k];
    if (account.time_a < mm) continue;

    formula = '=' + FormatNumber.localeSignal(account.balance);
    sheetBackstage.getRange(2 + h_ * account.time_a, 2 + w_ + w_ * k).setFormula(formula);
  }

  formula = 'RC[' + w_ + ']';
  for (let k = 2; k <= 10; k++) {
    formula += ' + RC[' + w_ * k + ']';
  }
  sheetBackstage.getRange(3 + h_ * mm, col - w_, 4, 1).setFormulaR1C1(formula);

  formula = formulasCards.bsblank(max2, mm);
  sheetBackstage.getRange(2 + h_ * mm, 4 + col - w_).setFormula(formula);

  for (let k = 0; k < 10; k++) {
    const regex = rollA1Notation(1, col + w_ * k);
    const bsblank = rollA1Notation(2 + h_ * mm, 4 + col + w_ * k);

    cards[1][w_ * k] = formulasCards.credit(max2, mm, regex, bsblank);
    cards[2][w_ * k] = formulasCards.expenses_ign(max2, mm, regex, bsblank);
    cards[3][w_ * k] = formulasCards.expenses(max2, mm, regex, bsblank);
    cards[3][1 + w_ * k] = formulasCards.bscardpart(max2, mm, rollA1Notation(1, col + w_ * k), bsblank);

    list1[k] = rollA1Notation(6 + h_ * mm, col + w_ * k);
    list2[k] = rollA1Notation(6 + h_ * mm, 1 + col + w_ * k);
    list3[k] = rollA1Notation(3 + h_ * mm, 1 + col + w_ * k);
    list4[k] = rollA1Notation(2 + h_ * mm, 4 + col + w_ * k);
  }

  sheetBackstage.getRange(2 + h_ * mm, col, h_, 10 * w_).setFormulas(cards);

  sheetBackstage.getRangeList(list1).setFormulaR1C1('R[-1]C + R[-3]C');
  sheetBackstage.getRangeList(list2).setFormulaR1C1('R[-1]C + R[-4]C + RC[-1]');
  sheetBackstage.getRangeList(list3).setFormulaR1C1('MIN(R[-1]C; R[-1]C - R[3]C)');
  sheetBackstage.getRangeList(list4).setFormula(rollA1Notation(2 + h_ * mm, 4 + col - w_));
  SpreadsheetApp.flush();

  for (let k = 0; k < db_cards.count; k++) {
    const formula = '=' + FormatNumber.localeSignal(db_cards.data[k].limit);
    sheetBackstage.getRange(2 + h_ * mm, 1 + col + w_ * k).setFormula(formula);
  }

  let status = getSpreadsheetSettings_('optimize_load');
  if (status == null) status = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  status[mm] = 0;
  setSpreadsheetSettings_('optimize_load', status);
}
