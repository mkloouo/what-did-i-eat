import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { theme } from "../theme/theme";
import { TabNavigator } from "./TabNavigator";
import { NewEntryScreen } from "../screens/NewEntryScreen";
import { GroupDetailsScreen } from "../screens/GroupDetailsScreen";
import { EntryDetailsScreen } from "../screens/EntryDetailsScreen";
import { PhotoDetailsScreen } from "../screens/PhotoDetailsScreen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addTag } from "../store/tagsSlice";
import { markDefaultTagsSeeded } from "../store/appMetaSlice";
import { DEFAULT_TAGS } from "../data/defaultTags";
import { generateId } from "../utils/id";
import { StatusBar } from "expo-status-bar";

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
  StatusBar.setStyle("light");

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.accentDark },
        headerTintColor: theme.colors.textOnDark,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewEntry"
        component={NewEntryScreen}
        options={{ title: "New Entry" }}
      />
      <Stack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="EntryDetails"
        component={EntryDetailsScreen}
        options={{ title: "Entry" }}
      />
      <Stack.Screen
        name="PhotoDetails"
        component={PhotoDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
