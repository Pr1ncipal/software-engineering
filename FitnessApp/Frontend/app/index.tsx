import React, { useState } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

// Import screens
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
      {!isOnboardingComplete ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={() => setIsOnboardingComplete(true)} />}
        </Stack.Screen>
      ) : !isLoggedIn ? (
        <>
          <Stack.Screen name="Login">
            {() => <Login onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
          <Stack.Screen name="RegisterForm">
            {() => <RegisterForm onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen name="MainTabs" component={BottomTabsNavigator} />
      )}
    </Stack.Navigator>
  );
}
