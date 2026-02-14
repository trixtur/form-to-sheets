# Form To Sheets

Collect public sign-ups via a web form, queue them in Google Sheets for review, and move approved entries into a main list.

## What This Is

- Plain HTML/JS frontend.
- Google Apps Script Web App backend.
- Google Sheet tabs: `Triage` for new submissions and `Main` for approved submissions.
- reCAPTCHA v2 checkbox to reduce spam.

## Repo Layout

- `index.html`, `app.js`, `styles.css`: public form
- `config.example.json`: config template (copy to `config.json`)
- `apps-script/Code.gs`: Apps Script backend + triage logic
- `apps-script/TriageDialog.html`: review dialog UI
- `apps-script/appsscript.json`: Apps Script manifest

## Step-by-Step Setup

1. Create a new Google Spreadsheet.
2. Open Extensions -> Apps Script.
3. Create `Code.gs` and paste in `apps-script/Code.gs`.
4. Create `TriageDialog.html` and paste in `apps-script/TriageDialog.html`.
5. Replace the default manifest with `apps-script/appsscript.json`.
6. Open Project Settings and add Script Properties.
7. Set `SHEET_ID` to your spreadsheet ID (from the sheet URL).
8. Set `RECAPTCHA_SECRET` to your reCAPTCHA v2 secret key.
9. Deploy as a Web App.
10. Web App settings: Execute as `Me`. Who has access: `Anyone`.
11. Copy the Web App URL.
12. Copy `config.example.json` to `config.json`.
13. In `config.json`, set `appsScriptUrl` to the Web App URL.
14. In `config.json`, set `recaptchaSiteKey` to your reCAPTCHA v2 site key.
15. Host `index.html`, `app.js`, `styles.css`, and `config.json` on any static hosting.
16. In the Apps Script editor, run `terraformSheets` once to create `Triage` and `Main`.

## How Triage Works

- Opening the spreadsheet automatically shows a modal dialog (via `onOpen`).
- The dialog loads the first entry in the `Triage` sheet.
- `Accept` moves the entry to `Main` and removes it from `Triage`.
- `Reject` removes the entry from `Triage`.
- The dialog continues until no entries remain or the user closes it.

## Form Fields

- First Name (required)
- Last Name (required)
- Email Address (required)
- Street Address (required)
- Callsign (required)

## Configuration Notes

- reCAPTCHA is validated server-side before data reaches `Triage`.
- `SHEET_ID` determines which spreadsheet is written by web requests.
- If `Triage` or `Main` does not exist, the script creates them.

## Troubleshooting

- If the dialog does not appear, run `showTriageDialog` from the Apps Script editor once to grant permissions.
- If submissions fail, confirm the Web App URL in `config.json` is correct.
- If submissions fail, confirm `SHEET_ID` is set in Script Properties.
- If submissions fail, confirm `RECAPTCHA_SECRET` is set in Script Properties.
- If submissions fail, confirm the deployment access is set to `Anyone`.

## Terraforming Sheets

Use the `terraformSheets` Apps Script function to standardize the spreadsheet:

- Creates `Triage` and `Main` if missing.
- Adds headers to those sheets.
- Deletes any other sheets in the spreadsheet.

## CI Checks

- Local checks use:
- `npm install`
- `npm run lint`
- `npm run format:check`
- `npm run check`
- GitHub Actions runs these checks on pull requests and on pushes to `main` using `.github/workflows/ci.yml`.
