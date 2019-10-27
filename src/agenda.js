function optCalendar_ProcessRawEvents_(listEvents) {
  var list, cell,
      thisEvent;
  // var OnlyEventsOwned = getUserSettings_('OnlyEventsOwned');
  var regExp_Account, regExp_Card, code_Card;
  var output, translation;
  var s, i, j;

  output = [ ];
  code_Card = [ ];
  regExp_Card = [ ];
  regExp_Account = [ new RegExp('Wallet') ];

  list = optTable_GetList_();
  for(i = 0;  i < list.length;  i++) {
    if(list[i].Type === "Account") {
      s = new RegExp(list[i].Name);
      regExp_Account.push(s);
    } else {
      s = new RegExp(list[i].Code);
      regExp_Card.push(s);
      code_Card.push(list[i].Code);
    }
  }


  for(i = 0;  i < listEvents.length;  i++) {
    // if(OnlyEventsOwned  &&  !listEvents[i].isOwnedByMe()) continue;
    thisEvent = listEvents[i];

    cell = {
      Id: thisEvent.getId(),
      Day: thisEvent.getStartTime().getDate(),
      Title: thisEvent.getTitle(),
      Description: thisEvent.getDescription(),
      Table: -1,
      Card: -1,
      Value: 0,
      TranslationType: "",
      TranslationNumber: 0,
      Tags: [ ],
      hasAtIgn: true,
      hasQcc: false
    };


    cell.hasAtIgn = /@ign/.test(cell.Description);
    cell.hasQcc = /#qcc/.test(cell.Description);

    if(PropertiesService.getDocumentProperties().getProperty("decimal_separator")) {
      cell.Value = cell.Description.match( /-?\$[\d]+\.[\d]{2}/ );
    } else {
      cell.Value = cell.Description.match( /-?\$[\d]+,[\d]{2}/ );
      if(cell.Value) cell.Value[0] = cell.Value[0].replace(",", ".");
    }

    translation = cell.Description.match( /@(M(\+|-)(\d+)|Avg|Total)/ );
    if(translation) {
      if(translation[1] == "Total"  || translation[1] == "Avg") {
        cell.TranslationType = translation[1];
      } else {
        cell.TranslationType = "M";
        cell.TranslationNumber = Number(translation[2] + translation[3]);
      }
    }

    if(cell.Value) cell.Value = Number(cell.Value[0].replace("\$", ""));
    else cell.Value = NaN;

    for(j = 0;  j < regExp_Account.length;  j++) {
      if( regExp_Account[j].test(cell.Description) ) {
        cell.Table = j;
        break;
      }
    }

    for(j = 0;  j < regExp_Card.length;  j++) {
      if( regExp_Card[j].test(cell.Description) ) {
        cell.Card = code_Card[j];
        break;
      }
    }

    cell.Tags = cell.Description.match(/#[\w]+/g);
    if(!cell.Tags) cell.Tags = [ ];
    else {
      for(j = 0;  j < cell.Tags.length;  j++) {
        cell.Tags[j] = cell.Tags[j].slice(1);
      }
    }

    output.push(cell);
  }

  return output;
}


function optCalendar_GetListOwned() {
  var list = CalendarApp.getAllOwnedCalendars();
  var calendars;
  var b, s, i;

  calendars = {
    Name: [ ],
    Id: [ ]
  };

  for(i = 0;  i < list.length;  i++) {
    calendars.Name.push( list[i].getName() );

		s = list[i].getId();
		s = computeDigest("SHA_1", s, "UTF_8");
    calendars.Id.push(s);
  }

  return calendars;
}


function optCalendar_GetCalendarFromSHA1_(sha1sum) {
  if(typeof sha1sum != "string") {
    console.warn("optCalendar_GetCalendarFromSHA1_(): Invalid parameter.", sha1sum);
    return;
  }

  var list = CalendarApp.getAllOwnedCalendars();
  var s, i;

  for(i = 0;  i < list.length;  i++) {
		s = list[i].getId();
		s = computeDigest("SHA_1", s, "UTF_8");

    if(s === sha1sum) return list[i];
  }

  setUserSettings_("FinancialCalendar", "");
  setUserSettings_("PostDayEvents", false);
  setUserSettings_("CashFlowEvents", false);
}


function calendarMuteEvents_(calendar, list) {
  var evento, description;
  // var OnlyEventsOwned = getUserSettings_("OnlyEventsOwned");
  var i;


  for(i = 0;  i < list.length;  i++) {
    evento = calendar.getEventById(list[i]);

    // if(OnlyEventsOwned  &&  !evento.isOwnedByMe()) continue;

    description = evento.getDescription();
    description += "\n\n\n@ign";

    evento.setDescription(description);
  }
}
