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
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    processSubmission_(payload);
    return jsonResponse_(true, "Queued for review.");
  } catch (err) {
    return jsonResponse_(false, err && err.message ? err.message : "Server error.");
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

    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const hasData = row.some((cell) => String(cell || "").trim() !== "");
      if (!hasData) {
        continue;
      }

      return {
        rowIndex: i + 2,
        timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
        firstName: String(row[1] || ""),
        lastName: String(row[2] || ""),
        email: String(row[3] || ""),
        streetAddress: String(row[4] || ""),
        callsign: String(row[5] || "")
      };
    }

    return null;
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

function processSubmission_(payload) {
  validatePayload(payload);
  const recaptchaSecret = getProperty_("RECAPTCHA_SECRET");
  if (!recaptchaSecret) {
    throw new Error("Missing RECAPTCHA_SECRET script property.");
  }

  const recaptchaValid = verifyRecaptcha_(recaptchaSecret, payload.recaptchaToken);
  if (!recaptchaValid) {
    throw new Error("reCAPTCHA validation failed.");
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
}

function verifyRecaptcha_(secret, token) {
  const endpoint = "https://www.google.com/recaptcha/api/siteverify";
  const response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    payload: {
      secret,
      response: token
    }
  });

  const data = JSON.parse(response.getContentText() || "{}");
  return Boolean(data.success);
}

function getSpreadsheet_() {
  const id = getProperty_("SHEET_ID");
  if (!id) {
    throw new Error("Missing SHEET_ID script property.");
  }
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const ss = getSpreadsheet_();
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
  const ss = getSpreadsheet_();
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
