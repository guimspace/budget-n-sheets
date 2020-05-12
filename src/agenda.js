function calendarDigestListEvents_(listEvents) {
	var evento, description;
	var output, translation, regexp, match;
	var list_acc, list, cell, s, i, j;

	output = [ ];
	regexp = {
		accounts: "",
		cards: 0
	};

	const dec_p = getSpreadsheetSettings_("decimal_separator");
	const db_tables = getDbTables_();

	list_acc = db_tables.accounts.names;
	list_acc.splice(0, 0, "Wallet");

	list = list_acc.slice();
	list.sort(function(a, b) {
	  return b.length - a.length;
	});

	s = list.join('|');
	s = '(' + s + ')';

	regexp.accounts = new RegExp(s, 'g');

	if (db_tables.cards.count > 0) {
		list = db_tables.cards.codes.slice();

		list.sort(function(a, b) {
		  return b.length - a.length;
		});

		s = list.join('|');
		s = '(' + s + ')';

		regexp.cards = new RegExp(s, 'g');
	}

	for (i = 0; i < listEvents.length; i++) {
		evento = listEvents[i];

		description = evento.getDescription();
		if (description == "") continue;

		cell = {
			Id: evento.getId(),
			Day: evento.getStartTime().getDate(),
			Title: evento.getTitle(),
			Description: description,
			Table: -1,
			Card: -1,
			Value: 0,
			TranslationType: "",
			TranslationNumber: 0,
			Tags: [ ],
			hasAtMute: true,
			hasQcc: false,
			isRecurring: evento.isRecurringEvent()
		};

		match = cell.Description.match(regexp.accounts);
		if (match) {
			cell.Table = list_acc.indexOf(match[0]);
		}

		if (db_tables.cards.count > 0) {
			match = cell.Description.match(regexp.cards);
			if (match) {
				cell.Card = match[0];
			}
		}

		if (cell.Table === -1 && cell.Card === -1) continue;

		cell.hasAtMute = /@(ign|mute)/.test(cell.Description);
		cell.hasQcc = /#qcc/.test(cell.Description);

		if (dec_p) {
			cell.Value = cell.Description.match( /-?\$[\d]+\.[\d]{2}/ );
		} else {
			cell.Value = cell.Description.match( /-?\$[\d]+,[\d]{2}/ );
			if (cell.Value) cell.Value[0] = cell.Value[0].replace(",", ".");
		}

		if (cell.Value) cell.Value = Number(cell.Value[0].replace("\$", ""));
		else cell.Value = NaN;

		translation = cell.Description.match( /@(M(\+|-)(\d+)|Avg|Total)/ );
		if (translation) {
			if (translation[1] == "Total" || translation[1] == "Avg") {
				cell.TranslationType = translation[1];
			} else {
				cell.TranslationType = "M";
				cell.TranslationNumber = Number(translation[2] + translation[3]);
			}
		}

		cell.Tags = cell.Description.match(/#\w+/g);
		if (!cell.Tags) cell.Tags = [ ];
		else {
			for (j = 0; j < cell.Tags.length; j++) {
				cell.Tags[j] = cell.Tags[j].slice(1);
			}
		}

		output.push(cell);
	}

	return output;
}


function getAllOwnedCalendars() {
	var calendars;
	var db_calendars;
	var digest, id, name, i;

	try {
		calendars = CalendarApp.getAllCalendars();
	} catch (err) {
		consoleLog_('warn', '', err);
		calendars = [ ];
	}

	try {
		if (calendars.length == 0) {
			calendars = CalendarApp.getAllOwnedCalendars();
		}
	} catch (err) {
		consoleLog_('warn', '', err);
		calendars = [ ];
	}

	db_calendars = {
		name: [ ],
		id: [ ],
		md5: [ ]
	};

	for (i = 0; i < calendars.length; i++) {
		id = calendars[i].getId();
		digest = computeDigest("MD5", id, "UTF_8");
		digest = digest.substring(0, 12);

		name = calendars[i].getName();
		if (! calendars[i].isOwnedByMe()) name += " *";

		db_calendars.name[i] = name;
		db_calendars.id[i] = id;
		db_calendars.md5[i] = digest;
	}

	return db_calendars;
}


function getFinancialCalendar_() {
	var financial_calendar = getUserSettings_('financial_calendar');
	var calendar;

	calendar = CalendarApp.getCalendarById(financial_calendar);

	if (calendar) return calendar;

	setUserSettings_('financial_calendar', '');
	setUserSettings_('post_day_events', false);
	setUserSettings_('cash_flow_events', false);
}


function getCalendarEventsForCashFlow_(financial_year, mm) {
	var calendar, eventos;
	var today;
	var a, b, x;

	today = DATE_NOW;
	b = new Date(financial_year, mm + 1, 1);

	if (! getUserSettings_("cash_flow_events")
				|| today.getTime() >= b.getTime()) return [ ];

	calendar = getFinancialCalendar_();
	if (!calendar) return [ ];

	a = new Date(financial_year, mm, 1);
	if (a.getTime() < today.getTime()) {
		a = new Date(financial_year, mm, today.getDate() + 1);
	}

	x = getSpreadsheetDate(a);
	a = a.getTime() + (a.getTime() - x.getTime());
	a = new Date(a);

	x = getSpreadsheetDate(b);
	b = b.getTime() + (b.getTime() - x.getTime());
	b = new Date(b);

	eventos = calendar.getEvents(a, b);
	if (!eventos) return [ ];

	eventos = calendarDigestListEvents_(eventos);
	return eventos;
}
