// Config for @tolgee/cli (`npm run i18n:push` / `npm run i18n:pull`).
// Docs: https://docs.tolgee.io/tolgee-cli/project-configuration
//
// This project self-hosts Tolgee rather than using app.tolgee.io — see
// https://tolgee.io/self-hosting for the docker-compose setup. Nothing here
// is hardcoded to a particular instance or account: everything credential-
// or instance-shaped comes from the environment so this file can be
// committed safely.
//
//   TOLGEE_API_URL     Base URL of your Tolgee instance (self-hosted or
//                       cloud). Falls back to Tolgee Cloud (app.tolgee.io)
//                       only as a documented default, not an assumption.
//   TOLGEE_API_KEY      Project API key or personal access token. Also read
//                       directly by the CLI itself; set explicitly here too
//                       so `tolgee --config tolgee.config.js` alone is enough.
//   TOLGEE_PROJECT_ID   Numeric project ID (required when TOLGEE_API_KEY is
//                       a personal access token rather than a project key).
module.exports = {
  apiUrl: process.env.TOLGEE_API_URL || "https://app.tolgee.io",
  apiKey: process.env.TOLGEE_API_KEY,
  projectId: process.env.TOLGEE_PROJECT_ID
    ? Number(process.env.TOLGEE_PROJECT_ID)
    : undefined,
  format: "JSON_I18NEXT",
  push: {
    filesTemplate: "src/i18n/locales/{languageTag}.json",
    languages: ["en"],
  },
  pull: {
    path: "src/i18n/locales",
    languages: ["uk"],
  },
};
