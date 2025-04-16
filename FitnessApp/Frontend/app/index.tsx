import React, { useState } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

import RegisterForm from '@/components/RegisterForm';
import OnboardingScreen from '@/components/OnboardingScreen';
import Login from '@/components/Login';
import BottomTabsNavigator from '@/components/BottomTabsNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
        headerShown: false,
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 700 } },
          close: { animation: 'timing', config: { duration: 700 } },
        },
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
      }}
    >
      {!isOnboardingComplete && (
        <Stack.Screen
          name="Onboarding"
          children={() => (
            <OnboardingScreen onComplete={() => setIsOnboardingComplete(true)} />
          )}
        />
      )}

      {isOnboardingComplete && !isLoggedIn && (
        <Stack.Screen
          name="Login"
          children={() => <Login onLogin={() => setIsLoggedIn(true)} />}
        />
      )}

      {isOnboardingComplete && !isLoggedIn && (
        <Stack.Screen
          name="RegisterForm"
          children={() => <RegisterForm onLogin={() => setIsLoggedIn(true)} />}
        />
      )}

      {isOnboardingComplete && isLoggedIn && (
        <Stack.Screen name="MainTabs" component={BottomTabsNavigator} />
      )}
    </Stack.Navigator>
  );
}
