# Project Notes

## Summary
This project collects public web-form sign-ups and writes them to Google Sheets. Because the form is public, submissions are reviewed in a triage queue before being accepted into the main list. The frontend is plain HTML/JS. The backend is Google Apps Script (Web App) and uses environment-like configuration via Apps Script Properties. reCAPTCHA v2 checkbox is used to reduce spam.

## Clarified Requirements
- Frontend: HTML + JavaScript.
- Backend: Google Apps Script Web App.
- Sheets layout: one spreadsheet with two tabs:
  - `Triage` (new submissions)
  - `Main` (accepted submissions)
- Triage flow:
  - When the spreadsheet is opened, a dialog is shown.
  - The dialog loads the first item in `Triage` and shows Accept/Reject.
  - Accept moves the entry to `Main` and deletes it from `Triage`.
  - Reject deletes it from `Triage`.
  - The dialog repeats until closed or no items remain.
- Anti-spam: reCAPTCHA v2 checkbox.
- Form fields:
  - First Name (required)
  - Last Name (required)
  - Email Address (required)
  - Street Address (required)
  - Callsign (required)
- No email notifications.

## Configuration / Secrets
- reCAPTCHA secret key stored in Apps Script Properties.
- reCAPTCHA site key exposed to frontend.
- Apps Script deployment URL used by frontend to submit.

## Files To Maintain
- `index.html`, `app.js`, `styles.css`: public form
- `apps-script/Code.gs`: backend and triage logic
- `apps-script/TriageDialog.html`: Apps Script dialog UI
- `apps-script/appsscript.json`: Apps Script manifest
- `README.md`: setup/deploy instructions
- `.gitignore`: ignores build/local artifacts
