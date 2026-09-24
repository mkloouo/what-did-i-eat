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

## Release process

When the user asks to "release" a new version (or says "release vX.Y.Z"), do this without
asking them to re-explain it. Every release ships Android **and** iOS; the mechanics live in
`scripts/release.mjs` (`npm run release -- …`) — use it, don't redo its steps by hand.

1. Implement and commit the feature work first, as its own commit(s) — never bundled with
   the version bump — and make sure `CHANGELOG.md`'s `[Unreleased]` section describes it.
   The script refuses a dirty tree or an empty `[Unreleased]`. That section becomes the
   GitHub release notes verbatim (the script appends a "which file to download" footer), so
   write it for users.
2. Run, with `run_in_background: true` (two native builds, well over 10 minutes):
   `npm run release -- X.Y.Z --co-author "<your Co-Authored-By value>"`
   plus `--pause` if the user wants to smoke-test before publishing (always pause when the
   release changes native deps or build config), and `--ios-cloud` only if the local iOS
   build fails (it has before; that runs the iOS build on EAS cloud and downloads the .ipa).
   The script: preflight (on `main`, clean, not behind `origin/main`, tag/release don't exist,
   `gh` authed) → `tsc` + `jest` → `release vX.Y.Z` commit (CHANGELOG + `package.json` +
   `app.config.js` only) → local Android build → local iOS build → `SHA256SUMS` → annotated
   tag → `git push --atomic origin main vX.Y.Z` → draft GitHub release with all assets →
   published (notes = the `## [X.Y.Z]` CHANGELOG section). Nothing is pushed until both
   builds have succeeded.
3. With `--pause`, it stops after the builds with everything in `releases/vX.Y.Z/`. Give the
   user a smoke-test plan for the arm64-v8a APK (and the .ipa), then after their go-ahead:
   `npm run release -- X.Y.Z --publish`.
4. If a build fails or the smoke test finds a bug: `npm run release -- X.Y.Z --abort` drops
   the unpushed release commit (and local tag); fix, commit, re-run from step 2. If the
   publish step fails partway (e.g. an upload), re-running `--publish` resumes — it reuses
   the tag and refreshes the draft's assets.

Notes:

- Android ships as 5 APKs per release: one per ABI in `reactNativeArchitectures`
  (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`) plus a universal one. That comes from
  `plugins/withAbiSplits.js` (Gradle ABI splits), which `app.config.js` only applies when
  `ANDROID_ABI_SPLITS=1` — set only on `eas.json`'s `production-apk` profile. With several
  outputs the local EAS build writes a `.tar.gz`, which the script unpacks, checks (one split
  per ABI of the universal APK, each holding only its own `lib/<abi>/`) and renames to
  `what-did-i-eat-vX.Y.Z-<abi>.apk`. All splits share one versionCode — fine for sideloading.
- Release builds run R8 + resource shrinking and compress native libs (`expo-build-properties`
  in `app.config.js`). R8 can strip classes a library only reaches by reflection; a crash
  that appears only in release builds is the first thing to suspect there.
- `eas.json`'s `production-apk` profile (not `production`) is the one that emits APKs
  (`android.buildType: apk`); `production` alone builds an AAB. iOS uses `production`.
- Build output lands in the gitignored `releases/vX.Y.Z/` and is only ever attached to GitHub
  releases. Leftover `build-*.apk`/`.ipa` files in the repo root from older releases are
  harmless clutter, not something to clean up unprompted.
- `appVersionSource` is `"remote"` in `eas.json`, so EAS manages the Android `versionCode`
  and iOS `buildNumber` itself (`production.autoIncrement: true`); the `app.config.js`/`package.json` version bump
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
