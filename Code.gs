/**
 * Google Apps Script endpoint for 5Q interview booking form.
 * - Accepts POSTed JSON from the landing page.
 * - Validates required fields.
 * - Appends the submission to a Google Sheet.
 * - Returns a JSON response that the frontend can read.
 */

/** Configure these to match your Sheet layout. */
const SHEET_NAME = "Website";
/**
 * Optional: if this Apps Script is NOT bound to the target Google Sheet,
 * set SHEET_ID to the Spreadsheet ID (from its URL). If left empty, the
 * script will use the active (container-bound) spreadsheet.
 */
const SHEET_ID = "1uZ0InW1OrzB0W9Wo4HjOKngtCCcrjTKGKkSEVfrs5zo"; // e.g., "1AbCDEF..." or leave empty when container-bound
const REQUIRED_FIELDS = [
  "name",
  "whatsapp",
  "email",
  "motivation",
  "hear",
  "timestamp",
];

/**
 * Handle POST requests from the web form.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(
        { success: false, message: "Empty request payload." },
        400
      );
    }

    const payload = JSON.parse(e.postData.contents);

    // Ensure required fields exist and are non-empty.
    const missing = REQUIRED_FIELDS.filter((key) => !payload[key]);
    if (missing.length) {
      return jsonResponse(
        {
          success: false,
          message: "Missing required fields: " + missing.join(", "),
        },
        400
      );
    }

    const sheet = getOrCreateSheet(SHEET_NAME);
    ensureSourceHeaders(sheet);
    ensureSubmissionIdHeader(sheet);
    const headerMap = getHeaderMap(sheet);
    const now = new Date();

    // Idempotency: if submission_id exists and already recorded, return success
    const submissionId = payload.submission_id || "";
    if (submissionId && headerMap["Submission ID"]) {
      const idCol = headerMap["Submission ID"]; // 1-based index
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const ids = sheet
          .getRange(2, idCol, lastRow - 1, 1)
          .getValues()
          .flat();
        if (ids.indexOf(submissionId) !== -1) {
          return jsonResponse({ success: true, duplicate: true }, 200);
        }
      }
    }

    const row = [
      now,
      payload.name,
      payload.whatsapp,
      payload.email,
      payload.age || "",
      payload.role || "",
      payload.motivation,
      payload.hear,
      payload.hear_other || "",
      payload.hear_friend || "",
      payload.page_url || "",
    ];

    sheet.appendRow(row);

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("Form submission error:", error);
    return jsonResponse(
      {
        success: false,
        message: "Server error. Please try again later.",
      },
      500
    );
  }
}

/**
 * Ensure the sheet has headers for source tracking; append if missing.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function ensureSourceHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return;
  }
  let header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let nextCol = lastCol + 1;
  if (header.indexOf("Page URL") === -1) {
    sheet.getRange(1, nextCol, 1, 1).setValue("Page URL");
    nextCol++;
  }
  // Refresh header length if we added one
  if (header.indexOf("Referrer") === -1) {
    sheet.getRange(1, nextCol, 1, 1).setValue("Referrer");
  }
}

/** Ensure "Submission ID" header exists for idempotency. */
function ensureSubmissionIdHeader(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (header.indexOf("Submission ID") === -1) {
    sheet.getRange(1, lastCol + 1, 1, 1).setValue("Submission ID");
  }
}

/** Build a header name -> column index (1-based) map. */
function getHeaderMap(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  for (var i = 0; i < header.length; i++) {
    map[String(header[i]).trim()] = i + 1;
  }
  return map;
}

/**
 * Return a sheet reference, creating it if needed with header labels.
 * @param {string} name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(name) {
  const ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "Spreadsheet not found. Set SHEET_ID or bind script to the Sheet (Extensions > Apps Script)."
    );
  }
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow([
      "Timestamp",
      "Full Name",
      "WhatsApp",
      "Email",
      "Age",
      "Current Role",
      "Motivation",
      "Hear About",
      "Hear Other",
      "Friend/Family (who)",
      "Page URL",
    ]);
  }

  return sheet;
}

/**
 * Helper to build JSON responses with proper headers.
 * @param {Object} obj
 * @param {number} status
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(obj, status) {
  const output = ContentService.createTextOutput(
    JSON.stringify(obj)
  ).setMimeType(ContentService.MimeType.JSON);

  // Web apps default to 200; set explicit status with HtmlOutput meta.
  if (typeof output.setHttpStatus === "function") {
    output.setHttpStatus(status);
  } else {
    // Fallback for older runtime: wrap JSON in HtmlOutput to set status.
    const html = HtmlService.createHtmlOutput(JSON.stringify(obj));
    html.setTitle(String(status));
    return html;
  }

  return output;
}
