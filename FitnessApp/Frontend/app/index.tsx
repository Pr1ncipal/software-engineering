import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import components
import WorkoutForm from '@/components/WorkoutForm';
import RegisterForm from '@/components/RegisterForm';
import OnboardingScreen from '@/components/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface MainTabsProps {
  onLogin: () => void;
  isLoggedIn: boolean;
}

function MainTabs({ onLogin, isLoggedIn }: MainTabsProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Register') {
            return (
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={size}
                color={color}
              />
            );
          } else if (route.name === 'Workout') {
            return (
              <Ionicons
                name={focused ? 'barbell' : 'barbell-outline'}
                size={size}
                color={color}
              />
            );
          }
          return null;
        },
        tabBarActiveTintColor: '#f4511e',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
      })}
    >
      {!isLoggedIn && (
        <Tab.Screen name="Register">
          {() => <RegisterForm onLogin={onLogin} />}
        </Tab.Screen>
      )}
      {isLoggedIn && <Tab.Screen name="Workout" component={WorkoutForm} />}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
        headerShown: false, // Hide default headers
        transitionSpec: {
          open: {
            animation: 'timing',
            config: { duration: 700 }, // Adjust fade speed (default ~400ms)
          },
          close: {
            animation: 'timing',
            config: { duration: 700 }, // Adjust fade-out speed
          },
        },
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid, // Fade effect
      }}
    >
      {!isOnboardingComplete ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={() => setIsOnboardingComplete(true)} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="MainTabs">
          {() => <MainTabs onLogin={() => setIsLoggedIn(true)} isLoggedIn={isLoggedIn} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
