function toolShowSheets_() {
  optNavTools_("show");
}

function toolHideSheets_() {
  optNavTools_("hide");
}

function optNavTools_(p) {
  var lock = LockService.getDocumentLock();
  try {
    lock.waitLock(200);
  } catch(err) {
    SpreadsheetApp.getUi().alert(
      "Add-on is busy",
      "The add-on is busy. Try again in a moment.",
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  switch(p) {
    case "show":
      optTool_ShowSheets_();
      break;
    case "hide":
      optTool_HideSheets_();
      break;
    default:
      console.error("optNavTools_(): Switch case is default.", p);
      break;
  }
}


function toolAddBlankRows() {
  optMainTools_("AddBlankRows");
}

function toolUpdateCashFlow() {
  optMainTools_("UpdateCashFlow");
}

function toolFormatRegistry() {
  optMainTools_("FormatRegistry");
}

function optMainTools_(p, mm) {
  var lock = LockService.getDocumentLock();
  try {
    lock.waitLock(1000);
  } catch(err) {
    SpreadsheetApp.getUi().alert(
      "Add-on is busy",
      "The add-on is busy. Try again in a moment.",
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  switch(p) {
    case 'AddBlankRows':
      optTool_AddBlankRows_(mm);
      break;
    case 'UpdateCashFlow':
      optTool_UpdateCashFlow_(mm);
      break;
    case 'FormatRegistry':
      optTool_FormatRegistry_(mm);
      break;
    default:
      console.error("optMainTools_(): Switch case is default.", p);
      break;
  }
}


function optTool_HideSheets_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;
  var list = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
  var mm, i;

  mm = getSpreadsheetDate();
  mm = mm.getMonth();

  for(i = 0;  i < 12;  i++) {
    sheet = spreadsheet.getSheetByName(list[i]);
    if(!sheet) continue;

    if(i < mm - 1  ||  i > mm + 2) {
      spreadsheet.getSheetByName(list[i]).hideSheet();
    } else {
      spreadsheet.getSheetByName(list[i]).showSheet();
    }
  }
}


function optTool_ShowSheets_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;
  var list = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
  var i;

  for(i = 0;  i < 12;  i++) {
    sheet = spreadsheet.getSheetByName(list[i]);
    if(!sheet) continue;

    spreadsheet.getSheetByName(list[i]).showSheet();
  }
}


function optTool_AddBlankRows_(mm_) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(),
      sheet;
  var c;

  if(isNaN(mm_)) {
    sheet = SpreadsheetApp.getActiveSheet();
  } else if(mm_ >= 0  &&  mm_ < 12) {
    sheet = spreadsheet.getSheetByName(MN_SHORT_[mm_]);
  } else if(mm_ === 12) {
    sheet = spreadsheet.getSheetByName("Cards");
  } else {
    console.error("optTool_AddBlankRows_(): Internal error.", mm_);
    return;
  }

  if(!sheet) {
    showDialogErrorMessage();
    return;
  } else if(sheet.getSheetName() === "Cards") c = 5;
  else if(MN_SHORT_.indexOf(sheet.getSheetName()) !== -1) c = 4;
  else {
    SpreadsheetApp.getUi().alert(
      "Can't add rows",
      "Select a month or Cards to add rows.",
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  var maxRows = sheet.getMaxRows(),
      maxCols = sheet.getMaxColumns();
  var n = 400;
  var values;

  if(maxRows < c + 3) return;

  values = sheet.getRange(maxRows, 1, 1, maxCols).getValues();
  sheet.insertRowsBefore(maxRows, n);
  maxRows += n;

  sheet.getRange(maxRows-n, 1, 1, maxCols).setValues(values);
  sheet.getRange(maxRows-n+1, 1, n-1, maxCols).clear();
  sheet.getRange(maxRows, 1, 1, maxCols).clearContent();
  sheet.getRange(c+2, 1, 1, maxCols)
    .copyTo(sheet.getRange(maxRows-n, 1, n, maxCols), {formatOnly:true});
}


function optTool_UpdateCashFlow_(mm_) {
  if(onlineUpdate_()) return;

  var sheet, range;
  var yyyy, mm;

  if(isNaN(mm_)) {
    sheet = SpreadsheetApp.getActiveSheet();
    range = SpreadsheetApp.getActiveRange();

    mm = MN_SHORT_.indexOf( sheet.getSheetName() );
  } else if(mm_ >= 0  &&  mm_ < 12) {
    mm = mm_;
  } else {
    console.error("optTool_UpdateCashFlow_(): Internal error.", mm_);
    return;
  }

  if(mm === -1  &&  sheet.getSheetName() !== 'Cash Flow') {
    SpreadsheetApp.getUi().alert(
      "Can't update cash flow",
      "Select a month or Cash Flow to update cash flow.",
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  yyyy = optAddonSettings_Get_('FinancialYear');

  if(mm === -1) {
    mm = range.getColumn() - 1;
    mm = (mm - (mm % 4)) / 4;
  }

  foo_UpdateCashFlow_(yyyy, mm);
}


function optTool_FormatRegistry_(mm_) {
  var sheet;
  var c;

  if( isNaN(mm_) ) {
    sheet = SpreadsheetApp.getActiveSheet();
    c = MN_SHORT_.indexOf( sheet.getSheetName() );
  } else if(mm_ >= 0  &&  mm_ < 12) {
    c = mm_;
  } else if(mm_ >= 12  &&  mm_ < 24) {
    sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName("Cards");
    c = -1;
  } else {
    console.error("optTool_FormatRegistry_(): Internal error.", mm_);
    return;
  }

  if(c !== -1) {
    foo_FormatRegistry_(c);

  } else if(sheet.getSheetName() === 'Cards') {
    mm_ = mm_ ? mm_ - 12 : null;
    foo_FormatCreditCard_(mm_);

  } else {
    SpreadsheetApp.getUi().alert(
      "Can't format registry",
      "Select a month to format the registry.",
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}