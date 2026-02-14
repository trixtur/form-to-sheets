const globals = require("globals");

const appsScriptGlobals = {
  ContentService: "readonly",
  HtmlService: "readonly",
  LockService: "readonly",
  PropertiesService: "readonly",
  SpreadsheetApp: "readonly",
  UrlFetchApp: "readonly"
};

const appsScriptEntryPoints =
  "^(doPost|onOpen|showTriageDialog|getNextTriageEntry|acceptTriageEntry|rejectTriageEntry|terraformSheets)$";

module.exports = [
  {
    ignores: ["node_modules/**", ".git/**", "config.json", "private-notes.txt"]
  },
  {
    files: ["app.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        onRecaptchaLoad: "writable",
        grecaptcha: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["apps-script/**/*.gs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.es2021,
        ...appsScriptGlobals
      }
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: appsScriptEntryPoints
        }
      ]
    }
  }
];
