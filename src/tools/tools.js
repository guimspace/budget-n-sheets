function toolAddBlankRows () {
  toolPickerUi_('AddBlankRows');
}

function toolUpdateCashFlow () {
  toolPickerUi_('UpdateCashFlow');
}

function toolFormatRegistry () {
  toolPickerUi_('FormatRegistry');
}

function toolPickerUi_ (select) {
  switch (select) {
    case 'AddBlankRows':
    case 'UpdateCashFlow':
    case 'FormatRegistry':
      break;

    default:
      throw new Error('Switch case is default.');
  }

  if (toolPicker_(select) !== 0) {
    SpreadsheetApp2.getUi().alert(
      'Add-on is busy',
      'The add-on is busy. Try again in a moment.',
      SpreadsheetApp2.getUi().ButtonSet.OK);
  }
}

function toolPicker_ (select, value) {
  const lock = LockService.getDocumentLock();
  try {
    lock.waitLock(200);
  } catch (err) {
    return 1;
  }

  switch (select) {
    case 'AddBlankRows':
      blankRows_(value);
      break;
    case 'UpdateCashFlow':
      validateUpdateCashFlow_();
      break;
    case 'UpdateCashFlowMm':
      if (seamlessUpdate_()) break;
      updateCashFlow_(value);
      break;
    case 'FormatRegistry':
      validateFormatRegistry_();
      break;
    case 'FormatAccount':
      formatAccounts_(value);
      break;
    case 'FormatCards':
      formatCards_(value);
      break;

    default:
      throw new Error('Switch case is default.');
  }

  lock.releaseLock();
  return 0;
}
