function optMainTables(opt, param) {
  var lock = LockService.getDocumentLock();
  try {
    lock.waitLock(2000);
  } catch(err) {
    return 0;
  }

  switch(opt) {
    case 'GetList':
      return optTable_GetList_();
    case 'GetInfo':
      return optTable_GetInfo_(param);
    case 'GenerateRandomId':
      return optTable_GenerateRandomId_();

    case 'UpdateAccount':
      return optAccount_Update_(param);
    case 'UpdateTableRef':
      return optAccount_UpdateTableRef_();

    case 'AddCard':
      return optCard_Add_(param);
    case 'UpdateCard':
      return optCard_Update_(param);
    case 'RemoveCard':
      return optCard_Remove_(param);

    case 'isBusy':
      return -1;
    default:
      console.warn("optMainTables(): Switch case is default.", opt);
      Logger.log("optMainTables(): Switch case is default.");
      Logger.log(opt);
      return 3;
  }
}


function optTable_GetInfo_(r) {
  var array, k;

  array = getPropertiesService_('document', 'json', 'DB_ACCOUNT');
  array = array.concat( getPropertiesService_('document', 'json', 'DB_CARD') );


  for(k = 0;  k < array.length;  k++) {
    if(r === array[k].Id) {
      return array[k];
    }
  }

  console.warn("optTable_GetInfo_(): Table was not found.");
  return 2;
}


function optTable_GetList_() {
  var dbAccountInfo, dbCardInfo;
  var k;

  dbAccountInfo = getPropertiesService_('document', 'json', 'DB_ACCOUNT');
  dbCardInfo = getPropertiesService_('document', 'json', 'DB_CARD');


  for(k = 0;  k < dbAccountInfo.length;  k++) {
    dbAccountInfo[k].BalanceString = dbAccountInfo[k].Balance.formatCurrency();
    dbAccountInfo[k].Type = 'Account';
  }

  for(k = 0;  k < dbCardInfo.length;  k++) {
    dbCardInfo[k].LimitString = dbCardInfo[k].Limit.formatCurrency();
    dbCardInfo[k].Type = 'Card';
  }

  return dbAccountInfo.concat(dbCardInfo);
}


function optTable_GenerateRandomId_() {
  var array, string;
  var n, i, k;

  string = '';
  array = getPropertiesService_('document', 'json', 'DB_ACCOUNT');
  array = array.concat( getPropertiesService_('document', 'json', 'DB_CARD') );


  i = 0;
  n = array.length;
  do {
    string = randomString(11, "word");
    for(k = 0;  k < n;  k++) {
      if(string === array[k].Id) break;
    }
    i++;
  } while(k !== n  &&  i < 100);

  if(i === 100) {
    console.warn("optTable_GenerateRandomId_(): Maximum iterations allowed hit.");
    return;
  }

  return string;
}


function optAccount_UpdateTableRef_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cash Flow');
  var listTables = optTable_GetList_();
  var number_accounts = getPropertiesService_('document', 'number', 'number_accounts'),
      yyyy = optAddonSettings_Get_('FinancialYear');
  var range_, string, mm, dd,
      i, k, h_;

  if(!sheet) return 2;
  range_ = [ "G", "L", "Q", "V", "AA" ];

  h_ = AppsScriptGlobal.TableDimensions()["height"];

  sheet.getRange(3, 3).setFormula('=0');
  for(i = 1;  i < 12;  i++) {
    dd = new Date(yyyy, i, 0).getDate();
    sheet.getRange(3, 3+i*4)
      .setFormulaR1C1('=R[' + (dd - 1) + ']C[-4]+RC[-1]');
  }
  SpreadsheetApp.flush();

  k = 0;
  while(k < number_accounts) {
    mm = listTables[k].TimeA;

    string = sheet.getRange(3, 3+mm*4).getFormula();
    string += "+\'_Backstage\'!" + range_[k] + (2 + h_*mm);
    sheet.getRange(3, 3+mm*4).setFormula(string);
    Utilities.sleep(137);

    k++;
  }

  return -1;
}



function optAccount_Update_(input) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(),
      sheet = spreadsheet.getSheetByName('_Backstage');
  var dbAccount;
  var auxCell, newCell;
  var a, b, k, h_, w_;

  if(!sheet) return 2;
  dbAccount = getPropertiesService_('document', 'json', 'DB_ACCOUNT');

  h_ = AppsScriptGlobal.TableDimensions()["height"];
  w_ = AppsScriptGlobal.TableDimensions()["width"];

  for(k = 0;  k < dbAccount.length;  k++) {
    if(dbAccount[k].Id == input.Id) break;
  }
  if(k === dbAccount.length) return 2;

  a = dbAccount[k].TimeA;

  dbAccount[k].Name = input.Name;
  dbAccount[k].TimeA = Number(input.TimeA);
  dbAccount[k].Balance = Number(input.Balance);

  setPropertiesService_('document', 'json', 'DB_ACCOUNT', dbAccount);


  try {
    if(a > 0) b = "=R[-"+(h_-1)+"]C";
    else b = "=0";
    sheet.getRange(2+h_*a, 1+w_+1+w_*k).setFormulaR1C1(b);

    spreadsheet.getSheetByName('Jan')
      .getRange(1, 6+k*5)
      .setValue(input.Name);
    sheet.getRange(1, 1+w_+1+w_*k).setValue(input.Name);
    sheet.getRange(2+input.TimeA*h_, 1+w_+1+k*w_).setFormula('='+Number(input.Balance).formatLocaleSignal());

    optAccount_UpdateTableRef_();
  } catch(err) {
    console.error("optAccount_Update_(): Spreadsheet update failed.", err);
    Logger.log("optAccount_Update_(): Spreadsheet update failed.");
    Logger.log(err.message);
    return 1;
  }

  return -1;
}
