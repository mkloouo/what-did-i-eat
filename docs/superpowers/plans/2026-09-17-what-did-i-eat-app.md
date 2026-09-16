# What Did I Eat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local-only, photo-journal food-tracking app described in the spec: five screens (Config, Feed, New Entry, Group Details, Photo Details), Redux Toolkit + redux-persist state, on-device photo storage, and a flat design system built from the agreed palette.

**Architecture:** Expo (TypeScript) app with a native-stack navigator (no tabs). Redux Toolkit holds `entries` and `settings` slices, persisted to AsyncStorage via redux-persist; photo bytes live under `FileSystem.documentDirectory + 'photos/'`, referenced by URI from entries. Feed groupings (1-hour rolling window / day bundling) are computed by a memoized selector, never stored.

**Tech Stack:** Expo SDK (managed), TypeScript, React Navigation (native stack), Redux Toolkit + react-redux + redux-persist + AsyncStorage, expo-image-picker, expo-file-system, expo-location, expo-crypto, react-native-image-viewing, Jest + jest-expo.

**Spec:** [docs/superpowers/specs/2026-09-17-what-did-i-eat-app-design.md](../specs/2026-09-17-what-did-i-eat-app-design.md)

## Global Constraints

- Fully offline — no network calls, no backend, no accounts.
- Photos are copied into the app's own sandboxed folder; never left in / read back from the system camera roll.
- Location/place-name lookup failures or permission denials must never block saving an entry (`location: null` fallback).
- No third-party UI component library — hand-rolled theme + primitives only, using the palette: background `#DFD9E2`, surface near-white, primary `#2A7F62`, secondary `#C3ACCE`, muted `#89909F`, accentDark `#538083`.
- Groups (1-hour rolling window / day bundling) are derived via selectors — never written to Redux state.
- **Per explicit user instruction: do not hand-write `package.json` or run project-scaffolding yourself.** Every dependency install and project-creation step is handed to the user as an exact CLI command block; you wait for their confirmation before continuing. You *do* write other config files (`app.json` additions, `jest.config.js`) directly, but only the parts missing from what the CLI scaffolding produced.
- No component/e2e/Detox tests in v1 — only Jest unit tests for pure logic (utils, slices, selectors, services with mocked native modules).

---

## Task 1: Project scaffolding & dependencies (user runs CLI)

**Files:**
- Create (by the user's CLI run, not by you): `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `App.tsx` (placeholder, overwritten in Task 16), `assets/`
- Modify: `app.json` (add permission plugin config — only if the scaffold doesn't already have it)
- Create: `jest.config.js` (only if the scaffold doesn't already have Jest configured)

**Interfaces:**
- Produces: a working Expo TypeScript project at the repo root, with all runtime and dev dependencies installed, `npm test` wired to Jest, and camera/photo-library/location permission strings present in `app.json`. Every later task assumes this exists.

- [ ] **Step 1: Hand the user the scaffolding commands**

Ask the user to run this from `/Users/mkloouo/Projects/what-did-i-eat` (the repo root, which currently only has `README.md`, `docs/`, `inspiration.png`, `palette.png`, `.git/`):

```bash
npx create-expo-app@latest . --template blank-typescript
```

Then, still in that directory:

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-gesture-handler

# State management & persistence
npm install @reduxjs/toolkit react-redux redux-persist
npx expo install @react-native-async-storage/async-storage

# Media, filesystem, location, ids
npx expo install expo-image-picker expo-file-system expo-location expo-crypto

# Photo viewer (zoom + swipe)
npm install react-native-image-viewing

# Testing
npm install --save-dev jest jest-expo @types/jest
npm pkg set scripts.test="jest"
```

Wait for the user to confirm these completed before continuing.

- [ ] **Step 2: Verify the scaffold**

Run: `rtk read package.json`
Expected: `dependencies` includes `expo`, `react-navigation` packages, `@reduxjs/toolkit`, `react-redux`, `redux-persist`, `expo-image-picker`, `expo-file-system`, `expo-location`, `expo-crypto`, `react-native-image-viewing`; `devDependencies` includes `jest`, `jest-expo`; `scripts.test` is `"jest"`.

If anything is missing, tell the user exactly which install command to re-run — do not `npm install` it yourself.

- [ ] **Step 3: Add permission config to `app.json` (only if missing)**

Read `app.json`. If it has no `plugins` array (or is missing the `expo-image-picker` / `expo-location` entries below), add them inside the existing `"expo": { ... }` object, preserving everything else already there (name, slug, icon, splash, etc.):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "What Did I Eat uses your photo library to attach food photos to entries.",
          "cameraPermission": "What Did I Eat uses your camera to take food photos for entries."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "What Did I Eat uses your location to note where each food photo was taken."
        }
      ]
    ]
  }
}
```

- [ ] **Step 4: Add `jest.config.js` (only if the scaffold has no Jest config)**

If there's no `jest.config.js` and no `"jest"` key in `package.json`, create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors (the fresh scaffold should compile clean).

- [ ] **Step 6: Commit**

```bash
rtk git add -A
rtk git commit -m "Scaffold Expo TypeScript project and install dependencies"
```

---

## Task 2: Data model types & design tokens

**Files:**
- Create: `src/types/models.ts`
- Create: `src/theme/theme.ts`

**Interfaces:**
- Produces: `Photo`, `EntryLocation`, `Entry`, `Settings` types (used by every slice/selector/screen from here on); `theme` object with `colors`, `spacing`, `radii`, `typography` (used by every component/screen).

- [ ] **Step 1: Create the data model types**

`src/types/models.ts`:

```ts
export type Photo = {
  id: string;
  uri: string;
};

export type EntryLocation = {
  latitude: number;
  longitude: number;
  placeName: string | null;
};

export type Entry = {
  id: string;
  createdAt: string; // ISO 8601
  comment: string;
  location: EntryLocation | null;
  photos: Photo[];
};

export type Settings = {
  bundleByDay: boolean;
};
```

- [ ] **Step 2: Create the theme tokens**

`src/theme/theme.ts`:

```ts
export const colors = {
  background: '#DFD9E2',
  surface: '#F7F5F9',
  primary: '#2A7F62',
  secondary: '#C3ACCE',
  muted: '#89909F',
  accentDark: '#538083',
  text: '#2A2A2E',
  textOnDark: '#F7F5F9',
  danger: '#B3413A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

export const theme = { colors, spacing, radii, typography };
export type Theme = typeof theme;
```

No tests — pure constants and type declarations.

- [ ] **Step 3: Commit**

```bash
rtk git add src/types/models.ts src/theme/theme.ts
rtk git commit -m "Add data model types and design tokens"
```

---

## Task 3: Utility functions (ids, dates, grouping helpers)

**Files:**
- Create: `src/utils/id.ts`
- Create: `src/utils/dateFormat.ts`
- Test: `src/utils/dateFormat.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `generateId(): string`; `dayKeyOf(iso: string): string`; `dayLabel(dayKey: string, now?: Date): string`; `formatTime(iso: string): string`; `formatFullDateTime(iso: string): string`. Used by the grouping selector (Task 7), photo storage (Task 4), and screens.

- [ ] **Step 1: Write the failing tests for `dateFormat.ts`**

`src/utils/dateFormat.test.ts`:

```ts
import { dayKeyOf, dayLabel, formatTime, formatFullDateTime } from './dateFormat';

describe('dayKeyOf', () => {
  it('returns a YYYY-MM-DD key in local time', () => {
    expect(dayKeyOf('2026-03-05T14:30:00.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('groups two timestamps on the same local day under the same key', () => {
    const morning = new Date(2026, 2, 5, 8, 0, 0).toISOString();
    const evening = new Date(2026, 2, 5, 21, 0, 0).toISOString();
    expect(dayKeyOf(morning)).toBe(dayKeyOf(evening));
  });

  it('gives different keys for different local days', () => {
    const day1 = new Date(2026, 2, 5, 23, 59, 0).toISOString();
    const day2 = new Date(2026, 2, 6, 0, 1, 0).toISOString();
    expect(dayKeyOf(day1)).not.toBe(dayKeyOf(day2));
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 2, 5, 12, 0, 0);

  it('labels today as "Today"', () => {
    expect(dayLabel(dayKeyOf(now.toISOString()), now)).toBe('Today');
  });

  it('labels yesterday as "Yesterday"', () => {
    const yesterday = new Date(2026, 2, 4, 9, 0, 0);
    expect(dayLabel(dayKeyOf(yesterday.toISOString()), now)).toBe('Yesterday');
  });

  it('labels older days with a formatted date', () => {
    const older = new Date(2026, 1, 20, 9, 0, 0);
    const label = dayLabel(dayKeyOf(older.toISOString()), now);
    expect(label).not.toBe('Today');
    expect(label).not.toBe('Yesterday');
    expect(label.length).toBeGreaterThan(0);
  });
});

describe('formatTime / formatFullDateTime', () => {
  it('formatTime returns a non-empty string', () => {
    expect(formatTime('2026-03-05T14:30:00.000Z').length).toBeGreaterThan(0);
  });

  it('formatFullDateTime returns a non-empty string', () => {
    expect(formatFullDateTime('2026-03-05T14:30:00.000Z').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk npx jest src/utils/dateFormat.test.ts`
Expected: FAIL — `dateFormat.ts` does not exist yet.

- [ ] **Step 3: Implement `dateFormat.ts`**

```ts
export function dayKeyOf(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dayLabel(dayKey: string, now: Date = new Date()): string {
  const todayKey = dayKeyOf(now.toISOString());

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = dayKeyOf(yesterday.toISOString());

  if (dayKey === todayKey) return 'Today';
  if (dayKey === yesterdayKey) return 'Yesterday';

  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npx jest src/utils/dateFormat.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Create `id.ts` (no dedicated test — trivial wrapper over a native module, exercised indirectly wherever it's used)**

```ts
import * as Crypto from 'expo-crypto';

export function generateId(): string {
  return Crypto.randomUUID();
}
```

- [ ] **Step 6: Commit**

```bash
rtk git add src/utils/id.ts src/utils/dateFormat.ts src/utils/dateFormat.test.ts
rtk git commit -m "Add id generation and date/grouping utility functions"
```

---

## Task 4: Photo storage utility

**Files:**
- Create: `src/storage/photoStorage.ts`
- Test: `src/storage/photoStorage.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `savePickedPhoto(sourceUri: string, id: string): Promise<string>` (returns the new sandboxed URI), `deletePhotoFile(uri: string): Promise<void>`. Used by New Entry screen (Task 12) and Photo Details screen (Task 15, for delete).

- [ ] **Step 1: Write the failing tests**

`src/storage/photoStorage.test.ts`:

```ts
import * as FileSystem from 'expo-file-system';
import { savePickedPhoto, deletePhotoFile } from './photoStorage';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///doc/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('savePickedPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the photos directory if it does not exist, then copies the file', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    const destUri = await savePickedPhoto('file:///tmp/picked.jpg', 'abc123');

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      'file:///doc/photos/',
      { intermediates: true }
    );
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///tmp/picked.jpg',
      to: 'file:///doc/photos/abc123.jpg',
    });
    expect(destUri).toBe('file:///doc/photos/abc123.jpg');
  });

  it('does not recreate the directory if it already exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    await savePickedPhoto('file:///tmp/picked2.jpg', 'def456');

    expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
  });
});

describe('deletePhotoFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the file when it exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    await deletePhotoFile('file:///doc/photos/abc123.jpg');

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file:///doc/photos/abc123.jpg',
      { idempotent: true }
    );
  });

  it('does nothing when the file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    await deletePhotoFile('file:///doc/photos/missing.jpg');

    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk npx jest src/storage/photoStorage.test.ts`
Expected: FAIL — `photoStorage.ts` does not exist yet.

- [ ] **Step 3: Implement `photoStorage.ts`**

```ts
import * as FileSystem from 'expo-file-system';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

async function ensurePhotosDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function savePickedPhoto(sourceUri: string, id: string): Promise<string> {
  await ensurePhotosDir();
  const destUri = `${PHOTOS_DIR}${id}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export async function deletePhotoFile(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npx jest src/storage/photoStorage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/storage/photoStorage.ts src/storage/photoStorage.test.ts
rtk git commit -m "Add photo storage utility for copying/deleting sandboxed photo files"
```

---

## Task 5: Location service

**Files:**
- Create: `src/location/locationService.ts`
- Test: `src/location/locationService.test.ts`

**Interfaces:**
- Consumes: `EntryLocation` type from `src/types/models.ts` (Task 2).
- Produces: `captureCurrentLocation(): Promise<EntryLocation | null>`. Used by New Entry screen (Task 12).

- [ ] **Step 1: Write the failing tests**

`src/location/locationService.test.ts`:

```ts
import * as Location from 'expo-location';
import { captureCurrentLocation } from './locationService';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

describe('captureCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const result = await captureCurrentLocation();

    expect(result).toBeNull();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns coordinates and a place name on success', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 50.06, longitude: 19.94 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      { street: 'Main St', city: 'Krakow' },
    ]);

    const result = await captureCurrentLocation();

    expect(result).toEqual({
      latitude: 50.06,
      longitude: 19.94,
      placeName: 'Main St, Krakow',
    });
  });

  it('falls back to a null place name when reverse geocoding fails', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 50.06, longitude: 19.94 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValue(new Error('offline'));

    const result = await captureCurrentLocation();

    expect(result).toEqual({ latitude: 50.06, longitude: 19.94, placeName: null });
  });

  it('returns null if getting the position throws', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('gps off'));

    const result = await captureCurrentLocation();

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk npx jest src/location/locationService.test.ts`
Expected: FAIL — `locationService.ts` does not exist yet.

- [ ] **Step 3: Implement `locationService.ts`**

```ts
import * as Location from 'expo-location';
import { EntryLocation } from '../types/models';

export async function captureCurrentLocation(): Promise<EntryLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = position.coords;

    let placeName: string | null = null;
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = results[0];
      if (place) {
        placeName = [place.street, place.city].filter(Boolean).join(', ') || null;
      }
    } catch {
      placeName = null;
    }

    return { latitude, longitude, placeName };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npx jest src/location/locationService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/location/locationService.ts src/location/locationService.test.ts
rtk git commit -m "Add location capture service with reverse geocoding"
```

---

## Task 6: Redux slices (entries, settings)

**Files:**
- Create: `src/store/entriesSlice.ts`
- Create: `src/store/settingsSlice.ts`
- Test: `src/store/entriesSlice.test.ts`
- Test: `src/store/settingsSlice.test.ts`

**Interfaces:**
- Consumes: `Entry`, `Settings` types from `src/types/models.ts` (Task 2).
- Produces: `entriesReducer` (default export), `addEntry`, `updateEntryComment`, `deleteEntry` actions, `EntriesState = Record<string, Entry>` type; `settingsReducer` (default export), `setBundleByDay` action. Used by the store (Task 8) and the grouping selector (Task 7, for `EntriesState`).

- [ ] **Step 1: Write the failing tests for `entriesSlice`**

`src/store/entriesSlice.test.ts`:

```ts
import reducer, { addEntry, updateEntryComment, deleteEntry } from './entriesSlice';
import { Entry } from '../types/models';

const sampleEntry: Entry = {
  id: 'e1',
  createdAt: '2026-03-05T12:00:00.000Z',
  comment: 'Lunch',
  location: null,
  photos: [{ id: 'p1', uri: 'file:///doc/photos/p1.jpg' }],
};

describe('entriesSlice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({});
  });

  it('addEntry stores the entry by id', () => {
    const state = reducer({}, addEntry(sampleEntry));
    expect(state).toEqual({ e1: sampleEntry });
  });

  it('updateEntryComment updates only the comment', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryComment({ id: 'e1', comment: 'Dinner instead' }));
    expect(state.e1.comment).toBe('Dinner instead');
    expect(state.e1.photos).toBe(sampleEntry.photos);
  });

  it('updateEntryComment is a no-op for an unknown id', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryComment({ id: 'missing', comment: 'x' }));
    expect(state).toEqual(initial);
  });

  it('deleteEntry removes the entry by id', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, deleteEntry({ id: 'e1' }));
    expect(state).toEqual({});
  });
});
```

- [ ] **Step 2: Write the failing tests for `settingsSlice`**

`src/store/settingsSlice.test.ts`:

```ts
import reducer, { setBundleByDay } from './settingsSlice';

describe('settingsSlice', () => {
  it('defaults bundleByDay to false', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ bundleByDay: false });
  });

  it('setBundleByDay toggles the flag', () => {
    const state = reducer({ bundleByDay: false }, setBundleByDay(true));
    expect(state.bundleByDay).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `rtk npx jest src/store/entriesSlice.test.ts src/store/settingsSlice.test.ts`
Expected: FAIL — slices don't exist yet.

- [ ] **Step 4: Implement `entriesSlice.ts`**

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Entry } from '../types/models';

export type EntriesState = Record<string, Entry>;

const initialState: EntriesState = {};

const entriesSlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    addEntry(state, action: PayloadAction<Entry>) {
      state[action.payload.id] = action.payload;
    },
    updateEntryComment(state, action: PayloadAction<{ id: string; comment: string }>) {
      const entry = state[action.payload.id];
      if (entry) {
        entry.comment = action.payload.comment;
      }
    },
    deleteEntry(state, action: PayloadAction<{ id: string }>) {
      delete state[action.payload.id];
    },
  },
});

export const { addEntry, updateEntryComment, deleteEntry } = entriesSlice.actions;
export default entriesSlice.reducer;
```

- [ ] **Step 5: Implement `settingsSlice.ts`**

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Settings } from '../types/models';

const initialState: Settings = {
  bundleByDay: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setBundleByDay(state, action: PayloadAction<boolean>) {
      state.bundleByDay = action.payload;
    },
  },
});

export const { setBundleByDay } = settingsSlice.actions;
export default settingsSlice.reducer;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `rtk npx jest src/store/entriesSlice.test.ts src/store/settingsSlice.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
rtk git add src/store/entriesSlice.ts src/store/settingsSlice.ts src/store/entriesSlice.test.ts src/store/settingsSlice.test.ts
rtk git commit -m "Add entries and settings Redux slices"
```

---

## Task 7: Root state type & derived feed-grouping selector

**Files:**
- Create: `src/store/rootState.ts`
- Create: `src/store/selectors/groupSelectors.ts`
- Test: `src/store/selectors/groupSelectors.test.ts`

**Interfaces:**
- Consumes: `EntriesState` from `entriesSlice.ts`, `Settings`/`Entry` from `models.ts`, `dayKeyOf` from `dateFormat.ts` (Tasks 2, 3, 6).
- Produces: `RootState` type; `EntryGroup` type `{ id, dayKey, entries: Entry[], groupTime: string, coverPhotoUri: string }`; `DaySection` type `{ dayKey: string, groups: EntryGroup[] }`; `selectFeedSections(state: RootState): DaySection[]`. Used by the store (Task 8, for consistency) and the Feed screen (Task 13).

- [ ] **Step 1: Create `rootState.ts`**

```ts
import { EntriesState } from './entriesSlice';
import { Settings } from '../types/models';

export type RootState = {
  entries: EntriesState;
  settings: Settings;
};
```

- [ ] **Step 2: Write the failing tests for the grouping selector**

`src/store/selectors/groupSelectors.test.ts`:

```ts
import { selectFeedSections } from './groupSelectors';
import { RootState } from '../rootState';
import { Entry } from '../../types/models';

function entry(id: string, iso: string, photoUri = `${id}.jpg`): Entry {
  return {
    id,
    createdAt: iso,
    comment: `comment-${id}`,
    location: null,
    photos: [{ id: `${id}-photo`, uri: photoUri }],
  };
}

function stateFrom(entries: Entry[], bundleByDay = false): RootState {
  const entriesById = Object.fromEntries(entries.map((e) => [e.id, e]));
  return { entries: entriesById, settings: { bundleByDay } };
}

describe('selectFeedSections', () => {
  it('returns no sections when there are no entries', () => {
    expect(selectFeedSections(stateFrom([]))).toEqual([]);
  });

  it('puts entries within 1 hour of each other into one group', () => {
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:45:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections).toHaveLength(1);
    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(sections[0].groups[0].groupTime).toBe(e2.createdAt);
    expect(sections[0].groups[0].coverPhotoUri).toBe(e2.photos[0].uri);
  });

  it('splits entries into separate groups when the gap exceeds 1 hour', () => {
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T13:01:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(2);
  });

  it('extends the rolling window from the last entry, not the first', () => {
    // a -> b is 55 min (merge), b -> c is 55 min (merge): total span 110 min but one group
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:55:00.000Z');
    const e3 = entry('c', '2026-03-05T13:50:00.000Z');
    const state = stateFrom([e1, e2, e3]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(sections[0].groups[0].groupTime).toBe(e3.createdAt);
  });

  it('bundles the whole day into one group when bundleByDay is true, regardless of gaps', () => {
    const e1 = entry('a', '2026-03-05T08:00:00.000Z');
    const e2 = entry('b', '2026-03-05T20:00:00.000Z');
    const state = stateFrom([e1, e2], true);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(sections[0].groups[0].groupTime).toBe(e2.createdAt);
  });

  it('creates separate day sections, newest day first', () => {
    const e1 = entry('a', '2026-03-04T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:00:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections).toHaveLength(2);
    expect(sections[0].groups[0].entries[0].id).toBe('b');
    expect(sections[1].groups[0].entries[0].id).toBe('a');
  });

  it('orders groups within a day newest first', () => {
    const e1 = entry('a', '2026-03-05T08:00:00.000Z');
    const e2 = entry('b', '2026-03-05T20:00:00.000Z'); // >1hr gap from a -> separate group
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(2);
    expect(sections[0].groups[0].entries[0].id).toBe('b');
    expect(sections[0].groups[1].entries[0].id).toBe('a');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `rtk npx jest src/store/selectors/groupSelectors.test.ts`
Expected: FAIL — `groupSelectors.ts` does not exist yet.

- [ ] **Step 4: Implement `groupSelectors.ts`**

```ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../rootState';
import { Entry } from '../../types/models';
import { dayKeyOf } from '../../utils/dateFormat';

const ONE_HOUR_MS = 60 * 60 * 1000;

export type EntryGroup = {
  id: string;
  dayKey: string;
  entries: Entry[];
  groupTime: string;
  coverPhotoUri: string;
};

export type DaySection = {
  dayKey: string;
  groups: EntryGroup[];
};

const selectEntriesById = (state: RootState) => state.entries;
const selectBundleByDay = (state: RootState) => state.settings.bundleByDay;

export const selectEntriesSortedByDate = createSelector([selectEntriesById], (entriesById): Entry[] =>
  Object.values(entriesById).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
);

function finalizeGroup(entries: Entry[], dayKey: string): EntryGroup {
  const latest = entries[entries.length - 1];
  return {
    id: `${dayKey}-${entries[0].id}`,
    dayKey,
    entries,
    groupTime: latest.createdAt,
    coverPhotoUri: latest.photos[0].uri,
  };
}

function groupEntriesWithinDay(entries: Entry[], bundleByDay: boolean, dayKey: string): EntryGroup[] {
  if (entries.length === 0) return [];

  if (bundleByDay) {
    return [finalizeGroup(entries, dayKey)];
  }

  const groups: EntryGroup[] = [];
  let current: Entry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = current[current.length - 1];
    const candidate = entries[i];
    const gap = new Date(candidate.createdAt).getTime() - new Date(prev.createdAt).getTime();

    if (gap <= ONE_HOUR_MS) {
      current.push(candidate);
    } else {
      groups.push(finalizeGroup(current, dayKey));
      current = [candidate];
    }
  }
  groups.push(finalizeGroup(current, dayKey));
  return groups;
}

export const selectFeedSections = createSelector(
  [selectEntriesSortedByDate, selectBundleByDay],
  (sortedEntries, bundleByDay): DaySection[] => {
    const byDay = new Map<string, Entry[]>();
    for (const entry of sortedEntries) {
      const key = dayKeyOf(entry.createdAt);
      const list = byDay.get(key) ?? [];
      list.push(entry);
      byDay.set(key, list);
    }

    const dayKeys = Array.from(byDay.keys()).sort().reverse();

    return dayKeys.map((dayKey) => {
      const dayEntries = byDay.get(dayKey)!;
      const groups = groupEntriesWithinDay(dayEntries, bundleByDay, dayKey).reverse();
      return { dayKey, groups };
    });
  }
);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `rtk npx jest src/store/selectors/groupSelectors.test.ts`
Expected: PASS (all 7 tests green).

- [ ] **Step 6: Commit**

```bash
rtk git add src/store/rootState.ts src/store/selectors/groupSelectors.ts src/store/selectors/groupSelectors.test.ts
rtk git commit -m "Add derived feed-grouping selector with rolling-window and day-bundling logic"
```

---

## Task 8: Redux store, persistence & typed hooks

**Files:**
- Create: `src/store/store.ts`
- Create: `src/store/hooks.ts`

**Interfaces:**
- Consumes: `entriesReducer`, `settingsReducer` (Task 6).
- Produces: `store`, `persistor`, `AppDispatch` type; `useAppDispatch()`, `useAppSelector` typed hooks. Used by `App.tsx` (Task 16) and every screen (Tasks 11-15).

- [ ] **Step 1: Implement `store.ts`**

No dedicated unit test — this is integration wiring (Redux + redux-persist + AsyncStorage), verified by the app running rather than in isolation; covered by the manual test plan at the end.

```ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import entriesReducer from './entriesSlice';
import settingsReducer from './settingsSlice';

const rootReducer = combineReducers({
  entries: entriesReducer,
  settings: settingsReducer,
});

const persistConfig = {
  key: 'what-did-i-eat',
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 2: Implement `hooks.ts`**

```ts
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch } from './store';
import type { RootState } from './rootState';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add src/store/store.ts src/store/hooks.ts
rtk git commit -m "Add Redux store with redux-persist and typed hooks"
```

---

## Task 9: Reusable UI primitives

**Files:**
- Create: `src/components/Button.tsx`
- Create: `src/components/IconButton.tsx`
- Create: `src/components/Card.tsx`
- Create: `src/components/PhotoThumbnail.tsx`
- Create: `src/components/DayDivider.tsx`

**Interfaces:**
- Consumes: `theme` from `src/theme/theme.ts` (Task 2).
- Produces: `Button`, `IconButton`, `Card`, `PhotoThumbnail`, `DayDivider` components. Used by all screens (Tasks 11-15).

No unit tests — presentational components, no component-test tooling in v1 per the spec. Verified visually via the manual test plan.

- [ ] **Step 1: Create `Button.tsx`**

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
  style?: ViewStyle;
};

export function Button({ label, onPress, disabled, variant = 'primary', style }: Props) {
  const backgroundColor = disabled
    ? theme.colors.muted
    : variant === 'danger'
    ? theme.colors.danger
    : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor }, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  label: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
});
```

- [ ] **Step 2: Create `IconButton.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
};

export function IconButton({ name, onPress, color = theme.colors.textOnDark, size = 24 }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.hitArea}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    padding: theme.spacing.sm,
  },
});
```

- [ ] **Step 3: Create `Card.tsx`**

```tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
});
```

- [ ] **Step 4: Create `PhotoThumbnail.tsx`**

```tsx
import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  uri: string;
  size?: number;
  badgeCount?: number;
};

export function PhotoThumbnail({ uri, size = 96, badgeCount }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="cover"
      />
      {badgeCount && badgeCount > 1 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+{badgeCount - 1}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.muted,
  },
  badge: {
    position: 'absolute',
    bottom: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '700',
  },
});
```

- [ ] **Step 5: Create `DayDivider.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  label: string;
};

export function DayDivider({ label }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    ...theme.typography.subtitle,
    color: theme.colors.muted,
  },
});
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
rtk git add src/components
rtk git commit -m "Add reusable UI primitives (Button, IconButton, Card, PhotoThumbnail, DayDivider)"
```

---

## Task 10: Navigation setup

**Files:**
- Create: `src/navigation/types.ts`
- Create: `src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `theme` (Task 2), `IconButton` (Task 9). Screens themselves (Tasks 11-15) are imported here but this task creates placeholder-free navigator wiring — later tasks fill in the actual screen components it imports, so this task's navigator file is written *last among files it depends on being present*; since screens don't exist yet, this task creates stub screens that Task 11-15 will fully implement in place (see note in Step 1).
- Produces: `RootStackParamList` type; `RootNavigator` component. Used by `App.tsx` (Task 16).

> Note on ordering: to avoid forward-referencing files that don't exist yet, this task creates the five screen files as minimal (but real, rendering) placeholders — a `View` with the screen's title — wired into the navigator with correct types. Tasks 11-15 then replace each placeholder's contents with the real implementation; they do not change the file's export shape, so `RootNavigator.tsx` never needs to change again.

- [ ] **Step 1: Create `navigation/types.ts`**

```ts
export type RootStackParamList = {
  Feed: undefined;
  Config: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  PhotoDetails: { entryId: string; photoIndex: number };
};
```

- [ ] **Step 2: Create minimal placeholder screens**

`src/screens/FeedScreen.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function FeedScreen() {
  return (
    <View>
      <Text>Feed</Text>
    </View>
  );
}
```

`src/screens/ConfigScreen.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function ConfigScreen() {
  return (
    <View>
      <Text>Config</Text>
    </View>
  );
}
```

`src/screens/NewEntryScreen.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function NewEntryScreen() {
  return (
    <View>
      <Text>New Entry</Text>
    </View>
  );
}
```

`src/screens/GroupDetailsScreen.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function GroupDetailsScreen() {
  return (
    <View>
      <Text>Group Details</Text>
    </View>
  );
}
```

`src/screens/PhotoDetailsScreen.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function PhotoDetailsScreen() {
  return (
    <View>
      <Text>Photo Details</Text>
    </View>
  );
}
```

- [ ] **Step 3: Create `RootNavigator.tsx`**

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { theme } from '../theme/theme';
import { IconButton } from '../components/IconButton';
import { FeedScreen } from '../screens/FeedScreen';
import { ConfigScreen } from '../screens/ConfigScreen';
import { NewEntryScreen } from '../screens/NewEntryScreen';
import { GroupDetailsScreen } from '../screens/GroupDetailsScreen';
import { PhotoDetailsScreen } from '../screens/PhotoDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.accentDark },
        headerTintColor: theme.colors.textOnDark,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={({ navigation }) => ({
          title: 'What Did I Eat',
          headerLeft: () => (
            <IconButton name="settings-outline" onPress={() => navigation.navigate('Config')} />
          ),
          headerRight: () => (
            <IconButton name="add-circle-outline" onPress={() => navigation.navigate('NewEntry')} />
          ),
        })}
      />
      <Stack.Screen name="Config" component={ConfigScreen} options={{ title: 'Config' }} />
      <Stack.Screen name="NewEntry" component={NewEntryScreen} options={{ title: 'New Entry' }} />
      <Stack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={{ title: 'Entries' }}
      />
      <Stack.Screen
        name="PhotoDetails"
        component={PhotoDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
rtk git add src/navigation src/screens
rtk git commit -m "Add navigation stack with placeholder screens"
```

---

## Task 11: Config screen

**Files:**
- Modify: `src/screens/ConfigScreen.tsx` (replacing the Task 10 placeholder)

**Interfaces:**
- Consumes: `useAppSelector`, `useAppDispatch` (Task 8), `setBundleByDay` action (Task 6), `theme` (Task 2).
- Produces: full `ConfigScreen` component. No other task depends on its internals.

- [ ] **Step 1: Implement `ConfigScreen.tsx`**

```tsx
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setBundleByDay } from '../store/settingsSlice';
import { theme } from '../theme/theme';

export function ConfigScreen() {
  const bundleByDay = useAppSelector((state) => state.settings.bundleByDay);
  const dispatch = useAppDispatch();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Bundle by day</Text>
          <Text style={styles.description}>
            Group every photo from the same day together, instead of the default 1-hour grouping.
          </Text>
        </View>
        <Switch
          value={bundleByDay}
          onValueChange={(value) => dispatch(setBundleByDay(value))}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={theme.colors.surface}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
  textBlock: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  label: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add src/screens/ConfigScreen.tsx
rtk git commit -m "Implement Config screen with bundle-by-day toggle"
```

---

## Task 12: New Entry screen

**Files:**
- Modify: `src/screens/NewEntryScreen.tsx` (replacing the Task 10 placeholder)

**Interfaces:**
- Consumes: `useAppDispatch` (Task 8), `addEntry` action (Task 6), `generateId` (Task 3), `savePickedPhoto` (Task 4), `captureCurrentLocation` (Task 5), `Photo`/`Entry` types (Task 2), `Button`/`PhotoThumbnail` (Task 9), `RootStackParamList` (Task 10).
- Produces: full `NewEntryScreen` component. No other task depends on its internals.

- [ ] **Step 1: Implement `NewEntryScreen.tsx`**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store/hooks';
import { addEntry } from '../store/entriesSlice';
import { generateId } from '../utils/id';
import { savePickedPhoto } from '../storage/photoStorage';
import { captureCurrentLocation } from '../location/locationService';
import { Photo } from '../types/models';
import { Button } from '../components/Button';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NewEntry'>;

export function NewEntryScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  async function addPickedAssets(assetUris: string[]) {
    try {
      const saved = await Promise.all(
        assetUris.map(async (uri) => {
          const id = generateId();
          const destUri = await savePickedPhoto(uri, id);
          return { id, uri: destUri };
        })
      );
      setPhotos((current) => [...current, ...saved]);
    } catch {
      Alert.alert('Could not save photo', 'Something went wrong saving that photo. Please try again.');
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera unavailable', 'Camera permission was denied.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      await addPickedAssets(result.assets.map((a) => a.uri));
    }
  }

  async function handlePickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo library unavailable', 'Photo library permission was denied.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      await addPickedAssets(result.assets.map((a) => a.uri));
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => current.filter((p) => p.id !== id));
  }

  async function handleAdd() {
    if (photos.length === 0) return;
    setSaving(true);
    try {
      const location = await captureCurrentLocation();
      dispatch(
        addEntry({
          id: generateId(),
          createdAt: new Date().toISOString(),
          comment,
          location,
          photos,
        })
      );
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pickerRow}>
        <Button label="Take photo" onPress={handleTakePhoto} style={styles.pickerButton} />
        <Button label="Choose from library" onPress={handlePickFromLibrary} style={styles.pickerButton} />
      </View>

      {photos.length > 0 ? (
        <View style={styles.thumbnailRow}>
          {photos.map((photo) => (
            <Pressable key={photo.id} onLongPress={() => removePhoto(photo.id)} style={styles.thumbnailWrapper}>
              <PhotoThumbnail uri={photo.uri} size={80} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>Add at least one photo. Long-press a thumbnail to remove it.</Text>
      )}

      <TextInput
        style={styles.commentInput}
        placeholder="What did you eat?"
        placeholderTextColor={theme.colors.muted}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <Button
        label={saving ? 'Adding…' : 'Add'}
        onPress={handleAdd}
        disabled={photos.length === 0 || saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pickerButton: {
    flex: 1,
  },
  thumbnailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  thumbnailWrapper: {},
  hint: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    minHeight: 96,
    textAlignVertical: 'top',
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add src/screens/NewEntryScreen.tsx
rtk git commit -m "Implement New Entry screen with photo capture and location tagging"
```

---

## Task 13: Feed screen

**Files:**
- Modify: `src/screens/FeedScreen.tsx` (replacing the Task 10 placeholder)

**Interfaces:**
- Consumes: `useAppSelector` (Task 8), `selectFeedSections`/`EntryGroup` (Task 7), `dayLabel`/`formatTime` (Task 3), `Card`/`PhotoThumbnail`/`DayDivider` (Task 9), `RootStackParamList` (Task 10).
- Produces: full `FeedScreen` component. No other task depends on its internals.

- [ ] **Step 1: Implement `FeedScreen.tsx`**

```tsx
import React from 'react';
import { SectionList, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { selectFeedSections, EntryGroup } from '../store/selectors/groupSelectors';
import { dayLabel, formatTime } from '../utils/dateFormat';
import { Card } from '../components/Card';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { DayDivider } from '../components/DayDivider';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Feed'>;

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const sections = useAppSelector(selectFeedSections);

  function openGroup(group: EntryGroup) {
    if (group.entries.length === 1) {
      navigation.navigate('PhotoDetails', { entryId: group.entries[0].id, photoIndex: 0 });
    } else {
      navigation.navigate('GroupDetails', { entryIds: group.entries.map((e) => e.id) });
    }
  }

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Nothing logged yet</Text>
        <Text style={styles.emptyBody}>Tap the + above to log your first photo.</Text>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.list}
      sections={sections.map((section) => ({
        title: dayLabel(section.dayKey),
        data: section.groups,
        key: section.dayKey,
      }))}
      keyExtractor={(group) => group.id}
      renderSectionHeader={({ section }) => <DayDivider label={section.title} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => openGroup(item)} style={styles.itemWrapper}>
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <PhotoThumbnail uri={item.coverPhotoUri} size={72} badgeCount={item.entries.length} />
              <View style={styles.cardText}>
                <Text style={styles.cardTime}>{formatTime(item.groupTime)}</Text>
                <Text style={styles.cardComment} numberOfLines={2}>
                  {item.entries[item.entries.length - 1].comment || 'No comment'}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  itemWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  card: {},
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  cardTime: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  cardComment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add src/screens/FeedScreen.tsx
rtk git commit -m "Implement Feed screen with day/hour grouped list"
```

---

## Task 14: Group Details screen

**Files:**
- Modify: `src/screens/GroupDetailsScreen.tsx` (replacing the Task 10 placeholder)

**Interfaces:**
- Consumes: `useAppSelector` (Task 8), `formatTime` (Task 3), `Card`/`PhotoThumbnail` (Task 9), `RootStackParamList` (Task 10).
- Produces: full `GroupDetailsScreen` component. No other task depends on its internals.

- [ ] **Step 1: Implement `GroupDetailsScreen.tsx`**

```tsx
import React from 'react';
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { formatTime } from '../utils/dateFormat';
import { Card } from '../components/Card';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GroupDetails'>;
type Route = RouteProp<RootStackParamList, 'GroupDetails'>;

export function GroupDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryIds } = route.params;

  const entries = useAppSelector((state) =>
    entryIds.map((id) => state.entries[id]).filter((entry) => entry !== undefined)
  );

  return (
    <FlatList
      style={styles.list}
      data={entries}
      keyExtractor={(entry) => entry.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('PhotoDetails', { entryId: item.id, photoIndex: 0 })}
        >
          <Card style={styles.card}>
            <PhotoThumbnail uri={item.photos[0].uri} size={220} badgeCount={item.photos.length} />
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            <Text style={styles.comment}>{item.comment || 'No comment'}</Text>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    alignItems: 'center',
  },
  time: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add src/screens/GroupDetailsScreen.tsx
rtk git commit -m "Implement Group Details screen"
```

---

## Task 15: Photo Details screen

**Files:**
- Modify: `src/screens/PhotoDetailsScreen.tsx` (replacing the Task 10 placeholder)

**Interfaces:**
- Consumes: `useAppSelector`/`useAppDispatch` (Task 8), `updateEntryComment`/`deleteEntry` actions (Task 6), `deletePhotoFile` (Task 4), `formatFullDateTime` (Task 3), `RootStackParamList` (Task 10).
- Produces: full `PhotoDetailsScreen` component. No other task depends on its internals.

- [ ] **Step 1: Implement `PhotoDetailsScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, SafeAreaView } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateEntryComment, deleteEntry } from '../store/entriesSlice';
import { deletePhotoFile } from '../storage/photoStorage';
import { formatFullDateTime } from '../utils/dateFormat';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PhotoDetails'>;
type Route = RouteProp<RootStackParamList, 'PhotoDetails'>;

export function PhotoDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId, photoIndex } = route.params;
  const dispatch = useAppDispatch();

  const entry = useAppSelector((state) => state.entries[entryId]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? '');

  if (!entry) {
    return (
      <SafeAreaView style={styles.missing}>
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate('Feed')} />
      </SafeAreaView>
    );
  }

  function saveComment() {
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    setIsEditing(false);
  }

  function confirmDelete() {
    Alert.alert('Delete entry?', 'This removes the photo(s) and comment permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Promise.all(entry.photos.map((photo) => deletePhotoFile(photo.uri)));
          dispatch(deleteEntry({ id: entry.id }));
          navigation.navigate('Feed');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ImageViewing
        images={entry.photos.map((photo) => ({ uri: photo.uri }))}
        imageIndex={photoIndex}
        visible
        onRequestClose={() => navigation.goBack()}
        FooterComponent={() => (
          <SafeAreaView style={styles.footer}>
            <Text style={styles.footerMeta}>{formatFullDateTime(entry.createdAt)}</Text>
            {entry.location?.placeName ? (
              <Text style={styles.footerMeta}>{entry.location.placeName}</Text>
            ) : null}

            {isEditing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={draftComment}
                  onChangeText={setDraftComment}
                  multiline
                  placeholder="Comment"
                  placeholderTextColor={theme.colors.muted}
                />
                <View style={styles.editButtons}>
                  <Button label="Cancel" variant="danger" onPress={() => setIsEditing(false)} />
                  <Button label="Save" onPress={saveComment} />
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={styles.comment}>{entry.comment || 'No comment — tap to add one'}</Text>
              </Pressable>
            )}
          </SafeAreaView>
        )}
      />

      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBarButton}>
          <Text style={styles.topBarButtonText}>Close</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} style={styles.topBarButton}>
          <Text style={[styles.topBarButtonText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  topBarButton: {
    padding: theme.spacing.sm,
  },
  topBarButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  deleteText: {
    color: theme.colors.danger,
  },
  footer: {
    backgroundColor: theme.colors.accentDark,
    padding: theme.spacing.md,
  },
  footerMeta: {
    ...theme.typography.caption,
    color: theme.colors.textOnDark,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.textOnDark,
    marginTop: theme.spacing.sm,
  },
  editRow: {
    marginTop: theme.spacing.sm,
  },
  editInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 64,
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add src/screens/PhotoDetailsScreen.tsx
rtk git commit -m "Implement Photo Details screen with zoom/swipe, edit, and delete"
```

---

## Task 16: App entry point wiring

**Files:**
- Modify: `App.tsx` (the scaffold's placeholder, from Task 1)

**Interfaces:**
- Consumes: `store`/`persistor` (Task 8), `RootNavigator` (Task 10).
- Produces: the app's root component. Nothing else depends on this — it's the top of the tree.

- [ ] **Step 1: Implement `App.tsx`**

```tsx
import 'react-native-gesture-handler';
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { store, persistor } from './src/store/store';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `rtk npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the full test suite**

Run: `rtk npx jest`
Expected: all suites pass (dateFormat, photoStorage, locationService, entriesSlice, settingsSlice, groupSelectors).

- [ ] **Step 4: Commit**

```bash
rtk git add App.tsx
rtk git commit -m "Wire up App root: Redux provider, persistence gate, navigation"
```

- [ ] **Step 5: Hand the user a manual test plan**

Per the user's stated testing preference, do not start the dev server or drive the app yourself. Instead give them a step-by-step plan: `npx expo start`, open on a device/simulator, and walk through logging an entry (camera + library, multiple photos, comment), verifying Feed grouping (within 1 hour vs. after a 1hr+ gap), toggling "Bundle by day" in Config and confirming the Feed regroups, opening Group Details and Photo Details, editing a comment, deleting an entry, and confirming persistence across an app restart.

---

## Post-plan note

This plan intentionally has no task for "add e2e tests" or "add a UI component library" — both are out of scope per the spec's YAGNI section. If bundling/grouping requirements change later, `groupSelectors.ts` and its test file are the only places that should need to change.
