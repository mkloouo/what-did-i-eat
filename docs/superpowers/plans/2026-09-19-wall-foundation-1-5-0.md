# Wall Foundation (1.5.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the whole existing app in the Wall look (dark ground, bone text, brass accent, Instrument Sans, no shadows, flush photo seams) and install every native dependency the full redesign needs, producing the single new dev build.

**Architecture:** Keep the existing color key names but remap them to Wall values, so every not-yet-redesigned screen picks up the look with no edits. Add the canonical Wall names beside them. Rewrite only the shared components whose meaning inverts (Button, TagChip, SegmentedControl, Fab). Tabs and all current screens stay; later plans replace them.

**Tech Stack:** Expo SDK 57, React Native 0.86, React Navigation 7, Redux Toolkit, jest-expo. New: `expo-font`, `@expo-google-fonts/instrument-sans`, `expo-splash-screen`, `expo-system-ui`, `expo-linear-gradient`, `expo-image`, `@shopify/flash-list`.

**Spec:** `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md` (this is plan 1 of 6, version 1.5.0; later plans are written when the previous step is done).

## Global Constraints

- Branch is `wall-redesign`. Never work on `main`.
- Tokens: wall `#1C2320`, seam `#252D29`, bone `#EDE8DC`, chalk `#949E97`, brass `#B08A4A`, clay (lightened by Task 3 to pass contrast) `#DE7B73`, plus hairline `#3A443E`.
- Type is Instrument Sans only, four weights: 400, 500, 600, 700. Custom fonts on Android need one family name per weight, so styles name `InstrumentSans_400Regular` and so on and **never set `fontWeight`**.
- No shadows and no `elevation` anywhere. Photos have 2px seams and square corners; tiles on the collage's outer edge stay flush.
- Text never sits on top of a photograph.
- Native dependencies are added with `npx expo install` so versions match Expo 57. All of them land in this plan, so this is the only step that needs a new dev build.
- Read the Expo v57 docs before writing Expo code (AGENTS.md). They were read for planning; re-read a page if a step surprises you.
- Version bump touches `package.json`, `package-lock.json`, `app.config.js` and `CHANGELOG.md`, in its own commit worded `bump to vX.Y.Z`. No git tags, no EAS cloud builds, no GitHub releases.
- Python only through `uv run`. Never `python`, `pip` or `python3` directly.
- Code style matches the surrounding files: 2-space indent, double quotes, semicolons. `App.tsx` is the one file that uses single quotes; keep its style.
- Run the type-check (`npx tsc --noEmit`) and jest yourself. Do not start dev servers and do not drive the app. Metro is already running on port 8081 for the user.
- Commit messages end with the line `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `package.json`, `package-lock.json` | dependencies | 1 |
| `app.config.js` | dark UI style, splash, system-ui background | 1 |
| `src/utils/contrast.ts` (+ test) | WCAG contrast ratio of two hex colors | 2 |
| `src/theme/theme.ts` (+ `theme.test.ts`) | Wall tokens, legacy aliases, fonts, typography | 3 |
| `src/theme/useAppFonts.ts` | loads Instrument Sans | 4 |
| `src/theme/navigationTheme.ts` | React Navigation dark theme in Wall colors and fonts | 4 |
| `App.tsx` | splash gate, nav theme, light status bar | 4 |
| `src/components/photoLayouts/tileInsets.ts` (+ test) | per-tile padding for flush edges and even seams | 5 |
| `src/components/PhotoStack.tsx` | uses `tileInsets`; adds `seam` and `cornerRadius` props | 5 |
| `src/components/photoLayouts/Button.tsx`, `TagChip.tsx`, `SegmentedControl.tsx`, `CountBadge.tsx`, `Fab.tsx` | restyled for dark | 6 |

---

### Task 1: Native dependencies, config, and the single dev build

**Files:**
- Modify: `package.json`, `package-lock.json` (by `expo install`)
- Modify: `app.config.js`
- Modify: `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md` (dependency list)

**Interfaces:**
- Produces: `@expo-google-fonts/instrument-sans` exporting `useFonts`, `InstrumentSans_400Regular`, `InstrumentSans_500Medium`, `InstrumentSans_600SemiBold`, `InstrumentSans_700Bold`; `expo-splash-screen` (`preventAutoHideAsync`, `hideAsync`). Task 3 needs the tabular-figures result from Step 3.

- [ ] **Step 1: Confirm a clean starting point**

Run: `git status --short && git branch --show-current`
Expected: no output from status, then `wall-redesign`.

- [ ] **Step 2: Install the modules**

Run: `npx expo install expo-font @expo-google-fonts/instrument-sans expo-splash-screen expo-system-ui expo-linear-gradient expo-image @shopify/flash-list`
Expected: exits 0 and lists each package added.

Then confirm the Expo-matched versions landed:

Run: `grep -E '"(expo-font|expo-splash-screen|expo-system-ui|expo-linear-gradient|expo-image|@shopify/flash-list|@expo-google-fonts/instrument-sans)"' package.json`
Expected: `expo-font ~57.0.4`, `expo-image ~57.0.5`, `expo-linear-gradient ~57.0.2`, `@shopify/flash-list 2.0.2`, plus the other three present.

- [ ] **Step 3: Verify the font exports and whether it has tabular figures**

Run: `grep -oE "InstrumentSans_(400Regular|500Medium|600SemiBold|700Bold)\b" node_modules/@expo-google-fonts/instrument-sans/index.d.ts | sort -u`
Expected: exactly four lines: `InstrumentSans_400Regular`, `InstrumentSans_500Medium`, `InstrumentSans_600SemiBold`, `InstrumentSans_700Bold`. If a name differs, use the real name everywhere this plan says `InstrumentSans_...` (Task 3 and Task 4).

Run:
```bash
uv run --with fonttools python - <<'EOF'
import glob
from fontTools.ttLib import TTFont

path = glob.glob("node_modules/@expo-google-fonts/instrument-sans/**/*400Regular*.ttf", recursive=True)[0]
font = TTFont(path)
tags = sorted({r.FeatureTag for r in font["GSUB"].table.FeatureList.FeatureRecord}) if "GSUB" in font else []
print(path)
print("tnum:", "tnum" in tags)
print(tags)
EOF
```
Expected: prints a `tnum: True` or `tnum: False` line. Write the result down: Task 3 uses it.

- [ ] **Step 4: Configure the app**

In `app.config.js`, change `userInterfaceStyle: 'light',` to:

```js
    userInterfaceStyle: 'dark',
    backgroundColor: '#1C2320',
```

and add the splash plugin as the first entry of the `plugins` array, above `expo-image-picker`:

```js
      [
        'expo-splash-screen',
        {
          backgroundColor: '#1C2320',
          image: './assets/splash-icon.png',
        },
      ],
```

- [ ] **Step 5: Amend the spec's dependency list**

In `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md`, replace

```
- `expo-font` and `@expo-google-fonts/instrument-sans`
```

with

```
- `expo-font` and `@expo-google-fonts/instrument-sans`
- `expo-splash-screen`, so the native splash stays up while fonts load
- `expo-system-ui`, which Android needs for a dark `userInterfaceStyle`
```

- [ ] **Step 6: Commit (the build must see this)**

`eas build --local` builds from the committed state, so commit before building.

```bash
git add package.json package-lock.json app.config.js docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md
git commit -F - <<'EOF'
build: add native modules and dark config for the Wall redesign

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
```

- [ ] **Step 7: Build the dev client locally (several minutes, run in the background)**

Run in the background: `npx eas-cli build --platform android --profile development --local --non-interactive`
Expected: ends with a line `You can find the build artifacts in <path>` naming `build-<timestamp>.apk` in the repo root. Note the exact filename. The `.gitignore` already excludes it. If the build fails on Android SDK or login, stop and report the error to the user.

- [ ] **Step 8: Serve the APK on the LAN**

Serve a folder holding only the APK, never the repo (it contains `.git`).

```bash
SERVE=/private/tmp/claude-501/-Users-mkloouo-Projects-what-did-i-eat/d8002a17-2208-4346-92a8-26c990bac319/scratchpad/dev-build
mkdir -p "$SERVE" && cp build-<timestamp>.apk "$SERVE/wall-dev.apk"
LAN=$(ipconfig getifaddr en0) && echo "http://$LAN:8090/wall-dev.apk"
cd "$SERVE" && uv run python -m http.server 8090 --bind "$LAN"
```
Run the last line in the background. Expected: prints the download URL.

- [ ] **Step 9: Hand over and STOP**

Tell the user: open the URL on the phone, install the APK (allow installs from the browser if asked), open the "(Dev)" app, and connect to Metro at `<LAN>:8081`. Their old dev client and this one share a package name, so this replaces it.

**Do not start Task 2 until the user confirms the new dev client is installed and connects.** Every later task changes JavaScript that the old client cannot run once it imports the new modules.

- [ ] **Step 10: Stop the file server**

After the user confirms, stop the background `http.server` task.

---

### Task 2: Contrast utility

**Files:**
- Create: `src/utils/contrast.ts`
- Test: `src/utils/contrast.test.ts`

**Interfaces:**
- Produces: `contrastRatio(a: string, b: string): number` taking two `#rgb` or `#rrggbb` strings, returning a WCAG ratio in `[1, 21]`. Throws `Error("Invalid hex colour: <input>")` on anything else. Task 3 tests colors with it.

- [ ] **Step 1: Record the baseline**

Run: `npx jest`
Expected: all suites PASS. Note the counts.

Run: `npx tsc --noEmit`
Expected: no errors. If there are errors, note them so they are not blamed on later tasks.

- [ ] **Step 2: Write the failing test**

Create `src/utils/contrast.test.ts`:

```ts
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#1C2320", "#1C2320")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#EDE8DC", "#1C2320")).toBeCloseTo(
      contrastRatio("#1C2320", "#EDE8DC"),
      10,
    );
  });

  it("accepts lowercase and 3-digit hex", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
  });

  it("rejects malformed input", () => {
    expect(() => contrastRatio("red", "#000")).toThrow("Invalid hex colour");
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx jest src/utils/contrast.test.ts`
Expected: FAIL with "Cannot find module './contrast'".

- [ ] **Step 4: Write the implementation**

Create `src/utils/contrast.ts`:

```ts
function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Invalid hex colour: ${hex}`);
  const digits =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((d) => d + d)
          .join("")
      : match[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG 2 contrast ratio between two hex colours, 1 (none) to 21 (black/white).
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx jest src/utils/contrast.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/utils/contrast.ts src/utils/contrast.test.ts
git commit -F - <<'EOF'
feat: add WCAG contrast ratio helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Wall tokens, fonts and typography

**Files:**
- Modify: `src/theme/theme.ts` (full rewrite)
- Create: `src/theme/theme.test.ts`
- Modify: `src/screens/FeedScreen.tsx` (remove one shadow line)
- Modify: `src/components/DayDivider.tsx` (remove one shadow line)
- Modify: `src/screens/GroupDetailsScreen.tsx` (remove a shadow line, replace a `fontWeight`)
- Modify: `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md` (token table)

**Interfaces:**
- Consumes: `contrastRatio` from Task 2.
- Produces: `theme.colors` with `wall, seam, hairline, bone, chalk, brass, clay` plus the legacy names `background, surface, primary, secondary, muted, accentDark, text, textOnDark, danger`; `theme.fonts` with `regular, medium, semibold, bold` (family-name strings); `theme.typography` with `title, subtitle, body, caption, time`; `theme.radii` `{ sm: 2, md: 3, lg: 4, pill: 999 }`; `theme.spacing` unchanged. `theme.shadows` no longer exists.

- [ ] **Step 1: Write the failing test**

Create `src/theme/theme.test.ts`:

```ts
import { theme } from "./theme";
import { contrastRatio } from "../utils/contrast";

const { colors, typography, fonts } = theme;

// Text pairs the app draws. Small text needs 4.5:1 (WCAG AA).
const TEXT_PAIRS: Array<[string, string, string]> = [
  ["bone on wall", colors.bone, colors.wall],
  ["bone on seam", colors.bone, colors.seam],
  ["chalk on wall", colors.chalk, colors.wall],
  ["chalk on seam", colors.chalk, colors.seam],
  ["brass on wall", colors.brass, colors.wall],
  ["clay on wall", colors.clay, colors.wall],
  ["clay on seam", colors.clay, colors.seam],
  ["wall on brass", colors.wall, colors.brass],
  ["wall on bone", colors.wall, colors.bone],
  ["wall on clay", colors.wall, colors.clay],
];

describe("theme contrast", () => {
  it.each(TEXT_PAIRS)("%s meets 4.5:1", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("theme typography", () => {
  it("names a per-weight family and never sets fontWeight", () => {
    const families = Object.values(fonts) as string[];
    for (const style of Object.values(typography)) {
      expect(families).toContain(style.fontFamily);
      expect(style).not.toHaveProperty("fontWeight");
    }
  });
});

describe("legacy colour names", () => {
  it("map onto the Wall tokens", () => {
    expect(colors.background).toBe(colors.wall);
    expect(colors.surface).toBe(colors.seam);
    expect(colors.primary).toBe(colors.brass);
    expect(colors.text).toBe(colors.bone);
    expect(colors.textOnDark).toBe(colors.bone);
    expect(colors.muted).toBe(colors.chalk);
    expect(colors.danger).toBe(colors.clay);
    expect(colors.accentDark).toBe(colors.wall);
    expect(colors.secondary).toBe(colors.hairline);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest src/theme/theme.test.ts`
Expected: FAIL (`colors.bone` is undefined, so `contrastRatio` throws "Invalid hex colour", and `fonts` is undefined).

- [ ] **Step 3: Rewrite the theme**

Replace the whole of `src/theme/theme.ts` with the following. Use Task 1 Step 3's result for the `time` style: keep the `fontVariant` line if it printed `tnum: True`, delete that one line if it printed `tnum: False`.

```ts
const base = {
  wall: "#1C2320",
  seam: "#252D29",
  hairline: "#3A443E",
  bone: "#EDE8DC",
  chalk: "#949E97",
  brass: "#B08A4A",
  clay: "#DE7B73",
} as const;

export const colors = {
  ...base,
  // Legacy names, remapped so screens that have not been redesigned yet still
  // pick up the Wall look. Each redesign step moves screens onto the names
  // above; 2.0.0 deletes these.
  background: base.wall,
  surface: base.seam,
  primary: base.brass,
  secondary: base.hairline,
  muted: base.chalk,
  accentDark: base.wall,
  text: base.bone,
  textOnDark: base.bone,
  danger: base.clay,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 2,
  md: 3,
  lg: 4,
  pill: 999,
} as const;

// One family name per weight: on Android a custom font's weight comes from its
// family name, so styles must never combine these with fontWeight.
export const fonts = {
  regular: "InstrumentSans_400Regular",
  medium: "InstrumentSans_500Medium",
  semibold: "InstrumentSans_600SemiBold",
  bold: "InstrumentSans_700Bold",
} as const;

export const typography = {
  title: { fontFamily: fonts.semibold, fontSize: 22 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  caption: { fontFamily: fonts.regular, fontSize: 13 },
  time: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    // Asserted as a mutable tuple: React Native's fontVariant type rejects the
    // readonly array that the outer `as const` would otherwise produce.
    fontVariant: ["tabular-nums"] as ["tabular-nums"],
  },
} as const;

export const theme = { colors, spacing, radii, fonts, typography };
export type Theme = typeof theme;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/theme/theme.test.ts`
Expected: PASS, 12 tests (10 contrast pairs, 1 typography, 1 legacy). If a contrast pair fails, raise the failing color's lightness (or lower it for a background) until it passes, keeping the hue, and update the hex in Step 3, Step 6 and the spec.

- [ ] **Step 5: Remove the shadow spreads and the fontWeight that no longer compile or apply**

`theme.shadows` is gone, so each user must change in the same task.

In `src/screens/FeedScreen.tsx`, replace

```
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.card,
  },
  bannerText: {
```

with

```
    paddingHorizontal: theme.spacing.md,
  },
  bannerText: {
```

In `src/components/DayDivider.tsx`, replace

```
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.card,
  },
```

with

```
    paddingVertical: theme.spacing.xs,
  },
```

In `src/screens/GroupDetailsScreen.tsx`, replace

```
  card: {
    padding: theme.spacing.sm,
    ...theme.shadows.card,
  },
```

with

```
  card: {
    padding: theme.spacing.sm,
  },
```

and replace

```
    ...theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.text,
```

with

```
    ...theme.typography.subtitle,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
```

- [ ] **Step 6: Amend the spec's token table**

In `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md`, replace

```
| clay | `#C86A63` | delete only |
```

with

```
| clay | `#DE7B73` | delete only; lightened from the mockup's `#C86A63` to pass 4.5:1 on wall and seam |
| hairline | `#3A443E` | dividers, scrubber ticks, raised outlines |
```

- [ ] **Step 7: Verify everything still compiles and passes**

Run: `npx tsc --noEmit`
Expected: no errors (or only the baseline errors you noted in Task 2).

Run: `npx jest`
Expected: all suites PASS.

Run: `grep -rn "fontWeight\|theme.shadows" src --include='*.ts' --include='*.tsx'`
Expected: three component uses of `fontWeight` (one each in `TagChip.tsx`, `SegmentedControl.tsx` and `CountBadge.tsx`; Task 6 fixes these), plus the word appearing in a comment in `src/theme/theme.ts` and in two strings in `src/theme/theme.test.ts`. No `theme.shadows` anywhere.

- [ ] **Step 8: Commit**

```bash
git add src/theme src/screens/FeedScreen.tsx src/screens/GroupDetailsScreen.tsx src/components/DayDivider.tsx docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md
git commit -F - <<'EOF'
feat: Wall tokens, Instrument Sans typography and contrast tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Font loading, splash, navigation theme, status bar

**Files:**
- Create: `src/theme/useAppFonts.ts`
- Create: `src/theme/navigationTheme.ts`
- Modify: `App.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `theme.fonts`, `theme.colors` from Task 3; the font exports from Task 1.
- Produces: `useAppFonts(): boolean` (true once fonts are loaded or failed to load); `navigationTheme: Theme` for `NavigationContainer`.

- [ ] **Step 1: Write the font hook**

Create `src/theme/useAppFonts.ts`:

```ts
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
  useFonts,
} from "@expo-google-fonts/instrument-sans";
import { fonts } from "./theme";

// True once Instrument Sans is ready. A load failure also returns true so the
// app still opens, falling back to the system font.
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.regular]: InstrumentSans_400Regular,
    [fonts.medium]: InstrumentSans_500Medium,
    [fonts.semibold]: InstrumentSans_600SemiBold,
    [fonts.bold]: InstrumentSans_700Bold,
  });
  return loaded || error !== null;
}
```

- [ ] **Step 2: Write the navigation theme**

Create `src/theme/navigationTheme.ts`:

```ts
import { DarkTheme, Theme } from "@react-navigation/native";
import { colors, fonts } from "./theme";

// React Navigation reads header titles, tab labels and screen backgrounds from
// this. Every fontWeight is "400" because the weight lives in the family name.
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brass,
    background: colors.wall,
    card: colors.wall,
    text: colors.bone,
    border: colors.hairline,
    notification: colors.brass,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: "400" },
    medium: { fontFamily: fonts.medium, fontWeight: "400" },
    bold: { fontFamily: fonts.semibold, fontWeight: "400" },
    heavy: { fontFamily: fonts.bold, fontWeight: "400" },
  },
};
```

- [ ] **Step 3: Type-check the two new files**

Run: `npx tsc --noEmit`
Expected: no new errors. If `fontWeight: "400"` is rejected by the `Theme` type, read the error, then use the literal type the error names for all four entries.

- [ ] **Step 4: Wire them into `App.tsx`**

Replace the whole of `App.tsx` with:

```tsx
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { store, persistor } from './src/store/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationTheme } from './src/theme/navigationTheme';
import { useAppFonts } from './src/theme/useAppFonts';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 5: Drop the imperative status-bar call**

`App.tsx` now sets the light status bar, so remove the override in `src/navigation/RootNavigator.tsx`. Delete the line

```
import { StatusBar } from "expo-status-bar";
```

and delete the line

```
  StatusBar.setStyle("light");
```

inside `RootNavigator()` (leave `useSeedDefaultTags();` above it).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx jest`
Expected: all suites PASS.

- [ ] **Step 7: Commit**

```bash
git add src/theme/useAppFonts.ts src/theme/navigationTheme.ts App.tsx src/navigation/RootNavigator.tsx
git commit -F - <<'EOF'
feat: load Instrument Sans, hold the splash, dark navigation theme

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Flush edges and even seams for photo collages

**Files:**
- Create: `src/components/photoLayouts/tileInsets.ts`
- Test: `src/components/photoLayouts/tileInsets.test.ts`
- Modify: `src/components/PhotoStack.tsx`

**Interfaces:**
- Consumes: `Rect` from `src/components/photoLayouts/types.ts` (`x`, `y`, `width`, `height`); `tileCornerRadius` (unchanged).
- Produces: `tileInsets(rect: Rect, unitWidth: number, unitHeight: number, seam: number): { paddingTop: number; paddingRight: number; paddingBottom: number; paddingLeft: number }`. `PhotoStack` gains optional props `seam?: number` (default 2) and `cornerRadius?: number` (default 0). Later plans (Wall feed, Entry page) rely on both.

- [ ] **Step 1: Write the failing test**

Create `src/components/photoLayouts/tileInsets.test.ts`:

```ts
import { tileInsets } from "./tileInsets";

describe("tileInsets", () => {
  const seam = 2;

  it("leaves a lone tile flush on every side", () => {
    expect(tileInsets({ x: 0, y: 0, width: 4, height: 3 }, 4, 3, seam)).toEqual(
      { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
    );
  });

  it("insets only the shared edge between two side-by-side tiles", () => {
    const left = tileInsets({ x: 0, y: 0, width: 2, height: 3 }, 4, 3, seam);
    const right = tileInsets({ x: 2, y: 0, width: 2, height: 3 }, 4, 3, seam);
    expect(left).toEqual({
      paddingTop: 0,
      paddingRight: 1,
      paddingBottom: 0,
      paddingLeft: 0,
    });
    expect(right).toEqual({
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 1,
    });
  });

  it("makes the gap between neighbours equal the seam", () => {
    const left = tileInsets({ x: 0, y: 0, width: 2, height: 3 }, 4, 3, seam);
    const right = tileInsets({ x: 2, y: 0, width: 2, height: 3 }, 4, 3, seam);
    expect(left.paddingRight + right.paddingLeft).toBe(seam);
  });

  it("insets top and bottom for a tile in the middle of a column", () => {
    expect(tileInsets({ x: 0, y: 1, width: 4, height: 1 }, 4, 3, seam)).toEqual(
      { paddingTop: 1, paddingRight: 0, paddingBottom: 1, paddingLeft: 0 },
    );
  });

  it("gives zero insets when the seam is zero", () => {
    expect(tileInsets({ x: 1, y: 1, width: 1, height: 1 }, 4, 3, 0)).toEqual({
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest src/components/photoLayouts/tileInsets.test.ts`
Expected: FAIL with "Cannot find module './tileInsets'".

- [ ] **Step 3: Write the implementation**

Create `src/components/photoLayouts/tileInsets.ts`:

```ts
import { Rect } from "./types";

const EPSILON = 0.01;

export type TileInsets = {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
};

// Padding for one tile so neighbouring tiles end up `seam` apart while tiles on
// the collage's outer edge stay flush with it. Each interior edge gets half the
// seam; the neighbour on the other side supplies the other half.
export function tileInsets(
  rect: Rect,
  unitWidth: number,
  unitHeight: number,
  seam: number,
): TileInsets {
  const half = seam / 2;
  return {
    paddingLeft: rect.x <= EPSILON ? 0 : half,
    paddingTop: rect.y <= EPSILON ? 0 : half,
    paddingRight: rect.x + rect.width >= unitWidth - EPSILON ? 0 : half,
    paddingBottom: rect.y + rect.height >= unitHeight - EPSILON ? 0 : half,
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx jest src/components/photoLayouts/tileInsets.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Use it in `PhotoStack`**

In `src/components/PhotoStack.tsx`:

Replace the import block's last line and the constant

```
import { tileCornerRadius } from "./photoLayouts/tileCornerRadius";

const TILE_INSET = 2;

type Props = {
  photosByEntry: string[][];
  algorithm: PhotoLayoutAlgorithm;
  onPhotoPress?: (index: number) => void;
};

export function PhotoStack({ photosByEntry, algorithm, onPhotoPress }: Props) {
```

with

```
import { tileCornerRadius } from "./photoLayouts/tileCornerRadius";
import { tileInsets } from "./photoLayouts/tileInsets";

const DEFAULT_SEAM = 2;

type Props = {
  photosByEntry: string[][];
  algorithm: PhotoLayoutAlgorithm;
  onPhotoPress?: (index: number) => void;
  // Gap between tiles in px. The collage's outer edge stays flush.
  seam?: number;
  // Rounds the collage's outer corners only; interior corners stay square.
  cornerRadius?: number;
};

export function PhotoStack({
  photosByEntry,
  algorithm,
  onPhotoPress,
  seam = DEFAULT_SEAM,
  cornerRadius = 0,
}: Props) {
```

Replace the corner computation

```
        const corners = tileCornerRadius(
          rect,
          layout.unitWidth,
          layout.unitHeight,
          theme.radii.lg,
          theme.radii.md,
        );
```

with

```
        const corners = tileCornerRadius(
          rect,
          layout.unitWidth,
          layout.unitHeight,
          cornerRadius,
          0,
        );
```

Replace `              padding: TILE_INSET,` with

```
              ...tileInsets(rect, layout.unitWidth, layout.unitHeight, seam),
```

Replace the image placeholder color `backgroundColor: theme.colors.muted,` with `backgroundColor: theme.colors.seam,` (a bright placeholder flashes on a dark wall while photos load).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors. If `theme` is now unused in `PhotoStack.tsx`, it is still used by the `styles` block; keep the import.

Run: `npx jest`
Expected: all suites PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/photoLayouts/tileInsets.ts src/components/photoLayouts/tileInsets.test.ts src/components/PhotoStack.tsx
git commit -F - <<'EOF'
feat: flush-edge photo collages with configurable seam and corner radius

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Restyle the components whose meaning inverts

Most components flip correctly through the color aliases. These five do not: they put light text on a brass fill or use `fontWeight`.

**Files:**
- Modify: `src/components/photoLayouts/Button.tsx`
- Modify: `src/components/TagChip.tsx`
- Modify: `src/components/SegmentedControl.tsx`
- Modify: `src/components/CountBadge.tsx`
- Modify: `src/components/Fab.tsx`

**Interfaces:**
- Consumes: `theme.colors.{wall,seam,bone,chalk,brass,clay,hairline}`, `theme.fonts`, `theme.radii` from Task 3. Every component keeps its existing props and exports unchanged.

- [ ] **Step 1: Button**

In `src/components/photoLayouts/Button.tsx`, replace the body from `const backgroundColor` through the `Pressable` return with:

```tsx
  const backgroundColor = disabled
    ? theme.colors.seam
    : variant === "danger"
      ? theme.colors.clay
      : theme.colors.bone;
  const textColor = disabled ? theme.colors.chalk : theme.colors.wall;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor }, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
```

and replace the `label` style with:

```tsx
  label: {
    ...theme.typography.subtitle,
    textAlign: "center",
  },
```

- [ ] **Step 2: TagChip**

In `src/components/TagChip.tsx`, replace the `Ionicons` color line

```
        color={selected ? theme.colors.textOnDark : theme.colors.text}
```

with

```
        color={selected ? theme.colors.wall : theme.colors.chalk}
```

and replace the whole `styles` block with:

```tsx
const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.brass,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.bone,
  },
  labelSelected: {
    color: theme.colors.wall,
    fontFamily: theme.fonts.semibold,
  },
});
```

- [ ] **Step 3: SegmentedControl**

In `src/components/SegmentedControl.tsx`, replace the whole `styles` block with:

```tsx
const styles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    gap: 2,
    padding: 2,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.seam,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.radii.sm,
  },
  segmentActive: {
    backgroundColor: theme.colors.bone,
  },
  segmentText: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
  segmentTextActive: {
    color: theme.colors.wall,
    fontFamily: theme.fonts.semibold,
  },
});
```

- [ ] **Step 4: CountBadge**

In `src/components/CountBadge.tsx`, replace

```
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "700",
```

with

```
    ...theme.typography.caption,
    color: theme.colors.bone,
    fontFamily: theme.fonts.semibold,
```

- [ ] **Step 5: Fab**

In `src/components/Fab.tsx`, replace the icon line

```
      <Ionicons name="add" size={28} color={theme.colors.textOnDark} />
```

with

```
      <Ionicons name="add" size={28} color={theme.colors.wall} />
```

and replace `    backgroundColor: theme.colors.primary,` with `    backgroundColor: theme.colors.bone,`.

- [ ] **Step 6: Verify no `fontWeight` remains and everything compiles**

Run: `grep -rln "fontWeight" src --include='*.ts' --include='*.tsx'`
Expected: exactly three files — `src/theme/theme.ts` (a comment), `src/theme/theme.test.ts` (two strings), and `src/theme/navigationTheme.ts` (four literal `fontWeight: "400"` entries required by React Navigation's `Theme` type, unrelated to this app's own text styles). None of Button.tsx, TagChip.tsx, SegmentedControl.tsx, CountBadge.tsx, Fab.tsx, or any screen.

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx jest`
Expected: all suites PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -F - <<'EOF'
feat: restyle button, tag chip, segmented control, badge and fab for Wall

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Bump to 1.5.0 and hand over a test plan

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm version`)
- Modify: `app.config.js`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Bump the version**

Run: `npm version 1.5.0 --no-git-tag-version`
Expected: prints `v1.5.0`; changes `package.json` and `package-lock.json` only, creates no tag or commit.

In `app.config.js` replace `version: '1.4.1',` with `version: '1.5.0',`.

- [ ] **Step 2: Update the changelog**

In `CHANGELOG.md`, replace the whole `## [Unreleased]` section (heading and the two bullets under `### Changed`) with:

```markdown
## [Unreleased]

## [1.5.0] - 2026-09-19

Step 1 of the Wall redesign. Needs a new dev build.

### Added

- Native modules for the whole redesign: fonts, splash screen, system UI,
  linear gradient, expo-image and FlashList.
- Contrast tests for every text and background colour pair the app draws.

### Changed

- The whole app now wears the Wall look: dark green-black ground, bone text, a
  brass accent, Instrument Sans everywhere, no shadows.
- Photo collages sit flush to their edges with a 2px seam and square corners.
- Buttons, tag chips and segmented controls restyled for the dark ground.
- The app opens on a dark splash and stays on it until the font has loaded.
- Reformatted everything with prettier.
- Aligned Banner bottom padding to similar from the other feed elements.
```

- [ ] **Step 3: Full verification**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx jest`
Expected: all suites PASS.

- [ ] **Step 4: Commit the bump on its own**

```bash
git add package.json package-lock.json app.config.js CHANGELOG.md
git commit -F - <<'EOF'
bump to v1.5.0

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
```

- [ ] **Step 5: Give the user this test plan and stop**

Do not start or drive the app. Send the user:

1. Open the "(Dev)" app on the phone and connect to Metro. Expected: a dark splash, then the Feed. No white flash at any point.
2. **Feed:** dark green-black ground; cards a shade lighter; photos meet each other with a thin dark seam and no rounded corners; no drop shadows on the "No rules. Just notice." pill or the day pills. The `+` button is bone with a dark plus.
3. **Type:** every label, comment and tab title is Instrument Sans (a humanist sans). Report any text that looks like the plain system font. System alert dialogs are expected to stay system.
4. **Tabs and headers:** dark bar, brass icon on the active tab, muted grey on the others, bone header titles.
5. **Tags:** add a tag, edit one, use Select. Chips are dark grey with a grey icon; a selected chip is brass with dark text. The buttons are bone with dark text; "Cancel" is clay.
6. **Settings:** the segmented controls have a dark track with a bone active segment. The slider and switches are brass.
7. **New entry:** open it from the `+`, add a photo, type a comment. Text is readable everywhere, the date button too.
8. **Entry and photo viewer:** open a meal, then a photo, and zoom.
9. **Look for:** any text that is dark on dark or light on light, any leftover pastel or lavender, any bright grey block behind a photo while it loads.

Report anything that looks wrong and I will fix it before planning 1.6.0.
