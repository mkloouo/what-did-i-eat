# Tabs, Settings & Meal Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the app around a bottom Tab Navigator (Feed / Tags / Settings), move grouping/photo-layout controls into a proper Settings screen with a configurable rolling-window slider, and add a full meal-tags feature (tag CRUD + attaching tags to entries).

**Architecture:** A Tab Navigator (Feed/Tags/Settings) becomes the initial route of the existing root Stack Navigator, so `NewEntry`/`GroupDetails`/`PhotoDetails` keep pushing full-screen on top with the tab bar hidden. Settings moves `bundleByDay` to a `groupingMode`/`rollingWindowMinutes` pair. Tags are a new flat `Record<string, Tag>` slice, referenced by id from `Entry.tagIds`, resolved defensively (`?? []`) since older persisted entries won't have the field.

**Tech Stack:** React Native + Expo (SDK ~57), TypeScript, Redux Toolkit + redux-persist, React Navigation (native-stack + new bottom-tabs), Jest (jest-expo preset, logic-only unit tests — no component tests in this repo).

**Spec:** [docs/superpowers/specs/2026-09-17-tabs-settings-tags-design.md](../specs/2026-09-17-tabs-settings-tags-design.md)

## Global Constraints

- Expo SDK ~57.0.23 (managed workflow) — check https://docs.expo.dev/versions/v57.0.0/ for any package's current API before using it.
- Install any new native-module dependency via `npx expo install <pkg>` (matches how `@react-native-community/datetimepicker` was already added) — never plain `npm install` for those.
- This repo has zero React component tests (no React Testing Library) — only pure-logic unit tests (slices, selectors, utils) run under the `jest-expo` preset. Tasks that only touch screen/UI files are verified via `npx tsc --noEmit`, not new test files.
- Follow the existing defensive-optional-field convention (`location: EntryLocation | null`) — `Entry.tagIds` is optional (`tagIds?: string[]`) and always read as `entry.tagIds ?? []`; no redux-persist migration is added.
- Do not interactively launch/drive the app (`expo start`, simulators, emulators) to verify any task. Each task is verified with `jest`/`tsc` only. A manual test plan for the user is produced once the whole plan is complete.
- Prefix shell commands with `rtk` when it has a matching subcommand (`rtk git ...`, `rtk jest`, `rtk tsc`); run commands `rtk` has no subcommand for (`npx expo install`, etc.) unprefixed.

---

### Task 1: Settings & grouping data model (rolling window replaces bundleByDay)

**Files:**
- Modify: `src/types/models.ts`
- Modify: `src/store/settingsSlice.ts`
- Modify: `src/store/settingsSlice.test.ts`
- Modify: `src/store/selectors/groupSelectors.ts`
- Modify: `src/store/selectors/groupSelectors.test.ts`
- Modify: `src/navigation/RootNavigator.tsx`
- Delete: `src/components/GroupingMenu.tsx`

**Interfaces:**
- Produces: `GroupingMode = 'rolling' | 'day'`; `Settings = { groupingMode: GroupingMode; rollingWindowMinutes: number; photoLayoutAlgorithm: PhotoLayoutAlgorithm }`; `setGroupingMode(mode: GroupingMode)`, `setRollingWindowMinutes(minutes: number)`, `setPhotoLayoutAlgorithm(algo: PhotoLayoutAlgorithm)` action creators from `settingsSlice`; `selectFeedSections` now reads `groupingMode`/`rollingWindowMinutes` instead of `bundleByDay`.
- Consumes: nothing new — this is the base task.

- [ ] **Step 1: Write the failing tests**

Replace `src/store/settingsSlice.test.ts` entirely:

```ts
import reducer, {
  setGroupingMode,
  setRollingWindowMinutes,
  setPhotoLayoutAlgorithm,
} from './settingsSlice';

describe('settingsSlice', () => {
  it('defaults to a 60-minute rolling window and treemap layout', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      groupingMode: 'rolling',
      rollingWindowMinutes: 60,
      photoLayoutAlgorithm: 'treemap',
    });
  });

  it('setGroupingMode switches mode', () => {
    const state = reducer(
      { groupingMode: 'rolling', rollingWindowMinutes: 60, photoLayoutAlgorithm: 'treemap' },
      setGroupingMode('day')
    );
    expect(state.groupingMode).toBe('day');
  });

  it('setRollingWindowMinutes updates the window', () => {
    const state = reducer(
      { groupingMode: 'rolling', rollingWindowMinutes: 60, photoLayoutAlgorithm: 'treemap' },
      setRollingWindowMinutes(120)
    );
    expect(state.rollingWindowMinutes).toBe(120);
  });

  it('setPhotoLayoutAlgorithm switches the algorithm', () => {
    const state = reducer(
      { groupingMode: 'rolling', rollingWindowMinutes: 60, photoLayoutAlgorithm: 'treemap' },
      setPhotoLayoutAlgorithm('masonry')
    );
    expect(state.photoLayoutAlgorithm).toBe('masonry');
  });
});
```

Replace `src/store/selectors/groupSelectors.test.ts` entirely:

```ts
import { selectFeedSections } from './groupSelectors';
import { RootState } from '../rootState';
import { Entry, GroupingMode } from '../../types/models';
import { resolvePhotoUri } from '../../storage/photoStorage';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///doc/',
}));

function entry(id: string, iso: string, photoUri = `${id}.jpg`): Entry {
  return {
    id,
    createdAt: iso,
    comment: `comment-${id}`,
    location: null,
    photos: [{ id: `${id}-photo`, uri: photoUri }],
  };
}

function stateFrom(
  entries: Entry[],
  groupingMode: GroupingMode = 'rolling',
  rollingWindowMinutes = 60
): RootState {
  const entriesById = Object.fromEntries(entries.map((e) => [e.id, e]));
  return {
    entries: entriesById,
    settings: { groupingMode, rollingWindowMinutes, photoLayoutAlgorithm: 'treemap' },
  };
}

describe('selectFeedSections', () => {
  it('returns no sections when there are no entries', () => {
    expect(selectFeedSections(stateFrom([]))).toEqual([]);
  });

  it('puts entries within the rolling window of each other into one group', () => {
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:45:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections).toHaveLength(1);
    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e2.createdAt);
    expect(sections[0].groups[0].photosByEntry).toEqual([
      [resolvePhotoUri(e1.photos[0].uri)],
      [resolvePhotoUri(e2.photos[0].uri)],
    ]);
  });

  it('keeps each entry\'s photos in their own sub-array, in entry then photo order', () => {
    const e1: Entry = {
      id: 'a',
      createdAt: '2026-03-05T12:00:00.000Z',
      comment: 'comment-a',
      location: null,
      photos: [
        { id: 'a-1', uri: 'a-1.jpg' },
        { id: 'a-2', uri: 'a-2.jpg' },
      ],
    };
    const e2 = entry('b', '2026-03-05T12:30:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups[0].photosByEntry).toEqual([
      [resolvePhotoUri('a-1.jpg'), resolvePhotoUri('a-2.jpg')],
      [resolvePhotoUri(e2.photos[0].uri)],
    ]);
  });

  it('splits entries into separate groups when the gap exceeds the rolling window', () => {
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
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e3.createdAt);
  });

  it('uses a configurable window instead of a fixed hour', () => {
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:40:00.000Z'); // 40 min gap

    expect(selectFeedSections(stateFrom([e1, e2], 'rolling', 30))[0].groups).toHaveLength(2);
    expect(selectFeedSections(stateFrom([e1, e2], 'rolling', 60))[0].groups).toHaveLength(1);
  });

  it('bundles the whole day into one group when groupingMode is "day", regardless of gaps', () => {
    const e1 = entry('a', '2026-03-05T08:00:00.000Z');
    const e2 = entry('b', '2026-03-05T20:00:00.000Z');
    const state = stateFrom([e1, e2], 'day');

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e2.createdAt);
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

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk jest src/store/settingsSlice.test.ts src/store/selectors/groupSelectors.test.ts`
Expected: FAIL (imports `setGroupingMode`/`GroupingMode` etc. don't exist yet).

- [ ] **Step 3: Update `src/types/models.ts`**

Change:

```ts
export type PhotoLayoutAlgorithm = 'masonry' | 'treemap';

export type Settings = {
  bundleByDay: boolean;
  photoLayoutAlgorithm: PhotoLayoutAlgorithm;
};
```

to:

```ts
export type PhotoLayoutAlgorithm = 'masonry' | 'treemap';

export type GroupingMode = 'rolling' | 'day';

export type Settings = {
  groupingMode: GroupingMode;
  rollingWindowMinutes: number;
  photoLayoutAlgorithm: PhotoLayoutAlgorithm;
};
```

- [ ] **Step 4: Rewrite `src/store/settingsSlice.ts`**

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GroupingMode, PhotoLayoutAlgorithm, Settings } from '../types/models';

const initialState: Settings = {
  groupingMode: 'rolling',
  rollingWindowMinutes: 60,
  photoLayoutAlgorithm: 'treemap',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setGroupingMode(state, action: PayloadAction<GroupingMode>) {
      state.groupingMode = action.payload;
    },
    setRollingWindowMinutes(state, action: PayloadAction<number>) {
      state.rollingWindowMinutes = action.payload;
    },
    setPhotoLayoutAlgorithm(state, action: PayloadAction<PhotoLayoutAlgorithm>) {
      state.photoLayoutAlgorithm = action.payload;
    },
  },
});

export const { setGroupingMode, setRollingWindowMinutes, setPhotoLayoutAlgorithm } =
  settingsSlice.actions;
export default settingsSlice.reducer;
```

- [ ] **Step 5: Rewrite `src/store/selectors/groupSelectors.ts`**

```ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../rootState';
import { Entry, GroupingMode } from '../../types/models';
import { dayKeyOf } from '../../utils/dateFormat';
import { resolvePhotoUri } from '../../storage/photoStorage';

export type EntryGroup = {
  id: string;
  dayKey: string;
  entries: Entry[];
  timeFrom: string;
  timeTo: string;
  photosByEntry: string[][];
};

export type DaySection = {
  dayKey: string;
  groups: EntryGroup[];
};

const selectEntriesById = (state: RootState) => state.entries;
const selectGroupingMode = (state: RootState) => state.settings.groupingMode;
const selectRollingWindowMinutes = (state: RootState) => state.settings.rollingWindowMinutes;

export const selectEntriesSortedByDate = createSelector([selectEntriesById], (entriesById): Entry[] =>
  Object.values(entriesById).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
);

function finalizeGroup(entries: Entry[], dayKey: string): EntryGroup {
  const first = entries[0];
  const last = entries[entries.length - 1];

  return {
    id: `${dayKey}-${entries[0].id}`,
    dayKey,
    entries,
    timeFrom: first.createdAt,
    timeTo: last.createdAt,
    photosByEntry: entries.map((entry) => entry.photos.map((photo) => resolvePhotoUri(photo.uri))),
  };
}

function groupEntriesWithinDay(
  entries: Entry[],
  groupingMode: GroupingMode,
  windowMs: number,
  dayKey: string
): EntryGroup[] {
  if (entries.length === 0) return [];

  if (groupingMode === 'day') {
    return [finalizeGroup(entries, dayKey)];
  }

  const groups: EntryGroup[] = [];
  let current: Entry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = current[current.length - 1];
    const candidate = entries[i];
    const gap = new Date(candidate.createdAt).getTime() - new Date(prev.createdAt).getTime();

    if (gap <= windowMs) {
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
  [selectEntriesSortedByDate, selectGroupingMode, selectRollingWindowMinutes],
  (sortedEntries, groupingMode, rollingWindowMinutes): DaySection[] => {
    const windowMs = rollingWindowMinutes * 60_000;
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
      const groups = groupEntriesWithinDay(dayEntries, groupingMode, windowMs, dayKey).reverse();
      return { dayKey, groups };
    });
  }
);
```

- [ ] **Step 6: Delete `src/components/GroupingMenu.tsx` and strip its wiring**

Delete the file. In `src/navigation/RootNavigator.tsx`, remove the `GroupingMenu` import and change the `Feed` screen's options from:

```tsx
options={{
  title: 'What Did I Eat',
  headerRight: () => <GroupingMenu />,
}}
```

to:

```tsx
options={{ title: 'What Did I Eat' }}
```

(Task 2 will replace this whole `Feed` stack screen with a nested `Tabs` screen — this step just keeps the repo compiling in the meantime.)

- [ ] **Step 7: Run tests to verify they pass**

Run: `rtk jest src/store/settingsSlice.test.ts src/store/selectors/groupSelectors.test.ts`
Expected: PASS

- [ ] **Step 8: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
rtk git add src/types/models.ts src/store/settingsSlice.ts src/store/settingsSlice.test.ts src/store/selectors/groupSelectors.ts src/store/selectors/groupSelectors.test.ts src/navigation/RootNavigator.tsx
rtk git rm src/components/GroupingMenu.tsx
rtk git commit -m "feat: replace bundleByDay with configurable rolling-window grouping mode"
```

---

### Task 2: Tab navigation shell (Feed / Tags / Settings)

**Files:**
- Modify: `src/navigation/types.ts`
- Create: `src/navigation/TabNavigator.tsx`
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/screens/FeedScreen.tsx`
- Modify: `src/screens/PhotoDetailsScreen.tsx`
- Create: `src/screens/SettingsScreen.tsx` (placeholder body — Task 3 fills it in)
- Create: `src/screens/TagsScreen.tsx` (placeholder body — Task 6 fills it in)

**Interfaces:**
- Consumes: nothing from Task 1 directly (this task is pure navigation plumbing).
- Produces: `RootStackParamList = { Tabs: undefined; NewEntry: undefined; GroupDetails: {...}; PhotoDetails: {...} }`; `TabParamList = { Feed: undefined; Tags: undefined; Settings: undefined }`; exported `TabNavigator`, `SettingsScreen`, `TagsScreen` components. Later tasks (3, 6) modify `SettingsScreen.tsx`/`TagsScreen.tsx`'s bodies but keep these same exported component names.

- [ ] **Step 1: Install the bottom-tabs package**

Run (unprefixed — `rtk` has no subcommand for `expo install`): `npx expo install @react-navigation/bottom-tabs`
Expected: adds `@react-navigation/bottom-tabs` to `package.json`/`package-lock.json`.

- [ ] **Step 2: Update `src/navigation/types.ts`**

```ts
export type RootStackParamList = {
  Tabs: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  PhotoDetails: { entryId: string; photoIndex: number };
};

export type TabParamList = {
  Feed: undefined;
  Tags: undefined;
  Settings: undefined;
};
```

- [ ] **Step 3: Create placeholder `src/screens/SettingsScreen.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
```

- [ ] **Step 4: Create placeholder `src/screens/TagsScreen.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export function TagsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tags</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
```

- [ ] **Step 5: Create `src/navigation/TabNavigator.tsx`**

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from './types';
import { theme } from '../theme/theme';
import { FeedScreen } from '../screens/FeedScreen';
import { TagsScreen } from '../screens/TagsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<
  keyof TabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Feed: { active: 'list', inactive: 'list-outline' },
  Tags: { active: 'pricetag', inactive: 'pricetag-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.accentDark },
        headerTintColor: theme.colors.textOnDark,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'What Did I Eat' }} />
      <Tab.Screen name="Tags" component={TagsScreen} options={{ title: 'Tags' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 6: Update `src/navigation/RootNavigator.tsx`**

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { theme } from '../theme/theme';
import { TabNavigator } from './TabNavigator';
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
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
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

- [ ] **Step 7: Update `src/screens/FeedScreen.tsx`'s navigation type**

`FeedScreen` is now rendered inside `TabNavigator`, not directly in the root stack, but it still needs to navigate to root-stack-only routes (`NewEntry`, `GroupDetails`, `PhotoDetails`). Change the top of the file from:

```ts
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
...
type Nav = NativeStackNavigationProp<RootStackParamList, "Feed">;
```

to:

```ts
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { RootStackParamList, TabParamList } from "../navigation/types";
...
type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Feed">,
  NativeStackNavigationProp<RootStackParamList>
>;
```

No other changes needed in this file — `navigation.navigate("NewEntry")`/`"GroupDetails"`/`"PhotoDetails")` calls already used the root-stack route names and now type-check against the composite type.

- [ ] **Step 8: Fix the two `navigate('Feed')` calls in `src/screens/PhotoDetailsScreen.tsx`**

`'Feed'` is no longer a route in `RootStackParamList` (it now lives inside `Tabs`). Change both occurrences (in `confirmDelete`'s `onPress` and the "entry no longer exists" fallback `Button`) from:

```ts
navigation.navigate('Feed');
```

to:

```ts
navigation.navigate('Tabs');
```

(`Feed` is the tab navigator's first/default tab, so this lands on the same screen as before.)

- [ ] **Step 9: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 10: Commit**

```bash
rtk git add src/navigation/types.ts src/navigation/TabNavigator.tsx src/navigation/RootNavigator.tsx src/screens/FeedScreen.tsx src/screens/PhotoDetailsScreen.tsx src/screens/SettingsScreen.tsx src/screens/TagsScreen.tsx package.json package-lock.json
rtk git commit -m "feat: add bottom tab navigation shell (Feed/Tags/Settings)"
```

---

### Task 3: Settings screen (grouping mode, rolling-window slider, photo layout)

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `settings.groupingMode`, `settings.rollingWindowMinutes`, `settings.photoLayoutAlgorithm` (Task 1); `setGroupingMode`, `setRollingWindowMinutes`, `setPhotoLayoutAlgorithm` (Task 1); `SegmentedControl` (`src/components/SegmentedControl.tsx`, existing, unchanged).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Install the slider package**

Run (unprefixed): `npx expo install @react-native-community/slider`

- [ ] **Step 2: Replace `src/screens/SettingsScreen.tsx`'s body**

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setGroupingMode, setRollingWindowMinutes, setPhotoLayoutAlgorithm } from '../store/settingsSlice';
import { SegmentedControl } from '../components/SegmentedControl';
import { theme } from '../theme/theme';

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const groupingMode = useAppSelector((state) => state.settings.groupingMode);
  const rollingWindowMinutes = useAppSelector((state) => state.settings.rollingWindowMinutes);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Grouping</Text>
      <SegmentedControl
        value={groupingMode}
        options={[
          { value: 'rolling', label: 'Rolling window' },
          { value: 'day', label: 'Single day' },
        ]}
        onChange={(value) => dispatch(setGroupingMode(value))}
      />

      {groupingMode === 'rolling' ? (
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Window: {rollingWindowMinutes} min</Text>
          <Slider
            minimumValue={30}
            maximumValue={240}
            step={15}
            value={rollingWindowMinutes}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.muted}
            onSlidingComplete={(value) => dispatch(setRollingWindowMinutes(value))}
          />
        </View>
      ) : null}

      <Text style={[styles.label, styles.secondLabel]}>Photo layout</Text>
      <SegmentedControl
        value={photoLayoutAlgorithm}
        options={[
          { value: 'masonry', label: 'Columns' },
          { value: 'treemap', label: 'Mosaic' },
        ]}
        onChange={(value) => dispatch(setPhotoLayoutAlgorithm(value))}
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
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  secondLabel: {
    marginTop: theme.spacing.lg,
  },
  sliderRow: {
    marginTop: theme.spacing.md,
  },
  sliderLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
});
```

- [ ] **Step 3: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
rtk git add src/screens/SettingsScreen.tsx package.json package-lock.json
rtk git commit -m "feat: build out Settings screen with rolling-window slider"
```

---

### Task 4: Tag validation + `tagsSlice` + store wiring

**Files:**
- Create: `src/utils/tagLabel.ts`
- Create: `src/utils/tagLabel.test.ts`
- Create: `src/store/tagsSlice.ts`
- Create: `src/store/tagsSlice.test.ts`
- Modify: `src/store/store.ts`
- Modify: `src/store/rootState.ts`
- Modify: `src/store/selectors/groupSelectors.test.ts` (its `stateFrom` helper builds a full `RootState` literal and must include the new `tags` field)
- Modify: `src/types/models.ts` (adds `Tag`/`TagIcon`/`TAG_ICON_OPTIONS`, unrelated to the `Settings` edits from Task 1)

**Interfaces:**
- Produces: `isValidTagLabel(label: string): boolean`; `Tag = { id: string; icon: TagIcon; label: string }`; `TAG_ICON_OPTIONS: TagIcon[]` (10 curated Ionicons names); `TagsState = Record<string, Tag>`; `addTag(tag: Tag)`, `updateTag(tag: Tag)`, `deleteTag({ id: string })` action creators; `RootState.tags: TagsState`.
- Consumes: nothing new from Tasks 1-3.

- [ ] **Step 1: Write the failing tests**

`src/utils/tagLabel.test.ts`:

```ts
import { isValidTagLabel } from './tagLabel';

describe('isValidTagLabel', () => {
  it('rejects an empty label', () => {
    expect(isValidTagLabel('')).toBe(false);
  });

  it('rejects a whitespace-only label', () => {
    expect(isValidTagLabel('   ')).toBe(false);
  });

  it('accepts a single word', () => {
    expect(isValidTagLabel('Home')).toBe(true);
  });

  it('accepts up to three words', () => {
    expect(isValidTagLabel('Home cooked meal')).toBe(true);
  });

  it('rejects more than three words', () => {
    expect(isValidTagLabel('Home cooked meal today')).toBe(false);
  });
});
```

`src/store/tagsSlice.test.ts`:

```ts
import reducer, { addTag, updateTag, deleteTag } from './tagsSlice';
import { Tag } from '../types/models';

const sampleTag: Tag = { id: 't1', icon: 'restaurant-outline', label: 'Home cooked' };

describe('tagsSlice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({});
  });

  it('addTag stores the tag by id', () => {
    const state = reducer({}, addTag(sampleTag));
    expect(state).toEqual({ t1: sampleTag });
  });

  it('updateTag replaces the tag by id', () => {
    const initial = { t1: sampleTag };
    const updated: Tag = { id: 't1', icon: 'cafe-outline', label: 'Coffee run' };
    const state = reducer(initial, updateTag(updated));
    expect(state.t1).toEqual(updated);
  });

  it('updateTag is a no-op for an unknown id', () => {
    const initial = { t1: sampleTag };
    const state = reducer(initial, updateTag({ id: 'missing', icon: 'cafe-outline', label: 'x' }));
    expect(state).toEqual(initial);
  });

  it('deleteTag removes the tag by id', () => {
    const initial = { t1: sampleTag };
    const state = reducer(initial, deleteTag({ id: 't1' }));
    expect(state).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk jest src/utils/tagLabel.test.ts src/store/tagsSlice.test.ts`
Expected: FAIL (modules don't exist yet)

- [ ] **Step 3: Create `src/utils/tagLabel.ts`**

```ts
export function isValidTagLabel(label: string): boolean {
  const trimmed = label.trim();
  return trimmed.length > 0 && trimmed.split(/\s+/).length <= 3;
}
```

- [ ] **Step 4: Add `Tag`/`TagIcon`/`TAG_ICON_OPTIONS` to `src/types/models.ts`**

Add near the bottom of the file (after `Settings`):

```ts
import { Ionicons } from '@expo/vector-icons';

export const TAG_ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
  'restaurant-outline',
  'cafe-outline',
  'pizza-outline',
  'nutrition-outline',
  'ice-cream-outline',
  'wine-outline',
  'leaf-outline',
  'time-outline',
  'walk-outline',
  'moon-outline',
];

export type TagIcon = (typeof TAG_ICON_OPTIONS)[number];

export type Tag = {
  id: string;
  icon: TagIcon;
  label: string;
};
```

(Add the `import { Ionicons } from '@expo/vector-icons';` line at the top of the file, alongside no other existing imports — `models.ts` currently has none.)

- [ ] **Step 5: Create `src/store/tagsSlice.ts`**

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tag } from '../types/models';

export type TagsState = Record<string, Tag>;

const initialState: TagsState = {};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    addTag(state, action: PayloadAction<Tag>) {
      state[action.payload.id] = action.payload;
    },
    updateTag(state, action: PayloadAction<Tag>) {
      if (state[action.payload.id]) {
        state[action.payload.id] = action.payload;
      }
    },
    deleteTag(state, action: PayloadAction<{ id: string }>) {
      delete state[action.payload.id];
    },
  },
});

export const { addTag, updateTag, deleteTag } = tagsSlice.actions;
export default tagsSlice.reducer;
```

- [ ] **Step 6: Wire `tagsSlice` into the store**

`src/store/rootState.ts`:

```ts
import { EntriesState } from './entriesSlice';
import { TagsState } from './tagsSlice';
import { Settings } from '../types/models';

export type RootState = {
  entries: EntriesState;
  settings: Settings;
  tags: TagsState;
};
```

`src/store/store.ts`: add the import and reducer entry —

```ts
import tagsReducer from './tagsSlice';
```

```ts
const rootReducer = combineReducers({
  entries: entriesReducer,
  settings: settingsReducer,
  tags: tagsReducer,
});
```

- [ ] **Step 7: Fix `groupSelectors.test.ts`'s `stateFrom` helper**

`RootState` now requires `tags`. Update the helper's return statement:

```ts
function stateFrom(
  entries: Entry[],
  groupingMode: GroupingMode = 'rolling',
  rollingWindowMinutes = 60
): RootState {
  const entriesById = Object.fromEntries(entries.map((e) => [e.id, e]));
  return {
    entries: entriesById,
    settings: { groupingMode, rollingWindowMinutes, photoLayoutAlgorithm: 'treemap' },
    tags: {},
  };
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `rtk jest`
Expected: all suites PASS

- [ ] **Step 9: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 10: Commit**

```bash
rtk git add src/utils/tagLabel.ts src/utils/tagLabel.test.ts src/store/tagsSlice.ts src/store/tagsSlice.test.ts src/store/store.ts src/store/rootState.ts src/store/selectors/groupSelectors.test.ts src/types/models.ts
rtk git commit -m "feat: add tags data model, slice, and label validation"
```

---

### Task 5: `Entry.tagIds` + `updateEntryTags`

**Files:**
- Modify: `src/types/models.ts`
- Modify: `src/store/entriesSlice.ts`
- Modify: `src/store/entriesSlice.test.ts`

**Interfaces:**
- Produces: `Entry.tagIds?: string[]`; `updateEntryTags({ id: string; tagIds: string[] })` action creator.
- Consumes: nothing new from Tasks 1-4 (independent of the tags slice — `tagIds` is just `string[]`, entries don't reference `Tag` objects directly).

- [ ] **Step 1: Write the failing tests**

Add to `src/store/entriesSlice.test.ts` (after the existing `updateEntryComment` tests, before `deleteEntry`):

```ts
  it('updateEntryTags updates only the tag ids', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryTags({ id: 'e1', tagIds: ['t1', 't2'] }));
    expect(state.e1.tagIds).toEqual(['t1', 't2']);
    expect(state.e1.comment).toBe(sampleEntry.comment);
  });

  it('updateEntryTags is a no-op for an unknown id', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryTags({ id: 'missing', tagIds: ['t1'] }));
    expect(state).toEqual(initial);
  });
```

And update the import line at the top of the same file:

```ts
import reducer, { addEntry, updateEntryComment, updateEntryTags, deleteEntry } from './entriesSlice';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk jest src/store/entriesSlice.test.ts`
Expected: FAIL (`updateEntryTags` doesn't exist yet)

- [ ] **Step 3: Add `tagIds` to `Entry` in `src/types/models.ts`**

```ts
export type Entry = {
  id: string;
  createdAt: string; // ISO 8601
  comment: string;
  location: EntryLocation | null;
  photos: Photo[];
  tagIds?: string[];
};
```

- [ ] **Step 4: Add `updateEntryTags` to `src/store/entriesSlice.ts`**

```ts
    updateEntryTags(state, action: PayloadAction<{ id: string; tagIds: string[] }>) {
      const entry = state[action.payload.id];
      if (entry) {
        entry.tagIds = action.payload.tagIds;
      }
    },
```

(Add this reducer alongside `updateEntryComment`, and add `updateEntryTags` to the `export const { ... }` destructure at the bottom of the file.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `rtk jest src/store/entriesSlice.test.ts`
Expected: PASS

- [ ] **Step 6: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
rtk git add src/types/models.ts src/store/entriesSlice.ts src/store/entriesSlice.test.ts
rtk git commit -m "feat: add tagIds to Entry and an updateEntryTags action"
```

---

### Task 6: `TagChip` component + Tags screen (add/edit/delete)

**Files:**
- Create: `src/components/TagChip.tsx`
- Modify: `src/screens/TagsScreen.tsx`

**Interfaces:**
- Consumes: `Tag`, `TagIcon`, `TAG_ICON_OPTIONS` (Task 4); `addTag`, `updateTag`, `deleteTag` (Task 4); `isValidTagLabel` (Task 4); `generateId` (`src/utils/id.ts`, existing); `Card`, `IconButton`, `Button` (existing components).
- Produces: `TagChip({ icon: TagIcon; label: string; selected?: boolean; onPress?: () => void })` — a presentational pill, reused by Tasks 7 and 8.

- [ ] **Step 1: Create `src/components/TagChip.tsx`**

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagIcon } from '../types/models';
import { theme } from '../theme/theme';

type Props = {
  icon: TagIcon;
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TagChip({ icon, label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={selected ? theme.colors.textOnDark : theme.colors.text}
        style={styles.icon}
      />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  labelSelected: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Replace `src/screens/TagsScreen.tsx`'s body**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { addTag, updateTag, deleteTag } from '../store/tagsSlice';
import { generateId } from '../utils/id';
import { isValidTagLabel } from '../utils/tagLabel';
import { Tag, TagIcon, TAG_ICON_OPTIONS } from '../types/models';
import { Card } from '../components/Card';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/photoLayouts/Button';
import { theme } from '../theme/theme';

export function TagsScreen() {
  const dispatch = useAppDispatch();
  const tags = useAppSelector((state) => Object.values(state.tags));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftIcon, setDraftIcon] = useState<TagIcon | null>(null);
  const [draftLabel, setDraftLabel] = useState('');

  function startAdd() {
    setEditingId('new');
    setDraftIcon(null);
    setDraftLabel('');
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setDraftIcon(tag.icon);
    setDraftLabel(tag.label);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftIcon(null);
    setDraftLabel('');
  }

  function saveDraft() {
    if (!draftIcon || !isValidTagLabel(draftLabel)) return;
    const label = draftLabel.trim();
    if (editingId === 'new') {
      dispatch(addTag({ id: generateId(), icon: draftIcon, label }));
    } else if (editingId) {
      dispatch(updateTag({ id: editingId, icon: draftIcon, label }));
    }
    cancelEdit();
  }

  function confirmDelete(tag: Tag) {
    Alert.alert('Delete tag?', `"${tag.label}" will be removed from the tag list.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteTag({ id: tag.id })) },
    ]);
  }

  const isEditingForm = editingId !== null;

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={tags}
        keyExtractor={(tag) => tag.id}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <Text style={styles.label}>
              {editingId === 'new' ? 'Add a tag' : editingId ? 'Edit tag' : 'Tags'}
            </Text>
            {isEditingForm ? (
              <>
                <View style={styles.iconRow}>
                  {TAG_ICON_OPTIONS.map((icon) => (
                    <Pressable key={icon} onPress={() => setDraftIcon(icon)} style={styles.iconOption}>
                      <Ionicons
                        name={icon}
                        size={22}
                        color={draftIcon === icon ? theme.colors.primary : theme.colors.muted}
                      />
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Home cooked"
                  placeholderTextColor={theme.colors.muted}
                  value={draftLabel}
                  onChangeText={setDraftLabel}
                />
                <View style={styles.formButtons}>
                  <Button label="Cancel" variant="danger" onPress={cancelEdit} />
                  <Button
                    label="Save"
                    onPress={saveDraft}
                    disabled={!draftIcon || !isValidTagLabel(draftLabel)}
                  />
                </View>
              </>
            ) : (
              <Button label="Add tag" onPress={startAdd} />
            )}
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.tagRow}>
            <Ionicons name={item.icon} size={20} color={theme.colors.text} />
            <Text style={styles.tagRowLabel}>{item.label}</Text>
            <IconButton
              name="pencil-outline"
              onPress={() => startEdit(item)}
              color={theme.colors.muted}
              size={18}
            />
            <IconButton
              name="trash-outline"
              onPress={() => confirmDelete(item)}
              color={theme.colors.danger}
              size={18}
            />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tags yet — add your first one above.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  formCard: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  iconOption: {
    padding: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagRowLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  empty: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
```

- [ ] **Step 3: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
rtk git add src/components/TagChip.tsx src/screens/TagsScreen.tsx
rtk git commit -m "feat: build out Tags screen with add/edit/delete"
```

---

### Task 7: New Entry tag picker

**Files:**
- Modify: `src/screens/NewEntryScreen.tsx`

**Interfaces:**
- Consumes: `TagChip` (Task 6); `state.tags` (`TagsState`, Task 4); `Entry.tagIds` (Task 5).

- [ ] **Step 1: Add tag state and selection logic**

In `src/screens/NewEntryScreen.tsx`, update the `useAppDispatch`-only import to also bring in `useAppSelector`, and import `TagChip`:

```ts
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { TagChip } from '../components/TagChip';
```

Add state alongside the existing `createdAt`/picker state:

```ts
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const tags = useAppSelector((state) => Object.values(state.tags));

  function toggleTag(id: string) {
    setSelectedTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]
    );
  }
```

- [ ] **Step 2: Render the tag row and include `tagIds` on save**

Insert this block right after the date/time `Pressable`/picker block (before the comment `TextInput`):

```tsx
      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <TagChip
              key={tag.id}
              icon={tag.icon}
              label={tag.label}
              selected={selectedTagIds.includes(tag.id)}
              onPress={() => toggleTag(tag.id)}
            />
          ))}
        </View>
      ) : null}
```

Add the matching style:

```ts
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
```

Update `handleAdd`'s `addEntry` payload to include the selection:

```ts
        addEntry({
          id: generateId(),
          createdAt: createdAt.toISOString(),
          comment,
          location,
          photos,
          tagIds: selectedTagIds,
        })
```

- [ ] **Step 3: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
rtk git add src/screens/NewEntryScreen.tsx
rtk git commit -m "feat: pick tags on New Entry"
```

---

### Task 8: Photo Details — show and edit tags

**Files:**
- Modify: `src/screens/PhotoDetailsScreen.tsx`

**Interfaces:**
- Consumes: `TagChip` (Task 6); `updateEntryTags` (Task 5); `state.tags` (Task 4); `Tag` (Task 4).

- [ ] **Step 1: Import what's needed**

Update the top of `src/screens/PhotoDetailsScreen.tsx`:

```ts
import { updateEntryComment, updateEntryTags, deleteEntry } from '../store/entriesSlice';
import { Tag } from '../types/models';
import { TagChip } from '../components/TagChip';
```

- [ ] **Step 2: Track draft tag selection and resolve display tags in `PhotoDetailsFooter`**

Replace:

```ts
  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? '');

  if (!entry) {
    return null;
  }

  function saveComment() {
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    setIsEditing(false);
  }
```

with:

```ts
  const allTags = useAppSelector((state) => state.tags);
  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? '');
  const [draftTagIds, setDraftTagIds] = useState<string[]>(entry?.tagIds ?? []);

  if (!entry) {
    return null;
  }

  const resolvedTags = (entry.tagIds ?? [])
    .map((id) => allTags[id])
    .filter((tag): tag is Tag => Boolean(tag));

  function toggleDraftTag(id: string) {
    setDraftTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]
    );
  }

  function saveEdits() {
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    dispatch(updateEntryTags({ id: entry.id, tagIds: draftTagIds }));
    setIsEditing(false);
  }
```

- [ ] **Step 3: Render resolved tags (view mode) and a tag picker (edit mode)**

Insert a display row for the resolved tags right after the existing `location.placeName` line (still outside the `isEditing` conditional, since it's read-only display metadata):

```tsx
      {resolvedTags.length > 0 ? (
        <View style={styles.tagDisplayRow}>
          {resolvedTags.map((tag) => (
            <TagChip key={tag.id} icon={tag.icon} label={tag.label} />
          ))}
        </View>
      ) : null}
```

Inside the `isEditing ? (...)` branch, add a togglable tag row above the `TextInput`, and change the `Save` button's `onPress` and the `onPress={() => setIsEditing(true)}` line below it:

```tsx
      {isEditing ? (
        <View style={styles.editRow}>
          {Object.values(allTags).length > 0 ? (
            <View style={styles.tagDisplayRow}>
              {Object.values(allTags).map((tag) => (
                <TagChip
                  key={tag.id}
                  icon={tag.icon}
                  label={tag.label}
                  selected={draftTagIds.includes(tag.id)}
                  onPress={() => toggleDraftTag(tag.id)}
                />
              ))}
            </View>
          ) : null}
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
            <Button label="Save" onPress={saveEdits} />
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setIsEditing(true)}>
          <Text style={styles.comment}>{entry.comment || 'No comment — tap to add one'}</Text>
        </Pressable>
      )}
```

- [ ] **Step 4: Add the `tagDisplayRow` style**

Add alongside the other `styles` entries:

```ts
  tagDisplayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
```

- [ ] **Step 5: Type-check**

Run: `rtk tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Run the full test suite**

Run: `rtk jest`
Expected: all suites PASS

- [ ] **Step 7: Commit**

```bash
rtk git add src/screens/PhotoDetailsScreen.tsx
rtk git commit -m "feat: show and edit tags on Photo Details"
```
