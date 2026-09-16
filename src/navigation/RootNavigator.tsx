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
