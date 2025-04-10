// File: components/ProfileStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ProfilePage from '@/components/ProfilePage';
import AllActivities from '@/components/AllActivities';

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilePage" component={ProfilePage} />
      <Stack.Screen name="AllActivities" component={AllActivities} />
    </Stack.Navigator>
  );
}
