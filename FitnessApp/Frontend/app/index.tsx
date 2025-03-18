import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import your components
import WorkoutForm from '@/components/WorkoutForm';
import RegisterForm from '@/components/RegisterForm';
import App from '@/components/loginApp';
import Chatbot from '@/components/chatbot';  // Import Chatbot

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
            } else if (route.name === 'Login') {
              return <Ionicons 
                name={focused ? 'log-in' : 'log-in-outline'} 
                size={size} 
                color={color} 
              />;
            } else if (route.name === 'Chatbot') {
              return <Ionicons 
                name={focused ? 'chatbubble' : 'chatbubble-outline'} 
                size={size} 
                color={color} 
              />;
            }
          },
          tabBarActiveTintColor: '#f4511e',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
        })}
      >
        <Tab.Screen name="Register" component={RegisterForm} />
        <Tab.Screen name="Workout" component={WorkoutForm} />
        <Tab.Screen name="Login" component={App} />
        <Tab.Screen name="Chatbot" component={Chatbot} />
      </Tab.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
