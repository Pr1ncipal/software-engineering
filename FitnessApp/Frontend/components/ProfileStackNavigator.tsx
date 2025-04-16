// File: components/ProfileStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ProfilePage from '@/components/ProfilePage';
import StepsCalendar from '@/components/steps';

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilePage" component={ProfilePage} />
      <Stack.Screen name="Steps" component={StepsCalendar} />
    </Stack.Navigator>
  );
}
