function postEventsForDate_(date) {
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet, data, lastRow, maxRows;
  var table

	var calendar, list_eventos, evento;
	var value, tags;
	var card;
	var a, i, j, k;

	calendar = getFinancialCalendar_();
	if (!calendar) return;

	list_eventos = calendar.getEventsForDay(date);
	if (list_eventos.length == 0) return;

	list_eventos = calendarDigestListEvents_(list_eventos);

	const mm = date.getMonth();
	const dd = date.getDate();

  const dec_p = getSpreadsheetSettings_("decimal_separator");
	const num_acc = getConstProperties_('number_accounts');

	data = [ ];
	for (k = 0; k < 1 + num_acc; k++) {
		data.push({data: [ ], value: [ ]});
	}

  const cards = {
    table: [],
    values: []
  }

	for (i = 0; i < list_eventos.length; i++) {
		evento = list_eventos[i];

		if (evento.Description == "") continue;
		if (evento.hasAtMute) continue;

    if ( !isNaN(evento.Value) ) value = evento.Value;
		else if (evento.Tags.length > 0) value = 0;
		else continue;
    value = numberFormatLocaleSignal.call(value, dec_p);

    if (evento.Tags.length > 0) tags = '#' + evento.Tags.join(' #')
    else tags = '';

		if (evento.Table !== -1) {
      k = evento.Table;
			data[k].data.push([ dd, evento.Title, "", tags ]);
			data[k].value.push(value);
		} else if (evento.Card !== -1) {
      card = evento.Card;
			cards.table.push([ dd, evento.Title, card, "", tags ]);
			cards.values.push(value);
		} else {
      continue
    }
	}

	if (cards.table.length > 0) {
		sheet = spreadsheet.getSheetByName("Cards");
  }
	if (sheet) {
    maxRows = sheet.getMaxRows()
    lastRow = sheet.getLastRow()

    if (maxRows < lastRow + cards.table.length) {
      addBlankRows_('Cards')
      maxRows += 400
    }

    if (lastRow < 6) {
      i = 0
      table = cards.table
    } else {
      table = sheet.getRange(6, 1 + 6*mm, lastRow - 5, 5).getValues()

      i = 0
      while (i < table.length && table[i][3] !== '') { i++ }
      if (i < table.length) {
        table.splice.apply(table, [i, 0].concat(cards.table))
      } else {
        table = table.concat(cards.table)
      }
    }

    sheet.getRange(6, 1 + 6*mm, table.length, 5).setValues(table)
    value = transpose([ cards.values ]);
    sheet.getRange(6 + i, 4 + 6*mm, value.length, 1).setFormulas(value);
	}

	sheet = spreadsheet.getSheetByName(MN_SHORT[mm]);
	if (!sheet) return;
	if (sheet.getMaxRows() < 4) return;

  lastRow = sheet.getLastRow();
	for (k = 0; k < 1 + num_acc; k++) {
		if (data[k].data.length == 0) continue;

    if (lastRow < 5) {
      i = 0
      table = data[k].data
    } else {
      table = sheet.getRange(5, 1 + 5*k, lastRow - 4, 4).getValues()

      i = 0
      while (i < table.length && table[i][2] !== '') { i++ }
      if (i < table.length) {
        table.splice.apply(table, [i, 0].concat(data[k].data))
      } else {
        table = table.concat(data[k].data)
      }
    }

    sheet.getRange(5, 1 + 5*k, table.length, 4).setValues(table)
    value = transpose([ data[k].value ]);
    sheet.getRange(5 + i, 3 + 5*k, value.length, 1).setFormulas(value);
	}
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



function monthly_TreatLayout_(yyyy, mm) {
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
