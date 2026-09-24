import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TabParamList } from "./types";
import { theme } from "../theme/theme";
import { FeedScreen } from "../screens/FeedScreen";
import { TagsScreen } from "../screens/TagsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<
  keyof TabParamList,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  Feed: { active: "list", inactive: "list-outline" },
  Tags: { active: "pricetag", inactive: "pricetag-outline" },
  Settings: { active: "settings", inactive: "settings-outline" },
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
            name={
              focused
                ? TAB_ICONS[route.name].active
                : TAB_ICONS[route.name].inactive
            }
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: "What did I eat?",
          tabBarLabel: "Feed",
        }}
      />
      <Tab.Screen
        name="Tags"
        component={TagsScreen}
        options={{ title: "Let's organize a bit", tabBarLabel: "Tags" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
}
