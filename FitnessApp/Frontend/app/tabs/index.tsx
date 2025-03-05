import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WorkoutForm from '@/components/WorkoutForm';  // Import WorkoutForm
import { Link } from 'expo-router';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';


const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'Register') {
              return <Ionicons 
                name={focused ? 'person-circle' : 'person-circle-outline'} 
                size={size} 
                color={color} 
              />;
            } else if (route.name === 'Workout') {
              return <Ionicons 
                name={focused ? 'barbell' : 'barbell-outline'} 
                size={size} 
                color={color} 
              />;
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
        <Tab.Screen name="Workout" component={WorkoutForm} />
      </Tab.Navigator>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: "#ffffff"
  },
  text: {
    color: "black"
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#000000"
  },
});
