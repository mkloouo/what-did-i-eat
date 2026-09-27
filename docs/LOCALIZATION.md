# Localization

UI strings live in [`src/i18n/locales/en.json`](../src/i18n/locales/en.json), which is
the source of truth. Other locale files (e.g. `uk.json`) start out with empty string
values; [`src/i18n/index.ts`](../src/i18n/index.ts) treats an empty value as "not yet
translated" and falls back to English for it, so a partially-translated locale never
shows blank text.

Translations are managed through [Tolgee](https://tolgee.io), an open-source
translation management platform, via [`@tolgee/cli`](https://docs.tolgee.io/tolgee-cli).
This project self-hosts Tolgee rather than using the app.tolgee.io cloud — see
[Tolgee's self-hosting guide](https://tolgee.io/self-hosting) for the docker-compose
setup — but the tooling here works the same either way; self-hosting isn't required to
sync strings, it's just what this project runs.

## Syncing strings

The CLI is configured in [`tolgee.config.js`](../tolgee.config.js) at the repo root, and
reads its instance URL and credentials from the environment rather than the file:

- `TOLGEE_API_URL` — base URL of your Tolgee instance (defaults to the Tolgee Cloud URL
  if unset, but point this at your self-hosted instance instead)
- `TOLGEE_API_KEY` — a project API key or personal access token
- `TOLGEE_PROJECT_ID` — the numeric project ID (only needed with a personal access
  token; a project API key already scopes to one project)

With those set:

```sh
npm run i18n:push   # upload src/i18n/locales/en.json's keys to Tolgee
npm run i18n:pull   # download translated strings back into src/i18n/locales/
```

## Adding a new UI string

1. Add the key and its English text to `src/i18n/locales/en.json`.
2. Add the same key with an empty string value to every other locale file (so it falls
   back to English until translated).
3. Use it in code with `useTranslation()` from `react-i18next` and `t('namespace.key')`.
4. Run `npm run i18n:push` so the new key shows up in Tolgee for translation.

## Adding a new language

1. Add the locale to `resources` in `src/i18n/index.ts`.
2. Create `src/i18n/locales/<code>.json` with the same keys as `en.json`, values empty.
3. Add the locale to Tolgee (project settings) and to `pull.languages` in
   `tolgee.config.js`, then `npm run i18n:pull`.

Optionally, install [Tolgee's GitHub integration](https://docs.tolgee.io/platform/integrations/version_control_systems/github_actions)
to open a pull request automatically when translations change.
