@AGENTS.md

`~/.claude/RTK.md` (global, loaded every session regardless of project) — see there
instead of duplicating it here. `rtk init` may attempt to re-add a per-project block on
this project's next run; if so, re-remove it and keep this file down to the
project-specific gotchas below.

## RTK gotchas (learned from this project's failure log)

A `~/.claude/settings.json` `PreToolUse` hook (matcher `Bash`, `rtk hook claude`) already
intercepts and rewrites *every* Bash command transparently before it runs — you don't
need to manually type `rtk` for that filtering to apply. Manually prefixing is only safe
for commands `rtk` actually has a subcommand for (everything listed above). For anything
else, `rtk <cmd>` does **not** pass through unchanged — it hard-errors ("unrecognized
subcommand") — contradicting the Golden Rule text above, which is auto-generated and
currently wrong on this point. Checked against this project's `rtk gain --failures` log:
24 of the last 33 parse failures (73%) were exactly this — manually typing `rtk cat`,
`rtk head`, `rtk tail`, `rtk du`, `rtk sed`, or `rtk ssh`, none of which are real `rtk`
subcommands. Just run those plain, unprefixed, and let the hook decide.

Specific pitfalls seen repeatedly in this project's history:

- No `rtk cat` — use `rtk read <file>` (or the Read tool) instead.
- No `rtk ssh`, `rtk head`, `rtk tail`, `rtk du`, `rtk sed` — run these unprefixed.
- `rtk grep -l <n>` means "max line length" (it's `--max-len`), **not** native grep's
  "-l = files with matches only". For the native meaning, run plain `grep -l` unprefixed.
- `rtk docker ps`/`rtk docker logs` don't accept passthrough flags like `--filter`,
  `--format`, `--tail` — drop the `rtk` prefix for those invocations.
- Watch subcommand spelling: `rtk discover` (not `discovery`), `rtk gain` (not `gian`),
  `rtk git status` (not bare `rtk status`) — a typo'd subcommand errors, it doesn't fall
  back to anything.

## Android release process

When the user asks to "release" a new Android version (or says "release vX.Y.Z"), do this
without asking them to re-explain it:

1. Implement and commit the feature work first, as its own commit(s) — never bundled with
   the version bump.
2. Move `CHANGELOG.md`'s `[Unreleased]` section content under a new `## [X.Y.Z] -
   YYYY-MM-DD` heading (leave `[Unreleased]` empty above it, ready for the next round).
   Bump the version string in both `package.json` and `app.config.js` (the `version` field
   — this file replaced the old static `app.json`, see notes below) to the new `X.Y.Z`.
   Commit `CHANGELOG.md` + these two files together, alone, with message `release vX.Y.Z`.
3. Build the APK locally: `npx eas-cli build --platform android --profile production-apk
   --local --non-interactive`. This takes several minutes (native Gradle build) — run it
   with `run_in_background: true` on the Bash tool rather than blocking or polling. It
   writes `build-<timestamp>.apk` into the repo root; note the exact filename from the
   build's final "You can find the build artifacts in ..." line — don't guess it.
4. `git tag vX.Y.Z` on the release commit, then `git push origin vX.Y.Z`.
5. `gh release create vX.Y.Z build-<timestamp>.apk --title "vX.Y.Z" --notes "<1-2 sentence
   summary of what shipped>"` — short and casual, matching the style of past releases
   (check `gh release view v<previous> --json body -q .body` for tone if unsure).
6. `git push origin main` last, pushing both the feature commit(s) and the release commit.

Notes:

- `eas.json`'s `production-apk` profile (not `production`) is the one that emits an APK
  (`android.buildType: apk`); `production` alone builds an AAB.
- The built `build-*.apk` files are never committed to git — they're only ever attached as
  GitHub release assets. Leftover ones in the working tree from past releases are harmless
  clutter, not something to clean up unprompted.
- `appVersionSource` is `"remote"` in `eas.json`, so EAS manages the Android `versionCode`
  itself (`production.autoIncrement: true`); the `app.config.js`/`package.json` version bump
  is just the human-readable version string, not what EAS uses for versionCode.
- `app.config.js` (not `app.json`) is the source of truth for Expo config — it's a dynamic
  config that reads `APP_VARIANT` from the environment. `eas.json` sets `APP_VARIANT` to
  `"development"`/`"preview"` on those two profiles only; `production`/`production-apk` get
  no `APP_VARIANT`, which is what keeps them on the real `com.mkloouo.whatdidieat` bundle
  ID/package and the plain "What Did I Eat" name — dev/preview builds get a `.dev` suffix
  on both platforms' bundle ID/package and "(Dev)" appended to the name, so a dev-client
  build can be installed on a device alongside a real release without a signature/package
  clash. Never hand-edit a `bundleIdentifier`/`package`/`name` string in `app.config.js`
  outside the `IS_DEV` ternaries — that would apply to every profile including production.
