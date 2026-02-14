const SHEET_TRIAGE = "Triage";
const SHEET_MAIN = "Main";
const HEADERS = [
  "Timestamp",
  "First Name",
  "Last Name",
  "Email Address",
  "Street Address",
  "Callsign"
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    validatePayload(payload);

    const recaptchaSecret = getProperty_("RECAPTCHA_SECRET");
    if (!recaptchaSecret) {
      throw new Error("Missing reCAPTCHA secret configuration.");
    }

    const recaptchaValid = verifyRecaptcha_(recaptchaSecret, payload.recaptchaToken, e);
    if (!recaptchaValid) {
      return jsonResponse_(false, "reCAPTCHA validation failed.");
    }

    const sheet = getSheet_(SHEET_TRIAGE);
    ensureHeaders_(sheet);

    sheet.appendRow([
      new Date(),
      payload.firstName,
      payload.lastName,
      payload.email,
      payload.streetAddress,
      payload.callsign
    ]);

    return jsonResponse_(true, "Queued for review.");
  } catch (err) {
    return jsonResponse_(false, err.message || "Server error.");
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Triage")
    .addItem("Open Triage Review", "showTriageDialog")
    .addToUi();

  showTriageDialog();
}

function showTriageDialog() {
  const html = HtmlService.createHtmlOutputFromFile("TriageDialog").setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, "Triage Review");
}

function getNextTriageEntry() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(5000);
  try {
    const sheet = getSheet_(SHEET_TRIAGE);
    ensureHeaders_(sheet);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return null;
    }

    const rowValues = sheet.getRange(2, 1, 1, HEADERS.length).getValues()[0];
    return {
      rowIndex: 2,
      timestamp: rowValues[0],
      firstName: rowValues[1],
      lastName: rowValues[2],
      email: rowValues[3],
      streetAddress: rowValues[4],
      callsign: rowValues[5]
    };
  } finally {
    lock.releaseLock();
  }
}

function acceptTriageEntry(rowIndex) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(5000);
  try {
    const triageSheet = getSheet_(SHEET_TRIAGE);
    const mainSheet = getSheet_(SHEET_MAIN);
    ensureHeaders_(triageSheet);
    ensureHeaders_(mainSheet);

    const rowValues = triageSheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
    mainSheet.appendRow(rowValues);
    triageSheet.deleteRow(rowIndex);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function rejectTriageEntry(rowIndex) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(5000);
  try {
    const triageSheet = getSheet_(SHEET_TRIAGE);
    ensureHeaders_(triageSheet);

    triageSheet.deleteRow(rowIndex);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function validatePayload(payload) {
  const required = [
    "firstName",
    "lastName",
    "email",
    "streetAddress",
    "callsign",
    "recaptchaToken"
  ];
  required.forEach((key) => {
    if (!payload[key] || String(payload[key]).trim() === "") {
      throw new Error(`Missing required field: ${key}.`);
    }
  });
}

function verifyRecaptcha_(secret, token, e) {
  const endpoint = "https://www.google.com/recaptcha/api/siteverify";
  const payload = {
    secret,
    response: token,
    remoteip: e && e.parameter ? e.parameter.userIp : undefined
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    payload
  });

  const data = JSON.parse(response.getContentText() || "{}");
  return Boolean(data.success);
}

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders_(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const isEmpty = existing.every((cell) => !cell);
  if (isEmpty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function terraformSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const required = [SHEET_TRIAGE, SHEET_MAIN];
  const existing = ss.getSheets().map((sheet) => sheet.getName());

  required.forEach((name) => {
    const sheet = getSheet_(name);
    ensureHeaders_(sheet);
  });

  existing.forEach((name) => {
    if (!required.includes(name)) {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        ss.deleteSheet(sheet);
      }
    }
  });
}

function jsonResponse_(ok, message) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok, message, error: ok ? null : message })
  ).setMimeType(ContentService.MimeType.JSON);
}

function getProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
