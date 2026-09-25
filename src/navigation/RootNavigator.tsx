import { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { theme } from "../theme/theme";
import { HomeScreen } from "../screens/HomeScreen";
import { NewEntryScreen } from "../screens/NewEntryScreen";
import { EntryDetailsScreen } from "../screens/EntryDetailsScreen";
import { PhotoDetailsScreen } from "../screens/PhotoDetailsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TagsScreen } from "../screens/TagsScreen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addTag } from "../store/tagsSlice";
import { markDefaultTagsSeeded } from "../store/appMetaSlice";
import { DEFAULT_TAGS } from "../data/defaultTags";
import { generateId } from "../utils/id";

const Stack = createNativeStackNavigator<RootStackParamList>();

function useSeedDefaultTags() {
  const dispatch = useAppDispatch();
  const hasSeededDefaultTags = useAppSelector(
    (state) => state.appMeta.hasSeededDefaultTags,
  );

  useEffect(() => {
    if (hasSeededDefaultTags) return;
    DEFAULT_TAGS.forEach((tag) =>
      dispatch(addTag({ id: generateId(), ...tag })),
    );
    dispatch(markDefaultTagsSeeded());
  }, [hasSeededDefaultTags, dispatch]);
}

export function RootNavigator() {
  useSeedDefaultTags();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.daylight },
        headerTintColor: theme.colors.ink,
        contentStyle: { backgroundColor: theme.colors.daylight },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewEntry"
        component={NewEntryScreen}
        options={{ title: "New Entry" }}
      />
      <Stack.Screen
        name="EntryDetails"
        component={EntryDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PhotoDetails"
        component={PhotoDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="Tags"
        component={TagsScreen}
        options={{ title: "Tags" }}
      />
    </Stack.Navigator>
  );
}
