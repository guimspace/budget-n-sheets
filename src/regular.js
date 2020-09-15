function postEventsForDate_(date) {
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet;

	var calendar, list_eventos, evento;
	var value, tags;
	var c1, a, c, i, j, k;

	calendar = getFinancialCalendar_();
	if (!calendar) return;
	list_eventos = calendar.getEventsForDay(date);
	if (list_eventos.length == 0) return;
	list_eventos = calendarDigestListEvents_(list_eventos);

	const mm = date.getMonth();
	const dd = date.getDate();

  const dec_p = getSpreadsheetSettings_('decimal_separator');
	const num_acc = getConstProperties_('number_accounts') + 1;

	const accounts = [ ];
	for (k = 0; k < num_acc; k++) {
		accounts[k] = {
      table: [],
      values: []
    };
	}

  const cards_balances = getTablesService_('cardsbalances');
  const hasCards = (cards_balances && cards_balances !== 1);

  c1 = 0;
  const cards = {
    table: [],
    values: []
  };

  i = -1;
  while (++i < list_eventos.length) {
		evento = list_eventos[i];

		if (evento.Description === '') continue;
		if (evento.hasAtMute) continue;

    if (!isNaN(evento.Value)) {
      value = evento.Value;
    } else if (hasCards && evento.hasQcc) {
      if (evento.Card !== -1) {
        c = cards_balances.cards.indexOf(evento.Card);
        if (c === -1) continue;
      } else {
        c = 0;
      }

      if (evento.TranslationType === 'M' &&
          mm + evento.TranslationNumber >= 0 &&
          mm + evento.TranslationNumber <= 11) {
        value = +cards_balances.balance[c][mm + evento.TranslationNumber].toFixed(2);
      } else if (mm > 0) {
        value = +cards_balances.balance[c][mm - 1].toFixed(2);
      } else {
        value = 0;
      }
    } else if (evento.Tags.length > 0) {
      value = 0;
		} else {
      continue;
    }
    value = numberFormatLocaleSignal.call(value, dec_p);

    if (evento.Tags.length > 0) tags = '#' + evento.Tags.join(' #')
    else tags = '';

		if (evento.Table !== -1) {
      k = evento.Table;
			accounts[k].table.push([ dd, evento.Title, '', tags ]);
			accounts[k].values.push(value);
		} else if (evento.Card !== -1) {
			cards.table[c1] = [ dd, evento.Title, evento.Card, '', tags ];
			cards.values[c1] = value;
      c1++;
		}
	}

	if (cards.table.length > 0) {
		sheet = spreadsheet.getSheetByName("Cards");
    if (sheet) {
      mergeEventsInTable_(sheet, cards, 6, 1 + 6*mm, 5, 3);
    }
  }

	sheet = spreadsheet.getSheetByName(MN_SHORT[mm]);
	if (!sheet) return;

	for (k = 0; k < num_acc; k++) {
		if (accounts[k].table.length === 0) continue;
    mergeEventsInTable_(sheet, accounts[k], 5, 1 + 5*k, 4, 2);
	}
}

function mergeEventsInTable_ (sheet, data, row, offset, width, col) {
  var lastRow = sheet.getLastRow();
  var table, value, i;

  if (sheet.getMaxRows() < lastRow + data.table.length) {
    addBlankRows_(sheet.getName());
  }

  if (lastRow < row) {
    i = 0;
    table = data.table;
  } else {
    table = sheet.getRange(row, offset, lastRow - row + 1, width).getValues();

    i = 0;
    while (i < table.length && table[i][col] !== '') { i++; }
    if (i < table.length) {
      table.splice.apply(table, [i, 0].concat(data.table));
    } else {
      table = table.concat(data.table);
    }
  }

  sheet.getRange(row, offset, table.length, width).setValues(table);

  value = transpose([data.values]);
  sheet.getRange(row + i, offset + col, value.length, 1).setFormulas(value);
}


function updateDecimalSeparator_() {
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet, cell, v, t;

	sheet = spreadsheet.getSheetByName("_Settings");
	if (!sheet) {
		sheet = spreadsheet.insertSheet();
		t = true;
	}

	cell = sheet.getRange(8, 2);

	cell.setNumberFormat("0.0");
	cell.setValue(0.1);
	SpreadsheetApp.flush();

	cell = cell.getDisplayValue();
	v = /\./.test(cell);

	if (t) spreadsheet.deleteSheet(sheet);

	setSpreadsheetSettings_("decimal_separator", v);
	setSpreadsheetSettings_("spreadsheet_locale", spreadsheet.getSpreadsheetLocale());
}



function treatLayout_(yyyy, mm) {
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var financial_year = getConstProperties_('financial_year');
	var sheets;
	var month, i;

	if (financial_year > yyyy) return; // Too soon to format the spreadsheet.
	else if (financial_year < yyyy) mm = 0; // Last time to format the spreadsheet.

	sheets = [ ];
	for (i = 0; i < 12; i++) {
		sheets[i] = spreadsheet.getSheetByName(MN_SHORT[i]);
	}

	if (mm === 0) {
		if (yyyy === financial_year) month = 0;
		else month = 11;
	} else {
		month = mm - 1;
	}

	updateHideShowSheets(sheets, financial_year, yyyy, mm);
	updateTabsColors(sheets, financial_year, yyyy, mm);
	formatAccounts_(month);
	formatCards_(month);
}


function updateHideShowSheets(sheets, financial_year, yyyy, mm) {
	var delta;

	if (mm === 0) {
		if (yyyy === financial_year) {
			for (i = 0; i < 4; i++) {
				if (sheets[i]) sheets[i].showSheet();
			}
			for (; i < 12; i++) {
				if (sheets[i]) sheets[i].hideSheet();
			}
		} else {
			for (i = 0; i < 12; i++) {
				if (sheets[i]) sheets[i].showSheet();
			}
		}
	} else {
		delta = getMonthDelta(mm);

		for (i = 0; i < 12; i++) {
			if (i < mm + delta[0] || i > mm + delta[1]) {
				if (sheets[i]) sheets[i].hideSheet();
			} else {
				if (sheets[i]) sheets[i].showSheet();
			}
		}
	}
}


function updateTabsColors(sheets, financial_year, yyyy, mm) {
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var date, delta, i;

	const init_month = getUserSettings_("initial_month");

	if (!sheets) {
		date = getSpreadsheetDate.call(DATE_NOW);
		yyyy = date.getFullYear();
		mm = date.getMonth();

		sheets = [ ];
		for (i = 0; i < 12; i++) {
			sheets[i] = spreadsheet.getSheetByName(MN_SHORT[i]);
		}

		financial_year = getConstProperties_("financial_year");
	}

	for (i = 0; i < init_month; i++) {
		if (sheets[i]) sheets[i].setTabColor('#b7b7b7');
	}

	if (financial_year === yyyy) {
		delta = getMonthDelta(mm);

		for (; i < 12; i++) {
			if (i < mm + delta[0] || i > mm + delta[1]) {
				if (sheets[i]) sheets[i].setTabColor('#a4c2f4');
			} else {
				if (sheets[i]) sheets[i].setTabColor('#3c78d8');
			}
		}

		if (sheets[mm]) sheets[mm].setTabColor('#6aa84f');
	} else {
		for (; i < 12; i++) {
			if (sheets[i]) sheets[i].setTabColor('#a4c2f4');
		}
	}
}
