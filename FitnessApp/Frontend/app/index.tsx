import React, { useState, useEffect } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { secureStorage, AUTH_TOKEN_KEY } from '@/utils/secureStorage';

import RegisterForm from '@/components/RegisterForm';
import OnboardingScreen from '@/components/OnboardingScreen';
import Login from '@/components/Login';
import BottomTabsNavigator from '@/components/BottomTabsNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if user is logged in on startup
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      setIsLoggedIn(!!token);
    };
    
    checkLoginStatus();
  }, []);

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
        <Stack.Screen
          name="Onboarding"
          children={() => (
            <OnboardingScreen onComplete={() => setIsOnboardingComplete(true)} />
          )}
        />
      ) : isLoggedIn ? (
        <Stack.Screen name="MainTabs" component={BottomTabsNavigator} />
      ) : (
        <>
          <Stack.Screen
            name="Login"
            children={() => <Login onLogin={() => setIsLoggedIn(true)} />}
          />
          <Stack.Screen
            name="RegisterForm"
            children={() => <RegisterForm onLogin={() => setIsLoggedIn(true)} />}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
